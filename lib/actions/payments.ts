"use server"

import { createDonation, type DonationInput } from "./donations"

export type PaymentInitiateInput = DonationInput & {
  returnUrl?: string
  cancelUrl?: string
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
      return { error: donationResult.error || "Failed to create donation" }
    }

    // Получаем URL API для создания платежа из переменных окружения
    const paymentApiUrl = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL

    if (!paymentApiUrl) {
      return { error: "Payment API URL is not configured" }
    }

    // Вызываем их API для создания платежа
    const response = await fetch(`${paymentApiUrl}/api/payments/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Если нужен токен авторизации
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
        // Pass donationId in InvoiceId format expected by webhook
        invoice_id: JSON.stringify({ donationId: donationResult.donation.id }),
        return_url: input.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/success?donation_id=${donationResult.donation.id}`,
        cancel_url: input.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/cancel`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Payment] API error:", response.status, errorText)
      return { error: `Failed to initiate payment: ${response.statusText}` }
    }

    const data = await response.json()

    // Ожидаем, что API вернет объект с полем payment_url или url
    const paymentUrl = data.payment_url || data.url || data.link

    if (!paymentUrl) {
      console.error("[Payment] No payment URL in response:", data)
      return { error: "Payment URL not received from API" }
    }

    return { success: true, paymentUrl, donationId: donationResult.donation.id }
  } catch (error) {
    console.error("[Payment] Unexpected error:", error)
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" }
  }
}

