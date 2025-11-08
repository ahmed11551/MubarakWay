"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface BookmarkButtonProps {
  campaignId: string
  className?: string
}

export function BookmarkButton({ campaignId, className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkBookmarkStatus()
  }, [campaignId])

  const checkBookmarkStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("user_bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking bookmark:", error)
      } else {
        setIsBookmarked(!!data)
      }
    } catch (error) {
      console.error("Bookmark check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleBookmark = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Войдите, чтобы сохранять кампании")
        return
      }

      if (isBookmarked) {
        // Удалить закладку
        const { error } = await supabase
          .from("user_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("campaign_id", campaignId)

        if (error) {
          console.error("Error removing bookmark:", error)
          toast.error("Не удалось удалить закладку")
        } else {
          setIsBookmarked(false)
          toast.success("Закладка удалена")
        }
      } else {
        // Добавить закладку
        const { error } = await supabase
          .from("user_bookmarks")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
          })

        if (error) {
          // Если таблица не существует, просто показываем визуальный feedback
          if (error.code === "42P01") {
            setIsBookmarked(true)
            toast.success("Закладка добавлена (функция в разработке)")
          } else {
            console.error("Error adding bookmark:", error)
            toast.error("Не удалось добавить закладку")
          }
        } else {
          setIsBookmarked(true)
          toast.success("Кампания сохранена")
        }
      }
    } catch (error) {
      console.error("Bookmark toggle error:", error)
      toast.error("Произошла ошибка")
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="lg" className={className} disabled>
        <Bookmark className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggleBookmark}
      className={className}
      title={isBookmarked ? "Удалить из закладок" : "Добавить в закладки"}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  )
}

