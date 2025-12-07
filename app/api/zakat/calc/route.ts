import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { logger } from "@/lib/logger"
import { trackZakat } from "@/lib/analytics"
import { z } from "zod"

const zakatCalcSchema = z.object({
  assets: z.object({
    cash_total: z.number().min(0).default(0),
    gold_g: z.number().min(0).default(0),
    silver_g: z.number().min(0).default(0),
    business_goods_value: z.number().min(0).default(0),
    investments: z.number().min(0).default(0),
    receivables_collectible: z.number().min(0).default(0),
    property_value: z.number().min(0).default(0),
    other_assets: z.number().min(0).default(0),
  }),
  debts_short_term: z.number().min(0).default(0),
  nisab_currency: z.string().default("RUB"),
  nisab_value: z.number().min(0),
  rate_percent: z.number().default(2.5),
})

// Current prices (should be fetched from API in production)
const GOLD_PRICE_PER_GRAM = 5200 // RUB
const SILVER_PRICE_PER_GRAM = 65 // RUB
const NISAB_GOLD_GRAMS = 85
const NISAB_SILVER_GRAMS = 595
const ZAKAT_RATE = 0.025 // 2.5%

/**
 * POST /api/zakat/calc
 * Calculate zakat amount
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const rateLimitResult = await rateLimitRequest(req, { max: 60, window: 60 })
  
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
    const body = await req.json()
    const validationResult = zakatCalcSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const { assets, debts_short_term, nisab_value, rate_percent } = data

    // Calculate total assets
    const goldValue = assets.gold_g * GOLD_PRICE_PER_GRAM
    const silverValue = assets.silver_g * SILVER_PRICE_PER_GRAM
    const totalAssets =
      assets.cash_total +
      goldValue +
      silverValue +
      assets.business_goods_value +
      assets.investments +
      assets.receivables_collectible +
      assets.property_value +
      assets.other_assets

    // Calculate net wealth
    const netWealth = totalAssets - debts_short_term

    // Check if above nisab
    const aboveNisab = netWealth >= nisab_value

    // Calculate zakat (2.5% of net wealth ABOVE nisab, not total)
    // Formula: zakat = (netWealth - nisab_value) * rate_percent / 100
    const zakatDue = aboveNisab ? (netWealth - nisab_value) * (rate_percent / 100) : 0

    // Save calculation if user is authenticated
    let calculationId: string | null = null
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: calculation, error: calcError } = await supabase
        .from("zakat_calculations")
        .insert({
          user_id: user.id,
          payload_json: {
            assets,
            debts_short_term,
            nisab_value,
            nisab_currency: data.nisab_currency,
            rate_percent,
          },
          zakat_due: zakatDue,
          above_nisab: aboveNisab,
          nisab_value: nisab_value,
          nisab_currency: data.nisab_currency,
        })
        .select()
        .single()

      if (!calcError && calculation) {
        calculationId = calculation.id
        
        // Track zakat calculation
        await trackZakat("calc_submitted", {
          userId: user.id,
          calculationId: calculation.id,
          zakatDue: zakatDue,
          aboveNisab: aboveNisab,
        })
      }
    }

    const response = NextResponse.json({
      zakat_due: Math.round(zakatDue * 100) / 100,
      above_nisab: aboveNisab,
      net_wealth: Math.round(netWealth * 100) / 100,
      total_assets: Math.round(totalAssets * 100) / 100,
      nisab_value: nisab_value,
      calculation_id: calculationId,
    })
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('POST', '/api/zakat/calc', 200, Date.now() - startTime)
    return response
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('POST', '/api/zakat/calc', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

