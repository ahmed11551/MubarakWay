"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useEffect } from "react"
import Link from "next/link"
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

  // Обработчик для мгновенной навигации
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Если уже на этой странице - блокируем
    if (href === pathname) {
      e.preventDefault()
      return
    }

    // Навигация через startTransition для немедленного отклика UI
    e.preventDefault()
    startTransition(() => {
      router.push(href)
    })

    // Haptic feedback - асинхронно, не блокируем навигацию
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        // Используем requestIdleCallback для неблокирующего haptic feedback
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light")
          })
        } else {
          setTimeout(() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light")
          }, 0)
        }
      } catch (error) {
        // Игнорируем ошибки haptic feedback
      }
    }
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-t from-card via-card to-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/90 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] safe-area-bottom border-t border-primary/10"
      style={{ 
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        pointerEvents: "auto",
      }}
    >
      {/* Декоративная линия сверху */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
      
      <div className="flex items-center justify-around h-18 max-w-lg mx-auto px-2 pt-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={(e) => handleClick(e, item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1",
                "focus:outline-none rounded-2xl select-none",
                "transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground",
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
              {/* Иконка с подсветкой */}
              <div className={cn(
                "relative p-2 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/15 shadow-lg shadow-primary/20" 
                  : "hover:bg-muted/50"
              )}>
                <Icon className={cn(
                  "h-5 w-5 pointer-events-none transition-transform duration-200", 
                  isActive && "scale-110 drop-shadow-[0_0_12px_oklch(0.6_0.18_160/0.6)]"
                )} />
                {/* Индикатор активной вкладки */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-lg shadow-primary/50" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium pointer-events-none transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
