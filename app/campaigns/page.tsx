import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CampaignsList } from "@/components/campaigns-list"
import { getCampaigns } from "@/lib/actions/campaigns"
import { transformCampaigns, filterEndingCampaigns, filterActiveCampaigns } from "@/lib/transformers/campaign"
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

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Кэшировать на 60 секунд для быстрой загрузки

export default async function CampaignsPage() {
  // Параллельная загрузка для ускорения
  const [activeResult, completedResult] = await Promise.allSettled([
    getCampaigns("active"),
    getCampaigns("completed"),
  ]).then((results) => {
    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.error("Error fetching campaigns:", result.reason)
        return { campaigns: [], error: "Failed to load campaigns" }
      }
    })
  })
  
  // Handle errors
  if (activeResult.error) {
    console.error("Error fetching active campaigns:", activeResult.error)
  }
  if (completedResult.error) {
    console.error("Error fetching completed campaigns:", completedResult.error)
  }

  // Transform database format to component format
  const activeCampaigns = transformCampaigns(activeResult.campaigns || [])
  const completedCampaigns = transformCampaigns(completedResult.campaigns || [])
  
  // Ending soon: active campaigns with deadline <= 7 days
  const endingCampaigns = filterEndingCampaigns(activeCampaigns)
  
  // Active: campaigns that are not completed and not ending soon
  const trulyActiveCampaigns = filterActiveCampaigns(activeCampaigns)

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
