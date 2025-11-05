import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, Heart, Calendar, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Fetch campaign from database
  const campaign = {
    id,
    title: "Помощь в строительстве колодцев в сельских районах",
    description: "Обеспечение доступа к чистой воде для нуждающихся сообществ в сельских регионах",
    story:
      "Доступ к чистой воде — это фундаментальное право человека, однако миллионы людей в сельских районах до сих пор не имеют этой базовой необходимости. Эта кампания направлена на строительство устойчивых колодцев в отдалённых деревнях, обеспечивая чистой питьевой водой семьи, которые в настоящее время проходят мили каждый день, чтобы набрать воду из небезопасных источников.\n\nВаше пожертвование будет напрямую финансировать строительство глубоких колодцев, оснащённых ручными насосами, обеспечивая долгосрочный доступ к чистой воде. Каждый колодец обслуживает примерно 500 человек и включает обучение местных сообществ по обслуживанию.\n\nВместе мы можем оказать долгосрочное влияние на здоровье и благополучие этих сообществ.",
    goalAmount: 1500000,
    currentAmount: 934000,
    category: "вода",
    imageUrl: "/water-well-construction.jpg",
    donorCount: 245,
    daysLeft: 12,
    deadline: "2025-01-20",
    creatorName: "Ахмед Хасан",
    creatorAvatar: "/abstract-profile.png",
    createdAt: "2024-12-15",
    updates: [
      {
        id: "1",
        title: "Первый колодец завершён!",
        content:
          "Мы рады сообщить, что первый колодец был успешно завершён и теперь обеспечивает чистой водой 500 человек в деревне Аль-Нур. Спасибо за вашу поддержку!",
        imageUrl: "/completed-water-well.jpg",
        createdAt: "2025-01-05",
      },
      {
        id: "2",
        title: "Обновление хода строительства",
        content:
          "Работа над вторым колодцем идёт хорошо. Буровая бригада достигла глубины 80 метров, и мы ожидаем достичь водоносного слоя в ближайшие дни.",
        createdAt: "2025-01-02",
      },
    ],
    recentDonors: [
      { name: "Сара М.", amount: 7500, isAnonymous: false, createdAt: "2 часа назад" },
      { name: "Аноним", amount: 18750, isAnonymous: true, createdAt: "5 часов назад" },
      { name: "Мухаммед К.", amount: 3750, isAnonymous: false, createdAt: "1 день назад" },
    ],
  }

  if (!campaign) {
    notFound()
  }

  const progress = (campaign.currentAmount / campaign.goalAmount) * 100

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto">
        {/* Campaign Image */}
        <div className="aspect-video bg-muted relative">
          <img
            src={campaign.imageUrl || "/placeholder.svg"}
            alt={campaign.title}
            className="object-cover w-full h-full"
          />
          <Badge className="absolute top-4 left-4 capitalize">{campaign.category}</Badge>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Campaign Header */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-balance">{campaign.title}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>

            {/* Creator Info */}
            <div className="flex items-center gap-3 pt-2">
              <Avatar>
                <AvatarImage src={campaign.creatorAvatar || "/placeholder.svg"} />
                <AvatarFallback>{campaign.creatorName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{campaign.creatorName}</p>
                <p className="text-xs text-muted-foreground">Создатель кампании</p>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-primary">
                    {campaign.currentAmount.toLocaleString("ru-RU")} ₽
                  </span>
                  <span className="text-sm text-muted-foreground">
                    из {campaign.goalAmount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {campaign.donorCount} жертвователей
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {campaign.daysLeft} дней осталось
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" size="lg" asChild>
                  <Link href={`/donate?campaign=${campaign.id}`}>
                    <Heart className="h-4 w-4 mr-2" />
                    Пожертвовать
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="story" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="story">История</TabsTrigger>
              <TabsTrigger value="updates">Обновления</TabsTrigger>
              <TabsTrigger value="donors">Жертвователи</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>История кампании</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  {campaign.story.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="updates" className="space-y-4 mt-4">
              {campaign.updates.map((update) => (
                <Card key={update.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{update.title}</CardTitle>
                        <CardDescription className="text-xs">{update.createdAt}</CardDescription>
                      </div>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-relaxed">{update.content}</p>
                    {update.imageUrl && (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={update.imageUrl || "/placeholder.svg"}
                          alt={update.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="donors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Недавние жертвователи</CardTitle>
                  <CardDescription>{campaign.donorCount} человек пожертвовали на эту кампанию</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.recentDonors.map((donor, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{donor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">{donor.createdAt}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {donor.amount.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
