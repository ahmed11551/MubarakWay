"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Target, Heart } from "lucide-react"
import { Loader2 } from "lucide-react"

interface PlatformStats {
  totalCollected: number
  activeDonors: number
  activeCampaigns: number
  peopleHelped?: number // Опционально, если есть в API
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} млрд ₽`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} млн ₽`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)} тыс ₽`
  }
  return `${num.toLocaleString("ru-RU")} ₽`
}

function formatPeopleCount(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} млн`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)} тыс`
  }
  return num.toLocaleString("ru-RU")
}

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const authToken = process.env.NEXT_PUBLIC_API_AUTH_TOKEN
        if (!authToken) {
          console.warn("[Platform Stats] NEXT_PUBLIC_API_AUTH_TOKEN not configured")
          setIsLoading(false)
          return
        }
        
        const response = await fetch("/api/stats", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats({
            totalCollected: Number(data.total_collected || 0),
            activeDonors: Number(data.active_donors || 0),
            activeCampaigns: Number(data.active_campaigns || 0),
            peopleHelped: Number(data.people_helped || 0), // Если есть в API
          })
        }
      } catch (error) {
        console.error("Failed to fetch platform stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Загрузка статистики...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="py-6">
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold">Наша платформа в цифрах</h3>
            <p className="text-xs text-muted-foreground">Результаты работы сообщества</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Всего собрано */}
            <div className="text-center p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary mb-1">
                {formatLargeNumber(stats.totalCollected)}
              </p>
              <p className="text-xs text-muted-foreground">пожертвований собрано</p>
            </div>

            {/* Активных благотворителей */}
            <div className="text-center p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent mb-1">
                {formatPeopleCount(stats.activeDonors)}
              </p>
              <p className="text-xs text-muted-foreground">активных благотворителей</p>
            </div>

            {/* Активных кампаний */}
            <div className="text-center p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary mb-1">
                {stats.activeCampaigns.toLocaleString("ru-RU")}
              </p>
              <p className="text-xs text-muted-foreground">активных кампаний</p>
            </div>

            {/* Людей получило помощь (если есть) */}
            {stats.peopleHelped && stats.peopleHelped > 0 ? (
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <p className="text-2xl font-bold text-accent mb-1">
                  {formatPeopleCount(stats.peopleHelped)}
                </p>
                <p className="text-xs text-muted-foreground">человек получило помощь</p>
              </div>
            ) : (
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <p className="text-2xl font-bold text-accent mb-1">—</p>
                <p className="text-xs text-muted-foreground">данные обновляются</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

