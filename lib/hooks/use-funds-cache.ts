/**
 * Хук для кэширования фондов
 */

import { useState, useEffect } from "react"
import { cache } from "@/lib/cache"

const FUNDS_CACHE_KEY = "funds_cache"
const FUNDS_CACHE_TTL = 5 * 60 * 1000 // 5 минут

interface Fund {
  id: string
  name?: string
  name_ru?: string
  description?: string
  category?: string
  logo_url?: string
  is_active?: boolean
  [key: string]: any
}

interface UseFundsCacheResult {
  funds: Fund[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Хук для загрузки и кэширования фондов
 */
export function useFundsCache(category?: string): UseFundsCacheResult {
  const [funds, setFunds] = useState<Fund[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = category && category !== "all" 
    ? `${FUNDS_CACHE_KEY}_${category}` 
    : FUNDS_CACHE_KEY

  const loadFunds = async () => {
    // Проверяем кэш
    const cached = cache.get<Fund[]>(cacheKey)
    if (cached) {
      setFunds(cached)
      setIsLoading(false)
      setError(null)
      return
    }

    // Загружаем из API
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/funds" + (category && category !== "all" ? `?category=${category}` : ""))
      
      if (response.ok) {
        const data = await response.json()
        const fundsData = data.funds || []
        
        // Сохраняем в кэш
        cache.set(cacheKey, fundsData, FUNDS_CACHE_TTL)
        
        setFunds(fundsData)
        setError(null)
      } else {
        throw new Error("Failed to fetch funds")
      }
    } catch (err) {
      console.error("Failed to load funds:", err)
      setError("Не удалось загрузить фонды")
      setFunds([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFunds()
  }, [category])

  return {
    funds,
    isLoading,
    error,
    refetch: loadFunds,
  }
}

