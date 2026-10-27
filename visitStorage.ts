import { PropertyVisit, VisitReview, VisitAspectRatings } from './types';

const VISITS_STORAGE_KEY = 'duyar_property_visits_v3';
const REVIEWS_STORAGE_KEY = 'duyar_property_reviews_v3';

const SEED_VISITS: PropertyVisit[] = [];

export function getStoredVisits(): PropertyVisit[] {
  if (typeof window === 'undefined') return SEED_VISITS;
  try {
    const raw = localStorage.getItem(VISITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(SEED_VISITS));
      return SEED_VISITS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(v => v && v.id && !v.id.includes('seed')) : SEED_VISITS;
  } catch (e) {
    console.error('Error loading visits:', e);
    return SEED_VISITS;
  }
}

export function saveStoredVisits(visits: PropertyVisit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
  } catch (e) {
    console.error('Error saving visits:', e);
  }
}

export function addPropertyVisit(visitData: {
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  propertyPrice: string;
  scheduledDate: string;
  scheduledTime: string;
  userId?: string;
  userPhone?: string;
  landlordName?: string;
  landlordPhone?: string;
}): PropertyVisit {
  const visits = getStoredVisits();
  const newVisit: PropertyVisit = {
    id: `visit-${Date.now()}`,
    ...visitData,
    status: 'SCHEDULED',
    ...({ isSessionBooking: true } as any)
  };
  const updated = [newVisit, ...visits];
  saveStoredVisits(updated);
  return newVisit;
}

export function getUserVisits(userPhone?: string, userId?: string): PropertyVisit[] {
  const all = getStoredVisits();
  if (!userPhone && !userId) {
    return all.filter(v => (v as any).isSessionBooking && !v.userId);
  }

  const cleanPhone = userPhone ? userPhone.replace(/[\s-]/g, '') : '';
  return all.filter(v => {
    if (userId && v.userId && v.userId === userId) return true;
    if (cleanPhone && v.userPhone) {
      const vPhoneClean = v.userPhone.replace(/[\s-]/g, '');
      if (vPhoneClean === cleanPhone || vPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(vPhoneClean)) {
        return true;
      }
    }
    return false;
  });
}

export function markVisitAsCompleted(visitId: string): PropertyVisit | null {
  const visits = getStoredVisits();
  let completedVisit: PropertyVisit | null = null;
  const updated = visits.map((v) => {
    if (v.id === visitId) {
      completedVisit = {
        ...v,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      };
      return completedVisit;
    }
    return v;
  });
  saveStoredVisits(updated);
  return completedVisit;
}

export function cancelPropertyVisit(visitId: string): void {
  const visits = getStoredVisits();
  const updated = visits.map((v) => {
    if (v.id === visitId) {
      return { ...v, status: 'CANCELLED' as const };
    }
    return v;
  });
  saveStoredVisits(updated);
}

export function submitPropertyVisitReview(params: {
  visitId: string;
  rating: number;
  aspectRatings: VisitAspectRatings;
  reviewText: string;
  tags: string[];
  interest: 'Yes' | 'Maybe' | 'No';
  personalNotes?: string;
  tenantName?: string;
}): { visit: PropertyVisit; review: VisitReview } | null {
  const visits = getStoredVisits();
  let updatedVisit: PropertyVisit | null = null;
  let createdReview: VisitReview | null = null;

  const updated = visits.map((v) => {
    if (v.id === params.visitId) {
      const review: VisitReview = {
        id: `rev-${Date.now()}`,
        visitId: v.id,
        propertyId: v.propertyId,
        propertyTitle: v.propertyTitle,
        rating: params.rating,
        aspectRatings: params.aspectRatings,
        reviewText: params.reviewText,
        tags: params.tags,
        interest: params.interest,
        personalNotes: params.personalNotes,
        tenantName: params.tenantName || 'Tenant Reviewer',
        reviewedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };

      createdReview = review;
      updatedVisit = {
        ...v,
        status: 'COMPLETED',
        completedAt: v.completedAt || new Date().toISOString(),
        review
      };
      return updatedVisit;
    }
    return v;
  });

  if (updatedVisit && createdReview) {
    saveStoredVisits(updated);
    return { visit: updatedVisit, review: createdReview };
  }
  return null;
}

export function getAllVisitReviews(): VisitReview[] {
  const visits = getStoredVisits();
  const reviews: VisitReview[] = [];
  visits.forEach((v) => {
    if (v.review) {
      reviews.push(v.review);
    }
  });
  return reviews;
}

export function getReviewsForProperty(propertyId?: string, propertyTitle?: string): VisitReview[] {
  const allReviews = getAllVisitReviews();
  if (!propertyId && !propertyTitle) return allReviews;

  const matched = allReviews.filter((r) => {
    if (propertyId && r.propertyId === propertyId) return true;
    if (propertyTitle && r.propertyTitle?.toLowerCase() === propertyTitle.toLowerCase()) return true;
    return false;
  });

  return matched;
}
