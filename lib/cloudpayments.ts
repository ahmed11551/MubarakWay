"use client"

// CloudPayments Widget Integration
// Документация: https://developers.cloudpayments.ru/#widget

export interface CloudPaymentsConfig {
  publicId: string
  description: string
  amount: number
  currency: string
  invoiceId?: string
  accountId?: string
  email?: string
  skin?: "classic" | "modern" | "mini"
  data?: Record<string, any>
}

export interface CloudPaymentsCallbacks {
  onSuccess?: (options: any) => void
  onFail?: (reason: string, options: any) => void
  onComplete?: (paymentResult: any) => void
}

declare global {
  interface Window {
    cp?: any
  }
}

/**
 * Загрузка виджета CloudPayments
 * Требует NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID в переменных окружения
 */
export function loadCloudPaymentsWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("CloudPayments widget can only be loaded in browser"))
      return
    }

    if (window.cp) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://widget.cloudpayments.ru/bundles/cloudpayments.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Не удалось загрузить виджет CloudPayments"))
    document.head.appendChild(script)
  })
}

/**
 * Инициализация платежа через CloudPayments Widget
 * Требует настроенный NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID
 */
export async function initiateCloudPayment(config: CloudPaymentsConfig, callbacks: CloudPaymentsCallbacks = {}) {
  // Проверяем наличие publicId
  const publicId = config.publicId || process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID
  
  if (!publicId) {
    const error = new Error(
      "CloudPayments не настроен: отсутствует NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID. " +
      "Получите публичный ключ в личном кабинете CloudPayments."
    )
    console.error("[CloudPayments]", error.message)
    callbacks.onFail?.("Платёжная система временно недоступна. Обратитесь в поддержку.", {})
    throw error
  }

  try {
    await loadCloudPaymentsWidget()

    if (!window.cp) {
      throw new Error("Виджет CloudPayments не загружен")
    }

    const widget = new window.cp.CloudPayments()

    widget.pay(
      "charge",
      {
        publicId: publicId,
        description: config.description,
        amount: config.amount,
        currency: config.currency,
        invoiceId: config.invoiceId,
        accountId: config.accountId,
        email: config.email,
        skin: config.skin || "modern",
        data: config.data || {},
      },
      {
        onSuccess: (options: any) => {
          console.log("[CloudPayments] Платёж успешен:", options)
          callbacks.onSuccess?.(options)
        },
        onFail: (reason: string, options: any) => {
          console.error("[CloudPayments] Ошибка платежа:", reason, options)
          callbacks.onFail?.(reason, options)
        },
        onComplete: (paymentResult: any, options: any) => {
          console.log("[CloudPayments] Платёж завершён:", paymentResult, options)
          callbacks.onComplete?.(paymentResult, options)
        },
      },
    )
  } catch (error) {
    console.error("[CloudPayments] Ошибка инициализации:", error)
    throw error
  }
}
