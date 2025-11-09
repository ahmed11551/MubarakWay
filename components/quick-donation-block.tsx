"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CloudPaymentsButton } from "@/components/cloudpayments-button"
import { createDonation } from "@/lib/actions/donations"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/mobile-ux"

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]

const DONATION_TYPES = [
  { value: "project", label: "Поддержать развитие проекта" },
  { value: "target", label: "Целевое пожертвование (садака)" },
]

const CATEGORIES = [
  { value: "sadaqah", label: "Садака" },
  { value: "general", label: "Общее" },
  { value: "healthcare", label: "Здравоохранение" },
  { value: "education", label: "Образование" },
  { value: "water", label: "Вода" },
  { value: "orphans", label: "Сироты" },
  { value: "emergency", label: "Экстренная помощь" },
]

export function QuickDonationBlock() {
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [donationType, setDonationType] = useState<"project" | "target">("project")
  const [selectedFund, setSelectedFund] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("sadaqah")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [funds, setFunds] = useState<any[]>([])
  const [isLoadingFunds, setIsLoadingFunds] = useState(false)

  // Fetch funds when target donation is selected
  useEffect(() => {
    if (donationType === "target") {
      async function loadFunds() {
        setIsLoadingFunds(true)
        try {
          const response = await fetch("/api/funds")
          if (response.ok) {
            const data = await response.json()
            if (data.funds) {
              setFunds(data.funds)
            }
          }
        } catch (error) {
          console.error("Failed to load funds:", error)
        } finally {
          setIsLoadingFunds(false)
        }
      }
      loadFunds()
    } else {
      setFunds([])
    }
  }, [donationType])

  const handleDonateClick = () => {
    if (!selectedAmount) {
      hapticFeedback("error")
      return
    }
    hapticFeedback("medium")
    setIsDialogOpen(true)
  }

  const handlePaymentSuccess = async () => {
    if (!selectedAmount) return

    setIsProcessing(true)

    try {
      const result = await createDonation({
        amount: selectedAmount,
        currency: "RUB",
        donationType: "one_time",
        category: donationType === "project" ? "general" : (selectedCategory as any),
        fundId: donationType === "target" && selectedFund && selectedFund !== "general" ? selectedFund : undefined,
        campaignId: undefined,
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
      setIsDialogOpen(false)
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
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Быстрое пожертвование</CardTitle>
          </div>
          <CardDescription>Выберите сумму для пожертвования</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Donation Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Назначение:</label>
            <Select value={donationType} onValueChange={(value: "project" | "target") => setDonationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DONATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fund Selection (only for target donation) */}
          {donationType === "target" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Выберите фонд:</label>
              <Select value={selectedFund} onValueChange={setSelectedFund} disabled={isLoadingFunds}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingFunds ? "Загрузка фондов..." : "Выберите фонд"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Общий фонд</SelectItem>
                  {isLoadingFunds ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </div>
                    </SelectItem>
                  ) : (
                    funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id.toString()}>
                        {fund.name || fund.name_ru || `Фонд ${fund.id}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category Selection (only for target donation) */}
          {donationType === "target" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Выберите категорию:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                className={`h-12 font-semibold ${
                  selectedAmount === amount ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAmount(amount)}
              >
                {amount} Р
              </Button>
            ))}
          </div>

          {/* Donate Button */}
          <Button
            size="lg"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold"
            onClick={handleDonateClick}
            disabled={!selectedAmount}
          >
            Пожертвовать сейчас
          </Button>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Подтверждение пожертвования</DialogTitle>
            <DialogDescription className="text-center">
              Вы хотите пожертвовать {selectedAmount?.toLocaleString("ru-RU")} ₽
              {donationType === "project" ? " на развитие проекта" : " как садака"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg space-y-3 border-2 border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Сумма:</span>
                <span className="font-bold text-2xl text-primary">
                  {selectedAmount?.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Тип:</span>
                <span className="font-medium">
                  {donationType === "project"
                    ? "Поддержка развития проекта"
                    : `Садака${selectedFund ? ` (фонд)` : ""}`}
                </span>
              </div>
              {donationType === "target" && selectedCategory && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Категория:</span>
                  <span className="font-medium">
                    {CATEGORIES.find((c) => c.value === selectedCategory)?.label || selectedCategory}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
            </p>
          </div>
          <div className="flex-shrink-0 pt-4 border-t">
            <CloudPaymentsButton
              amount={selectedAmount || 0}
              currency="RUB"
              description={`Пожертвование ${selectedAmount?.toLocaleString("ru-RU")} ₽`}
              donationData={{
                category: donationType === "project" ? "general" : selectedCategory,
                fundId: donationType === "target" && selectedFund ? selectedFund : undefined,
                campaignId: undefined,
              }}
              onSuccess={handlePaymentSuccess}
              onFail={handlePaymentFail}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

