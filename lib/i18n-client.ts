/**
 * Client-side i18n utilities
 * Simplified version without next-intl dependency for stable builds
 */

"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { getTextDirection, locales, type Locale } from "@/i18n"

/**
 * Get current locale from pathname or default
 */
export function useLocale(): Locale {
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>("ru")
  
  useEffect(() => {
    const pathLocale = pathname.split("/")[1]
    if (locales.includes(pathLocale as Locale)) {
      setLocale(pathLocale as Locale)
    } else {
      setLocale("ru")
    }
  }, [pathname])
  
  return locale
}

/**
 * Get translations hook (simplified - returns key as fallback)
 */
export function useTranslations(namespace?: string) {
  const locale = useLocale()
  const [messages, setMessages] = useState<Record<string, any>>({})
  
  useEffect(() => {
    // Try to load messages, but don't fail if they don't exist
    import(`@/messages/${locale}.json`)
      .then((module) => setMessages(module.default || {}))
      .catch(() => setMessages({}))
  }, [locale])
  
  return (key: string, values?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    let message = messages[fullKey] || key
    
    // Simple variable replacement
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        message = message.replace(`{${k}}`, String(v))
      })
    }
    
    return message
  }
}

/**
 * Get text direction for current locale
 */
export function useTextDirection(): "ltr" | "rtl" {
  const locale = useLocale()
  return getTextDirection(locale)
}

