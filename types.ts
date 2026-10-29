
export enum Screen {
  ONBOARDING_PERMISSIONS = 'ONBOARDING_PERMISSIONS',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  OTP = 'OTP',
  REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
  HOME = 'HOME',
  RESULTS = 'RESULTS',
  PROPERTY_DETAILS = 'PROPERTY_DETAILS',
  COMPARE = 'COMPARE',
  RENT_STEP1 = 'RENT_STEP1',
  RENT_STEP2 = 'RENT_STEP2',
  RENT_STEP3 = 'RENT_STEP3',
  RENT_SUCCESS = 'RENT_SUCCESS',
  FILTERS = 'FILTERS',
  SECURITY = 'SECURITY',
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  WALLET = 'WALLET',
  ADD_MONEY = 'ADD_MONEY',
  WITHDRAW = 'WITHDRAW',
  SEND_MONEY_SEARCH = 'SEND_MONEY_SEARCH',
  SEND_MONEY_AMOUNT = 'SEND_MONEY_AMOUNT',
  PIN_VERIFICATION = 'PIN_VERIFICATION',
  TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS',
  MY_ADS = 'MY_ADS',
  POST_AD = 'POST_AD',
  AD_SUCCESS = 'AD_SUCCESS',
  BOOST_AD = 'BOOST_AD',
  BOOST_PAYMENT = 'BOOST_PAYMENT',
  MAINTENANCE_HUB = 'MAINTENANCE_HUB',
  MAINTENANCE_BOOKING = 'MAINTENANCE_BOOKING',
  MAINTENANCE_SUCCESS = 'MAINTENANCE_SUCCESS',
  MAINTENANCE_APP = 'MAINTENANCE_APP',
  MAID_BOOKING = 'MAID_BOOKING',
  SECURITY_BOOKING = 'SECURITY_BOOKING',
  PICK_DROP_BOOKING = 'PICK_DROP_BOOKING',
  PICK_DROP_SUCCESS = 'PICK_DROP_SUCCESS',
  PICK_DROP_APP = 'PICK_DROP_APP',
  LANDLORD_APP = 'LANDLORD_APP',
  LOCATOR_APP = 'LOCATOR_APP',
  MAID_APP = 'MAID_APP',
  SECURITY_GUARD_APP = 'SECURITY_GUARD_APP',
  APP_SUBMITTED = 'APP_SUBMITTED',
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  SERVICE_TRACKING = 'SERVICE_TRACKING',
  SERVICE_RATING = 'SERVICE_RATING',
  RATING_SUCCESS = 'RATING_SUCCESS',
  MY_VISITS = 'MY_VISITS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ADMIN_NOTIFICATIONS = 'ADMIN_NOTIFICATIONS',
  HISTORY = 'HISTORY',
  SERVICES_HUB = 'SERVICES_HUB',
  EMERGENCY_HELP = 'EMERGENCY_HELP',
  EDIT_PROFILE = 'EDIT_PROFILE',
  HELP_SUPPORT = 'HELP_SUPPORT',
  BOOK_VISIT = 'BOOK_VISIT',
  VISIT_SUCCESS = 'VISIT_SUCCESS',
  VISIT_ARRIVAL = 'VISIT_ARRIVAL',
  VISIT_FEEDBACK = 'VISIT_FEEDBACK',
  SAVED_PROPERTIES = 'SAVED_PROPERTIES',
  ROUTE_NAVIGATION = 'ROUTE_NAVIGATION',
  INTERESTED_PROPERTIES = 'INTERESTED_PROPERTIES',
  
  // New Provider Negotiation Screens
  PROVIDER_SELECTION = 'PROVIDER_SELECTION',
  PROVIDER_PROFILE = 'PROVIDER_PROFILE',
  SERVICE_CHAT = 'SERVICE_CHAT',
  SERVICE_RECEIPT = 'SERVICE_RECEIPT',
  SPENDING_REPORT = 'SPENDING_REPORT',

  // SMS Admin
  SMS_ADMIN = 'SMS_ADMIN',

  // Recharge Flow
  MANUAL_RECHARGE_FORM = 'MANUAL_RECHARGE_FORM',
  RECHARGE_STATUS = 'RECHARGE_STATUS',
  RECHARGE_HISTORY = 'RECHARGE_HISTORY',
  
  // Specialized Dashboards
  LOCATOR_DASHBOARD = 'LOCATOR_DASHBOARD',
  LANDLORD_DASHBOARD = 'LANDLORD_DASHBOARD',
  MAID_DASHBOARD = 'MAID_DASHBOARD',
  SECURITY_GUARD_DASHBOARD = 'SECURITY_GUARD_DASHBOARD',
  MAINTENANCE_DASHBOARD = 'MAINTENANCE_DASHBOARD',
  PICK_DROP_DASHBOARD = 'PICK_DROP_DASHBOARD',

  // Admin Panel Suite
  ADMIN_LOGIN_GATE = 'ADMIN_LOGIN_GATE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_LIVE_TRACKING = 'ADMIN_LIVE_TRACKING',
  ADMIN_REVENUE = 'ADMIN_REVENUE',
  ADMIN_PAYOUTS = 'ADMIN_PAYOUTS',
  ADMIN_WALLET = 'ADMIN_WALLET',
  ADMIN_APPROVALS = 'ADMIN_APPROVALS',
  ADMIN_RECHARGE_APPROVAL = 'ADMIN_RECHARGE_APPROVAL',
  ADMIN_MODERATION = 'ADMIN_MODERATION',
  ADMIN_ACTIVITY_LOG = 'ADMIN_ACTIVITY_LOG',
  ADMIN_SUPPORT = 'ADMIN_SUPPORT',
  ADMIN_AD_PLACEMENT = 'ADMIN_AD_PLACEMENT'
}

export interface Provider {
  id: string;
  name: string;
  rating: number;
  jobsDone: number;
  location: string;
  price: string; 
  image: string;
  online: boolean;
  category: string;
}

export interface PropertyMetadata {
  verified?: boolean;
  featured?: boolean;
  verifiedBy?: string;
  verificationDate?: string;
  verificationCertificateId?: string;
  inspectionScore?: number;
  featuredTier?: 'Gold' | 'Platinum' | 'Spotlight' | 'Premium' | string;
  featuredUntil?: string;
  badgeLevel?: string;
  legalClearance?: boolean;
  ownershipVerified?: boolean;
  physicalInspection?: boolean;
  [key: string]: any;
}

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  images?: string[];
  tag: string;
  tags?: string[];
  amenities?: string[];
  availableDate?: string;
  availableMonth?: string;
  distance?: number;
  lat?: number;
  lng?: number;
  type?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  metadata?: PropertyMetadata;
}

export interface SearchFilters {
  propertyType: string;
  maxBudget: number;
  beds: string;
  tenantType: string;
  radius: number;
  tags?: string[];
}

export interface SearchAlert {
  id: string;
  title: string;
  criteria: SearchFilters;
  email: string;
  emailNotification: boolean;
  inAppNotification: boolean;
  priceDropNotification?: boolean;
  targetPriceDrop?: number;
  frequency: 'instant' | 'daily';
  isActive: boolean;
  createdAt: string;
  lastNotified?: string;
  matchedCount?: number;
}

export interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  bodyPreview: string;
  sentAt: string;
  propertyTitle: string;
  propertyPrice: string;
  propertyImage?: string;
  propertyLocation: string;
  matchedAlertTitle: string;
}

export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  time: string;
  type: 'SUCCESS' | 'ALERT' | 'INFO';
  isRead: boolean;
}

export interface VisitAspectRatings {
  propertyAccuracy: number; // 1-5
  hostProfessionalism: number; // 1-5
  neighborhoodSafety: number; // 1-5
  valueForPrice: number; // 1-5
}

export interface VisitReview {
  id: string;
  visitId: string;
  propertyId: string;
  propertyTitle?: string;
  rating: number; // 1-5 overall stars
  aspectRatings: VisitAspectRatings;
  reviewText: string;
  tags: string[];
  interest: 'Yes' | 'Maybe' | 'No';
  personalNotes?: string;
  tenantName: string;
  reviewedAt: string;
}

export interface PropertyVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  propertyPrice: string;
  landlordName?: string;
  landlordPhone?: string;
  userId?: string;
  userPhone?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  review?: VisitReview;
}

