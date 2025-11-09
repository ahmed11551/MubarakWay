"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/lib/hooks/use-debounce"

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

interface CampaignsSearchProps {
  campaigns: Campaign[]
  onFilteredChange?: (filtered: Campaign[]) => void
}

export function CampaignsSearch({ campaigns, onFilteredChange }: CampaignsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  
  // Debounce поискового запроса для улучшения производительности
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const categories = [
    { value: "all", label: "Все категории" },
    { value: "medical", label: "Медицина" },
    { value: "education", label: "Образование" },
    { value: "emergency", label: "Экстренная помощь" },
    { value: "family", label: "Поддержка семей" },
    { value: "community", label: "Сообщество" },
    { value: "other", label: "Другое" },
  ]

  const filteredAndSorted = useMemo(() => {
    let filtered = [...campaigns]

    // Filter by search query (используем debounced значение)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(query) ||
          campaign.description.toLowerCase().includes(query) ||
          campaign.creatorName.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((campaign) => campaign.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        // Already sorted by newest from server
        break
      case "popular":
        filtered.sort((a, b) => b.donorCount - a.donorCount)
        break
      case "amount":
        filtered.sort((a, b) => b.currentAmount - a.currentAmount)
        break
      case "progress":
        filtered.sort((a, b) => {
          const progressA = a.goalAmount > 0 ? a.currentAmount / a.goalAmount : 0
          const progressB = b.goalAmount > 0 ? b.currentAmount / b.goalAmount : 0
          return progressB - progressA
        })
        break
      case "urgent":
        filtered.sort((a, b) => {
          // Sort by days left (ascending) - urgent first
          if (a.daysLeft === 0 && b.daysLeft === 0) return 0
          if (a.daysLeft === 0) return 1
          if (b.daysLeft === 0) return -1
          return a.daysLeft - b.daysLeft
        })
        break
    }

    return filtered
  }, [campaigns, debouncedSearchQuery, selectedCategory, sortBy])

  useEffect(() => {
    onFilteredChange?.(filteredAndSorted)
  }, [filteredAndSorted, onFilteredChange])

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== "all" || sortBy !== "newest"

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию, описанию, автору..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground">
          Найдено: {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "кампания" : filteredAndSorted.length < 5 ? "кампании" : "кампаний"}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Сначала новые</SelectItem>
            <SelectItem value="popular">По популярности</SelectItem>
            <SelectItem value="amount">По сумме</SelectItem>
            <SelectItem value="progress">По прогрессу</SelectItem>
            <SelectItem value="urgent">Срочные</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

