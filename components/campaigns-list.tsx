"use client"

import { useState, useEffect } from "react"
import { CampaignCard } from "@/components/campaign-card"
import { CampaignsSearch } from "@/components/campaigns-search"
import { SkeletonCampaignCard } from "@/components/skeleton-campaign-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, CheckCircle } from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  category: string
  imageUrl: string
  donorCount: number
  daysLeft: number
  creatorName: string
}

interface CampaignsListProps {
  activeCampaigns: Campaign[]
  endingCampaigns: Campaign[]
  completedCampaigns: Campaign[]
}

export function CampaignsList({ activeCampaigns, endingCampaigns, completedCampaigns }: CampaignsListProps) {
  const [filteredActive, setFilteredActive] = useState(activeCampaigns)
  const [filteredEnding, setFilteredEnding] = useState(endingCampaigns)
  const [filteredCompleted, setFilteredCompleted] = useState(completedCampaigns)
  const [activeTab, setActiveTab] = useState("active")
  const [isLoading, setIsLoading] = useState(false)

  // Reset filtered campaigns when source campaigns change
  useEffect(() => {
    setFilteredActive(activeCampaigns)
  }, [activeCampaigns])

  useEffect(() => {
    setFilteredEnding(endingCampaigns)
  }, [endingCampaigns])

  useEffect(() => {
    setFilteredCompleted(completedCampaigns)
  }, [completedCampaigns])


  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full h-auto p-1.5 gap-1.5 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="active" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate font-medium">Активные</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ending" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate font-medium">Скоро завершатся</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate font-medium">Завершённые</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          <CampaignsSearch 
            campaigns={activeCampaigns} 
            onFilteredChange={(filtered) => setFilteredActive(filtered)}
          />
          {filteredActive.length > 0 ? (
            filteredActive.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет активных кампаний</p>
              <p className="text-sm mt-2">Создайте первую кампанию, чтобы начать сбор средств</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ending" className="space-y-4 mt-4">
          <CampaignsSearch 
            campaigns={endingCampaigns} 
            onFilteredChange={(filtered) => setFilteredEnding(filtered)}
          />
          {filteredEnding.length > 0 ? (
            filteredEnding.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет кампаний, которые скоро завершаются</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          <CampaignsSearch 
            campaigns={completedCampaigns} 
            onFilteredChange={(filtered) => setFilteredCompleted(filtered)}
          />
          {filteredCompleted.length > 0 ? (
            filteredCompleted.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет завершённых кампаний</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

