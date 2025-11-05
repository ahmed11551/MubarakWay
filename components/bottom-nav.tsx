"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, Users, User } from "lucide-react"
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
    name: "Фонды",
    href: "/funds",
    icon: Users,
  },
  {
    name: "Профиль",
    href: "/profile",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary/20 bg-card/98 backdrop-blur-xl supports-[backdrop-filter]:bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
                isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground hover:scale-105",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_oklch(0.6_0.18_160/0.5)]")} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
