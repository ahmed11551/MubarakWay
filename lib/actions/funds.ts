"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchBotApiFunds } from "@/lib/bot-api"

export async function getFunds(category?: string) {
  try {
    // Try to fetch from bot.e-replika.ru API first
    const botApiFunds = await fetchBotApiFunds(category)
    if (botApiFunds && Array.isArray(botApiFunds) && botApiFunds.length > 0) {
      return { funds: botApiFunds }
    }

    // Fallback to Supabase if Bot API is not available
    const supabase = await createClient()

    let query = supabase.from("funds").select("*").eq("is_active", true).order("total_raised", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: funds, error } = await query

    if (error) {
      console.error("[v0] Get funds error:", error)
      return { funds: [], error: "Failed to fetch funds" }
    }

    return { funds: funds || [] }
  } catch (error) {
    console.error("[v0] Get funds exception:", error)
    return { funds: [], error: "Failed to fetch funds" }
  }
}

export async function getFundById(id: string) {
  const supabase = await createClient()

  const { data: fund, error } = await supabase.from("funds").select("*").eq("id", id).eq("is_active", true).single()

  if (error) {
    console.error("[v0] Get fund error:", error)
    return { error: "Failed to fetch fund" }
  }

  return { fund }
}

export async function searchFunds(query: string) {
  const supabase = await createClient()

  const { data: funds, error } = await supabase
    .from("funds")
    .select("*")
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("total_raised", { ascending: false })
    .limit(10)

  if (error) {
    console.error("[v0] Search funds error:", error)
    return { error: "Failed to search funds" }
  }

  return { funds }
}

export async function deleteFund(fundId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to delete funds" }
  }

  // TODO: Check if user is admin
  // For now, allow any logged-in user to delete

  try {
    // Soft delete: set is_active to false instead of actually deleting
    const { data: fund, error: fundError } = await supabase
      .from("funds")
      .update({ is_active: false })
      .eq("id", fundId)
      .select()
      .single()

    if (fundError) {
      console.error("[v0] Fund deletion error:", fundError)
      return { error: "Failed to delete fund" }
    }

    return { success: true, fund }
  } catch (error) {
    console.error("[v0] Unexpected deletion error:", error)
    return { error: "An unexpected error occurred" }
  }
}
