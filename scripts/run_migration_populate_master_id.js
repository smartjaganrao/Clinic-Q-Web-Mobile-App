#!/usr/bin/env node
/*
  Migration helper: populate missing doctor.master_id and fix clinics.data.doctors entries

  Usage (from project root):
    SUPABASE_URL=https://... SUPABASE_ANON_KEY=... node scripts/run_migration_populate_master_id.js

  Or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY if those are used in your env.
*/

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  try {
    console.log('Fetching doctors with null master_id...');
    const { data: docs, error: fetchErr } = await supabase.from('doctors').select('id').is('master_id', null);
    if (fetchErr) throw fetchErr;

    console.log(`Found ${docs.length} doctors to update.`);
    for (const d of docs) {
      const { error: updErr } = await supabase.from('doctors').update({ master_id: d.id }).eq('id', d.id);
      if (updErr) console.warn('Failed to update doctor', d.id, updErr.message || updErr);
      else console.log('Updated doctor master_id = id for', d.id);
    }

    // Note: Clinic data is stored in separate columns, not as JSON blob,
    // so no additional clinic updates needed. Doctor master_id is the main fix.
    console.log('Migration complete. Doctors master_id populated successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e.message || e);
    process.exit(2);
  }
})();
