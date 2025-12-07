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
    investments_for_trade: z.boolean().default(false), // Для Ханафи: инвестиции для торговли
    receivables_collectible: z.number().min(0).default(0),
    property_value: z.number().min(0).default(0),
    other_assets: z.number().min(0).default(0),
  }),
  debts_short_term: z.number().min(0).default(0),
  debts_due_this_year: z.number().min(0).default(0), // Для Шафии: долги, которые вернут в этом году
  madhab: z.enum(["hanafi", "shafi", "maliki", "hanbali"]).default("hanafi"),
  nisab_currency: z.string().default("RUB"),
  rate_percent: z.number().default(2.5),
})

// Current prices (should be fetched from API in production)
const GOLD_PRICE_PER_GRAM = 7500 // RUB (обновлено на декабрь 2025)
const SILVER_PRICE_PER_GRAM = 80 // RUB
const NISAB_GOLD_GRAMS = 85
const NISAB_SILVER_GRAMS = 595
const ZAKAT_RATE = 0.025 // 2.5%

type Madhab = "hanafi" | "shafi" | "maliki" | "hanbali"

/**
 * Calculate nisab value based on madhab
 */
function calculateNisab(madhab: Madhab): number {
  const goldNisabRub = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM // ≈ 637 500 ₽
  const silverNisabRub = NISAB_SILVER_GRAMS * SILVER_PRICE_PER_GRAM // ≈ 47 600 ₽

  switch (madhab) {
    case "hanafi":
    case "hanbali":
      // Ханафи и Ханбали: нисаб по золоту
      return goldNisabRub
    case "shafi":
      // Шафии: минимум из золота и серебра
      return Math.min(goldNisabRub, silverNisabRub)
    case "maliki":
      // Малики: нисаб по серебру
      return silverNisabRub
    default:
      return goldNisabRub
  }
}

/**
 * Calculate deductible debts based on madhab
 */
function calculateDeductibleDebts(
  debtsShortTerm: number,
  debtsDueThisYear: number,
  madhab: Madhab
): number {
  switch (madhab) {
    case "shafi":
      // Шафии: только долги, которые вернут в этом году
      return debtsDueThisYear
    case "hanafi":
    case "maliki":
    case "hanbali":
      // Остальные: все краткосрочные долги
      return debtsShortTerm
    default:
      return debtsShortTerm
  }
}

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
    const { assets, debts_short_term, debts_due_this_year, madhab, rate_percent } = data

    // Calculate nisab based on madhab
    const nisabValue = calculateNisab(madhab)

    // Calculate deductible debts based on madhab
    const deductibleDebts = calculateDeductibleDebts(
      debts_short_term,
      debts_due_this_year,
      madhab
    )

    // Calculate total assets
    const goldValue = assets.gold_g * GOLD_PRICE_PER_GRAM
    const silverValue = assets.silver_g * SILVER_PRICE_PER_GRAM

    // For Hanafi: investments only count if they're for trade
    let investmentsValue = 0
    if (madhab === "hanafi") {
      investmentsValue = assets.investments_for_trade ? assets.investments : 0
    } else {
      // For other madhabs: investments count as money
      investmentsValue = assets.investments
    }

    const totalAssets =
      assets.cash_total +
      goldValue +
      silverValue +
      assets.business_goods_value +
      investmentsValue +
      assets.receivables_collectible +
      assets.property_value +
      assets.other_assets

    // Calculate net wealth (assets minus deductible debts)
    const netWealth = totalAssets - deductibleDebts

    // Check if above nisab
    const aboveNisab = netWealth >= nisabValue

    // Calculate zakat (2.5% of net wealth ABOVE nisab, not total)
    // Formula: zakat = (netWealth - nisabValue) * rate_percent / 100
    const zakatDue = aboveNisab ? (netWealth - nisabValue) * (rate_percent / 100) : 0

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
            debts_due_this_year,
            madhab,
            nisab_value: nisabValue,
            nisab_currency: data.nisab_currency,
            rate_percent,
          },
          zakat_due: zakatDue,
          above_nisab: aboveNisab,
          nisab_value: nisabValue,
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
      zakat_due: Math.floor(zakatDue), // Без копеек согласно фикху
      above_nisab: aboveNisab,
      net_wealth: Math.round(netWealth * 100) / 100,
      total_assets: Math.round(totalAssets * 100) / 100,
      nisab_value: nisabValue,
      madhab: madhab,
      deductible_debts: deductibleDebts,
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

