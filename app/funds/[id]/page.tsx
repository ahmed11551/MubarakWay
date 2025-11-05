import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Heart, ExternalLink, Mail, Users, TrendingUp, Globe } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Fetch fund from database
  const fund = {
    id,
    name: "Islamic Relief",
    nameAr: "الإغاثة الإسلامية",
    description: "Предоставление гуманитарной помощи по всему миру",
    descriptionAr: "تقديم المساعدات الإنسانية في جميع أنحاء العالم",
    fullDescription:
      "Islamic Relief — ведущая международная гуманитарная организация, посвящённая борьбе с бедностью и страданиями по всему миру. Более 30 лет мы работаем в более чем 40 странах, предоставляя экстренную помощь, программы устойчивого развития и защиту прав наиболее уязвимых сообществ.\n\nНаша работа охватывает множество секторов, включая образование, здравоохранение, водоснабжение и санитарию, поддержку средств к существованию и экстренное реагирование. Мы верим в расширение возможностей сообществ для построения устойчивого будущего, сохраняя достоинство и уважение ко всем.",
    category: "general",
    logoUrl: "/placeholder.svg?key=relief-logo",
    isVerified: true,
    totalRaised: 1250000,
    donorCount: 5420,
    websiteUrl: "https://islamic-relief.org",
    contactEmail: "info@islamic-relief.org",
    impactStats: [
      { label: "Людей помогли", value: "50,000+" },
      { label: "Стран", value: "40+" },
      { label: "Проектов", value: "200+" },
      { label: "Лет работы", value: "30+" },
    ],
    recentDonations: [
      { name: "Ахмед К.", amount: 500, createdAt: "2 часа назад" },
      { name: "Анонимно", amount: 1000, createdAt: "5 часов назад" },
      { name: "Фатима М.", amount: 250, createdAt: "1 день назад" },
      { name: "Омар С.", amount: 100, createdAt: "1 день назад" },
      { name: "Сара А.", amount: 750, createdAt: "2 дня назад" },
    ],
    projects: [
      {
        id: "1",
        title: "Экстренная раздача продуктов",
        description: "Предоставление продуктовых наборов семьям, пострадавшим от стихийных бедствий",
        imageUrl: "/placeholder.svg?key=food",
        beneficiaries: 5000,
      },
      {
        id: "2",
        title: "Инициатива чистой воды",
        description: "Строительство колодцев и систем фильтрации воды в сельских общинах",
        imageUrl: "/placeholder.svg?key=water-init",
        beneficiaries: 10000,
      },
      {
        id: "3",
        title: "Программа поддержки образования",
        description: "Предоставление школьных принадлежностей и стипендий детям из малообеспеченных семей",
        imageUrl: "/placeholder.svg?key=edu-support",
        beneficiaries: 3000,
      },
    ],
  }

  if (!fund) {
    notFound()
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto">
        {/* Fund Header */}
        <div className="px-4 py-6 space-y-4 border-b">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={fund.logoUrl || "/placeholder.svg"} alt={fund.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h1 className="text-xl font-bold line-clamp-2">{fund.name}</h1>
                {fund.isVerified && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{fund.nameAr}</p>
              <Badge variant="secondary" className="capitalize">
                {fund.category}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{fund.description}</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Всего собрано</p>
                    <p className="text-lg font-bold">{(fund.totalRaised / 1000).toFixed(0)}k ₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Доноров</p>
                    <p className="text-lg font-bold">{fund.donorCount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button className="flex-1" size="lg" asChild>
              <Link href={`/donate?fund=${fund.id}`}>
                <Heart className="h-4 w-4 mr-2" />
                Пожертвовать
              </Link>
            </Button>
            {fund.websiteUrl && (
              <Button variant="outline" size="lg" asChild>
                <a href={fund.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Сайт
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">О фонде</TabsTrigger>
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="donors">Доноры</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              {/* Full Description */}
              <Card>
                <CardHeader>
                  <CardTitle>О {fund.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fund.fullDescription.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>

              {/* Impact Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Наше влияние</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {fund.impactStats.map((stat, i) => (
                      <div key={i} className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Контактная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fund.websiteUrl && (
                    <a
                      href={fund.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{fund.websiteUrl}</span>
                    </a>
                  )}
                  {fund.contactEmail && (
                    <a
                      href={`mailto:${fund.contactEmail}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{fund.contactEmail}</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4 mt-4">
              {fund.projects.map((project) => (
                <Card key={project.id}>
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={project.imageUrl || "/placeholder.svg"}
                      alt={project.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <CardDescription className="text-xs">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {project.beneficiaries.toLocaleString()} получателей помощи
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="donors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Недавние доноры</CardTitle>
                  <CardDescription>{fund.donorCount.toLocaleString()} человек пожертвовали этому фонду</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fund.recentDonations.map((donor, i) => (
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
                      <span className="text-sm font-semibold text-primary">{donor.amount} ₽</span>
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
