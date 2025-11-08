import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle, Users, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getFunds } from "@/lib/actions/funds"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export const metadata: Metadata = {
  title: "Фонды-партнёры",
  description: "Поддержите проверенные благотворительные организации. Фонды-партнёры MubarakWay с проверенной репутацией.",
  openGraph: {
    title: "Фонды-партнёры | MubarakWay",
    description: "Поддержите проверенные благотворительные организации",
    url: `${siteUrl}/funds`,
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FundsPage() {
  // Fetch funds from Supabase with error handling
  let result
  try {
    result = await getFunds()
    // Debug logging
    console.log("[FundsPage] getFunds result:", {
      fundsCount: result.funds?.length || 0,
      error: result.error,
      funds: result.funds?.map((f: any) => ({ id: f.id, name: f.name })),
    })
  } catch (error) {
    console.error("[FundsPage] Error fetching funds:", error)
    result = { funds: [], error: `Failed to load funds: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
  
  let funds = result.funds || []
  
  // Если фонды не найдены, но ошибки нет - возможно проблема с RLS или переменными окружения
  if (funds.length === 0 && !result.error) {
    console.warn("[FundsPage] No funds found but no error. Possible RLS or env vars issue.")
    result.error = "Фонды не найдены. Возможно проблема с настройками базы данных или переменными окружения."
  }
  
  // Если есть ошибка, но она связана с переменными окружения, попробуем показать более понятное сообщение
  if (result.error && result.error.includes("Missing Supabase") || result.error.includes("environment variables")) {
    console.error("[FundsPage] Environment variables issue detected")
    result.error = "Ошибка конфигурации: переменные окружения Supabase не установлены. Обратитесь к администратору."
  }
  
  // Additional debug
  if (funds.length === 0) {
    console.warn("[FundsPage] No funds to display. Result:", {
      fundsCount: funds.length,
      error: result.error,
      hasResult: !!result,
    })
  }

  const categories = [
    { value: "all", label: "Все фонды" },
    { value: "education", label: "Образование" },
    { value: "healthcare", label: "Здравоохранение" },
    { value: "water", label: "Вода" },
    { value: "orphans", label: "Сироты" },
    { value: "emergency", label: "Экстренная помощь" },
    { value: "general", label: "Общее" },
  ]

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Фонды-партнёры</h1>
          <p className="text-sm text-muted-foreground">Поддержите проверенные благотворительные организации</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск фондов..." className="pl-9" />
        </div>

        {/* Category Tabs */}
        <div className="w-full overflow-x-auto -mx-4 px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start flex-nowrap h-auto p-1.5 gap-2 bg-muted/50 min-w-max">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value} 
                  className="whitespace-nowrap text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground transition-all flex-shrink-0"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {funds.length > 0 ? (
              funds.map((fund) => (
                <FundCard key={fund.id} fund={fund} />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <p className="text-muted-foreground font-medium">Фонды не найдены</p>
                  {result.error && (
                    <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
                      Ошибка: {result.error}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Попробуйте обновить страницу или обратитесь в поддержку
                  </p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-left text-xs space-y-1">
                    <p className="font-semibold">Отладочная информация:</p>
                    <p>Фондов в результате: {funds.length}</p>
                    <p>Ошибка запроса: {result.error || "Нет"}</p>
                    <p>Статус: {result.error ? "Ошибка" : "Успешно, но пусто"}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {categories.slice(1).map((cat) => {
            // For each category, show funds that match OR the Insan fund (general category)
            const filteredFunds = funds.filter(
              (f) => f.category === cat.value || f.id === "00000000-0000-0000-0000-000000000001"
            )
            
            return (
              <TabsContent key={cat.value} value={cat.value} className="space-y-4 mt-4">
                {filteredFunds.length > 0 ? (
                  filteredFunds.map((fund) => (
                    <FundCard key={fund.id} fund={fund} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <p className="text-muted-foreground">Фонды в категории "{cat.label}" не найдены</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

function FundCard({ fund }: { fund: any }) {
  // Support both API format and Supabase format
  const name = fund.name || fund.name_ru || ""
  const nameAr = fund.name_ar || fund.nameAr || ""
  const description = fund.description || fund.description_ru || ""
  const logoUrl = fund.logo_url || fund.logoUrl || "/placeholder.svg"
  const isVerified = fund.is_verified !== undefined ? fund.is_verified : fund.isVerified || false
  const totalRaised = Number(fund.total_raised || fund.totalRaised || 0)
  const donorCount = Number(fund.donor_count || fund.donorCount || 0)
  const category = fund.category || "general"

  // Map category to readable label
  const categoryLabels: Record<string, string> = {
    education: "Образование",
    healthcare: "Здравоохранение",
    water: "Водоснабжение",
    orphans: "Помощь сиротам",
    emergency: "Экстренная помощь",
    general: "Общее",
    poverty: "Борьба с бедностью",
  }

  const categoryLabel = categoryLabels[category] || category

  return (
    <Link href={`/funds/${fund.id}`}>
      <Card className="hover:shadow-lg transition-shadow" data-card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              <Image src={logoUrl} alt={name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                    {name}
                    {isVerified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                  </CardTitle>
                  {nameAr && <p className="text-xs text-muted-foreground line-clamp-1">{nameAr}</p>}
                </div>
                <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                  {categoryLabel}
                </Badge>
              </div>
              {description && <CardDescription className="text-xs mt-2 line-clamp-2">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{totalRaised > 0 ? `${(totalRaised / 1000).toFixed(0)}k ₽ собрано` : "Новый фонд"}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{donorCount > 0 ? `${donorCount.toLocaleString()} доноров` : "Пока нет доноров"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
