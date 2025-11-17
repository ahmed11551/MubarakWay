import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { handleApiError } from "@/lib/error-handler"
import { z } from "zod"

const telegramAuthBodySchema = z.object({
  telegramId: z.string().min(1, "Telegram ID is required"),
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
    
    const { telegramId, firstName, lastName, username, photoUrl } = validationResult.data

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

    return NextResponse.json({
      success: true,
      userId,
      telegramId,
      displayName,
      accessToken: tokenData.properties?.hashed_token,
      actionLink: tokenData.properties?.action_link,
    })
  } catch (error) {
    const apiError = handleApiError(error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

