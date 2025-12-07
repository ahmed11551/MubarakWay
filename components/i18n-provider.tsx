"use client"

import { NextIntlClientProvider } from "next-intl"
import { ReactNode, useEffect, useState } from "react"

interface I18nProviderProps {
  locale: string
  children: ReactNode
}

/**
 * I18n Provider wrapper
 * Use this to wrap your app with i18n support
 * Messages are loaded client-side to avoid server/client mismatch
 */
export function I18nProvider({ locale, children }: I18nProviderProps) {
  const [messages, setMessages] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load messages client-side
    import(`@/messages/${locale}.json`)
      .then((module) => {
        setMessages(module.default || {})
      })
      .catch(() => {
        // Fallback to Russian if locale not found
        import(`@/messages/ru.json`)
          .then((module) => {
            setMessages(module.default || {})
          })
          .catch(() => {
            console.warn("Failed to load i18n messages")
          })
      })
  }, [locale])

  // Don't render until messages are loaded
  if (Object.keys(messages).length === 0) {
    return <>{children}</>
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

