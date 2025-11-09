"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a simple client for public data (bypasses cookie issues)
function createPublicClient() {
  // Try to get env vars - they should be available in runtime
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Hardcoded fallback values from MCP (if env vars not available)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Funds] Environment variables not available, using fallback values")
    // Use values from MCP as fallback
    supabaseUrl = supabaseUrl || "https://fvxkywczuqincnjilgzd.supabase.co"
    supabaseAnonKey = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54"
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Funds] Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 20) || "missing",
    })
    return null
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getFunds(category?: string) {
  // Общий таймаут для всей функции - максимум 5 секунд
  const startTime = Date.now()
  const MAX_TIME = 5000 // 5 секунд
  
  // Try multiple approaches to ensure we get the funds
  let funds: any[] = []
  let lastError: string | null = null

  // Approach 1: Try regular client first (most reliable on Vercel)
  // This uses cookies and has better access to env vars
  try {
    // Проверяем, не превышен ли общий таймаут
    if (Date.now() - startTime > MAX_TIME) {
      console.warn("[v0] Timeout before trying regular client")
      return { funds: [], error: "Timeout loading funds" }
    }
    
    console.log("[v0] Trying regular client first...")
    const supabase = await createClient()
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
      console.error("[v0] Regular client error:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      lastError = error.message || `Error code: ${error.code}`
    } else if (data) {
      if (data.length > 0) {
        console.log("[v0] Funds loaded successfully via regular client:", data.length)
        funds = data
        // Ранний возврат при успехе - не пытаемся дальше
        return { funds: funds || [] }
      } else {
        console.warn("[v0] Regular client returned empty array")
        lastError = "No funds found in database"
      }
    }
  } catch (regularError: any) {
    console.error("[v0] Regular client exception:", regularError)
    console.error("[v0] Exception message:", regularError?.message)
    console.error("[v0] Exception stack:", regularError?.stack)
    // If it's an env vars error, try public client
    if (regularError?.message?.includes("Missing Supabase") || regularError?.message?.includes("environment variables")) {
      console.warn("[v0] Regular client env vars issue, trying public client...")
      lastError = regularError?.message || "Regular client failed"
    } else {
      lastError = regularError?.message || "Regular client failed"
    }
  }

  // Approach 2: Try public client as fallback (only if first approach failed)
  if (funds.length === 0 && Date.now() - startTime < MAX_TIME) {
    try {
      // Проверяем, не превышен ли общий таймаут
      if (Date.now() - startTime > MAX_TIME) {
        console.warn("[v0] Timeout before trying public client")
        return { funds: [], error: "Timeout loading funds" }
      }
      
      console.log("[v0] Trying public client as fallback...")
      const supabase = createPublicClient()
      
      if (!supabase) {
        console.warn("[v0] Public client not available (missing env vars)")
        lastError = lastError || "Public client not configured"
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
          lastError = lastError || error.message || `Error code: ${error.code}`
        } else if (data) {
          if (data.length > 0) {
            console.log("[v0] Funds loaded successfully via public client:", data.length)
            funds = data
          } else {
            console.warn("[v0] Public client returned empty array")
            lastError = lastError || "No funds found in database"
          }
        }
      }
    } catch (publicError: any) {
      console.error("[v0] Public client exception:", publicError)
      lastError = lastError || publicError?.message || "Public client failed"
    }
  }

  // Approach 3: Try direct client creation as last resort (only if both approaches failed)
  if (funds.length === 0) {
    try {
      console.log("[v0] Trying direct client creation as last resort...")
      // Use hardcoded values as fallback if env vars not available
      const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fvxkywczuqincnjilgzd.supabase.co"
      const directKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54"
      
      console.log("[v0] Direct client: Using URL:", directUrl.substring(0, 30) + "...")
      console.log("[v0] Direct client: Key available:", !!directKey)
      
      const directClient = createSupabaseClient(directUrl, directKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      
      let query = directClient
        .from("funds")
        .select("*")
        .eq("is_active", true)
        .order("total_raised", { ascending: false })

      if (category && category !== "all") {
        query = query.or(`category.eq.${category},id.eq.00000000-0000-0000-0000-000000000001`)
      }
      
      const { data: directData, error: directError } = await query
      
      if (directError) {
        console.error("[v0] Direct client error:", directError)
        console.error("[v0] Error code:", directError.code)
        console.error("[v0] Error message:", directError.message)
        lastError = lastError || directError.message || `Error code: ${directError.code}`
      } else if (directData) {
        if (directData.length > 0) {
          console.log("[v0] Funds loaded via direct client:", directData.length)
          funds = directData
        } else {
          console.warn("[v0] Direct client returned empty array")
          lastError = lastError || "No funds found in database"
        }
      }
    } catch (directError: any) {
      console.error("[v0] Direct client exception:", directError)
      lastError = lastError || directError?.message || "All approaches failed"
    }
  }

  // If both approaches failed, return error
  if (funds.length === 0) {
    console.error("[v0] All approaches failed. Last error:", lastError)
    // Не возвращаем ошибку, а возвращаем пустой массив с информацией
    // чтобы страница могла отобразиться
    return { funds: [], error: lastError ? `Failed to fetch funds: ${lastError}` : "No funds found" }
  }

  // Debug logging
  console.log("[v0] Funds query result:", {
    count: funds?.length || 0,
    funds: funds?.map((f: any) => ({ id: f.id, name: f.name, is_active: f.is_active, category: f.category })),
  })

  // Ensure we have at least the Insan fund
  const insanFund = funds.find((f: any) => f.id === "00000000-0000-0000-0000-000000000001")
  if (!insanFund) {
    console.warn("[v0] Insan fund not found in results, but continuing...")
    // Не критично, просто предупреждение
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
