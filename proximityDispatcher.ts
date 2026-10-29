import { getDistanceInMeters, PREDEFINED_AREAS } from './areaData';
import { getStoredApplications, ProviderRoleKey } from './providerApplicationsStorage';

export type ServiceSuperCategory = 'Maintenance' | 'Maid & Housekeeping' | 'Pick & Drop' | 'Security & CCTV';

export interface RankedProvider {
  id: string;
  name: string;
  role: string;
  category: ServiceSuperCategory;
  subCategory: string;
  phone: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  area: string;
  address: string;
  lat: number;
  lng: number;
  priceRate: string;
  avatar: string;
  isOnline: boolean;
  badge: 'TOP_PRIORITY_NEAREST' | 'VERIFIED_SPECIALIST' | 'EXPRESS_DISPATCH' | 'COMMUNITY_FAVORITE';
  distanceMeters: number;
  distanceKm: number;
  etaMinutes: number;
  priorityRank: number; // 1 = Nearest / Top Priority
  priorityTier: 'TOP_PRIORITY_LOCAL' | 'EXPANDED_NEARBY' | 'METRO_EXTENDED';
  verifiedSince: string;
}

export interface ProximitySearchResult {
  userLocation: {
    area: string;
    address: string;
    lat: number;
    lng: number;
  };
  currentRadiusKm: number;
  topPriorityNearest: RankedProvider | null;
  providersWithinRadius: RankedProvider[];
  allProvidersSorted: RankedProvider[];
  canExpand: boolean;
  nextRadiusKm: number;
  totalNearbyCount: number;
  totalCityCount: number;
}

// Known coordinates for Dhaka neighborhoods
export const DHAKA_AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  banani: { lat: 23.7937, lng: 90.4066 },
  gulshan: { lat: 23.7925, lng: 90.4152 },
  'gulshan-1': { lat: 23.7785, lng: 90.4172 },
  'gulshan-2': { lat: 23.7925, lng: 90.4152 },
  baridhara: { lat: 23.7998, lng: 90.4208 },
  'baridhara dohs': { lat: 23.8048, lng: 90.4168 },
  mohakhali: { lat: 23.7776, lng: 90.4054 },
  'mohakhali dohs': { lat: 23.7824, lng: 90.3958 },
  bashundhara: { lat: 23.8151, lng: 90.4255 },
  'bashundhara r/a': { lat: 23.8151, lng: 90.4255 },
  badda: { lat: 23.7806, lng: 90.4267 },
  dhanmondi: { lat: 23.7461, lng: 90.3742 },
  mirpur: { lat: 23.8069, lng: 90.3685 },
  'mirpur-1': { lat: 23.7956, lng: 90.3537 },
  'mirpur-2': { lat: 23.8038, lng: 90.3614 },
  'mirpur-10': { lat: 23.8069, lng: 90.3685 },
  'mirpur-11': { lat: 23.8192, lng: 90.3668 },
  'mirpur-12': { lat: 23.8276, lng: 90.3639 },
  mohammadpur: { lat: 23.7658, lng: 90.3584 },
  uttara: { lat: 23.8759, lng: 90.3795 },
  'uttara sector 3': { lat: 23.8682, lng: 90.3995 },
  'uttara sector 7': { lat: 23.8732, lng: 90.3965 },
  'uttara sector 11': { lat: 23.8795, lng: 90.3852 },
  nikunja: { lat: 23.8242, lng: 90.4172 },
  khilkhet: { lat: 23.8315, lng: 90.4192 },
  rampura: { lat: 23.7618, lng: 90.4215 },
  malibagh: { lat: 23.7495, lng: 90.4115 },
  tejgaon: { lat: 23.7598, lng: 90.3912 },
  shahbagh: { lat: 23.7381, lng: 90.3957 },
  motijheel: { lat: 23.7329, lng: 90.4172 }
};

/**
 * Resolves latitude and longitude for a given area text or address
 */
export function getAreaCoordinates(areaText: string): { lat: number; lng: number } {
  if (!areaText) return { lat: 23.7937, lng: 90.4066 }; // Default Banani
  const clean = areaText.toLowerCase().trim();

  for (const [key, coords] of Object.entries(DHAKA_AREA_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }

  // Predefined areas match
  const matchedPredefined = PREDEFINED_AREAS.find(a => 
    clean.includes(a.name.toLowerCase()) || 
    clean.includes(a.id.toLowerCase())
  );
  if (matchedPredefined) {
    return { lat: matchedPredefined.lat, lng: matchedPredefined.lng };
  }

  return { lat: 23.7937, lng: 90.4066 }; // Central fallback
}

// Baseline network of verified service providers distributed across Dhaka
export const SEED_SERVICE_PROVIDERS: Omit<RankedProvider, 'distanceMeters' | 'distanceKm' | 'etaMinutes' | 'priorityRank' | 'priorityTier'>[] = [];

/**
 * Get all available providers, combining default seed list and approved applicant providers from storage
 */
export function getAllServiceProviders(): typeof SEED_SERVICE_PROVIDERS {
  const base = [...SEED_SERVICE_PROVIDERS];

  try {
    const apps = getStoredApplications();
    const roleMap: Record<ProviderRoleKey, ServiceSuperCategory> = {
      Maintenance: 'Maintenance',
      Maids: 'Maid & Housekeeping',
      PickDrop: 'Pick & Drop',
      Security: 'Security & CCTV',
      Landlords: 'Maintenance',
      Locators: 'Maintenance',
      Ads: 'Maintenance'
    };

    (['Maintenance', 'Maids', 'PickDrop', 'Security'] as ProviderRoleKey[]).forEach(roleKey => {
      const list = apps[roleKey] || [];
      list.filter(a => a.status === 'APPROVED').forEach(app => {
        const areaName = app.propertyAddress || app.details || 'Banani, Dhaka';
        const coords = getAreaCoordinates(areaName);
        base.push({
          id: `app-prov-${app.id}`,
          name: app.name,
          role: `${app.role} • Approved Specialist`,
          category: roleMap[roleKey],
          subCategory: app.role || 'Specialist',
          phone: app.applicantPhone,
          rating: 4.9,
          reviewCount: 38,
          jobsCompleted: 64,
          area: areaName,
          address: app.propertyAddress || areaName,
          lat: coords.lat,
          lng: coords.lng,
          priceRate: 'Standard Rate',
          avatar: app.img || '',
          isOnline: true,
          badge: 'VERIFIED_SPECIALIST',
          verifiedSince: '2024'
        });
      });
    });
  } catch (e) {
    console.debug('Approved apps ingestion note:', e);
  }

  return base;
}

/**
 * Calculate distance in km between two lat/lng pairs
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const meters = getDistanceInMeters(lat1, lon1, lat2, lon2);
  return Number((meters / 1000).toFixed(2));
}

/**
 * Calculate arrival estimate in minutes based on urban traffic distance
 */
export function estimateArrivalMinutes(distanceKm: number): number {
  if (distanceKm <= 0.8) return 8;
  if (distanceKm <= 1.5) return 12;
  if (distanceKm <= 2.5) return 18;
  if (distanceKm <= 4.0) return 25;
  if (distanceKm <= 7.0) return 35;
  return Math.min(60, Math.round(distanceKm * 6));
}

/**
 * The Core Proximity Dispatch Engine:
 * 1. Matches user coordinates
 * 2. Filters providers by service category & subCategory
 * 3. Calculates exact distance & ETA
 * 4. Ranks providers strictly with closest on top priority (Rank 1 = Nearest)
 * 5. Partitions into initial radius (default 2.0 km), expanded (5.0 km), and metro (15.0 km)
 */
export function searchNearestProviders(options: {
  userArea: string;
  userAddress?: string;
  userLat?: number;
  userLng?: number;
  category: string;
  subCategory?: string;
  radiusKm?: number;
}): ProximitySearchResult {
  const { userArea, userAddress = '', category, subCategory = '', radiusKm = 2.0 } = options;
  
  // Resolve user coords
  let userCoords: { lat: number; lng: number };
  if (options.userLat && options.userLng) {
    userCoords = { lat: options.userLat, lng: options.userLng };
  } else {
    userCoords = getAreaCoordinates(userArea || userAddress);
  }

  const allProviders = getAllServiceProviders();
  const catLower = category.toLowerCase();
  const subLower = subCategory.toLowerCase();

  // Filter matching category
  const filtered = allProviders.filter(p => {
    const pCatLower = p.category.toLowerCase();
    const pSubLower = p.subCategory.toLowerCase();
    const pRoleLower = p.role.toLowerCase();

    // Maintenance match
    if (catLower.includes('maint') || catLower.includes('elec') || catLower.includes('plumb') || catLower.includes('appliance') || catLower.includes('ac')) {
      if (p.category !== 'Maintenance') return false;
      if (subLower) {
        if (subLower.includes('elec') && !pSubLower.includes('elec') && !pRoleLower.includes('elec')) return false;
        if (subLower.includes('plumb') && !pSubLower.includes('plumb') && !pRoleLower.includes('plumb')) return false;
        if ((subLower.includes('ac') || subLower.includes('appliance')) && !pSubLower.includes('ac') && !pSubLower.includes('appliance')) return false;
      }
      return true;
    }

    // Maid match
    if (catLower.includes('maid') || catLower.includes('clean') || catLower.includes('housekeep')) {
      return p.category === 'Maid & Housekeeping';
    }

    // Pick & Drop match
    if (catLower.includes('pick') || catLower.includes('drop') || catLower.includes('move') || catLower.includes('truck')) {
      return p.category === 'Pick & Drop';
    }

    // Security match
    if (catLower.includes('sec') || catLower.includes('guard') || catLower.includes('cctv')) {
      return p.category === 'Security & CCTV';
    }

    // Fallback: match by title / general category
    return pCatLower.includes(catLower) || catLower.includes(pCatLower);
  });

  // Calculate distance & rank
  const rankedAll: RankedProvider[] = filtered.map(p => {
    const distM = getDistanceInMeters(userCoords.lat, userCoords.lng, p.lat, p.lng);
    const distKm = Number((distM / 1000).toFixed(2));
    const eta = estimateArrivalMinutes(distKm);

    let priorityTier: RankedProvider['priorityTier'] = 'METRO_EXTENDED';
    if (distKm <= 2.0) {
      priorityTier = 'TOP_PRIORITY_LOCAL';
    } else if (distKm <= 5.0) {
      priorityTier = 'EXPANDED_NEARBY';
    }

    return {
      ...p,
      distanceMeters: Math.round(distM),
      distanceKm: distKm,
      etaMinutes: eta,
      priorityRank: 0, // Assigned below after sort
      priorityTier
    };
  });

  // Sort strictly with closest first
  rankedAll.sort((a, b) => a.distanceKm - b.distanceKm);

  // Assign ranks
  rankedAll.forEach((p, idx) => {
    p.priorityRank = idx + 1;
    if (idx === 0) {
      p.badge = 'TOP_PRIORITY_NEAREST';
    }
  });

  // Filter within current requested radius
  const providersWithinRadius = rankedAll.filter(p => p.distanceKm <= radiusKm);

  // Determine expansion steps: 2.0 -> 5.0 -> 10.0 -> 18.0
  let nextRadiusKm = radiusKm;
  let canExpand = false;
  if (radiusKm < 5.0) {
    nextRadiusKm = 5.0;
    canExpand = true;
  } else if (radiusKm < 10.0) {
    nextRadiusKm = 10.0;
    canExpand = true;
  } else if (radiusKm < 18.0) {
    nextRadiusKm = 18.0;
    canExpand = true;
  } else {
    canExpand = false;
  }

  // Top priority nearest provider is the absolute closest provider
  const topPriorityNearest = rankedAll.length > 0 ? rankedAll[0] : null;

  return {
    userLocation: {
      area: userArea || 'Banani, Dhaka',
      address: userAddress || userArea || 'Banani',
      lat: userCoords.lat,
      lng: userCoords.lng
    },
    currentRadiusKm: radiusKm,
    topPriorityNearest,
    providersWithinRadius,
    allProvidersSorted: rankedAll,
    canExpand,
    nextRadiusKm,
    totalNearbyCount: providersWithinRadius.length,
    totalCityCount: rankedAll.length
  };
}

/**
 * Stepped radius expansion utility
 */
export function getNextRadius(currentKm: number): number {
  if (currentKm < 3.0) return 5.0;
  if (currentKm < 7.0) return 10.0;
  if (currentKm < 12.0) return 18.0;
  return 25.0;
}
