/**
 * Service Worker — Smart LPI Al-Hidayah PWA
 *
 * Strategi cache:
 * - App Shell (HTML, JS, CSS): Cache First — load instan
 * - Gambar & ikon: Cache First — jarang berubah
 * - Halaman Inertia (navigasi): Network First with Cache Fallback
 *   → selalu coba network; jika offline, sajikan dari cache
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `smart-lpi-shell-${CACHE_VERSION}`;
const PAGES_CACHE   = `smart-lpi-pages-${CACHE_VERSION}`;
const IMAGES_CACHE  = `smart-lpi-images-${CACHE_VERSION}`;

/** Asset statis yang selalu di-cache saat SW install */
const APP_SHELL_ASSETS = [
    '/',
    '/offline.html',
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then((cache) => {
            // Gunakan addAll dengan { cache: 'reload' } agar selalu fresh
            return Promise.allSettled(
                APP_SHELL_ASSETS.map((url) =>
                    cache.add(new Request(url, { cache: 'reload' })).catch(() => {
                        // Jangan gagalkan install jika satu asset tidak tersedia
                        console.warn(`[SW] Gagal cache: ${url}`);
                    })
                )
            );
        })
    );
    // Aktifkan SW baru secepatnya tanpa menunggu tab lama ditutup
    self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
    const currentCaches = [SHELL_CACHE, PAGES_CACHE, IMAGES_CACHE];

    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => !currentCaches.includes(name))
                    .map((name) => {
                        console.log(`[SW] Hapus cache lama: ${name}`);
                        return caches.delete(name);
                    })
            )
        )
    );
    // Ambil alih semua client segera
    self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Hanya tangani request dari origin yang sama
    if (url.origin !== self.location.origin) return;

    // Jangan cache POST/PUT/DELETE/PATCH
    if (request.method !== 'GET') return;

    // Jangan cache request Inertia internal (prefetch, dll) yang punya header X-Inertia
    // tapi tetap cache navigasi halaman normal
    const isInertiaApiCall =
        request.headers.get('X-Inertia') === 'true' &&
        request.headers.get('X-Inertia-Partial-Data') !== null;
    if (isInertiaApiCall) return;

    // ── Strategi: Cache First (gambar & ikon) ────────────────────────────────
    if (
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/images/') ||
        /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)
    ) {
        event.respondWith(cacheFirst(request, IMAGES_CACHE));
        return;
    }

    // ── Strategi: Cache First (asset Vite build: JS, CSS, fonts) ─────────────
    if (
        url.pathname.startsWith('/build/') ||
        /\.(js|css|woff2?|ttf|eot)$/.test(url.pathname)
    ) {
        event.respondWith(cacheFirst(request, SHELL_CACHE));
        return;
    }

    // ── Strategi: Network First with Cache Fallback (semua halaman) ──────────
    event.respondWith(networkFirstWithCache(request));
});

// ─── Strategi Helper ─────────────────────────────────────────────────────────

/**
 * Cache First: cek cache dulu; jika tidak ada, ambil dari network dan simpan.
 */
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
        return new Response('Resource tidak tersedia offline.', { status: 503 });
    }
}

/**
 * Network First: coba network; jika gagal (offline), sajikan dari cache.
 * Jika tidak ada di cache, tampilkan halaman offline.html.
 */
async function networkFirstWithCache(request) {
    const cache = await caches.open(PAGES_CACHE);

    try {
        const response = await fetch(request);
        if (response.ok) {
            // Simpan response ke cache untuk fallback offline
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Offline: coba dari cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Tidak ada di cache: tampilkan halaman offline
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || new Response(
            '<h1>Offline</h1><p>Koneksi internet tidak tersedia.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
    }
}
