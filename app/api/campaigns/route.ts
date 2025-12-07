import { NextRequest, NextResponse } from "next/server"
import { getCampaigns } from "@/lib/actions/campaigns"
import { fetchBotApiCampaigns } from "@/lib/bot-api"
import { handleApiError } from "@/lib/error-handler"
import { getCampaignsQuerySchema } from "@/lib/schemas/api"
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
    
    // Валидация параметров запроса с помощью Zod
    const queryParams = {
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || undefined,
      ids: searchParams.get("ids") || undefined,
    }
    
    const validationResult = getCampaignsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { status, limit, ids } = validationResult.data

    // Если запрашиваются конкретные ID - используем batch-запрос вместо цикла
    if (ids) {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const idArray = ids.split(",").filter(Boolean)
      
      if (idArray.length === 0) {
        return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 })
      }
      
      // Batch-запрос с .in() вместо цикла
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          profiles:creator_id (display_name, avatar_url),
          campaign_updates (*)
        `)
        .in("id", idArray)
      
      if (error) {
        const apiError = handleApiError(error)
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
      }
      
      return NextResponse.json({ campaigns: campaigns || [] })
    }

    // Try to fetch from bot.e-replika.ru API first (with caching)
    const cacheKey = CacheKeys.campaigns(status)
    const campaigns = await getCachedOrFetch(
      cacheKey,
      async () => {
        const botApiCampaigns = await fetchBotApiCampaigns(status, limit)
        if (botApiCampaigns && Array.isArray(botApiCampaigns) && botApiCampaigns.length > 0) {
          logger.cache('set', cacheKey)
          return botApiCampaigns
        }

        // Fallback to Supabase
        const result = await getCampaigns(status)
        if (result.error) {
          throw new Error(result.error)
        }
        return result.campaigns || []
      },
      { revalidate: 300 } // 5 minutes cache
    )

    if (campaigns && Array.isArray(campaigns) && campaigns.length > 0) {
      const response = NextResponse.json({ campaigns: campaigns.slice(0, limit) })
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
      response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
      logger.apiRequest('GET', '/api/campaigns', 200, Date.now() - startTime)
      return response
    }

    // Fallback if cache returned empty
    const result = await getCampaigns(status)
    
    if (result.error) {
      const apiError = handleApiError(new Error(result.error))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Limit results
    const fallbackCampaigns = (result.campaigns || []).slice(0, limit)

    const response = NextResponse.json({ campaigns: fallbackCampaigns })
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('GET', '/api/campaigns', 200, Date.now() - startTime)
    return response
  } catch (err) {
    const apiError = handleApiError(err)
    logger.apiError('GET', '/api/campaigns', err)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

