import { NextRequest, NextResponse } from "next/server"
import { getFunds } from "@/lib/actions/funds"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get("category") || undefined

  try {
    // getFunds now only fetches from Supabase (single Insan fund)
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

