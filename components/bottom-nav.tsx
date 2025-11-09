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

  // Простой обработчик только для haptic feedback - навигация нативная
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Haptic feedback асинхронно, не блокируя навигацию
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      // Используем requestIdleCallback для неблокирующего выполнения
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          try {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
          } catch {}
        }, { timeout: 50 })
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          try {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
          } catch {}
        }, 0)
      }
    }
    // НЕ блокируем навигацию - пусть браузер обрабатывает нативно
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
              onClick={handleClick}
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
