"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { initiateCloudPayment } from "@/lib/cloudpayments"
import { Loader2 } from "lucide-react"

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
    setIsLoading(true)

    try {
      await initiateCloudPayment(
        {
          publicId: "demo", // Временное значение для демонстрации
          description,
          amount,
          currency,
          invoiceId: `INV-${Date.now()}`,
          data: donationData,
        },
        {
          onSuccess: (options) => {
            console.log("[v0] Платёж успешен:", options)
            onSuccess?.()
          },
          onFail: (reason, options) => {
            console.error("[v0] Платёж не прошёл:", reason, options)
            onFail?.(reason)
          },
          onComplete: (paymentResult) => {
            console.log("[v0] Платёж завершён:", paymentResult)
            setIsLoading(false)
          },
        },
      )
    } catch (error) {
      console.error("[v0] Ошибка инициализации платежа:", error)
      setIsLoading(false)
      onFail?.("Не удалось инициировать платёж")
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
