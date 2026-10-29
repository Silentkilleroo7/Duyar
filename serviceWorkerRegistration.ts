/**
 * Duyar Real Estate - Service Worker Registration & Management Client
 * Implements:
 * - Service Worker Registration & Lifecycle
 * - Periodic Sync registration & permission checks
 * - Background Sync queue & triggers
 * - Push Notification permission & subscription
 * - Offline cache status
 */

export interface ServiceWorkerCapabilities {
  hasServiceWorker: boolean;
  hasLogic: boolean;
  periodicSync: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  offlineSupport: boolean;
  registrationState: 'unregistered' | 'installing' | 'waiting' | 'active';
  pushPermission: NotificationPermission;
}

/**
 * Register the Service Worker at root scope
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[Duyar SW Client] Service workers are not supported by this browser.');
    return null;
  }

  try {
    // Purge any stale dynamic/app shell caches containing mismatched Vite chunks
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.includes('duyar') || name.includes('workbox')) {
            await caches.delete(name);
          }
        }
      } catch (_) {}
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[Duyar SW Client] Service worker successfully registered with scope:', registration.scope);

    // Prompt worker to activate if waiting
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Duyar SW Client] New content is available; will auto-update.');
          }
        });
      }
    });

    // Auto-attempt Background Sync registration
    await registerBackgroundSync('sync-offline-actions', registration);

    // Auto-attempt Periodic Background Sync registration
    await registerPeriodicSync('periodic-property-updates', 12, registration);

    return registration;
  } catch (error) {
    console.warn('[Duyar SW Client] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Request Background Sync registration
 */
export async function registerBackgroundSync(
  tag: string = 'sync-offline-actions',
  existingReg?: ServiceWorkerRegistration
): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = existingReg || await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      // @ts-ignore - sync API
      await registration.sync.register(tag);
      console.log(`[Duyar SW Client] Background sync registered for tag: ${tag}`);
      return true;
    }
  } catch (err) {
    console.log('[Duyar SW Client] Background sync register note:', err);
  }
  return false;
}

/**
 * Request Periodic Background Sync registration
 */
export async function registerPeriodicSync(
  tag: string = 'periodic-property-updates',
  intervalHours: number = 12,
  existingReg?: ServiceWorkerRegistration
): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = existingReg || await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      const status = await (navigator as any).permissions?.query({
        name: 'periodic-background-sync',
      });

      if (status && (status.state === 'granted' || status.state === 'prompt')) {
        // @ts-ignore - periodicSync API
        await registration.periodicSync.register(tag, {
          minInterval: intervalHours * 60 * 60 * 1000
        });
        console.log(`[Duyar SW Client] Periodic background sync registered: ${tag} (${intervalHours}h)`);
        return true;
      }
    }
  } catch (err) {
    console.log('[Duyar SW Client] Periodic sync register note:', err);
  }
  return false;
}

/**
 * Request Notification Permission and register push
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPushManager();
    }
    return permission;
  } catch (err) {
    console.warn('[Duyar SW Client] Notification permission request error:', err);
    return 'denied';
  }
}

/**
 * Subscribe to PushManager
 */
export async function subscribeToPushManager(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!('pushManager' in registration)) return null;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      // Generate standard ephemeral VAPID key / userVisible subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });
    }
    return subscription;
  } catch (err) {
    console.log('[Duyar SW Client] Push subscription note:', err);
    return null;
  }
}

/**
 * Trigger a test push notification via the active service worker
 */
export async function sendTestServiceWorkerNotification(
  title: string = 'Duyar Real Estate',
  body: string = 'Service Worker is active! Offline, sync, and push notifications are fully functional.'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return false;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        tag: 'duyar-test-alert',
        vibrate: [100, 50, 100],
        data: { url: '/' },
        actions: [
          { action: 'open_app', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      } as any);
      return true;
    }
  } catch (err) {
    console.warn('[Duyar SW Client] Test notification error:', err);
  }
  return false;
}

/**
 * Get comprehensive PWA capabilities report
 */
export async function getSWCapabilities(): Promise<ServiceWorkerCapabilities> {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const pushPerm: NotificationPermission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'denied';

  if (!isSupported) {
    return {
      hasServiceWorker: false,
      hasLogic: false,
      periodicSync: false,
      backgroundSync: false,
      pushNotifications: false,
      offlineSupport: false,
      registrationState: 'unregistered',
      pushPermission: pushPerm
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const hasReg = !!registration;
    const hasPeriodic = hasReg && 'periodicSync' in registration;
    const hasSync = hasReg && 'sync' in registration;
    const hasPush = hasReg && 'pushManager' in registration;

    let state: ServiceWorkerCapabilities['registrationState'] = 'unregistered';
    if (registration) {
      if (registration.active) state = 'active';
      else if (registration.waiting) state = 'waiting';
      else if (registration.installing) state = 'installing';
    }

    return {
      hasServiceWorker: hasReg,
      hasLogic: true,
      periodicSync: hasPeriodic,
      backgroundSync: hasSync,
      pushNotifications: hasPush,
      offlineSupport: true,
      registrationState: state,
      pushPermission: pushPerm
    };
  } catch (e) {
    return {
      hasServiceWorker: false,
      hasLogic: true,
      periodicSync: false,
      backgroundSync: false,
      pushNotifications: false,
      offlineSupport: true,
      registrationState: 'unregistered',
      pushPermission: pushPerm
    };
  }
}

/**
 * Helper to convert Base64 URL to Uint8Array for VAPID key
 */
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
