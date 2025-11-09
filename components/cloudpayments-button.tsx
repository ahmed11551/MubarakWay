"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { hapticFeedback } from "@/lib/mobile-ux"
import { initiatePayment, type PaymentInitiateInput } from "@/lib/actions/payments"

interface CloudPaymentsButtonProps {
  amount: number
  currency: string
  description: string
  donationData?: Record<string, any>
  onSuccess?: () => void
  onFail?: (reason: string) => void
  disabled?: boolean
  className?: string
}

export function CloudPaymentsButton({
  amount,
  currency,
  description,
  donationData,
  onSuccess,
  onFail,
  disabled,
  className,
}: CloudPaymentsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    // Client-side validation
    if (amount <= 0 || amount > 10000000) {
      hapticFeedback("error")
      onFail?.("Сумма должна быть от 1 до 10 000 000")
      return
    }

    if (!currency || !["RUB", "USD", "EUR"].includes(currency)) {
      hapticFeedback("error")
      onFail?.("Неверная валюта")
      return
    }

    hapticFeedback("medium")
    setIsLoading(true)

    try {
      // Формируем данные для создания платежа
      const paymentInput: PaymentInitiateInput = {
        amount,
        currency,
        donationType: donationData?.donationType || "one_time",
        frequency: donationData?.frequency,
        category: donationData?.category || "sadaqah",
        fundId: donationData?.fundId,
        campaignId: donationData?.campaignId,
        message: donationData?.message,
        isAnonymous: donationData?.isAnonymous || false,
      }

      // Вызываем server action для создания платежа и получения ссылки
      const result = await initiatePayment(paymentInput)

      if (result.error) {
        console.error("[Payment] Ошибка создания платежа:", result.error)
        hapticFeedback("error")
        setIsLoading(false)
        onFail?.(result.error)
        return
      }

      if (!result.paymentUrl) {
        console.error("[Payment] Ссылка на оплату не получена")
        hapticFeedback("error")
        setIsLoading(false)
        onFail?.("Ссылка на оплату не получена")
        return
      }

      // Редиректим пользователя на страницу оплаты
      console.log("[Payment] Редирект на оплату:", result.paymentUrl)
      window.location.href = result.paymentUrl
      
      // onSuccess будет вызван после возврата с платежной страницы
      // (через returnUrl)
    } catch (error) {
      console.error("[Payment] Ошибка инициализации платежа:", error)
      hapticFeedback("error")
      setIsLoading(false)
      onFail?.(error instanceof Error ? error.message : "Не удалось инициировать платёж")
    }
  }

  return (
    <Button type="button" size="lg" className={className} onClick={handlePayment} disabled={disabled || isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Обработка...
        </>
      ) : (
        `Пожертвовать ${amount.toLocaleString("ru-RU")} ${currency}`
      )}
    </Button>
  )
}
