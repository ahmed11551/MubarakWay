"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Get fund statistics and reports
 */
export async function getFundReports(fundId: string) {
  const supabase = await createClient()

  try {
    // Get fund info
    const { data: fund, error: fundError } = await supabase
      .from("funds")
      .select("*")
      .eq("id", fundId)
      .eq("is_active", true)
      .single()

    if (fundError || !fund) {
      return { error: "Fund not found" }
    }

    // Get total donations for this fund
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("amount, currency, status, created_at")
      .eq("fund_id", fundId)
      .eq("status", "completed")

    if (donationsError) {
      console.error("[Fund Reports] Error fetching donations:", donationsError)
    }

    // Get campaigns linked to this fund
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, title, goal_amount, current_amount, currency, status, created_at")
      .eq("fund_id", fundId)

    if (campaignsError) {
      console.error("[Fund Reports] Error fetching campaigns:", campaignsError)
    }

    // Calculate statistics
    const totalDonations = (donations || []).reduce((sum, d) => sum + Number(d.amount || 0), 0)
    const donationCount = (donations || []).length
    const activeCampaigns = (campaigns || []).filter((c) => c.status === "active").length
    const completedCampaigns = (campaigns || []).filter((c) => c.status === "completed").length
    const totalCampaignsGoal = (campaigns || []).reduce((sum, c) => sum + Number(c.goal_amount || 0), 0)
    const totalCampaignsRaised = (campaigns || []).reduce((sum, c) => sum + Number(c.current_amount || 0), 0)

    // Group donations by month
    const donationsByMonth = (donations || []).reduce((acc: Record<string, number>, donation) => {
      const date = new Date(donation.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      acc[monthKey] = (acc[monthKey] || 0) + Number(donation.amount || 0)
      return acc
    }, {})

    // Get recent donations with donor info
    const { data: recentDonations, error: recentError } = await supabase
      .from("donations")
      .select(`
        *,
        profiles:donor_id (display_name, avatar_url)
      `)
      .eq("fund_id", fundId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentError) {
      console.error("[Fund Reports] Error fetching recent donations:", recentError)
    }

    return {
      fund,
      statistics: {
        totalDonations,
        donationCount,
        activeCampaigns,
        completedCampaigns,
        totalCampaignsGoal,
        totalCampaignsRaised,
        campaignsProgress: totalCampaignsGoal > 0 ? (totalCampaignsRaised / totalCampaignsGoal) * 100 : 0,
      },
      donationsByMonth,
      recentDonations: recentDonations || [],
      campaigns: campaigns || [],
    }
  } catch (error) {
    console.error("[Fund Reports] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Get all funds with their statistics
 */
export async function getAllFundsReports() {
  const supabase = await createClient()

  try {
    const { data: funds, error: fundsError } = await supabase
      .from("funds")
      .select("*")
      .eq("is_active", true)

    if (fundsError) {
      return { error: "Failed to fetch funds" }
    }

    // Get statistics for each fund
    const fundsWithStats = await Promise.all(
      (funds || []).map(async (fund) => {
        const { data: donations } = await supabase
          .from("donations")
          .select("amount, status")
          .eq("fund_id", fund.id)
          .eq("status", "completed")

        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, status")
          .eq("fund_id", fund.id)

        const totalDonations = (donations || []).reduce((sum, d) => sum + Number(d.amount || 0), 0)
        const donationCount = (donations || []).length
        const campaignCount = (campaigns || []).length

        return {
          ...fund,
          statistics: {
            totalDonations,
            donationCount,
            campaignCount,
          },
        }
      })
    )

    return { funds: fundsWithStats }
  } catch (error) {
    console.error("[Fund Reports] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

