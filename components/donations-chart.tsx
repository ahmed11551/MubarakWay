"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Loader2, TrendingUp } from "lucide-react"

interface DonationsChartData {
  month: string
  amount: number
  count: number
}

const chartConfig = {
  amount: {
    label: "Сумма",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function DonationsChart() {
  const [data, setData] = useState<DonationsChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<"6months" | "12months" | "all">("6months")

  useEffect(() => {
    async function loadChartData() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/donations/chart?period=${period}`)
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные")
        }
        const result = await response.json()
        
        if (result.data) {
          // Преобразуем данные для графика
          const chartData: DonationsChartData[] = Object.entries(result.data)
            .map(([monthKey, amount]: [string, any]) => {
              const [year, month] = monthKey.split("-")
              const date = new Date(parseInt(year), parseInt(month) - 1)
              return {
                month: date.toLocaleDateString("ru-RU", { month: "short", year: "numeric" }),
                amount: Number(amount || 0),
                count: result.counts?.[monthKey] || 0,
              }
            })
            .sort((a, b) => {
              // Сортируем по дате
              const dateA = new Date(a.month)
              const dateB = new Date(b.month)
              return dateA.getTime() - dateB.getTime()
            })
          
          setData(chartData)
        }
      } catch (error) {
        console.error("Failed to load chart data:", error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    loadChartData()
  }, [period])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Нет данных для отображения</p>
          <p className="text-xs mt-2">Совершите первое пожертвование, чтобы увидеть график</p>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)
  const totalCount = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              График пожертвований
            </CardTitle>
            <CardDescription>
              Всего: {totalAmount.toLocaleString("ru-RU")} ₽ за {totalCount} {totalCount === 1 ? "пожертвование" : totalCount < 5 ? "пожертвования" : "пожертвований"}
            </CardDescription>
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 месяцев</SelectItem>
                <SelectItem value="12months">12 месяцев</SelectItem>
                <SelectItem value="all">Всё время</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DonationsChartData
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Месяц</span>
                          <span className="font-medium">{data.month}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Сумма</span>
                          <span className="font-bold text-primary">
                            {data.amount.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Количество</span>
                          <span className="font-medium">{data.count}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[8, 8, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

