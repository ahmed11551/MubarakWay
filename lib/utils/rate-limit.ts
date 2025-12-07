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
  // Get IP from headers (support both Headers object and plain object)
  const headersObj = req.headers as Headers | Record<string, string | string[] | undefined>
  const forwardedFor = (headersObj instanceof Headers 
    ? headersObj.get('x-forwarded-for')
    : typeof headersObj['x-forwarded-for'] === 'string' 
      ? headersObj['x-forwarded-for'] 
      : Array.isArray(headersObj['x-forwarded-for'])
      ? headersObj['x-forwarded-for'][0]
      : undefined) || undefined
  
  const realIp = (headersObj instanceof Headers
    ? headersObj.get('x-real-ip')
    : typeof headersObj['x-real-ip'] === 'string'
      ? headersObj['x-real-ip']
      : Array.isArray(headersObj['x-real-ip'])
      ? headersObj['x-real-ip'][0]
      : undefined) || undefined

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


