"use client"

import { ReactNode } from "react"

interface I18nProviderProps {
  locale: string
  children: ReactNode
}

/**
 * I18n Provider wrapper (simplified - no next-intl dependency)
 * Messages are loaded via useTranslations hook when needed
 */
export function I18nProvider({ locale, children }: I18nProviderProps) {
  // Simplified provider - just pass children through
  // Translations are handled via useTranslations hook in components
  return <>{children}</>
}

