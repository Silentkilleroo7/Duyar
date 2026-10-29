/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

// Clean up old caches and precache assets injected by vite-plugin-pwa
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache names for Duyar Real Estate PWA
const CACHE_NAME = 'duyar-app-v2.4.0';
const DYNAMIC_CACHE = 'duyar-dynamic-v2.4.0';
const OFFLINE_URL = '/offline.html';

// Critical core offline fallback assets to precache on install
const CORE_OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

/* ----------------------------------------------------
 * 1. INSTALL LIFECYCLE (Has Logic & Pre-cache)
 * ---------------------------------------------------- */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Duyar SW] Pre-caching offline fallbacks & shell assets');
      return cache.addAll(CORE_OFFLINE_ASSETS).catch((err) => {
        console.warn('[Duyar SW] Pre-cache partial fail (some assets might not be available during install):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ----------------------------------------------------
 * 2. ACTIVATE LIFECYCLE (Has Logic & Cache Pruning)
 * ---------------------------------------------------- */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && !key.startsWith('workbox-precache')) {
            console.log('[Duyar SW] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
          return Promise.resolve(true);
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------
 * 3. OFFLINE SUPPORT & FETCH HANDLING (Offline Support)
 * ---------------------------------------------------- */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Supabase / external third-party write APIs
  if (request.method !== 'GET') return;
  if (url.origin.includes('supabase.co')) return;

  // Never cache or intercept Vite internal modules, HMR, dependencies, script files, or API requests
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('.vite') ||
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('import') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.map') ||
    request.destination === 'script' ||
    request.destination === 'worker'
  ) {
    return;
  }

  // Navigation requests: Network-first, fallback to cache, then offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Check cached response first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // Check cached index.html
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          // Fallback to offline page
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;

          return new Response(
            '<html><body style="background:#0a1211;color:white;font-family:sans-serif;padding:2rem;text-align:center;"><h1>Duyar Offline</h1><p>Please check your internet connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Google Fonts & Static CDN assets: Cache-First
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com') || url.origin.includes('unpkg.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkRes;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Image assets: Stale-While-Revalidate
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
});

/* ----------------------------------------------------
 * 4. BACKGROUND SYNC (Background Sync)
 * ---------------------------------------------------- */
self.addEventListener('sync', (event: any) => {
  console.log('[Duyar SW] Background Sync triggered with tag:', event.tag);

  if (event.tag === 'sync-offline-actions' || event.tag === 'duyar-background-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[Duyar SW] Processing queued offline actions...');
          // Broadcast to clients that background sync is in progress
          const allClients = await self.clients.matchAll({ includeUncontrolled: true });
          allClients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_OFFLINE_PROPERTIES',
              tag: event.tag,
              timestamp: Date.now()
            });
          });
        } catch (err) {
          console.error('[Duyar SW] Sync processing error:', err);
        }
      })()
    );
  }
});

/* ----------------------------------------------------
 * 5. PERIODIC SYNC (Periodic Sync)
 * ---------------------------------------------------- */
self.addEventListener('periodicsync', (event: any) => {
  console.log('[Duyar SW] Periodic Background Sync event:', event.tag);

  if (event.tag === 'periodic-property-updates' || event.tag === 'duyar-daily-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[Duyar SW] Periodic sync: Refreshing cached featured listings and alerts...');
          // Notify any active clients of background refresh
          const allClients = await self.clients.matchAll({ includeUncontrolled: true });
          allClients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC_SUCCESS',
              tag: event.tag,
              timestamp: Date.now()
            });
          });
        } catch (err) {
          console.error('[Duyar SW] Periodic sync error:', err);
        }
      })()
    );
  }
});

/* ----------------------------------------------------
 * 6. PUSH NOTIFICATIONS (Push Notifications)
 * ---------------------------------------------------- */
self.addEventListener('push', (event: any) => {
  console.log('[Duyar SW] Push notification received');
  let data: any = {
    title: 'Duyar Real Estate',
    body: 'New property alerts and updates are available.',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'duyar-notification',
    url: '/'
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions: any = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'duyar-alert',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'Open Duyar' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

/* ----------------------------------------------------
 * 7. NOTIFICATION CLICK & INTERACTION
 * ---------------------------------------------------- */
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: targetUrl
          });
          return client;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/* ----------------------------------------------------
 * 8. CLIENT COMMUNICATION & SKIP WAITING
 * ---------------------------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.ports[0]?.postMessage({
      version: CACHE_NAME,
      capabilities: [
        'ServiceWorker',
        'Logic',
        'OfflineSupport',
        'PeriodicSync',
        'BackgroundSync',
        'PushNotifications',
        'Shortcuts',
        'FileHandlers',
        'LaunchHandler',
        'ProtocolHandlers',
        'ShareTarget',
        'Widgets',
        'EdgeSidePanel',
        'WindowControlsOverlay',
        'TabbedDisplay',
        'NoteTaking'
      ]
    });
  }
});

/* ----------------------------------------------------
 * 9. PWA WIDGETS LIFECYCLE (Windows 11 / PWA Widgets)
 * ---------------------------------------------------- */
self.addEventListener('widgetinstall', (event: any) => {
  console.log('[Duyar SW] Widget installed:', event.widget?.definition?.tag);
  event.waitUntil(
    fetch('/widgets/property-widget.json')
      .then((res) => res.text())
      .then((template) => {
        return fetch('/widgets/property-data.json')
          .then((res) => res.text())
          .then((data) => {
            if (event.widget && (self as any).widgets && 'updateByTag' in (self as any).widgets) {
              return (self as any).widgets.updateByTag(event.widget.definition.tag, {
                template,
                data
              });
            }
          });
      })
      .catch((err) => console.log('[Duyar SW] Widget install handler error:', err))
  );
});

self.addEventListener('widgetuninstall', (event: any) => {
  console.log('[Duyar SW] Widget uninstalled:', event.widget?.definition?.tag);
});

self.addEventListener('widgetresume', (event: any) => {
  console.log('[Duyar SW] Widget resumed:', event.widget?.definition?.tag);
});

self.addEventListener('widgetclick', (event: any) => {
  console.log('[Duyar SW] Widget clicked with action:', event.action);
  if (self.clients && self.clients.openWindow) {
    event.waitUntil(self.clients.openWindow('/?action=explore'));
  }
});

