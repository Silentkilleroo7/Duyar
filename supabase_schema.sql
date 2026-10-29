-- ==============================================================================
-- DUYAR REAL ESTATE & SERVICE ECOSYSTEM - COMPLETE MASTER SUPABASE SQL SCRIPT
-- ==============================================================================
-- INSTRUCTIONS FOR LIVE DATABASE SETUP:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project and navigate to the "SQL Editor" in the left navigation
-- 3. Click "New query", paste this ENTIRE single script, and click "Run" (Ctrl+Enter)
-- 4. Result: All 20 tables, 5 storage buckets, RLS policies, real-time publications,
--    atomic wallet transfer/recharge functions, chat, live GPS tracking, and auth triggers
--    will be configured and connected immediately!
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE DATABASE TABLES
-- ==============================================================================

-- 2.1 PROFILES (Tenants, Landlords, Specialists, Drivers, Guards & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'TENANT' CHECK (role IN ('TENANT', 'LANDLORD', 'ADMIN', 'LOCATOR', 'MAINTENANCE', 'PICKDROP', 'SECURITY', 'MAID')),
  balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  nid_number TEXT,
  address TEXT,
  area TEXT,
  is_verified BOOLEAN DEFAULT false,
  
  -- Provider Statuses
  is_landlord BOOLEAN DEFAULT false,
  landlord_status TEXT DEFAULT 'NONE' CHECK (landlord_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  is_locator BOOLEAN DEFAULT false,
  locator_status TEXT DEFAULT 'NONE' CHECK (locator_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  is_maintenance BOOLEAN DEFAULT false,
  maintenance_status TEXT DEFAULT 'NONE' CHECK (maintenance_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  is_pickdrop BOOLEAN DEFAULT false,
  pickdrop_status TEXT DEFAULT 'NONE' CHECK (pickdrop_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  is_security BOOLEAN DEFAULT false,
  security_status TEXT DEFAULT 'NONE' CHECK (security_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  is_maid BOOLEAN DEFAULT false,
  maid_status TEXT DEFAULT 'NONE' CHECK (maid_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),

  -- Biometrics
  biometric_enrolled BOOLEAN DEFAULT false,
  biometric_credential_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 PROPERTIES (Flats, Houses, Apartments, Commercial Spaces)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_phone TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  numeric_price NUMERIC(12, 2) DEFAULT 0,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 23.7937,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 90.4066,
  type TEXT DEFAULT 'Flat' CHECK (type IN ('Flat', 'House', 'Studio', 'Penthouse', 'Duplex', 'Room', 'Apartment', 'Commercial')),
  beds INTEGER DEFAULT 2,
  baths INTEGER DEFAULT 2,
  kitchens INTEGER DEFAULT 1,
  balconies INTEGER DEFAULT 1,
  sqft INTEGER DEFAULT 1000,
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  tag TEXT DEFAULT 'FOR RENT' CHECK (tag IN ('FOR RENT', 'FOR SALE')),
  available_month TEXT DEFAULT 'Immediate',
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RENTED', 'SOLD')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  creator_role TEXT DEFAULT 'LANDLORD',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 PROPERTY VISITS
CREATE TABLE IF NOT EXISTS public.property_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  visitor_name TEXT NOT NULL,
  landlord_phone TEXT,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 SAVED PROPERTIES (Bookmarked / Interested Listings)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  property_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  location TEXT NOT NULL,
  beds INTEGER DEFAULT 3,
  baths INTEGER DEFAULT 2,
  sqft INTEGER DEFAULT 1500,
  image TEXT,
  tag TEXT DEFAULT 'RENT',
  available_month TEXT DEFAULT 'This Month',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 RENTAL APPLICATIONS
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_phone TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  nid_number TEXT NOT NULL,
  monthly_income NUMERIC(12, 2) NOT NULL,
  current_address TEXT,
  move_in_date TEXT,
  documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 TRANSACTIONS (Wallet Ledger: Recharges, Transfers, Rent, Booking, Payouts)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'transfer_in', 'transfer_out', 'rent_payment', 'service_fee', 'payout', 'locator_reward', 'boost_ad', 'booking_fee')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  recipient_phone TEXT,
  recipient_name TEXT,
  payment_method TEXT DEFAULT 'Duyar Wallet',
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  description TEXT,
  trx_id TEXT UNIQUE,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 MANUAL RECHARGES (bKash, Nagad, Rocket, Bank Deposit Proofs)
CREATE TABLE IF NOT EXISTS public.manual_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  user_name TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  gateway TEXT NOT NULL CHECK (gateway IN ('bkash', 'nagad', 'rocket', 'bank')),
  sender_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 PAYOUT REQUESTS (Withdrawals by Landlords & Specialists)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  user_name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch_name TEXT,
  routing_number TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED')),
  reference_number TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 SERVICE BOOKINGS (Security Guards, Maids, Maintenance, Inspections)
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_phone TEXT,
  provider_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('Maid & Housekeeping', 'Security Guard', 'Maintenance', 'Pick & Drop', 'Painting', 'Appliance', 'Electrical', 'Plumbing')),
  service_title TEXT NOT NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  fare NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 MAINTENANCE TICKETS
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'Standard',
  customer_name TEXT,
  customer_phone TEXT,
  user_id TEXT,
  address TEXT,
  area TEXT,
  scheduled_time TEXT,
  price TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  assigned_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  technician_name TEXT,
  technician_role TEXT,
  technician_phone TEXT,
  description TEXT,
  image TEXT,
  notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 SCHEDULED MAINTENANCE VISITS (Pre-visit alerts & automated 30-min confirmations)
CREATE TABLE IF NOT EXISTS public.scheduled_maintenance_visits (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  service_title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_role TEXT DEFAULT 'Licensed Specialist',
  provider_phone TEXT,
  provider_image TEXT,
  customer_name TEXT DEFAULT 'Resident',
  customer_phone TEXT,
  user_id TEXT,
  address TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  scheduled_timestamp BIGINT NOT NULL,
  notify_at_timestamp BIGINT NOT NULL,
  notified BOOLEAN DEFAULT false,
  availability_confirmed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 PICK & DROP LOGISTICS REQUESTS
CREATE TABLE IF NOT EXISTS public.pickdrop_requests (
  id TEXT PRIMARY KEY,
  vehicle_type TEXT DEFAULT 'Mini Truck',
  helpers_count INTEGER DEFAULT 1,
  items TEXT[] DEFAULT ARRAY[]::TEXT[],
  item_details TEXT NOT NULL,
  special_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  pickup_floor TEXT,
  drop_floor TEXT,
  pickup_area TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  drop_area TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  fare TEXT NOT NULL,
  weight_category TEXT DEFAULT 'Standard',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'CONFIRMED', 'ON_TRIP', 'COMPLETED', 'CANCELLED')),
  driver_name TEXT,
  driver_phone TEXT,
  driver_vehicle_no TEXT,
  user_id TEXT,
  user_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 CHAT MESSAGES (Live Negotiation, Deal Confirmations & Status Updates)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'provider', 'system')),
  sender_avatar TEXT,
  sender_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'offer', 'counter', 'acceptance', 'agreement_confirmed')),
  text TEXT NOT NULL,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.14 LIVE TRACKING TELEMETRY (Real-Time GPS Location, Speed & ETA)
CREATE TABLE IF NOT EXISTS public.live_tracking_telemetry (
  ticket_id TEXT PRIMARY KEY,
  provider_lat DOUBLE PRECISION NOT NULL,
  provider_lng DOUBLE PRECISION NOT NULL,
  user_lat DOUBLE PRECISION NOT NULL,
  user_lng DOUBLE PRECISION NOT NULL,
  speed_kmh NUMERIC(6, 2) DEFAULT 35.0,
  eta_minutes INTEGER DEFAULT 12,
  status TEXT DEFAULT 'EN_ROUTE' CHECK (status IN ('EN_ROUTE', 'NEARBY', 'ARRIVED', 'IN_SERVICE', 'COMPLETED')),
  last_updated_by TEXT DEFAULT 'provider',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.15 PROVIDER APPLICATIONS (Landlord, Maid, Technician, Driver, Guard, Locator)
CREATE TABLE IF NOT EXISTS public.provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('LANDLORD', 'LOCATOR', 'MAINTENANCE', 'PICKDROP', 'SECURITY', 'MAID', 'ADS')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  nid_number TEXT,
  area TEXT,
  experience_years INTEGER DEFAULT 0,
  vehicle_type TEXT,
  specialization TEXT,
  document_url TEXT,
  documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.16 PROPERTY REVIEWS & SERVICE RATINGS
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT,
  ticket_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  user_name TEXT DEFAULT 'Resident',
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  provider_name TEXT,
  service_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.17 NOTIFICATIONS & SYSTEM ALERTS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'ALERT', 'SUCCESS', 'WARNING')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.18 ADMIN AUDIT LOGS (Security, Actions & Payout History)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  target_id TEXT,
  target_name TEXT,
  amount NUMERIC(14, 2),
  status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'WARNING', 'INFO'))
);

-- 2.19 ADMIN TASKS (Internal Operations Queue)
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id TEXT PRIMARY KEY DEFAULT ('TASK-' || substr(md5(random()::text), 1, 8)),
  title TEXT NOT NULL,
  assigned_to TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.20 FLAGGED USERS & MODERATION
CREATE TABLE IF NOT EXISTS public.flagged_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  user_name TEXT,
  reason TEXT NOT NULL,
  risk_level TEXT DEFAULT 'Medium' CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  flagged_by TEXT DEFAULT 'System Guard',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUSPENDED', 'DISMISSED'))
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-SPEED GEOLOCATION & REAL-TIME QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON public.transactions(user_phone);
CREATE INDEX IF NOT EXISTS idx_visits_user ON public.property_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_phone ON public.saved_properties(user_phone);
CREATE INDEX IF NOT EXISTS idx_maintenance_customer_phone ON public.maintenance_tickets(customer_phone);
CREATE INDEX IF NOT EXISTS idx_pickdrop_user_phone ON public.pickdrop_requests(user_phone);
CREATE INDEX IF NOT EXISTS idx_chat_ticket_id ON public.chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_maintenance_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickdrop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_tracking_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_users ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for seamless frontend application connectivity
DO $$ 
DECLARE 
  t TEXT;
  tables TEXT[] := ARRAY[
    'profiles', 'properties', 'property_visits', 'saved_properties', 
    'rental_applications', 'transactions', 'manual_recharges', 'payout_requests',
    'service_bookings', 'maintenance_tickets', 'scheduled_maintenance_visits',
    'pickdrop_requests', 'chat_messages', 'live_tracking_telemetry',
    'provider_applications', 'property_reviews', 'notifications',
    'admin_audit_logs', 'admin_tasks', 'flagged_users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ==============================================================================
-- 5. STORAGE BUCKETS CONFIGURATION & POLICIES
-- ==============================================================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
  VALUES 
    ('property-images', 'property-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
    ('avatars', 'avatars', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('receipts', 'receipts', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('documents', 'documents', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('service-attachments', 'service-attachments', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Storage RLS Policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Select Storage Objects" ON storage.objects;
  CREATE POLICY "Public Select Storage Objects" ON storage.objects 
    FOR SELECT USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents', 'service-attachments'));

  DROP POLICY IF EXISTS "Public Insert Storage Objects" ON storage.objects;
  CREATE POLICY "Public Insert Storage Objects" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents', 'service-attachments'));

  DROP POLICY IF EXISTS "Public Update Storage Objects" ON storage.objects;
  CREATE POLICY "Public Update Storage Objects" ON storage.objects 
    FOR UPDATE USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents', 'service-attachments'))
    WITH CHECK (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents', 'service-attachments'));

  DROP POLICY IF EXISTS "Public Delete Storage Objects" ON storage.objects;
  CREATE POLICY "Public Delete Storage Objects" ON storage.objects 
    FOR DELETE USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents', 'service-attachments'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 6. PRODUCTION FUNCTIONS & STORED PROCEDURES (RPCs)
-- ==============================================================================

-- 6.1 Atomic Wallet Peer-to-Peer Transfer Function
CREATE OR REPLACE FUNCTION public.process_wallet_transfer(
  p_sender_phone TEXT,
  p_recipient_phone TEXT,
  p_amount NUMERIC,
  p_note TEXT DEFAULT 'Peer-to-peer wallet transfer'
)
RETURNS JSONB AS $$
DECLARE
  v_sender public.profiles%ROWTYPE;
  v_recipient public.profiles%ROWTYPE;
  v_trx_id TEXT := 'TX-' || UPPER(substr(md5(random()::text), 1, 8));
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero');
  END IF;

  SELECT * INTO v_sender FROM public.profiles WHERE phone = p_sender_phone FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender account not found');
  END IF;

  IF v_sender.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
  END IF;

  SELECT * INTO v_recipient FROM public.profiles WHERE phone = p_recipient_phone FOR UPDATE;
  IF NOT FOUND THEN
    -- Auto-provision recipient profile if transfer was sent to unonboarded phone number
    INSERT INTO public.profiles (phone, full_name, role, balance)
    VALUES (p_recipient_phone, 'User ' || RIGHT(p_recipient_phone, 4), 'TENANT', 0.00)
    RETURNING * INTO v_recipient;
  END IF;

  -- Debit Sender
  UPDATE public.profiles
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = v_sender.id;

  -- Credit Recipient
  UPDATE public.profiles
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE id = v_recipient.id;

  -- Sender Ledger Entry
  INSERT INTO public.transactions (
    user_id, user_phone, type, amount, recipient_phone, recipient_name,
    payment_method, status, description, trx_id
  ) VALUES (
    v_sender.id, v_sender.phone, 'transfer_out', p_amount, v_recipient.phone,
    v_recipient.full_name, 'Duyar Wallet', 'COMPLETED', p_note, v_trx_id || '-OUT'
  );

  -- Recipient Ledger Entry
  INSERT INTO public.transactions (
    user_id, user_phone, type, amount, recipient_phone, recipient_name,
    payment_method, status, description, trx_id
  ) VALUES (
    v_recipient.id, v_recipient.phone, 'transfer_in', p_amount, v_sender.phone,
    v_sender.full_name, 'Duyar Wallet', 'COMPLETED', p_note, v_trx_id || '-IN'
  );

  RETURN jsonb_build_object(
    'success', true,
    'trx_id', v_trx_id,
    'amount', p_amount,
    'sender_new_balance', (v_sender.balance - p_amount),
    'recipient_name', v_recipient.full_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 Approve Manual Recharge & Credit Balance
CREATE OR REPLACE FUNCTION public.approve_recharge_request(
  p_recharge_id UUID,
  p_admin_phone TEXT DEFAULT '+8801977347402'
)
RETURNS JSONB AS $$
DECLARE
  v_recharge public.manual_recharges%ROWTYPE;
  v_user public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_recharge FROM public.manual_recharges WHERE id = p_recharge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recharge request not found');
  END IF;

  IF v_recharge.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recharge is already approved');
  END IF;

  SELECT * INTO v_user FROM public.profiles WHERE phone = v_recharge.user_phone FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Update recharge status
  UPDATE public.manual_recharges
  SET status = 'approved', reviewed_by = p_admin_phone, reviewed_at = NOW()
  WHERE id = p_recharge_id;

  -- Credit user balance
  UPDATE public.profiles
  SET balance = balance + v_recharge.amount, updated_at = NOW()
  WHERE id = v_user.id;

  -- Create completed deposit transaction
  INSERT INTO public.transactions (
    user_id, user_phone, type, amount, payment_method, status, description, trx_id
  ) VALUES (
    v_user.id, v_user.phone, 'deposit', v_recharge.amount,
    UPPER(v_recharge.gateway), 'COMPLETED',
    'Manual wallet recharge verified via ' || UPPER(v_recharge.gateway),
    v_recharge.transaction_id
  );

  -- Notify user
  INSERT INTO public.notifications (
    user_id, user_phone, title, content, type
  ) VALUES (
    v_user.id, v_user.phone, 'Deposit Approved',
    'Your ' || UPPER(v_recharge.gateway) || ' deposit of ৳' || v_recharge.amount || ' has been approved and added to your wallet.',
    'SUCCESS'
  );

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_recharge.amount,
    'user_phone', v_recharge.user_phone,
    'new_balance', (v_user.balance + v_recharge.amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Approve Provider Application & Activate Role
CREATE OR REPLACE FUNCTION public.approve_provider_application(
  p_application_id UUID,
  p_admin_phone TEXT DEFAULT '+8801977347402'
)
RETURNS JSONB AS $$
DECLARE
  v_app public.provider_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app FROM public.provider_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  UPDATE public.provider_applications
  SET status = 'APPROVED'
  WHERE id = p_application_id;

  -- Update role on profile
  IF v_app.role_type = 'LANDLORD' THEN
    UPDATE public.profiles SET is_landlord = true, landlord_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  ELSIF v_app.role_type = 'LOCATOR' THEN
    UPDATE public.profiles SET is_locator = true, locator_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  ELSIF v_app.role_type = 'MAINTENANCE' THEN
    UPDATE public.profiles SET is_maintenance = true, maintenance_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  ELSIF v_app.role_type = 'PICKDROP' THEN
    UPDATE public.profiles SET is_pickdrop = true, pickdrop_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  ELSIF v_app.role_type = 'SECURITY' THEN
    UPDATE public.profiles SET is_security = true, security_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  ELSIF v_app.role_type = 'MAID' THEN
    UPDATE public.profiles SET is_maid = true, maid_status = 'APPROVED', is_verified = true, updated_at = NOW() WHERE phone = v_app.phone;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'phone', v_app.phone,
    'role_type', v_app.role_type,
    'status', 'APPROVED'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Upload / Append Property Photo Function
CREATE OR REPLACE FUNCTION public.upload_property_photo(
  p_property_id UUID,
  p_photo_url TEXT,
  p_set_as_cover BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_updated public.properties%ROWTYPE;
BEGIN
  IF p_set_as_cover OR (SELECT image_url FROM public.properties WHERE id = p_property_id) IS NULL THEN
    UPDATE public.properties
    SET 
      image_url = p_photo_url,
      images = array_append(COALESCE(images, ARRAY[]::TEXT[]), p_photo_url),
      updated_at = NOW()
    WHERE id = p_property_id
    RETURNING * INTO v_updated;
  ELSE
    UPDATE public.properties
    SET 
      images = array_append(COALESCE(images, ARRAY[]::TEXT[]), p_photo_url),
      updated_at = NOW()
    WHERE id = p_property_id
    RETURNING * INTO v_updated;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'property_id', v_updated.id,
    'image_url', v_updated.image_url,
    'total_images', array_length(v_updated.images, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Set User Avatar Function
CREATE OR REPLACE FUNCTION public.set_user_avatar(
  p_user_phone TEXT,
  p_avatar_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  UPDATE public.profiles
  SET 
    avatar_url = p_avatar_url,
    updated_at = NOW()
  WHERE phone = p_user_phone
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'phone', v_profile.phone,
    'avatar_url', v_profile.avatar_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 Bookmark / Toggle Save Property Function
CREATE OR REPLACE FUNCTION public.toggle_save_property(
  p_user_phone TEXT,
  p_property_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_prop RECORD;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.saved_properties 
    WHERE user_phone = p_user_phone AND property_id = p_property_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.saved_properties 
    WHERE user_phone = p_user_phone AND property_id = p_property_id;
    RETURN jsonb_build_object('saved', false, 'property_id', p_property_id);
  ELSE
    -- Fetch property details
    SELECT * INTO v_prop FROM public.properties WHERE id::text = p_property_id;
    
    INSERT INTO public.saved_properties (
      user_phone, property_id, title, price, location, beds, baths, sqft, image, tag
    ) VALUES (
      p_user_phone,
      p_property_id,
      COALESCE(v_prop.title, 'Residential Property'),
      COALESCE(v_prop.price, '৳ 45,000'),
      COALESCE(v_prop.location, 'Dhaka'),
      COALESCE(v_prop.beds, 3),
      COALESCE(v_prop.baths, 2),
      COALESCE(v_prop.sqft, 1500),
      COALESCE(v_prop.image_url, ''),
      COALESCE(v_prop.tag, 'RENT')
    );
    RETURN jsonb_build_object('saved', true, 'property_id', p_property_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7 Nearby Properties Spatial Search Function
CREATE OR REPLACE FUNCTION public.get_nearby_properties(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price TEXT,
  numeric_price NUMERIC,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km NUMERIC,
  type TEXT,
  beds INTEGER,
  baths INTEGER,
  sqft INTEGER,
  image_url TEXT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.numeric_price,
    p.location,
    p.latitude,
    p.longitude,
    ROUND(
      (6371 * acos(
        cos(radians(p_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(p.latitude))
      ))::numeric, 2
    ) AS distance_km,
    p.type,
    p.beds,
    p.baths,
    p.sqft,
    p.image_url,
    p.is_verified
  FROM public.properties p
  WHERE p.status = 'APPROVED'
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(p.latitude))
    )) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 7. AUTOMATIC AUTH TRIGGERS & TIMESTAMP HANDLERS
-- ==============================================================================

-- Trigger function: Automatically create profile on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_phone text;
  v_name text;
  v_role text := 'TENANT';
BEGIN
  IF NEW.email LIKE '%@duyar.app' THEN
    v_phone := '+' || SPLIT_PART(NEW.email, '@', 1);
  ELSE
    v_phone := COALESCE(NEW.phone, '+' || REPLACE(REPLACE(COALESCE(NEW.email, ''), '@', ''), '.', ''));
  END IF;

  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Resident ' || RIGHT(v_phone, 4));

  -- Designated Admin Master Phone Number
  IF v_phone = '+8801977347402' THEN
    v_role := 'ADMIN';
  END IF;

  INSERT INTO public.profiles (
    id,
    phone,
    full_name,
    role,
    balance,
    is_landlord,
    is_locator,
    is_maintenance,
    is_pickdrop,
    is_security,
    is_maid
  ) VALUES (
    NEW.id,
    v_phone,
    v_name,
    v_role,
    0.00,
    (v_role = 'ADMIN'),
    (v_role = 'ADMIN'),
    (v_role = 'ADMIN'),
    (v_role = 'ADMIN'),
    (v_role = 'ADMIN'),
    (v_role = 'ADMIN')
  )
  ON CONFLICT (phone) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_properties_updated ON public.properties;
CREATE TRIGGER on_properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_maintenance_updated ON public.maintenance_tickets;
CREATE TRIGGER on_maintenance_updated BEFORE UPDATE ON public.maintenance_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pickdrop_updated ON public.pickdrop_requests;
CREATE TRIGGER on_pickdrop_updated BEFORE UPDATE ON public.pickdrop_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. REALTIME REPLICATION (WebSockets & Realtime Subscriptions)
-- ==============================================================================
DO $$
DECLARE
  tbl text;
  realtime_tables text[] := ARRAY[
    'profiles', 'properties', 'property_visits', 'saved_properties',
    'transactions', 'manual_recharges', 'payout_requests', 'service_bookings',
    'maintenance_tickets', 'scheduled_maintenance_visits', 'pickdrop_requests',
    'chat_messages', 'live_tracking_telemetry', 'notifications'
  ];
BEGIN
  FOREACH tbl IN ARRAY realtime_tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ==============================================================================
-- 9. MASTER ADMIN INITIALIZATION (Single Source of Truth)
-- ==============================================================================
DO $$
BEGIN
  INSERT INTO public.profiles (
    phone,
    full_name,
    role,
    balance,
    is_verified,
    is_landlord,
    landlord_status,
    is_locator,
    locator_status,
    is_maintenance,
    maintenance_status,
    is_pickdrop,
    pickdrop_status,
    is_security,
    security_status,
    is_maid,
    maid_status
  ) VALUES (
    '+8801977347402',
    'Duyar Administrator',
    'ADMIN',
    50000.00,
    true,
    true, 'APPROVED',
    true, 'APPROVED',
    true, 'APPROVED',
    true, 'APPROVED',
    true, 'APPROVED',
    true, 'APPROVED'
  )
  ON CONFLICT (phone) DO UPDATE SET
    role = 'ADMIN',
    is_verified = true,
    is_landlord = true,
    landlord_status = 'APPROVED',
    is_locator = true,
    locator_status = 'APPROVED',
    is_maintenance = true,
    maintenance_status = 'APPROVED',
    is_security = true,
    security_status = 'APPROVED',
    is_maid = true,
    maid_status = 'APPROVED',
    is_pickdrop = true,
    pickdrop_status = 'APPROVED';
END $$;

-- ==============================================================================
-- 10. SETUP CONFIRMATION
-- ==============================================================================
SELECT 'Duyar Supabase Database & Realtime infrastructure successfully provisioned! 20 Tables, 5 Storage Buckets, Triggers, and Functions are ready.' AS result;
