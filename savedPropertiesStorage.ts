import { supabase } from './supabase';
import { Property } from './types';

export interface SavedPropertyItem {
  id: string;
  propertyId: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft?: number;
  image: string;
  tag: 'RENT' | 'SALE';
  savedAt: string;
  availableMonth?: string;
}

const STORAGE_KEY = 'duyar_saved_properties_v2';
const EVENT_NAME = 'duyar_saved_properties_changed';

// Initial seed saved properties matching the app's listings
const SEED_SAVED_PROPERTIES: SavedPropertyItem[] = [];

export function getStoredSavedProperties(): SavedPropertyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SAVED_PROPERTIES));
      return SEED_SAVED_PROPERTIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return SEED_SAVED_PROPERTIES;
  } catch (err) {
    console.error("Error reading saved properties:", err);
    return SEED_SAVED_PROPERTIES;
  }
}

export function saveStoredProperties(items: SavedPropertyItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { items } }));
    }
  } catch (err) {
    console.error("Error saving properties to localStorage:", err);
  }
}

export function isPropertySaved(propertyId?: string, title?: string): boolean {
  if (!propertyId && !title) return false;
  const items = getStoredSavedProperties();
  return items.some(item => {
    if (propertyId && (item.propertyId === String(propertyId) || item.id === String(propertyId))) {
      return true;
    }
    if (title && item.title.trim().toLowerCase() === title.trim().toLowerCase()) {
      return true;
    }
    return false;
  });
}

function normalizeTag(tag?: string): 'RENT' | 'SALE' {
  if (!tag) return 'RENT';
  const lower = tag.toLowerCase();
  if (lower.includes('sale') || lower.includes('buy') || lower.includes('বিক্রি')) {
    return 'SALE';
  }
  return 'RENT';
}

export async function toggleSaveProperty(
  property: any, 
  userPhone?: string
): Promise<{ isSaved: boolean; item: SavedPropertyItem | null }> {
  const currentItems = getStoredSavedProperties();
  const propId = property?.id ? String(property.id) : `prop-${Date.now()}`;
  const title = property?.title || "Modern Flat";

  const existingIndex = currentItems.findIndex(item => 
    (item.propertyId && item.propertyId === propId) || 
    (item.id && item.id === propId) || 
    (item.title.trim().toLowerCase() === title.trim().toLowerCase())
  );

  let isSaved = false;
  let resultItem: SavedPropertyItem | null = null;

  if (existingIndex >= 0) {
    // Remove from saved
    const removedItem = currentItems[existingIndex];
    currentItems.splice(existingIndex, 1);
    saveStoredProperties(currentItems);
    isSaved = false;
    resultItem = null;

    // Asynchronously remove from Supabase if table exists
    try {
      if (supabase) {
        Promise.resolve(
          supabase
            .from('saved_properties')
            .delete()
            .or(`property_id.eq.${removedItem.propertyId},id.eq.${removedItem.id}`)
        ).then(({ error }: any) => {
          if (error) {
            console.warn("Supabase delete saved_properties warning (using local persistence):", error.message);
          }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.warn("Supabase request failed:", dbErr);
    }
  } else {
    // Add to saved
    const newItem: SavedPropertyItem = {
      id: `fav-${Date.now()}`,
      propertyId: propId,
      title: title,
      price: property?.price || "৳ 45,000",
      location: property?.location || property?.loc || "Dhaka, Bangladesh",
      beds: Number(property?.beds) || 3,
      baths: Number(property?.baths) || 2,
      sqft: Number(property?.sqft) || 1500,
      image: property?.image || property?.img || "https://lh3.googleusercontent.com/aida-public/AB6AXuDfOmiokSYUBoIBV4Q5qSDBSgxAoBCbZd_B2x1rYjOecezRauBO2EqLwSAxE6rNMlbhSnVIxE4dzUkdH6NRKfUKgYaSwy8JSSONyOQ_jZ_OKTNuKK6r4LVg1i4LUSgqMS7M2BGTkW9M8qPx122cW87ZVt-MMyYTGAn3xqJ6Mfy0G7GvnjUZPVVCrjFVtKf6ITEqVbB3TsGF2n-6e8ZIEW0Yp9VAqYn9agAC51wY2X8iMEQ1B2cuAaddVvz_dl9V6DTcEILS58B_Ue0",
      tag: normalizeTag(property?.tag || property?.type),
      savedAt: new Date().toISOString(),
      availableMonth: property?.availableMonth || 'This Month'
    };

    currentItems.unshift(newItem);
    saveStoredProperties(currentItems);
    isSaved = true;
    resultItem = newItem;

    // Asynchronously insert/upsert into Supabase if table exists
    try {
      if (supabase) {
        Promise.resolve(
          supabase
            .from('saved_properties')
            .upsert([{
              id: newItem.id,
              property_id: newItem.propertyId,
              title: newItem.title,
              price: newItem.price,
              location: newItem.location,
              beds: newItem.beds,
              baths: newItem.baths,
              sqft: newItem.sqft,
              image_url: newItem.image,
              tag: newItem.tag,
              saved_at: newItem.savedAt,
              user_phone: userPhone || null
            }])
        ).then(({ error }: any) => {
          if (error) {
            console.warn("Supabase upsert saved_properties warning (saved locally):", error.message);
          }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.warn("Supabase request failed:", dbErr);
    }
  }

  return { isSaved, item: resultItem };
}

export async function removeSavedProperty(identifier: string): Promise<boolean> {
  const currentItems = getStoredSavedProperties();
  const filtered = currentItems.filter(item => 
    item.id !== identifier && item.propertyId !== identifier
  );

  if (filtered.length !== currentItems.length) {
    saveStoredProperties(filtered);

    try {
      if (supabase) {
        Promise.resolve(
          supabase
            .from('saved_properties')
            .delete()
            .or(`property_id.eq.${identifier},id.eq.${identifier}`)
        ).then(() => {}).catch(() => {});
      }
    } catch (e) {}

    return true;
  }
  return false;
}

export function subscribeToSavedProperties(callback: (items: SavedPropertyItem[]) => void): () => void {
  const handler = () => {
    callback(getStoredSavedProperties());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    }
  };
}

export async function syncSavedPropertiesFromSupabase(userPhone?: string): Promise<SavedPropertyItem[]> {
  try {
    if (!supabase) return getStoredSavedProperties();

    let query = supabase.from('saved_properties').select('*');
    if (userPhone) {
      query = query.or(`user_phone.eq.${userPhone},user_phone.is.null`);
    }

    const { data, error } = await query.order('saved_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getStoredSavedProperties();
    }

    const remoteItems: SavedPropertyItem[] = data.map((d: any) => ({
      id: d.id || `fav-${d.property_id || Math.random()}`,
      propertyId: String(d.property_id || d.id),
      title: d.title || 'Property',
      price: d.price || '৳ 45,000',
      location: d.location || 'Dhaka',
      beds: Number(d.beds) || 3,
      baths: Number(d.baths) || 2,
      sqft: Number(d.sqft) || 1500,
      image: d.image_url || d.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfOmiokSYUBoIBV4Q5qSDBSgxAoBCbZd_B2x1rYjOecezRauBO2EqLwSAxE6rNMlbhSnVIxE4dzUkdH6NRKfUKgYaSwy8JSSONyOQ_jZ_OKTNuKK6r4LVg1i4LUSgqMS7M2BGTkW9M8qPx122cW87ZVt-MMyYTGAn3xqJ6Mfy0G7GvnjUZPVVCrjFVtKf6ITEqVbB3TsGF2n-6e8ZIEW0Yp9VAqYn9agAC51wY2X8iMEQ1B2cuAaddVvz_dl9V6DTcEILS58B_Ue0',
      tag: normalizeTag(d.tag),
      savedAt: d.saved_at || new Date().toISOString()
    }));

    // Merge remote with local so no items are lost
    const local = getStoredSavedProperties();
    const map = new Map<string, SavedPropertyItem>();

    local.forEach(item => map.set(item.propertyId || item.id, item));
    remoteItems.forEach(item => map.set(item.propertyId || item.id, item));

    const merged = Array.from(map.values());
    saveStoredProperties(merged);
    return merged;
  } catch (err) {
    console.warn("Could not sync with Supabase saved_properties table:", err);
    return getStoredSavedProperties();
  }
}
