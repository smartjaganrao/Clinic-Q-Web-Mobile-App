/**
 * DATA MIGRATION GUIDE
 * How to migrate existing mock data and users to Supabase
 */

// ============================================================================
// PART 1: MIGRATE CLINICS FROM CONSTANTS.TS
// ============================================================================

/**
 * Function to migrate clinics from INITIAL_CLINICS to Supabase
 * 
 * Steps:
 * 1. Export INITIAL_CLINICS from constants.ts
 * 2. Run this migration function once (in a utility/admin script)
 * 3. Verify data in Supabase dashboard
 * 4. Remove migration script
 * 
 * Implementation:
 */

import { backendManager, clinicService } from './services/backendManager';
import { INITIAL_CLINICS } from './constants';
import { Clinic } from './types';

export const migrateClinicsToSupabase = async (): Promise<void> => {
  try {
    console.log(`🚀 Starting clinic migration... (${INITIAL_CLINICS.length} clinics)`);

    for (const clinic of INITIAL_CLINICS) {
      // Check if clinic already exists
      const existing = await clinicService.getClinicById(clinic.id);
      if (existing) {
        console.log(`⏭️  Clinic ${clinic.name} already exists, skipping...`);
        continue;
      }

      // Insert clinic
      const result = await clinicService.createClinic({
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        city: clinic.city,
        address: clinic.address,
        pincode: clinic.pincode,
        type: clinic.type,
        plan: clinic.plan,
        operationMode: clinic.operationMode,
        enableAdvanceBooking: clinic.enableAdvanceBooking,
        timezone: clinic.timezone,
        operatingHours: clinic.operatingHours,
        imageUrl: clinic.imageUrl,
        about: clinic.about,
        amenities: clinic.amenities,
        subscriptionStatus: clinic.subscriptionStatus,
        geoLocation: clinic.geoLocation,
        workingHours: clinic.workingHours,
        doctors: [],
        patients: [],
        staff: []
      });

      if (result.success) {
        console.log(`✅ Migrated clinic: ${clinic.name}`);
      } else {
        console.error(`❌ Failed to migrate clinic ${clinic.name}:`, result.error);
      }
    }

    console.log('✅ Clinic migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ============================================================================
// PART 2: MIGRATE DOCTORS
// ============================================================================

/**
 * Function to migrate doctors to Supabase
 * Assumes doctors are nested in INITIAL_CLINICS
 */

import { doctorService } from './services/backendManager';

export const migrateDoctorsToSupabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting doctor migration...');

    for (const clinic of INITIAL_CLINICS) {
      console.log(`  Processing doctors in ${clinic.name}...`);

      for (const doctor of clinic.doctors) {
        // Check if already exists
        const existing = await doctorService.getDoctorById(doctor.id);
        if (existing) {
          console.log(`  ⏭️  Doctor ${doctor.name} already exists, skipping...`);
          continue;
        }

        // Insert doctor
        const result = await doctorService.createDoctor({
          ...doctor,
          clinicId: clinic.id // Add clinic association
        });

        if (result.success) {
          console.log(`  ✅ Migrated doctor: ${doctor.name}`);
        } else {
          console.error(`  ❌ Failed to migrate doctor ${doctor.name}:`, result.error);
        }
      }
    }

    console.log('✅ Doctor migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ============================================================================
// PART 3: MIGRATE PATIENTS FROM LOCALSTORAGE
// ============================================================================

/**
 * Function to migrate patient data from localStorage to Supabase
 * This handles existing patient registrations
 */

import { authService, patientService } from './services/backendManager';

export const migratePatientAuthToSupabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting patient authentication migration...');

    // Get all localStorage keys with pattern "clinicq_patient_*"
    const patientKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('clinicq_patient_')
    );

    console.log(`Found ${patientKeys.length} patients in localStorage`);

    for (const key of patientKeys) {
      try {
        const patientData = JSON.parse(localStorage.getItem(key) || '{}');
        const { name, email, phone, password, isVerified } = patientData;

        // Check if user already exists in Supabase
        const existingUser = await authService.getSupabase()?.auth.admin?.listUsers();
        const userExists = existingUser?.data?.users?.some(u => u.email === email);

        if (userExists) {
          console.log(`⏭️  Patient ${email} already in Supabase, skipping...`);
          continue;
        }

        // Create user in Supabase
        const result = await authService.signup({
          email,
          password: password || 'default-password-123', // Handle old records
          name,
          phone,
          role: 'PATIENT'
        });

        if (result.success) {
          console.log(`✅ Migrated patient: ${email}`);
        } else {
          console.error(`❌ Failed to migrate patient ${email}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error processing patient ${key}:`, error);
      }
    }

    console.log('✅ Patient migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ============================================================================
// PART 4: MIGRATE EXISTING QUEUE DATA
// ============================================================================

/**
 * Function to migrate existing patient queue data
 * This handles patients currently in queue (from localStorage)
 */

export const migrateQueueDataToSupabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting queue data migration...');

    // Get all clinics from Supabase
    const clinics = await clinicService.getAllClinics();

    for (const clinic of clinics) {
      console.log(`  Processing queue in ${clinic.name}...`);

      // Process patients from original clinic object (if you have it)
      // This is a placeholder - adapt based on where queue data currently is stored
      if (clinic.patients && clinic.patients.length > 0) {
        for (const patient of clinic.patients) {
          // Check if patient already exists
          const existing = await patientService.getPatientById(patient.id);
          if (existing) {
            console.log(`  ⏭️  Patient ${patient.name} already in queue, skipping...`);
            continue;
          }

          // Add patient to queue
          const result = await patientService.addPatient(clinic.id, patient);

          if (result.success) {
            console.log(`  ✅ Migrated queue patient: ${patient.name}`);
          } else {
            console.error(`  ❌ Failed to migrate patient ${patient.name}:`, result.error);
          }
        }
      }
    }

    console.log('✅ Queue migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ============================================================================
// PART 5: COMPLETE MIGRATION RUNNER
// ============================================================================

/**
 * Run all migrations in sequence
 * Call this ONCE when transitioning from mock data to Supabase
 */

export const runCompleteDataMigration = async (): Promise<void> => {
  try {
    console.log('\n====================================');
    console.log('🚀 COMPLETE DATA MIGRATION START 🚀');
    console.log('====================================\n');

    // Step 1: Initialize backend
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await backendManager.initialize(supabaseUrl, supabaseKey);
    console.log('✅ Backend initialized\n');

    // Step 2: Migrate clinics
    console.log('--- STEP 1: Migrate Clinics ---');
    await migrateClinicsToSupabase();
    console.log('');

    // Step 3: Migrate doctors
    console.log('--- STEP 2: Migrate Doctors ---');
    await migrateDoctorsToSupabase();
    console.log('');

    // Step 4: Migrate patient authentication
    console.log('--- STEP 3: Migrate Patient Accounts ---');
    await migratePatientAuthToSupabase();
    console.log('');

    // Step 5: Migrate queue data
    console.log('--- STEP 4: Migrate Queue Data ---');
    await migrateQueueDataToSupabase();
    console.log('');

    console.log('====================================');
    console.log('✅ MIGRATION COMPLETE! ✅');
    console.log('====================================');
    console.log('\nNext steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Test all features');
    console.log('3. Remove localStorage references from code');
    console.log('4. Remove mock data (constants.ts)');
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
    throw error;
  }
};

// ============================================================================
// PART 6: ADMIN UTILITY - HOW TO RUN
// ============================================================================

/**
 * Create a file: src/utils/runMigration.ts
 * 
 * Then in App.tsx, add a temporary button (remove after migration):
 * 
 * <button 
 *   onClick={async () => {
 *     if (window.confirm('Run data migration? This should only be done once!')) {
 *       await runCompleteDataMigration();
 *     }
 *   }}
 *   style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}
 * >
 *   🔧 Run Migration
 * </button>
 * 
 * Or run in browser console:
 * 
 * import { runCompleteDataMigration } from './utils/runMigration';
 * await runCompleteDataMigration();
 */

// ============================================================================
// PART 7: VERIFY MIGRATION
// ============================================================================

/**
 * Checklist after migration:
 * 
 * ☐ All clinics appear in Supabase > Clinics table
 * ☐ All doctors appear in Supabase > Doctors table
 * ☐ All patients appear in Supabase > Patients table
 * ☐ Patient auth works with Supabase authentication
 * ☐ Queue displays correctly from database
 * ☐ Realtime updates work
 * ☐ Search functionality works
 * ☐ Appointments can be booked
 * ☐ Doctor schedules are intact
 * ☐ No data loss
 */

// ============================================================================
// PART 8: CLEANUP AFTER MIGRATION
// ============================================================================

/**
 * After successful migration and verification:
 * 
 * 1. Remove migration scripts from codebase
 * 2. Remove mock data dependencies:
 *    - Delete/comment out INITIAL_CLINICS from constants.ts
 *    - Remove seedMockDataIfFirstLoad() calls
 *    - Remove MASTER_DOCTORS if not used elsewhere
 * 
 * 3. Remove localStorage references:
 *    - Find all localStorage.getItem() calls
 *    - Find all localStorage.setItem() calls
 *    - Replace with service methods
 * 
 * 4. Clean up:
 *    - Remove mockData.ts file
 *    - Remove migration utilities
 *    - Remove temporary admin buttons
 * 
 * 5. Test thoroughly:
 *    - Fresh install (clear all cache)
 *    - Sign up new user
 *    - Add patient to queue
 *    - Complete patient flow
 *    - Test all role-based access
 */

export const MIGRATION_CHECKLIST = [
  'Set up Supabase project',
  'Run SQL schema setup',
  'Configure environment variables',
  'Initialize backendManager',
  'Run data migration',
  'Verify all data in dashboard',
  'Test complete user flows',
  'Remove mock data references',
  'Remove localStorage dependencies',
  'Deploy to staging',
  'Final testing',
  'Deploy to production'
];
