"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Calendar, CreditCard, Pause, Play, X } from "lucide-react"
import { toast } from "sonner"
import { getUserSubscriptions, cancelSubscription, pauseSubscription, resumeSubscription } from "@/lib/actions/subscriptions"
import Link from "next/link"

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    setIsLoading(true)
    try {
      const result = await getUserSubscriptions()
      if (result.error) {
        toast.error("Не удалось загрузить подписки")
        setSubscriptions([])
      } else {
        setSubscriptions(result.subscriptions || [])
      }
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
      toast.error("Ошибка при загрузке подписок")
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedSubscription) return

    setIsProcessing(true)
    try {
      const result = await cancelSubscription(selectedSubscription)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Подписка отменена")
        setCancelDialogOpen(false)
        setSelectedSubscription(null)
        loadSubscriptions()
      }
    } catch (error) {
      console.error("Cancellation error:", error)
      toast.error("Не удалось отменить подписку")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePause = async () => {
    if (!selectedSubscription) return

    setIsProcessing(true)
    try {
      const result = await pauseSubscription(selectedSubscription)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Подписка приостановлена")
        setPauseDialogOpen(false)
        setSelectedSubscription(null)
        loadSubscriptions()
      }
    } catch (error) {
      console.error("Pause error:", error)
      toast.error("Не удалось приостановить подписку")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResume = async () => {
    if (!selectedSubscription) return

    setIsProcessing(true)
    try {
      const result = await resumeSubscription(selectedSubscription)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Подписка возобновлена")
        setResumeDialogOpen(false)
        setSelectedSubscription(null)
        loadSubscriptions()
      }
    } catch (error) {
      console.error("Resume error:", error)
      toast.error("Не удалось возобновить подписку")
    } finally {
      setIsProcessing(false)
    }
  }

  const getTierName = (tier: string) => {
    const tierMap: Record<string, string> = {
      mutahsin_pro: "Мутахсин Pro",
      sahib_al_waqf_premium: "Сахиб аль-Вакф Premium",
    }
    return tierMap[tier] || tier
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Активна</Badge>
      case "paused":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Приостановлена</Badge>
      case "cancelled":
        return <Badge variant="destructive">Отменена</Badge>
      case "expired":
        return <Badge variant="outline">Истекла</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка подписок...</span>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">У вас нет активных подписок</p>
        <Button asChild>
          <Link href="/subscription">Выбрать подписку</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => {
        const nextBillingDate = subscription.next_billing_date
          ? new Date(subscription.next_billing_date)
          : null

        return (
          <Card key={subscription.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{getTierName(subscription.tier)}</CardTitle>
                  <CardDescription>
                    {subscription.billing_frequency === "monthly" ? "Ежемесячная" : "Годовая"} подписка
                  </CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Сумма</p>
                  <p className="font-bold text-primary">
                    {subscription.amount} {subscription.currency || "RUB"}
                  </p>
                </div>
                {nextBillingDate && subscription.status === "active" && (
                  <div>
                    <p className="text-muted-foreground">Следующий платёж</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {nextBillingDate.toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {subscription.cancelled_at && (
                  <div>
                    <p className="text-muted-foreground">Отменена</p>
                    <p className="font-semibold">
                      {new Date(subscription.cancelled_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {subscription.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription.id)
                        setPauseDialogOpen(true)
                      }}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Приостановить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription.id)
                        setCancelDialogOpen(true)
                      }}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Отменить
                    </Button>
                  </>
                )}
                {subscription.status === "paused" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(subscription.id)
                      setResumeDialogOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Возобновить
                  </Button>
                )}
                {subscription.status === "cancelled" && (
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/subscription">Выбрать новую подписку</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отменить подписку? После отмены вы потеряете доступ к премиум-функциям.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отмена...
                </>
              ) : (
                "Отменить подписку"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Dialog */}
      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Приостановить подписку?</AlertDialogTitle>
            <AlertDialogDescription>
              Подписка будет приостановлена. Вы сможете возобновить её позже. Платежи не будут списываться
              до возобновления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handlePause} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Приостановка...
                </>
              ) : (
                "Приостановить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resume Dialog */}
      <AlertDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Возобновить подписку?</AlertDialogTitle>
            <AlertDialogDescription>
              Подписка будет возобновлена. Следующий платёж будет списан согласно выбранному периоду.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Возобновление...
                </>
              ) : (
                "Возобновить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

