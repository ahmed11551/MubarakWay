"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
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
              prefetch={true}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault()
                  return
                }
                // Haptic feedback синхронно
                if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
                  try {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
                  } catch {}
                }
              }}
              onTouchStart={(e) => {
                if (isActive) {
                  e.preventDefault()
                  return
                }
                // Визуальная обратная связь
                e.currentTarget.style.opacity = "0.7"
                // Haptic feedback
                if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
                  try {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
                  } catch {}
                }
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.opacity = ""
              }}
              onTouchCancel={(e) => {
                e.currentTarget.style.opacity = ""
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
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
