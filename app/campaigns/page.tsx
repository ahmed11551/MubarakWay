import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TrendingUp, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { CampaignCard } from "@/components/campaign-card"

export default function CampaignsPage() {
  // TODO: Fetch campaigns from database
  const campaigns = [
    {
      id: "1",
      title: "Помощь в строительстве колодцев в сельских районах",
      description: "Обеспечение доступа к чистой воде для нуждающихся сообществ",
      goalAmount: 1500000,
      currentAmount: 934000,
      category: "вода",
      imageUrl: "/water-well-construction.jpg",
      donorCount: 245,
      daysLeft: 12,
      creatorName: "Ахмед Хасан",
    },
    {
      id: "2",
      title: "Медицинское лечение для детей",
      description: "Поддержка жизненно важного медицинского лечения для нуждающихся детей",
      goalAmount: 1125000,
      currentAmount: 667500,
      category: "медицина",
      imageUrl: "/children-medical-care.jpg",
      donorCount: 178,
      daysLeft: 8,
      creatorName: "Фатима Али",
    },
    {
      id: "3",
      title: "Образовательный фонд для сирот",
      description: "Обеспечение качественного образования и школьных принадлежностей для детей-сирот",
      goalAmount: 750000,
      currentAmount: 750000,
      category: "образование",
      imageUrl: "/children-education.jpg",
      donorCount: 312,
      daysLeft: 0,
      creatorName: "Омар Ибрагим",
    },
  ]

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">Кампании</h1>
            <p className="text-sm text-muted-foreground mt-1">Поддержите общественные инициативы</p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Создать
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="active" className="flex items-center justify-center gap-1.5 py-2.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              <span>Активные</span>
            </TabsTrigger>
            <TabsTrigger value="ending" className="flex items-center justify-center gap-1.5 py-2.5 text-xs">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Скоро завершатся</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center justify-center gap-1.5 py-2.5 text-xs">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Завершённые</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {campaigns
              .filter((c) => c.daysLeft > 0 && c.currentAmount < c.goalAmount)
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </TabsContent>

          <TabsContent value="ending" className="space-y-4 mt-4">
            {campaigns
              .filter((c) => c.daysLeft > 0 && c.daysLeft <= 7)
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-4">
            {campaigns
              .filter((c) => c.currentAmount >= c.goalAmount)
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  )
}
