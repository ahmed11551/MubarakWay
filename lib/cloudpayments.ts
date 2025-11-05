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

export function loadCloudPaymentsWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
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

export async function initiateCloudPayment(config: CloudPaymentsConfig, callbacks: CloudPaymentsCallbacks = {}) {
  try {
    // Временно используем демо-режим без реального publicId
    console.log("[v0] CloudPayments демо-режим:", config)

    // Имитация успешной оплаты для демонстрации
    setTimeout(() => {
      console.log("[v0] CloudPayments демо: платёж успешен")
      callbacks.onSuccess?.({ transactionId: `DEMO-${Date.now()}` })
      callbacks.onComplete?.({ success: true }, config)
    }, 1500)

    // Раскомментируйте код ниже, когда получите publicId от CloudPayments
    /*
    await loadCloudPaymentsWidget()

    if (!window.cp) {
      throw new Error("Виджет CloudPayments не загружен")
    }

    const widget = new window.cp.CloudPayments()

    widget.pay(
      "charge",
      {
        publicId: config.publicId, // Здесь будет ваш publicId
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
          console.log("[v0] CloudPayments успех:", options)
          callbacks.onSuccess?.(options)
        },
        onFail: (reason: string, options: any) => {
          console.error("[v0] CloudPayments ошибка:", reason, options)
          callbacks.onFail?.(reason, options)
        },
        onComplete: (paymentResult: any, options: any) => {
          console.log("[v0] CloudPayments завершено:", paymentResult, options)
          callbacks.onComplete?.(paymentResult, options)
        },
      },
    )
    */
  } catch (error) {
    console.error("[v0] Ошибка CloudPayments:", error)
    throw error
  }
}
