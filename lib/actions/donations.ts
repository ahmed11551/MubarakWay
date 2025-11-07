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
      } else {
        // Send notification to campaign creator
        try {
          const { data: campaign } = await supabase
            .from("campaigns")
            .select(`
              title,
              creator_id,
              profiles:creator_id (email, display_name)
            `)
            .eq("id", input.campaignId)
            .single()

          if (campaign?.profiles) {
            const { data: donorProfile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", user.id)
              .single()

            const donorName = donorProfile?.display_name || "Пользователь"

            // Send email notification
            if (campaign.profiles.email) {
              try {
                await sendEmail({
                  to: campaign.profiles.email,
                  subject: `Новое пожертвование в вашу кампанию "${campaign.title}"`,
                  html: getCampaignDonationNotificationEmail({
                    title: campaign.title,
                    donorName,
                    amount: input.amount,
                    currency: input.currency,
                    isAnonymous: input.isAnonymous,
                  }),
                })
              } catch (emailError) {
                console.error("[v0] Failed to send campaign notification email:", emailError)
              }
            }

            // Send Telegram notification if user has telegram_id
            if (campaign.profiles.telegram_id) {
              try {
                await sendTelegramMessage(
                  campaign.profiles.telegram_id,
                  getCampaignDonationNotificationMessage({
                    title: campaign.title,
                    donorName,
                    amount: input.amount,
                    currency: input.currency,
                    isAnonymous: input.isAnonymous,
                  })
                )
              } catch (telegramError) {
                console.error("[v0] Failed to send campaign notification telegram:", telegramError)
              }
            }
          }
        } catch (emailError) {
          console.error("[v0] Failed to send campaign notification email:", emailError)
          // Don't fail the donation if email fails
        }
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

    // Send confirmation email to donor
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single()

      if (profile?.email) {
        // Get fund or campaign name
        let fundName: string | undefined
        let campaignName: string | undefined

        if (input.fundId) {
          const { data: fund } = await supabase
            .from("funds")
            .select("name, name_ru")
            .eq("id", input.fundId)
            .single()
          fundName = fund?.name_ru || fund?.name
        }

        if (input.campaignId) {
          const { data: campaign } = await supabase
            .from("campaigns")
            .select("title")
            .eq("id", input.campaignId)
            .single()
          campaignName = campaign?.title
        }

        await sendEmail({
          to: profile.email,
          subject: "Подтверждение пожертвования",
          html: getDonationConfirmationEmail({
            amount: input.amount,
            currency: input.currency,
            fundName,
            campaignName,
            isAnonymous: input.isAnonymous,
          }),
        })
      }
    } catch (emailError) {
      console.error("[v0] Failed to send confirmation email:", emailError)
      // Don't fail the donation if email fails
    }

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
