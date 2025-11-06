import { NextRequest, NextResponse } from "next/server"
import { getFunds } from "@/lib/actions/funds"
import { fetchBotApiFunds } from "@/lib/bot-api"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get("category") || undefined

  try {
    // Try to fetch from bot.e-replika.ru API first
    const botApiFunds = await fetchBotApiFunds(category)
    if (botApiFunds && Array.isArray(botApiFunds) && botApiFunds.length > 0) {
      return NextResponse.json({ funds: botApiFunds })
    }

    // Fallback to Supabase
    const result = await getFunds(category)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ funds: result.funds || [] })
  } catch (err) {
    console.error("/api/funds error", err)
    return NextResponse.json({ error: "Failed to fetch funds" }, { status: 500 })
  }
}

