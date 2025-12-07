/**
 * Redis client configuration
 * Supports both Upstash (serverless) and standard Redis
 */

import { Redis } from '@upstash/redis'

let redisClient: Redis | null = null

/**
 * Get Redis client instance
 * Uses Upstash Redis by default (serverless, works on Vercel/Edge)
 */
export function getRedisClient(): Redis | null {
  // Return existing client if already initialized
  if (redisClient) {
    return redisClient
  }

  // Check if Upstash credentials are configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    try {
      redisClient = new Redis({
        url: upstashUrl,
        token: upstashToken,
      })
      return redisClient
    } catch (error) {
      console.error('[Redis] Failed to initialize Upstash client:', error)
      return null
    }
  }

  // Fallback: check for standard Redis URL
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      // For standard Redis, you might want to use ioredis instead
      // This is a placeholder - you can replace with ioredis if needed
      console.warn('[Redis] Standard Redis URL detected. Consider using @upstash/redis for serverless compatibility.')
      return null
    } catch (error) {
      console.error('[Redis] Failed to initialize Redis client:', error)
      return null
    }
  }

  // No Redis configured - will fallback to in-memory rate limiting
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Redis] Redis not configured. Using in-memory rate limiting as fallback.')
  }

  return null
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedisClient() !== null
}

