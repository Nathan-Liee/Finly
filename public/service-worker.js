/* ─── Finly Service Worker v3 ───
 * Cache-first for Vite static assets (hash-fingerprinted).
 * Network-first for Supabase API calls.
 * Cache-first for navigation (SPA shell).
 */
const CACHE_NAME = 'finly-v3';
const STATIC_CACHE = 'finly-static-v3';
const API_CACHE = 'finly-api-v3';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.svg',
  '/app-icon.svg',
  '/splash-screen.html',
  '/manifest.json',
];

/* ─── Install: precache shell ─── */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ─── Activate: clean old caches ─── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ─── Helper: is a Supabase API request ─── */
const isAPI = (url) => url.includes('supabase.co') || url.includes('supabase');

/* ─── Helper: is a Vite-built asset (hash in filename) ─── */
const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/assets/') &&
    /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ico|webp)$/.test(pathname)
  );
};

/* ─── Helper: is navigation request ─── */
const isNavigation = (req) => req.mode === 'navigate';

/* ─── Fetch: route to strategy ─── */
self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Always let Supabase API calls go network-first
  if (isAPI(request.url)) {
    e.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Vite-built static assets: cache-first
  if (isStaticAsset(request.url)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation: serve cached shell, fallback network
  if (isNavigation(request)) {
    e.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  // Everything else: network-first with cache fallback
  e.respondWith(networkFirst(request, CACHE_NAME));
});

/* ─── Cache-first strategy ─── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/* ─── Network-first strategy ─── */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}
