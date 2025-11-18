"use server"

import { createDonation, type DonationInput } from "./donations"
import { createYooKassaPayment, detectPaymentProvider } from "@/lib/yookassa"
import { createClient } from "@/lib/supabase/server"

export type PaymentInitiateInput = DonationInput & {
  returnUrl?: string
  cancelUrl?: string
  provider?: "yookassa" | "cloudpayments" | "auto" // auto - автоматический выбор
  cardBin?: string // BIN карты для определения провайдера
}

function validatePaymentInput(input: PaymentInitiateInput): string | null {
  // Validate returnUrl format if provided
  if (input.returnUrl) {
    try {
      const url = new URL(input.returnUrl)
      if (!url.protocol.startsWith("http")) {
        return "Return URL должен использовать протокол HTTP или HTTPS"
      }
    } catch {
      return "Неверный формат Return URL"
    }
  }

  // Validate cancelUrl format if provided
  if (input.cancelUrl) {
    try {
      const url = new URL(input.cancelUrl)
      if (!url.protocol.startsWith("http")) {
        return "Cancel URL должен использовать протокол HTTP или HTTPS"
      }
    } catch {
      return "Неверный формат Cancel URL"
    }
  }

  return null
}

export async function initiatePayment(input: PaymentInitiateInput) {
  // Validate payment input
  const validationError = validatePaymentInput(input)
  if (validationError) {
    return { error: validationError }
  }

  try {
    // Сначала создаем запись о пожертвовании
    const donationResult = await createDonation(input)

    if (donationResult.error || !donationResult.donation) {
      return { error: donationResult.error || "Не удалось создать пожертвование. Попробуйте снова." }
    }

    // Определяем провайдера платежей
    let provider: "yookassa" | "cloudpayments"
    if (input.provider && input.provider !== "auto") {
      provider = input.provider
    } else {
      // Автоматический выбор на основе валюты и BIN карты
      provider = detectPaymentProvider(input.currency, input.cardBin)
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = input.returnUrl || `${baseUrl}/payment/success?donation_id=${donationResult.donation.id}`
    const cancelUrl = input.cancelUrl || `${baseUrl}/payment/cancel`

    let paymentUrl: string | undefined

    // Создаем платеж через выбранного провайдера
    if (provider === "yookassa") {
      // Проверяем наличие credentials
      const shopId = process.env.YOOKASSA_SHOP_ID
      const secretKey = process.env.YOOKASSA_SECRET_KEY

      if (!shopId || !secretKey) {
        // Если YooKassa не настроен, используем CloudPayments как fallback
        console.warn("[Payment] YooKassa not configured, falling back to CloudPayments")
        provider = "cloudpayments"
      } else {
        // Создаем платеж через YooKassa
        const yooKassaPayment = await createYooKassaPayment({
          shopId,
          secretKey,
          amount: input.amount,
          currency: input.currency,
          description: `Пожертвование - ${input.category === "sadaqah" ? "Садака" : input.category === "zakat" ? "Закят" : "Общее"}`,
          returnUrl,
          cancelUrl,
          metadata: {
            donationId: donationResult.donation.id,
            donation_type: input.donationType,
            category: input.category,
          },
        })

        paymentUrl = yooKassaPayment.confirmation.confirmation_url

        // Обновляем donation с информацией о провайдере
        const supabase = await createClient()
        await supabase
          .from("donations")
          .update({
            payment_provider: "yookassa",
            payment_transaction_id: yooKassaPayment.id,
          })
          .eq("id", donationResult.donation.id)
      }
    }

    // Если не YooKassa или fallback, используем CloudPayments
    if (provider === "cloudpayments" || !paymentUrl) {
      // Проверяем наличие внешнего API или используем прямую интеграцию
      const paymentApiUrl = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL

      if (paymentApiUrl) {
        // Используем внешний API для CloudPayments
        const response = await fetch(`${paymentApiUrl}/api/payments/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.PAYMENT_API_TOKEN && {
              Authorization: `Bearer ${process.env.PAYMENT_API_TOKEN}`,
            }),
          },
          body: JSON.stringify({
            donation_id: donationResult.donation.id,
            amount: input.amount,
            currency: input.currency,
            donation_type: input.donationType,
            frequency: input.frequency,
            category: input.category,
            fund_id: input.fundId,
            campaign_id: input.campaignId,
            message: input.message,
            is_anonymous: input.isAnonymous,
            invoice_id: JSON.stringify({ donationId: donationResult.donation.id }),
            return_url: returnUrl,
            cancel_url: cancelUrl,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[Payment] API error:", response.status, errorText)
          return { error: "Не удалось инициировать платёж. Попробуйте снова или обратитесь в поддержку." }
        }

        const data = await response.json()
        paymentUrl = data.payment_url || data.url || data.link
      } else {
        // Если нет внешнего API, возвращаем ошибку
        return { error: "Сервис оплаты временно недоступен. Пожалуйста, попробуйте позже." }
      }
    }

    if (!paymentUrl) {
      console.error("[Payment] No payment URL received")
      return { error: "Не удалось получить ссылку на оплату. Попробуйте снова." }
    }

    return { success: true, paymentUrl, donationId: donationResult.donation.id, provider }
  } catch (error) {
    console.error("[Payment] Unexpected error:", error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Произошла ошибка при инициализации платежа. Проверьте интернет-соединение и попробуйте снова."
    return { error: errorMessage }
  }
}

