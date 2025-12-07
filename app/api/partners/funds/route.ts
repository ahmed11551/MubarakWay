import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { getCachedOrFetch, CacheKeys } from "@/lib/cache"
import { logger } from "@/lib/logger"

/**
 * GET /api/partners/funds
 * Returns list of partner funds with filters
 * Query params: country, categories (comma-separated), search
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
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
    const supabase = await createClient()
    const searchParams = req.nextUrl.searchParams
    const country = searchParams.get("country")
    const categoriesParam = searchParams.get("categories")
    const search = searchParams.get("search") || searchParams.get("query")

    // Build query
    let query = supabase
      .from("funds")
      .select("*")
      .eq("partner_enabled", true)
      .eq("is_active", true)

    // Filter by country
    if (country) {
      query = query.eq("country_code", country)
    }

    // Filter by categories
    if (categoriesParam) {
      const categories = categoriesParam.split(",").map((c) => c.trim())
      query = query.in("category", categories)
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data: funds, error: fundsError } = await query.order("is_verified", { ascending: false }).order("name")

    if (fundsError) {
      const apiError = handleApiError(fundsError)
      logger.apiError('GET', '/api/partners/funds', fundsError)
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Transform funds to match API contract
    const transformedFunds = funds?.map((fund) => ({
      id: fund.id,
      name: fund.name,
      country_code: fund.country_code,
      categories: [fund.category],
      verified: fund.is_verified,
      logo_url: fund.logo_url,
      short_desc: fund.description?.substring(0, 200) || "",
      website: fund.website_url,
      social_links: fund.social_links || [],
    })) || []

    const response = NextResponse.json({ funds: transformedFunds })
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('GET', '/api/partners/funds', 200, Date.now() - startTime)
    return response
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('GET', '/api/partners/funds', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

