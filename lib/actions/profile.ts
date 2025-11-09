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

