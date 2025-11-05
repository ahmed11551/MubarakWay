"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

    // Update user's total donated amount
    const { error: profileError } = await supabase.rpc("increment_total_donated", {
      user_id: user.id,
      amount: input.amount,
    })

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
    }

    // If donating to a campaign, update campaign amount
    if (input.campaignId) {
      const { error: campaignError } = await supabase.rpc("increment_campaign_amount", {
        campaign_id: input.campaignId,
        amount: input.amount,
      })

      if (campaignError) {
        console.error("[v0] Campaign update error:", campaignError)
      }
    }

    // If donating to a fund, update fund amount
    if (input.fundId) {
      const { error: fundError } = await supabase.rpc("increment_fund_amount", {
        fund_id: input.fundId,
        amount: input.amount,
      })

      if (fundError) {
        console.error("[v0] Fund update error:", fundError)
      }
    }

    revalidatePath("/")
    revalidatePath("/profile")

    return { success: true, donation }
  } catch (error) {
    console.error("[v0] Unexpected donation error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUserDonations() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view donations" }
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
    return { error: "Failed to fetch donations" }
  }

  return { donations }
}
