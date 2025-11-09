"use client"

import type React from "react"

import { useEffect } from "react"
import { initTelegramApp, getTelegramUser } from "@/lib/telegram"
import { createClient } from "@/lib/supabase/client"

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const init = async () => {
      if (window.Telegram?.WebApp) {
        initTelegramApp()
        
        // Автоматическая авторизация через Telegram - просто подтягиваем данные
        const telegramUser = getTelegramUser()
        if (telegramUser?.id) {
          try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            // Если пользователь не авторизован, подтягиваем данные из Telegram
            if (!user) {
              const response = await fetch("/api/auth/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  telegramId: telegramUser.id,
                  firstName: telegramUser.firstName,
                  lastName: telegramUser.lastName,
                  username: telegramUser.username,
                  photoUrl: telegramUser.photoUrl,
                }),
              })

              if (response.ok) {
                const { actionLink, accessToken } = await response.json()
                
                // Устанавливаем сессию через magic link
                if (actionLink) {
                  const url = new URL(actionLink)
                  const token = url.searchParams.get("token_hash") || url.searchParams.get("token")
                  
                  if (token) {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                      token_hash: token,
                      type: "magiclink",
                    })

                    if (verifyError) {
                      console.warn("[Telegram] Failed to verify OTP, trying direct session:", verifyError)
                    } else {
                      console.log("[Telegram] User authenticated via Telegram")
                    }
                  }
                }
              } else {
                const errorData = await response.json().catch(() => ({}))
                console.warn("[Telegram] Failed to authenticate:", errorData.error || "Unknown error")
              }
            } else {
              // Пользователь уже авторизован - просто синхронизируем telegram_id
              try {
                const { syncTelegramId } = await import("@/lib/actions/profile")
                await syncTelegramId(telegramUser.id)
                console.log("[Telegram] Telegram ID synced:", telegramUser.id)
              } catch (error) {
                console.error("[Telegram] Failed to sync Telegram ID:", error)
              }
            }
          } catch (error) {
            console.error("[Telegram] Failed to authenticate:", error)
          }
        }
      } else {
        // Retry after a short delay if script hasn't loaded yet
        setTimeout(init, 100)
      }
    }

    // Start initialization
    init()

    // Also listen for script load event
    const script = document.querySelector('script[src*="telegram-web-app.js"]')
    if (script) {
      script.addEventListener("load", init)
      return () => {
        script.removeEventListener("load", init)
      }
    }
  }, [])

  return <>{children}</>
}
