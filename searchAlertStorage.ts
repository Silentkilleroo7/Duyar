import { SearchAlert, SearchFilters, SentEmailLog, AdminMessage } from './types';

export type { SearchAlert };

const STORAGE_KEY = 'duyar_search_alerts_v1';
const SENT_EMAILS_KEY = 'duyar_sent_emails_v1';
const IN_APP_NOTIFICATIONS_KEY = 'duyar_inapp_notifications_v1';

export const ALERTS_CHANGED_EVENT = 'duyar_search_alerts_changed';
export const ALERT_TRIGGERED_EVENT = 'duyar_search_alert_triggered';

export const DEFAULT_USER_EMAIL = 'zahidanwar99@gmail.com';

// Initial seed alert for demonstration and instant usability
const SEED_ALERTS: SearchAlert[] = [];

export function getSearchAlerts(): SearchAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ALERTS));
      return SEED_ALERTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse search alerts from localStorage:', err);
    return SEED_ALERTS;
  }
}

function persistSearchAlerts(alerts: SearchAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent(ALERTS_CHANGED_EVENT, { detail: alerts }));
  } catch (err) {
    console.error('Failed to save search alerts to localStorage:', err);
  }
}

export function subscribeToSearchAlerts(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(ALERTS_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ALERTS_CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function subscribeToAlertTriggered(callback: (data: { alert: SearchAlert; property: any; emailLog?: SentEmailLog }) => void): () => void {
  const handler = (e: any) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(ALERT_TRIGGERED_EVENT, handler);
  return () => {
    window.removeEventListener(ALERT_TRIGGERED_EVENT, handler);
  };
}

export function generateAlertTitle(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.propertyType && filters.propertyType !== 'All') {
    parts.push(filters.propertyType);
  } else {
    parts.push('All Properties');
  }

  if (filters.maxBudget) {
    parts.push(`Up to ৳${filters.maxBudget}k`);
  }

  if (filters.beds && filters.beds !== 'Any') {
    parts.push(`${filters.beds} Bed${filters.beds === '1' ? '' : 's'}`);
  }

  if (filters.tags && filters.tags.length > 0) {
    parts.push(filters.tags.slice(0, 2).join(', ') + (filters.tags.length > 2 ? ` +${filters.tags.length - 2}` : ''));
  }

  return parts.join(' • ');
}

export function saveSearchAlert(alertData: Omit<SearchAlert, 'id' | 'createdAt'>): SearchAlert {
  const existingAlerts = getSearchAlerts();
  
  // Check if identical or update
  const newAlert: SearchAlert = {
    ...alertData,
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    matchedCount: alertData.matchedCount || 0
  };

  const updated = [newAlert, ...existingAlerts];
  persistSearchAlerts(updated);
  return newAlert;
}

export function updateSearchAlert(id: string, updates: Partial<SearchAlert>): SearchAlert | null {
  const alerts = getSearchAlerts();
  const index = alerts.findIndex(a => a.id === id);
  if (index === -1) return null;

  const updatedAlert = { ...alerts[index], ...updates };
  alerts[index] = updatedAlert;
  persistSearchAlerts(alerts);
  return updatedAlert;
}

export function toggleSearchAlert(id: string, active?: boolean): void {
  const alerts = getSearchAlerts();
  const updated = alerts.map(a => {
    if (a.id === id) {
      return { ...a, isActive: active !== undefined ? active : !a.isActive };
    }
    return a;
  });
  persistSearchAlerts(updated);
}

export function deleteSearchAlert(id: string): void {
  const alerts = getSearchAlerts();
  const updated = alerts.filter(a => a.id !== id);
  persistSearchAlerts(updated);
}

export function findExistingAlertForFilters(filters: SearchFilters): SearchAlert | undefined {
  const alerts = getSearchAlerts();
  return alerts.find(a => {
    const c = a.criteria;
    const sameType = (c.propertyType || '').toLowerCase() === (filters.propertyType || '').toLowerCase();
    const sameBeds = c.beds === filters.beds;
    const sameBudget = c.maxBudget === filters.maxBudget;
    const cTags = [...(c.tags || [])].sort().join(',');
    const fTags = [...(filters.tags || [])].sort().join(',');
    return sameType && sameBeds && sameBudget && cTags === fTags;
  });
}

function parsePriceNumber(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return 0;
  // If in thousands (e.g. 45000 -> 45k)
  if (num > 1000) return Math.round(num / 1000);
  return num;
}

export function checkPropertyMatchesAlert(property: any, alert: SearchAlert): boolean {
  if (!alert.isActive) return false;
  const c = alert.criteria;

  // 1. Property Type
  if (c.propertyType && c.propertyType !== 'All') {
    const pType = (property.type || '').toLowerCase();
    if (pType && pType !== c.propertyType.toLowerCase()) {
      return false;
    }
  }

  // 2. Price Budget (in k)
  if (c.maxBudget) {
    const propPriceK = parsePriceNumber(property.price);
    if (propPriceK > c.maxBudget) {
      return false;
    }
  }

  // 3. Bedrooms
  if (c.beds && c.beds !== 'Any') {
    const propBeds = Number(property.beds);
    if (c.beds === '4+') {
      if (propBeds < 4) return false;
    } else {
      if (propBeds !== Number(c.beds)) return false;
    }
  }

  // 4. Tags
  if (c.tags && c.tags.length > 0) {
    const propTags = (property.tags || []).map((t: string) => t.toLowerCase());
    const hasAll = c.tags.every(t => propTags.includes(t.toLowerCase()));
    if (!hasAll) return false;
  }

  return true;
}

export function getSentEmailLogs(): SentEmailLog[] {
  try {
    const raw = localStorage.getItem(SENT_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read sent emails log:', err);
    return [];
  }
}

export function clearSentEmailLogs(): void {
  localStorage.removeItem(SENT_EMAILS_KEY);
}

export function getInAppNotifications(): AdminMessage[] {
  try {
    const rawMsgs = localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
    return rawMsgs ? JSON.parse(rawMsgs) : [];
  } catch (err) {
    console.error('Failed to parse in-app notifications:', err);
    return [];
  }
}

export function persistInAppNotifications(msgs: AdminMessage[]): void {
  try {
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(msgs));
  } catch (err) {
    console.error('Failed to persist in-app notifications:', err);
  }
}

export function saveInAppNotification(msg: AdminMessage): void {
  try {
    const current = getInAppNotifications();
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify([msg, ...current.slice(0, 49)]));
  } catch (err) {
    console.error('Failed to save in-app notification:', err);
  }
}

export function markInAppNotificationAsReadInStorage(id: string): void {
  try {
    const current = getInAppNotifications();
    const updated = current.map(m => m.id === id ? { ...m, isRead: true } : m);
    persistInAppNotifications(updated);
  } catch (err) {
    console.error('Failed to mark notification as read in storage:', err);
  }
}

export function deleteInAppNotificationFromStorage(id: string): void {
  try {
    const current = getInAppNotifications();
    const updated = current.filter(m => m.id !== id);
    persistInAppNotifications(updated);
  } catch (err) {
    console.error('Failed to delete in-app notification from storage:', err);
  }
}


export function triggerPriceDropAlert(
  alert: SearchAlert,
  property: any,
  previousPrice: string | number,
  newPrice: string | number
): {
  alert: SearchAlert;
  property: any;
  emailLog?: SentEmailLog;
  inAppMsg: AdminMessage;
} {
  const updatedCount = (alert.matchedCount || 0) + 1;
  updateSearchAlert(alert.id, {
    matchedCount: updatedCount,
    lastNotified: new Date().toISOString()
  });

  const formattedNewPrice = typeof newPrice === 'number' ? `৳ ${newPrice}k` : String(newPrice);
  const formattedOldPrice = typeof previousPrice === 'number' ? `৳ ${previousPrice}k` : String(previousPrice);
  const budgetLimit = alert.criteria.maxBudget ? `৳${alert.criteria.maxBudget}k` : 'your budget';

  // In-App Notification (Always generated for price drops)
  const inAppMsg: AdminMessage = {
    id: `msg-pricedrop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: `📉 Price Drop Alert: ${property.title}`,
    content: `Great news! Price reduced from ${formattedOldPrice} down to ${formattedNewPrice}/mo (now below your filter limit of ${budgetLimit})! Located at ${property.location || 'Dhaka'}.`,
    time: 'Just now',
    type: 'ALERT',
    isRead: false
  };

  saveInAppNotification(inAppMsg);

  let emailLog: SentEmailLog | undefined;
  if (alert.emailNotification && alert.email) {
    emailLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      to: alert.email,
      subject: `📉 Price Drop: ${property.title} is now ${formattedNewPrice}/mo!`,
      bodyPreview: `Price dropped from ${formattedOldPrice} to ${formattedNewPrice} (below your filter budget of ${budgetLimit}) for ${property.title} in ${property.location}.`,
      sentAt: new Date().toISOString(),
      propertyTitle: property.title,
      propertyPrice: formattedNewPrice,
      propertyImage: property.image,
      propertyLocation: property.location,
      matchedAlertTitle: `Price Drop: ${alert.title}`
    };

    try {
      const logs = getSentEmailLogs();
      localStorage.setItem(SENT_EMAILS_KEY, JSON.stringify([emailLog, ...logs.slice(0, 49)]));
    } catch (e) {
      console.error('Failed to write email log', e);
    }
  }

  const eventPayload = {
    alert: { ...alert, matchedCount: updatedCount, lastNotified: new Date().toISOString() },
    property: { ...property, price: formattedNewPrice, previousPrice: formattedOldPrice },
    emailLog,
    inAppMsg,
    isPriceDrop: true,
    previousPrice: formattedOldPrice,
    newPrice: formattedNewPrice
  };

  window.dispatchEvent(new CustomEvent(ALERT_TRIGGERED_EVENT, { detail: eventPayload }));

  return {
    alert: eventPayload.alert,
    property: eventPayload.property,
    emailLog,
    inAppMsg
  };
}

export function triggerSearchAlertMatch(alert: SearchAlert, property: any): {
  alert: SearchAlert;
  property: any;
  emailLog?: SentEmailLog;
  inAppMsg?: AdminMessage;
} {
  // 1. Update alert match stats
  const updatedCount = (alert.matchedCount || 0) + 1;
  updateSearchAlert(alert.id, {
    matchedCount: updatedCount,
    lastNotified: new Date().toISOString()
  });

  let emailLog: SentEmailLog | undefined;
  let inAppMsg: AdminMessage | undefined;

  // 2. Email Notification simulation & logging
  if (alert.emailNotification && alert.email) {
    emailLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      to: alert.email,
      subject: `🔔 New Property Match: ${property.title} in ${property.location || 'Dhaka'}`,
      bodyPreview: `Great news! A new listing matching your search "${alert.title}" just became available for ${property.price}/mo.`,
      sentAt: new Date().toISOString(),
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyImage: property.image,
      propertyLocation: property.location,
      matchedAlertTitle: alert.title
    };

    try {
      const logs = getSentEmailLogs();
      localStorage.setItem(SENT_EMAILS_KEY, JSON.stringify([emailLog, ...logs.slice(0, 49)]));
    } catch (e) {
      console.error('Failed to write email log', e);
    }
  }

  // 3. In-App Message Generation
  if (alert.inAppNotification) {
    inAppMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `🔔 Search Match: ${property.title}`,
      content: `A new property matching your saved alert "${alert.title}" was just posted at ${property.location} for ${property.price}/mo with ${property.beds} Beds.`,
      time: 'Just now',
      type: 'SUCCESS',
      isRead: false
    };

    saveInAppNotification(inAppMsg);
  }

  // 4. Dispatch alert triggered event for real-time UI notification / toast
  const eventPayload = {
    alert: { ...alert, matchedCount: updatedCount, lastNotified: new Date().toISOString() },
    property,
    emailLog,
    inAppMsg
  };

  window.dispatchEvent(new CustomEvent(ALERT_TRIGGERED_EVENT, { detail: eventPayload }));

  return eventPayload;
}
