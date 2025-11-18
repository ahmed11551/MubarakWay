"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CloudPaymentsButton } from "@/components/cloudpayments-button"
import { createSubscription } from "@/lib/actions/subscriptions"
import { Sparkles, Crown, Star, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/mobile-ux"

// План подписки с ценами
const SUBSCRIPTION_PLANS: Record<string, any> = {
  Муслим: {
    name: "Муслим",
    subtitle: "Базовый",
    icon: Star,
    tier: null, // Бесплатный план
    free: true,
  },
  Мутахсин: {
    name: "Мутахсин",
    subtitle: "Pro",
    icon: Sparkles,
    tier: "mutahsin_pro",
    free: false,
    prices: {
      "1 месяц": { price: 260, charity: 13 },
      "3 месяца": { price: 780, charity: 39 },
      "6 месяцев": { price: 1300, charity: 65 },
      "12 месяцев": { price: 2340, charity: 234 },
    },
  },
  "Сахиб аль-Вакф": {
    name: "Сахиб аль-Вакф",
    subtitle: "Premium",
    icon: Crown,
    tier: "sahib_al_waqf_premium",
    free: false,
    prices: {
      "1 месяц": { price: 550, charity: 55 },
      "3 месяца": { price: 1650, charity: 165 },
      "6 месяцев": { price: 2750, charity: 137.5 },
      "12 месяцев": { price: 4950, charity: 495 },
    },
  },
}

function SubscriptionCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)

  const planName = searchParams.get("plan") || ""
  const period = searchParams.get("period") || ""

  const plan = SUBSCRIPTION_PLANS[planName]
  const priceInfo = plan?.prices?.[period]

  // Redirect if invalid plan or period
  useEffect(() => {
    if (!plan || plan.free) {
      toast.error("Неверный план подписки")
      router.push("/subscription")
      return
    }
    if (!priceInfo) {
      toast.error("Неверный период подписки")
      router.push("/subscription")
      return
    }
  }, [plan, priceInfo, router])

  if (!plan || plan.free || !priceInfo) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  const Icon = plan.icon
  const amount = priceInfo.price
  const charityAmount = priceInfo.charity
  // Determine billing frequency: "12 месяцев" is yearly, others are monthly
  const billingFrequency = period === "12 месяцев" ? "yearly" : "monthly"

  const handlePaymentSuccess = async () => {
    hapticFeedback("medium")
    setIsProcessing(true)

    try {
      const result = await createSubscription({
        tier: plan.tier,
        amount: amount,
        currency: "RUB",
        billingFrequency: billingFrequency,
      })

      if (result.error) {
        hapticFeedback("error")
        toast.error(`Ошибка: ${result.error}`)
        setIsProcessing(false)
        return
      }

      hapticFeedback("success")
      toast.success("Подписка успешно активирована! Благодарим за вашу поддержку.")
      router.push("/profile?tab=subscriptions")
    } catch (error) {
      console.error("Subscription creation error:", error)
      hapticFeedback("error")
      toast.error("Произошла ошибка при создании подписки. Пожалуйста, попробуйте снова.")
      setIsProcessing(false)
    }
  }

  const handlePaymentFail = (reason: string) => {
    hapticFeedback("error")
    toast.error(`Платёж не прошёл: ${reason}`)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/subscription">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к подпискам
            </Link>
          </Button>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Icon className="h-4 w-4" />
              <span>Оформление подписки</span>
            </div>
            <h1 className="text-2xl font-bold">Подтверждение подписки</h1>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-${plan.color || "primary"}/10 flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 text-${plan.color || "primary"}`} />
                </div>
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.subtitle}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg space-y-3 border-2 border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">План:</span>
                  <span className="font-bold">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Период:</span>
                  <span className="font-medium">{period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Сумма:</span>
                  <span className="font-bold text-2xl text-primary">{amount.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Садака-джария:</span>
                  <span className="font-medium text-green-600">{charityAmount.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="pt-3 border-t border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Итого к оплате:</span>
                    <span className="font-bold text-xl text-primary">{amount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <CloudPaymentsButton
                  amount={amount}
                  currency="RUB"
                  description={`Подписка ${plan.name} на ${period.toLowerCase()}`}
                  donationData={{
                    subscription: true,
                    tier: plan.tier,
                    period: period,
                    billingFrequency: billingFrequency,
                  }}
                  onSuccess={handlePaymentSuccess}
                  onFail={handlePaymentFail}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-semibold"
                />

                <p className="text-xs text-center text-muted-foreground">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных и условиями подписки
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Подписка будет автоматически продлеваться</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Вы можете отменить подписку в любое время</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Часть суммы ({charityAmount.toLocaleString("ru-RU")} ₽) идёт в благотворительность</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pb-20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </div>
      }
    >
      <SubscriptionCheckoutContent />
    </Suspense>
  )
}

