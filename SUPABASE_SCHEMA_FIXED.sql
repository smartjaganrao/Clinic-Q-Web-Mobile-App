/**
 * SUPABASE SCHEMA - FIXED VERSION
 * Run this script in Supabase SQL Editor
 * Copy entire content and paste into SQL Editor, then click Run
 */

-- ============================================================================
-- STEP 1: DROP EXISTING OBJECTS (if re-running)
-- ============================================================================

DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
DROP TABLE IF EXISTS public.doctor_reviews CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS get_next_token_number(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_queue_stats(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_clinic_stats(TEXT);
DROP FUNCTION IF EXISTS get_doctor_availability(TEXT, TEXT);

-- ============================================================================
-- STEP 2: CREATE USER PROFILES
-- ============================================================================

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'KIOSK', 'PATIENT', 'PUBLIC')),
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_phone ON public.user_profiles(phone);

-- ============================================================================
-- STEP 3: CREATE CLINICS
-- ============================================================================

CREATE TABLE public.clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  pincode TEXT,
  type TEXT CHECK (type IN ('GENERAL', 'PEDIATRIC', 'GYNECOLOGY', 'ORTHOPEDIC', 'DENTAL', 'CARDIOLOGY', 'DERMATOLOGY', 'EMERGENCY', 'OTHER')),
  plan TEXT CHECK (plan IN ('Solo Clinic', 'Small Hospital', 'Premium')),
  operation_mode TEXT NOT NULL CHECK (operation_mode IN ('DIRECT_WALK_IN', 'ONLINE_WALK_IN', 'BOTH_WALK_IN', 'HYBRID_DIRECT_APPT', 'HYBRID_FULL')),
  enable_advance_booking BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  operating_hours TEXT,
  image_url TEXT,
  contact_phone TEXT,
  about TEXT,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  subscription_status TEXT DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'PAST_DUE')),
  geo_location JSONB,
  working_hours JSONB DEFAULT '[]'::JSONB,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clinics_city ON public.clinics(city);
CREATE INDEX idx_clinics_subscription ON public.clinics(subscription_status);

-- ============================================================================
-- STEP 4: UPDATE USER_PROFILES WITH CLINIC_ID
-- ============================================================================

ALTER TABLE public.user_profiles ADD COLUMN clinic_id TEXT REFERENCES public.clinics(id) ON DELETE SET NULL;
CREATE INDEX idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);

-- ============================================================================
-- STEP 5: CREATE DOCTORS
-- ============================================================================

CREATE TABLE public.doctors (
  id TEXT PRIMARY KEY,
  master_id TEXT,
  clinic_id TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  specialty TEXT NOT NULL,
  registration_number TEXT,
  room_number TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_BREAK', 'OFF_DUTY')),
  status_update_time TIMESTAMP WITH TIME ZONE,
  delay_minutes INTEGER DEFAULT 0,
  delay_start_time TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  weekly_schedule JSONB DEFAULT '[]'::JSONB,
  consultation_fee DECIMAL(10, 2),
  consultation_time INTEGER DEFAULT 15,
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  bio TEXT,
  education TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  reviews JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_doctors_master_id ON public.doctors(master_id);
CREATE INDEX idx_doctors_rating ON public.doctors(rating DESC);

-- ============================================================================
-- STEP 6: CREATE PATIENTS
-- ============================================================================

CREATE TABLE public.patients (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  token_number INTEGER,
  queue_order INTEGER,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'WITH_DOCTOR', 'COMPLETED', 'CANCELLED', 'SKIPPED', 'ON_HOLD')),
  visit_type TEXT NOT NULL CHECK (visit_type IN ('WALK_IN', 'APPOINTMENT')),
  appointment_date TEXT,
  appointment_time TEXT,
  is_checked_in BOOLEAN DEFAULT FALSE,
  is_emergency BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  notes TEXT,
  diagnosis TEXT,
  vitals JSONB DEFAULT '{}',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  time_added TIMESTAMP WITH TIME ZONE NOT NULL,
  time_checked_in TIMESTAMP WITH TIME ZONE,
  time_started TIMESTAMP WITH TIME ZONE,
  time_completed TIMESTAMP WITH TIME ZONE,
  next_of_kin JSONB,
  address TEXT,
  city TEXT,
  country TEXT,
  location JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_appointment_date ON public.patients(appointment_date);

-- ============================================================================
-- STEP 7: CREATE STAFF
-- ============================================================================

CREATE TABLE public.staff (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('RECEPTIONIST', 'NURSE', 'MANAGER')),
  phone TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_staff_clinic_id ON public.staff(clinic_id);

-- ============================================================================
-- STEP 8: CREATE APPOINTMENTS
-- ============================================================================

CREATE TABLE public.appointments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);

-- ============================================================================
-- STEP 9: CREATE DOCTOR REVIEWS
-- ============================================================================

CREATE TABLE public.doctor_reviews (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 10: CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_token_number(clinic_id TEXT, doctor_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(MAX(token_number), 0) + 1
    FROM public.patients
    WHERE patients.clinic_id = $1 
    AND patients.doctor_id = $2
    AND DATE(patients.time_added) = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_queue_stats(clinic_id TEXT, doctor_id TEXT DEFAULT NULL)
RETURNS TABLE (
  total BIGINT,
  waiting BIGINT,
  with_doctor BIGINT,
  completed BIGINT,
  avg_wait_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total,
    COUNT(CASE WHEN status = 'WAITING' THEN 1 END)::BIGINT as waiting,
    COUNT(CASE WHEN status = 'WITH_DOCTOR' THEN 1 END)::BIGINT as with_doctor,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::BIGINT as completed,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(time_completed, NOW()) - time_added)) / 60), 2)::NUMERIC as avg_wait_time
  FROM public.patients
  WHERE patients.clinic_id = $1
  AND ($2 IS NULL OR patients.doctor_id = $2)
  AND DATE(patients.time_added) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_clinic_stats(clinic_id TEXT)
RETURNS TABLE (
  total_patients BIGINT,
  avg_wait_time NUMERIC,
  completed_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_patients,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(time_completed, NOW()) - time_added)) / 60), 2)::NUMERIC as avg_wait_time,
    COUNT(CASE WHEN status = 'COMPLETED' AND DATE(time_completed) = CURRENT_DATE THEN 1 END)::BIGINT as completed_today
  FROM public.patients
  WHERE patients.clinic_id = $1
  AND DATE(patients.time_added) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public access" ON public.clinics FOR SELECT USING (TRUE);
CREATE POLICY "Public access" ON public.doctors FOR SELECT USING (TRUE);
CREATE POLICY "Public access" ON public.doctor_reviews FOR SELECT USING (TRUE);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- STEP 12: SETUP REALTIME
-- ============================================================================

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
END;

ALTER PUBLICATION supabase_realtime ADD TABLE public.clinics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Done!
