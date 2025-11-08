"use server"

import { createClient } from "@/lib/supabase/server"

export type RatingPeriod = "all_time" | "ramadan"
export type RatingType = "donors" | "referrals"

interface TopDonor {
  user_id: string
  total_donated: number
  rank: number
  display_name: string | null
  avatar_url: string | null
}

interface TopReferral {
  user_id: string
  referral_count: number
  rank: number
  display_name: string | null
  avatar_url: string | null
}

// Получить топ доноров
export async function getTopDonors(period: RatingPeriod = "all_time", limit: number = 100) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc("get_top_donors", {
      period: period,
      limit_count: limit,
    })

    if (error) {
      console.error("[Ratings] Get top donors RPC error:", error)
      // Fallback: прямой запрос
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("user_ratings")
        .select(`
          user_id,
          total_donated,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("period_type", period)
        .order("total_donated", { ascending: false })
        .limit(limit)

      if (fallbackError) {
        console.error("[Ratings] Get top donors fallback error:", fallbackError)
        return { donors: [], error: fallbackError.message }
      }

      const donors: TopDonor[] = (fallbackData || []).map((item: any, index: number) => ({
        user_id: item.user_id,
        total_donated: Number(item.total_donated || 0),
        rank: index + 1,
        display_name: item.profiles?.display_name || null,
        avatar_url: item.profiles?.avatar_url || null,
      }))

      return { donors }
    }

    // Проверяем что data существует и является массивом
    if (!data || !Array.isArray(data)) {
      console.warn("[Ratings] Get top donors: data is not an array, returning empty")
      return { donors: [] }
    }

    return { donors: data as TopDonor[] }
  } catch (error) {
    console.error("[Ratings] Get top donors exception:", error)
    return { donors: [], error: "Failed to get top donors" }
  }
}

// Получить топ по реферальным ссылкам
export async function getTopReferrals(period: RatingPeriod = "all_time", limit: number = 100) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc("get_top_referrals", {
      period: period,
      limit_count: limit,
    })

    if (error) {
      console.error("[Ratings] Get top referrals RPC error:", error)
      // Fallback: прямой запрос
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("user_ratings")
        .select(`
          user_id,
          referral_count,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("period_type", period)
        .order("referral_count", { ascending: false })
        .limit(limit)

      if (fallbackError) {
        console.error("[Ratings] Get top referrals fallback error:", fallbackError)
        return { referrals: [], error: fallbackError.message }
      }

      const referrals: TopReferral[] = (fallbackData || []).map((item: any, index: number) => ({
        user_id: item.user_id,
        referral_count: Number(item.referral_count || 0),
        rank: index + 1,
        display_name: item.profiles?.display_name || null,
        avatar_url: item.profiles?.avatar_url || null,
      }))

      return { referrals }
    }

    // Проверяем что data существует и является массивом
    if (!data || !Array.isArray(data)) {
      console.warn("[Ratings] Get top referrals: data is not an array, returning empty")
      return { referrals: [] }
    }

    return { referrals: data as TopReferral[] }
  } catch (error) {
    console.error("[Ratings] Get top referrals exception:", error)
    return { referrals: [], error: "Failed to get top referrals" }
  }
}

// Получить позицию пользователя в рейтинге
export async function getUserRank(userId: string, period: RatingPeriod = "all_time", type: RatingType = "donors") {
  try {
    if (type === "donors") {
      const result = await getTopDonors(period, 10000)
      const userIndex = result.donors.findIndex((d) => d.user_id === userId)
      return { rank: userIndex >= 0 ? userIndex + 1 : null }
    } else {
      const result = await getTopReferrals(period, 10000)
      const userIndex = result.referrals.findIndex((r) => r.user_id === userId)
      return { rank: userIndex >= 0 ? userIndex + 1 : null }
    }
  } catch (error) {
    console.error("[Ratings] Get user rank exception:", error)
    return { rank: null, error: "Failed to get user rank" }
  }
}

