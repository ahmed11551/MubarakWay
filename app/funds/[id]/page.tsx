import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Heart, ExternalLink, Mail, Users, TrendingUp, Globe, Building2, GraduationCap, Stethoscope, Droplets, Landmark, AlertCircle, HandHeart, Coins } from "lucide-react"
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

    // Fetch projects/programs for this fund
    let fundProjects: any[] = []
    let fundCampaigns: any[] = []
    
    // For Insan fund, fetch programs from fondinsan.ru API
    if (id === "00000000-0000-0000-0000-000000000001") {
      try {
        const { fetchFondinsanPrograms } = await import("@/lib/fondinsan-api")
        const programs = await fetchFondinsanPrograms()
        
        if (programs && programs.length > 0) {
          fundProjects = programs.map((program) => ({
            id: `fondinsan_${program.id}`,
            title: program.title,
            description: program.short || program.description.replace(/<[^>]*>/g, "").substring(0, 200),
            imageUrl: program.image,
            url: program.url,
            defaultAmount: program.default_amount,
            created: program.created,
            beneficiaries: 0, // API doesn't provide this
          }))
        }
      } catch (error: any) {
        console.warn("Error fetching fondinsan programs:", error?.message)
      }
    }
    
    // Also try to fetch campaigns linked to this fund (if fund_id column exists in future)
    try {
      const { data, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, title, description, goal_amount, current_amount, currency, status, image_url, created_at")
        .eq("fund_id", id)
        .order("created_at", { ascending: false })

      if (campaignsError) {
        // If fund_id column doesn't exist, this is expected
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
        { label: "Проектов", value: fundProjects.length > 0 ? fundProjects.length.toString() : "—" },
        { label: "Лет работы", value: "—" },
      ], // Default stats - can be enhanced later
      recentDonations,
      projects: fundProjects, // Projects from API or campaigns
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

            <TabsContent value="projects" className="space-y-3 mt-4">
              {/* Show projects from API (for Insan fund) or campaigns */}
              {fund.projects.length > 0 ? (
                fund.projects.map((project: any) => {
                  // Determine icon based on project title/description
                  const getProjectIcon = (title: string, description: string) => {
                    const text = (title + " " + description).toLowerCase()
                    if (text.includes("закят") || text.includes("zakat")) return Coins
                    if (text.includes("садака") || text.includes("sadaqa")) return HandHeart
                    if (text.includes("мечеть") || text.includes("медресе") || text.includes("духовн")) return Landmark
                    if (text.includes("образование") || text.includes("хифз") || text.includes("школ")) return GraduationCap
                    if (text.includes("медицин") || text.includes("больн") || text.includes("лечен")) return Stethoscope
                    if (text.includes("вода") || text.includes("колодец")) return Droplets
                    if (text.includes("экстрен") || text.includes("помощь")) return AlertCircle
                    return Building2
                  }

                  const ProjectIcon = getProjectIcon(project.title, project.description || "")

                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Icon on the left */}
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                            <ProjectIcon className="h-8 w-8 text-primary" />
                          </div>

                          {/* Title and description in the center */}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1 line-clamp-1">{project.title}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">{project.description}</CardDescription>
                          </div>

                          {/* Button on the right */}
                          <div className="flex-shrink-0">
                            {project.url ? (
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white whitespace-nowrap"
                                asChild
                              >
                                <a href={project.url} target="_blank" rel="noopener noreferrer">
                                  Помочь
                                </a>
                              </Button>
                            ) : project.defaultAmount ? (
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white whitespace-nowrap"
                                asChild
                              >
                                <Link href={`/donate?fundId=${id}&projectId=${project.id}&amount=${project.defaultAmount}`}>
                                  Помочь
                                </Link>
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white whitespace-nowrap"
                                asChild
                              >
                                <Link href={`/donate?fundId=${id}`}>
                                  Помочь
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : fundCampaigns.length > 0 ? (
                fundCampaigns.map((campaign: any) => {
                  const getCampaignIcon = (title: string, description: string) => {
                    const text = (title + " " + description).toLowerCase()
                    if (text.includes("закят") || text.includes("zakat")) return Coins
                    if (text.includes("садака") || text.includes("sadaqa")) return HandHeart
                    if (text.includes("мечеть") || text.includes("медресе") || text.includes("духовн")) return Landmark
                    if (text.includes("образование") || text.includes("хифз") || text.includes("школ")) return GraduationCap
                    if (text.includes("медицин") || text.includes("больн") || text.includes("лечен")) return Stethoscope
                    if (text.includes("вода") || text.includes("колодец")) return Droplets
                    if (text.includes("экстрен") || text.includes("помощь")) return AlertCircle
                    return Building2
                  }

                  const CampaignIcon = getCampaignIcon(campaign.title, campaign.description || "")

                  return (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow border-2">
                      <CardContent className="p-4">
                        <Link href={`/campaigns/${campaign.id}`}>
                          <div className="flex items-center gap-4">
                            {/* Icon on the left */}
                            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                              {campaign.image_url ? (
                                <div className="h-16 w-16 rounded-xl overflow-hidden relative">
                                  <Image
                                    src={campaign.image_url}
                                    alt={campaign.title}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ) : (
                                <CampaignIcon className="h-8 w-8 text-primary" />
                              )}
                            </div>

                            {/* Title and description in the center */}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base mb-1 line-clamp-1">{campaign.title}</CardTitle>
                              <CardDescription className="text-xs line-clamp-2">{campaign.description}</CardDescription>
                              <div className="flex items-center gap-2 mt-1">
                                <TrendingUp className="h-3 w-3 text-primary" />
                                <span className="text-xs text-muted-foreground">
                                  {((Number(campaign.current_amount || 0) / Number(campaign.goal_amount || 1)) * 100).toFixed(0)}% собрано
                                </span>
                              </div>
                            </div>

                            {/* Button on the right */}
                            <div className="flex-shrink-0">
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white whitespace-nowrap"
                              >
                                Помочь
                              </Button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })
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
                    <>
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
                          <span className="text-sm font-semibold text-primary">{donor.amount.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      ))}
                      {donationCount > fund.recentDonations.length && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          И еще {donationCount - fund.recentDonations.length} доноров
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Пока нет пожертвований</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Top Donors Statistics */}
              {fund.recentDonations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Статистика доноров</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Всего доноров</p>
                        <p className="text-xl font-bold text-primary">{donationCount}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Средний чек</p>
                        <p className="text-xl font-bold text-primary">
                          {donationCount > 0 ? Math.round(totalDonations / donationCount).toLocaleString("ru-RU") : 0} ₽
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      <p className="text-xs text-muted-foreground mb-1">Проектов</p>
                      <p className="text-2xl font-bold text-primary">{fundProjects.length + fundCampaigns.length}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Активных кампаний</p>
                      <p className="text-2xl font-bold text-primary">{activeCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Monthly Statistics */}
              {allDonations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Статистика по месяцам</CardTitle>
                    <CardDescription>Пожертвования за последние 6 месяцев</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        // Group donations by month
                        const monthlyStats = allDonations.reduce((acc: any, donation: any) => {
                          const date = new Date(donation.created_at)
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                          const monthName = date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
                          
                          if (!acc[monthKey]) {
                            acc[monthKey] = { month: monthName, amount: 0, count: 0 }
                          }
                          acc[monthKey].amount += Number(donation.amount || 0)
                          acc[monthKey].count += 1
                          return acc
                        }, {})
                        
                        // Get last 6 months
                        const sortedMonths = Object.entries(monthlyStats)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .slice(0, 6)
                        
                        return sortedMonths.length > 0 ? (
                          sortedMonths.map(([key, stats]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="text-sm font-medium">{stats.month}</p>
                                <p className="text-xs text-muted-foreground">{stats.count} пожертвований</p>
                              </div>
                              <p className="text-lg font-bold text-primary">{stats.amount.toLocaleString("ru-RU")} ₽</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Нет данных за последние месяцы</p>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {fundCampaigns && fundCampaigns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Кампании фонда</CardTitle>
                    <CardDescription>Все кампании, связанные с этим фондом</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fundCampaigns.map((campaign: any) => {
                      const progress = Number(campaign.goal_amount || 0) > 0
                        ? (Number(campaign.current_amount || 0) / Number(campaign.goal_amount)) * 100
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
