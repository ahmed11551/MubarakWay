import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Автоматическая авторизация через Telegram WebApp
 * 
 * Принимает данные пользователя из Telegram WebApp и создает/авторизует пользователя в Supabase
 * 
 * ВАЖНО: Для работы нужна переменная окружения SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const { telegramId, firstName, lastName, username } = await req.json()

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Ищем существующего пользователя по telegram_id
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("telegram_id", telegramId)
      .limit(1)

    let userId: string

    if (existingProfiles && existingProfiles.length > 0) {
      // Пользователь уже существует
      userId = existingProfiles[0].id
    } else {
      // Создаем нового пользователя
      const displayName = `${firstName || ""} ${lastName || ""}`.trim() || `User_${telegramId}`
      const email = `telegram_${telegramId}@mubarakway.app`

      // Создаем пользователя в Supabase Auth через admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          username: username,
        },
      })

      if (authError || !authData?.user) {
        console.error("[Auth] Failed to create user:", authError)
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        )
      }

      userId = authData.user.id

      // Профиль создастся автоматически через триггер handle_new_user
      // Но обновим telegram_id если нужно
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ telegram_id: telegramId })
        .eq("id", userId)

      if (profileError) {
        console.warn("[Auth] Failed to update profile telegram_id:", profileError)
        // Не критично, продолжаем
      }
    }

    // Генерируем access token для пользователя
    const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: `telegram_${telegramId}@mubarakway.app`,
    })

    if (tokenError) {
      console.error("[Auth] Failed to generate token:", tokenError)
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      userId,
      accessToken: tokenData.properties?.hashed_token,
      actionLink: tokenData.properties?.action_link,
    })
  } catch (error) {
    console.error("[Auth] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

