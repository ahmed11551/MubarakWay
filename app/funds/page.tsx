import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function FundsPage() {
  // TODO: Fetch funds from database
  const funds = [
    {
      id: "1",
      name: "Islamic Relief",
      nameAr: "الإغاثة الإسلامية",
      description: "Providing humanitarian aid worldwide",
      category: "general",
      logoUrl: "/placeholder.svg?key=relief",
      isVerified: true,
      totalRaised: 1250000,
      donorCount: 5420,
    },
    {
      id: "2",
      name: "Orphan Care Foundation",
      nameAr: "مؤسسة رعاية الأيتام",
      description: "Supporting orphans and vulnerable children",
      category: "orphans",
      logoUrl: "/placeholder.svg?key=orphan",
      isVerified: true,
      totalRaised: 850000,
      donorCount: 3210,
    },
    {
      id: "3",
      name: "Water for Life",
      nameAr: "الماء للحياة",
      description: "Building wells and water systems in need",
      category: "water",
      logoUrl: "/placeholder.svg?key=water",
      isVerified: true,
      totalRaised: 620000,
      donorCount: 2890,
    },
    {
      id: "4",
      name: "Education First",
      nameAr: "التعليم أولاً",
      description: "Providing education to underprivileged communities",
      category: "education",
      logoUrl: "/placeholder.svg?key=edu",
      isVerified: true,
      totalRaised: 540000,
      donorCount: 2150,
    },
    {
      id: "5",
      name: "Medical Aid Network",
      nameAr: "شبكة المساعدات الطبية",
      description: "Healthcare services for those in need",
      category: "healthcare",
      logoUrl: "/placeholder.svg?key=med",
      isVerified: true,
      totalRaised: 780000,
      donorCount: 3450,
    },
    {
      id: "6",
      name: "Emergency Relief Fund",
      nameAr: "صندوق الإغاثة الطارئة",
      description: "Rapid response to disasters and emergencies",
      category: "emergency",
      logoUrl: "/placeholder.svg?key=emer",
      isVerified: true,
      totalRaised: 920000,
      donorCount: 4120,
    },
  ]

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
  return (
    <Link href={`/funds/${fund.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={fund.logoUrl || "/placeholder.svg"} alt={fund.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                    {fund.name}
                    {fund.isVerified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-1">{fund.nameAr}</p>
                </div>
                <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                  {fund.category}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-2 line-clamp-2">{fund.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{(fund.totalRaised / 1000).toFixed(0)}k ₽ собрано</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{fund.donorCount.toLocaleString()} доноров</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
