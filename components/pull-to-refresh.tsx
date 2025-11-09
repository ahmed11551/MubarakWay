"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
  const rafId = useRef<number | null>(null)
  const lastPullDistance = useRef(0)
  const lastIsPulling = useRef(false)

  // Memoize onRefresh to avoid unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    await onRefresh()
  }, [onRefresh])

  // Get scroll position - optimized with caching
  const getScrollTop = useCallback(() => {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  }, [])

  // Update state using requestAnimationFrame for smooth performance
  const updatePullState = useCallback((pull: number) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }
    
    rafId.current = requestAnimationFrame(() => {
      const isPullingNow = pull > 10
      
      // Only update if values changed to avoid unnecessary re-renders
      if (Math.abs(lastPullDistance.current - pull) > 0.5) {
        setPullDistance(pull)
        lastPullDistance.current = pull
      }
      
      if (lastIsPulling.current !== isPullingNow) {
        setIsPulling(isPullingNow)
        lastIsPulling.current = isPullingNow
        
        // Haptic feedback only when crossing threshold
        if (pull >= threshold && isPullingNow) {
          hapticFeedback("medium")
        }
      }
    })
  }, [threshold])

  useEffect(() => {
    if (disabled || isRefreshing) return

    let shouldPreventDefault = false

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = getScrollTop()
      // Only activate pull-to-refresh if at the very top (within 5px tolerance)
      if (scrollTop <= 5) {
        startY.current = e.touches[0].clientY
      } else {
        // User is not at top - completely disable pull-to-refresh
        startY.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = getScrollTop()
      
      // CRITICAL: If user has scrolled down at all, completely disable pull-to-refresh
      // This prevents pull-to-refresh from activating when scrolling up after scrolling down
      if (scrollTop > 5) {
        // User is not at top - completely disable pull-to-refresh
        if (startY.current !== null) {
          startY.current = null
          setPullDistance(0)
          setIsPulling(false)
          lastPullDistance.current = 0
          lastIsPulling.current = false
        }
        // Don't prevent default - allow normal scrolling in all directions
        return
      }

      // Only handle pull-to-refresh if at the very top AND we have a valid start position
      if (startY.current === null) {
        // No valid start - allow normal scrolling
        return
      }

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // Only prevent default for pull DOWN (positive distance) when at top
      // Negative distance (scrolling up) should always be allowed
      if (distance > 10 && scrollTop <= 5) {
        // Pulling down at top - activate pull-to-refresh
        e.preventDefault()
        const pull = Math.min(distance * 0.5, threshold * 1.5)
        updatePullState(pull)
      } else if (distance < -5) {
        // User is scrolling up - cancel pull-to-refresh immediately
        startY.current = null
        setPullDistance(0)
        setIsPulling(false)
        lastPullDistance.current = 0
        lastIsPulling.current = false
        // Don't prevent default - allow normal scrolling
      } else {
        // Small movement - don't interfere with scrolling
        // Don't prevent default - allow normal scrolling
      }
    }

    const handleTouchEnd = async () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }

      if (startY.current === null) return

      const finalDistance = lastPullDistance.current

      if (finalDistance >= threshold) {
        setIsRefreshing(true)
        hapticFeedback("success")
        try {
          await handleRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
          setIsPulling(false)
          lastPullDistance.current = 0
          lastIsPulling.current = false
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
        lastPullDistance.current = 0
        lastIsPulling.current = false
      }

      startY.current = null
      shouldPreventDefault = false
    }

    // Use passive listeners where possible for better performance
    // Only touchmove needs to be non-passive when we need preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, isRefreshing, threshold, getScrollTop, updatePullState, handleRefresh])

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

