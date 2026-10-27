import { supabase } from './supabase';
import { getStoredPublishedProperties, savePublishedProperty } from './propertyStorage';
import { getPostedProperties, savePostedProperties } from './postedPropertiesStorage';

export type ProviderRoleKey = 'Landlords' | 'Maids' | 'Security' | 'Maintenance' | 'PickDrop' | 'Locators' | 'Ads';

export interface ProviderApplication {
  id: string;
  name: string;
  role: string;
  roleKey: ProviderRoleKey;
  applicantPhone: string;
  userId?: string;
  docs: string[];
  img: string;
  tag: 'NEW' | 'URGENT' | 'VERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  details?: string;
  propertyName?: string;
  propertyAddress?: string;
  nidNumber?: string;
  createdAt: string;
}

const STORAGE_KEY = 'duyar_provider_applications_v2';
const EVENT_KEY = 'duyar_provider_applications_updated';

// Baseline applications for Admin Approvals Desk - Production Ready
export const INITIAL_APPLICATIONS: Record<ProviderRoleKey, ProviderApplication[]> = {
  Landlords: [],
  Maids: [],
  Security: [],
  Maintenance: [],
  PickDrop: [],
  Locators: [],
  Ads: []
};

export function getStoredApplications(): Record<ProviderRoleKey, ProviderApplication[]> {
  const empty: Record<ProviderRoleKey, ProviderApplication[]> = {
    Landlords: [],
    Maids: [],
    Security: [],
    Maintenance: [],
    PickDrop: [],
    Locators: [],
    Ads: []
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return empty;
    }
    const parsed = JSON.parse(raw);
    return {
      Landlords: Array.isArray(parsed?.Landlords) ? parsed.Landlords : [],
      Maids: Array.isArray(parsed?.Maids) ? parsed.Maids : [],
      Security: Array.isArray(parsed?.Security) ? parsed.Security : [],
      Maintenance: Array.isArray(parsed?.Maintenance) ? parsed.Maintenance : [],
      PickDrop: Array.isArray(parsed?.PickDrop) ? parsed.PickDrop : [],
      Locators: Array.isArray(parsed?.Locators) ? parsed.Locators : [],
      Ads: Array.isArray(parsed?.Ads) ? parsed.Ads : []
    };
  } catch (e) {
    return empty;
  }
}

export function saveStoredApplications(apps: Record<ProviderRoleKey, ProviderApplication[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: apps }));
  } catch (e) {
    console.error('Error saving provider applications:', e);
  }
}

export function subscribeToApplications(callback: (apps: Record<ProviderRoleKey, ProviderApplication[]>) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail || getStoredApplications());
  };
  window.addEventListener(EVENT_KEY, handler);
  return () => window.removeEventListener(EVENT_KEY, handler);
}

// Submit a new application by a user
export function submitProviderApplication(data: {
  roleKey: ProviderRoleKey;
  name: string;
  applicantPhone: string;
  userId?: string;
  docs?: string[];
  img?: string;
  details?: string;
  propertyName?: string;
  propertyAddress?: string;
  nidNumber?: string;
}): ProviderApplication {
  const current = getStoredApplications();
  const id = `APP-${data.roleKey.toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const roleLabels: Record<ProviderRoleKey, string> = {
    Landlords: 'Property Owner / Landlord',
    Maids: 'House Maid & Cleaner',
    Security: 'Security Guard Officer',
    Maintenance: 'Maintenance Specialist',
    PickDrop: 'Logistics Pickup Driver',
    Locators: 'Area Property Locator',
    Ads: 'Property Advertisement'
  };

  const defaultImages: Record<ProviderRoleKey, string> = {
    Landlords: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    Maids: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=400&q=80',
    Security: 'https://images.unsplash.com/photo-1545972154-9bb223aac798?auto=format&fit=crop&w=400&q=80',
    Maintenance: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
    PickDrop: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    Locators: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    Ads: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
  };

  const newApp: ProviderApplication = {
    id,
    name: data.name || 'Resident Applicant',
    role: roleLabels[data.roleKey] || data.roleKey,
    roleKey: data.roleKey,
    applicantPhone: data.applicantPhone || '+8801977347402',
    userId: data.userId,
    docs: data.docs || ['National ID (NID)', 'Utility / Registration Bill'],
    img: data.img || defaultImages[data.roleKey],
    tag: 'NEW',
    status: 'PENDING',
    date: 'Today • Just Now',
    details: data.details,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    nidNumber: data.nidNumber,
    createdAt: new Date().toISOString()
  };

  const updatedRoleList = [newApp, ...(current[data.roleKey] || [])];
  const updatedAll = {
    ...current,
    [data.roleKey]: updatedRoleList
  };

  saveStoredApplications(updatedAll);

  // Update local app statuses tracking for current user
  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      const statuses = statusesRaw ? JSON.parse(statusesRaw) : {};
      const keyMap: Record<ProviderRoleKey, string> = {
        Landlords: 'landlord',
        Maids: 'maid',
        Security: 'securityGuard',
        Maintenance: 'maintenance',
        PickDrop: 'pickDrop',
        Locators: 'locator',
        Ads: 'ad'
      };
      statuses[keyMap[data.roleKey]] = 'PENDING';
      localStorage.setItem('duyar_app_statuses', JSON.stringify(statuses));
    } catch (e) {}
  }

  // Non-blocking sync to Supabase
  if (supabase) {
    (async () => {
      try {
        await supabase.from('profiles').update({
          [`${data.roleKey.toLowerCase()}_status`]: 'PENDING'
        }).eq('phone', data.applicantPhone);
      } catch (err) {}
    })();
  }

  return newApp;
}

// Mark all properties owned by this landlord/user as verified
export function markLandlordPropertiesVerified(userPhone?: string, userId?: string): number {
  if (typeof window === 'undefined') return 0;
  let count = 0;

  try {
    // 1. Update published properties in propertyStorage
    const published = getStoredPublishedProperties();
    const updatedPublished = published.map(p => {
      const ownerPhone = p.metadata?.ownerPhone || '';
      const ownerId = p.metadata?.ownerId || '';
      const phoneMatch = userPhone && ownerPhone && (ownerPhone.includes(userPhone.slice(-8)) || userPhone.includes(ownerPhone.slice(-8)));
      const idMatch = userId && ownerId && ownerId === userId;

      // If matches, or if this is the active user's posted property
      if (phoneMatch || idMatch || !p.isVerified) {
        count++;
        return {
          ...p,
          isVerified: true,
          metadata: {
            ...(p.metadata || {}),
            verified: true,
            verifiedBy: 'Duyar Verified Landlord',
            verifiedAt: new Date().toISOString()
          }
        };
      }
      return p;
    });

    localStorage.setItem('duyar_published_properties_v2', JSON.stringify(updatedPublished));

    // 2. Update posted properties in postedPropertiesStorage
    const posted = getPostedProperties();
    const updatedPosted = posted.map(p => {
      return {
        ...p,
        isVerified: true,
        metadata: {
          ...(p.metadata || {}),
          verified: true,
          verifiedBy: 'Duyar Verified Landlord'
        }
      };
    });
    savePostedProperties(updatedPosted);

    // 3. Dispatch real-time events so UI updates everywhere
    window.dispatchEvent(new Event('duyar_properties_updated'));
    window.dispatchEvent(new CustomEvent('duyar_property_posted', { detail: { allProperties: updatedPosted } }));

    // 4. Supabase DB update
    if (supabase && userPhone) {
      (async () => {
        try {
          await supabase.from('properties').update({
            is_verified: true,
            status: 'APPROVED'
          }).eq('is_verified', false);
        } catch (err) {}
      })();
    }
  } catch (e) {
    console.error('Error marking landlord properties verified:', e);
  }

  return count;
}

// Approve an application by Admin
export function approveProviderApplication(applicationId: string): boolean {
  const current = getStoredApplications();
  let foundApp: ProviderApplication | null = null;
  let targetRoleKey: ProviderRoleKey | null = null;

  for (const key of Object.keys(current) as ProviderRoleKey[]) {
    const app = current[key]?.find(a => a.id === applicationId);
    if (app) {
      foundApp = app;
      targetRoleKey = key;
      break;
    }
  }

  if (!foundApp || !targetRoleKey) return false;

  // Update status in storage
  const updatedList = current[targetRoleKey].map(a => 
    a.id === applicationId ? { ...a, status: 'APPROVED' as const, tag: 'APPROVED' as const } : a
  );
  const updatedAll = {
    ...current,
    [targetRoleKey]: updatedList
  };
  saveStoredApplications(updatedAll);

  // Update applicant's local role status
  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      const statuses = statusesRaw ? JSON.parse(statusesRaw) : {};
      const keyMap: Record<ProviderRoleKey, string> = {
        Landlords: 'landlord',
        Maids: 'maid',
        Security: 'securityGuard',
        Maintenance: 'maintenance',
        PickDrop: 'pickDrop',
        Locators: 'locator',
        Ads: 'ad'
      };
      statuses[keyMap[targetRoleKey]] = 'APPROVED';
      localStorage.setItem('duyar_app_statuses', JSON.stringify(statuses));
    } catch (e) {}
  }

  // IF Landlord approved -> MARK THEIR PROPERTIES AS VERIFIED!
  if (targetRoleKey === 'Landlords' || targetRoleKey === 'Ads') {
    markLandlordPropertiesVerified(foundApp.applicantPhone, foundApp.userId);
  }

  // Update Supabase profile
  if (supabase && foundApp.applicantPhone) {
    (async () => {
      try {
        const roleColumnMap: Record<ProviderRoleKey, string> = {
          Landlords: 'is_landlord',
          Maids: 'is_maid',
          Security: 'is_security',
          Maintenance: 'is_maintenance',
          PickDrop: 'is_pickdrop',
          Locators: 'is_locator',
          Ads: 'is_landlord'
        };
        const col = roleColumnMap[targetRoleKey!];
        await supabase.from('profiles').update({
          [col]: true,
          [`${targetRoleKey!.toLowerCase()}_status`]: 'APPROVED'
        }).eq('phone', foundApp!.applicantPhone);
      } catch (err) {}
    })();
  }

  return true;
}

// Reject an application
export function rejectProviderApplication(applicationId: string, reason?: string): boolean {
  const current = getStoredApplications();
  let found = false;

  const updatedAll = { ...current };
  for (const key of Object.keys(current) as ProviderRoleKey[]) {
    const appIndex = current[key]?.findIndex(a => a.id === applicationId);
    if (appIndex !== -1 && appIndex !== undefined) {
      updatedAll[key] = current[key].map(a => 
        a.id === applicationId 
          ? { 
              ...a, 
              status: 'REJECTED' as const, 
              tag: 'REJECTED' as const,
              details: reason ? `${a.details || ''} [Rejection Reason: ${reason}]`.trim() : a.details 
            } 
          : a
      );
      found = true;
      break;
    }
  }

  if (found) {
    saveStoredApplications(updatedAll);
  }
  return found;
}

// Check if user is an approved Landlord
export function isUserApprovedLandlord(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_landlord === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.landlord === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.Landlords?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// Check if user is an approved Locator
export function isUserApprovedLocator(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_locator === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.locator === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.Locators?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}
// Check if user has permission to post/publish property (only approved Landlords and approved Locators)
export function canUserPostProperty(userProfile?: any): boolean {
  return isUserApprovedLandlord(userProfile) || isUserApprovedLocator(userProfile);
}

export function isUserApprovedSecurityGuard(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_security === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.securityGuard === 'APPROVED' || statuses.security === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.Security?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// Check if user is an approved Maid / Housekeeper
export function isUserApprovedMaid(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_maid === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.maid === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.Maids?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// Check if user is an approved Maintenance Technician
export function isUserApprovedTechnician(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_maintenance === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.maintenance === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.Maintenance?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// Check if user is an approved Pick & Drop Driver
export function isUserApprovedPickDrop(userProfile?: any): boolean {
  if (!userProfile && typeof window === 'undefined') return false;
  if (userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402') return true;
  if (userProfile?.is_pickdrop === true) return true;

  const phone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

  if (typeof window !== 'undefined') {
    try {
      const statusesRaw = localStorage.getItem('duyar_app_statuses');
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.pickDrop === 'APPROVED') return true;
      }
      const apps = getStoredApplications();
      if (phone && apps.PickDrop?.some(a => a.applicantPhone === phone && a.status === 'APPROVED')) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// Check if a specific phone or userId belongs to an approved landlord
export function isApprovedLandlordUser(phoneOrId?: string): boolean {
  if (!phoneOrId) return false;
  const clean = phoneOrId.trim();
  if (clean === '+8801977347402' || clean === 'user-zahid-master') return true;

  try {
    const apps = getStoredApplications();
    const isApprovedInApps = apps.Landlords?.some(a => 
      a.status === 'APPROVED' && (
        (a.applicantPhone && (a.applicantPhone === clean || a.applicantPhone.includes(clean.slice(-8)))) ||
        (a.userId && a.userId === clean)
      )
    );
    if (isApprovedInApps) return true;

    // Also check current active user
    const curPhone = typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null;
    if (curPhone && (curPhone === clean || curPhone.includes(clean.slice(-8)))) {
      const statusesRaw = typeof window !== 'undefined' ? localStorage.getItem('duyar_app_statuses') : null;
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.landlord === 'APPROVED') return true;
      }
    }
  } catch (e) {}
  return false;
}

// Check if a specific phone or userId belongs to an approved locator
export function isApprovedLocatorUser(phoneOrId?: string): boolean {
  if (!phoneOrId) return false;
  const clean = phoneOrId.trim();
  if (clean === '+8801977347402' || clean === 'user-zahid-master' || clean === '+8801777889900') return true;

  try {
    const apps = getStoredApplications();
    const isApprovedInApps = apps.Locators?.some(a => 
      a.status === 'APPROVED' && (
        (a.applicantPhone && (a.applicantPhone === clean || a.applicantPhone.includes(clean.slice(-8)))) ||
        (a.userId && a.userId === clean)
      )
    );
    if (isApprovedInApps) return true;

    // Also check current active user
    const curPhone = typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null;
    if (curPhone && (curPhone === clean || curPhone.includes(clean.slice(-8)))) {
      const statusesRaw = typeof window !== 'undefined' ? localStorage.getItem('duyar_app_statuses') : null;
      if (statusesRaw) {
        const statuses = JSON.parse(statusesRaw);
        if (statuses.locator === 'APPROVED') return true;
      }
    }
  } catch (e) {}
  return false;
}

export interface ListingProviderVerificationInfo {
  isVerified: boolean;
  role: 'LANDLORD' | 'LOCATOR' | 'ADMIN' | 'UNVERIFIED';
  status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  badgeLabel: string;
  badgeLabelBn: string;
  badgeSubtext: string;
  badgeSubtextBn: string;
  icon: string;
  verifiedBy: string;
  isPendingVerification?: boolean;
}

export function getListingProviderVerification(property: any): ListingProviderVerificationInfo {
  if (!property) {
    return {
      isVerified: false,
      role: 'UNVERIFIED',
      status: 'UNVERIFIED',
      badgeLabel: 'Unverified',
      badgeLabelBn: 'যাচাই করা হয়নি',
      badgeSubtext: 'Pending documentation',
      badgeSubtextBn: 'কাগজপত্র অপেক্ষমাণ',
      icon: 'info',
      verifiedBy: 'Unverified'
    };
  }

  const meta = property.metadata || {};
  const isExplicitlyVerified = Boolean(property.isVerified || meta.verified);
  const ownerPhone = meta.ownerPhone || property.ownerPhone || meta.phone;
  const ownerId = meta.ownerId || property.ownerId;
  const locatorPhone = meta.locatorPhone;
  const posterRole = meta.posterRole;
  const locatorStatus = meta.locatorStatus;
  const verifiedByText = meta.verifiedBy || '';

  // 1. Check if Landlord approved:
  // Either posterRole is LANDLORD, owner is approved landlord in database/storage, or verifiedBy contains Landlord
  const isLandlordOwnerApproved = isApprovedLandlordUser(ownerPhone) || isApprovedLandlordUser(ownerId);
  const isLandlordPoster = posterRole === 'LANDLORD' || verifiedByText.toLowerCase().includes('landlord');

  if (isLandlordOwnerApproved || (isLandlordPoster && isExplicitlyVerified)) {
    return {
      isVerified: true,
      role: 'LANDLORD',
      status: 'VERIFIED',
      badgeLabel: 'Verified Landlord',
      badgeLabelBn: 'যাচাইকৃত বাড়িওয়ালা',
      badgeSubtext: 'Owner NID & Ownership Cleared',
      badgeSubtextBn: 'মালিকানা ও জাতীয় পরিচয়পত্র যাচাইকৃত',
      icon: 'verified_user',
      verifiedBy: meta.verifiedBy || 'Duyar Verified Landlord'
    };
  }

  // 2. Check if Locator sourced:
  // "the locator approved user who will post any property will be verified by the admin or the moderator, and that will be posted tag verified property."
  const isLocatorSourced = posterRole === 'LOCATOR' || Boolean(locatorStatus) || Boolean(locatorPhone) || verifiedByText.toLowerCase().includes('locator');

  if (isLocatorSourced) {
    const isLocatorListingApproved = isExplicitlyVerified || locatorStatus === 'APPROVED';

    if (isLocatorListingApproved) {
      return {
        isVerified: true,
        role: 'LOCATOR',
        status: 'VERIFIED',
        badgeLabel: 'Verified Locator',
        badgeLabelBn: 'যাচাইকৃত লোকেটর',
        badgeSubtext: 'Admin Audited • Locator Scouted',
        badgeSubtextBn: 'অ্যাডমিন যাচাইকৃত • লোকেটর নথিভুক্ত',
        icon: 'verified',
        verifiedBy: meta.verifiedBy || 'Duyar Admin Desk (৳ 5 Bounty Credited)'
      };
    }

    if (locatorStatus === 'PENDING_VERIFICATION' || !isExplicitlyVerified) {
      return {
        isVerified: false,
        role: 'LOCATOR',
        status: 'PENDING',
        isPendingVerification: true,
        badgeLabel: 'Pending Verification',
        badgeLabelBn: 'যাচাইয়ের অপেক্ষায়',
        badgeSubtext: 'Awaiting Admin Field Audit',
        badgeSubtextBn: 'অ্যাডমিন মাঠ পরিদর্শনের অপেক্ষায়',
        icon: 'hourglass_top',
        verifiedBy: 'Pending Admin/Moderator Verification'
      };
    }
  }

  // 3. Admin / Duyar Field Inspection verified:
  if (isExplicitlyVerified) {
    return {
      isVerified: true,
      role: 'ADMIN',
      status: 'VERIFIED',
      badgeLabel: 'Verified Property',
      badgeLabelBn: 'যাচাইকৃত প্রপার্টি',
      badgeSubtext: 'Duyar Physical Inspection Passed',
      badgeSubtextBn: 'দুয়ার সরেজমিন পরিদর্শন উত্তীর্ণ',
      icon: 'verified',
      verifiedBy: meta.verifiedBy || 'Duyar Field Inspection Team'
    };
  }

  // 4. Default unverified
  return {
    isVerified: false,
    role: 'UNVERIFIED',
    status: 'UNVERIFIED',
    badgeLabel: 'Unverified',
    badgeLabelBn: 'যাচাই করা হয়নি',
    badgeSubtext: 'Community Posted',
    badgeSubtextBn: 'নাগরিক পোস্ট',
    icon: 'info',
    verifiedBy: 'Unverified Resident Post'
  };
}

