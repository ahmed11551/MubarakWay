"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback, useRef } from "react"

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
  const navigatingRef = useRef<string | null>(null)

  const handleNavClick = useCallback((href: string, isActive: boolean, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isActive || navigatingRef.current === href) return
    
    navigatingRef.current = href
    
    // Мгновенная навигация через window.location для максимальной скорости
    if (href === pathname) return
    
    // Используем requestAnimationFrame для немедленного выполнения
    requestAnimationFrame(() => {
      router.push(href)
      // Haptic feedback после навигации, не блокируя
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
        } catch {}
      }
    })
    
    // Сброс флага
    setTimeout(() => {
      navigatingRef.current = null
    }, 200)
  }, [router, pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary/20 bg-card/98 backdrop-blur-xl supports-[backdrop-filter]:bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom pointer-events-auto">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <button
              key={item.href}
              type="button"
              onClick={(e) => handleNavClick(item.href, isActive, e)}
              onTouchStart={(e) => {
                // Немедленная визуальная обратная связь - без задержек
                const target = e.currentTarget
                target.style.transform = "scale(0.95)"
                target.style.opacity = "0.8"
              }}
              onTouchEnd={(e) => {
                const target = e.currentTarget
                target.style.transform = ""
                target.style.opacity = ""
                handleNavClick(item.href, isActive, e)
              }}
              onTouchCancel={(e) => {
                const target = e.currentTarget
                target.style.transform = ""
                target.style.opacity = ""
              }}
              onMouseDown={(e) => {
                // Для десктопа тоже мгновенная обратная связь
                e.currentTarget.style.opacity = "0.8"
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.opacity = ""
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = ""
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full touch-manipulation",
                "focus:outline-none rounded-lg select-none",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-label={item.name}
              style={{ 
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
            >
              <Icon className={cn("h-5 w-5 pointer-events-none", isActive && "drop-shadow-[0_0_8px_oklch(0.6_0.18_160/0.5)]")} />
              <span className="text-xs font-medium pointer-events-none">{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
