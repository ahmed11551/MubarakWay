"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface FundReport {
  fund: {
    id: string
    name: string
    logo_url?: string
  }
  statistics: {
    totalDonations: number
    donationCount: number
    campaignCount: number
  }
  donations: Array<{
    id: string
    amount: number
    created_at: string
    status: string
  }>
}

export function FundReportsTab() {
  const [fundsReports, setFundsReports] = useState<FundReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFund, setSelectedFund] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")

  useEffect(() => {
    async function loadFundsReports() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/reports/funds")
        if (!response.ok) {
          throw new Error("Не удалось загрузить отчёты")
        }
        const data = await response.json()
        
        if (data.funds) {
          // Transform data to match our interface
          const reports: FundReport[] = data.funds.map((fund: any) => ({
            fund: {
              id: fund.id,
              name: fund.name,
              logo_url: fund.logo_url,
            },
            statistics: fund.statistics || {
              totalDonations: 0,
              donationCount: 0,
              campaignCount: 0,
            },
            donations: [], // Will be loaded separately if needed
          }))
          setFundsReports(reports)
        }
      } catch (error) {
        console.error("Failed to load fund reports:", error)
        toast.error("Не удалось загрузить отчёты фондов")
      } finally {
        setIsLoading(false)
      }
    }
    loadFundsReports()
  }, [])

  // Filter reports
  const filteredReports = fundsReports.filter((report) => {
    if (selectedFund !== "all" && report.fund.id !== selectedFund) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (filteredReports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Пока нет отчётов фондов</p>
          <p className="text-xs mt-2">Отчёты появятся после первых пожертвований</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-center sm:text-left w-full sm:w-auto">Отчёты фондов</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedFund} onValueChange={setSelectedFund}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Все фонды" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все фонды</SelectItem>
              {fundsReports.map((report) => (
                <SelectItem key={report.fund.id} value={report.fund.id}>
                  {report.fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredReports.map((report) => {
          const status = report.statistics.totalDonations > 0 ? "Активен" : "Нет данных"
          const period = new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })

          return (
            <Card key={report.fund.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{report.fund.name}</CardTitle>
                    <CardDescription>{period}</CardDescription>
                  </div>
                  <Badge
                    className={
                      status === "Активен"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }
                  >
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Собрано</p>
                    <p className="font-bold text-primary">
                      {report.statistics.totalDonations.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Пожертвований</p>
                    <p className="font-bold text-accent">
                      {report.statistics.donationCount.toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Button variant="outline" className="w-full bg-transparent" size="sm" asChild>
                    <Link href={`/funds/${report.fund.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Подробнее о фонде
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

