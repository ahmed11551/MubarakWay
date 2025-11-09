"use client"

import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ShareButtonProps {
  campaignId: string
  campaignTitle: string
  className?: string
}

export function ShareButton({ campaignId, campaignTitle, className }: ShareButtonProps) {
  const [isShared, setIsShared] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/campaigns/${campaignId}`
    const text = `Поддержите кампанию: ${campaignTitle}`
    
    // Генерируем deep link для Telegram бота
    // Формат: t.me/bot?start=campaign_123
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "MubarakWayBot"
    const telegramDeepLink = `https://t.me/${botUsername}?start=campaign_${campaignId}`
    const shareText = `${text}\n\n🔗 Ссылка: ${url}\n\n🤖 Telegram: ${telegramDeepLink}`

    try {
      // Используем Web Share API если доступен
      if (navigator.share) {
        await navigator.share({
          title: campaignTitle,
          text: shareText,
          url: url,
        })
        setIsShared(true)
        setTimeout(() => setIsShared(false), 2000)
        toast.success("Ссылка скопирована!")
      } else {
        // Fallback: копируем в буфер обмена (включая deep link)
        await navigator.clipboard.writeText(shareText)
        setIsShared(true)
        setTimeout(() => setIsShared(false), 2000)
        toast.success("Ссылка скопирована в буфер обмена!")
      }
    } catch (error: any) {
      // Пользователь отменил шаринг - это нормально
      if (error.name !== "AbortError") {
        console.error("Share error:", error)
        // Fallback: копируем в буфер обмена
        try {
          await navigator.clipboard.writeText(shareText)
          setIsShared(true)
          setTimeout(() => setIsShared(false), 2000)
          toast.success("Ссылка скопирована в буфер обмена!")
        } catch (clipboardError) {
          toast.error("Не удалось поделиться")
        }
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleShare}
      className={className}
      title="Поделиться"
    >
      {isShared ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  )
}

