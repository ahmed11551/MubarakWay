"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a simple client for public data (bypasses cookie issues)
function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Funds] Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 20) || "missing",
    })
    // Не выбрасываем ошибку, а возвращаем null, чтобы fallback мог сработать
    return null
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getFunds(category?: string) {
  // Try multiple approaches to ensure we get the funds
  let funds: any[] = []
  let lastError: string | null = null

  // Approach 1: Try public client first (works for static generation)
  try {
    const supabase = createPublicClient()
    
    if (!supabase) {
      console.warn("[v0] Public client not available (missing env vars), skipping to fallback")
      lastError = "Public client not configured"
    } else {
      let query = supabase
        .from("funds")
        .select("*")
        .eq("is_active", true)
        .order("total_raised", { ascending: false })

      if (category && category !== "all") {
        query = query.or(`category.eq.${category},id.eq.00000000-0000-0000-0000-000000000001`)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Public client error:", error)
        console.error("[v0] Error code:", error.code)
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error details:", JSON.stringify(error, null, 2))
        lastError = error.message || `Error code: ${error.code}`
      } else if (data) {
        if (data.length > 0) {
          console.log("[v0] Funds loaded successfully via public client:", data.length)
          funds = data
        } else {
          console.warn("[v0] Public client returned empty array")
          lastError = "No funds found in database"
        }
      }
    }
  } catch (publicError: any) {
    console.error("[v0] Public client exception:", publicError)
    lastError = publicError?.message || "Public client failed"
  }

  // Approach 2: Try regular client as fallback (only if first approach failed)
  if (funds.length === 0) {
    try {
      console.log("[v0] Trying regular client as fallback...")
      const fallbackSupabase = await createClient()
      let query = fallbackSupabase
        .from("funds")
        .select("*")
        .eq("is_active", true)
        .order("total_raised", { ascending: false })

      if (category && category !== "all") {
        query = query.or(`category.eq.${category},id.eq.00000000-0000-0000-0000-000000000001`)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        console.log("[v0] Funds loaded successfully via regular client:", data.length)
        funds = data
      } else if (error) {
        console.warn("[v0] Regular client error:", error.message)
        lastError = lastError || error.message
      } else if (data && data.length === 0) {
        console.warn("[v0] Regular client returned empty array")
        lastError = lastError || "No funds found"
      }
    } catch (regularError: any) {
      console.warn("[v0] Regular client exception:", regularError?.message)
      lastError = lastError || regularError?.message || "Regular client failed"
    }
  }

  // If both approaches failed, return error
  if (funds.length === 0) {
    console.error("[v0] All approaches failed. Last error:", lastError)
    return { funds: [], error: `Failed to fetch funds: ${lastError || "Unknown error"}` }
  }

  // Debug logging
  console.log("[v0] Funds query result:", {
    count: funds?.length || 0,
    funds: funds?.map((f: any) => ({ id: f.id, name: f.name, is_active: f.is_active, category: f.category })),
  })

  // Ensure we have at least the Insan fund
  const insanFund = funds.find((f: any) => f.id === "00000000-0000-0000-0000-000000000001")
  if (!insanFund) {
    console.warn("[v0] Insan fund not found. Please run the migration script.")
  }

  return { funds: funds || [] }
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
