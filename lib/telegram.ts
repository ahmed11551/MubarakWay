"use client"

// Telegram Mini App utilities
export function getTelegramWebApp() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function initTelegramApp() {
  const tg = getTelegramWebApp()
  if (tg) {
    tg.ready()
    tg.expand()

    // Set theme based on Telegram theme
    if (tg.colorScheme === "dark") {
      document.documentElement.classList.add("dark")
    }
  }
}

export function getTelegramUser() {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user || null
}

// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        colorScheme: "light" | "dark"
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          onClick: (callback: () => void) => void
        }
        BackButton: {
          isVisible: boolean
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
        }
      }
    }
  }
}
