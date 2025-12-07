"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { locales, type Locale } from "@/i18n"
import { useState, useEffect } from "react"

const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  ar: "العربية",
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>("ru")
  
  // Get locale from pathname or default to 'ru'
  useEffect(() => {
    const pathLocale = pathname.split("/")[1]
    if (locales.includes(pathLocale as Locale)) {
      setLocale(pathLocale as Locale)
    } else {
      setLocale("ru")
    }
  }, [pathname])

  const switchLocale = (newLocale: Locale) => {
    // Remove current locale from pathname if present
    const pathWithoutLocale = pathname.replace(/^\/(ru|en|ar)/, "") || "/"
    
    // Add new locale prefix (except for default locale 'ru')
    const newPath = newLocale === "ru" 
      ? pathWithoutLocale 
      : `/${newLocale}${pathWithoutLocale}`
    
    router.push(newPath)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Изменить язык</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            {localeNames[loc]}
            {locale === loc && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

