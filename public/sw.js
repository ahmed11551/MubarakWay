// Service Worker for MubarakWay PWA
const CACHE_NAME = "mubarakway-v1"
const STATIC_CACHE = "mubarakway-static-v1"
const DYNAMIC_CACHE = "mubarakway-dynamic-v1"

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Caching static assets")
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error("[Service Worker] Failed to cache some assets:", err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE && name !== DYNAMIC_CACHE
          })
          .map((name) => {
            console.log("[Service Worker] Deleting old cache:", name)
            return caches.delete(name)
          })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests (except our API)
  if (url.origin !== location.origin && !url.hostname.includes("supabase.co")) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Network first strategy
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === "error") {
            return cachedResponse || response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache dynamic content
          if (request.url.includes("/api/") || request.url.includes("supabase.co")) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }

          return response
        })
        .catch(() => {
          // Network failed, return cached version if available
          if (cachedResponse) {
            return cachedResponse
          }

          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/")
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
    })
  )
})

// Background sync (optional - for future use)
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag)
  // Can be used for offline donations, etc.
})

// Push notifications (optional - for future use)
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received")
  // Can be used for donation notifications, etc.
})

