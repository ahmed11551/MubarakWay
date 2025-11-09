import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

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

    const data = JSON.parse(body)

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
    console.error("[CloudPayments] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

/**
 * Обработать успешный платеж
 */
async function handlePaymentSuccess(data: any) {
  const supabase = await createClient()
  const transactionId = data.Model?.TransactionId
  const invoiceId = data.Model?.InvoiceId

  if (!transactionId || !invoiceId) {
    console.warn("[CloudPayments] Missing transaction or invoice ID")
    return
  }

  try {
    // Parse invoice data to get donation/subscription info
    let invoiceData: any = {}
    try {
      invoiceData = JSON.parse(invoiceId)
    } catch {
      // If not JSON, treat as simple ID
      invoiceData = { id: invoiceId }
    }

    // Update donation status if it's a donation
    if (invoiceData.donationId) {
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
        // Update campaign/fund amounts via RPC
        const { data: donation } = await supabase
          .from("donations")
          .select("campaign_id, fund_id, amount")
          .eq("id", invoiceData.donationId)
          .single()

        if (donation) {
          if (donation.campaign_id) {
            await supabase.rpc("increment_campaign_amount", {
              campaign_id: donation.campaign_id,
              amount: donation.amount,
            })
          }
          if (donation.fund_id) {
            await supabase.rpc("increment_fund_amount", {
              fund_id: donation.fund_id,
              amount: donation.amount,
            })
          }
        }
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
async function handlePaymentFailed(data: any) {
  const supabase = await createClient()
  const transactionId = data.Model?.TransactionId
  const invoiceId = data.Model?.InvoiceId

  if (!transactionId || !invoiceId) return

  try {
    let invoiceData: any = {}
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
async function handleRecurringPayment(data: any) {
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
async function handleSubscriptionPayment(subscriptionId: string, paymentData: any) {
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
async function handleSubscriptionPaymentFailure(subscriptionId: string, paymentData: any) {
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

