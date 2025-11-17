import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import crypto from "crypto"

interface CloudPaymentsWebhookData {
  Model?: {
    TransactionId?: number
    InvoiceId?: string
    Amount?: number
    Currency?: string
    RecurringId?: string
    Status?: string
    Reason?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Webhook для обработки уведомлений от CloudPayments
 * Поддерживает:
 * - Одноразовые платежи (PaymentSucceeded, PaymentFailed)
 * - Регулярные платежи (RecurringPaymentSucceeded, RecurringPaymentFailed)
 * - Возвраты (RefundSucceeded)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-content-hmac") || ""

    // Verify signature if secret is configured
    const secret = process.env.CLOUDPAYMENTS_API_SECRET
    if (secret) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("base64")

      if (signature !== expectedSignature) {
        console.error("[CloudPayments] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    let data: CloudPaymentsWebhookData
    try {
      data = JSON.parse(body) as CloudPaymentsWebhookData
    } catch (parseError) {
      console.error("[CloudPayments] Invalid JSON body:", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    // Validate required fields
    if (!data.Model) {
      console.error("[CloudPayments] Missing Model in request body")
      return NextResponse.json({ error: "Missing Model field" }, { status: 400 })
    }

    // Validate transaction ID
    if (!data.Model.TransactionId) {
      console.error("[CloudPayments] Missing TransactionId")
      return NextResponse.json({ error: "Missing TransactionId" }, { status: 400 })
    }

    // Validate InvoiceId
    if (!data.Model.InvoiceId) {
      console.error("[CloudPayments] Missing InvoiceId")
      return NextResponse.json({ error: "Missing InvoiceId" }, { status: 400 })
    }

    // Handle different event types
    switch (data.Model?.Status) {
      case "Completed":
      case "Authorized":
        await handlePaymentSuccess(data)
        break
      case "Declined":
      case "Cancelled":
        await handlePaymentFailed(data)
        break
      default:
        console.log("[CloudPayments] Unhandled status:", data.Model?.Status)
    }

    // Handle recurring payment events
    if (data.Model?.RecurringId) {
      await handleRecurringPayment(data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const apiError = handleApiError(error)
    // Для webhooks важно вернуть 200, чтобы провайдер не повторял запрос
    // Но логируем ошибку для мониторинга
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 200 })
  }
}

/**
 * Обработать успешный платеж
 */
async function handlePaymentSuccess(data: CloudPaymentsWebhookData) {
  const supabase = await createClient()
  const transactionId = data.Model?.TransactionId
  const invoiceId = data.Model?.InvoiceId

  if (!transactionId || !invoiceId) {
    console.warn("[CloudPayments] Missing transaction or invoice ID")
    return
  }

  try {
    // Parse invoice data to get donation/subscription info
    let invoiceData: Record<string, unknown> = {}
    try {
      invoiceData = JSON.parse(invoiceId)
    } catch {
      // If not JSON, treat as simple ID
      invoiceData = { id: invoiceId }
    }

    // Update donation status if it's a donation
    if (invoiceData.donationId) {
      // First, get the donation to check if it's already completed
      const { data: existingDonation, error: donationFetchError } = await supabase
        .from("donations")
        .select("campaign_id, fund_id, amount, donor_id, status, is_anonymous")
        .eq("id", invoiceData.donationId)
        .single()

      if (donationFetchError || !existingDonation) {
        console.warn("[CloudPayments] Donation not found or error:", invoiceData.donationId, donationFetchError)
        return
      }

      // Only update if status is pending (prevent double processing)
      if (existingDonation.status === "pending") {
        const { error: donationError } = await supabase
          .from("donations")
          .update({
            status: "completed",
            payment_transaction_id: transactionId.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceData.donationId)
          .eq("status", "pending")

        if (donationError) {
          console.error("[CloudPayments] Donation update error:", donationError)
        } else {
          // Update user's total donated amount
          const { error: profileError } = await supabase.rpc("increment_total_donated", {
            user_id: existingDonation.donor_id,
            amount: existingDonation.amount,
          })
          if (profileError) {
            console.error("[CloudPayments] Profile update error:", profileError)
          }

          // Update campaign/fund amounts via RPC
          if (existingDonation.campaign_id) {
            const { error: campaignError } = await supabase.rpc("increment_campaign_amount", {
              campaign_id: existingDonation.campaign_id,
              amount: existingDonation.amount,
            })
            if (campaignError) {
              console.error("[CloudPayments] Campaign update error:", campaignError)
            } else {
              // Send notification to campaign creator
              try {
                const { data: donorProfile } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("id", existingDonation.donor_id)
                  .single()

                const donorName = donorProfile?.display_name || "Пользователь"

                const { notifyCampaignCreator } = await import("@/lib/notifications")
                await notifyCampaignCreator(existingDonation.campaign_id, {
                  amount: existingDonation.amount,
                  currency: data.Model?.Currency || "RUB",
                  donorName: existingDonation.is_anonymous ? undefined : donorName,
                  isAnonymous: existingDonation.is_anonymous,
                })
              } catch (notificationError) {
                console.error("[CloudPayments] Failed to send campaign notification:", notificationError)
              }
            }
          }
          if (existingDonation.fund_id) {
            const { error: fundError } = await supabase.rpc("increment_fund_amount", {
              fund_id: existingDonation.fund_id,
              amount: existingDonation.amount,
            })
            if (fundError) {
              console.error("[CloudPayments] Fund update error:", fundError)
            }
          }

          // Send confirmation email to donor
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", existingDonation.donor_id)
              .single()

            if (profile?.email) {
              let fundName: string | undefined
              let campaignName: string | undefined

              if (existingDonation.fund_id) {
                const { data: fund } = await supabase
                  .from("funds")
                  .select("name, name_ru")
                  .eq("id", existingDonation.fund_id)
                  .single()
                fundName = fund?.name_ru || fund?.name
              }

              if (existingDonation.campaign_id) {
                const { data: campaign } = await supabase
                  .from("campaigns")
                  .select("title")
                  .eq("id", existingDonation.campaign_id)
                  .single()
                campaignName = campaign?.title
              }

              const { sendEmail, getDonationConfirmationEmail } = await import("@/lib/email")
              await sendEmail({
                to: profile.email,
                subject: "Подтверждение пожертвования",
                html: getDonationConfirmationEmail({
                  amount: existingDonation.amount,
                  currency: data.Model?.Currency || "RUB",
                  fundName,
                  campaignName,
                  isAnonymous: existingDonation.is_anonymous,
                }),
              })
            }
          } catch (emailError) {
            console.error("[CloudPayments] Failed to send confirmation email:", emailError)
          }
        }
      } else {
        console.log("[CloudPayments] Donation already processed:", invoiceData.donationId, existingDonation.status)
      }
    }

    // Handle subscription payment
    if (invoiceData.subscription && invoiceData.subscriptionId) {
      await handleSubscriptionPayment(invoiceData.subscriptionId, data.Model)
    }
  } catch (error) {
    console.error("[CloudPayments] Payment success handling error:", error)
  }
}

/**
 * Обработать неудачный платеж
 */
async function handlePaymentFailed(data: CloudPaymentsWebhookData) {
  const supabase = await createClient()
  const transactionId = data.Model?.TransactionId
  const invoiceId = data.Model?.InvoiceId

  if (!transactionId || !invoiceId) return

  try {
    let invoiceData: Record<string, unknown> = {}
    try {
      invoiceData = JSON.parse(invoiceId)
    } catch {
      invoiceData = { id: invoiceId }
    }

    // Update donation status
    if (invoiceData.donationId) {
      await supabase
        .from("donations")
        .update({
          status: "failed",
          payment_transaction_id: transactionId.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceData.donationId)
        .eq("status", "pending")
    }

    // Handle subscription payment failure
    if (invoiceData.subscription && invoiceData.subscriptionId) {
      await handleSubscriptionPaymentFailure(invoiceData.subscriptionId, data.Model)
    }
  } catch (error) {
    console.error("[CloudPayments] Payment failure handling error:", error)
  }
}

/**
 * Обработать регулярный платеж
 */
async function handleRecurringPayment(data: CloudPaymentsWebhookData) {
  const supabase = await createClient()
  const recurringId = data.Model?.RecurringId
  const transactionId = data.Model?.TransactionId

  if (!recurringId) return

  try {
    // Find subscription by recurring ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("recurring_id", recurringId.toString())
      .eq("status", "active")
      .single()

    if (!subscription) {
      console.warn("[CloudPayments] Subscription not found for recurring ID:", recurringId)
      return
    }

    if (data.Model?.Status === "Completed" || data.Model?.Status === "Authorized") {
      // Create donation record for subscription payment
      const { data: donation } = await supabase
        .from("donations")
        .insert({
          donor_id: subscription.user_id,
          amount: subscription.amount,
          currency: subscription.currency,
          donation_type: "recurring",
          recurring_frequency: subscription.billing_frequency,
          status: "completed",
          payment_transaction_id: transactionId?.toString(),
        })
        .select()
        .single()

      if (donation) {
        // Update subscription next billing date
        const nextBillingDate = new Date()
        if (subscription.billing_frequency === "monthly") {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        } else {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        }

        await supabase
          .from("subscriptions")
          .update({
            next_billing_date: nextBillingDate.toISOString(),
            last_payment_date: new Date().toISOString(),
            last_payment_transaction_id: transactionId?.toString(),
          })
          .eq("id", subscription.id)
      }
    } else if (data.Model?.Status === "Declined" || data.Model?.Status === "Cancelled") {
      // Handle failed recurring payment
      await handleSubscriptionPaymentFailure(subscription.id, data.Model)
    }
  } catch (error) {
    console.error("[CloudPayments] Recurring payment handling error:", error)
  }
}

/**
 * Обработать платеж по подписке
 */
async function handleSubscriptionPayment(subscriptionId: string, paymentData: CloudPaymentsWebhookData) {
  const supabase = await createClient()

  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (!subscription) return

    // Update next billing date
    const nextBillingDate = new Date()
    if (subscription.billing_frequency === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    }

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
        last_payment_date: new Date().toISOString(),
        last_payment_transaction_id: paymentData.TransactionId?.toString(),
        recurring_id: paymentData.RecurringId?.toString() || subscription.recurring_id,
      })
      .eq("id", subscriptionId)
  } catch (error) {
    console.error("[CloudPayments] Subscription payment handling error:", error)
  }
}

/**
 * Обработать неудачный платеж по подписке
 */
async function handleSubscriptionPaymentFailure(subscriptionId: string, paymentData: CloudPaymentsWebhookData) {
  const supabase = await createClient()

  try {
    // Update subscription status (could be paused or cancelled based on policy)
    // For now, we'll just log the failure
    await supabase
      .from("subscriptions")
      .update({
        last_payment_failed_at: new Date().toISOString(),
        last_payment_failure_reason: paymentData.Reason || "Payment failed",
      })
      .eq("id", subscriptionId)

    // Optionally pause subscription after multiple failures
    // This would require tracking failure count
  } catch (error) {
    console.error("[CloudPayments] Subscription payment failure handling error:", error)
  }
}

