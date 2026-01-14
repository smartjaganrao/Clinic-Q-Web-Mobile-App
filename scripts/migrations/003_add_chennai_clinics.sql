-- Migration: Add all clinics and doctors from constants.ts to Supabase
-- Run this on the Supabase SQL editor or via psql connected to your DB

BEGIN;

-- Clear existing data to ensure clean state
DELETE FROM public.doctors WHERE clinic_id IN ('clinic_apollo_anna_nagar', 'clinic_child_care', 'clinic_parasu_dental', 'clinic_malar_fortis', 'clinic_skin_care', 'clinic_avadi_health_center', 'clinic_ambattur_ortho', 'clinic_t_nagar_family');
DELETE FROM public.clinics WHERE id IN ('clinic_apollo_anna_nagar', 'clinic_child_care', 'clinic_parasu_dental', 'clinic_malar_fortis', 'clinic_skin_care', 'clinic_avadi_health_center', 'clinic_ambattur_ortho', 'clinic_t_nagar_family');

-- Insert Apollo Clinic (Anna Nagar)
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_apollo_anna_nagar',
    'Apollo Clinic',
    'apollo-clinic-anna-nagar',
    'Chennai',
    'AB-12, 2nd Ave, Anna Nagar',
    '600040',
    'GENERAL',
    'Premium',
    'HYBRID_FULL',
    true,
    'Asia/Kolkata',
    '08:00 AM - 10:00 PM',
    '{"lat": 13.0850, "lng": 80.2100}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "08:00", "end": "22:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "08:00", "end": "22:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "08:00", "end": "22:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "08:00", "end": "22:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "08:00", "end": "22:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "09:00", "end": "21:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-26261234',
    'Apollo Clinic provides comprehensive healthcare services with modern facilities and experienced doctors.',
    ARRAY['Pharmacy', 'Lab', 'X-Ray', 'Parking', 'Wheelchair', 'WiFi'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Apollo Clinic
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_1_1',
    'master_arun',
    'clinic_apollo_anna_nagar',
    'Dr. Arun Kumar',
    '9000000001',
    'arun@apollo.com',
    'General Physician',
    '101',
    true,
    'AVAILABLE',
    600,
    15,
    4.8,
    120,
    'Dr. Arun Kumar is a dedicated General Physician with over 12 years of experience in treating a wide range of medical conditions.',
    ARRAY['MBBS', 'MD'],
    ARRAY['English', 'Tamil', 'Hindi'],
    12,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId1", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId2", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId3", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId4", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId5", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId6", "startTime": "10:00", "endTime": "14:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_1_2',
    'master_rajesh',
    'clinic_apollo_anna_nagar',
    'Dr. Rajesh Iyer',
    '9000000003',
    'rajesh@apollo.com',
    'Cardiologist',
    '102',
    true,
    'AVAILABLE',
    800,
    20,
    4.9,
    200,
    'Dr. Rajesh Iyer is a highly experienced Cardiologist with 15 years in the field.',
    ARRAY['MBBS', 'DM (Cardio)'],
    ARRAY['English', 'Tamil'],
    15,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId7", "startTime": "17:00", "endTime": "21:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId8", "startTime": "17:00", "endTime": "21:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId9", "startTime": "17:00", "endTime": "21:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId10", "startTime": "17:00", "endTime": "21:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId11", "startTime": "17:00", "endTime": "21:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId12", "startTime": "15:00", "endTime": "19:00", "label": "Evening Cardio", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_1_3',
    'master_anand',
    'clinic_apollo_anna_nagar',
    'Dr. Anand Raj',
    '9000000009',
    'anand@apollo.com',
    'Emergency Physician',
    'ER-1',
    true,
    'AVAILABLE',
    1000,
    15,
    4.9,
    75,
    'Dr. Anand Raj is a sharp and responsive Emergency Physician with 7 years of experience in a high-volume ER setting.',
    ARRAY['MBBS', 'MD (Emergency Med)'],
    ARRAY['English', 'Tamil'],
    7,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId13", "startTime": "22:00", "endTime": "02:00", "label": "Night Shift", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId14", "startTime": "22:00", "endTime": "02:00", "label": "Night Shift", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId15", "startTime": "22:00", "endTime": "02:00", "label": "Night Shift", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId16", "startTime": "22:00", "endTime": "02:00", "label": "Night Shift", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId17", "startTime": "22:00", "endTime": "02:00", "label": "Night Shift", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert Little Smiles Pediatric
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_child_care',
    'Little Smiles Pediatric',
    'little-smiles-velachery',
    'Chennai',
    '45, 100ft Road, Velachery',
    '600042',
    'PEDIATRIC',
    'Small Hospital',
    'ONLINE_WALK_IN',
    true,
    'Asia/Kolkata',
    '04:00 PM - 09:00 PM',
    '{"lat": 12.9800, "lng": 80.2200}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "16:30", "end": "20:30"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-22441234',
    'Little Smiles Pediatric specializes in children''s healthcare with a focus on vaccination and pediatric care.',
    ARRAY['Play Area', 'Vaccination', 'Nebulizer'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Little Smiles Pediatric
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_2_1',
    'master_anita',
    'clinic_child_care',
    'Dr. Anita Desai',
    '9000000004',
    'anita@smiles.com',
    'Pediatrician',
    'A',
    true,
    'AVAILABLE',
    500,
    15,
    4.9,
    350,
    'Dr. Anita Desai is a friendly and caring Pediatrician with 6 years of experience.',
    ARRAY['MBBS', 'MD (Ped)'],
    ARRAY['English', 'Hindi'],
    6,
    'Female',
    '[{"day": "Monday", "slots": [{"id": "genId18", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId19", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId20", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId21", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId22", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId23", "startTime": "16:30", "endTime": "20:30", "label": "Evening Clinic", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert Parasu Dental Centre
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_parasu_dental',
    'Parasu Dental Centre',
    'parasu-dental-adyar',
    'Chennai',
    '12, LB Road, Adyar',
    '600020',
    'DENTAL',
    'Solo Clinic',
    'DIRECT_WALK_IN',
    true,
    'Asia/Kolkata',
    '10:00 AM - 08:00 PM',
    '{"lat": 13.0012, "lng": 80.2565}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "20:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "20:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "20:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "20:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "20:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "16:00", "end": "18:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-24441234',
    'Parasu Dental Centre provides comprehensive dental care with modern equipment and experienced dentists.',
    ARRAY['X-Ray', 'Root Canal', 'Whitening'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Parasu Dental Centre
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_3_1',
    'master_vikram',
    'clinic_parasu_dental',
    'Dr. Vikram Singh',
    '9000000007',
    'vikram@parasu.com',
    'Dentist',
    '1',
    true,
    'AVAILABLE',
    300,
    20,
    4.6,
    85,
    'Dr. Vikram Singh is a proficient Dentist with 9 years of experience.',
    ARRAY['BDS', 'MDS'],
    ARRAY['English', 'Tamil'],
    9,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId24", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId25", "startTime": "16:00", "endTime": "20:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId26", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId27", "startTime": "16:00", "endTime": "20:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId28", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId29", "startTime": "16:00", "endTime": "20:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId30", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId31", "startTime": "16:00", "endTime": "20:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId32", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId33", "startTime": "16:00", "endTime": "20:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId34", "startTime": "10:00", "endTime": "14:00", "label": "Morning Session", "active": true, "mode": "WALK_IN"}, {"id": "genId35", "startTime": "16:00", "endTime": "18:00", "label": "Evening Session", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert Fortis Malar Hospital
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_malar_fortis',
    'Fortis Malar Hospital',
    'fortis-malar-adyar',
    'Chennai',
    '52, 1st Main Rd, Gandhi Nagar, Adyar',
    '600020',
    'EMERGENCY',
    'Premium',
    'HYBRID_FULL',
    true,
    'Asia/Kolkata',
    '24 hours',
    '{"lat": 13.0067, "lng": 80.2585}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}, {"dayOfWeek": "SUN", "isOpen": true, "shifts": [{"start": "00:00", "end": "23:59"}]}]',
    '044-28111234',
    'Fortis Malar Hospital provides 24/7 emergency care and comprehensive medical services.',
    ARRAY['Emergency', 'ICU', 'Ambulance', 'Cafeteria', 'Pharmacy'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Fortis Malar Hospital
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_4_1',
    'master_arun',
    'clinic_malar_fortis',
    'Dr. Arun Kumar',
    '9000000001',
    'arun@fortis.com',
    'General Physician',
    'OPD-1',
    true,
    'OFF_DUTY',
    700,
    10,
    4.8,
    300,
    'Dr. Arun Kumar is a dedicated General Physician with over 12 years of experience.',
    ARRAY['MBBS', 'MD'],
    ARRAY['English', 'Tamil', 'Hindi'],
    12,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId36", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId37", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId38", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId39", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId40", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId41", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Sunday", "slots": [{"id": "genId42", "startTime": "17:00", "endTime": "21:00", "label": "Evening OPD", "active": true, "mode": "HYBRID"}], "isOff": false}]',
    NOW(),
    NOW()
),
(
    'doc_4_2',
    'master_suresh',
    'clinic_malar_fortis',
    'Dr. Suresh Reddy',
    '9000000005',
    'suresh@fortis.com',
    'Orthopedic',
    'OPD-5',
    true,
    'AVAILABLE',
    900,
    20,
    4.7,
    450,
    'Dr. Suresh Reddy is a renowned Orthopedic Surgeon with 20 years of experience.',
    ARRAY['MBBS', 'MS (Ortho)'],
    ARRAY['English', 'Telugu'],
    20,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId43", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId44", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId45", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId46", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId47", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId48", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Sunday", "slots": [{"id": "genId49", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}], "isOff": false}]',
    NOW(),
    NOW()
);

-- Insert Glow Skin Clinic
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_skin_care',
    'Glow Skin Clinic',
    'glow-skin-t-nagar',
    'Chennai',
    '15, North Boag Road, T. Nagar',
    '600017',
    'DERMATOLOGY',
    'Small Hospital',
    'HYBRID_DIRECT_APPT',
    true,
    'Asia/Kolkata',
    '10:00 AM - 07:00 PM',
    '{"lat": 13.0400, "lng": 80.2350}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "11:00", "end": "18:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-28341234',
    'Glow Skin Clinic specializes in dermatology and cosmetic treatments with advanced technology.',
    ARRAY['Laser', 'Facial', 'Cosmetology'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Glow Skin Clinic
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_5_1',
    'master_meera',
    'clinic_skin_care',
    'Dr. Meera Patel',
    '9000000006',
    'meera@glow.com',
    'Dermatologist',
    '1',
    true,
    'AVAILABLE',
    750,
    20,
    4.9,
    150,
    'Dr. Meera Patel is a skilled Dermatologist with 5 years of experience.',
    ARRAY['MBBS', 'DDVL'],
    ARRAY['English', 'Gujarati'],
    5,
    'Female',
    '[{"day": "Monday", "slots": [{"id": "genId50", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId51", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId52", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId53", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId54", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId55", "startTime": "11:00", "endTime": "18:00", "label": "Day Shift", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert Avadi Health Center
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_avadi_health_center',
    'Avadi Health Center',
    'avadi-health-center',
    'Chennai',
    '123, Main Road, Avadi',
    '600054',
    'GENERAL',
    'Small Hospital',
    'HYBRID_FULL',
    true,
    'Asia/Kolkata',
    '09:00 AM - 10:00 PM',
    '{"lat": 13.1143, "lng": 80.0978}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "22:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "22:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "22:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "22:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "22:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "15:00", "end": "19:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-26351234',
    'Avadi Health Center provides comprehensive healthcare services with modern facilities and experienced doctors. We offer both walk-in and appointment-based consultations.',
    ARRAY['Pharmacy', 'Lab', 'X-Ray', 'Parking', 'WiFi', 'Emergency Care'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Avadi Health Center
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_6_1',
    'master_priya',
    'clinic_avadi_health_center',
    'Dr. Priya Sharma',
    '9000000010',
    'priya@avadihealth.com',
    'Gynecologist',
    '101',
    true,
    'AVAILABLE',
    550,
    15,
    4.7,
    95,
    'Dr. Priya Sharma is a compassionate Gynecologist with 8 years of experience. She specializes in women''s health, providing expert care in obstetrics and gynecology.',
    ARRAY['MBBS', 'MS (OBG)'],
    ARRAY['English', 'Hindi'],
    8,
    'Female',
    '[{"day": "Monday", "slots": [{"id": "genId1", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId2", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId3", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId4", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId5", "startTime": "09:00", "endTime": "13:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId6", "startTime": "10:00", "endTime": "14:00", "label": "Morning OPD", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_6_2',
    'master_sanjay',
    'clinic_avadi_health_center',
    'Dr. Sanjay Gupta',
    '9000000011',
    'sanjay@avadihealth.com',
    'ENT Specialist',
    '102',
    true,
    'AVAILABLE',
    650,
    20,
    4.8,
    110,
    'Dr. Sanjay Gupta is an experienced ENT Specialist with 11 years in practice. He provides comprehensive care for ear, nose, and throat conditions in both adults and children.',
    ARRAY['MBBS', 'MS (ENT)'],
    ARRAY['English', 'Hindi'],
    11,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId7", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId8", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId9", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId10", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId11", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId12", "startTime": "15:00", "endTime": "19:00", "label": "Afternoon ENT", "active": true, "mode": "APPOINTMENT"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_6_3',
    'master_vikram',
    'clinic_avadi_health_center',
    'Dr. Vikram Singh',
    '9000000012',
    'vikram@avadihealth.com',
    'Dentist',
    '103',
    true,
    'AVAILABLE',
    400,
    15,
    4.6,
    85,
    'Dr. Vikram Singh is a proficient Dentist with 9 years of experience. He is committed to providing high-quality dental care, from routine check-ups to complex procedures.',
    ARRAY['BDS', 'MDS'],
    ARRAY['English', 'Tamil'],
    9,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId13", "startTime": "19:00", "endTime": "22:00", "label": "Evening Dental", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId14", "startTime": "19:00", "endTime": "22:00", "label": "Evening Dental", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId15", "startTime": "19:00", "endTime": "22:00", "label": "Evening Dental", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId16", "startTime": "19:00", "endTime": "22:00", "label": "Evening Dental", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId17", "startTime": "19:00", "endTime": "22:00", "label": "Evening Dental", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert Ambattur Orthopedic Clinic
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_ambattur_ortho',
    'Ambattur Orthopedic Clinic',
    'ambattur-orthopedic-clinic',
    'Chennai',
    '456, North Street, Ambattur',
    '600053',
    'ORTHOPEDIC',
    'Solo Clinic',
    'HYBRID_DIRECT_APPT',
    true,
    'Asia/Kolkata',
    '08:00 AM - 08:00 PM',
    '{"lat": 13.1186, "lng": 80.1574}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}, {"start": "18:00", "end": "20:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}, {"start": "18:00", "end": "20:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}, {"start": "18:00", "end": "20:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}, {"start": "18:00", "end": "20:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}, {"start": "18:00", "end": "20:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-26541234',
    'Specialized orthopedic care in Ambattur. We provide treatment for bone and joint issues with advanced equipment and experienced surgeons.',
    ARRAY['X-Ray', 'Physiotherapy', 'Parking', 'Wheelchair', 'Lab'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for Ambattur Orthopedic Clinic
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_7_1',
    'master_suresh',
    'clinic_ambattur_ortho',
    'Dr. Suresh Reddy',
    '9000000013',
    'suresh@ambatturortho.com',
    'Orthopedic',
    '1',
    true,
    'AVAILABLE',
    800,
    20,
    4.7,
    150,
    'Dr. Suresh Reddy is a renowned Orthopedic Surgeon with 20 years of experience. He specializes in joint replacement and sports injuries, helping patients regain mobility and quality of life.',
    ARRAY['MBBS', 'MS (Ortho)'],
    ARRAY['English', 'Telugu'],
    20,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId18", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId19", "startTime": "13:00", "endTime": "17:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId20", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId21", "startTime": "13:00", "endTime": "17:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId22", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId23", "startTime": "13:00", "endTime": "17:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId24", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId25", "startTime": "13:00", "endTime": "17:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId26", "startTime": "08:00", "endTime": "12:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId27", "startTime": "13:00", "endTime": "17:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId28", "startTime": "09:00", "endTime": "13:00", "label": "Morning Ortho", "active": true, "mode": "APPOINTMENT"}, {"id": "genId29", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Ortho", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_7_2',
    'master_anand',
    'clinic_ambattur_ortho',
    'Dr. Anand Raj',
    '9000000014',
    'anand@ambatturortho.com',
    'Emergency Physician',
    '2',
    true,
    'AVAILABLE',
    900,
    15,
    4.9,
    75,
    'Dr. Anand Raj is a sharp and responsive Emergency Physician with 7 years of experience in a high-volume ER setting. He excels in critical care and life-saving interventions.',
    ARRAY['MBBS', 'MD (Emergency Med)'],
    ARRAY['English', 'Tamil'],
    7,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId30", "startTime": "18:00", "endTime": "20:00", "label": "Evening Emergency", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId31", "startTime": "18:00", "endTime": "20:00", "label": "Evening Emergency", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId32", "startTime": "18:00", "endTime": "20:00", "label": "Evening Emergency", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId33", "startTime": "18:00", "endTime": "20:00", "label": "Evening Emergency", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId34", "startTime": "18:00", "endTime": "20:00", "label": "Evening Emergency", "active": true, "mode": "HYBRID"}], "isOff": false}, {"day": "Saturday", "slots": [], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

-- Insert T. Nagar Family Clinic
INSERT INTO public.clinics (id, name, slug, city, address, pincode, type, plan, operation_mode, enable_advance_booking, timezone, operating_hours, geo_location, working_hours, contact_phone, about, amenities, subscription_status, created_at, updated_at)
VALUES (
    'clinic_t_nagar_family',
    'T. Nagar Family Clinic',
    't-nagar-family-clinic',
    'Chennai',
    '78, South Usman Road, T. Nagar',
    '600017',
    'GENERAL',
    'Small Hospital',
    'BOTH_WALK_IN',
    false,
    'Asia/Kolkata',
    '09:00 AM - 08:00 PM',
    '{"lat": 13.0410, "lng": 80.2340}',
    '[{"dayOfWeek": "MON", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "20:00"}]}, {"dayOfWeek": "TUE", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "20:00"}]}, {"dayOfWeek": "WED", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "20:00"}]}, {"dayOfWeek": "THU", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "20:00"}]}, {"dayOfWeek": "FRI", "isOpen": true, "shifts": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}, {"start": "19:00", "end": "20:00"}]}, {"dayOfWeek": "SAT", "isOpen": true, "shifts": [{"start": "10:00", "end": "14:00"}, {"start": "15:00", "end": "18:00"}]}, {"dayOfWeek": "SUN", "isOpen": false, "shifts": []}]',
    '044-28123456',
    'T. Nagar Family Clinic offers comprehensive family healthcare with both walk-in and online token booking options. We provide quality medical care for all ages.',
    ARRAY['Pharmacy', 'Lab', 'Parking', 'WiFi', 'Family Counseling'],
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert doctors for T. Nagar Family Clinic
INSERT INTO public.doctors (id, master_id, clinic_id, name, mobile, email, specialty, room_number, is_available, status, consultation_fee, consultation_time, rating, review_count, bio, education, languages, experience, gender, weekly_schedule, created_at, updated_at)
VALUES
(
    'doc_8_1',
    'master_meera',
    'clinic_t_nagar_family',
    'Dr. Meera Patel',
    '9000000015',
    'meera@tnagarfamily.com',
    'Dermatologist',
    '1',
    true,
    'AVAILABLE',
    450,
    15,
    4.8,
    120,
    'Dr. Meera Patel is a skilled Dermatologist with 5 years of experience. She offers expert care for a variety of skin conditions, with a special interest in cosmetic dermatology.',
    ARRAY['MBBS', 'DDVL'],
    ARRAY['English', 'Gujarati'],
    5,
    'Female',
    '[{"day": "Monday", "slots": [{"id": "genId34", "startTime": "09:00", "endTime": "13:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId35", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId36", "startTime": "09:00", "endTime": "13:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId37", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId38", "startTime": "09:00", "endTime": "13:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId39", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId40", "startTime": "09:00", "endTime": "13:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId41", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId42", "startTime": "09:00", "endTime": "13:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId43", "startTime": "14:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [{"id": "genId44", "startTime": "10:00", "endTime": "14:00", "label": "Morning Walk-in", "active": true, "mode": "WALK_IN"}, {"id": "genId45", "startTime": "15:00", "endTime": "18:00", "label": "Afternoon Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
),
(
    'doc_8_2',
    'master_vikram',
    'clinic_t_nagar_family',
    'Dr. Vikram Singh',
    '9000000016',
    'vikram@tnagarfamily.com',
    'Dentist',
    '2',
    true,
    'AVAILABLE',
    350,
    15,
    4.7,
    90,
    'Dr. Vikram Singh is a proficient Dentist with 9 years of experience. He is committed to providing high-quality dental care, from routine check-ups to complex procedures.',
    ARRAY['BDS', 'MDS'],
    ARRAY['English', 'Tamil'],
    9,
    'Male',
    '[{"day": "Monday", "slots": [{"id": "genId46", "startTime": "19:00", "endTime": "20:00", "label": "Evening Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Tuesday", "slots": [{"id": "genId47", "startTime": "19:00", "endTime": "20:00", "label": "Evening Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Wednesday", "slots": [{"id": "genId48", "startTime": "19:00", "endTime": "20:00", "label": "Evening Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Thursday", "slots": [{"id": "genId49", "startTime": "19:00", "endTime": "20:00", "label": "Evening Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Friday", "slots": [{"id": "genId50", "startTime": "19:00", "endTime": "20:00", "label": "Evening Walk-in", "active": true, "mode": "WALK_IN"}], "isOff": false}, {"day": "Saturday", "slots": [], "isOff": false}, {"day": "Sunday", "slots": [], "isOff": true}]',
    NOW(),
    NOW()
);

COMMIT;

-- Note: This migration adds all 8 clinics from constants.ts to Supabase with complete doctor data.
-- Clinics included: Apollo Clinic, Little Smiles Pediatric, Parasu Dental, Fortis Malar, Glow Skin Clinic, Avadi Health Center, Ambattur Orthopedic, T. Nagar Family Clinic
-- The working_hours and weekly_schedule include various shift types: morning, afternoon, evening, night.
-- All required columns are populated as per the schema.
-- All clinic operation modes are represented: DIRECT_WALK_IN, ONLINE_WALK_IN, BOTH_WALK_IN, HYBRID_DIRECT_APPT, HYBRID_FULL.