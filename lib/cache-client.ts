/**
 * Client-side cache utility
 * Simple in-memory cache for browser environment
 */

interface CacheEntry<T> {
  value: T
  expires: number
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>()

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    })
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean expired entries
   */
  clean(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const cache = new ClientCache()

// Clean expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.clean()
  }, 5 * 60 * 1000)
}

