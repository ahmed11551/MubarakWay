"use client"

import { useState, useEffect } from "react"
// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { User, Award, Calendar, Download, Filter } from "lucide-react"
import Link from "next/link"
import { getUserDonations } from "@/lib/actions/donations"
import { SubscriptionsManager } from "@/components/subscriptions-manager"
import { AvatarUpload } from "@/components/avatar-upload"
import { FundReportsTab } from "@/components/fund-reports-tab"
import { DonationsChart } from "@/components/donations-chart"
import { getProfile } from "@/lib/actions/profile"
import { toast } from "sonner"

type Transaction = {
  id: string
  date: string
  type: string
  amount: number
  fund: string
  status: string
}

export default function ProfilePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch profile data
  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true)
      try {
        const result = await getProfile()
        if (result.error) {
          console.error("Error loading profile:", result.error)
          // Показываем ошибку только если это не проблема авторизации
          // И только один раз, чтобы не дублировать уведомления
          if (!result.error.includes("logged in") && !result.error.includes("authenticated")) {
            toast.error("Не удалось загрузить профиль. Попробуйте обновить страницу.", {
              id: "profile-load-error", // Уникальный ID для предотвращения дубликатов
            })
          }
        } else {
          setProfile(result.profile)
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast.error("Ошибка при загрузке профиля. Попробуйте обновить страницу.", {
          id: "profile-load-error", // Уникальный ID для предотвращения дубликатов
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [])

  // Fetch real donations data
  useEffect(() => {
    async function loadDonations() {
      setIsLoading(true)
      try {
        const result = await getUserDonations()
        
        // Если есть реальная ошибка (не просто отсутствие авторизации)
        if (result.error) {
          console.error("Error loading donations:", result.error)
          toast.error(result.error, {
            id: "donations-load-error", // Уникальный ID для предотвращения дубликатов
          })
          setTransactions([])
          return
        }

        // Если нет пожертвований - это нормально
        if (!result.donations || result.donations.length === 0) {
          setTransactions([])
          return
        }

        // Transform donations to transactions
        const transformed: Transaction[] = result.donations.map((donation: any) => {
          const date = new Date(donation.created_at)
          const typeMap: Record<string, string> = {
            one_time: donation.category === "zakat" ? "Закят" : "Пожертвование",
            recurring: "Подписка",
          }
          const fundName =
            donation.funds?.name || donation.campaigns?.title || "Без указания фонда"

          return {
            id: donation.id || `TXN-${date.getFullYear()}-${String(donation.id || Math.random()).slice(-3)}`,
            date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }),
            type: typeMap[donation.donation_type] || "Пожертвование",
            amount: Number(donation.amount || 0),
            fund: fundName,
            status: donation.status === "completed" ? "Завершено" : donation.status === "pending" ? "В обработке" : "Отменено",
          }
        })

        setTransactions(transformed)
      } catch (error) {
        console.error("Failed to load donations:", error)
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
        toast.error(`Ошибка при загрузке данных: ${errorMessage}`, {
          id: "donations-load-error", // Уникальный ID для предотвращения дубликатов
        })
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDonations()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions]

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus)
    }

    setFilteredTransactions(filtered)
  }, [transactions, filterType, filterStatus])

  // Export to CSV or PDF
  const handleExport = async (format: "csv" | "pdf" = "csv") => {
    if (filteredTransactions.length === 0) {
      toast.error("Нет данных для экспорта")
      return
    }

    try {
      if (format === "csv") {
        // Use API for CSV export
        const params = new URLSearchParams({
          format: "csv",
          ...(filterType !== "all" && { type: filterType }),
          ...(filterStatus !== "all" && { status: filterStatus }),
        })

        const response = await fetch(`/api/export/history?${params.toString()}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Ошибка при экспорте")
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `donations_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("CSV экспорт выполнен успешно")
      } else {
        // PDF export using client-side generation
        const { downloadDonationsPDF } = await import("@/lib/utils/pdf-export")
        
        const records = filteredTransactions.map((t) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          amount: t.amount,
          currency: "RUB", // Default currency
          recipient: t.fund,
          status: t.status,
        }))

        await downloadDonationsPDF(records, `donations_${new Date().toISOString().split("T")[0]}.pdf`, profile?.display_name)
        toast.success("PDF экспорт выполнен успешно")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error(error instanceof Error ? error.message : "Ошибка при экспорте")
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilterType("all")
    setFilterStatus("all")
  }

  const hasActiveFilters = filterType !== "all" || filterStatus !== "all"
  const displayTransactions = hasActiveFilters ? filteredTransactions : transactions
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Профиль пользователя */}
        <Card className="border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-4">
              {isLoadingProfile ? (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <User className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name || "U"}
                  userId={profile?.id}
                  onAvatarChange={(newUrl) => {
                    setProfile((prev: any) => ({ ...prev, avatar_url: newUrl }))
                  }}
                  size="md"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {isLoadingProfile ? "Загрузка..." : profile?.display_name || "Пользователь"}
                </CardTitle>
                <CardDescription>
                  {profile?.created_at
                    ? `Участник с ${new Date(profile.created_at).toLocaleDateString("ru-RU", {
                        month: "long",
                        year: "numeric",
                      })}`
                    : "Участник"}
                </CardDescription>
                {profile?.subscription_tier && profile.subscription_tier !== "free" && (
                  <Badge className="mt-2 bg-accent">
                    {profile.subscription_tier === "mutahsin_pro"
                      ? "Мутахсин Pro"
                      : profile.subscription_tier === "sahib_al_waqf_premium"
                        ? "Сахиб аль-Вакф Premium"
                        : profile.subscription_tier}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-primary/15 bg-card/90 p-4 shadow-sm">
                <div className="text-3xl font-extrabold text-primary tracking-tight">24</div>
                <div className="text-[11px] text-muted-foreground mt-1">Пожертвований</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-accent/20 bg-card/90 p-4 shadow-sm">
                <div className="text-3xl font-extrabold text-accent tracking-tight">
                  {profile?.total_donated
                    ? `${Number(profile.total_donated).toLocaleString("ru-RU")} ₽`
                    : "0 ₽"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">Всего отдано</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-primary/15 bg-card/90 p-4 shadow-sm">
                <div className="text-3xl font-extrabold text-primary tracking-tight">8</div>
                <div className="text-[11px] text-muted-foreground mt-1">Кампаний</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* История и отчёты */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 gap-1.5 p-1 bg-muted/50 h-auto rounded-lg">
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground transition-all text-xs sm:text-sm px-2 py-2.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              <span className="truncate block w-full text-center">История</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground transition-all text-xs sm:text-sm px-2 py-2.5 min-w-0"
            >
              Подписки
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground transition-all text-xs sm:text-sm px-2 py-2.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              <span className="truncate block w-full text-center">Отчёты</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <DonationsChart />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-bold text-center sm:text-left w-full sm:w-auto">История транзакций</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                      <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Фильтр</span>
                      {(filterType !== "all" || filterStatus !== "all") && (
                        <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                          {(filterType !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Фильтры транзакций</DialogTitle>
                      <DialogDescription>Выберите критерии для фильтрации истории транзакций</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="filter-type">Тип транзакции</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger id="filter-type">
                            <SelectValue placeholder="Все типы" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все типы</SelectItem>
                            <SelectItem value="Пожертвование">Пожертвование</SelectItem>
                            <SelectItem value="Подписка">Подписка</SelectItem>
                            <SelectItem value="Кампания">Кампания</SelectItem>
                            <SelectItem value="Закят">Закят</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filter-status">Статус</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger id="filter-status">
                            <SelectValue placeholder="Все статусы" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            <SelectItem value="Завершено">Завершено</SelectItem>
                            <SelectItem value="В обработке">В обработке</SelectItem>
                            <SelectItem value="Отменено">Отменено</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={handleResetFilters}>
                          Сбросить
                        </Button>
                        <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                          Применить
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport("csv")} 
                  disabled={transactions.length === 0}
                  title={transactions.length === 0 ? "Нет данных для экспорта" : "Экспортировать в CSV"}
                  className="flex-1 sm:flex-initial"
                >
                  <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Экспорт</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка транзакций...</div>
            ) : displayTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Нет транзакций</p>
                <p className="text-sm mt-2">Транзакции появятся здесь после совершения пожертвований</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayTransactions.map((transaction) => {
                  return (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{transaction.type}</Badge>
                              <span className="text-xs text-muted-foreground">{transaction.id}</span>
                            </div>
                            <p className="font-semibold">{transaction.fund}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{transaction.date}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xl font-bold text-primary">{transaction.amount} RUB</p>
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold">Мои подписки</h3>
            </div>
            <SubscriptionsManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <FundReportsTab />
          </TabsContent>
        </Tabs>

        {/* Достижения */}
        <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-accent" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "★", title: "Первое пожертвование", unlocked: true },
                { icon: "◆", title: "10 пожертвований", unlocked: true },
                { icon: "▲", title: "Топ донор месяца", unlocked: false },
                { icon: "●", title: "Регулярный донор", unlocked: true },
                { icon: "■", title: "50 000 ₽ отдано", unlocked: true },
                { icon: "★", title: "Создатель кампании", unlocked: false },
              ].map((achievement, i) => (
                <div
                  key={i}
                  className={`text-center p-3.5 rounded-xl border-2 transition-all duration-200 ${
                    achievement.unlocked 
                      ? "bg-background/80 border-accent/30 shadow-md hover:shadow-lg hover:scale-105" 
                      : "bg-muted/40 border-muted/50 opacity-60 grayscale"
                  }`}
                >
                  <div className="text-3xl mb-2 leading-none">{achievement.icon}</div>
                  <div className="text-[10px] sm:text-xs font-medium leading-tight min-h-[2.5rem] flex items-center justify-center">
                    {achievement.title}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
