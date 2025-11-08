"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Trash2 } from "lucide-react"
import { getCampaignComments, addCampaignComment, deleteCampaignComment } from "@/lib/actions/campaign-social"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { hapticFeedback } from "@/lib/mobile-ux"

interface CampaignCommentsProps {
  campaignId: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export function CampaignComments({ campaignId }: CampaignCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()
    loadCurrentUser()
  }, [campaignId])

  const loadCurrentUser = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    } catch (error) {
      console.error("Failed to load current user:", error)
    }
  }

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const result = await getCampaignComments(campaignId)
      if (result.error) {
        console.error("Failed to load comments:", result.error)
      } else {
        setComments(result.comments || [])
      }
    } catch (error) {
      console.error("Load comments error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      hapticFeedback("error")
      toast.error("Введите комментарий")
      return
    }

    if (!currentUserId) {
      hapticFeedback("error")
      toast.error("Войдите, чтобы оставить комментарий")
      router.push("/profile")
      return
    }

    hapticFeedback("medium")
    
    // Оптимистичное обновление UI
    const commentText = newComment.trim()
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      profiles: null, // Будет загружено с сервера
    }
    
    // Мгновенно добавляем комментарий в UI
    setComments((prev) => [optimisticComment, ...prev])
    setNewComment("")
    
    setIsSubmitting(true)
    try {
      const result = await addCampaignComment(campaignId, commentText)
      
      if (result.error) {
        // Откат при ошибке
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
        setNewComment(commentText) // Восстанавливаем текст
        hapticFeedback("error")
        toast.error(result.error)
        return
      }

      if (result.comment) {
        // Заменяем оптимистичный комментарий на реальный
        setComments((prev) => [
          result.comment,
          ...prev.filter((c) => c.id !== optimisticComment.id)
        ])
        hapticFeedback("success")
        toast.success("Комментарий добавлен")
        
        // Автоматически прокручиваем к новому комментарию
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100)
      }
    } catch (error) {
      // Откат при ошибке
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      setNewComment(commentText) // Восстанавливаем текст
      
      console.error("Submit comment error:", error)
      hapticFeedback("error")
      toast.error("Произошла ошибка")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить комментарий?")) {
      return
    }

    hapticFeedback("medium")
    try {
      const result = await deleteCampaignComment(commentId)
      
      if (result.error) {
        hapticFeedback("error")
        toast.error(result.error)
        return
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      hapticFeedback("success")
      toast.success("Комментарий удален")
    } catch (error) {
      console.error("Delete comment error:", error)
      hapticFeedback("error")
      toast.error("Произошла ошибка")
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ru,
      })
    } catch {
      return "недавно"
    }
  }

  const getUserDisplayName = (comment: Comment) => {
    return comment.profiles?.display_name || "Анонимный пользователь"
  }

  const getUserAvatar = (comment: Comment) => {
    return comment.profiles?.avatar_url || null
  }

  return (
    <div className="space-y-4">
      {/* Форма добавления комментария */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={null} />
                <AvatarFallback>
                  {currentUserId ? "Я" : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напишите комментарий..."
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={2000}
                  disabled={isSubmitting || !currentUserId}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/2000
                  </span>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !newComment.trim() || !currentUserId}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список комментариев */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Загрузка комментариев...
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Пока нет комментариев</p>
              <p className="text-xs mt-1">Будьте первым, кто оставит комментарий!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getUserAvatar(comment) || undefined} />
                    <AvatarFallback>
                      {getUserDisplayName(comment).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-medium">
                          {getUserDisplayName(comment)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                      {currentUserId === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0"
                          title="Удалить комментарий"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

