"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CloudPaymentsButton } from "@/components/cloudpayments-button"
import { createDonation } from "@/lib/actions/donations"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"

/**
 * Ultra Quick Donation - 3 clicks like Tooba
 * Step 1: Choose campaign (optional - can skip)
 * Step 2: Enter amount
 * Step 3: Help!
 */
export function UltraQuickDonation() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)

  // Load campaigns for step 1
  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true)
    try {
      const response = await fetch("/api/campaigns?status=active&limit=5")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error)
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  const handleStart = () => {
    setIsDialogOpen(true)
    setStep(1)
    loadCampaigns()
  }

  const handleSkipCampaign = () => {
    setSelectedCampaign(null)
    setStep(2)
  }

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaign(campaignId)
    setStep(2)
  }

  const handleAmountInput = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "")
    setAmount(numericValue)
  }

  const handleAmountButton = (value: number) => {
    setAmount(value.toString())
  }

  const handleNext = () => {
    if (step === 1) {
      if (selectedCampaign) {
        setStep(2)
      } else {
        setStep(2) // Skip to amount
      }
    } else if (step === 2) {
      if (!amount || Number(amount) <= 0) {
        toast.error("Введите сумму пожертвования")
        return
      }
      setStep(3)
    }
  }

  const handlePaymentSuccess = async () => {
    if (!amount || Number(amount) <= 0) return

    setIsProcessing(true)

    try {
      const result = await createDonation({
        amount: Number(amount),
        currency: "RUB",
        donationType: "one_time",
        category: "sadaqah",
        campaignId: selectedCampaign || undefined,
        isAnonymous: false,
      })

      if (result.error) {
        toast.error(`Ошибка: ${result.error}`)
        setIsProcessing(false)
        return
      }

      toast.success("Спасибо за ваше пожертвование! Да воздаст вам Аллах благом.")
      setIsDialogOpen(false)
      setStep(1)
      setAmount("")
      setSelectedCampaign(null)
      router.push("/profile")
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Произошла ошибка при обработке платежа. Пожалуйста, попробуйте снова.")
      setIsProcessing(false)
    }
  }

  const handlePaymentFail = (reason: string) => {
    toast.error(`Платёж не прошёл: ${reason}`)
    setIsProcessing(false)
  }

  const presetAmounts = [100, 250, 500, 1000, 2500, 5000]

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Помогай легко в 3 клика!</CardTitle>
          </div>
          <CardDescription>Быстрое пожертвование как в Tooba</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStart} className="w-full" size="lg">
            <Heart className="h-4 w-4 mr-2" />
            Начать пожертвование
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 1 && "1. ВЫБЕРИ СБОР"}
              {step === 2 && "2. ВВЕДИ СУММУ"}
              {step === 3 && "3. ПОМОГАЙ!"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 && "Выберите кампанию или пропустите этот шаг"}
              {step === 2 && "Введите сумму пожертвования"}
              {step === 3 && "Подтвердите платеж"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step 1: Choose Campaign */}
            {step === 1 && (
              <div className="space-y-3">
                {isLoadingCampaigns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {campaigns.map((campaign) => (
                        <Button
                          key={campaign.id}
                          variant={selectedCampaign === campaign.id ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto py-3"
                          onClick={() => handleSelectCampaign(campaign.id)}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {campaign.description}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleSkipCampaign}>
                      Пропустить (общее пожертвование)
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Enter Amount */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Сумма пожертвования</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => handleAmountInput(e.target.value)}
                      placeholder="0"
                      className="w-full text-3xl font-bold text-center py-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      ₽
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      variant={amount === preset.toString() ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleAmountButton(preset)}
                    >
                      {preset} ₽
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Сумма пожертвования</p>
                  <p className="text-3xl font-bold text-primary">
                    {Number(amount).toLocaleString("ru-RU")} ₽
                  </p>
                  {selectedCampaign && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Кампания: {campaigns.find((c) => c.id === selectedCampaign)?.title || "Выбранная кампания"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-4 border-t space-y-2">
            {step === 3 && (
              <CloudPaymentsButton
                amount={Number(amount)}
                description={`Пожертвование ${Number(amount).toLocaleString("ru-RU")} ₽`}
                onSuccess={handlePaymentSuccess}
                onFail={handlePaymentFail}
                disabled={isProcessing}
                className="w-full"
              />
            )}
            <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                Назад
              </Button>
            )}
            {step < 3 && (
              <Button className="flex-1" onClick={handleNext} disabled={step === 2 && (!amount || Number(amount) <= 0)}>
                Далее
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

