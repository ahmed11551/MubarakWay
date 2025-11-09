"use client"

import type React from "react"

import { useEffect } from "react"
import { initTelegramApp, getTelegramUser } from "@/lib/telegram"

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const init = async () => {
      if (window.Telegram?.WebApp) {
        initTelegramApp()
        
        // Синхронизируем telegram_id при инициализации WebApp
        const telegramUser = getTelegramUser()
        if (telegramUser?.id) {
          try {
            const { syncTelegramId } = await import("@/lib/actions/profile")
            await syncTelegramId(telegramUser.id)
            console.log("[Telegram] Telegram ID synced:", telegramUser.id)
          } catch (error) {
            console.error("[Telegram] Failed to sync Telegram ID:", error)
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
