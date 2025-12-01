/**
 * Search campaigns feature (FSD features layer)
 */

"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TransformedCampaign } from "@/entities/campaign/model/types"

interface CampaignsSearchProps {
  campaigns: TransformedCampaign[]
  onFilteredChange: (filtered: TransformedCampaign[]) => void
}

export function CampaignsSearch({ campaigns, onFilteredChange }: CampaignsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(query) ||
          campaign.description.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((campaign) => campaign.category === selectedCategory)
    }

    return filtered
  }, [campaigns, searchQuery, selectedCategory])

  // Notify parent of filtered results
  useMemo(() => {
    onFilteredChange(filteredCampaigns)
  }, [filteredCampaigns, onFilteredChange])

  const categories = [
    { value: "all", label: "Все категории" },
    { value: "medical", label: "Медицина" },
    { value: "education", label: "Образование" },
    { value: "emergency", label: "Экстренная помощь" },
    { value: "family", label: "Поддержка семей" },
    { value: "community", label: "Сообщество" },
    { value: "healthcare", label: "Здравоохранение" },
    { value: "water", label: "Вода" },
    { value: "orphans", label: "Сироты" },
    { value: "general", label: "Общее" },
    { value: "other", label: "Другое" },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск кампаний..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filteredCampaigns.length !== campaigns.length && (
        <p className="text-sm text-muted-foreground">
          Найдено: {filteredCampaigns.length} из {campaigns.length}
        </p>
      )}
    </div>
  )
}

