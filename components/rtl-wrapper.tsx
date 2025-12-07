"use client"

import { useEffect } from "react"
import { useTextDirection } from "@/lib/i18n-client"

/**
 * RTL Wrapper Component
 * Automatically sets dir attribute on html element based on current locale
 */
export function RTLWrapper({ children }: { children: React.ReactNode }) {
  const direction = useTextDirection()

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction)
    document.documentElement.setAttribute("lang", direction === "rtl" ? "ar" : "en")
  }, [direction])

  return <>{children}</>
}

