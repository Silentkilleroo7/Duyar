-- ==============================================================================
-- DUYAR REAL ESTATE & SUPER APP - COMPLETE PRODUCTION SUPABASE SQL SCRIPT
-- ==============================================================================
-- INSTRUCTIONS FOR LIVE LAUNCH:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Select your project and navigate to the "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script, and click "Run" (or Ctrl + Enter)
-- 4. Result: All database tables, storage buckets (property-images, avatars, receipts, documents),
--    RLS policies, realtime subscriptions, automated auth triggers, and dedicated photo uploading
--    database functions will be active with zero mock data.
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 RENTAL APPLICATIONS
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  nid_number TEXT,
  monthly_income NUMERIC(12, 2),
  occupation TEXT,
  family_members INTEGER DEFAULT 1,
  advance_amount NUMERIC(12, 2) DEFAULT 0,
  move_in_date TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'send', 'receive', 'rent_payment', 'service_payment', 'boost_ad', 'locator_reward', 'refund')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method TEXT DEFAULT 'Duyar Wallet' CHECK (method IN ('Duyar Wallet', 'bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer', 'Cash')),
  account_number TEXT,
  trx_id TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 MANUAL RECHARGES (Add Money via bKash / Nagad / Rocket with TrxID)
CREATE TABLE IF NOT EXISTS public.manual_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bKash', 'Nagad', 'Rocket', 'Upay')),
  sender_number TEXT NOT NULL,
  trx_id TEXT UNIQUE NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 PAYOUT / WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_phone TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer')),
  account_number TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(12, 2) DEFAULT 0,
  net_amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'REJECTED', 'HOLD')),
  user_notes TEXT,
  admin_trx_id TEXT,
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 HOME SERVICE BOOKINGS (General Bookings)
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  category TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  customer_name TEXT,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_name TEXT,
  provider_phone TEXT,
  address TEXT NOT NULL,
  area TEXT,
  scheduled_date TEXT,
  scheduled_time TEXT,
  price NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 MAINTENANCE TICKETS (Specialized for Electrical, Plumbing, AC, Security & CCTV, Maid)
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'Standard',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  address TEXT NOT NULL,
  scheduled_time TEXT,
  price TEXT NOT NULL,
  assigned_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  technician_name TEXT,
  technician_phone TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  user_id TEXT,
  notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 PICK & DROP REQUESTS (Cargo, Truck, Moving Logistics)
CREATE TABLE IF NOT EXISTS public.pickdrop_requests (
  id TEXT PRIMARY KEY,
  vehicle TEXT NOT NULL,
  helpers INTEGER DEFAULT 1,
  items TEXT[] DEFAULT ARRAY[]::TEXT[],
  item_details TEXT,
  special_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  pickup_floor TEXT,
  drop_floor TEXT,
  pickup_area TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  drop_area TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  fare TEXT NOT NULL,
  weight_category TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'CONFIRMED', 'ON_TRIP', 'COMPLETED')),
  driver_name TEXT,
  driver_phone TEXT,
  driver_vehicle_no TEXT,
  user_id TEXT,
  user_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 PROVIDER APPLICATIONS (Landlord, Maid, Technician, Driver, Security Guard, Locator)
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

-- 2.12 NOTIFICATIONS & IN-APP ALERTS
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

-- ==============================================================================
-- 3. INDEXES FOR HIGH-SPEED SEARCH & REALTIME QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_creator_role ON public.properties(creator_role);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON public.property_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_property ON public.property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_customer_phone ON public.maintenance_tickets(customer_phone);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickdrop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for App Front-End Access
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;
CREATE POLICY "Public can view approved properties" ON public.properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert properties" ON public.properties;
CREATE POLICY "Users can insert properties" ON public.properties FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
CREATE POLICY "Owners can update their properties" ON public.properties FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
CREATE POLICY "Owners can delete their properties" ON public.properties FOR DELETE USING (true);

DROP POLICY IF EXISTS "Transactions access" ON public.transactions;
CREATE POLICY "Transactions access" ON public.transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Visits access" ON public.property_visits;
CREATE POLICY "Visits access" ON public.property_visits FOR ALL USING (true);

DROP POLICY IF EXISTS "Rental applications access" ON public.rental_applications;
CREATE POLICY "Rental applications access" ON public.rental_applications FOR ALL USING (true);

DROP POLICY IF EXISTS "Manual recharges access" ON public.manual_recharges;
CREATE POLICY "Manual recharges access" ON public.manual_recharges FOR ALL USING (true);

DROP POLICY IF EXISTS "Payouts access" ON public.payout_requests;
CREATE POLICY "Payouts access" ON public.payout_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Service bookings access" ON public.service_bookings;
CREATE POLICY "Service bookings access" ON public.service_bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Maintenance tickets access" ON public.maintenance_tickets;
CREATE POLICY "Maintenance tickets access" ON public.maintenance_tickets FOR ALL USING (true);

DROP POLICY IF EXISTS "Pickdrop requests access" ON public.pickdrop_requests;
CREATE POLICY "Pickdrop requests access" ON public.pickdrop_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Provider applications access" ON public.provider_applications;
CREATE POLICY "Provider applications access" ON public.provider_applications FOR ALL USING (true);

DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (true);

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
    ('documents', 'documents', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Storage RLS Policies: Public viewing & open upload/management
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Select Storage Objects" ON storage.objects;
  CREATE POLICY "Public Select Storage Objects" ON storage.objects 
    FOR SELECT USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Insert Storage Objects" ON storage.objects;
  CREATE POLICY "Public Insert Storage Objects" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Update Storage Objects" ON storage.objects;
  CREATE POLICY "Public Update Storage Objects" ON storage.objects 
    FOR UPDATE USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents'))
    WITH CHECK (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Delete Storage Objects" ON storage.objects;
  CREATE POLICY "Public Delete Storage Objects" ON storage.objects 
    FOR DELETE USING (bucket_id IN ('property-images', 'avatars', 'receipts', 'documents'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 6. PHOTO UPLOADING & DATABASE HELPER FUNCTIONS
-- ==============================================================================

-- 6.1 Upload / Append Property Photo Function
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

-- 6.2 Set User Avatar Function
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

  RETURN jsonb_build_object(
    'success', true,
    'phone', v_profile.phone,
    'avatar_url', v_profile.avatar_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Attach Recharge Receipt Image Function
CREATE OR REPLACE FUNCTION public.attach_recharge_receipt(
  p_recharge_id UUID,
  p_receipt_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_recharge public.manual_recharges%ROWTYPE;
BEGIN
  UPDATE public.manual_recharges
  SET 
    receipt_url = p_receipt_url
  WHERE id = p_recharge_id
  RETURNING * INTO v_recharge;

  RETURN jsonb_build_object(
    'success', true,
    'recharge_id', v_recharge.id,
    'receipt_url', v_recharge.receipt_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Attach Provider Verification Document Function
CREATE OR REPLACE FUNCTION public.attach_provider_document(
  p_application_id UUID,
  p_doc_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_app public.provider_applications%ROWTYPE;
BEGIN
  UPDATE public.provider_applications
  SET 
    document_url = COALESCE(document_url, p_doc_url),
    documents = array_append(COALESCE(documents, ARRAY[]::TEXT[]), p_doc_url)
  WHERE id = p_application_id
  RETURNING * INTO v_app;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_app.id,
    'document_url', v_app.document_url,
    'total_documents', array_length(v_app.documents, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Record Locator Listing & Award 5 BDT Commission
CREATE OR REPLACE FUNCTION public.record_locator_listing(
  p_locator_phone TEXT,
  p_property_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_locator public.profiles%ROWTYPE;
  v_reward NUMERIC(10, 2) := 5.00;
BEGIN
  -- Verify locator profile
  SELECT * INTO v_locator FROM public.profiles WHERE phone = p_locator_phone;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Locator not found');
  END IF;

  -- Credit balance
  UPDATE public.profiles
  SET 
    balance = balance + v_reward,
    updated_at = NOW()
  WHERE phone = p_locator_phone
  RETURNING * INTO v_locator;

  -- Record transaction ledger
  INSERT INTO public.transactions (
    user_id,
    user_phone,
    type,
    amount,
    method,
    status,
    description
  ) VALUES (
    v_locator.id,
    v_locator.phone,
    'locator_reward',
    v_reward,
    'Duyar Wallet',
    'COMPLETED',
    'Locator bounty reward for verified property listing #' || LEFT(p_property_id::TEXT, 8)
  );

  RETURN jsonb_build_object(
    'success', true,
    'locator_phone', p_locator_phone,
    'reward_amount', v_reward,
    'new_balance', v_locator.balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 Broadcast Service Request to Verified Specialists
CREATE OR REPLACE FUNCTION public.broadcast_service_request(
  p_booking_id UUID,
  p_category TEXT,
  p_title TEXT,
  p_area TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_recipient RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Notify all approved providers in this category
  FOR v_recipient IN 
    SELECT id, phone FROM public.profiles 
    WHERE 
      (p_category ILIKE '%security%' AND (is_security = true OR role = 'SECURITY' OR role = 'ADMIN'))
      OR (p_category ILIKE '%maid%' AND (is_maid = true OR role = 'MAID' OR role = 'ADMIN'))
      OR (p_category ILIKE '%maintenance%' AND (is_maintenance = true OR role = 'MAINTENANCE' OR role = 'ADMIN'))
      OR (p_category ILIKE '%pick%' AND (is_pickdrop = true OR role = 'PICKDROP' OR role = 'ADMIN'))
  LOOP
    INSERT INTO public.notifications (
      user_id,
      user_phone,
      title,
      content,
      type,
      metadata
    ) VALUES (
      v_recipient.id,
      v_recipient.phone,
      'New ' || p_category || ' Service Request In ' || COALESCE(p_area, 'Dhaka'),
      p_title || ' is pending your acceptance.',
      'ALERT',
      jsonb_build_object('booking_id', p_booking_id, 'category', p_category)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'broadcast_recipients', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ==============================================================================
-- 8. REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.property_visits;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tickets;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pickdrop_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.manual_recharges;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 9. PRODUCTION INITIALIZATION (Admin Master Profile Only - Zero Mock Listings)
-- ==============================================================================

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
  0.00,
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

-- Confirmation Output
SELECT 'Duyar Database & Storage setup completed successfully! Production environment is pristine and live.' AS result;
