/* ============================================================
   vidhara.id — Service Worker
   Strategi cache:
   - Navigasi (HTML)  : network-first, fallback ke cache, lalu /offline
   - Aset statis      : cache-first + revalidate di background (stale-while-revalidate)
   - /api/*           : selalu network (tidak pernah di-cache)
   ============================================================ */

const VERSION = 'v1.1.2';
const CACHE_NAME = `vidhara-static-${VERSION}`;
const RUNTIME_CACHE = `vidhara-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/karir',
  '/privacy-policy',
  '/terms-of-service',
  '/manifest.webmanifest',
  '/css/styles.css',
  '/js/scripts.min.js',
  '/js/pwa.js',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/assets/images/logo_bd_md.png',
  '/assets/images/logo_bd_sm.png',
  '/assets/images/logo_company.jpeg',
  '/assets/images/contact.png',
  '/assets/images/team_members.jpg',
  '/assets/images/image_karir.jpeg'
];

const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Preload satu per satu agar satu URL gagal tidak menggagalkan semuanya
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          /* diabaikan: browser tidak mendukung */
        }
      }
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/manifest.webmanifest' ||
    /\.(?:png|jpe?g|webp|avif|svg|ico|woff2?|ttf|css|js|txt|xml|json)$/i.test(url.pathname)
  );
}

async function networkFirstPage(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      cache.put(event.request, preload.clone()).catch(() => {});
      return preload;
    }
    const response = await fetch(event.request);
    if (response && response.ok) {
      cache.put(event.request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // Offline: coba halaman yang sama dari cache, lalu fallback ke beranda
    return (
      (await cache.match(event.request, { ignoreSearch: true })) ||
      (await cache.match(OFFLINE_URL)) ||
      new Response(
        '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline — vidhara.id</title><style>body{background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}div{text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#94a3b8}</style></head><body><div><h1>Anda sedang offline</h1><p>Koneksi internet tidak tersedia. Coba lagi nanti.</p></div></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API: selalu langsung ke network, tanpa cache
  if (url.pathname.startsWith('/api/')) return;

  // Navigasi halaman: network-first dengan fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Aset lintas origin (font Google saja — gambar kini self-hosted): cache runtime
  if (url.origin !== self.location.origin) {
    if (/^(?:https:\/\/fonts\.googleapis\.com|https:\/\/fonts\.gstatic\.com)/.test(url.href)) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  // Aset statis same-origin: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Sisanya (mis. route tak dikenal): biarkan default
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
