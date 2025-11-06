"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, getCampaignApprovalEmail } from "@/lib/email"
import { sendTelegramMessage, getCampaignModerationNotificationMessage } from "@/lib/telegram"

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

    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected campaign error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getCampaigns(status?: string) {
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

    const { data: campaigns, error } = await query

    if (error) {
      console.error("[v0] Get campaigns error:", error)
      return { campaigns: [], error: "Failed to fetch campaigns" }
    }

    return { campaigns: campaigns || [] }
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

  return { campaign }
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

  // TODO: Check if user is admin
  // For now, allow any logged-in user to approve

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

    // Send notifications to creator
    if (campaignBefore?.profiles) {
      // Send email notification
      if (campaignBefore.profiles.email) {
        try {
          await sendEmail({
            to: campaignBefore.profiles.email,
            subject: `Кампания "${campaignBefore.title}" одобрена`,
            html: getCampaignApprovalEmail({
              title: campaignBefore.title,
              approved: true,
            }),
          })
        } catch (emailError) {
          console.error("[v0] Failed to send approval email:", emailError)
        }
      }

      // Send Telegram notification
      if (campaignBefore.profiles.telegram_id) {
        try {
          await sendTelegramMessage(
            campaignBefore.profiles.telegram_id,
            getCampaignModerationNotificationMessage({
              title: campaignBefore.title,
              approved: true,
            })
          )
        } catch (telegramError) {
          console.error("[v0] Failed to send approval telegram:", telegramError)
        }
      }
    }

    revalidatePath("/admin")
    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected approval error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function rejectCampaign(campaignId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to reject campaigns" }
  }

  // TODO: Check if user is admin
  // For now, allow any logged-in user to reject

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

    // Send notifications to creator
    if (campaignBefore?.profiles) {
      // Send email notification
      if (campaignBefore.profiles.email) {
        try {
          await sendEmail({
            to: campaignBefore.profiles.email,
            subject: `Кампания "${campaignBefore.title}" отклонена`,
            html: getCampaignApprovalEmail({
              title: campaignBefore.title,
              approved: false,
            }),
          })
        } catch (emailError) {
          console.error("[v0] Failed to send rejection email:", emailError)
        }
      }

      // Send Telegram notification
      if (campaignBefore.profiles.telegram_id) {
        try {
          await sendTelegramMessage(
            campaignBefore.profiles.telegram_id,
            getCampaignModerationNotificationMessage({
              title: campaignBefore.title,
              approved: false,
            })
          )
        } catch (telegramError) {
          console.error("[v0] Failed to send rejection telegram:", telegramError)
        }
      }
    }

    revalidatePath("/admin")
    revalidatePath("/campaigns")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Unexpected rejection error:", error)
    return { error: "An unexpected error occurred" }
  }
}
