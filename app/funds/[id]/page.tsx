import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Heart, ExternalLink, Mail, Users, TrendingUp, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getFundById } from "@/lib/actions/funds"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getFundById(id)

  if (result.error || !result.fund) {
    return {
      title: "Фонд не найден",
    }
  }

  const fund = result.fund
  const title = fund.name || fund.name_ru || "Фонд"
  const description = fund.description || fund.description_ru || "Поддержите этот благотворительный фонд"
  const imageUrl = fund.logo_url || `${siteUrl}/og-image.png`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | MubarakWay`,
      description,
      url: `${siteUrl}/funds/${id}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    // Fetch fund from database
    const result = await getFundById(id)
    
    if (result.error || !result.fund) {
      notFound()
    }

    const fundData = result.fund

    // Fetch recent donations for this fund
    const supabase = await createClient()
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select(`
        *,
        profiles:donor_id (display_name, avatar_url)
      `)
      .eq("fund_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10)

    if (donationsError) {
      console.error("Error fetching donations:", donationsError)
    }

    // Fetch campaigns linked to this fund
    // Note: fund_id column might not exist yet - handle gracefully
    let fundCampaigns: any[] = []
    try {
      const { data, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, title, description, goal_amount, current_amount, currency, status, image_url, created_at")
        .eq("fund_id", id)
        .order("created_at", { ascending: false })

      if (campaignsError) {
        // If fund_id column doesn't exist, campaignsError will contain the error
        // This is expected if migration hasn't been run yet
        console.warn("Error fetching campaigns (fund_id column might not exist):", campaignsError.message)
        fundCampaigns = []
      } else {
        fundCampaigns = data || []
      }
    } catch (error: any) {
      // Handle case where fund_id column doesn't exist
      console.warn("Campaigns query failed (fund_id column might not exist):", error?.message)
      fundCampaigns = []
    }

    // Calculate fund statistics
    let allDonations: any[] = []
    try {
      const { data, error: donationsStatsError } = await supabase
        .from("donations")
        .select("amount, status")
        .eq("fund_id", id)
        .eq("status", "completed")

      if (donationsStatsError) {
        console.warn("Error fetching donation stats:", donationsStatsError.message)
        allDonations = []
      } else {
        allDonations = data || []
      }
    } catch (error: any) {
      console.warn("Donation stats query failed:", error?.message)
      allDonations = []
    }

    const totalDonations = (allDonations || []).reduce((sum, d) => sum + Number(d.amount || 0), 0)
    const donationCount = (allDonations || []).length
    const activeCampaigns = (fundCampaigns || []).filter((c) => c.status === "active").length
    const completedCampaigns = (fundCampaigns || []).filter((c) => c.status === "completed").length

    // Format recent donors from donations
    const now = new Date()
    const formatRelativeTime = (date: Date) => {
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 60) return `${diffMins} минут назад`
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`
      return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`
    }

    const recentDonations = (donations || []).map((donation: any) => ({
      name: donation.is_anonymous
        ? "Анонимно"
        : donation.profiles?.display_name || "Неизвестный донор",
      amount: Number(donation.amount || 0),
      createdAt: formatRelativeTime(new Date(donation.created_at)),
    }))

    // Transform database format to component format
    // Note: impactStats and projects are optional fields that may not exist in DB
    // For now, we'll use empty arrays or default values
    const fund = {
      id: fundData.id,
      name: fundData.name || "",
      nameAr: fundData.name_ar || "",
      description: fundData.description || "",
      descriptionAr: fundData.description_ar || "",
      fullDescription: fundData.description || "", // Use description as fullDescription if separate field doesn't exist
      category: fundData.category || "general",
      logoUrl: fundData.logo_url || "/placeholder.svg",
      isVerified: fundData.is_verified !== undefined ? fundData.is_verified : false,
      totalRaised: Number(fundData.total_raised || 0),
      donorCount: Number(fundData.donor_count || 0),
      websiteUrl: fundData.website_url || null,
      contactEmail: fundData.contact_email || null,
      impactStats: [
        { label: "Людей помогли", value: "—" },
        { label: "Стран", value: "—" },
        { label: "Проектов", value: "—" },
        { label: "Лет работы", value: "—" },
      ], // Default stats - can be enhanced later
      recentDonations,
      projects: [], // Projects can be added as separate table or JSON field later
    }

    return (
      <div className="min-h-screen pb-20">
        <AppHeader />

        <main className="max-w-lg mx-auto">
        {/* Fund Header */}
        <div className="px-4 py-6 space-y-4 border-b">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              <Image src={fund.logoUrl || "/placeholder.svg"} alt={fund.name} fill className="object-cover" sizes="80px" />
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
              <Link href={`/donate?fundId=${fund.id}`}>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">О фонде</TabsTrigger>
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="donors">Доноры</TabsTrigger>
              <TabsTrigger value="reports">Отчетность</TabsTrigger>
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
                    <Image
                      src={project.imageUrl || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
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

            <TabsContent value="projects" className="space-y-4 mt-4">
              {fundCampaigns && fundCampaigns.length > 0 ? (
                fundCampaigns.map((campaign: any) => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      {campaign.image_url && (
                        <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                          <Image
                            src={campaign.image_url}
                            alt={campaign.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-base">{campaign.title}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">{campaign.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">
                              {((Number(campaign.current_amount || 0) / Number(campaign.goal_amount || 1)) * 100).toFixed(0)}% собрано
                            </span>
                          </div>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status === "active" ? "Активна" : campaign.status === "completed" ? "Завершена" : campaign.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground">Нет проектов, связанных с этим фондом</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="donors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Недавние доноры</CardTitle>
                  <CardDescription>{donationCount.toLocaleString()} человек пожертвовали этому фонду</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fund.recentDonations.length > 0 ? (
                    fund.recentDonations.map((donor, i) => (
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
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Пока нет пожертвований</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Статистика фонда</CardTitle>
                  <CardDescription>Общая информация о деятельности фонда</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Всего собрано</p>
                      <p className="text-2xl font-bold text-primary">{totalDonations.toLocaleString("ru-RU")} ₽</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Доноров</p>
                      <p className="text-2xl font-bold text-primary">{donationCount.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Активных кампаний</p>
                      <p className="text-2xl font-bold text-primary">{activeCampaigns}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Завершено кампаний</p>
                      <p className="text-2xl font-bold text-primary">{completedCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {fundCampaigns && fundCampaigns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Кампании фонда</CardTitle>
                    <CardDescription>Все кампании, связанные с этим фондом</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fundCampaigns.map((campaign: any) => {
                      const progress = Number(campaign.goal_amount || 0) > 0
                        ? (Number(campaign.current_amount || 0) / Number(campaign.goal_amount)) * 100)
                        : 0
                      
                      return (
                        <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                          <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-medium text-sm flex-1">{campaign.title}</h4>
                              <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="text-xs">
                                {campaign.status === "active" ? "Активна" : campaign.status === "completed" ? "Завершена" : campaign.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Прогресс</span>
                                <span className="font-medium">{progress.toFixed(0)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{Number(campaign.current_amount || 0).toLocaleString("ru-RU")} ₽</span>
                                <span>из {Number(campaign.goal_amount || 0).toLocaleString("ru-RU")} ₽</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
    )
  } catch (error) {
    console.error("Error in FundDetailPage:", error)
    throw error // Re-throw to trigger error.tsx
  }
}
