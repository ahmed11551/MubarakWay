"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

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
  const navRef = useRef<HTMLElement>(null)

  // Обработка нативных событий напрямую для максимальной скорости
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('[data-nav-button]') as HTMLElement
      if (!button) return

      const href = button.getAttribute('data-href')
      if (!href || href === pathname) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Немедленная навигация при touchstart - не ждем touchend
      e.preventDefault()
      e.stopPropagation()
      
      // Визуальная обратная связь мгновенно
      button.style.opacity = "0.7"
      
      // Haptic feedback
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
        } catch {}
      }
      
      // Навигация немедленно
      router.push(href)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('[data-nav-button]') as HTMLElement
      if (!button) return

      // Восстанавливаем opacity
      button.style.opacity = ""
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('[data-nav-button]') as HTMLElement
      if (!button) return

      const href = button.getAttribute('data-href')
      if (!href || href === pathname) {
        e.preventDefault()
        return
      }

      // Haptic feedback для клика
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
        } catch {}
      }
    }

    // Используем capture phase для максимальной скорости
    nav.addEventListener("touchstart", handleTouchStart, { passive: false, capture: true })
    nav.addEventListener("touchend", handleTouchEnd, { passive: false, capture: true })
    nav.addEventListener("click", handleClick, { passive: false, capture: true })

    return () => {
      nav.removeEventListener("touchstart", handleTouchStart, { capture: true })
      nav.removeEventListener("touchend", handleTouchEnd, { capture: true })
      nav.removeEventListener("click", handleClick, { capture: true })
    }
  }, [pathname, router])

  return (
    <nav 
      ref={navRef}
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
              data-nav-button
              data-href={item.href}
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
