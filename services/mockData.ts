import { INITIAL_CLINICS } from '../constants';

const SEEDED_FLAG_KEY = 'clinicq_seeded_v2';
const DB_KEY = 'clinicq_db_v2';
const SESSION_KEY = 'clinicq_session_v2';

/**
 * Seeds mock data into localStorage on first app load.
 * Safe to call on every startup; it will no-op after initial seed.
 */
export function seedMockDataIfFirstLoad() {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;

  try {
    const alreadySeeded = window.localStorage.getItem(SEEDED_FLAG_KEY) === '1';
    const hasDb = !!window.localStorage.getItem(DB_KEY);

    if (!alreadySeeded || !hasDb) {
      // Seed the core database used across the app
      window.localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_CLINICS));

      // Clear any stale session to ensure a clean first-run flow
      window.localStorage.removeItem(SESSION_KEY);

      // Mark as seeded
      window.localStorage.setItem(SEEDED_FLAG_KEY, '1');
    }
  } catch (e) {
    // Swallow errors to avoid blocking app boot in private mode or storage errors
    console.warn('Mock data seeding skipped:', e);
  }
}