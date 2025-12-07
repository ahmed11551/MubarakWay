/**
 * Rate limiting utility for API routes
 * In-memory implementation (fallback when Redis is unavailable)
 * For production, use rate-limit-redis.ts which uses Redis
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (clears on server restart)
// For production, use Redis or similar persistent store
const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed
   * @default 100
   */
  max?: number
  /**
   * Time window in seconds
   * @default 60
   */
  window?: number
  /**
   * Custom identifier for rate limiting (defaults to IP address)
   */
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limit check
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const max = options.max ?? 100
  const window = (options.window ?? 60) * 1000 // Convert to milliseconds
  const now = Date.now()
  const key = identifier

  // Get or create entry
  let entry = store[key]

  // If entry doesn't exist or has expired, create new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + window,
    }
    store[key] = entry
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  const success = entry.count <= max
  const remaining = Math.max(0, max - entry.count)
  const reset = entry.resetTime

  return {
    success,
    limit: max,
    remaining,
    reset,
  }
}

/**
 * Get client identifier from request
 * Priority: X-Forwarded-For > X-Real-IP > fallback
 */
export function getClientIdentifier(req: {
  headers: Headers | Record<string, string | string[] | undefined>
}): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwardedFor = req.headers.get?.('x-forwarded-for') || 
    (typeof req.headers['x-forwarded-for'] === 'string' 
      ? req.headers['x-forwarded-for'] 
      : Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : undefined)
  
  const realIp = req.headers.get?.('x-real-ip') ||
    (typeof req.headers['x-real-ip'] === 'string'
      ? req.headers['x-real-ip']
      : Array.isArray(req.headers['x-real-ip'])
      ? req.headers['x-real-ip'][0]
      : undefined)

  // Use first IP from X-Forwarded-For if available
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback to X-Real-IP
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to anonymous identifier
  return 'anonymous'
}


