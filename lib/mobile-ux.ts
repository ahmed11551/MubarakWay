/**
 * Mobile UX utilities for enhanced touch interactions
 */

/**
 * Haptic feedback (vibration) for mobile devices
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return
  }

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    error: [20, 50, 20],
  }

  navigator.vibrate(patterns[type] || 10)
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get safe area insets for iOS devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }

  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
  }
}

/**
 * Prevent scroll bounce on iOS
 */
export function preventScrollBounce() {
  if (typeof document === 'undefined') return

  document.body.style.overscrollBehavior = 'none'
  document.documentElement.style.overscrollBehavior = 'none'
}

/**
 * Enable smooth scrolling
 */
export function enableSmoothScroll() {
  if (typeof document === 'undefined') return

  document.documentElement.style.scrollBehavior = 'smooth'
}

