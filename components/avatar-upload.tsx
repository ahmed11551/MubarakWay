"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, X } from "lucide-react"
import { uploadAvatar, deleteAvatar } from "@/lib/actions/profile"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/mobile-ux"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  displayName?: string
  userId?: string
  onAvatarChange?: (newUrl: string | null) => void
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName = "U",
  userId,
  onAvatarChange,
  size = "lg",
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер изображения должен быть меньше 5 МБ")
      return
    }

    setIsUploading(true)
    hapticFeedback("light")

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string
          const result = await uploadAvatar(base64Data)

          if (result.error) {
            hapticFeedback("error")
            toast.error(result.error)
            setIsUploading(false)
            return
          }

          hapticFeedback("success")
          toast.success("Аватар успешно загружен")
          setAvatarUrl(result.avatarUrl || null)
          onAvatarChange?.(result.avatarUrl || null)
        } catch (error) {
          console.error("Avatar upload error:", error)
          hapticFeedback("error")
          toast.error("Ошибка при загрузке аватара")
        } finally {
          setIsUploading(false)
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      }

      reader.onerror = () => {
        hapticFeedback("error")
        toast.error("Ошибка при чтении файла")
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("File selection error:", error)
      hapticFeedback("error")
      toast.error("Ошибка при выборе файла")
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!avatarUrl) return

    setIsDeleting(true)
    hapticFeedback("light")

    try {
      const result = await deleteAvatar()

      if (result.error) {
        hapticFeedback("error")
        toast.error(result.error)
        setIsDeleting(false)
        return
      }

      hapticFeedback("success")
      toast.success("Аватар удалён")
      setAvatarUrl(null)
      onAvatarChange?.(null)
    } catch (error) {
      console.error("Avatar deletion error:", error)
      hapticFeedback("error")
      toast.error("Ошибка при удалении аватара")
    } finally {
      setIsDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="relative inline-block">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          )}
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {/* Upload button overlay */}
        <div className="absolute bottom-0 right-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isDeleting}
          />
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Delete button (only if avatar exists) */}
        {avatarUrl && !isUploading && (
          <div className="absolute top-0 right-0">
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-6 w-6 rounded-full shadow-lg"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

