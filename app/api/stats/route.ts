import { NextRequest, NextResponse } from "next/server"
import { getPlatformStats } from "@/lib/stats"

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined
  const expected = process.env.API_AUTH_TOKEN
  
  if (!expected) {
    console.error("[Stats API] API_AUTH_TOKEN not configured")
    return false
  }
  
  return token === expected
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stats = await getPlatformStats()
    return NextResponse.json({
      total_collected: stats.totalCollected,
      active_donors: stats.activeDonors,
      active_campaigns: stats.activeCampaigns,
      average_check: stats.averageCheck,
    })
  } catch (err) {
    console.error("/api/stats error", err)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}



