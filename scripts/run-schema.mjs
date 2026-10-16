#!/usr/bin/env node
/**
 * SmartQFlow — Run Schema via Supabase Management API
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 * (Personal access token from https://supabase.com/dashboard/account/tokens)
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');

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

const SUPABASE_URL   = process.env.VITE_SUPABASE_URL || '';
const MGMT_TOKEN     = process.env.SUPABASE_ACCESS_TOKEN;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF    = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];

const c = { reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m', gray:'\x1b[90m' };

async function run() {
  console.log(`\n${c.bold}${c.cyan}SmartQFlow — Schema Runner${c.reset}\n`);

  const schemaPath = join(ROOT, 'SUPABASE_SCHEMA_FIXED.sql');
  if (!existsSync(schemaPath)) {
    console.log(`${c.red}❌ SUPABASE_SCHEMA_FIXED.sql not found${c.reset}`);
    process.exit(1);
  }

  const sql = readFileSync(schemaPath, 'utf-8');
  console.log(`  📄 Schema file loaded (${(sql.length / 1024).toFixed(1)} KB)`);

  // ── Method 1: Supabase Management API ─────────────────────
  if (MGMT_TOKEN && PROJECT_REF) {
    console.log(`  🔑 Using Management API (project: ${PROJECT_REF})`);
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: sql }),
      });
      const body = await res.json();
      if (res.ok) {
        console.log(`\n${c.green}✅ Schema executed successfully via Management API!${c.reset}\n`);
        return;
      }
      console.log(`${c.yellow}⚠️  Management API error: ${JSON.stringify(body)}${c.reset}`);
    } catch (e) {
      console.log(`${c.yellow}⚠️  Management API failed: ${e.message}${c.reset}`);
    }
  }

  // ── Method 2: pg direct connection ────────────────────────
  const DB_URL = process.env.DATABASE_URL ||
    (PROJECT_REF && process.env.DB_PASSWORD
      ? `postgresql://postgres:${process.env.DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`
      : null);

  if (DB_URL) {
    console.log(`  🐘 Trying direct PostgreSQL connection...`);
    try {
      const { default: pg } = await import('pg').catch(() => ({ default: null }));
      if (pg) {
        const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        await client.query(sql);
        await client.end();
        console.log(`\n${c.green}✅ Schema executed via direct DB connection!${c.reset}\n`);
        return;
      }
      console.log(`${c.yellow}  pg package not installed — skipping${c.reset}`);
    } catch (e) {
      console.log(`${c.yellow}⚠️  Direct DB failed: ${e.message}${c.reset}`);
    }
  }

  // ── Fallback: manual instructions ─────────────────────────
  console.log(`
${c.yellow}╔════════════════════════════════════════════════════════╗
║  Neither API key nor DB password found.                ║
║  Please run the schema MANUALLY:                       ║
╠════════════════════════════════════════════════════════╣
║  Option A — Supabase Dashboard:                        ║
║    1. Go to https://supabase.com → your project        ║
║    2. SQL Editor → New Query                           ║
║    3. Paste SUPABASE_SCHEMA_FIXED.sql → Click Run      ║
║                                                        ║
║  Option B — Add to .env.local then re-run:             ║
║    SUPABASE_ACCESS_TOKEN=your_personal_access_token    ║
║    # Get at: supabase.com/dashboard/account/tokens     ║
║                                                        ║
║  Option C — Add DB password to .env.local:             ║
║    DB_PASSWORD=your_db_password                        ║
╚════════════════════════════════════════════════════════╝${c.reset}
`);
}

run().catch(e => { console.error(e); process.exit(1); });
