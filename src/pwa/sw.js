/*
 * Circuit Lab's service worker: after the first visit the whole app works
 * without internet, and it can be installed like an app.
 *
 * The build (see vite.config.ts) writes this file to /sw.js and replaces
 * __VERSION__ with a fingerprint of the built files, so every new release gets
 * fresh caches and the old ones are removed once no old tab still uses them.
 */
const VERSION = '__VERSION__'
const PAGES = `circuitlab-pages-${VERSION}`
const ASSETS = `circuitlab-assets-${VERSION}`
const START = ['/', '/manifest.webmanifest', '/favicon.svg', '/logo.svg', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll(START)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('circuitlab-') && key !== PAGES && key !== ASSETS) await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // other sites (Ollama on this computer, fonts, …) go straight to the network
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // the page itself: the newest from the network, the saved copy when offline
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(PAGES).then((cache) => cache.put('/', copy))
          }
          return response
        })
        .catch(async () => (await caches.match('/')) ?? Response.error()),
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    // built files carry a fingerprint in their name, so a saved copy never goes stale
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const saved = await cache.match(request)
        if (saved) return saved
        const response = await fetch(request)
        if (response.ok) void cache.put(request, response.clone())
        return response
      }),
    )
    return
  }

  // icons, the manifest and other files: answer from the cache, refresh it in the background
  event.respondWith(
    caches.open(PAGES).then(async (cache) => {
      const saved = await cache.match(request)
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) void cache.put(request, response.clone())
          return response
        })
        .catch(() => saved ?? Response.error())
      return saved ?? fresh
    }),
  )
})
