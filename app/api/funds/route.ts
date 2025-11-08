import { NextRequest, NextResponse } from "next/server"
import { getFunds } from "@/lib/actions/funds"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get("category") || undefined
  const debug = searchParams.get("debug") === "true"

  try {
    // Direct Supabase query for debugging
    if (debug) {
      try {
        const supabase = await createClient()
        const { data: directData, error: directError } = await supabase
          .from("funds")
          .select("*")
          .eq("is_active", true)
        
        return NextResponse.json({
          debug: true,
          directQuery: {
            data: directData,
            error: directError,
            count: directData?.length || 0,
          },
          getFundsResult: await getFunds(category),
        })
      } catch (debugError: any) {
        return NextResponse.json({
          debug: true,
          debugError: debugError.message,
          getFundsResult: await getFunds(category),
        }, { status: 500 })
      }
    }

    // getFunds now only fetches from Supabase (single Insan fund)
    const result = await getFunds(category)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ funds: result.funds || [] })
  } catch (err: any) {
    console.error("/api/funds error", err)
    return NextResponse.json({ 
      error: "Failed to fetch funds",
      details: err.message 
    }, { status: 500 })
  }
}

