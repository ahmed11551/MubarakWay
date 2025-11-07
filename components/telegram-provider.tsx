"use client"

import type React from "react"

import { useEffect } from "react"
import { initTelegramApp } from "@/lib/telegram"

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const init = () => {
      if (window.Telegram?.WebApp) {
        initTelegramApp()
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
