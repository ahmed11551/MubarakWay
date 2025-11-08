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

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop > 0) return
      startY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null || container.scrollTop > 0) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      if (distance > 0) {
        e.preventDefault()
        const pull = Math.min(distance * 0.5, threshold * 1.5)
        setPullDistance(pull)
        setIsPulling(pull > 10)

        if (pull >= threshold && !isPulling) {
          hapticFeedback("medium")
        }
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

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, isPulling, onRefresh])

  const indicatorOpacity = Math.min(pullDistance / threshold, 1)
  const indicatorRotation = (pullDistance / threshold) * 180

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
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

