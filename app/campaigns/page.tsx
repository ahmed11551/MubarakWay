import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CampaignsList } from "@/components/campaigns-list"
import { getCampaigns } from "@/lib/actions/campaigns"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export const metadata: Metadata = {
  title: "Кампании",
  description: "Поддержите общественные инициативы и кампании по сбору средств. Активные, скоро завершающиеся и завершённые кампании.",
  openGraph: {
    title: "Кампании | MubarakWay",
    description: "Поддержите общественные инициативы и кампании по сбору средств",
    url: `${siteUrl}/campaigns`,
  },
}

export default async function CampaignsPage() {
  // Fetch campaigns from database with error handling
  let activeResult, completedResult
  
  try {
    activeResult = await getCampaigns("active")
  } catch (error) {
    console.error("Error fetching active campaigns:", error)
    activeResult = { campaigns: [], error: "Failed to load campaigns" }
  }
  
  try {
    completedResult = await getCampaigns("completed")
  } catch (error) {
    console.error("Error fetching completed campaigns:", error)
    completedResult = { campaigns: [], error: "Failed to load campaigns" }
  }
  
  // Handle errors
  if (activeResult.error) {
    console.error("Error fetching active campaigns:", activeResult.error)
  }
  if (completedResult.error) {
    console.error("Error fetching completed campaigns:", completedResult.error)
  }

  // Transform database format to component format
  const transformCampaign = (campaign: any) => {
    const deadline = campaign.deadline ? new Date(campaign.deadline) : null
    const now = new Date()
    const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null

    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      goalAmount: Number(campaign.goal_amount || 0),
      currentAmount: Number(campaign.current_amount || 0),
      category: campaign.category || "other",
      imageUrl: campaign.image_url || "/placeholder.svg",
      donorCount: Number(campaign.donor_count || 0),
      daysLeft: daysLeft ?? 0,
      creatorName: campaign.profiles?.display_name || "Неизвестный автор",
    }
  }

  const activeCampaigns = (activeResult.campaigns || []).map(transformCampaign)
  const completedCampaigns = (completedResult.campaigns || []).map(transformCampaign)
  
  // Ending soon: active campaigns with deadline <= 7 days
  const endingCampaigns = activeCampaigns.filter((c) => c.daysLeft > 0 && c.daysLeft <= 7)
  
  // Active: campaigns that are not completed and not ending soon
  const trulyActiveCampaigns = activeCampaigns.filter(
    (c) => c.currentAmount < c.goalAmount && c.daysLeft > 7
  )

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

        <CampaignsList
          activeCampaigns={trulyActiveCampaigns}
          endingCampaigns={endingCampaigns}
          completedCampaigns={completedCampaigns}
        />
      </main>

      <BottomNav />
    </div>
  )
}
