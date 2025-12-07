/**
 * Client-side i18n utilities
 * Simplified version for gradual migration to next-intl
 */

"use client"

import { useLocale as useNextIntlLocale, useTranslations as useNextIntlTranslations } from "next-intl"
import { getTextDirection, type Locale } from "@/i18n"

/**
 * Get current locale
 */
export function useLocale(): Locale {
  try {
    return useNextIntlLocale() as Locale
  } catch {
    return "ru" // Fallback
  }
}

/**
 * Get translations hook
 */
export function useTranslations(namespace?: string) {
  try {
    return useNextIntlTranslations(namespace)
  } catch {
    // Fallback: return a function that returns the key
    return (key: string) => key
  }
}

/**
 * Get text direction for current locale
 */
export function useTextDirection(): "ltr" | "rtl" {
  const locale = useLocale()
  return getTextDirection(locale)
}

