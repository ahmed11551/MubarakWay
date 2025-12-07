"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, getCampaignApprovalEmail } from "@/lib/email"
import { sendTelegramMessage, getCampaignModerationNotificationMessage } from "@/lib/telegram"
import { isAdmin } from "@/lib/utils/admin"

export type CampaignInput = {
  title: string
  description: string
  story: string
  goalAmount: number
  currency: string
  category: "medical" | "education" | "emergency" | "family" | "community" | "other"
  imageUrl?: string
  deadline?: Date
  fundId?: string
  linkedProjectIds?: string[] // ID связанных проектов (кампаний)
}

// Validation constants
const MIN_TITLE_LENGTH = 3
const MAX_TITLE_LENGTH = 200
const MIN_DESCRIPTION_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 500
const MIN_STORY_LENGTH = 20
const MAX_STORY_LENGTH = 10000
const MIN_GOAL_AMOUNT = 1
const MAX_GOAL_AMOUNT = 100000000 // 100 million
const VALID_CURRENCIES = ["RUB", "USD", "EUR"]
const VALID_CATEGORIES = ["medical", "education", "emergency", "family", "community", "other"]

/**
 * Validate campaign input data
 */
function validateCampaignInput(input: CampaignInput): string | null {
  // Validate title
  if (!input.title || typeof input.title !== "string") {
    return "Название кампании обязательно"
  }
  const titleTrimmed = input.title.trim()
  if (titleTrimmed.length < MIN_TITLE_LENGTH) {
    return `Название кампании должно содержать минимум ${MIN_TITLE_LENGTH} символа`
  }
  if (titleTrimmed.length > MAX_TITLE_LENGTH) {
    return `Название кампании не должно превышать ${MAX_TITLE_LENGTH} символов`
  }

  // Validate description
  if (!input.description || typeof input.description !== "string") {
    return "Описание кампании обязательно"
  }
  const descTrimmed = input.description.trim()
  if (descTrimmed.length < MIN_DESCRIPTION_LENGTH) {
    return `Описание должно содержать минимум ${MIN_DESCRIPTION_LENGTH} символов`
  }
  if (descTrimmed.length > MAX_DESCRIPTION_LENGTH) {
    return `Описание не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`
  }

  // Validate story
  if (!input.story || typeof input.story !== "string") {
    return "История кампании обязательна"
  }
  const storyTrimmed = input.story.trim()
  if (storyTrimmed.length < MIN_STORY_LENGTH) {
    return `История должна содержать минимум ${MIN_STORY_LENGTH} символов`
  }
  if (storyTrimmed.length > MAX_STORY_LENGTH) {
    return `История не должна превышать ${MAX_STORY_LENGTH} символов`
  }

  // Validate goal amount
  if (typeof input.goalAmount !== "number" || Number.isNaN(input.goalAmount)) {
    return "Целевая сумма должна быть числом"
  }
  if (input.goalAmount < MIN_GOAL_AMOUNT) {
    return `Целевая сумма должна быть не менее ${MIN_GOAL_AMOUNT} ${input.currency || "RUB"}`
  }
  if (input.goalAmount > MAX_GOAL_AMOUNT) {
    return `Целевая сумма не должна превышать ${MAX_GOAL_AMOUNT.toLocaleString("ru-RU")} ${input.currency || "RUB"}`
  }

  // Validate currency
  if (!input.currency || !VALID_CURRENCIES.includes(input.currency)) {
    return `Неверная валюта. Допустимые валюты: ${VALID_CURRENCIES.join(", ")}`
  }

  // Validate category
  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    return `Неверная категория. Допустимые категории: ${VALID_CATEGORIES.join(", ")}`
  }

  // Validate deadline if provided
  if (input.deadline) {
    const deadlineDate = new Date(input.deadline)
    if (isNaN(deadlineDate.getTime())) {
      return "Неверный формат даты дедлайна"
    }
    if (deadlineDate < new Date()) {
      return "Дедлайн не может быть в прошлом"
    }
  }

  // Validate fundId format (UUID) if provided
  if (input.fundId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(input.fundId)) {
      return "Неверный формат ID фонда"
    }
  }

  // Validate linkedProjectIds if provided
  if (input.linkedProjectIds && Array.isArray(input.linkedProjectIds)) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    for (const linkedId of input.linkedProjectIds) {
      if (typeof linkedId !== "string" || !uuidRegex.test(linkedId)) {
        return "Неверный формат ID связанного проекта"
      }
    }
  }

  // Validate imageUrl format if provided
  if (input.imageUrl) {
    try {
      const url = new URL(input.imageUrl)
      if (!url.protocol.startsWith("http")) {
        return "URL изображения должен использовать протокол HTTP или HTTPS"
      }
    } catch {
      return "Неверный формат URL изображения"
    }
  }

  return null
}

export async function createCampaign(input: CampaignInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to create a campaign" }
  }

  // Validate input data
  const validationError = validateCampaignInput(input)
  if (validationError) {
    return { error: validationError }
  }

  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description,
        story: input.story,
        goal_amount: input.goalAmount,
        currency: input.currency,
        category: input.category,
        image_url: input.imageUrl || null,
        deadline: input.deadline || null,
        fund_id: input.fundId || null,
        status: "pending", // Requires approval
      })
      .select()
      .single()

    if (campaignError) {
      console.error("[v0] Campaign creation error:", campaignError)
      return { error: "Failed to create campaign" }
    }

    // Сохраняем связи с проектами, если они указаны
    if (input.linkedProjectIds && input.linkedProjectIds.length > 0 && campaign.id) {
      const links = input.linkedProjectIds.map((linkedId) => ({
        campaign_id: campaign.id,
        linked_campaign_id: linkedId,
      }))

      const { error: linksError } = await supabase
        .from("campaign_project_links")
        .insert(links)

      if (linksError) {
        console.error("[v0] Campaign links creation error:", linksError)
        // Не критично, продолжаем
      }
    }

    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected campaign error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getCampaigns(status?: string, page: number = 0, pageSize: number = 20) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("campaigns")
      .select(`
        *,
        profiles:creator_id (display_name, avatar_url)
      `)
      .order("created_at", { ascending: false })

    // Only filter by status if explicitly provided
    // If status is undefined, return all campaigns
    if (status !== undefined) {
      query = query.eq("status", status)
    }

    // Get total count first (separate query)
    let countQuery = supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
    if (status !== undefined) {
      countQuery = countQuery.eq("status", status)
    }
    const { count } = await countQuery

    // Add pagination
    const from = page * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: campaigns, error } = await query

    if (error) {
      console.error("[v0] Get campaigns error:", error)
      return { campaigns: [], error: "Failed to fetch campaigns", total: 0, hasMore: false }
    }

    const total = count || 0
    const hasMore = total > to + 1

    return { campaigns: campaigns || [], total, hasMore }
  } catch (error) {
    console.error("[v0] Get campaigns exception:", error)
    return { campaigns: [], error: "Failed to fetch campaigns" }
  }
}

export async function searchCampaigns(query: string, category?: string, status?: string) {
  try {
    const supabase = await createClient()

    let supabaseQuery = supabase
      .from("campaigns")
      .select(`
        *,
        profiles:creator_id (display_name, avatar_url)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,story.ilike.%${query}%`)
      .order("created_at", { ascending: false })

    if (status) {
      supabaseQuery = supabaseQuery.eq("status", status)
    } else {
      supabaseQuery = supabaseQuery.eq("status", "active")
    }

    if (category && category !== "all") {
      supabaseQuery = supabaseQuery.eq("category", category)
    }

    const { data: campaigns, error } = await supabaseQuery

    if (error) {
      console.error("[v0] Search campaigns error:", error)
      return { campaigns: [], error: "Failed to search campaigns" }
    }

    return { campaigns: campaigns || [] }
  } catch (error) {
    console.error("[v0] Search campaigns exception:", error)
    return { campaigns: [], error: "Failed to search campaigns" }
  }
}

export async function getCampaignById(id: string) {
  try {
    const supabase = await createClient()

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        profiles:creator_id (display_name, avatar_url),
        campaign_updates (*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("[v0] Get campaign error:", error)
      return { error: "Failed to fetch campaign" }
    }

    if (!campaign) {
      return { error: "Campaign not found" }
    }

    return { campaign }
  } catch (error) {
    console.error("[v0] Get campaign exception:", error)
    return { error: "Failed to fetch campaign" }
  }
}

export async function createCampaignUpdate(campaignId: string, title: string, content: string, imageUrl?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to post updates" }
  }

  // Verify user is the campaign creator
  const { data: campaign } = await supabase.from("campaigns").select("creator_id").eq("id", campaignId).single()

  if (!campaign || campaign.creator_id !== user.id) {
    return { error: "You can only post updates to your own campaigns" }
  }

  const { data: update, error } = await supabase
    .from("campaign_updates")
    .insert({
      campaign_id: campaignId,
      title,
      content,
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Campaign update error:", error)
    return { error: "Failed to create update" }
  }

  revalidatePath(`/campaigns/${campaignId}`)

  return { success: true, update }
}

export async function approveCampaign(campaignId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to approve campaigns" }
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { error: "You must be an admin to approve campaigns" }
  }

  try {
    // Get campaign with creator info before updating
    const { data: campaignBefore } = await supabase
      .from("campaigns")
      .select(`
        title,
        creator_id,
        profiles!campaigns_creator_id_fkey (email, telegram_id)
      `)
      .eq("id", campaignId)
      .single()

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .update({ status: "active" })
      .eq("id", campaignId)
      .select()
      .single()

    if (campaignError) {
      console.error("[v0] Campaign approval error:", campaignError)
      return { error: "Failed to approve campaign" }
    }

    // Send notifications to creator using new notification system
    try {
      const { notifyCampaignStatusChange } = await import("@/lib/notifications")
      await notifyCampaignStatusChange(campaignId, "approved")
    } catch (notificationError) {
      console.error("[v0] Failed to send approval notification:", notificationError)
      // Don't fail the approval if notification fails
    }

    revalidatePath("/admin")
    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected approval error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function rejectCampaign(campaignId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to reject campaigns" }
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { error: "You must be an admin to reject campaigns" }
  }

  try {
    // Get campaign with creator info before updating
    const { data: campaignBefore } = await supabase
      .from("campaigns")
      .select(`
        title,
        creator_id,
        profiles!campaigns_creator_id_fkey (email, telegram_id)
      `)
      .eq("id", campaignId)
      .single()

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .update({ status: "rejected" })
      .eq("id", campaignId)
      .select()
      .single()

    if (campaignError) {
      console.error("[v0] Campaign rejection error:", campaignError)
      return { error: "Failed to reject campaign" }
    }

    // Send notifications to creator using new notification system
    try {
      const { notifyCampaignStatusChange } = await import("@/lib/notifications")
      await notifyCampaignStatusChange(campaignId, "rejected", reason)
    } catch (notificationError) {
      console.error("[v0] Failed to send rejection notification:", notificationError)
      // Don't fail the rejection if notification fails
    }

    revalidatePath("/admin")
    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected rejection error:", error)
    return { error: "An unexpected error occurred" }
  }
}
