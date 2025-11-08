"use server"

import { createClient } from "@/lib/supabase/server"

export async function getFunds(category?: string) {
  try {
    const supabase = await createClient()

    // Get the main fund "Инсан" from Supabase
    // This is the primary fund - all campaigns and programs are linked to it
    let query = supabase
      .from("funds")
      .select("*")
      .eq("is_active", true)
      .order("total_raised", { ascending: false })

    // Filter by category if specified (but still return Insan fund as it's general)
    if (category && category !== "all") {
      // Always include the main Insan fund (general category)
      // Use or() with proper syntax: field.eq.value,field2.eq.value2
      query = query.or(`category.eq.${category},id.eq.00000000-0000-0000-0000-000000000001`)
    }

    const { data: funds, error } = await query

    // If error, try to get more details
    if (error) {
      // Check if it's an RLS policy issue
      if (error.code === 'PGRST116' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.error("[v0] RLS policy issue - trying direct query")
        // Try without RLS (shouldn't happen, but for debugging)
        const directQuery = supabase
          .from("funds")
          .select("*")
          .eq("is_active", true)
        const { data: directData, error: directError } = await directQuery
        if (directError) {
          console.error("[v0] Direct query also failed:", directError)
        } else {
          console.log("[v0] Direct query succeeded, RLS might be blocking:", directData?.length || 0)
        }
      }
    }

    if (error) {
      console.error("[v0] Get funds error:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return { funds: [], error: `Failed to fetch funds: ${error.message || "Unknown error"}` }
    }

    // Debug logging
    console.log("[v0] Funds query result:", {
      count: funds?.length || 0,
      funds: funds?.map((f: any) => ({ id: f.id, name: f.name, is_active: f.is_active, category: f.category })),
    })

    // If no funds found, return empty array
    // The Insan fund should be created via migration script
    if (!funds || funds.length === 0) {
      console.warn("[v0] No funds found in database. Please run the migration script to create the Insan fund.")
      return { funds: [], error: "No active funds found in database" }
    }

    // Ensure we have at least the Insan fund
    const insanFund = funds.find((f: any) => f.id === "00000000-0000-0000-0000-000000000001")
    if (!insanFund) {
      console.warn("[v0] Insan fund not found. Please run the migration script.")
    }

    return { funds: funds || [] }
  } catch (error) {
    console.error("[v0] Get funds exception:", error)
    return { funds: [], error: "Failed to fetch funds" }
  }
}

export async function getFundById(id: string) {
  try {
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
