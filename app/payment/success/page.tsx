"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { hapticFeedback } from "@/lib/mobile-ux"
import { ConvertToSubscription } from "@/components/convert-to-subscription"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [donation, setDonation] = useState<{ id: string; amount: number; currency: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    hapticFeedback("success")
  }, [])

  const donationId = searchParams.get("donation_id")
  const transactionId = searchParams.get("transaction_id")

  useEffect(() => {
    async function fetchDonation() {
      if (!donationId) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/donations/${donationId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.donation) {
            setDonation({
              id: data.donation.id,
              amount: Number(data.donation.amount || 0),
              currency: data.donation.currency || "RUB",
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch donation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDonation()
  }, [donationId])

  return (
    <div className="container mx-auto px-4 py-8 max-w-md space-y-4">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Оплата успешна!</CardTitle>
          <CardDescription>Спасибо за ваше пожертвование</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {donationId && (
                <p className="text-sm text-muted-foreground text-center">
                  ID пожертвования: {donationId}
                </p>
              )}
              {transactionId && (
                <p className="text-sm text-muted-foreground text-center">
                  ID транзакции: {transactionId}
                </p>
              )}
              {donation && (
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Сумма пожертвования</p>
                  <p className="text-2xl font-bold text-primary">
                    {donation.amount.toLocaleString("ru-RU")} {donation.currency}
                  </p>
                </div>
              )}
            </>
          )}
          <div className="space-y-2">
            <Button onClick={() => router.push("/profile")} className="w-full" size="lg">
              Перейти в профиль
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              На главную
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA: Сделать регулярным */}
      {donation && !isLoading && (
        <ConvertToSubscription
          donationId={donation.id}
          amount={donation.amount}
          currency={donation.currency}
        />
      )}
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Загрузка...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

