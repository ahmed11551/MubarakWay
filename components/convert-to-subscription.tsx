"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Repeat } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/mobile-ux"

interface ConvertToSubscriptionProps {
  donationId: string
  amount: number
  currency: string
}

export function ConvertToSubscription({ donationId, amount, currency }: ConvertToSubscriptionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly")
  const [isOpen, setIsOpen] = useState(false)

  const handleConvert = async () => {
    if (!donationId) {
      toast.error("Не удалось определить пожертвование")
      return
    }

    hapticFeedback("medium")
    setIsLoading(true)

    try {
      const response = await fetch("/api/subscriptions/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donationId,
          amount,
          currency,
          frequency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать подписку")
      }

      hapticFeedback("success")
      toast.success("Подписка успешно создана!")
      router.push("/subscription")
    } catch (error) {
      console.error("[Convert Subscription] Error:", error)
      hapticFeedback("error")
      toast.error(error instanceof Error ? error.message : "Не удалось создать подписку")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Сделать регулярным</p>
              <p className="text-xs text-muted-foreground">
                Превратите это пожертвование в регулярную садаку
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="gap-2"
            >
              <Repeat className="h-4 w-4" />
              Настроить
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Сделать регулярным
        </CardTitle>
        <CardDescription>
          Настройте регулярные пожертвования на ту же сумму
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Частота пожертвований</Label>
          <Select value={frequency} onValueChange={(value) => setFrequency(value as "monthly" | "weekly")}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Ежемесячно</SelectItem>
              <SelectItem value="weekly">Еженедельно</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-1">
          <p className="text-sm text-muted-foreground">Сумма пожертвования</p>
          <p className="text-2xl font-bold text-primary">
            {amount.toLocaleString("ru-RU")} {currency}
          </p>
          <p className="text-xs text-muted-foreground">
            {frequency === "monthly" ? "Каждый месяц" : "Каждую неделю"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1"
            onClick={handleConvert}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              "Создать подписку"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

