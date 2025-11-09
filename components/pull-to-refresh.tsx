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
        shouldPreventDefault = false
      } else {
        // User is not at top - don't interfere with scrolling
        startY.current = null
        shouldPreventDefault = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = getScrollTop()
      
      // If user has scrolled down, allow normal scrolling - don't block
      if (scrollTop > 5) {
        if (startY.current !== null) {
          startY.current = null
          setPullDistance(0)
          setIsPulling(false)
        }
        shouldPreventDefault = false
        return // Allow normal scroll - don't prevent default
      }

      // Only handle pull-to-refresh if at the very top
      if (startY.current === null) {
        shouldPreventDefault = false
        return
      }

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // Only prevent default for pull DOWN (positive distance) when at top
      // This allows pull-to-refresh but doesn't block scrolling up
      if (distance > 0 && scrollTop <= 5) {
        shouldPreventDefault = true
        e.preventDefault()
        const pull = Math.min(distance * 0.5, threshold * 1.5)
        updatePullState(pull)
      } else if (distance < 0) {
        // User is scrolling up - allow it, cancel pull-to-refresh
        shouldPreventDefault = false
        startY.current = null
        setPullDistance(0)
        setIsPulling(false)
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

