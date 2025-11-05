import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminCampaignsTable } from "@/components/admin/campaigns-table"
import { AdminFundsTable } from "@/components/admin/funds-table"
import { AdminDonationsTable } from "@/components/admin/donations-table"
import { AdminStats } from "@/components/admin/stats"
import { Shield } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Админ-панель</h1>
              <p className="text-muted-foreground">Управление платформой MubarakWay</p>
            </div>
          </div>

          {/* Stats */}
          <AdminStats />

          {/* Tabs */}
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Кампании</TabsTrigger>
              <TabsTrigger value="funds">Фонды</TabsTrigger>
              <TabsTrigger value="donations">Пожертвования</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Модерация кампаний</CardTitle>
                  <CardDescription>Проверяйте и одобряйте целевые кампании пользователей</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminCampaignsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Управление фондами</CardTitle>
                  <CardDescription>Добавляйте и редактируйте фонды-партнёры</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminFundsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>История пожертвований</CardTitle>
                  <CardDescription>Просматривайте все транзакции на платформе</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminDonationsTable />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
