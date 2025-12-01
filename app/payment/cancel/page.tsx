"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { hapticFeedback } from "@/lib/mobile-ux"

export default function PaymentCancelPage() {
  const router = useRouter()

  useEffect(() => {
    hapticFeedback("error")
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Оплата отменена</CardTitle>
          <CardDescription>Вы отменили процесс оплаты</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Если у вас возникли проблемы с оплатой, пожалуйста, попробуйте снова или свяжитесь с поддержкой.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/")} className="w-full" size="lg">
              Вернуться на главную
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

