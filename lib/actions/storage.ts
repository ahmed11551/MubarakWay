"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadImageFromBase64(
  base64Data: string,
  fileName: string,
  folder: string = "campaigns"
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to upload images" }
  }

  try {
    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64String = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, "base64")

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (buffer.length > maxSize) {
      return { error: "Image size must be less than 5MB" }
    }

    // Generate unique filename
    const fileExt = fileName.split(".").pop() || "jpg"
    const uniqueFileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${uniqueFileName}`

    // Detect MIME type from base64 data or file extension
    let contentType = "image/jpeg"
    if (base64Data.startsWith("data:image/")) {
      const mimeMatch = base64Data.match(/data:image\/([^;]+)/)
      if (mimeMatch) {
        contentType = `image/${mimeMatch[1]}`
      }
    } else {
      const ext = fileExt.toLowerCase()
      if (ext === "png") contentType = "image/png"
      else if (ext === "webp") contentType = "image/webp"
      else if (ext === "gif") contentType = "image/gif"
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error("[v0] Image upload error:", error)
      // Provide more specific error messages
      if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
        return { error: "Изображение с таким именем уже существует. Попробуйте другое изображение." }
      }
      if (error.message?.includes("size") || error.message?.includes("too large")) {
        return { error: "Размер изображения слишком большой. Максимальный размер: 5 МБ." }
      }
      if (error.message?.includes("permission") || error.message?.includes("policy")) {
        return { error: "Нет прав для загрузки изображений. Проверьте настройки Storage." }
      }
      return { error: "Не удалось загрузить изображение. Проверьте подключение и попробуйте снова." }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { error: "Failed to get image URL" }
    }

    return { url: urlData.publicUrl }
  } catch (error) {
    console.error("[v0] Unexpected upload error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteImage(imageUrl: string): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to delete images" }
  }

  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.findIndex((part) => part === "images")
    
    if (bucketIndex === -1) {
      return { error: "Invalid image URL" }
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/")

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from("images").remove([filePath])

    if (error) {
      console.error("[v0] Image deletion error:", error)
      return { error: "Failed to delete image" }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected deletion error:", error)
    return { error: "An unexpected error occurred" }
  }
}

