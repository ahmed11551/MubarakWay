"use server"

import { createClient } from "@/lib/supabase/server"

// Получить количество лайков кампании
export async function getCampaignLikesCount(campaignId: string) {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from("campaign_likes")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)

    if (error) {
      console.error("[CampaignSocial] Get likes count error:", error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error("[CampaignSocial] Get likes count exception:", error)
    return { count: 0, error: "Failed to get likes count" }
  }
}

// Проверить, лайкнул ли пользователь кампанию
export async function hasUserLikedCampaign(campaignId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { liked: false }
    }

    const { data, error } = await supabase
      .from("campaign_likes")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[CampaignSocial] Check like error:", error)
      return { liked: false, error: error.message }
    }

    return { liked: !!data }
  } catch (error) {
    console.error("[CampaignSocial] Check like exception:", error)
    return { liked: false, error: "Failed to check like" }
  }
}

// Добавить/удалить лайк
export async function toggleCampaignLike(campaignId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: "Вы должны быть авторизованы" }
    }

    // Проверяем, есть ли уже лайк
    const { data: existingLike } = await supabase
      .from("campaign_likes")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Удаляем лайк
      const { error } = await supabase
        .from("campaign_likes")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)

      if (error) {
        console.error("[CampaignSocial] Remove like error:", error)
        return { error: error.message, liked: false }
      }

      return { liked: false, success: true }
    } else {
      // Добавляем лайк
      const { error } = await supabase
        .from("campaign_likes")
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
        })

      if (error) {
        console.error("[CampaignSocial] Add like error:", error)
        return { error: error.message, liked: false }
      }

      return { liked: true, success: true }
    }
  } catch (error) {
    console.error("[CampaignSocial] Toggle like exception:", error)
    return { error: "Failed to toggle like", liked: false }
  }
}

// Получить комментарии кампании
export async function getCampaignComments(campaignId: string, limit: number = 50) {
  try {
    const supabase = await createClient()
    
    const { data: comments, error } = await supabase
      .from("campaign_comments")
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("campaign_id", campaignId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[CampaignSocial] Get comments error:", error)
      return { comments: [], error: error.message }
    }

    return { comments: comments || [] }
  } catch (error) {
    console.error("[CampaignSocial] Get comments exception:", error)
    return { comments: [], error: "Failed to get comments" }
  }
}

// Добавить комментарий
export async function addCampaignComment(campaignId: string, content: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: "Вы должны быть авторизованы" }
    }

    if (!content || content.trim().length === 0) {
      return { error: "Комментарий не может быть пустым" }
    }

    if (content.length > 2000) {
      return { error: "Комментарий слишком длинный (максимум 2000 символов)" }
    }

    const { data: comment, error } = await supabase
      .from("campaign_comments")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error("[CampaignSocial] Add comment error:", error)
      return { error: error.message }
    }

    return { comment, success: true }
  } catch (error) {
    console.error("[CampaignSocial] Add comment exception:", error)
    return { error: "Failed to add comment" }
  }
}

// Удалить комментарий (soft delete)
export async function deleteCampaignComment(commentId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: "Вы должны быть авторизованы" }
    }

    const { error } = await supabase
      .from("campaign_comments")
      .update({ is_deleted: true })
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[CampaignSocial] Delete comment error:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[CampaignSocial] Delete comment exception:", error)
    return { error: "Failed to delete comment" }
  }
}

