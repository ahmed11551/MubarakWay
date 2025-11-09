"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { hapticFeedback } from "@/lib/mobile-ux"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  threshold?: number
  disabled?: boolean
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled || isRefreshing) return

    // Get scroll position from window/body (where actual scrolling happens)
    const getScrollTop = () => {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    }

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = getScrollTop()
      // Only activate pull-to-refresh if at the very top (within 5px tolerance)
      if (scrollTop <= 5) {
        startY.current = e.touches[0].clientY
      } else {
        // User is not at top - don't interfere with scrolling
        startY.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = getScrollTop()
      
      // If user has scrolled down, allow normal scrolling - don't block
      if (scrollTop > 5) {
        startY.current = null
        return // Allow normal scroll - don't prevent default
      }

      // Only handle pull-to-refresh if at the very top
      if (startY.current === null) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // Only prevent default for pull DOWN (positive distance) when at top
      // This allows pull-to-refresh but doesn't block scrolling up
      if (distance > 0 && scrollTop <= 5) {
        e.preventDefault()
        const pull = Math.min(distance * 0.5, threshold * 1.5)
        setPullDistance(pull)
        setIsPulling(pull > 10)

        if (pull >= threshold && !isPulling) {
          hapticFeedback("medium")
        }
      } else if (distance < 0) {
        // User is scrolling up - allow it, cancel pull-to-refresh
        startY.current = null
        setPullDistance(0)
        setIsPulling(false)
      }
    }

    const handleTouchEnd = async () => {
      if (startY.current === null) return

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        hapticFeedback("success")
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
          setIsPulling(false)
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }

      startY.current = null
    }

    // Listen on document to catch all touch events
    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, isPulling, onRefresh])

  const indicatorOpacity = Math.min(pullDistance / threshold, 1)
  const indicatorRotation = (pullDistance / threshold) * 180

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "pull-to-refresh-indicator flex flex-col items-center justify-center gap-2 text-primary transition-all duration-200",
          (isPulling || isRefreshing) && "active"
        )}
        style={{
          opacity: indicatorOpacity,
          transform: `translateX(-50%) translateY(${isRefreshing ? 0 : Math.max(0, pullDistance - 60)}px)`,
        }}
      >
        <Loader2
          className={cn("h-6 w-6", isRefreshing && "animate-spin")}
          style={{
            transform: isRefreshing ? undefined : `rotate(${indicatorRotation}deg)`,
          }}
        />
        <span className="text-xs font-medium">
          {isRefreshing ? "Обновление..." : pullDistance >= threshold ? "Отпустите для обновления" : "Потяните для обновления"}
        </span>
      </div>
      <div
        style={{
          transform: `translateY(${Math.max(0, pullDistance)}px)`,
          transition: isRefreshing ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}

