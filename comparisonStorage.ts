import { Property } from './types';

export interface ComparisonProperty {
  id: string;
  propertyId: string;
  title: string;
  price: string;
  numericPrice?: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  tag?: string;
  type?: string;
  tags?: string[];
  availableMonth?: string;
  distance?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  addedAt: string;
}

const STORAGE_KEY = 'duyar_comparison_list_v1';
const EVENT_NAME = 'duyar_comparison_changed';

// Initial seed matching the app's top Banani / Gulshan rental properties
const DEFAULT_SEED_PROPERTIES: ComparisonProperty[] = [];

export function parseNumericPrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.toLowerCase().replace(/,/g, '').trim();
  const matchK = cleaned.match(/([0-9.]+)\s*k/);
  if (matchK) {
    return parseFloat(matchK[1]) * 1000;
  }
  const digits = cleaned.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(digits);
  return isNaN(parsed) ? 0 : parsed;
}

export function getComparisonList(): ComparisonProperty[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First-time seed
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_PROPERTIES));
      return [...DEFAULT_SEED_PROPERTIES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse comparison list from localStorage:', err);
    return [];
  }
}

function saveComparisonList(items: ComparisonProperty[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
  } catch (err) {
    console.error('Failed to save comparison list to localStorage:', err);
  }
}

export function isInCompare(propertyId: string | number | undefined): boolean {
  if (!propertyId) return false;
  const list = getComparisonList();
  const idStr = String(propertyId);
  return list.some(item => 
    String(item.propertyId) === idStr || 
    String(item.id) === idStr || 
    String(item.id) === `comp-${idStr}`
  );
}

export function addToCompare(property: Property | any): { success: boolean; reason?: string; list: ComparisonProperty[] } {
  const currentList = getComparisonList();
  const propId = String(property.id || Date.now());

  if (isInCompare(propId)) {
    return { success: false, reason: 'Property is already in your comparison list', list: currentList };
  }

  if (currentList.length >= 4) {
    return { success: false, reason: 'You can compare up to 4 properties side-by-side', list: currentList };
  }

  const numericPrice = property.numericPrice || parseNumericPrice(property.price);

  // Collect all amenities/tags
  const extractedTags = Array.isArray(property.tags) && property.tags.length > 0
    ? property.tags
    : (Array.isArray(property.amenities) && property.amenities.length > 0 
        ? property.amenities 
        : ['Balcony', 'Parking', 'Elevator', 'Security Guard', 'Generator', 'CCTV']);

  const newItem: ComparisonProperty = {
    id: `comp-${propId}`,
    propertyId: propId,
    title: property.title || 'Modern Apartment',
    price: property.price || '৳ 45,000',
    numericPrice: numericPrice || 45000,
    location: property.location || 'Banani, Dhaka',
    beds: Number(property.beds) || 3,
    baths: Number(property.baths) || 3,
    sqft: Number(property.sqft) || 1650,
    image: property.image || property.images?.[0] || '',
    tag: property.tag || 'FOR RENT',
    type: property.type || 'Flat',
    tags: extractedTags,
    availableMonth: property.availableMonth || property.availableDate || 'Available Now',
    distance: property.distance || property.dynamicDistance || 2.4,
    isVerified: Boolean(property.isVerified || property.metadata?.verified),
    isFeatured: Boolean(property.isFeatured || property.metadata?.featured),
    addedAt: new Date().toISOString()
  };

  const updatedList = [...currentList, newItem];
  saveComparisonList(updatedList);
  return { success: true, list: updatedList };
}

export function removeFromCompare(propertyId: string): ComparisonProperty[] {
  const currentList = getComparisonList();
  const targetId = String(propertyId);
  const updatedList = currentList.filter(item => String(item.propertyId) !== targetId && String(item.id) !== targetId);
  saveComparisonList(updatedList);
  return updatedList;
}

export function toggleCompareProperty(property: Property | any): { added: boolean; reason?: string; list: ComparisonProperty[] } {
  const propId = String(property.id);
  if (isInCompare(propId)) {
    const updated = removeFromCompare(propId);
    return { added: false, list: updated };
  } else {
    const res = addToCompare(property);
    return { added: res.success, reason: res.reason, list: res.list };
  }
}

export function clearCompareList(): void {
  saveComparisonList([]);
}

export function resetComparisonToDefault(): ComparisonProperty[] {
  saveComparisonList(DEFAULT_SEED_PROPERTIES);
  return [...DEFAULT_SEED_PROPERTIES];
}

export function subscribeToComparison(callback: (list: ComparisonProperty[]) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ComparisonProperty[]>;
    callback(customEvent.detail || getComparisonList());
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getComparisonList());
    }
  });

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
