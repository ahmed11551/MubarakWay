import { NextRequest, NextResponse } from "next/server"
import { searchCampaigns } from "@/lib/actions/campaigns"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get("q") || searchParams.get("query") || ""
  const category = searchParams.get("category") || undefined
  const status = searchParams.get("status") || "active"
  const limit = parseInt(searchParams.get("limit") || "10")

  if (!query.trim()) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
    const result = await searchCampaigns(query, category, status)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Limit results
    const campaigns = (result.campaigns || []).slice(0, limit)

    return NextResponse.json({ campaigns })
  } catch (err) {
    console.error("/api/campaigns/search error", err)
    return NextResponse.json({ error: "Failed to search campaigns" }, { status: 500 })
  }
}

