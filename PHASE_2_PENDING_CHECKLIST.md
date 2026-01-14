# Phase 2 Integration - Pending Items Checklist

**Last Updated:** January 10, 2026  
**Status:** Near Complete - Ready for Final Testing & Deployment

---

## ✅ COMPLETED

### Code Changes
- [x] Fixed `storage.ts` null-read error (defensive null checks, array initialization)
- [x] Patched `DoctorListView.tsx` (null-safe rendering, masterId fallback)
- [x] Enhanced `clinicService.getAllClinics()` (doctor attachment, single-query optimization)
- [x] Added `clinicService.subscribeToAllClinics()` (realtime subscriptions)
- [x] Added `doctorService.deleteDoctor()` (with orphaned patient cleanup)
- [x] Migrated `App.tsx` doctor handlers (use doctorService + local fallback)
- [x] Migrated `App.tsx` clinic handlers (use clinicService + local fallback)
- [x] Updated `ClinicAuth.tsx` (use clinicService instead of storage)
- [x] Enhanced `supabaseClient.ts` (prefer Vite env vars)

### Database
- [x] Created SQL migration script (`scripts/migrations/001_populate_doctors_master_id.sql`)
- [x] Created Node migration helper (`scripts/run_migration_populate_master_id.js`)

### Documentation
- [x] Generated `PHASE_2_INTEGRATION_SUMMARY.md` (deployment guide + troubleshooting)

---

## ⏳ PENDING - HIGH PRIORITY

### 1. Run DB Migration
**What:** Populate missing `doctors.master_id` fields and fix clinic JSON blobs  
**Status:** Not yet executed  
**Command:**
```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY = "your-anon-key"
node scripts/run_migration_populate_master_id.js
```
**Expected Output:**
```
Fetching doctors with null master_id...
Found X doctors to update.
Updated doctor master_id = id for ...
Fetching clinics to inspect embedded doctor objects...
Updated clinic data doctors for ...
Migration complete.
```

### 2. Test Patient View
**What:** Verify clinics and doctors load from Supabase  
**Status:** Manual test required  
**Steps:**
1. Open http://localhost:3001/
2. Click "Patient Login" or "Guest"
3. Check browser console (F12) for:
   - ✓ "Clinics loaded from Supabase: X" (X > 0)
   - ✓ No red errors
4. Verify:
   - ✓ Clinic cards display with names, cities
   - ✓ Doctor list shows specialties, ratings
   - ✓ Clicking doctor doesn't navigate to `/doctor/null`
5. Check doctor list page `/patient/doctor` or similar:
   - ✓ Doctors display with full info
   - ✓ No null `masterId` in console
   - ✓ Search/filter works

### 3. Test Admin View
**What:** Verify admin CRUD operations sync with Supabase  
**Status:** Manual test required  
**Steps:**
1. Navigate to `/admin`
2. Try to **add a doctor:**
   - Fill form, click "Add"
   - ✓ Doctor appears in list
   - ✓ Refresh page → doctor persists (Supabase saved it)
3. Try to **edit a doctor:**
   - Click edit, change specialty
   - ✓ Changes apply immediately
   - ✓ Open in new tab → changes visible there too (realtime)
4. Try to **delete a doctor:**
   - Click delete, confirm
   - ✓ Doctor removed from list
5. Try **add/edit/delete clinic:**
   - Same pattern as doctor tests
   - ✓ Changes persist after refresh

### 4. Test Realtime Subscription
**What:** Verify changes in one tab appear in another tab (realtime)  
**Status:** Manual test required  
**Steps:**
1. Open app in **Tab A** and **Tab B**
2. In **Tab A:**
   - Navigate to `/admin`
   - Change a doctor's status to "ON_BREAK"
3. In **Tab B:**
   - Without refreshing, status should update automatically
   - ✓ If yes → realtime working
   - ✗ If no → subscription may not be enabled

---

## ⏳ PENDING - MEDIUM PRIORITY

### 5. Create `staffService.ts`
**What:** Persistent staff CRUD via Supabase (currently local-only)  
**Status:** Not started  
**Expected:** Similar pattern to `clinicService` and `doctorService`
- `getStaff(clinicId)` → fetch from `staff` table
- `addStaff(clinicId, staff)` → insert + notify
- `updateStaff(clinicId, staffId, updates)` → update + notify
- `deleteStaff(clinicId, staffId)` → delete + notify
- `subscribeToClinicStaff(clinicId)` → realtime

### 6. Add Error Recovery & Retry Logic
**What:** Service layer should retry failed Supabase ops  
**Status:** Not started  
**Scope:**
- Exponential backoff for failed requests
- Queue failed writes for retry when online
- User notification on recovery

### 7. Implement Offline Sync Queue
**What:** Patient check-ins should queue locally when Supabase unavailable  
**Status:** Not started  
**Scope:**
- Queue check-ins in IndexedDB
- Sync on connection restored
- Prevent duplicate submissions

---

## ⏳ PENDING - LOW PRIORITY

### 8. Unit & Integration Tests
**What:** Test service APIs and critical flows  
**Status:** Not started  
**Scope:**
- `clinicService` CRUD, subscriptions
- `doctorService` CRUD, filtering
- `patientService` check-in, status updates
- Real-time subscription behavior

### 9. Performance Optimization
**What:** Optimize large clinic queries and subscriptions  
**Status:** Not started  
**Ideas:**
- Pagination for doctor/clinic lists
- Lazy-load patient queues
- Debounce status updates
- Cache doctor availability

### 10. Analytics & Monitoring
**What:** Track errors, performance, usage  
**Status:** Not started  
**Ideas:**
- Sentry or similar for error tracking
- Performance metrics dashboard
- User event tracking (logins, check-ins, etc.)

---

## 🚀 DEPLOYMENT READINESS

### Pre-Production Checklist
- [ ] DB migration executed (pending item #1)
- [ ] Patient view tested & verified (pending item #2)
- [ ] Admin view tested & verified (pending item #3)
- [ ] Realtime subscription confirmed working (pending item #4)
- [ ] `.env.local` configured with Supabase URL + key
- [ ] Build passes: `npm run build`
- [ ] No console errors or warnings
- [ ] Mobile responsive verified

### Production Deployment Steps
1. Run migrations on production DB
2. Build: `npm run build`
3. Deploy to production (Vercel, Netlify, etc.)
4. Set env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
5. Test production app end-to-end
6. Monitor logs for errors
7. Enable production monitoring (Sentry, etc.)

---

## 📊 SUMMARY

| Category | Status | Count |
|----------|--------|-------|
| **Completed** | ✅ | 9 items |
| **High Priority** | ⏳ | 4 items (must do before prod) |
| **Medium Priority** | ⏳ | 3 items (recommended for v1) |
| **Low Priority** | ⏳ | 3 items (nice-to-have) |

**Next Immediate Step:** Run DB migration (#1) and test patient/admin views (#2, #3)

---

## Quick Links
- [PHASE_2_INTEGRATION_SUMMARY.md](PHASE_2_INTEGRATION_SUMMARY.md) — Deployment guide
- `http://localhost:3001/` — Dev server
- `scripts/run_migration_populate_master_id.js` — DB migration helper
- `services/clinicService.ts` — Clinic service
- `services/doctorService.ts` — Doctor service
- `services/patientService.ts` — Patient service

---

**Last Updated:** January 10, 2026  
**Next Review:** After migration & testing
