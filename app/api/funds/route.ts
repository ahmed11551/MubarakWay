import { NextRequest, NextResponse } from "next/server"
import { getFunds } from "@/lib/actions/funds"
import { fetchBotApiFunds } from "@/lib/bot-api"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { getFundsQuerySchema } from "@/lib/schemas/api"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { getCachedOrFetch, CacheKeys } from "@/lib/cache"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  // Rate limiting: 100 requests per minute per IP (Redis-based with in-memory fallback)
  const rateLimitResult = await rateLimitRequest(req, { max: 100, window: 60 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Maximum ${rateLimitResult.limit} requests per minute.`,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }
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
    // Debug endpoint - только в development режиме
    if (debug) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Debug mode is only available in development" }, { status: 403 })
      }
      
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

    // Try to fetch from bot.e-replika.ru API first (with caching)
    const cacheKey = CacheKeys.funds(category)
    const funds = await getCachedOrFetch(
      cacheKey,
      async () => {
        const botApiFunds = await fetchBotApiFunds(category)
        if (botApiFunds && Array.isArray(botApiFunds) && botApiFunds.length > 0) {
          logger.cache('set', cacheKey)
          return botApiFunds
        }

        // Fallback to Supabase
        const result = await getFunds(category)
        if (result.error) {
          throw new Error(result.error)
        }
        return result.funds || []
      },
      { revalidate: 600 } // 10 minutes cache for funds
    )

    const response = NextResponse.json({ funds })
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('GET', '/api/funds', 200, Date.now() - startTime)
    return response
  } catch (err) {
    const apiError = handleApiError(err)
    logger.apiError('GET', '/api/funds', err)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

