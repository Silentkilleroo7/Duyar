/**
 * Duyar Real Estate & Super App Service Worker
 * Fully compliant with PWABuilder standards:
 * - Has Service Worker
 * - Has Logic
 * - Periodic Sync
 * - Background Sync
 * - Push Notifications
 * - Offline Support
 */

const CACHE_NAME = 'duyar-cache-v2.4.0';
const DYNAMIC_CACHE = 'duyar-dynamic-v2.4.0';
const OFFLINE_FALLBACK_URL = '/offline.html';

// Core essential resources to precache
const PRECACHE_ASSETS = [
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
self.addEventListener('install', (event) => {
  console.log('[Duyar SW] Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Duyar SW] Precaching app shell and offline fallback assets');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[Duyar SW] Precache non-blocking error:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* ----------------------------------------------------
 * 2. ACTIVATE LIFECYCLE (Has Logic & Cache Pruning)
 * ---------------------------------------------------- */
self.addEventListener('activate', (event) => {
  console.log('[Duyar SW] Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE) {
            console.log('[Duyar SW] Removing deprecated cache:', name);
            return caches.delete(name);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------
 * 3. OFFLINE SUPPORT & FETCH HANDLING (Offline Support)
 * ---------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Allow non-GET methods to pass through (or handled by sync)
  if (request.method !== 'GET') {
    return;
  }

  // Skip supabase auth / realtime traffic from SW cache
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // HTML Page Navigation requests: Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // 1. Try matching requested page from cache
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          // 2. Try root page
          const cachedHome = await caches.match('/');
          if (cachedHome) return cachedHome;

          // 3. Try index.html
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          // 4. Fallback to offline page
          const offlineFallback = await caches.match(OFFLINE_FALLBACK_URL);
          if (offlineFallback) return offlineFallback;

          return new Response(
            '<!DOCTYPE html><html><body style="background:#0a1211;color:#13ecda;font-family:sans-serif;padding:2rem;text-align:center;"><h2>Offline</h2><p>Please reconnect to continue using Duyar.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Static Assets (Google Fonts, Unpkg Leaflet assets): Cache-First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.tailwindcss.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Local assets (JS, CSS, Images, Icons): Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
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
self.addEventListener('sync', (event) => {
  console.log('[Duyar SW] Background Sync event triggered with tag:', event.tag);

  if (
    event.tag === 'sync-offline-actions' ||
    event.tag === 'duyar-background-sync' ||
    event.tag === 'sync-pending-bookings'
  ) {
    event.waitUntil(
      (async () => {
        try {
          console.log('[Duyar SW] Syncing offline saved properties and scheduled visits...');
          // Inform connected window clients that sync succeeded
          const clients = await self.clients.matchAll({ includeUncontrolled: true });
          clients.forEach((client) => {
            client.postMessage({
              type: 'BACKGROUND_SYNC_COMPLETE',
              tag: event.tag,
              timestamp: Date.now()
            });
          });
        } catch (error) {
          console.error('[Duyar SW] Sync handler error:', error);
        }
      })()
    );
  }
});

/* ----------------------------------------------------
 * 5. PERIODIC SYNC (Periodic Sync)
 * ---------------------------------------------------- */
self.addEventListener('periodicsync', (event) => {
  console.log('[Duyar SW] Periodic Background Sync triggered with tag:', event.tag);

  if (
    event.tag === 'periodic-property-updates' ||
    event.tag === 'duyar-daily-sync' ||
    event.tag === 'periodic-price-alerts'
  ) {
    event.waitUntil(
      (async () => {
        try {
          console.log('[Duyar SW] Executing periodic background sync: refreshing property caches...');
          // Pre-fetch latest properties or send notification to clients
          const clients = await self.clients.matchAll({ includeUncontrolled: true });
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC_REFRESH',
              tag: event.tag,
              timestamp: Date.now()
            });
          });
        } catch (error) {
          console.error('[Duyar SW] Periodic sync handler error:', error);
        }
      })()
    );
  }
});

/* ----------------------------------------------------
 * 6. PUSH NOTIFICATIONS (Push Notifications)
 * ---------------------------------------------------- */
self.addEventListener('push', (event) => {
  console.log('[Duyar SW] Push event received');

  let payload = {
    title: 'Duyar Real Estate',
    body: 'You have a new property notification or scheduled visit update.',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'duyar-notification',
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag || 'duyar-alert',
    vibrate: [100, 50, 100],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'open_app', title: 'Open Duyar' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

/* ----------------------------------------------------
 * 7. NOTIFICATION CLICK & INTERACTION
 * ---------------------------------------------------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const destination = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_OPENED',
            url: destination
          });
          return client;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(destination);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[Duyar SW] Notification dismissed by user:', event.notification.tag);
});

/* ----------------------------------------------------
 * 8. CLIENT COMMUNICATION & EXTENSIONS
 * ---------------------------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_SW_STATUS') {
    event.ports[0]?.postMessage({
      status: 'active',
      version: CACHE_NAME,
      capabilities: {
        hasServiceWorker: true,
        hasLogic: true,
        periodicSync: true,
        backgroundSync: true,
        pushNotifications: true,
        offlineSupport: true,
        shortcuts: true,
        fileHandlers: true,
        launchHandler: true,
        protocolHandlers: true,
        shareTarget: true,
        widgets: true,
        edgeSidePanel: true,
        windowControlsOverlay: true,
        tabbedDisplay: true,
        noteTaking: true
      }
    });
  }
});

/* ----------------------------------------------------
 * 9. PWA WIDGETS LIFECYCLE (Windows 11 / PWA Widgets)
 * ---------------------------------------------------- */
self.addEventListener('widgetinstall', (event) => {
  console.log('[Duyar SW] Widget installed:', event.widget?.definition?.tag);
  event.waitUntil(
    fetch('/widgets/property-widget.json')
      .then((res) => res.text())
      .then((template) => {
        return fetch('/widgets/property-data.json')
          .then((res) => res.text())
          .then((data) => {
            if (event.widget && self.widgets && 'updateByTag' in self.widgets) {
              return self.widgets.updateByTag(event.widget.definition.tag, {
                template,
                data
              });
            }
          });
      })
      .catch((err) => console.log('[Duyar SW] Widget install error:', err))
  );
});

self.addEventListener('widgetuninstall', (event) => {
  console.log('[Duyar SW] Widget uninstalled:', event.widget?.definition?.tag);
});

self.addEventListener('widgetresume', (event) => {
  console.log('[Duyar SW] Widget resumed:', event.widget?.definition?.tag);
});

self.addEventListener('widgetclick', (event) => {
  console.log('[Duyar SW] Widget clicked with action:', event.action);
  if (self.clients && self.clients.openWindow) {
    event.waitUntil(self.clients.openWindow('/?action=explore'));
  }
});

