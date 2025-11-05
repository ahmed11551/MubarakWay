"use server"

import { createClient } from "@/lib/supabase/server"

export async function getFunds(category?: string) {
  const supabase = await createClient()

  let query = supabase.from("funds").select("*").eq("is_active", true).order("total_raised", { ascending: false })

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { data: funds, error } = await query

  if (error) {
    console.error("[v0] Get funds error:", error)
    return { error: "Failed to fetch funds" }
  }

  return { funds }
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
