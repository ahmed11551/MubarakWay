import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { logger } from "@/lib/logger"
import { getCaptcha, storeCaptcha } from "@/lib/utils/captcha"
import { z } from "zod"

const partnerApplicationSchema = z.object({
  org_name: z.string().min(3).max(200),
  country_code: z.string().length(2),
  categories: z.array(z.string()).optional().default([]),
  website: z.string().url(),
  contact_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  telegram_username: z.string().optional(),
  about: z.string().max(1000).optional(),
  captcha_token: z.string().optional(),
  captcha_answer: z.number().optional(),
})

/**
 * POST /api/partners/applications
 * Submit a partnership application
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  // Stricter rate limit for applications (10 per minute)
  const rateLimitResult = await rateLimitRequest(req, { max: 10, window: 60 })
  
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
    const validationResult = partnerApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const data = validationResult.data

    // Verify CAPTCHA if provided
    if (data.captcha_token && data.captcha_answer !== undefined) {
      const stored = getCaptcha(data.captcha_token)
      if (!stored || stored.answer !== data.captcha_answer) {
        return NextResponse.json(
          { error: "CAPTCHA verification failed. Please try again." },
          { status: 400 }
        )
      }
    } else {
      // For production, require CAPTCHA
      // For now, we'll just log a warning
      logger.warn({
        message: "Попытка отправить заявку партнёра без CAPTCHA",
        email: data.email,
        userAgent: req.headers.get("user-agent") || "unknown",
      })
    }

    // Insert application
    const { data: application, error: applicationError } = await supabase
      .from("partner_applications")
      .insert({
        org_name: data.org_name,
        country_code: data.country_code,
        categories: data.categories || [],
        website: data.website,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone || null,
        telegram_username: data.telegram_username || null,
        about: data.about || null,
        status: "received",
      })
      .select()
      .single()

    if (applicationError) {
      const apiError = handleApiError(applicationError)
      logger.apiError('POST', '/api/partners/applications', applicationError)
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // TODO: Send notification to admins (email/Telegram)

    const response = NextResponse.json({
      application_id: application.id,
      status: "received",
    })
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    logger.apiRequest('POST', '/api/partners/applications', 200, Date.now() - startTime)
    return response
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('POST', '/api/partners/applications', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

