"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { getCampaignLikesCount, hasUserLikedCampaign, toggleCampaignLike } from "@/lib/actions/campaign-social"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
    setIsLoading(true)
    try {
      const result = await toggleCampaignLike(campaignId)
      
      if (result.error) {
        if (result.error.includes("авторизованы")) {
          toast.error("Войдите, чтобы поддержать кампанию")
          router.push("/profile")
        } else {
          toast.error(result.error)
        }
        return
      }

      setIsLiked(result.liked || false)
      
      // Обновляем счетчик
      if (result.liked) {
        setLikesCount((prev) => prev + 1)
        toast.success("Вы поддержали кампанию!")
      } else {
        setLikesCount((prev) => Math.max(0, prev - 1))
        toast.success("Поддержка удалена")
      }
    } catch (error) {
      console.error("Toggle like error:", error)
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

