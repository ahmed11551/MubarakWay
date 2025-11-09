"use client"

import { usePathname } from "next/navigation"
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
  const navRef = useRef<HTMLElement>(null)

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

  // Нативные обработчики событий для МАКСИМАЛЬНОЙ скорости
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleEvent = (e: Event) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[data-nav-href]') as HTMLAnchorElement
      if (!link) return

      const href = link.getAttribute('data-nav-href')
      if (!href || href === pathname) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }

      // Блокируем все обработчики
      e.preventDefault()
      e.stopImmediatePropagation()

      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
        } catch {}
      }

      // МГНОВЕННАЯ навигация
      window.location.href = href
    }

    // Используем pointerdown - самое быстрое событие
    nav.addEventListener("pointerdown", handleEvent, { capture: true, passive: false })
    nav.addEventListener("mousedown", handleEvent, { capture: true, passive: false })
    nav.addEventListener("touchstart", handleEvent, { capture: true, passive: false })

    return () => {
      nav.removeEventListener("pointerdown", handleEvent, { capture: true })
      nav.removeEventListener("mousedown", handleEvent, { capture: true })
      nav.removeEventListener("touchstart", handleEvent, { capture: true })
    }
  }, [pathname])

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
              data-nav-href={item.href}
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
