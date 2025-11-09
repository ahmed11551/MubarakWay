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
        
        // Автоматическая авторизация через Telegram
        const telegramUser = getTelegramUser()
        if (telegramUser?.id) {
          try {
            // Проверяем, авторизован ли пользователь
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            // Если пользователь не авторизован, авторизуем через Telegram
            if (!user) {
              const response = await fetch("/api/auth/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  telegramId: telegramUser.id,
                  firstName: telegramUser.firstName,
                  lastName: telegramUser.lastName,
                  username: telegramUser.username,
                }),
              })

              if (response.ok) {
                const { actionLink, accessToken } = await response.json()
                if (actionLink) {
                  // Используем action link для авторизации
                  // Извлекаем токен из URL
                  const url = new URL(actionLink)
                  const token = url.searchParams.get("token_hash") || url.searchParams.get("token") || url.hash.split("=")[1]
                  
                  if (token) {
                    // Используем verifyOtp для авторизации
                    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
                      token_hash: token,
                      type: "magiclink",
                    })

                    if (sessionError) {
                      console.warn("[Telegram] Failed to verify OTP:", sessionError)
                      // Если verifyOtp не работает, пробуем использовать accessToken напрямую
                      if (accessToken) {
                        try {
                          await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: accessToken,
                          })
                        } catch (setSessionError) {
                          console.warn("[Telegram] Failed to set session:", setSessionError)
                        }
                      }
                    } else {
                      console.log("[Telegram] User authenticated via Telegram")
                    }
                  } else if (accessToken) {
                    // Если токен не найден в URL, используем accessToken напрямую
                    try {
                      await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: accessToken,
                      })
                    } catch (setSessionError) {
                      console.warn("[Telegram] Failed to set session:", setSessionError)
                    }
                  }
                }
              } else {
                console.warn("[Telegram] Failed to authenticate via Telegram API")
              }
            } else {
              // Пользователь уже авторизован - синхронизируем telegram_id
              try {
                const { syncTelegramId } = await import("@/lib/actions/profile")
                await syncTelegramId(telegramUser.id)
                console.log("[Telegram] Telegram ID synced:", telegramUser.id)
              } catch (error) {
                console.error("[Telegram] Failed to sync Telegram ID:", error)
                // Не критично, продолжаем работу
              }
            }
          } catch (error) {
            console.error("[Telegram] Failed to authenticate:", error)
            // Не критично, продолжаем работу
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
