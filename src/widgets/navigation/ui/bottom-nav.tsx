/**
 * Bottom navigation widget (FSD widgets layer)
 */

"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useEffect } from "react"
import Link from "next/link"
import { Home, Heart, Users, User, Trophy } from "lucide-react"
import { cn } from "@/shared/lib/utils"

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary/20 bg-card/98 backdrop-blur-xl supports-[backdrop-filter]:bg-card/95 safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                "hover:bg-primary/5 active:bg-primary/10 rounded-lg",
                isActive && "text-primary"
              )}
              onClick={(e) => {
                if (pathname === item.href) {
                  e.preventDefault()
                  return
                }
                startTransition(() => {
                  router.push(item.href)
                })
              }}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-xs font-medium", isActive && "text-primary font-semibold")}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

