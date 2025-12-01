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
    
    // Сначала пробуем RPC функцию
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_top_donors", {
      period: period,
      limit_count: limit,
    })

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      return { donors: rpcData as TopDonor[] }
    }

    // Если RPC не работает, используем fallback
    if (rpcError) {
      console.warn("[Ratings] Get top donors RPC error, using fallback:", rpcError.message)
    }

    // Fallback: прямой запрос к user_ratings
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
      // Если и fallback не работает, возвращаем пустой массив без ошибки
      // чтобы страница могла отобразиться
      return { donors: [] }
    }

    const donors: TopDonor[] = (fallbackData || []).map((item: any, index: number) => ({
      user_id: item.user_id,
      total_donated: Number(item.total_donated || 0),
      rank: index + 1,
      display_name: item.profiles?.display_name || null,
      avatar_url: item.profiles?.avatar_url || null,
    }))

    return { donors }
  } catch (error) {
    console.error("[Ratings] Get top donors exception:", error)
    // Возвращаем пустой массив вместо ошибки, чтобы страница могла отобразиться
    return { donors: [] }
  }
}

// Получить топ по реферальным ссылкам
export async function getTopReferrals(period: RatingPeriod = "all_time", limit: number = 100) {
  try {
    const supabase = await createClient()
    
    // Сначала пробуем RPC функцию
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_top_referrals", {
      period: period,
      limit_count: limit,
    })

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      return { referrals: rpcData as TopReferral[] }
    }

    // Если RPC не работает, используем fallback
    if (rpcError) {
      console.warn("[Ratings] Get top referrals RPC error, using fallback:", rpcError.message)
    }

    // Fallback: прямой запрос к user_ratings
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
      // Если и fallback не работает, возвращаем пустой массив без ошибки
      // чтобы страница могла отобразиться
      return { referrals: [] }
    }

    const referrals: TopReferral[] = (fallbackData || []).map((item: any, index: number) => ({
      user_id: item.user_id,
      referral_count: Number(item.referral_count || 0),
      rank: index + 1,
      display_name: item.profiles?.display_name || null,
      avatar_url: item.profiles?.avatar_url || null,
    }))

    return { referrals }
  } catch (error) {
    console.error("[Ratings] Get top referrals exception:", error)
    // Возвращаем пустой массив вместо ошибки, чтобы страница могла отобразиться
    return { referrals: [] }
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

