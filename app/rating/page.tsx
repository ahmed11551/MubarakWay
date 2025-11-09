import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Link2, Calendar } from "lucide-react"
import { getTopDonors, getTopReferrals, type RatingPeriod, type RatingType } from "@/lib/actions/ratings"
import { getAnimalAvatar } from "@/lib/utils/animal-avatars"
import { getRamadanDateRange } from "@/lib/utils/ramadan"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Рейтинг | MubarakWay",
  description: "Рейтинг доноров и рефералов платформы MubarakWay",
}

export default async function RatingPage() {
  // Получаем текущего пользователя с обработкой ошибок
  let currentUserId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.warn("[RatingPage] Auth error (non-critical):", authError.message)
    }
    currentUserId = user?.id || null
  } catch (error) {
    console.warn("[RatingPage] Failed to get user (non-critical):", error)
    // Продолжаем работу без пользователя
  }

  // Загружаем данные для обоих периодов и типов с обработкой ошибок
  let allTimeDonors = { donors: [] as any[], error: undefined as string | undefined }
  let ramadanDonors = { donors: [] as any[], error: undefined as string | undefined }
  let allTimeReferrals = { referrals: [] as any[], error: undefined as string | undefined }
  let ramadanReferrals = { referrals: [] as any[], error: undefined as string | undefined }

  try {
    const results = await Promise.allSettled([
      getTopDonors("all_time", 100),
      getTopDonors("ramadan", 100),
      getTopReferrals("all_time", 100),
      getTopReferrals("ramadan", 100),
    ])

    if (results[0].status === "fulfilled") {
      allTimeDonors = results[0].value
    } else {
      console.error("[RatingPage] Error loading all_time donors:", results[0].reason)
      allTimeDonors = { donors: [], error: results[0].reason?.toString() || "Failed to load" }
    }

    if (results[1].status === "fulfilled") {
      ramadanDonors = results[1].value
    } else {
      console.error("[RatingPage] Error loading ramadan donors:", results[1].reason)
      ramadanDonors = { donors: [], error: results[1].reason?.toString() || "Failed to load" }
    }

    if (results[2].status === "fulfilled") {
      allTimeReferrals = results[2].value
    } else {
      console.error("[RatingPage] Error loading all_time referrals:", results[2].reason)
      allTimeReferrals = { referrals: [], error: results[2].reason?.toString() || "Failed to load" }
    }

    if (results[3].status === "fulfilled") {
      ramadanReferrals = results[3].value
    } else {
      console.error("[RatingPage] Error loading ramadan referrals:", results[3].reason)
      ramadanReferrals = { referrals: [], error: results[3].reason?.toString() || "Failed to load" }
    }
  } catch (error) {
    console.error("[RatingPage] Unexpected error loading ratings:", error)
    // Устанавливаем ошибки для всех, если общий catch сработал
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    allTimeDonors = { donors: [], error: errorMessage }
    ramadanDonors = { donors: [], error: errorMessage }
    allTimeReferrals = { referrals: [], error: errorMessage }
    ramadanReferrals = { referrals: [], error: errorMessage }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1</Badge>
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2</Badge>
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3</Badge>
    return <Badge variant="secondary">#{rank}</Badge>
  }

  const RatingList = ({
    items,
    type,
    currentUserId,
  }: {
    items: any[]
    type: RatingType
    currentUserId: string | null
  }) => {
    if (!items || items.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Пока нет данных в рейтинге</p>
            <p className="text-xs mt-2">Будьте первыми!</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          const isCurrentUser = currentUserId === item.user_id
          const animal = getAnimalAvatar(item.user_id)
          
          return (
            <Card
              key={item.user_id}
              className={`transition-all ${
                isCurrentUser ? "border-primary border-2 bg-primary/5" : ""
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getRankBadge(item.rank || index + 1)}
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {animal.emoji}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {item.display_name || animal.name}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          Вы
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {type === "donors"
                        ? formatAmount(item.total_donated || 0)
                        : `${item.referral_count || 0} рефералов`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Рейтинг</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Топ доноров и рефералов платформы
          </p>
        </div>

        {/* Основные табы: Общий рейтинг / Рейтинг Рамадана */}
        <Tabs defaultValue="all_time" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all_time" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Общий рейтинг
            </TabsTrigger>
            <TabsTrigger value="ramadan" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Рейтинг Рамадана
            </TabsTrigger>
          </TabsList>

          {/* Общий рейтинг */}
          <TabsContent value="all_time" className="space-y-4 mt-4">
            {/* Подтабы: Топ доноров / Топ по ссылкам */}
            <Tabs defaultValue="donors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donors" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Топ доноров
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Топ по ссылкам
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donors" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">За все время</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RatingList
                      items={allTimeDonors.donors || []}
                      type="donors"
                      currentUserId={currentUserId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="referrals" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">За все время</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RatingList
                      items={allTimeReferrals.referrals || []}
                      type="referrals"
                      currentUserId={currentUserId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Рейтинг Рамадана */}
          <TabsContent value="ramadan" className="space-y-4 mt-4">
            {/* Подтабы: Топ доноров / Топ по ссылкам */}
            <Tabs defaultValue="donors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donors" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Топ доноров
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Топ по ссылкам
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donors" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Рейтинг Рамадана</CardTitle>
                    <p className="text-xs text-muted-foreground">{getRamadanDateRange()}</p>
                  </CardHeader>
                  <CardContent>
                    <RatingList
                      items={ramadanDonors.donors || []}
                      type="donors"
                      currentUserId={currentUserId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="referrals" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Рейтинг Рамадана</CardTitle>
                    <p className="text-xs text-muted-foreground">{getRamadanDateRange()}</p>
                  </CardHeader>
                  <CardContent>
                    <RatingList
                      items={ramadanReferrals.referrals || []}
                      type="referrals"
                      currentUserId={currentUserId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  )
}

