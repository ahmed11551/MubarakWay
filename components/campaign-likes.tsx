"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { getCampaignLikesCount, hasUserLikedCampaign, toggleCampaignLike } from "@/lib/actions/campaign-social"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { hapticFeedback } from "@/lib/mobile-ux"

interface CampaignLikesProps {
  campaignId: string
  initialCount?: number
  initialLiked?: boolean
}

export function CampaignLikes({ campaignId, initialCount = 0, initialLiked = false }: CampaignLikesProps) {
  const [likesCount, setLikesCount] = useState(initialCount)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Загружаем актуальные данные при монтировании
    loadLikesData()
  }, [campaignId])

  const loadLikesData = async () => {
    try {
      const [countResult, likedResult] = await Promise.all([
        getCampaignLikesCount(campaignId),
        hasUserLikedCampaign(campaignId),
      ])

      if (countResult.count !== undefined) {
        setLikesCount(countResult.count)
      }
      if (likedResult.liked !== undefined) {
        setIsLiked(likedResult.liked)
      }
    } catch (error) {
      console.error("Failed to load likes data:", error)
    }
  }

  const handleToggleLike = async () => {
    hapticFeedback("light")
    
    // Оптимистичное обновление UI
    const previousLiked = isLiked
    const previousCount = likesCount
    
    // Мгновенно обновляем UI
    setIsLiked(!previousLiked)
    if (!previousLiked) {
      setLikesCount((prev) => prev + 1)
    } else {
      setLikesCount((prev) => Math.max(0, prev - 1))
    }
    
    setIsLoading(true)
    try {
      const result = await toggleCampaignLike(campaignId)
      
      if (result.error) {
        // Откат при ошибке
        setIsLiked(previousLiked)
        setLikesCount(previousCount)
        
        if (result.error.includes("авторизованы")) {
          hapticFeedback("error")
          toast.error("Войдите, чтобы поддержать кампанию")
          router.push("/profile")
        } else {
          hapticFeedback("error")
          toast.error(result.error)
        }
        return
      }

      // Подтверждаем состояние (на случай если сервер вернул другое состояние)
      setIsLiked(result.liked || false)
      
      // Обновляем счетчик на основе ответа сервера
      if (result.liked) {
        hapticFeedback("success")
        toast.success("Вы поддержали кампанию!")
      } else {
        hapticFeedback("light")
        toast.success("Поддержка удалена")
      }
    } catch (error) {
      // Откат при ошибке
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      
      console.error("Toggle like error:", error)
      hapticFeedback("error")
      toast.error("Произошла ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
        }`}
      />
      <span className="text-sm font-medium">{likesCount}</span>
    </Button>
  )
}

