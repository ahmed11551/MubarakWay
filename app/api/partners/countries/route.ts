import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { logger } from "@/lib/logger"

/**
 * GET /api/partners/countries
 * Returns list of countries where partner funds are available
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
    
    // Get distinct countries from partner-enabled funds
    const { data: funds, error: fundsError } = await supabase
      .from("funds")
      .select("country_code")
      .eq("partner_enabled", true)
      .eq("is_active", true)
      .not("country_code", "is", null)

    if (fundsError) {
      const apiError = handleApiError(fundsError)
      logger.apiError('GET', '/api/partners/countries', fundsError)
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Get unique countries
    const countriesMap = new Map<string, string>()
    const countryNames: Record<string, string> = {
      RU: "Россия",
      KZ: "Казахстан",
      UZ: "Узбекистан",
      TR: "Турция",
      AE: "ОАЭ",
      SA: "Саудовская Аравия",
      US: "США",
      GB: "Великобритания",
      DE: "Германия",
      FR: "Франция",
      EG: "Египет",
      PK: "Пакистан",
      BD: "Бангладеш",
      ID: "Индонезия",
      MY: "Малайзия",
    }

    funds?.forEach((fund) => {
      if (fund.country_code && !countriesMap.has(fund.country_code)) {
        countriesMap.set(fund.country_code, countryNames[fund.country_code] || fund.country_code)
      }
    })

    const countries = Array.from(countriesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }))

    const response = NextResponse.json({ countries })
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('GET', '/api/partners/countries', 200, Date.now() - startTime)
    return response
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('GET', '/api/partners/countries', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

