/**
 * Duyar Maintenance Visit Notification Scheduler
 * Schedules and dispatches push notifications to users 30 minutes before
 * a booked maintenance service visit to confirm their presence and availability.
 */

import { haptics } from './haptics';

export interface ScheduledMaintenanceVisit {
  id: string;
  ticketId?: string;
  serviceType: string;
  serviceTitle: string;
  providerName: string;
  providerRole: string;
  providerPhone: string;
  providerImage?: string;
  customerName: string;
  customerPhone?: string;
  userId?: string;
  address: string;
  scheduledTime: string; // e.g. "Today, 02:30 PM"
  scheduledTimestamp: number; // epoch ms
  notifyAtTimestamp: number; // 30 minutes before scheduledTimestamp
  notified: boolean;
  notifiedAt?: string;
  availabilityConfirmed: boolean;
  confirmedAt?: string;
  delayedByMinutes?: number;
  status: 'SCHEDULED' | 'NOTIFIED_PENDING' | 'CONFIRMED' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

const STORAGE_KEY = 'duyar_scheduled_maintenance_visits_v3';
const SETTINGS_KEY = 'duyar_maintenance_reminder_enabled';
export const VISIT_SCHEDULED_EVENT = 'duyar_maintenance_visit_scheduled';
export const REMINDER_DUE_EVENT = 'duyar_maintenance_reminder_due';
export const AVAILABILITY_CONFIRMED_EVENT = 'duyar_availability_confirmed';

// Helper to format friendly time strings
export function formatTimeHoursMinutes(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Default seed maintenance visits: clean empty array (no mock data)
function getSeedVisits(): ScheduledMaintenanceVisit[] {
  return [];
}

/**
 * Check if browser supports Web Notifications
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getPushPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Check if the 30-min pre-visit reminder setting is enabled by user
 */
export function isPreVisitReminderEnabled(): boolean {
  try {
    const val = localStorage.getItem(SETTINGS_KEY);
    return val !== 'false'; // default is true
  } catch {
    return true;
  }
}

/**
 * Toggle the 30-min pre-visit reminder setting
 */
export function setPreVisitReminderEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SETTINGS_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Could not save reminder setting:', e);
  }
}

/**
 * Get all scheduled maintenance visits from localStorage
 */
export function getScheduledMaintenanceVisits(): ScheduledMaintenanceVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = getSeedVisits();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse scheduled visits from storage:', err);
    return getSeedVisits();
  }
}

/**
 * Persist scheduled visits to localStorage and emit change event
 */
export function persistScheduledVisits(visits: ScheduledMaintenanceVisit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    window.dispatchEvent(new CustomEvent(VISIT_SCHEDULED_EVENT, { detail: visits }));
  } catch (err) {
    console.error('Failed to persist scheduled visits:', err);
  }
}

/**
 * Schedule a new maintenance service visit
 * Automatically calculates 30-min pre-visit notification timestamp
 */
export function scheduleMaintenanceVisit(params: {
  ticketId?: string;
  serviceType: string;
  serviceTitle: string;
  providerName: string;
  providerRole: string;
  providerPhone?: string;
  providerImage?: string;
  customerName?: string;
  customerPhone?: string;
  userId?: string;
  address: string;
  scheduledTimestamp?: number; // epoch ms (default: 45 mins from now)
  scheduledTime?: string;
}): ScheduledMaintenanceVisit {
  const now = Date.now();
  // Default scheduled time: 45 minutes from now if not specified
  const scheduledTimestamp = params.scheduledTimestamp || (now + 45 * 60 * 1000);
  const notifyAtTimestamp = scheduledTimestamp - 30 * 60 * 1000; // exactly 30 mins before visit

  const newVisit: ScheduledMaintenanceVisit = {
    id: `SCHED-${params.serviceType.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    ticketId: params.ticketId || `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    serviceType: params.serviceType,
    serviceTitle: params.serviceTitle || `${params.serviceType} Service Visit`,
    providerName: params.providerName || 'Licensed Duyar Specialist',
    providerRole: params.providerRole || 'Master Technician • Verified',
    providerPhone: params.providerPhone || '+880 1712-984512',
    providerImage: params.providerImage || '',
    customerName: params.customerName || 'Resident',
    customerPhone: params.customerPhone || '',
    userId: params.userId,
    address: params.address || 'House 14, Road 11, Block D, Banani, Dhaka',
    scheduledTime: params.scheduledTime || `Today, ${formatTimeHoursMinutes(scheduledTimestamp)}`,
    scheduledTimestamp,
    notifyAtTimestamp,
    notified: false,
    availabilityConfirmed: false,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
    ...({ isSessionBooking: true } as any)
  };

  const visits = getScheduledMaintenanceVisits();
  const updated = [newVisit, ...visits];
  persistScheduledVisits(updated);

  return newVisit;
}

export function getUserScheduledVisits(userPhone?: string, userId?: string): ScheduledMaintenanceVisit[] {
  const all = getScheduledMaintenanceVisits();
  if (!userPhone && !userId) {
    return all.filter(v => (v as any).isSessionBooking && !v.userId);
  }

  const cleanPhone = userPhone ? userPhone.replace(/[\s-]/g, '') : '';
  return all.filter(v => {
    if (userId && v.userId && v.userId === userId) return true;
    if (cleanPhone && v.customerPhone) {
      const vPhoneClean = v.customerPhone.replace(/[\s-]/g, '');
      if (vPhoneClean === cleanPhone || vPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(vPhoneClean)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Dispatch actual Web Push notification via browser Notification API
 */
export async function sendWebPushNotification(title: string, body: string, visitId?: string): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    if (Notification.permission === 'granted') {
      // 1. Try ServiceWorkerRegistration if active PWA
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/icon.svg',
              badge: '/icon.svg',
              tag: `maintenance-visit-${visitId || 'alert'}`,
              renotify: true,
              data: { visitId, url: '/' },
              requireInteraction: true
            } as any);
            return true;
          }
        } catch {
          // Fall through to standard Notification
        }
      }

      // 2. Direct Window Notification fallback
      const notif = new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: `maintenance-visit-${visitId || 'alert'}`
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    }
  } catch (e) {
    console.debug('Direct notification error (safely handled):', e);
  }
  return false;
}

/**
 * User confirms their presence & availability for the upcoming visit
 */
export function confirmVisitAvailability(visitId: string): boolean {
  const visits = getScheduledMaintenanceVisits();
  const idx = visits.findIndex(v => v.id === visitId);
  if (idx === -1) return false;

  visits[idx] = {
    ...visits[idx],
    availabilityConfirmed: true,
    status: 'CONFIRMED',
    confirmedAt: new Date().toISOString()
  };

  persistScheduledVisits(visits);
  try {
    haptics.bookingConfirmed();
  } catch {}

  window.dispatchEvent(new CustomEvent(AVAILABILITY_CONFIRMED_EVENT, { detail: visits[idx] }));
  return true;
}

/**
 * User requests a 15-minute delay / buffer
 */
export function delayVisitSchedule(visitId: string, delayMinutes: number = 15): boolean {
  const visits = getScheduledMaintenanceVisits();
  const idx = visits.findIndex(v => v.id === visitId);
  if (idx === -1) return false;

  const current = visits[idx];
  const newScheduledTimestamp = current.scheduledTimestamp + delayMinutes * 60 * 1000;
  const newNotifyAtTimestamp = newScheduledTimestamp - 30 * 60 * 1000;

  visits[idx] = {
    ...current,
    scheduledTimestamp: newScheduledTimestamp,
    notifyAtTimestamp: newNotifyAtTimestamp,
    scheduledTime: `Today, ${formatTimeHoursMinutes(newScheduledTimestamp)} (Delayed ${delayMinutes}m)`,
    delayedByMinutes: (current.delayedByMinutes || 0) + delayMinutes,
    status: 'DELAYED',
    notified: false // Re-arm notification if still > 30m away
  };

  persistScheduledVisits(visits);
  try {
    haptics.medium();
  } catch {}

  window.dispatchEvent(new CustomEvent(VISIT_SCHEDULED_EVENT, { detail: visits }));
  return true;
}

/**
 * Core Scheduler Poller:
 * Checks if any scheduled visit is now 30 minutes away and not yet notified.
 * Returns the list of visits that triggered notifications.
 */
export function checkAndTriggerDueNotifications(): ScheduledMaintenanceVisit[] {
  if (!isPreVisitReminderEnabled()) return [];

  const now = Date.now();
  const visits = getScheduledMaintenanceVisits();
  const triggered: ScheduledMaintenanceVisit[] = [];
  let updatedAny = false;

  for (let i = 0; i < visits.length; i++) {
    const v = visits[i];
    // Trigger condition: current time is at or past notifyAtTimestamp (which is scheduledTime - 30 mins),
    // and visit hasn't been notified yet and is still active
    if (
      !v.notified &&
      (v.status === 'SCHEDULED' || v.status === 'DELAYED') &&
      now >= v.notifyAtTimestamp &&
      now < v.scheduledTimestamp + 10 * 60 * 1000 // within reasonable arrival window
    ) {
      // Mark as notified
      visits[i] = {
        ...v,
        notified: true,
        notifiedAt: new Date().toISOString(),
        status: 'NOTIFIED_PENDING'
      };
      triggered.push(visits[i]);
      updatedAny = true;

      // Send Browser Push Notification
      const title = `🔔 30-Min Reminder: ${v.serviceType} Visit`;
      const body = `Technician ${v.providerName} arrives at ${formatTimeHoursMinutes(v.scheduledTimestamp)}. Tap to confirm availability.`;
      sendWebPushNotification(title, body, v.id);

      // Trigger Tactile Haptic Notification
      try {
        haptics.notification();
      } catch {}

      // Dispatch in-app event for UI modals and floating banners
      window.dispatchEvent(new CustomEvent(REMINDER_DUE_EVENT, { detail: visits[i] }));
    }
  }

  if (updatedAny) {
    persistScheduledVisits(visits);
  }

  return triggered;
}

/**
 * Simulator / Demo Helper:
 * Instantly triggers the 30-minute pre-visit push notification & confirmation modal
 * for immediate user verification and evaluation.
 */
export function simulateDueNotification(visitId?: string): ScheduledMaintenanceVisit | null {
  const visits = getScheduledMaintenanceVisits();
  let target = visitId ? visits.find(v => v.id === visitId) : visits[0];

  if (!target) {
    // If no visits exist, create one
    target = scheduleMaintenanceVisit({
      serviceType: 'Electrical',
      serviceTitle: 'Electrical Diagnostic & Circuit Fix',
      providerName: 'Licensed Electrician',
      providerRole: 'Licensed Senior Electrician • Verified',
      address: 'House 14, Road 11, Block D, Banani, Dhaka'
    });
  }

  const now = Date.now();
  const updatedVisits = getScheduledMaintenanceVisits().map(v => {
    if (v.id === target?.id) {
      return {
        ...v,
        scheduledTimestamp: now + 30 * 60 * 1000,
        notifyAtTimestamp: now - 1000, // force due
        notified: true,
        notifiedAt: new Date().toISOString(),
        status: 'NOTIFIED_PENDING' as const,
        availabilityConfirmed: false
      };
    }
    return v;
  });

  persistScheduledVisits(updatedVisits);

  const finalTarget = updatedVisits.find(v => v.id === target?.id)!;

  // Send Browser Push Notification
  const title = `🔔 30-Min Reminder: ${finalTarget.serviceType} Visit`;
  const body = `Technician ${finalTarget.providerName} arrives in 30 minutes (${formatTimeHoursMinutes(finalTarget.scheduledTimestamp)}). Please confirm your availability!`;
  sendWebPushNotification(title, body, finalTarget.id);

  // Trigger Tactile Haptics
  try {
    haptics.notification();
  } catch {}

  // Dispatch in-app reminder event
  window.dispatchEvent(new CustomEvent(REMINDER_DUE_EVENT, { detail: finalTarget }));

  return finalTarget;
}
