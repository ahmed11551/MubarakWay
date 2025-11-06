import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, Heart, Calendar, Users, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCampaignById } from "@/lib/actions/campaigns"
import { createClient } from "@/lib/supabase/server"

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch campaign from database
  const result = await getCampaignById(id)
  
  if (result.error || !result.campaign) {
    notFound()
  }

  const campaignData = result.campaign

  // Fetch recent donations for this campaign
  const supabase = await createClient()
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      *,
      profiles:donor_id (display_name, avatar_url)
    `)
    .eq("campaign_id", id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10)

  // Transform database format to component format
  const deadline = campaignData.deadline ? new Date(campaignData.deadline) : null
  const now = new Date()
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null

  // Format recent donors from donations
  const formatRelativeTime = (date: Date) => {
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} минут назад`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`
    return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`
  }

  const recentDonors = (donations || []).map((donation: any) => ({
    name: donation.is_anonymous
      ? "Аноним"
      : donation.profiles?.display_name || "Неизвестный донор",
    amount: Number(donation.amount || 0),
    isAnonymous: donation.is_anonymous || false,
    createdAt: formatRelativeTime(new Date(donation.created_at)),
  }))

  // Format campaign updates
  const updates = ((campaignData.campaign_updates as any[]) || []).map((update: any) => ({
    id: update.id,
    title: update.title,
    content: update.content,
    imageUrl: update.image_url || null,
    createdAt: new Date(update.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }))

  const campaign = {
    id: campaignData.id,
    title: campaignData.title || "",
    description: campaignData.description || "",
    story: campaignData.story || "",
    goalAmount: Number(campaignData.goal_amount || 0),
    currentAmount: Number(campaignData.current_amount || 0),
    category: campaignData.category || "other",
    imageUrl: campaignData.image_url || "/placeholder.svg",
    donorCount: Number(campaignData.donor_count || 0),
    daysLeft: daysLeft ?? 0,
    deadline: deadline?.toISOString().split("T")[0] || null,
    creatorName: (campaignData.profiles as any)?.display_name || "Неизвестный автор",
    creatorAvatar: (campaignData.profiles as any)?.avatar_url || "/placeholder.svg",
    createdAt: new Date(campaignData.created_at).toLocaleDateString("ru-RU"),
    updates,
    recentDonors,
  }

  const progress = (campaign.currentAmount / campaign.goalAmount) * 100

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto">
        {/* Campaign Image */}
        <div className="aspect-video bg-muted relative">
          <Image
            src={campaign.imageUrl || "/placeholder.svg"}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
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
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        <Image
                          src={update.imageUrl || "/placeholder.svg"}
                          alt={update.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 768px"
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
