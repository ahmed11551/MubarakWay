import { NextRequest, NextResponse } from "next/server"
import { getFunds } from "@/lib/actions/funds"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { getFundsQuerySchema } from "@/lib/schemas/api"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get("category") || undefined
    const debug = searchParams.get("debug") === "true"

    // Валидация параметров
    if (category) {
      const validationResult = getFundsQuerySchema.safeParse({ category })
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid query parameters", details: validationResult.error.errors },
          { status: 400 }
        )
      }
    }
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
            urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || "missing",
            keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) || "missing",
          },
        })
      } catch (debugError) {
        const errorMessage = debugError instanceof Error ? debugError.message : String(debugError)
        const errorStack = debugError instanceof Error ? debugError.stack : undefined
        return NextResponse.json({
          debug: true,
          debugError: errorMessage,
          stack: errorStack,
          getFundsResult: await getFunds(category),
        }, { status: 500 })
      }
    }

    // getFunds now only fetches from Supabase (single Insan fund)
    const result = await getFunds(category)
    
    if (result.error) {
      const apiError = handleApiError(new Error(result.error))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    return NextResponse.json({ funds: result.funds || [] })
  } catch (err) {
    const apiError = handleApiError(err)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

