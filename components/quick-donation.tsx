"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CloudPaymentsButton } from "@/components/cloudpayments-button"
import { createDonation } from "@/lib/actions/donations"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/mobile-ux"

interface QuickDonationProps {
  amount: number
  campaignId?: string
  fundId?: string
  category?: string
}

export function QuickDonation({ amount, campaignId, fundId, category = "sadaqah" }: QuickDonationProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePaymentSuccess = async () => {
    setIsProcessing(true)

    try {
      const result = await createDonation({
        amount,
        currency: "RUB",
        donationType: "one_time",
        category: category as any,
        fundId: fundId || undefined,
        campaignId: campaignId || undefined,
        isAnonymous: false,
      })

      if (result.error) {
        hapticFeedback("error")
        toast.error(`Ошибка: ${result.error}`)
        setIsProcessing(false)
        return
      }

      hapticFeedback("success")
      toast.success("Спасибо за ваше пожертвование! Да воздаст вам Аллах благом.")
      setIsOpen(false)
      router.push("/profile")
    } catch (error) {
      console.error("Payment error:", error)
      hapticFeedback("error")
      toast.error("Произошла ошибка при обработке платежа. Пожалуйста, попробуйте снова.")
      setIsProcessing(false)
    }
  }

  const handlePaymentFail = (reason: string) => {
    hapticFeedback("error")
    toast.error(`Платёж не прошёл: ${reason}`)
    setIsProcessing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) {
        hapticFeedback("medium")
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="w-full h-14 bg-primary hover:bg-primary/90 text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
          onClick={() => hapticFeedback("light")}
        >
          <Heart className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{amount.toLocaleString("ru-RU")} ₽</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Подтверждение пожертвования</DialogTitle>
          <DialogDescription className="text-center">
            Вы хотите пожертвовать {amount.toLocaleString("ru-RU")} ₽ как садака
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg space-y-3 border-2 border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Сумма:</span>
              <span className="font-bold text-2xl text-primary">{amount.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Тип:</span>
              <span className="font-medium">Садака (единоразово)</span>
            </div>
          </div>

          <CloudPaymentsButton
            amount={amount}
            currency="RUB"
            description={`Пожертвование садака ${amount.toLocaleString("ru-RU")} ₽`}
            donationData={{
              category,
              fundId,
              campaignId,
            }}
            onSuccess={handlePaymentSuccess}
            onFail={handlePaymentFail}
            disabled={isProcessing}
            className="w-full h-12 text-base font-semibold"
          />

          <p className="text-xs text-center text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

