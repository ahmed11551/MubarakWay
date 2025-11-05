import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Award, Calendar, Download, Filter } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Профиль пользователя */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
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
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-xs text-muted-foreground">Пожертвований</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-accent">45 600 ₽</div>
                <div className="text-xs text-muted-foreground">Всего отдано</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-primary">8</div>
                <div className="text-xs text-muted-foreground">Кампаний</div>
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
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтр
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {[
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
              ].map((transaction) => (
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
                        <p className="text-xl font-bold text-primary">{transaction.amount} ₽</p>
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
                        <p className="font-bold text-primary">{report.collected.toLocaleString("ru-RU")} ₽</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Распределено</p>
                        <p className="font-bold text-accent">{report.distributed.toLocaleString("ru-RU")} ₽</p>
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
