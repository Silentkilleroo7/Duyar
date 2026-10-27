import { Property } from './types';
import { supabase } from './supabase';

export const RENT_PROPERTY_TYPES = [
  'Bachelor',
  'Sub-let',
  'Family',
  'Commercial'
] as const;

export const SALE_PROPERTY_TYPES = [
  'Flat / Apartment',
  'Commercial'
] as const;

export type RentPropertyType = typeof RENT_PROPERTY_TYPES[number];
export type SalePropertyType = typeof SALE_PROPERTY_TYPES[number];
export type PropertyPostingType = RentPropertyType | SalePropertyType;

const STORAGE_KEY = 'duyar_published_properties_v2';
const EVENT_KEY = 'duyar_properties_updated';
const FOCUS_KEY = 'duyar_focus_property_id';
const FOCUS_COORDS_KEY = 'duyar_focus_coords';

// Fresh live environment: zero mock seed properties
export const SEED_PROPERTIES: Property[] = [];

function notifyPropertySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export const SEED_LOCATOR_PROPERTIES: Property[] = [];

// Get user-published properties from localStorage
export function getStoredPublishedProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading published properties:', err);
    return [];
  }
}

// Save a newly posted property: ensures it is saved locally, broadcasted, and synced to Supabase
export function savePublishedProperty(property: Property): Property {
  if (typeof window === 'undefined') return property;

  try {
    const existing = getStoredPublishedProperties();
    // Prepend so latest appears first
    const updated = [property, ...existing.filter(p => p.id !== property.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Store focus information so map centers right on this new post
    localStorage.setItem(FOCUS_KEY, property.id);
    if (property.lat && property.lng) {
      localStorage.setItem(FOCUS_COORDS_KEY, JSON.stringify([property.lat, property.lng]));
    }

    notifyPropertySubscribers();

    // Async sync to Supabase database (non-blocking)
    if (supabase) {
      (async () => {
        try {
          const { error } = await supabase.from('properties').upsert({
            id: property.id,
            title: property.title,
            price: property.price,
            location: property.location,
            lat: property.lat,
            lng: property.lng,
            latitude: property.lat,
            longitude: property.lng,
            type: property.type,
            beds: property.beds,
            baths: property.baths,
            sqft: property.sqft,
            image_url: property.image,
            tag: property.tag,
            status: 'APPROVED',
            is_verified: true,
            available_month: property.availableMonth
          });
          if (error) console.debug('Supabase property upsert note:', error.message);
        } catch (err) {
          console.debug('Supabase sync note:', err);
        }
      })();
    }
  } catch (err) {
    console.error('Error saving published property:', err);
  }

  return property;
}

// Get all properties merged: User posts + Supabase DB + Seed properties (deduplicated)
export function getAllPropertiesCombined(dbProperties: Property[] = []): Property[] {
  const localPublished = getStoredPublishedProperties();
  const seenIds = new Set<string>();
  const combined: Property[] = [];

  // 1. User's newly published properties first (highest priority)
  localPublished.forEach(p => {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  });

  // 2. Supabase DB properties
  dbProperties.forEach(p => {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  });

  // 3. Seed properties for baseline coverage if needed
  SEED_PROPERTIES.forEach(p => {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  });

  return combined;
}

// Subscribe to real-time property publishing events
export function subscribeToProperties(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_KEY, callback);
  return () => {
    window.removeEventListener(EVENT_KEY, callback);
  };
}

// Focus helpers for post-submission map navigation
export function getPendingFocusProperty(): { id: string | null; coords: [number, number] | null } {
  if (typeof window === 'undefined') return { id: null, coords: null };
  const id = localStorage.getItem(FOCUS_KEY);
  const coordsRaw = localStorage.getItem(FOCUS_COORDS_KEY);
  let coords: [number, number] | null = null;
  if (coordsRaw) {
    try {
      coords = JSON.parse(coordsRaw);
    } catch {}
  }
  return { id, coords };
}

export function clearPendingFocusProperty(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FOCUS_KEY);
  localStorage.removeItem(FOCUS_COORDS_KEY);
}

// Update property verification status (used by Admin/Moderator)
export function updatePropertyVerification(
  propertyId: string, 
  isVerified: boolean, 
  verifiedBy: string = 'Duyar Admin Desk',
  locatorStatus?: 'APPROVED' | 'REJECTED' | 'PENDING'
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getStoredPublishedProperties();
    let found = false;
    const updated = list.map(p => {
      if (p.id === propertyId) {
        found = true;
        return {
          ...p,
          isVerified,
          metadata: {
            ...p.metadata,
            verified: isVerified,
            verifiedBy,
            verificationDate: new Date().toISOString(),
            locatorStatus: locatorStatus || (isVerified ? 'APPROVED' : 'REJECTED')
          }
        };
      }
      return p;
    });

    if (found) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_KEY));
      
      // Update Supabase if connected
      if (supabase) {
        (async () => {
          try {
            await supabase
              .from('properties')
              .update({ is_verified: isVerified, status: isVerified ? 'APPROVED' : 'REJECTED' })
              .eq('id', propertyId);
          } catch (_) {}
        })();
      }
      return true;
    }
  } catch (e) {
    console.error('Error updating property verification:', e);
  }
  return false;
}

