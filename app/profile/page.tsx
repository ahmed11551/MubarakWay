"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
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

  // Fetch real donations data
  useEffect(() => {
    async function loadDonations() {
      try {
        const result = await getUserDonations()
        if (result.error) {
          console.error("Error loading donations:", result.error)
          // Use mock data as fallback
          setTransactions([
            {
              id: "TXN-2025-001",
              date: "15 янв 2025",
              type: "Пожертвование",
              amount: 1000,
              fund: "Исламский фонд помощи",
              status: "Завершено",
            },
            {
              id: "TXN-2025-002",
              date: "10 янв 2025",
              type: "Подписка",
              amount: 260,
              fund: "MubarakWay",
              status: "Завершено",
            },
            {
              id: "TXN-2025-003",
              date: "8 янв 2025",
              type: "Кампания",
              amount: 500,
              fund: "Строительство колодцев",
              status: "Завершено",
            },
            {
              id: "TXN-2025-004",
              date: "5 янв 2025",
              type: "Закят",
              amount: 5000,
              fund: "Фонд помощи сиротам",
              status: "Завершено",
            },
          ])
          return
        }

        // Transform donations to transactions
        const transformed: Transaction[] = (result.donations || []).map((donation: any) => {
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

  // Export to CSV
  const handleExport = () => {
    const dataToExport = filterType !== "all" || filterStatus !== "all" ? filteredTransactions : transactions
    
    if (dataToExport.length === 0) {
      alert("Нет данных для экспорта")
      return
    }

    const csv = [
      ["ID", "Дата", "Тип", "Сумма", "Фонд/Кампания", "Статус"],
      ...dataToExport.map((t) => [
        t.id,
        t.date,
        t.type,
        t.amount.toString(),
        t.fund,
        t.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Ахмед Исламов</CardTitle>
                <CardDescription>Участник с января 2025</CardDescription>
                <Badge className="mt-2 bg-accent">Мутахсин Pro</Badge>
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
                <div className="text-3xl font-extrabold text-accent tracking-tight">45 600 RUB</div>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">История транзакций</TabsTrigger>
            <TabsTrigger value="reports">Отчёты фондов</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">История транзакций</h3>
              <div className="flex gap-2">
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Фильтр
                      {(filterType !== "all" || filterStatus !== "all") && (
                        <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
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
                  onClick={handleExport} 
                  disabled={transactions.length === 0}
                  title={transactions.length === 0 ? "Нет данных для экспорта" : "Экспортировать в CSV"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
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
                {displayTransactions.map((transaction) => (
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Отчёты фондов</h3>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
            </div>

            <div className="space-y-3">
              {[
                {
                  fund: "Исламский фонд помощи",
                  period: "Декабрь 2024",
                  collected: 2450000,
                  distributed: 2300000,
                  status: "Подтверждено",
                  reportUrl: "#",
                },
                {
                  fund: "Фонд помощи сиротам",
                  period: "Декабрь 2024",
                  collected: 1890000,
                  distributed: 1850000,
                  status: "Подтверждено",
                  reportUrl: "#",
                },
                {
                  fund: "Строительство колодцев",
                  period: "Январь 2025",
                  collected: 745000,
                  distributed: 0,
                  status: "В процессе",
                  reportUrl: null,
                },
              ].map((report, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{report.fund}</CardTitle>
                        <CardDescription>{report.period}</CardDescription>
                      </div>
                      <Badge
                        className={
                          report.status === "Подтверждено"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Собрано</p>
                        <p className="font-bold text-primary">{report.collected.toLocaleString("ru-RU")} RUB</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Распределено</p>
                        <p className="font-bold text-accent">{report.distributed.toLocaleString("ru-RU")} RUB</p>
                      </div>
                    </div>
                    {report.reportUrl && (
                      <Button variant="outline" className="w-full bg-transparent" size="sm" asChild>
                        <Link href={report.reportUrl}>
                          <Download className="h-4 w-4 mr-2" />
                          Скачать отчёт (PDF)
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Достижения */}
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🌟", title: "Первое пожертвование", unlocked: true },
                { icon: "💎", title: "10 пожертвований", unlocked: true },
                { icon: "👑", title: "Топ донор месяца", unlocked: false },
                { icon: "🎯", title: "Регулярный донор", unlocked: true },
                { icon: "🏆", title: "50 000 ₽ отдано", unlocked: true },
                { icon: "⭐", title: "Создатель кампании", unlocked: false },
              ].map((achievement, i) => (
                <div
                  key={i}
                  className={`text-center p-3 rounded-lg border ${
                    achievement.unlocked ? "bg-accent/5 border-accent/20" : "bg-muted/50 border-muted opacity-50"
                  }`}
                >
                  <div className="text-3xl mb-1">{achievement.icon}</div>
                  <div className="text-xs font-medium">{achievement.title}</div>
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
