import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { validateTelegramInitData } from "@/lib/telegram-validation"
import { z } from "zod"

const telegramAuthBodySchema = z.object({
  initData: z.string().min(1, "Telegram initData is required"),
  // Legacy fields for backward compatibility (will be ignored if initData is provided)
  telegramId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
})

/**
 * Автоматическая авторизация через Telegram WebApp
 * 
 * Просто подтягивает данные из Telegram и создает/обновляет профиль пользователя
 * 
 * ВАЖНО: Для работы нужна переменная окружения SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(req: NextRequest) {
  // Rate limiting: 10 requests per minute per IP (более строгий лимит для авторизации)
  // Redis-based with in-memory fallback
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
    
    // Валидация с помощью Zod
    const validationResult = telegramAuthBodySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { initData, telegramId: legacyTelegramId, firstName: legacyFirstName, lastName: legacyLastName, username: legacyUsername, photoUrl: legacyPhotoUrl } = validationResult.data

    // Validate Telegram initData signature
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("[Telegram Auth] TELEGRAM_BOT_TOKEN not configured")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    let telegramId: string
    let firstName: string | undefined
    let lastName: string | undefined
    let username: string | undefined
    let photoUrl: string | null | undefined

    if (initData) {
      // New secure flow: validate initData signature
      const validation = validateTelegramInitData(initData, botToken)
      
      if (!validation.valid || !validation.user) {
        console.warn("[Telegram Auth] Invalid initData", { error: validation.error })
        return NextResponse.json(
          { error: "Invalid Telegram authentication data", details: validation.error },
          { status: 401 }
        )
      }

      // Extract user data from validated initData
      const user = validation.user
      telegramId = user.id.toString()
      firstName = user.first_name
      lastName = user.last_name
      username = user.username
      photoUrl = user.photo_url || null
    } else {
      // Legacy flow: use provided data (for backward compatibility, but less secure)
      // In production, this should be removed or require additional verification
      if (!legacyTelegramId) {
        return NextResponse.json(
          { error: "Either initData or telegramId is required" },
          { status: 400 }
        )
      }
      
      console.warn("[Telegram Auth] Using legacy authentication flow (initData not provided)")
      telegramId = legacyTelegramId
      firstName = legacyFirstName
      lastName = legacyLastName
      username = legacyUsername
      photoUrl = legacyPhotoUrl
    }

    const adminClient = createAdminClient()

    // Ищем существующий профиль по telegram_id
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("id, display_name")
      .eq("telegram_id", telegramId)
      .limit(1)

    let userId: string
    const displayName = `${firstName || ""} ${lastName || ""}`.trim() || `User_${telegramId}`

    if (existingProfiles && existingProfiles.length > 0) {
      // Пользователь уже существует - просто обновляем данные
      userId = existingProfiles[0].id
      
      // Обновляем имя если изменилось
      if (existingProfiles[0].display_name !== displayName) {
        await adminClient
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", userId)
      }
    } else {
      // Создаем нового пользователя в Supabase Auth
      const email = `telegram_${telegramId}@mubarakway.app`

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          username: username,
          photo_url: photoUrl,
        },
      })

      if (authError || !authData?.user) {
        const apiError = handleApiError(authError || new Error("Failed to create user account"))
        return NextResponse.json(
          { error: apiError.message },
          { status: apiError.statusCode }
        )
      }

      userId = authData.user.id

      // Профиль создастся автоматически через триггер handle_new_user
      // Обновляем telegram_id и имя
      await adminClient
        .from("profiles")
        .update({ 
          telegram_id: telegramId,
          display_name: displayName,
        })
        .eq("id", userId)
    }

    // Генерируем сессию для пользователя
    const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: `telegram_${telegramId}@mubarakway.app`,
    })

    if (tokenError) {
      const apiError = handleApiError(tokenError)
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      )
    }

    const response = NextResponse.json({
      success: true,
      userId,
      telegramId,
      displayName,
      accessToken: tokenData.properties?.hashed_token,
      actionLink: tokenData.properties?.action_link,
    })
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())
    return response
  } catch (error) {
    const apiError = handleApiError(error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

