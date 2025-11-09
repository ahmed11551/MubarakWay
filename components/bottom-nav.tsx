"use client"

import { usePathname } from "next/navigation"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

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

  // Prefetch всех страниц при монтировании
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.href !== pathname) {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = item.href
        document.head.appendChild(link)
      }
    })
  }, [pathname])

  // Обработчик для мгновенной навигации и haptic feedback
  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>, href: string) => {
    // Если уже на этой странице - ничего не делаем
    if (href === pathname) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Блокируем все дефолтные обработчики Next.js
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    // Haptic feedback МГНОВЕННО
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
      } catch {}
    }

    // МГНОВЕННАЯ навигация - БЕЗ ЗАДЕРЖЕК
    window.location.href = href

    return false
  }

  // Также обрабатываем mousedown для десктопа
  const handleMouseDown = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === pathname) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
      } catch {}
    }

    // МГНОВЕННАЯ навигация - БЕЗ ЗАДЕРЖЕК
    window.location.href = href

    return false
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
            <a
              key={item.href}
              href={item.href}
              onPointerDown={(e) => handlePointerDown(e, item.href)}
              onMouseDown={(e) => handleMouseDown(e, item.href)}
              onClick={(e) => {
                // Полностью блокируем onClick для предотвращения перехвата Next.js
                e.preventDefault()
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
                return false
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                "focus:outline-none rounded-lg select-none",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-label={item.name}
              style={{ 
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                WebkitUserSelect: "none",
                userSelect: "none",
                textDecoration: "none",
                WebkitTouchCallout: "none",
                cursor: "pointer",
              }}
            >
              <Icon className={cn("h-5 w-5 pointer-events-none", isActive && "drop-shadow-[0_0_8px_oklch(0.6_0.18_160/0.5)]")} />
              <span className="text-xs font-medium pointer-events-none">{item.name}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
