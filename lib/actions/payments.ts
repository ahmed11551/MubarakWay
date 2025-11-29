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

export type PaymentResult = {
  success: boolean
  paymentUrl?: string
  donationId?: string
  provider?: "yookassa" | "cloudpayments"
  error?: string
  errorCode?: string
}

// Типы ошибок платежей для более точной обработки
type PaymentErrorCode = 
  | 'VALIDATION_ERROR'
  | 'DONATION_CREATE_FAILED'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'PAYMENT_API_ERROR'
  | 'PAYMENT_TIMEOUT'
  | 'UNKNOWN_ERROR'

function formatPaymentError(code: PaymentErrorCode, details?: string): string {
  const messages: Record<PaymentErrorCode, string> = {
    VALIDATION_ERROR: 'Некорректные данные платежа',
    DONATION_CREATE_FAILED: 'Не удалось создать запись о пожертвовании',
    PAYMENT_PROVIDER_UNAVAILABLE: 'Платёжная система временно недоступна',
    PAYMENT_API_ERROR: 'Ошибка при обращении к платёжной системе',
    PAYMENT_TIMEOUT: 'Превышено время ожидания ответа от платёжной системы',
    UNKNOWN_ERROR: 'Непредвиденная ошибка при обработке платежа',
  }
  
  const baseMessage = messages[code]
  return details ? `${baseMessage}: ${details}` : baseMessage
}

function validatePaymentInput(input: PaymentInitiateInput): string | null {
  // Validate amount
  if (!input.amount || input.amount <= 0) {
    return "Сумма платежа должна быть больше нуля"
  }
  
  if (input.amount > 10000000) {
    return "Максимальная сумма платежа: 10 000 000"
  }

  // Validate currency
  if (!input.currency || !["RUB", "USD", "EUR"].includes(input.currency)) {
    return "Неподдерживаемая валюта. Доступны: RUB, USD, EUR"
  }

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

export async function initiatePayment(input: PaymentInitiateInput): Promise<PaymentResult> {
  // Validate payment input
  const validationError = validatePaymentInput(input)
  if (validationError) {
    console.warn("[Payment] Validation error:", validationError)
    return { 
      success: false, 
      error: validationError,
      errorCode: 'VALIDATION_ERROR'
    }
  }

  try {
    // Сначала создаем запись о пожертвовании
    console.log("[Payment] Создание записи о пожертвовании...")
    const donationResult = await createDonation(input)

    if (donationResult.error || !donationResult.donation) {
      console.error("[Payment] Ошибка создания пожертвования:", donationResult.error)
      return { 
        success: false, 
        error: formatPaymentError('DONATION_CREATE_FAILED', donationResult.error),
        errorCode: 'DONATION_CREATE_FAILED'
      }
    }

    const donationId = donationResult.donation.id
    console.log("[Payment] Пожертвование создано:", donationId)

    // Определяем провайдера платежей
    let provider: "yookassa" | "cloudpayments"
    if (input.provider && input.provider !== "auto") {
      provider = input.provider
    } else {
      // Автоматический выбор на основе валюты и BIN карты
      provider = detectPaymentProvider(input.currency, input.cardBin)
    }
    
    console.log("[Payment] Выбран провайдер:", provider)

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = input.returnUrl || `${baseUrl}/payment/success?donation_id=${donationId}`
    const cancelUrl = input.cancelUrl || `${baseUrl}/payment/cancel`

    let paymentUrl: string | undefined

    // Создаем платеж через выбранного провайдера
    if (provider === "yookassa") {
      // Проверяем наличие credentials
      const shopId = process.env.YOOKASSA_SHOP_ID
      const secretKey = process.env.YOOKASSA_SECRET_KEY

      if (!shopId || !secretKey) {
        // Если YooKassa не настроен, используем CloudPayments как fallback
        console.warn("[Payment] YooKassa не настроен (отсутствует YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY), переключаемся на CloudPayments")
        provider = "cloudpayments"
      } else {
        try {
          // Создаем платеж через YooKassa
          console.log("[Payment] Создание платежа в YooKassa...")
          const yooKassaPayment = await createYooKassaPayment({
            shopId,
            secretKey,
            amount: input.amount,
            currency: input.currency,
            description: `Пожертвование - ${input.category === "sadaqah" ? "Садака" : input.category === "zakat" ? "Закят" : "Общее"}`,
            returnUrl,
            cancelUrl,
            metadata: {
              donationId,
              donation_type: input.donationType,
              category: input.category,
            },
          })

          paymentUrl = yooKassaPayment.confirmation.confirmation_url
          console.log("[Payment] YooKassa платёж создан:", yooKassaPayment.id)

          // Обновляем donation с информацией о провайдере
          const supabase = await createClient()
          await supabase
            .from("donations")
            .update({
              payment_provider: "yookassa",
              payment_transaction_id: yooKassaPayment.id,
            })
            .eq("id", donationId)
            
        } catch (yooKassaError) {
          console.error("[Payment] Ошибка YooKassa:", yooKassaError)
          // Fallback на CloudPayments при ошибке YooKassa
          console.warn("[Payment] Переключаемся на CloudPayments после ошибки YooKassa")
          provider = "cloudpayments"
        }
      }
    }

    // Если не YooKassa или fallback, используем CloudPayments
    if (provider === "cloudpayments" || !paymentUrl) {
      // Проверяем наличие внешнего API
      const paymentApiUrl = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL

      if (!paymentApiUrl) {
        console.error("[Payment] PAYMENT_API_URL не настроен для CloudPayments")
        return { 
          success: false, 
          error: formatPaymentError('PAYMENT_PROVIDER_UNAVAILABLE', 'CloudPayments API не настроен'),
          errorCode: 'PAYMENT_PROVIDER_UNAVAILABLE'
        }
      }

      try {
        console.log("[Payment] Отправка запроса в Payment API:", paymentApiUrl)
        
        // Используем внешний API для CloudPayments
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд таймаут
        
        const response = await fetch(`${paymentApiUrl}/api/payments/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.PAYMENT_API_TOKEN && {
              Authorization: `Bearer ${process.env.PAYMENT_API_TOKEN}`,
            }),
          },
          body: JSON.stringify({
            donation_id: donationId,
            amount: input.amount,
            currency: input.currency,
            donation_type: input.donationType,
            frequency: input.frequency,
            category: input.category,
            fund_id: input.fundId,
            campaign_id: input.campaignId,
            message: input.message,
            is_anonymous: input.isAnonymous,
            invoice_id: JSON.stringify({ donationId }),
            return_url: returnUrl,
            cancel_url: cancelUrl,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          console.error("[Payment] Payment API вернул ошибку:", response.status, errorText)
          
          // Парсим ошибку если возможно
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorJson.message || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
          
          return { 
            success: false, 
            error: formatPaymentError('PAYMENT_API_ERROR', errorMessage),
            errorCode: 'PAYMENT_API_ERROR'
          }
        }

        const data = await response.json()
        paymentUrl = data.payment_url || data.url || data.link
        
        console.log("[Payment] Получен URL платежа от Payment API")
        
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error("[Payment] Таймаут запроса к Payment API")
          return { 
            success: false, 
            error: formatPaymentError('PAYMENT_TIMEOUT'),
            errorCode: 'PAYMENT_TIMEOUT'
          }
        }
        
        console.error("[Payment] Ошибка запроса к Payment API:", fetchError)
        return { 
          success: false, 
          error: formatPaymentError('PAYMENT_API_ERROR', fetchError.message),
          errorCode: 'PAYMENT_API_ERROR'
        }
      }
    }

    if (!paymentUrl) {
      console.error("[Payment] Не удалось получить URL платежа")
      return { 
        success: false, 
        error: formatPaymentError('PAYMENT_API_ERROR', 'URL платежа не получен'),
        errorCode: 'PAYMENT_API_ERROR'
      }
    }

    console.log("[Payment] ✓ Платёж успешно создан через", provider)
    return { 
      success: true, 
      paymentUrl, 
      donationId, 
      provider 
    }
    
  } catch (error) {
    console.error("[Payment] Неожиданная ошибка:", error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Неизвестная ошибка"
    
    return { 
      success: false, 
      error: formatPaymentError('UNKNOWN_ERROR', errorMessage),
      errorCode: 'UNKNOWN_ERROR'
    }
  }
}

