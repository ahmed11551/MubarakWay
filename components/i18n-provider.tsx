"use client"

import { NextIntlClientProvider } from "next-intl"
import { ReactNode } from "react"
import { getMessages } from "next-intl/server"

interface I18nProviderProps {
  locale: string
  children: ReactNode
}

/**
 * I18n Provider wrapper
 * Use this to wrap your app with i18n support
 */
export async function I18nProvider({ locale, children }: I18nProviderProps) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

