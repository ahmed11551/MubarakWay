"use client"

import { useLocale, useTranslations } from "next-intl"
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

const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  ar: "العربية",
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("common")

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
          <span className="sr-only">{t("changeLanguage")}</span>
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

