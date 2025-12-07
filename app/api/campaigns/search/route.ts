import { NextRequest, NextResponse } from "next/server"
import { searchCampaigns } from "@/lib/actions/campaigns"
import { handleApiError } from "@/lib/error-handler"
import { searchCampaignsQuerySchema } from "@/lib/schemas/api"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"

export async function GET(req: NextRequest) {
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
    const query = searchParams.get("q") || searchParams.get("query") || ""
    const category = searchParams.get("category") || undefined
    const status = searchParams.get("status") || "active"
    const limit = parseInt(searchParams.get("limit") || "10")

    // Валидация параметров
    const validationResult = searchCampaignsQuerySchema.safeParse({
      query,
      category,
      status,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    if (!query.trim()) {
      return NextResponse.json({ campaigns: [] })
    }

    const result = await searchCampaigns(query, category, status)
    
    if (result.error) {
      const apiError = handleApiError(new Error(result.error))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Limit results
    const campaigns = (result.campaigns || []).slice(0, limit)

    const response = NextResponse.json({ campaigns })
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    return response
  } catch (err) {
    const apiError = handleApiError(err)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

