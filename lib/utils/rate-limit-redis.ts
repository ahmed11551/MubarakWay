/**
 * Redis-based rate limiting using Upstash
 * Production-ready rate limiting that works in clusters
 */

import { Ratelimit } from '@upstash/ratelimit'
import { getRedisClient } from '@/lib/redis'
import { getClientIdentifier } from './rate-limit'
import { rateLimit as inMemoryRateLimit } from './rate-limit'

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

// Cache for Ratelimit instances (one per configuration)
const ratelimitInstances = new Map<string, Ratelimit>()

/**
 * Get or create Ratelimit instance for specific configuration
 */
function getRatelimitInstance(max: number, window: number): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) {
    return null
  }

  const key = `${max}:${window}`
  
  if (ratelimitInstances.has(key)) {
    return ratelimitInstances.get(key)!
  }

  try {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${window} s`),
      analytics: true,
    })
    
    ratelimitInstances.set(key, ratelimit)
    return ratelimit
  } catch (error) {
    console.error('[RateLimit] Failed to create Ratelimit instance:', error)
    return null
  }
}

/**
 * Rate limit check with Redis (falls back to in-memory if Redis unavailable)
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const max = options.max ?? 100
  const window = options.window ?? 60

  // Try Redis first
  const ratelimit = getRatelimitInstance(max, window)
  
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(identifier)
      
      // Calculate reset time (current time + window)
      const reset = Date.now() + (window * 1000)
      
      return {
        success: result.success,
        limit: max,
        remaining: result.remaining,
        reset: result.reset || reset,
      }
    } catch (error) {
      console.error('[RateLimit] Redis rate limit error, falling back to in-memory:', error)
      // Fall through to in-memory fallback
    }
  }

  // Fallback to in-memory rate limiting
  return inMemoryRateLimit(identifier, options)
}

/**
 * Rate limit check for Next.js API routes
 * Automatically extracts client identifier from request
 */
export async function rateLimitRequest(
  req: {
    headers: Headers | Record<string, string | string[] | undefined>
  },
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const identifier = options.identifier || getClientIdentifier(req)
  return rateLimit(identifier, options)
}

