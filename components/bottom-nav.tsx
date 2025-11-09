"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/mobile-ux"
import { useCallback } from "react"

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

  const handleNavClick = useCallback((href: string, isActive: boolean) => {
    if (isActive) return
    
    hapticFeedback("light")
    router.push(href)
  }, [router])

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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavClick(item.href, isActive)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavClick(item.href, isActive)
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 active:scale-95 touch-manipulation",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg",
                isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground hover:scale-105",
              )}
              aria-label={item.name}
            >
              <Icon className={cn("h-5 w-5 transition-all duration-200 pointer-events-none", isActive && "drop-shadow-[0_0_8px_oklch(0.6_0.18_160/0.5)]")} />
              <span className="text-xs font-medium transition-all duration-200 pointer-events-none">{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
