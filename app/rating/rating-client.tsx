"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Link2, Calendar } from "lucide-react"
import { getAnimalAvatar } from "@/lib/utils/animal-avatars"
import { getRamadanDateRange, getCurrentRamadanPeriod } from "@/lib/utils/ramadan"

interface RatingData {
  donors: any[]
  referrals: any[]
  error?: string
}

interface RatingClientProps {
  allTimeDonors: RatingData
  ramadanDonors: RatingData
  allTimeReferrals: RatingData
  ramadanReferrals: RatingData
  currentUserId: string | null
}

export function RatingClient({
  allTimeDonors,
  ramadanDonors,
  allTimeReferrals,
  ramadanReferrals,
  currentUserId,
}: RatingClientProps) {
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

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Рейтинг</h1>
        <p className="text-sm text-muted-foreground">Топ доноров и рефералов платформы</p>
      </div>

      <Tabs defaultValue="all-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-time">Общий рейтинг</TabsTrigger>
          <TabsTrigger value="ramadan">Рейтинг Рамадана</TabsTrigger>
        </TabsList>

        {/* All Time Tab */}
        <TabsContent value="all-time" className="space-y-6 mt-6">
          <Tabs defaultValue="donors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donors" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Топ доноров
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Топ по ссылкам
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donors" className="space-y-3 mt-4">
              {allTimeDonors.error ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Ошибка загрузки данных</p>
                    <p className="text-xs text-destructive mt-2">{allTimeDonors.error}</p>
                  </CardContent>
                </Card>
              ) : allTimeDonors.donors.length > 0 ? (
                allTimeDonors.donors.map((donor, index) => {
                  const rank = index + 1
                  const isCurrentUser = currentUserId === donor.user_id
                  const avatar = getAnimalAvatar(donor.user_id)

                  return (
                    <Card
                      key={donor.user_id}
                      className={isCurrentUser ? "border-primary border-2" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRankBadge(rank)}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback>{avatar.emoji}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {donor.display_name || "Анонимный пользователь"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(Number(donor.total_donated || 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Нет данных</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="referrals" className="space-y-3 mt-4">
              {allTimeReferrals.error ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Ошибка загрузки данных</p>
                    <p className="text-xs text-destructive mt-2">{allTimeReferrals.error}</p>
                  </CardContent>
                </Card>
              ) : allTimeReferrals.referrals.length > 0 ? (
                allTimeReferrals.referrals.map((referral, index) => {
                  const rank = index + 1
                  const isCurrentUser = currentUserId === referral.user_id
                  const avatar = getAnimalAvatar(referral.user_id)

                  return (
                    <Card
                      key={referral.user_id}
                      className={isCurrentUser ? "border-primary border-2" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRankBadge(rank)}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback>{avatar.emoji}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {referral.display_name || "Анонимный пользователь"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {referral.referral_count || 0} рефералов
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Нет данных</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Ramadan Tab */}
        <TabsContent value="ramadan" className="space-y-6 mt-6">
          {(() => {
            const ramadanPeriod = getCurrentRamadanPeriod()
            const ramadanRangeStr = getRamadanDateRange()
            return ramadanPeriod ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Период Рамадана
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {ramadanRangeStr}
                  </p>
                </CardContent>
              </Card>
            ) : null
          })()}

          <Tabs defaultValue="donors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donors" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Топ доноров
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Топ по ссылкам
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donors" className="space-y-3 mt-4">
              {ramadanDonors.error ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Ошибка загрузки данных</p>
                    <p className="text-xs text-destructive mt-2">{ramadanDonors.error}</p>
                  </CardContent>
                </Card>
              ) : ramadanDonors.donors.length > 0 ? (
                ramadanDonors.donors.map((donor, index) => {
                  const rank = index + 1
                  const isCurrentUser = currentUserId === donor.user_id
                  const avatar = getAnimalAvatar(donor.user_id)

                  return (
                    <Card
                      key={donor.user_id}
                      className={isCurrentUser ? "border-primary border-2" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRankBadge(rank)}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback>{avatar.emoji}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {donor.display_name || "Анонимный пользователь"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(Number(donor.total_donated || 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Нет данных за период Рамадана</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="referrals" className="space-y-3 mt-4">
              {ramadanReferrals.error ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Ошибка загрузки данных</p>
                    <p className="text-xs text-destructive mt-2">{ramadanReferrals.error}</p>
                  </CardContent>
                </Card>
              ) : ramadanReferrals.referrals.length > 0 ? (
                ramadanReferrals.referrals.map((referral, index) => {
                  const rank = index + 1
                  const isCurrentUser = currentUserId === referral.user_id
                  const avatar = getAnimalAvatar(referral.user_id)

                  return (
                    <Card
                      key={referral.user_id}
                      className={isCurrentUser ? "border-primary border-2" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRankBadge(rank)}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback>{avatar.emoji}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {referral.display_name || "Анонимный пользователь"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {referral.referral_count || 0} рефералов
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Нет данных за период Рамадана</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </main>
  )
}

