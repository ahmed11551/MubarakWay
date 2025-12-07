import { notFound } from "next/navigation"
import { getRequestConfig } from "next-intl/server"

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

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

