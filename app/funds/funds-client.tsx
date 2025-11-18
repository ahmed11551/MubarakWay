"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle, Users, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SkeletonFundCard } from "@/components/skeleton-fund-card"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface Fund {
  id: string
  name?: string
  name_ru?: string
  name_ar?: string
  nameAr?: string
  description?: string
  description_ru?: string
  logo_url?: string
  logoUrl?: string
  is_verified?: boolean
  isVerified?: boolean
  total_raised?: number
  totalRaised?: number
  donor_count?: number
  donorCount?: number
  category?: string
}

interface FundsClientProps {
  initialFunds: Fund[]
  initialError?: string
}

export function FundsClient({ initialFunds, initialError }: FundsClientProps) {
  const [funds, setFunds] = useState<Fund[]>(initialFunds)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(initialError)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // Debounce поискового запроса для улучшения производительности
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const categories = [
    { value: "all", label: "Все фонды" },
    { value: "education", label: "Образование" },
    { value: "healthcare", label: "Здравоохранение" },
    { value: "water", label: "Вода" },
    { value: "orphans", label: "Сироты" },
    { value: "emergency", label: "Экстренная помощь" },
    { value: "general", label: "Общее" },
  ]

  // Filter funds based on search and category (используем debounced значение)
  // Если есть поисковый запрос, показываем результаты из всех категорий
  // Если поискового запроса нет, фильтруем по выбранной категории
  const filteredFunds = useMemo(() => {
    return funds.filter((fund) => {
      const name = fund.name || fund.name_ru || ""
      const description = fund.description || fund.description_ru || ""
      
      // Если есть поисковый запрос, ищем по имени и описанию во всех категориях
      if (debouncedSearchQuery.trim() !== "") {
        const searchLower = debouncedSearchQuery.toLowerCase().trim()
        const nameMatch = name.toLowerCase().includes(searchLower)
        const descriptionMatch = description.toLowerCase().includes(searchLower)
        
        // Если есть поиск, показываем результаты из всех категорий
        return nameMatch || descriptionMatch
      }
      
      // Если поискового запроса нет, фильтруем по категории
      const categoryMatch = selectedCategory === "all" || 
        fund.category === selectedCategory ||
        fund.id === "00000000-0000-0000-0000-000000000001"
      
      return categoryMatch
    })
  }, [funds, debouncedSearchQuery, selectedCategory])

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Фонды-партнёры</h1>
        <p className="text-sm text-muted-foreground">Поддержите проверенные благотворительные организации</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Поиск фондов..." 
          className="pl-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <div className="w-full">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto p-1.5 gap-1.5 bg-muted/50">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value} 
                className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground transition-all flex-shrink-0 whitespace-normal min-w-fit"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => {
            // Если есть поисковый запрос, показываем результаты поиска во всех вкладках
            // Если поискового запроса нет, фильтруем по категории
            const hasSearch = debouncedSearchQuery.trim() !== ""
            const categoryFunds = hasSearch
              ? filteredFunds // При поиске показываем все результаты поиска
              : cat.value === "all"
                ? filteredFunds
                : filteredFunds.filter(
                    (f) => f.category === cat.value || f.id === "00000000-0000-0000-0000-000000000001"
                  )
            
            return (
              <TabsContent key={cat.value} value={cat.value} className="space-y-4 mt-4">
                {isLoading ? (
                  // Show skeleton loaders while loading
                  <>
                    {[...Array(3)].map((_, i) => (
                      <SkeletonFundCard key={i} />
                    ))}
                  </>
                ) : categoryFunds.length > 0 ? (
                  categoryFunds.map((fund) => (
                    <FundCard key={fund.id} fund={fund} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <p className="text-muted-foreground">
                        {hasSearch ? "Фонды не найдены по запросу" : `Фонды в категории "${cat.label}" не найдены`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      {error && funds.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <p className="text-muted-foreground font-medium">Ошибка загрузки фондов</p>
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
              {error}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function FundCard({ fund }: { fund: Fund }) {
  const name = fund.name || fund.name_ru || ""
  const nameAr = fund.name_ar || fund.nameAr || ""
  const description = fund.description || fund.description_ru || ""
  const logoUrl = fund.logo_url || fund.logoUrl || "/placeholder.svg"
  const isVerified = fund.is_verified !== undefined ? fund.is_verified : fund.isVerified || false
  const totalRaised = Number(fund.total_raised || fund.totalRaised || 0)
  const donorCount = Number(fund.donor_count || fund.donorCount || 0)
  const category = fund.category || "general"

  const categoryLabels: Record<string, string> = {
    education: "Образование",
    healthcare: "Здравоохранение",
    water: "Водоснабжение",
    orphans: "Помощь сиротам",
    emergency: "Экстренная помощь",
    general: "Общее",
    poverty: "Борьба с бедностью",
  }

  const categoryLabel = categoryLabels[category] || category

  return (
    <Link href={`/funds/${fund.id}`}>
      <Card className="hover:shadow-lg transition-shadow animate-slide-up" data-card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              <Image src={logoUrl} alt={name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                    {name}
                    {isVerified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                  </CardTitle>
                  {nameAr && <p className="text-xs text-muted-foreground line-clamp-1">{nameAr}</p>}
                </div>
                <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                  {categoryLabel}
                </Badge>
              </div>
              {description && <CardDescription className="text-xs mt-2 line-clamp-2">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{totalRaised > 0 ? `${(totalRaised / 1000).toFixed(0)}k ₽ собрано` : "Новый фонд"}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{donorCount > 0 ? `${donorCount.toLocaleString()} доноров` : "Пока нет доноров"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

