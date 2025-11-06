"use client"

import { useState } from "react"
import { CampaignCard } from "@/components/campaign-card"
import { CampaignsSearch } from "@/components/campaigns-search"
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

  const getCurrentCampaigns = () => {
    switch (activeTab) {
      case "active":
        return filteredActive
      case "ending":
        return filteredEnding
      case "completed":
        return filteredCompleted
      default:
        return filteredActive
    }
  }

  const handleFilteredChange = (filtered: Campaign[]) => {
    switch (activeTab) {
      case "active":
        setFilteredActive(filtered)
        break
      case "ending":
        setFilteredEnding(filtered)
        break
      case "completed":
        setFilteredCompleted(filtered)
        break
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full h-auto p-1 gap-1">
          <TabsTrigger 
            value="active" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs min-w-0"
          >
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Активные</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ending" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs min-w-0"
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Скоро завершатся</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs min-w-0"
          >
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Завершённые</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          <CampaignsSearch 
            campaigns={activeCampaigns} 
            onFilteredChange={handleFilteredChange}
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
            onFilteredChange={handleFilteredChange}
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
            onFilteredChange={handleFilteredChange}
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

