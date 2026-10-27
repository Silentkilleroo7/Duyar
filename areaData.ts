import { Property } from './types';

export interface AreaZone {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  tag: string;
  description: string;
}

// Predefined top areas in Dhaka for geographic search & radius focus
export const PREDEFINED_AREAS: AreaZone[] = [
  {
    id: 'banani',
    name: 'Banani',
    displayName: 'Banani, Dhaka',
    lat: 23.7937,
    lng: 90.4066,
    radius: 900,
    tag: 'Upscale & Commercial',
    description: 'Premier residential & lifestyle hub with luxury flats and modern penthouses.'
  },
  {
    id: 'gulshan',
    name: 'Gulshan',
    displayName: 'Gulshan 1 & 2, Dhaka',
    lat: 23.7925,
    lng: 90.4152,
    radius: 1200,
    tag: 'Diplomatic & Luxury',
    description: 'Elite diplomatic district featuring top-tier duplexes, lake views, and security.'
  },
  {
    id: 'dhanmondi',
    name: 'Dhanmondi',
    displayName: 'Dhanmondi, Dhaka',
    lat: 23.7461,
    lng: 90.3742,
    radius: 1100,
    tag: 'Culture & Greenery',
    description: 'Vibrant cultural neighborhood near Dhanmondi Lake with spacious family flats.'
  },
  {
    id: 'mirpur',
    name: 'Mirpur',
    displayName: 'Mirpur (1-14), Dhaka',
    lat: 23.8069,
    lng: 90.3685,
    radius: 1400,
    tag: 'Metro Connected',
    description: 'Well-connected urban zone with great metro access and affordable family flats.'
  },
  {
    id: 'uttara',
    name: 'Uttara',
    displayName: 'Uttara Model Town, Dhaka',
    lat: 23.8759,
    lng: 90.3795,
    radius: 1500,
    tag: 'Airport Corridor',
    description: 'Planned modern township with wide avenues, parks, and quiet residential sectors.'
  },
  {
    id: 'bashundhara',
    name: 'Bashundhara R/A',
    displayName: 'Bashundhara R/A, Dhaka',
    lat: 23.8151,
    lng: 90.4255,
    radius: 1300,
    tag: 'Gated Community',
    description: 'Spacious, secure gated residential area with university hubs and new apartments.'
  },
  {
    id: 'mohakhali',
    name: 'Mohakhali',
    displayName: 'Mohakhali & DOHS, Dhaka',
    lat: 23.7776,
    lng: 90.4054,
    radius: 1000,
    tag: 'Central Commercial',
    description: 'Centrally positioned near corporate headquarters and peaceful DOHS sectors.'
  },
  {
    id: 'mohammadpur',
    name: 'Mohammadpur',
    displayName: 'Mohammadpur, Dhaka',
    lat: 23.7658,
    lng: 90.3584,
    radius: 1100,
    tag: 'Family Community',
    description: 'Bustling community with diverse food spots, schools, and family condominiums.'
  },
  {
    id: 'badda',
    name: 'Badda',
    displayName: 'Badda & Hatirjheel, Dhaka',
    lat: 23.7806,
    lng: 90.4267,
    radius: 950,
    tag: 'Lake Corridor',
    description: 'Rapidly developing lakeside area with quick access to Gulshan and Rampura.'
  },
  {
    id: 'baridhara',
    name: 'Baridhara',
    displayName: 'Baridhara Diplomatic Zone, Dhaka',
    lat: 23.7998,
    lng: 90.4208,
    radius: 850,
    tag: 'High Security',
    description: 'Exclusive enclave renowned for serene tree-lined streets and high security.'
  }
];

// Empty curated map for live production — real listings come directly from Supabase database
export const CURATED_AREA_PROPERTIES: Record<string, Property[]> = {};

// Haversine formula to compute distance in meters between two lat/lng coordinates
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Live mode: returns empty array if no live database properties exist in area
export function generateDynamicAreaProperties(
  areaName: string,
  centerLat: number,
  centerLng: number
): Property[] {
  return [];
}

// Find matching predefined area or find closest
export function matchPredefinedArea(query: string): AreaZone | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  return (
    PREDEFINED_AREAS.find(
      (a) =>
        a.name.toLowerCase() === clean ||
        a.id.toLowerCase() === clean ||
        clean.includes(a.name.toLowerCase()) ||
        a.displayName.toLowerCase().includes(clean)
    ) || null
  );
}

// Get all properties matching an area from the live Supabase properties
export function getAreaProperties(area: AreaZone, dbProperties: any[] = []): Property[] {
  return dbProperties.filter((p) => {
    if (!p) return false;
    if (p.location && p.location.toLowerCase().includes(area.name.toLowerCase())) return true;
    if (p.lat && p.lng) {
      const dist = getDistanceInMeters(area.lat, area.lng, p.lat, p.lng);
      return dist <= (area.radius + 300);
    }
    return false;
  });
}
