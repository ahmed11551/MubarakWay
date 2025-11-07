"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchBotApiFunds } from "@/lib/bot-api"
import { fetchFondinsanPrograms, transformFondinsanProgramsToFunds } from "@/lib/fondinsan-api"

export async function getFunds(category?: string) {
  try {
    // Priority 1: Try to fetch from Fondinsan API
    try {
      const fondinsanPrograms = await fetchFondinsanPrograms()
      if (fondinsanPrograms && Array.isArray(fondinsanPrograms) && fondinsanPrograms.length > 0) {
        let funds = transformFondinsanProgramsToFunds(fondinsanPrograms)
        
        // Filter by category if specified
        if (category && category !== "all") {
          funds = funds.filter((f) => f && f.category === category)
        }
        
        // Filter out any invalid funds
        funds = funds.filter((f) => f && f.id)
        
        if (funds.length > 0) {
          return { funds }
        }
      }
    } catch (fondinsanError) {
      console.error("[v0] Fondinsan API error (falling back):", fondinsanError)
      // Continue to next priority
    }

    // Priority 2: Try to fetch from bot.e-replika.ru API
    const botApiFunds = await fetchBotApiFunds(category)
    if (botApiFunds && Array.isArray(botApiFunds) && botApiFunds.length > 0) {
      return { funds: botApiFunds }
    }

    // Priority 3: Fallback to Supabase if external APIs are not available
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
  try {
    // Check if it's a Fondinsan fund
    if (id && id.startsWith("fondinsan_")) {
      try {
        const { fetchFondinsanProgramById, transformFondinsanProgramToFund } = await import("@/lib/fondinsan-api")
        const programIdStr = id.replace("fondinsan_", "")
        const programId = parseInt(programIdStr, 10)
        
        if (isNaN(programId)) {
          console.error("[v0] Invalid Fondinsan program ID:", programIdStr)
        } else {
          const program = await fetchFondinsanProgramById(programId)
          
          if (program) {
            const fund = transformFondinsanProgramToFund(program)
            if (fund && fund.id) {
              return { fund }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching Fondinsan program:", error)
        // Fall through to Supabase
      }
    }

    // Fallback to Supabase
    const supabase = await createClient()

    const { data: fund, error } = await supabase.from("funds").select("*").eq("id", id).eq("is_active", true).single()

    if (error) {
      console.error("[v0] Get fund error:", error)
      return { error: "Failed to fetch fund" }
    }

    if (!fund) {
      return { error: "Fund not found" }
    }

    return { fund }
  } catch (error) {
    console.error("[v0] Get fund exception:", error)
    return { error: "Failed to fetch fund" }
  }
}

export async function searchFunds(query: string) {
  try {
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
      return { funds: [], error: "Failed to search funds" }
    }

    return { funds: funds || [] }
  } catch (error) {
    console.error("[v0] Search funds exception:", error)
    return { funds: [], error: "Failed to search funds" }
  }
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
