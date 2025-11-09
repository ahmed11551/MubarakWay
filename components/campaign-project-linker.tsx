"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  id: string
  title: string
  description: string
  image_url?: string
}

interface CampaignProjectLinkerProps {
  selectedProjectIds: string[]
  onProjectsChange: (projectIds: string[]) => void
  excludeCampaignId?: string // ID текущей кампании (чтобы исключить её из списка)
}

export function CampaignProjectLinker({
  selectedProjectIds,
  onProjectsChange,
  excludeCampaignId,
}: CampaignProjectLinkerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Campaign[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<Campaign[]>([])

  // Загружаем информацию о выбранных проектах
  useEffect(() => {
    async function loadSelectedProjects() {
      if (selectedProjectIds.length === 0) {
        setSelectedProjects([])
        return
      }

      try {
        const response = await fetch(`/api/campaigns?ids=${selectedProjectIds.join(",")}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedProjects(data.campaigns || [])
        }
      } catch (error) {
        console.error("Failed to load selected projects:", error)
      }
    }

    loadSelectedProjects()
  }, [selectedProjectIds])

  // Поиск проектов
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/campaigns/search?q=${encodeURIComponent(query)}&status=active&limit=10`)
      if (response.ok) {
        const data = await response.json()
        // Фильтруем уже выбранные и текущую кампанию
        const filtered = (data.campaigns || []).filter(
          (campaign: Campaign) =>
            !selectedProjectIds.includes(campaign.id) &&
            campaign.id !== excludeCampaignId
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Не удалось выполнить поиск")
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAddProject = (campaign: Campaign) => {
    if (selectedProjectIds.includes(campaign.id)) {
      return
    }

    const newIds = [...selectedProjectIds, campaign.id]
    onProjectsChange(newIds)
    setSearchQuery("")
    setSearchResults([])
    toast.success("Проект добавлен")
  }

  const handleRemoveProject = (projectId: string) => {
    const newIds = selectedProjectIds.filter((id) => id !== projectId)
    onProjectsChange(newIds)
    toast.success("Проект удалён")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Связать с проектами</Label>
        <p className="text-xs text-muted-foreground">
          Выберите другие активные кампании, связанные с вашим проектом
        </p>
      </div>

      {/* Выбранные проекты */}
      {selectedProjects.length > 0 && (
        <div className="space-y-2">
          {selectedProjects.map((project) => (
            <Card key={project.id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{project.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleRemoveProject(project.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Поиск проектов */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a Project to link to..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => handleAddProject(campaign)}
                  className="w-full text-left p-3 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    {campaign.image_url && (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-12 h-12 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{campaign.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопка "Add Another" */}
      {selectedProjects.length > 0 && searchQuery.length < 2 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setSearchQuery(" ")} // Устанавливаем пробел для активации поиска
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another
        </Button>
      )}
    </div>
  )
}

