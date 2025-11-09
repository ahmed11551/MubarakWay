import { NextRequest, NextResponse } from "next/server"
import { getCampaigns } from "@/lib/actions/campaigns"
import { fetchBotApiCampaigns } from "@/lib/bot-api"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status") || "active"
  const limit = parseInt(searchParams.get("limit") || "10")
  const ids = searchParams.get("ids") // Поддержка получения по ID

  try {
    // Если запрашиваются конкретные ID
    if (ids) {
      const { getCampaignById } = await import("@/lib/actions/campaigns")
      const idArray = ids.split(",").filter(Boolean)
      const campaigns = []
      
      for (const id of idArray) {
        const result = await getCampaignById(id)
        if (result.campaign) {
          campaigns.push(result.campaign)
        }
      }
      
      return NextResponse.json({ campaigns })
    }

    // Try to fetch from bot.e-replika.ru API first
    const botApiCampaigns = await fetchBotApiCampaigns(status, limit)
    if (botApiCampaigns && Array.isArray(botApiCampaigns) && botApiCampaigns.length > 0) {
      return NextResponse.json({ campaigns: botApiCampaigns })
    }

    // Fallback to Supabase
    const result = await getCampaigns(status)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Limit results
    const campaigns = (result.campaigns || []).slice(0, limit)

    return NextResponse.json({ campaigns })
  } catch (err) {
    console.error("/api/campaigns error", err)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

