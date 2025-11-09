"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useState, useEffect } from "react"
import Link from "next/link"
import { Home, Heart, Users, User, Trophy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Главная",
    href: "/",
    icon: Home,
  },
  {
    name: "Кампании",
    href: "/campaigns",
    icon: Heart,
  },
  {
    name: "Рейтинг",
    href: "/rating",
    icon: Trophy,
  },
  {
    name: "Профиль",
    href: "/profile",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)

  // Агрессивный prefetch всех страниц при монтировании и при изменении pathname
  useEffect(() => {
    // Prefetch через router
    navItems.forEach((item) => {
      if (item.href !== pathname) {
        router.prefetch(item.href)
      }
    })

    // Дополнительный prefetch через link для тяжелых страниц
    const heavyPages = ["/campaigns", "/rating"]
    heavyPages.forEach((href) => {
      if (href !== pathname) {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = href
        document.head.appendChild(link)
      }
    })
  }, [pathname, router])

  // Сброс loading при изменении pathname
  useEffect(() => {
    setLoadingHref(null)
  }, [pathname])

  // Обработчик для плавной навигации без перезагрузки
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Если уже на этой странице - блокируем
    if (href === pathname) {
      e.preventDefault()
      return
    }

    // Мгновенная визуальная обратная связь - показываем loading
    const isHeavyPage = href === "/campaigns" || href === "/rating"
    if (isHeavyPage) {
      setLoadingHref(href)
    }

    // Haptic feedback - синхронно для мгновенной обратной связи
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
      } catch {}
    }

    // Навигация
    e.preventDefault()
    
    if (isHeavyPage) {
      // Используем startTransition для тяжелых страниц
      startTransition(() => {
        router.push(href, { scroll: false })
      })
    } else {
      // Обычная навигация для легких страниц
      router.push(href)
    }
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[100] border-t-2 border-primary/20 bg-card/98 backdrop-blur-xl supports-[backdrop-filter]:bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom"
      style={{ 
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        pointerEvents: "auto",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative",
                "focus:outline-none rounded-lg select-none",
                "transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                loadingHref === item.href && "opacity-70",
              )}
              aria-label={item.name}
              style={{ 
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                WebkitUserSelect: "none",
                userSelect: "none",
                textDecoration: "none",
                WebkitTouchCallout: "none",
                cursor: loadingHref === item.href ? "wait" : "pointer",
              }}
            >
              {loadingHref === item.href ? (
                <Loader2 className="h-5 w-5 pointer-events-none animate-spin text-primary" />
              ) : (
                <Icon className={cn("h-5 w-5 pointer-events-none transition-all duration-150", isActive && "drop-shadow-[0_0_8px_oklch(0.6_0.18_160/0.5)]")} />
              )}
              <span className="text-xs font-medium pointer-events-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
