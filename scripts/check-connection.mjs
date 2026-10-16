#!/usr/bin/env node
/**
 * SmartQFlow — Supabase Connection Checker
 * Tests: network reachability, auth API, anon key, service role key, tables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), '..');

// Load .env.local
const envPath = join(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const URL_   = process.env.VITE_SUPABASE_URL      || '';
const ANON   = process.env.VITE_SUPABASE_ANON_KEY || '';
const SRK    = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const REF    = URL_.match(/https:\/\/([^.]+)/)?.[1] || '';

const c = {
  reset:'\x1b[0m', bold:'\x1b[1m',
  green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m',
  cyan:'\x1b[36m',  gray:'\x1b[90m', blue:'\x1b[34m',
};

const ok   = (label, val='') => console.log(`  ${c.green}✅ PASS${c.reset}  ${label.padEnd(34)} ${c.gray}${val}${c.reset}`);
const fail = (label, val='') => console.log(`  ${c.red}❌ FAIL${c.reset}  ${label.padEnd(34)} ${c.red}${val}${c.reset}`);
const warn = (label, val='') => console.log(`  ${c.yellow}⚠️  WARN${c.reset}  ${label.padEnd(34)} ${c.yellow}${val}${c.reset}`);
const skip = (label, val='') => console.log(`  ${c.gray}⏭  SKIP${c.reset}  ${label.padEnd(34)} ${c.gray}${val}${c.reset}`);
const hr   = () => console.log(`  ${c.gray}${'─'.repeat(58)}${c.reset}`);

async function check() {
  console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════════╗`);
  console.log(`║   SmartQFlow — Supabase Connection Diagnostics       ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${c.reset}\n`);

  // ── 1. Config Presence ──────────────────────────────────
  console.log(`${c.bold}[1] Configuration${c.reset}`);
  hr();

  URL_  ? ok('Supabase URL',       URL_)
        : fail('Supabase URL',     'missing in .env.local');

  ANON && ANON !== 'your_anon_key_here'
        ? ok('Anon / Publishable key', ANON.slice(0, 24) + '...')
        : fail('Anon key',         'missing or placeholder');

  SRK && SRK !== 'your_service_role_secret_key_here'
        ? ok('Service Role key',   SRK.slice(0, 24) + '...')
        : warn('Service Role key', 'placeholder — setup script needs real key');

  REF   ? ok('Project Ref',        REF)
        : fail('Project Ref',      'could not parse from URL');

  // ── 2. DNS / Network reachability ───────────────────────
  console.log(`\n${c.bold}[2] Network Reachability${c.reset}`);
  hr();

  const pingStart = Date.now();
  try {
    const res = await fetch(`${URL_}/rest/v1/`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - pingStart;
    if (res.ok || res.status === 200 || res.status === 404) {
      ok('REST endpoint reachable', `HTTP ${res.status} · ${ms}ms`);
    } else {
      warn('REST endpoint', `HTTP ${res.status} · ${ms}ms`);
    }
  } catch (e) {
    fail('REST endpoint', e.message.includes('timeout') ? 'TIMEOUT (DNS/firewall issue)' : e.message);
  }

  // Health endpoint
  try {
    const res = await fetch(`${URL_}/auth/v1/health`, {
      headers: { apikey: ANON },
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - pingStart;
    const body = await res.json().catch(() => ({}));
    res.ok ? ok('Auth health endpoint', `${JSON.stringify(body)} · ${ms}ms`)
           : warn('Auth health endpoint', `HTTP ${res.status}`);
  } catch (e) {
    fail('Auth health endpoint', e.message);
  }

  // ── 3. Anon Key Test (public tables) ─────────────────────
  console.log(`\n${c.bold}[3] Anon Key — Public Read Test${c.reset}`);
  hr();

  const anonClient = createClient(URL_, ANON);

  const { data: clinicData, error: clinicErr } = await anonClient
    .from('clinics').select('id, name').limit(3);

  if (clinicErr) {
    clinicErr.message.includes('relation') || clinicErr.code === '42P01'
      ? fail('clinics table', '⚠️  Table does not exist — run SUPABASE_SCHEMA_FIXED.sql first')
      : fail('clinics table', clinicErr.message);
  } else {
    ok('clinics table readable', `${clinicData.length} row(s) found`);
    clinicData.forEach(r => console.log(`    ${c.gray}→ ${r.id}: ${r.name}${c.reset}`));
  }

  const { data: docData, error: docErr } = await anonClient
    .from('doctors').select('id, name, specialty').limit(3);

  if (docErr) {
    docErr.code === '42P01'
      ? fail('doctors table', 'Table does not exist')
      : fail('doctors table', docErr.message);
  } else {
    ok('doctors table readable', `${docData.length} row(s) found`);
    docData.forEach(r => console.log(`    ${c.gray}→ ${r.name} (${r.specialty})${c.reset}`));
  }

  // ── 4. Auth API Test ─────────────────────────────────────
  console.log(`\n${c.bold}[4] Auth API Test${c.reset}`);
  hr();

  // Try a known-bad login to confirm auth is responding
  const { error: authErr } = await anonClient.auth.signInWithPassword({
    email: 'test@test.com', password: 'wrongpassword'
  });

  if (!authErr) {
    warn('Auth API', 'Unexpected success with test credentials');
  } else if (authErr.message.includes('Invalid login') || authErr.message.includes('invalid_grant') || authErr.status === 400) {
    ok('Auth API responding', `"${authErr.message}" (expected for wrong creds)`);
  } else if (authErr.message.includes('Email not confirmed')) {
    ok('Auth API responding', 'Email confirmation required');
  } else {
    fail('Auth API', authErr.message);
  }

  // ── 5. Service Role Key Test ─────────────────────────────
  console.log(`\n${c.bold}[5] Service Role Key Test (Admin API)${c.reset}`);
  hr();

  if (!SRK || SRK === 'your_service_role_secret_key_here') {
    skip('Admin user list', 'Service role key not configured yet');
    skip('Create user API', 'Service role key not configured yet');
  } else {
    const adminClient = createClient(URL_, SRK, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) {
      fail('Admin user list', listErr.message);
    } else {
      ok('Admin user list', `${userList.users.length} user(s) in auth.users`);
      userList.users.slice(0, 5).forEach(u =>
        console.log(`    ${c.gray}→ ${u.email} (${u.role || 'user'})${c.reset}`)
      );
    }

    // Test service role can read user_profiles
    const { data: profiles, error: profErr } = await adminClient
      .from('user_profiles').select('email, role').limit(5);

    if (profErr) {
      profErr.code === '42P01'
        ? fail('user_profiles table', 'Table not found — run schema first')
        : fail('user_profiles table', profErr.message);
    } else {
      ok('user_profiles readable', `${profiles.length} profile(s)`);
      profiles.forEach(p => console.log(`    ${c.gray}→ ${p.email} [${p.role}]${c.reset}`));
    }
  }

  // ── 6. Realtime Test ────────────────────────────────────
  console.log(`\n${c.bold}[6] Realtime / WebSocket${c.reset}`);
  hr();

  try {
    const rtRes = await fetch(`${URL_.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`
      .replace('wss://', 'https://'), { signal: AbortSignal.timeout(5000) });
    ok('Realtime endpoint', `HTTP ${rtRes.status}`);
  } catch (e) {
    warn('Realtime endpoint', e.message.includes('timeout') ? 'Timeout (may still work in browser)' : e.message);
  }

  // ── Summary ─────────────────────────────────────────────
  console.log(`\n${c.bold}[7] Summary${c.reset}`);
  hr();

  const hasUrl     = !!URL_;
  const hasAnon    = !!(ANON && ANON !== 'your_anon_key_here');
  const hasSrk     = !!(SRK  && SRK  !== 'your_service_role_secret_key_here');
  const tablesExist = !clinicErr;
  const authWorks  = !authErr || authErr.message.includes('Invalid login') || authErr.message.includes('invalid_grant');

  if (hasUrl && hasAnon && authWorks && tablesExist) {
    console.log(`\n  ${c.bold}${c.green}🟢 SUPABASE IS CONNECTED AND READY${c.reset}\n`);
  } else if (hasUrl && hasAnon && authWorks && !tablesExist) {
    console.log(`\n  ${c.bold}${c.yellow}🟡 SUPABASE CONNECTED — BUT SCHEMA NOT YET RUN${c.reset}`);
    console.log(`  ${c.gray}Run: SUPABASE_SCHEMA_FIXED.sql in SQL Editor, then: npm run setup:supabase${c.reset}\n`);
  } else if (hasUrl && !authWorks) {
    console.log(`\n  ${c.bold}${c.red}🔴 SUPABASE AUTH NOT RESPONDING${c.reset}\n`);
  } else {
    console.log(`\n  ${c.bold}${c.red}🔴 SUPABASE NOT CONFIGURED${c.reset}`);
    console.log(`  ${c.gray}Check your .env.local file${c.reset}\n`);
  }

  console.log(`  ${c.gray}Next step: npm run setup:supabase  (after adding service role key)${c.reset}\n`);
}

check().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1); });
