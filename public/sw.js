/*
 * ISNESI service worker
 * ---------------------------------------------------------------------------
 * SECURITY MODEL (read before changing anything here)
 *
 * 1. Only same-origin GET requests are considered at all. Supabase API calls,
 *    Storage URLs and any third party are never intercepted or cached, so auth
 *    tokens and private records cannot leak into a cache.
 * 2. These paths are always bypassed: /admin, /api, /auth, /login. The admin
 *    panel must keep working online-only; private records, safeguarding data,
 *    donations and session state must never be stored offline.
 * 3. Responses marked `private` or `no-store`, requests carrying an
 *    Authorization header, and any response that sets a cookie are never cached.
 * 4. Offline support is therefore limited to the application shell, static
 *    assets and an offline fallback page.
 */

const VERSION = "isnesi-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/brand/logo.png",
];

/** Paths that must never be cached or served from cache. */
const BYPASS_PREFIXES = ["/admin", "/api", "/auth", "/login", "/no-access"];

/** Static asset paths that are safe to cache. */
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/brand/", "/fonts/"];

/** File extensions treated as immutable static assets. */
const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".mjs",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".avif",
  ".ico",
];

const MAX_PAGE_ENTRIES = 30;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individual failures must not abort installation.
      await Promise.all(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** True when the request must not be handled by the service worker. */
function mustBypass(url, request) {
  if (url.origin !== self.location.origin) return true;
  if (BYPASS_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  if (request.headers.has("authorization")) return true;
  const cacheControl = request.headers.get("cache-control");
  if (cacheControl && /no-store|no-cache/.test(cacheControl)) return true;
  return false;
}

function isStaticAsset(url) {
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return true;
  const path = url.pathname.toLowerCase();
  return STATIC_EXTENSIONS.some((extension) => path.endsWith(extension));
}

/** Never store a response that could contain private or session-bound data. */
function isCacheable(response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  const cacheControl = response.headers.get("cache-control") || "";
  if (/no-store|private|no-cache/i.test(cacheControl)) return false;
  if (response.headers.has("set-cookie")) return false;
  return true;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      cache.put(request, response.clone()).then(() => trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES)).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("You are offline.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (mustBypass(url, request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  // Everything else: leave it to the network and the browser HTTP cache.
});