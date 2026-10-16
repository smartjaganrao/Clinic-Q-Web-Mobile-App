/**
 * SUPABASE SEED DATA - TEST USERS
 * ============================================================
 * STEP 1: Run SUPABASE_SCHEMA_FIXED.sql first (creates tables)
 * STEP 2: Create Auth users via Dashboard (see instructions below)
 * STEP 3: Run THIS file to populate user_profiles & clinic data
 * ============================================================
 *
 * HOW TO CREATE AUTH USERS IN SUPABASE DASHBOARD:
 * 1. Go to https://supabase.com → your project
 * 2. Authentication → Users → "Add user" button
 * 3. Create each user below with the email & password shown
 * 4. After creating all users, copy their UUIDs into this file
 * ============================================================
 */

-- ============================================================================
-- REPLACE THESE UUIDs with the ones from your Supabase Auth dashboard
-- (After creating auth users, go to Authentication → Users → copy UUID)
-- ============================================================================

DO $$
DECLARE
  -- Auth User UUIDs (replace with real ones from Supabase Auth dashboard)
  admin_uuid     UUID := gen_random_uuid();   -- admin@smartqflow.com
  doc1_uuid      UUID := gen_random_uuid();   -- doctor1@smartqflow.com
  doc2_uuid      UUID := gen_random_uuid();   -- doctor2@smartqflow.com
  recep_uuid     UUID := gen_random_uuid();   -- reception@smartqflow.com
  patient1_uuid  UUID := gen_random_uuid();   -- demo@patient.com
  patient2_uuid  UUID := gen_random_uuid();   -- ravi@patient.com
  patient3_uuid  UUID := gen_random_uuid();   -- lakshmi@patient.com
  clinic_id      TEXT := 'clinic_smartqflow_demo_001';
BEGIN

-- ============================================================================
-- INSERT DEMO CLINIC
-- ============================================================================
INSERT INTO public.clinics (
  id, name, slug, city, address, pincode,
  type, plan, operation_mode, enable_advance_booking,
  timezone, operating_hours, contact_phone, about,
  amenities, subscription_status, geo_location, metadata
) VALUES (
  clinic_id,
  'SmartQFlow Demo Clinic',
  'smartqflow-demo',
  'Chennai',
  '42, Anna Salai, Teynampet',
  '600018',
  'GENERAL',
  'SMALL',
  'HYBRID_FULL',
  true,
  'Asia/Kolkata',
  '09:00 AM - 09:00 PM',
  '+91 98765 43210',
  'A premier multi-specialty clinic offering comprehensive healthcare services with live queue management.',
  '["Pharmacy","Parking","Wheelchair Access","Air Conditioning","WiFi","Lab"]',
  'ACTIVE',
  '{"lat": 13.0569, "lng": 80.2425}',
  '{"tier": "demo", "maxDoctors": 5}'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- INSERT USER PROFILES
-- (Run AFTER creating auth users and copying their UUIDs above)
-- ============================================================================

-- ADMIN (Clinic Owner)
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (admin_uuid, 'admin@smartqflow.com', '9876543210', 'SmartQFlow Admin', 'ADMIN', clinic_id, true)
ON CONFLICT (email) DO NOTHING;

-- DOCTOR 1
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (doc1_uuid, 'doctor1@smartqflow.com', '9876500001', 'Dr. Arjun Mehta', 'DOCTOR', clinic_id, true)
ON CONFLICT (email) DO NOTHING;

-- DOCTOR 2
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (doc2_uuid, 'doctor2@smartqflow.com', '9876500002', 'Dr. Priya Sharma', 'DOCTOR', clinic_id, true)
ON CONFLICT (email) DO NOTHING;

-- RECEPTIONIST
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (recep_uuid, 'reception@smartqflow.com', '9876500003', 'Kavitha R', 'RECEPTIONIST', clinic_id, true)
ON CONFLICT (email) DO NOTHING;

-- PATIENT 1 (Demo)
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (patient1_uuid, 'demo@patient.com', '9000000001', 'Demo Patient', 'PATIENT', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- PATIENT 2
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (patient2_uuid, 'ravi@patient.com', '9500012345', 'Ravi Kumar', 'PATIENT', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- PATIENT 3
INSERT INTO public.user_profiles (id, email, phone, name, role, clinic_id, is_verified)
VALUES (patient3_uuid, 'lakshmi@patient.com', '9500054321', 'Lakshmi Devi', 'PATIENT', NULL, true)
ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- INSERT DOCTORS
-- ============================================================================
INSERT INTO public.doctors (
  id, clinic_id, master_id, name, specialty, room_number,
  registration_number, mobile, consultation_fee, experience,
  rating, review_count, bio, education, languages, gender,
  avatar_url, status, is_available, delay_minutes,
  weekly_schedule, metadata
) VALUES
(
  'doc_arjun_001', clinic_id, doc1_uuid,
  'Dr. Arjun Mehta', 'General Medicine', 'Room 1',
  'MCI-12345', '9876500001', 500, 10,
  4.8, 213,
  'MBBS, MD (Internal Medicine). 10+ years of experience in general and preventive medicine.',
  '["MBBS","MD - Internal Medicine"]',
  '["English","Tamil","Hindi"]',
  'Male',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
  'AVAILABLE', true, 0,
  '[
    {"day":"Monday","isOff":false,"slots":[{"startTime":"09:00","endTime":"13:00","mode":"HYBRID","active":true},{"startTime":"17:00","endTime":"21:00","mode":"HYBRID","active":true}]},
    {"day":"Tuesday","isOff":false,"slots":[{"startTime":"09:00","endTime":"13:00","mode":"HYBRID","active":true},{"startTime":"17:00","endTime":"21:00","mode":"HYBRID","active":true}]},
    {"day":"Wednesday","isOff":false,"slots":[{"startTime":"09:00","endTime":"13:00","mode":"HYBRID","active":true}]},
    {"day":"Thursday","isOff":false,"slots":[{"startTime":"09:00","endTime":"13:00","mode":"HYBRID","active":true},{"startTime":"17:00","endTime":"21:00","mode":"HYBRID","active":true}]},
    {"day":"Friday","isOff":false,"slots":[{"startTime":"09:00","endTime":"13:00","mode":"HYBRID","active":true},{"startTime":"17:00","endTime":"21:00","mode":"HYBRID","active":true}]},
    {"day":"Saturday","isOff":false,"slots":[{"startTime":"09:00","endTime":"14:00","mode":"WALK_IN","active":true}]},
    {"day":"Sunday","isOff":true,"slots":[]}
  ]',
  '{"specializations":["Diabetes Management","Hypertension","Preventive Care"]}'
),
(
  'doc_priya_002', clinic_id, doc2_uuid,
  'Dr. Priya Sharma', 'Pediatrics', 'Room 2',
  'MCI-67890', '9876500002', 400, 8,
  4.6, 189,
  'MBBS, MD (Pediatrics). Specialist in child healthcare, vaccinations and growth monitoring.',
  '["MBBS","MD - Pediatrics"]',
  '["English","Tamil"]',
  'Female',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
  'ON_BREAK', false, 0,
  '[
    {"day":"Monday","isOff":false,"slots":[{"startTime":"10:00","endTime":"14:00","mode":"HYBRID","active":true},{"startTime":"18:00","endTime":"21:00","mode":"APPOINTMENT","active":true}]},
    {"day":"Tuesday","isOff":false,"slots":[{"startTime":"10:00","endTime":"14:00","mode":"HYBRID","active":true}]},
    {"day":"Wednesday","isOff":true,"slots":[]},
    {"day":"Thursday","isOff":false,"slots":[{"startTime":"10:00","endTime":"14:00","mode":"HYBRID","active":true},{"startTime":"18:00","endTime":"21:00","mode":"APPOINTMENT","active":true}]},
    {"day":"Friday","isOff":false,"slots":[{"startTime":"10:00","endTime":"14:00","mode":"HYBRID","active":true}]},
    {"day":"Saturday","isOff":false,"slots":[{"startTime":"10:00","endTime":"13:00","mode":"APPOINTMENT","active":true}]},
    {"day":"Sunday","isOff":true,"slots":[]}
  ]',
  '{"specializations":["Newborn Care","Vaccination","Child Development"]}'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- INSERT STAFF (Receptionist)
-- ============================================================================
INSERT INTO public.staff (id, clinic_id, name, role, phone, email, password)
VALUES
  ('staff_kavitha_001', clinic_id, 'Kavitha R', 'RECEPTIONIST', '9876500003', 'reception@smartqflow.com', 'Staff@123456'),
  ('staff_admin_001',   clinic_id, 'Admin',     'MANAGER',      '9876543210', 'admin@smartqflow.com',     'Admin@123456')
ON CONFLICT (id) DO NOTHING;


RAISE NOTICE '✅ Seed data inserted successfully!';
RAISE NOTICE '   Clinic ID: %', clinic_id;
RAISE NOTICE '   Admin UUID: %', admin_uuid;
RAISE NOTICE '   Doctor 1 UUID: %', doc1_uuid;
RAISE NOTICE '   Doctor 2 UUID: %', doc2_uuid;
RAISE NOTICE '   Receptionist UUID: %', recep_uuid;

END $$;
