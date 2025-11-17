import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyYooKassaSignature } from "@/lib/yookassa"
import { handleApiError } from "@/lib/error-handler"
import crypto from "crypto"

/**
 * Webhook для обработки уведомлений от YooKassa
 * Поддерживает:
 * - payment.succeeded - успешный платеж
 * - payment.canceled - отмененный платеж
 * - refund.succeeded - успешный возврат
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-yookassa-signature") || ""

    // Verify signature
    const secretKey = process.env.YOOKASSA_SECRET_KEY
    if (!secretKey) {
      const apiError = handleApiError(new Error("YOOKASSA_SECRET_KEY not configured"))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    if (!verifyYooKassaSignature(body, signature, secretKey)) {
      console.error("[YooKassa] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    interface YooKassaWebhookData {
      type: string
      event: string
      object?: {
        id?: string
        status?: string
        amount?: { value: string; currency: string }
        metadata?: Record<string, string>
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    
    let data: YooKassaWebhookData
    try {
      data = JSON.parse(body)
    } catch (parseError) {
      console.error("[YooKassa] Invalid JSON body:", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const event = data.event
    const payment = data.object

    if (!event || !payment) {
      console.error("[YooKassa] Missing event or object in request")
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const supabase = await createClient()

    // Extract donation ID from metadata
    const donationId = payment.metadata?.donationId || payment.metadata?.donation_id

    if (!donationId) {
      console.error("[YooKassa] Missing donationId in metadata")
      return NextResponse.json({ error: "Missing donationId" }, { status: 400 })
    }

    // Handle different event types
    switch (event) {
      case "payment.succeeded": {
        // Get existing donation
        const { data: existingDonation, error: donationFetchError } = await supabase
          .from("donations")
          .select("campaign_id, fund_id, amount, donor_id, status, is_anonymous")
          .eq("id", donationId)
          .single()

        if (donationFetchError || !existingDonation) {
          const apiError = handleApiError(donationFetchError || new Error("Donation not found"))
          return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
        }

        // Only update if status is pending (prevent double processing)
        if (existingDonation.status === "pending") {
          const { error: donationError } = await supabase
            .from("donations")
            .update({
              status: "completed",
              payment_provider: "yookassa",
              payment_transaction_id: payment.id,
              paid_at: new Date().toISOString(),
            })
            .eq("id", donationId)

          if (donationError) {
            const apiError = handleApiError(donationError)
            return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
          }

          // Update campaign or fund amounts
          if (existingDonation.campaign_id) {
            await supabase.rpc("increment_campaign_amount", {
              campaign_id: existingDonation.campaign_id,
              amount: Number(existingDonation.amount),
            })
          }

          if (existingDonation.fund_id) {
            await supabase.rpc("increment_fund_amount", {
              fund_id: existingDonation.fund_id,
              amount: Number(existingDonation.amount),
            })
          }
        }

        return NextResponse.json({ received: true })
      }

      case "payment.canceled": {
        // Update donation status to failed
        await supabase
          .from("donations")
          .update({
            status: "failed",
            payment_provider: "yookassa",
            payment_transaction_id: payment.id,
          })
          .eq("id", donationId)

        return NextResponse.json({ received: true })
      }

      case "refund.succeeded": {
        // Handle refund - update donation status
        await supabase
          .from("donations")
          .update({
            status: "refunded",
            payment_provider: "yookassa",
          })
          .eq("id", donationId)

        return NextResponse.json({ received: true })
      }

      default:
        console.log(`[YooKassa] Unhandled event type: ${event}`)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    const apiError = handleApiError(error)
    // Для webhooks важно вернуть 200, чтобы провайдер не повторял запрос
    // Но логируем ошибку для мониторинга
    return NextResponse.json({ error: "Internal server error" }, { status: 200 })
  }
}

