#!/usr/bin/env node
/**
 * ============================================================
 * SmartQFlow — Supabase Automated Setup Script
 * ============================================================
 * Runs schema, creates all auth users, and seeds clinic data.
 *
 * USAGE:
 *   node scripts/setup-supabase.mjs
 *
 * REQUIRES (add to .env.local):
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
 *
 * WHERE TO FIND SERVICE ROLE KEY:
 *   Supabase Dashboard → Project Settings → API → Service Role (secret)
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');

// ─── Load env from .env.local ───────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ─── Config ─────────────────────────────────────────────────
const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      || 'https://kycwbjesewquxuvmtwzp.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT_TOKEN        = process.env.SUPABASE_ACCESS_TOKEN;   // optional: personal access token
const PROJECT_REF       = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];

// ─── Styling helpers ────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m', blue: '\x1b[34m',
};
const ok   = (msg) => console.log(`  ${c.green}✅${c.reset} ${msg}`);
const fail = (msg) => console.log(`  ${c.red}❌${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.cyan}ℹ️ ${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠️ ${c.reset} ${msg}`);
const step = (msg) => console.log(`\n${c.bold}${c.blue}▶ ${msg}${c.reset}`);
const hr   = ()    => console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);

// ─── Clinic & User Data ─────────────────────────────────────
const CLINIC_ID = 'clinic_demo_smartqflow_001';

const DEMO_CLINIC = {
  id:                    CLINIC_ID,
  name:                  'SmartQFlow Demo Clinic',
  slug:                  'smartqflow-demo',
  city:                  'Chennai',
  address:               '42, Anna Salai, Teynampet',
  pincode:               '600018',
  type:                  'GENERAL',
  plan:                  'SMALL',
  operation_mode:        'HYBRID_FULL',
  enable_advance_booking: true,
  timezone:              'Asia/Kolkata',
  operating_hours:       '09:00 AM - 09:00 PM',
  contact_phone:         '+91 98765 43210',
  about:                 'A premier multi-specialty demo clinic with live queue management.',
  amenities:             JSON.stringify(['Pharmacy','Parking','Wheelchair Access','Air Conditioning','WiFi']),
  subscription_status:   'ACTIVE',
  geo_location:          { lat: 13.0569, lng: 80.2425 },
  metadata:              { tier: 'demo' },
};

const USERS = [
  { email: 'admin@smartqflow.com',     password: 'Admin@123456',   name: 'SmartQFlow Admin', phone: '9876543210', role: 'ADMIN',        clinic_id: CLINIC_ID },
  { email: 'doctor1@smartqflow.com',   password: 'Doctor@123456',  name: 'Dr. Arjun Mehta', phone: '9876500001', role: 'DOCTOR',       clinic_id: CLINIC_ID },
  { email: 'doctor2@smartqflow.com',   password: 'Doctor@123456',  name: 'Dr. Priya Sharma',phone: '9876500002', role: 'DOCTOR',       clinic_id: CLINIC_ID },
  { email: 'reception@smartqflow.com', password: 'Staff@123456',   name: 'Kavitha R',       phone: '9876500003', role: 'RECEPTIONIST', clinic_id: CLINIC_ID },
  { email: 'demo@patient.com',         password: 'Demo@123456',    name: 'Demo Patient',    phone: '9000000001', role: 'PATIENT',      clinic_id: null },
  { email: 'ravi@patient.com',         password: 'Patient@123456', name: 'Ravi Kumar',      phone: '9500012345', role: 'PATIENT',      clinic_id: null },
  { email: 'lakshmi@patient.com',      password: 'Patient@123456', name: 'Lakshmi Devi',    phone: '9500054321', role: 'PATIENT',      clinic_id: null },
];

const DOCTORS = [
  {
    id: 'doc_arjun_mehta_001', clinic_id: CLINIC_ID,
    name: 'Dr. Arjun Mehta', specialty: 'General Medicine', room_number: 'Room 1',
    registration_number: 'MCI-12345', mobile: '9876500001', consultation_fee: 500,
    experience: 10, rating: 4.8, review_count: 213, gender: 'Male',
    bio: 'MBBS, MD (Internal Medicine). 10+ years of experience in general and preventive medicine.',
    education:  JSON.stringify(['MBBS', 'MD - Internal Medicine']),
    languages:  JSON.stringify(['English', 'Tamil', 'Hindi']),
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
    status: 'AVAILABLE', is_available: true, delay_minutes: 0,
    weekly_schedule: JSON.stringify([
      { day: 'Monday',    isOff: false, slots: [{ startTime: '09:00', endTime: '13:00', mode: 'HYBRID', active: true }, { startTime: '17:00', endTime: '21:00', mode: 'HYBRID', active: true }] },
      { day: 'Tuesday',   isOff: false, slots: [{ startTime: '09:00', endTime: '13:00', mode: 'HYBRID', active: true }, { startTime: '17:00', endTime: '21:00', mode: 'HYBRID', active: true }] },
      { day: 'Wednesday', isOff: false, slots: [{ startTime: '09:00', endTime: '13:00', mode: 'HYBRID', active: true }] },
      { day: 'Thursday',  isOff: false, slots: [{ startTime: '09:00', endTime: '13:00', mode: 'HYBRID', active: true }, { startTime: '17:00', endTime: '21:00', mode: 'HYBRID', active: true }] },
      { day: 'Friday',    isOff: false, slots: [{ startTime: '09:00', endTime: '13:00', mode: 'HYBRID', active: true }, { startTime: '17:00', endTime: '21:00', mode: 'HYBRID', active: true }] },
      { day: 'Saturday',  isOff: false, slots: [{ startTime: '09:00', endTime: '14:00', mode: 'WALK_IN', active: true }] },
      { day: 'Sunday',    isOff: true,  slots: [] },
    ]),
    metadata: JSON.stringify({ specializations: ['Diabetes Management', 'Hypertension', 'Preventive Care'] }),
  },
  {
    id: 'doc_priya_sharma_002', clinic_id: CLINIC_ID,
    name: 'Dr. Priya Sharma', specialty: 'Pediatrics', room_number: 'Room 2',
    registration_number: 'MCI-67890', mobile: '9876500002', consultation_fee: 400,
    experience: 8, rating: 4.6, review_count: 189, gender: 'Female',
    bio: 'MBBS, MD (Pediatrics). Specialist in child healthcare, vaccinations and growth monitoring.',
    education:  JSON.stringify(['MBBS', 'MD - Pediatrics']),
    languages:  JSON.stringify(['English', 'Tamil']),
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    status: 'ON_BREAK', is_available: false, delay_minutes: 0,
    weekly_schedule: JSON.stringify([
      { day: 'Monday',    isOff: false, slots: [{ startTime: '10:00', endTime: '14:00', mode: 'HYBRID', active: true }, { startTime: '18:00', endTime: '21:00', mode: 'APPOINTMENT', active: true }] },
      { day: 'Tuesday',   isOff: false, slots: [{ startTime: '10:00', endTime: '14:00', mode: 'HYBRID', active: true }] },
      { day: 'Wednesday', isOff: true,  slots: [] },
      { day: 'Thursday',  isOff: false, slots: [{ startTime: '10:00', endTime: '14:00', mode: 'HYBRID', active: true }, { startTime: '18:00', endTime: '21:00', mode: 'APPOINTMENT', active: true }] },
      { day: 'Friday',    isOff: false, slots: [{ startTime: '10:00', endTime: '14:00', mode: 'HYBRID', active: true }] },
      { day: 'Saturday',  isOff: false, slots: [{ startTime: '10:00', endTime: '13:00', mode: 'APPOINTMENT', active: true }] },
      { day: 'Sunday',    isOff: true,  slots: [] },
    ]),
    metadata: JSON.stringify({ specializations: ['Newborn Care', 'Vaccination', 'Child Development'] }),
  },
];

const STAFF = [
  { id: 'staff_kavitha_001', clinic_id: CLINIC_ID, name: 'Kavitha R',      role: 'RECEPTIONIST', phone: '9876500003', email: 'reception@smartqflow.com', password: 'Staff@123456' },
  { id: 'staff_admin_001',   clinic_id: CLINIC_ID, name: 'SmartQFlow Admin', role: 'MANAGER',     phone: '9876543210', email: 'admin@smartqflow.com',     password: 'Admin@123456' },
];

// ─── Main setup function ────────────────────────────────────
async function main() {
  console.clear();
  console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════╗`);
  console.log(`║   SmartQFlow — Supabase Auto Setup           ║`);
  console.log(`╚══════════════════════════════════════════════╝${c.reset}\n`);

  // ─── Pre-flight checks ──────────────────────────────────
  step('Pre-flight Checks');
  info(`Project URL  : ${SUPABASE_URL}`);
  info(`Project Ref  : ${PROJECT_REF}`);

  if (!SERVICE_ROLE_KEY) {
    fail('SUPABASE_SERVICE_ROLE_KEY not found!');
    console.log(`
${c.yellow}Add it to your .env.local file:${c.reset}

  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

${c.gray}Where to find it:
  Supabase Dashboard → Project Settings → API
  → "Service Role" key (under "Project API Keys")${c.reset}
`);
    process.exit(1);
  }
  ok('Service Role key found');

  // ─── Init Supabase Admin Client ─────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ─── Step 1: Check Schema / Run SQL ─────────────────────
  step('Step 1 — Check Database Schema');
  const schemaReady = await checkSchema(supabase);
  if (!schemaReady) {
    await runSchema(supabase);
  }

  // ─── Step 2: Create Auth Users ──────────────────────────
  step('Step 2 — Create Auth Users');
  const userIds = await createAuthUsers(supabase);

  // ─── Step 3: Insert Clinic ──────────────────────────────
  step('Step 3 — Insert Demo Clinic');
  await insertClinic(supabase);

  // ─── Step 4: Insert User Profiles ───────────────────────
  step('Step 4 — Insert User Profiles');
  await insertUserProfiles(supabase, userIds);

  // ─── Step 5: Insert Doctors ─────────────────────────────
  step('Step 5 — Insert Doctors');
  await insertDoctors(supabase, userIds);

  // ─── Step 6: Insert Staff ───────────────────────────────
  step('Step 6 — Insert Staff');
  await insertStaff(supabase);

  // ─── Summary ────────────────────────────────────────────
  printSummary();
}

// ─── Schema check ───────────────────────────────────────────
async function checkSchema(supabase) {
  const { error } = await supabase.from('clinics').select('id').limit(1);
  if (!error) { ok('Schema already exists — skipping schema creation'); return true; }
  warn('Tables not found — will attempt to create schema...');
  return false;
}

// ─── SQL Schema runner via Management API ───────────────────
async function runSchema(supabase) {
  const schemaPath = join(ROOT, 'SUPABASE_SCHEMA_FIXED.sql');
  if (!existsSync(schemaPath)) { fail('SUPABASE_SCHEMA_FIXED.sql not found'); return; }

  const sql = readFileSync(schemaPath, 'utf-8');

  // Try Management API if access token available
  if (MGMT_TOKEN && PROJECT_REF) {
    info('Running schema via Supabase Management API...');
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      });
      if (res.ok) { ok('Schema created via Management API'); return; }
      const err = await res.json();
      warn('Management API error: ' + JSON.stringify(err));
    } catch (e) {
      warn('Management API failed: ' + e.message);
    }
  }

  // Fallback: print instructions
  console.log(`
${c.yellow}╔══════════════════════════════════════════════════════╗
║  MANUAL STEP REQUIRED — Run Schema SQL                ║
╠══════════════════════════════════════════════════════╣
║  1. Go to: https://supabase.com/dashboard            ║
║  2. Open your project: ${PROJECT_REF?.padEnd(29)}║
║  3. Click: SQL Editor → New Query                    ║
║  4. Paste the contents of: SUPABASE_SCHEMA_FIXED.sql ║
║  5. Click: Run                                       ║
║  6. Then re-run this script                          ║
╚══════════════════════════════════════════════════════╝${c.reset}
`);

  const schemaOk = await promptYesNo('Have you run the schema SQL? Continue with seeding?');
  if (!schemaOk) { console.log('\nSetup aborted. Run the schema first, then retry.\n'); process.exit(0); }
}

// ─── Create Auth Users ───────────────────────────────────────
async function createAuthUsers(supabase) {
  const userIds = {};

  for (const user of USERS) {
    process.stdout.write(`  Creating ${user.email}... `);
    try {
      // Check if user already exists
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find(u => u.email === user.email);
      if (found) {
        console.log(`${c.yellow}already exists${c.reset} (${found.id.slice(0, 8)}...)`);
        userIds[user.email] = found.id;
        continue;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,  // auto-confirm, skip email verification
        user_metadata: { name: user.name, phone: user.phone, role: user.role, clinic_id: user.clinic_id },
      });

      if (error) {
        console.log(`${c.red}failed — ${error.message}${c.reset}`);
        continue;
      }
      userIds[user.email] = data.user.id;
      console.log(`${c.green}✓ created${c.reset} (${data.user.id.slice(0, 8)}...)`);
    } catch (e) {
      console.log(`${c.red}error — ${e.message}${c.reset}`);
    }
  }

  return userIds;
}

// ─── Insert Clinic ───────────────────────────────────────────
async function insertClinic(supabase) {
  const { error } = await supabase.from('clinics').upsert(DEMO_CLINIC, { onConflict: 'id' });
  if (error) fail('Clinic insert: ' + error.message);
  else       ok(`Clinic "${DEMO_CLINIC.name}" upserted`);
}

// ─── Insert User Profiles ────────────────────────────────────
async function insertUserProfiles(supabase, userIds) {
  for (const user of USERS) {
    const uid = userIds[user.email];
    if (!uid) { warn(`Skipping profile for ${user.email} (no auth ID)`); continue; }

    const { error } = await supabase.from('user_profiles').upsert({
      id: uid, email: user.email, phone: user.phone,
      name: user.name, role: user.role,
      clinic_id: user.clinic_id || null, is_verified: true,
    }, { onConflict: 'id' });

    if (error) fail(`Profile ${user.email}: ${error.message}`);
    else       ok(`Profile: ${user.name} (${user.role})`);
  }
}

// ─── Insert Doctors (link master_id to auth user) ────────────
async function insertDoctors(supabase, userIds) {
  const doctorUserMap = {
    'doc_arjun_mehta_001':   userIds['doctor1@smartqflow.com'],
    'doc_priya_sharma_002':  userIds['doctor2@smartqflow.com'],
  };

  for (const doctor of DOCTORS) {
    const masterId = doctorUserMap[doctor.id];
    const { error } = await supabase.from('doctors').upsert({
      ...doctor, master_id: masterId || null,
    }, { onConflict: 'id' });

    if (error) fail(`Doctor ${doctor.name}: ${error.message}`);
    else       ok(`Doctor: ${doctor.name} (${doctor.specialty})`);
  }
}

// ─── Insert Staff ────────────────────────────────────────────
async function insertStaff(supabase) {
  for (const member of STAFF) {
    const { error } = await supabase.from('staff').upsert(member, { onConflict: 'id' });
    if (error) fail(`Staff ${member.name}: ${error.message}`);
    else       ok(`Staff: ${member.name} (${member.role})`);
  }
}

// ─── Print final summary ─────────────────────────────────────
function printSummary() {
  hr();
  console.log(`\n${c.bold}${c.green}🎉 Setup Complete!${c.reset}\n`);
  console.log(`${c.bold}Login Credentials:${c.reset}\n`);

  const rows = [
    ['Role',          'Email',                     'Password'],
    ['─────────────', '───────────────────────────', '─────────────'],
    ['Admin',         'admin@smartqflow.com',       'Admin@123456'],
    ['Doctor 1',      'doctor1@smartqflow.com',     'Doctor@123456'],
    ['Doctor 2',      'doctor2@smartqflow.com',     'Doctor@123456'],
    ['Receptionist',  'reception@smartqflow.com',   'Staff@123456'],
    ['Patient (Demo)','demo@patient.com',           'Demo@123456'],
    ['Patient 2',     'ravi@patient.com',           'Patient@123456'],
    ['Patient 3',     'lakshmi@patient.com',        'Patient@123456'],
  ];

  for (const [role, email, pass] of rows) {
    console.log(`  ${c.cyan}${role.padEnd(16)}${c.reset} ${email.padEnd(30)} ${c.yellow}${pass}${c.reset}`);
  }

  console.log(`\n${c.bold}Test the app:${c.reset}  http://localhost:4000\n`);
  hr();
}

// ─── Prompt helper ───────────────────────────────────────────
function promptYesNo(question) {
  return new Promise(resolve => {
    process.stdout.write(`\n  ${c.yellow}${question} (y/n): ${c.reset}`);
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', d => {
      process.stdin.pause();
      resolve(d.trim().toLowerCase() === 'y');
    });
  });
}

// ─── Run ─────────────────────────────────────────────────────
main().catch(err => {
  fail(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
