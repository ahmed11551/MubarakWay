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
        
        // Test 1: Simple query
        const { data: simpleData, error: simpleError } = await supabase
          .from("funds")
          .select("id, name, is_active")
          .eq("is_active", true)
        
        // Test 2: Full query
        const { data: fullData, error: fullError } = await supabase
          .from("funds")
          .select("*")
          .eq("is_active", true)
        
        // Test 3: getFunds result
        const getFundsResult = await getFunds(category)
        
        return NextResponse.json({
          debug: true,
          timestamp: new Date().toISOString(),
          tests: {
            simpleQuery: {
              data: simpleData,
              error: simpleError,
              count: simpleData?.length || 0,
            },
            fullQuery: {
              data: fullData,
              error: fullError,
              count: fullData?.length || 0,
            },
            getFunds: getFundsResult,
          },
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || "missing",
          },
        })
      } catch (debugError: any) {
        return NextResponse.json({
          debug: true,
          debugError: debugError.message,
          stack: debugError.stack,
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

