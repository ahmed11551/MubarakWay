import { NextRequest, NextResponse } from "next/server"
import { searchCampaigns } from "@/lib/actions/campaigns"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || undefined
  const status = searchParams.get("status") || "active"

  if (!query.trim()) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
    const result = await searchCampaigns(query, category, status)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ campaigns: result.campaigns || [] })
  } catch (err) {
    console.error("/api/campaigns/search error", err)
    return NextResponse.json({ error: "Failed to search campaigns" }, { status: 500 })
  }
}

