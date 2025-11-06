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

export default async function FundsPage() {
  // Fetch funds from API (bot.e-replika.ru) or Supabase fallback
  const result = await getFunds()
  const funds = result.funds || []

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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="whitespace-nowrap text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {funds.map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </TabsContent>

          {categories.slice(1).map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="space-y-4 mt-4">
              {funds
                .filter((f) => f.category === cat.value)
                .map((fund) => (
                  <FundCard key={fund.id} fund={fund} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
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

  return (
    <Link href={`/funds/${fund.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
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
                  {category}
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
