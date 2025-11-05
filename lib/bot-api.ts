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

