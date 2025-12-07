/**
 * Caching utility for API responses
 * Uses Next.js cache and Redis (if available)
 */

import { unstable_cache } from 'next/cache'
import { getRedisClient } from './redis'

export interface CacheOptions {
  /**
   * Cache duration in seconds
   * @default 300 (5 minutes)
   */
  revalidate?: number
  /**
   * Cache tags for invalidation
   */
  tags?: string[]
}

/**
 * Cache key generator
 */
function getCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const keyParts = parts.filter(Boolean).map(String)
  return `${prefix}:${keyParts.join(':')}`
}

/**
 * Get cached value from Redis
 */
async function getFromRedis(key: string): Promise<any | null> {
  const redis = getRedisClient()
  if (!redis) {
    return null
  }

  try {
    const value = await redis.get(key)
    return value
  } catch (error) {
    console.error('[Cache] Redis get error:', error)
    return null
  }
}

/**
 * Set cached value in Redis
 */
async function setInRedis(key: string, value: any, ttl: number): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    return
  }

  try {
    await redis.set(key, value, { ex: ttl })
  } catch (error) {
    console.error('[Cache] Redis set error:', error)
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCache(tag: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    return
  }

  try {
    // Redis doesn't have built-in tag support, so we use a pattern
    // In production, you might want to maintain a tag->keys mapping
    const pattern = `tag:${tag}:*`
    // Note: Upstash Redis REST API doesn't support KEYS command
    // You would need to maintain a separate index for tags
    console.warn('[Cache] Tag invalidation not fully implemented for Redis. Consider maintaining a tag index.')
  } catch (error) {
    console.error('[Cache] Cache invalidation error:', error)
  }
}

/**
 * Cached function wrapper
 * Uses Next.js cache with Redis fallback
 */
export function cached<T>(
  fn: () => Promise<T>,
  key: string,
  options: CacheOptions = {}
): () => Promise<T> {
  const { revalidate = 300, tags = [] } = options

  // Use Next.js unstable_cache for server-side caching
  const cachedFn = unstable_cache(
    async () => {
      // Try Redis first for distributed caching
      const redisKey = `cache:${key}`
      const cached = await getFromRedis(redisKey)
      
      if (cached !== null) {
        return cached as T
      }

      // Execute function and cache result
      const result = await fn()
      await setInRedis(redisKey, result, revalidate)
      
      return result
    },
    [key],
    {
      revalidate,
      tags,
    }
  )

  return cachedFn
}

/**
 * Simple cache wrapper for API responses
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { revalidate = 300 } = options

  // Try Redis first
  const redisKey = `cache:${key}`
  const cached = await getFromRedis(redisKey)
  
  if (cached !== null) {
    return cached as T
  }

  // Fetch and cache
  const result = await fetchFn()
  await setInRedis(redisKey, result, revalidate)
  
  return result
}

/**
 * Cache keys constants
 */
export const CacheKeys = {
  campaigns: (status?: string) => getCacheKey('campaigns', status || 'all'),
  funds: (category?: string) => getCacheKey('funds', category || 'all'),
  stats: () => getCacheKey('stats'),
  donation: (id: string) => getCacheKey('donation', id),
} as const
