// Поддерживаемые языки
export const locales = ["ru", "en", "ar"] as const
export type Locale = (typeof locales)[number]

// Язык по умолчанию
export const defaultLocale: Locale = "ru"

// RTL языки
export const rtlLocales: Locale[] = ["ar"]

/**
 * Проверка, является ли язык RTL
 */
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

/**
 * Получить направление текста для языка
 */
export function getTextDirection(locale: Locale): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr"
}

// Note: getRequestConfig export removed to avoid build errors
// It will be re-enabled when next-intl plugin is properly configured
// For now, i18n works via client-side hooks in lib/i18n-client.ts

