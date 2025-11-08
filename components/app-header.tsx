"use client"

import { ChevronLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const canGoBack = typeof window !== "undefined" && window.history.length > 1 && pathname !== "/"

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-primary/20 bg-card/98 backdrop-blur-xl supports-[backdrop-filter]:bg-card/95 shadow-sm safe-area-top">
      <div className="flex h-16 items-center justify-between px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 hover:bg-primary/10"
              onClick={() => router.back()}
              aria-label="Назад"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MubarakWay
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Садака-Пасс</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
