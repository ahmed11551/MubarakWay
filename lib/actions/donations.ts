"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, getDonationConfirmationEmail, getCampaignDonationNotificationEmail } from "@/lib/email"
import { sendTelegramMessage, getCampaignDonationNotificationMessage } from "@/lib/telegram"

export type DonationInput = {
  amount: number
  currency: string
  donationType: "one_time" | "recurring"
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  category: "sadaqah" | "zakat" | "general"
  fundId?: string
  campaignId?: string
  message?: string
  isAnonymous: boolean
}

export async function createDonation(input: DonationInput) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to make a donation" }
  }

  try {
    // Insert donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: user.id,
        fund_id: input.fundId || null,
        campaign_id: input.campaignId || null,
        amount: input.amount,
        currency: input.currency,
        donation_type: input.donationType === "one_time" ? "one_time" : "recurring",
        recurring_frequency: input.frequency || null,
        is_anonymous: input.isAnonymous,
        message: input.message || null,
        status: "pending",
      })
      .select()
      .single()

    if (donationError) {
      console.error("[v0] Donation creation error:", donationError)
      return { error: "Failed to create donation record" }
    }

    // NOTE: Do NOT update amounts here - they will be updated in webhook after successful payment
    // This prevents double-counting if payment fails or is cancelled

    revalidatePath("/")
    revalidatePath("/profile")

    // NOTE: Email confirmation will be sent in webhook after successful payment
    // This prevents sending emails for failed or cancelled payments

    return { success: true, donation }
  } catch (error) {
    console.error("[v0] Unexpected donation error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUserDonations() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { donations: [], error: "You must be logged in to view donations" }
    }

    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        *,
        funds:fund_id (name, logo_url),
        campaigns:campaign_id (title, image_url)
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get donations error:", error)
      return { donations: [], error: "Failed to fetch donations" }
    }

    return { donations: donations || [] }
  } catch (error) {
    console.error("[v0] Get donations exception:", error)
    return { donations: [], error: "Failed to fetch donations" }
  }
}

export async function getAllDonations() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view all donations" }
  }

  // TODO: Check if user is admin
  // For now, allow any logged-in user to view all donations

  try {
    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        *,
        profiles:donor_id (display_name, email),
        funds:fund_id (name),
        campaigns:campaign_id (title)
      `)
      .order("created_at", { ascending: false })
      .limit(100) // Limit to last 100 donations

    if (error) {
      console.error("[v0] Get all donations error:", error)
      return { donations: [], error: "Failed to fetch donations" }
    }

    return { donations: donations || [] }
  } catch (error) {
    console.error("[v0] Get all donations exception:", error)
    return { donations: [], error: "Failed to fetch donations" }
  }
}
