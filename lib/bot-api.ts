// Client for bot.e-replika.ru API
const BOT_API_BASE = process.env.BOT_API_BASE_URL || "https://bot.e-replika.ru"
const BOT_API_TOKEN = process.env.BOT_API_TOKEN || "test_token_123"

export async function fetchBotApiStats() {
  try {
    const response = await fetch(`${BOT_API_BASE}/api/stats`, {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Bot API returned ${response.status}`)
    }

    const data = await response.json()
    return {
      totalCollected: Number(data.total_collected || 0),
      activeDonors: Number(data.active_donors || 0),
      activeCampaigns: Number(data.active_campaigns || 0),
      averageCheck: Number(data.average_check || 0),
    }
  } catch (error) {
    console.error("[Bot API] Error fetching stats:", error)
    // Fallback to Supabase if Bot API fails
    return null
  }
}

export async function fetchBotApi(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BOT_API_BASE}${endpoint}`
  
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${BOT_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  })
}

export async function fetchBotApiFunds(category?: string) {
  try {
    const endpoint = category && category !== "all" 
      ? `/api/funds?category=${category}` 
      : `/api/funds`
    
    const response = await fetchBotApi(endpoint)
    
    if (!response.ok) {
      throw new Error(`Bot API returned ${response.status}`)
    }

    const data = await response.json()
    return data.funds || data.organizations || data || []
  } catch (error) {
    console.error("[Bot API] Error fetching funds:", error)
    return null
  }
}

export async function fetchBotApiCampaigns(status?: string, limit?: number) {
  try {
    const params = new URLSearchParams()
    if (status) params.append("status", status)
    if (limit) params.append("limit", String(limit))
    
    const endpoint = `/api/campaigns${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetchBotApi(endpoint)
    
    if (!response.ok) {
      throw new Error(`Bot API returned ${response.status}`)
    }

    const data = await response.json()
    return data.campaigns || data || []
  } catch (error) {
    console.error("[Bot API] Error fetching campaigns:", error)
    return null
  }
}

