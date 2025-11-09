"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { hapticFeedback } from "@/lib/mobile-ux"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    hapticFeedback("success")
  }, [])

  const donationId = searchParams.get("donation_id")
  const transactionId = searchParams.get("transaction_id")

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Оплата успешна!</CardTitle>
          <CardDescription>Спасибо за ваше пожертвование</Cardсибо за ваше пожертвование</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  )
}

