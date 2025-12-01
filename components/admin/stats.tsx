import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Target, TrendingUp } from "lucide-react"

function formatCurrencyRub(value: number) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${Math.round(value)} ₽`
  }
}

export async function AdminStats() {
  const authToken = process.env.API_AUTH_TOKEN
  if (!authToken) {
    console.error("[Admin Stats] API_AUTH_TOKEN not configured")
    // Return empty stats if token is missing
    const stats = [
      { title: "Всего собрано", value: formatCurrencyRub(0), icon: DollarSign },
      { title: "Активных доноров", value: "0", icon: Users },
      { title: "Активных кампаний", value: "0", icon: Target },
      { title: "Средний чек", value: formatCurrencyRub(0), icon: TrendingUp },
    ] as const
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/stats`, {
    headers: { Authorization: `Bearer ${authToken}` },
    cache: "no-store",
  })
  const data = res.ok ? await res.json() : { total_collected: 0, active_donors: 0, active_campaigns: 0, average_check: 0 }

  const stats = [
    { title: "Всего собрано", value: formatCurrencyRub(Number(data.total_collected || 0)), icon: DollarSign },
    { title: "Активных доноров", value: String(data.active_donors || 0), icon: Users },
    { title: "Активных кампаний", value: String(data.active_campaigns || 0), icon: Target },
    { title: "Средний чек", value: formatCurrencyRub(Number(data.average_check || 0)), icon: TrendingUp },
  ] as const

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
