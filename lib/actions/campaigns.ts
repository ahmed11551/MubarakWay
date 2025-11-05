"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CampaignInput = {
  title: string
  description: string
  story: string
  goalAmount: number
  currency: string
  category: "medical" | "education" | "emergency" | "family" | "community" | "other"
  imageUrl?: string
  deadline?: Date
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
  const supabase = await createClient()

  let query = supabase
    .from("campaigns")
    .select(`
      *,
      profiles:creator_id (display_name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  } else {
    query = query.eq("status", "active")
  }

  const { data: campaigns, error } = await query

  if (error) {
    console.error("[v0] Get campaigns error:", error)
    return { error: "Failed to fetch campaigns" }
  }

  return { campaigns }
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
