/**
 * Supabase Database Schema & Migration Guide
 * Run these SQL commands in your Supabase SQL Editor to set up the database
 * 
 * STEP 1: Create all tables
 * STEP 2: Enable Row Level Security (RLS)
 * STEP 3: Set up Realtime subscriptions
 */

-- ============================================================================
-- AUTHENTICATION & USER PROFILES
-- ============================================================================

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'KIOSK', 'PATIENT', 'PUBLIC')),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_phone ON public.user_profiles(phone);
CREATE INDEX idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);

-- ============================================================================
-- CLINIC MANAGEMENT
-- ============================================================================

-- Create clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
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
  geo_location JSONB, -- {"lat": 13.0850, "lng": 80.2100}
  working_hours JSONB DEFAULT '[]'::JSONB,
  created_by UUID REFERENCES public.user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clinics_city ON public.clinics(city);
CREATE INDEX idx_clinics_subscription ON public.clinics(subscription_status);

-- ============================================================================
-- DOCTOR MANAGEMENT
-- ============================================================================

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  master_id TEXT, -- Unique ID linking same doctor across clinics
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
  consultation_time INTEGER DEFAULT 15, -- in minutes
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

-- Indexes
CREATE INDEX idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_doctors_master_id ON public.doctors(master_id);
CREATE INDEX idx_doctors_rating ON public.doctors(rating DESC);

-- Create doctor_reviews table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PATIENT QUEUE & APPOINTMENTS
-- ============================================================================

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
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
  appointment_date TEXT, -- YYYY-MM-DD
  appointment_time TEXT, -- HH:mm
  is_checked_in BOOLEAN DEFAULT FALSE,
  is_emergency BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  notes TEXT,
  diagnosis TEXT,
  vitals JSONB DEFAULT '{}', -- {"bp": "120/80", "temp": "98.6", ...}
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  time_added TIMESTAMP WITH TIME ZONE NOT NULL,
  time_checked_in TIMESTAMP WITH TIME ZONE,
  time_started TIMESTAMP WITH TIME ZONE,
  time_completed TIMESTAMP WITH TIME ZONE,
  next_of_kin JSONB, -- {"name": "John", "phone": "1234567890"}
  address TEXT,
  city TEXT,
  country TEXT,
  location JSONB, -- {"lat": 13.0850, "lng": 80.2100}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queue lookups
CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_appointment_date ON public.patients(appointment_date);

-- ============================================================================
-- STAFF MANAGEMENT
-- ============================================================================

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
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

-- Index
CREATE INDEX idx_staff_clinic_id ON public.staff(clinic_id);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:mm
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get next token number for a doctor/clinic
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

-- Get queue statistics
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

-- Get clinic statistics
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

-- Get doctor availability for a date
CREATE OR REPLACE FUNCTION get_doctor_availability(doctor_id TEXT, appointment_date TEXT)
RETURNS TABLE (
  doctor_id TEXT,
  date TEXT,
  available_slots JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    $1 as doctor_id,
    $2 as date,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'time', slot->>'time',
        'capacity', (slot->>'capacity')::INT,
        'booked', COALESCE(COUNT(a.id), 0)
      )
    ) as available_slots
  FROM (
    SELECT JSON_EACH(d.weekly_schedule->(EXTRACT(DOW FROM DATE($2))::INT)::TEXT) as slot
    FROM public.doctors d
    WHERE d.id = $1
  ) slots
  LEFT JOIN public.appointments a ON 
    a.doctor_id = $1 
    AND a.date = $2 
    AND a.time = slots.slot->>'time';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles (Users can see their own profile)
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for clinics (Public read, allow updates for demo)
CREATE POLICY "Clinics are publicly readable" ON public.clinics
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow clinic updates" ON public.clinics
  FOR UPDATE USING (TRUE);

-- Policies for doctors (Allow all operations for demo)
CREATE POLICY "Doctors allow all" ON public.doctors
  FOR ALL USING (TRUE);

-- Policies for patients (Allow all operations for demo)
CREATE POLICY "Patients allow all" ON public.patients
  FOR ALL USING (TRUE);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ============================================================================

-- Unrestrict realtime for public tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- ============================================================================
-- NOTES FOR PRODUCTION
-- ============================================================================

/*
IMPORTANT: After running this schema:

1. Update auth settings in Supabase Dashboard:
   - Project Settings > Authentication
   - Enable email/password authentication
   - Optional: Enable phone OTP authentication

2. Configure email templates:
   - Project Settings > Email Templates
   - Update confirmation, recovery, and invite emails

3. Set up storage buckets:
   - Create "clinic-images" bucket for clinic photos
   - Create "doctor-avatars" bucket for doctor photos
   - Create "patient-documents" bucket for medical records

4. Configure CORS if using REST API externally

5. Set up webhook for automated tasks (optional):
   - Patient completion notifications
   - Appointment reminders
   - Queue alerts

6. Monitor performance:
   - Check slow queries in Database > Logs
   - Monitor RLS policy performance
   - Track Realtime connections in Logs
*/
