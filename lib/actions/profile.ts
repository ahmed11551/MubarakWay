"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Загрузить аватар пользователя
 */
export async function uploadAvatar(base64Data: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to upload avatar" }
  }

  try {
    // Import storage utilities
    const { uploadImageFromBase64 } = await import("@/lib/actions/storage")

    // Upload image to Supabase Storage
    const fileName = `${user.id}-${Date.now()}.jpg`
    const uploadResult = await uploadImageFromBase64(base64Data, fileName, "avatars")

    if ("error" in uploadResult) {
      return { error: uploadResult.error }
    }

    if (!uploadResult.url) {
      return { error: "Failed to upload avatar" }
    }

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: uploadResult.url })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Profile] Avatar update error:", updateError)
      return { error: "Failed to update profile with avatar" }
    }

    revalidatePath("/profile")
    revalidatePath("/")

    return { success: true, avatarUrl: uploadResult.url }
  } catch (error) {
    console.error("[Profile] Unexpected avatar upload error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Удалить аватар пользователя
 */
export async function deleteAvatar() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to delete avatar" }
  }

  try {
    // Get current avatar URL
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Profile not found" }
    }

    // Delete from storage if exists
    if (profile.avatar_url) {
      try {
        const avatarPath = profile.avatar_url.split("/avatars/")[1]
        if (avatarPath) {
          const { error: deleteError } = await supabase.storage
            .from("images")
            .remove([`avatars/${avatarPath}`])

          if (deleteError) {
            console.error("[Profile] Avatar deletion error:", deleteError)
            // Continue even if deletion fails
          }
        }
      } catch (storageError) {
        console.error("[Profile] Storage deletion error:", storageError)
        // Continue even if deletion fails
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Profile] Profile update error:", updateError)
      return { error: "Failed to update profile" }
    }

    revalidatePath("/profile")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Profile] Unexpected avatar deletion error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Получить данные профиля текущего пользователя
 */
export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view profile" }
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[Profile] Get profile error:", profileError)
      return { error: "Failed to fetch profile" }
    }

    return { profile }
  } catch (error) {
    console.error("[Profile] Unexpected get profile error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Синхронизировать telegram_id из Telegram WebApp
 * Вызывается при инициализации WebApp для связи профиля с Telegram
 */
export async function syncTelegramId(telegramId: number) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to sync Telegram ID" }
  }

  if (!telegramId || telegramId <= 0) {
    return { error: "Invalid Telegram ID" }
  }

  try {
    // Проверяем, существует ли профиль
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("telegram_id")
      .eq("id", user.id)
      .single()

    // Если профиля нет, создаем его
    if (fetchError && fetchError.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          telegram_id: telegramId,
          display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
          email: user.email,
        })

      if (insertError) {
        console.error("[Profile] Failed to create profile with telegram_id:", insertError)
        return { error: "Failed to create profile" }
      }

      return { success: true, telegramId }
    }

    // Если профиль существует, обновляем telegram_id только если его еще нет
    if (existingProfile && !existingProfile.telegram_id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ telegram_id: telegramId })
        .eq("id", user.id)
        .is("telegram_id", null)

      if (updateError) {
        console.error("[Profile] Failed to update telegram_id:", updateError)
        return { error: "Failed to update Telegram ID" }
      }

      return { success: true, telegramId }
    }

    // Если telegram_id уже установлен, просто возвращаем успех
    return { success: true, telegramId: existingProfile?.telegram_id || telegramId }
  } catch (error) {
    console.error("[Profile] Unexpected sync error:", error)
    return { error: "An unexpected error occurred" }
  }
}

