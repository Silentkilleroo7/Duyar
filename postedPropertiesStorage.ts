import { Property } from './types';

export const POSTED_PROPERTIES_STORAGE_KEY = 'duyar_posted_properties_v2';
export const PROPERTY_POSTED_EVENT = 'duyar_property_posted';

// Fresh live environment: zero mock posted properties
export const INITIAL_PROPERTIES: Property[] = [];

export function getPostedProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(POSTED_PROPERTIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading posted properties from localStorage:', err);
    return [];
  }
}

export function savePostedProperties(properties: Property[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(POSTED_PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
  } catch (err) {
    console.error('Error saving posted properties to localStorage:', err);
  }
}

export function addPostedProperty(propertyData: Partial<Property>): Property {
  const current = getPostedProperties();
  const id = propertyData.id || `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  const newProp: Property = {
    id,
    title: propertyData.title || 'Dhaka Property',
    price: propertyData.price || '৳ 25,000 / mo',
    location: propertyData.location || 'Dhaka, Bangladesh',
    beds: propertyData.beds ?? 2,
    baths: propertyData.baths ?? 2,
    sqft: propertyData.sqft ?? 1200,
    image: propertyData.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    images: (propertyData as any).images || [propertyData.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'],
    tag: propertyData.tag || 'FOR RENT',
    type: propertyData.type || 'Family',
    lat: propertyData.lat ?? 23.8103,
    lng: propertyData.lng ?? 90.4125,
    isVerified: true,
    isFeatured: Boolean(propertyData.isFeatured),
    availableMonth: propertyData.availableMonth || 'Immediate',
    amenities: propertyData.amenities || ['Parking', 'Elevator', 'Security Guard'],
    metadata: {
      verified: true,
      category: propertyData.type || 'Family',
      mode: propertyData.tag === 'FOR SALE' ? 'SALE' : 'RENT',
      justPosted: true,
      postedAt: new Date().toISOString(),
      ...(propertyData.metadata || {})
    }
  };

  const updated = [newProp, ...current];
  savePostedProperties(updated);

  if (typeof window !== 'undefined') {
    // Store latest posted property ID for instant focus
    try {
      localStorage.setItem('duyar_latest_posted_id', newProp.id);
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent(PROPERTY_POSTED_EVENT, {
        detail: { property: newProp, allProperties: updated }
      })
    );
  }

  return newProp;
}

export function getLatestPostedProperty(): Property | null {
  if (typeof window === 'undefined') return null;
  try {
    const latestId = localStorage.getItem('duyar_latest_posted_id');
    const all = getPostedProperties();
    if (latestId) {
      const found = all.find(p => p.id === latestId);
      if (found) return found;
    }
    return all[0] || null;
  } catch (e) {
    return null;
  }
}

export function subscribeToPostedProperties(
  callback: (payload: { property?: Property; allProperties: Property[] }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback({ allProperties: getPostedProperties() });
    }
  };

  window.addEventListener(PROPERTY_POSTED_EVENT, handler);
  return () => {
    window.removeEventListener(PROPERTY_POSTED_EVENT, handler);
  };
}
