# Phase 3: Testing & Validation Checklist

## Pre-Testing Setup

```bash
# 1. Start dev server
npm run dev

# 2. Verify Supabase connection
# - Open browser console
# - Should see: "Clinics loaded from Supabase: X"
# - No errors about failed queries
```

---

## 1. Authentication Testing ✓

### 1.1 Patient Registration & Login
- [ ] **Signup as patient**
  - Go to landing page → "Continue as Patient"
  - Click "Sign Up"
  - Enter: 
    - Name: `Test Patient`
    - Phone: `9876543210`
    - Email: `patient@test.com`
    - Password: `Patient@123456`
  - Expected: Verification email sent, redirects to verify view
  
- [ ] **Email Verification**
  - Check Supabase Auth emails (Settings → Authentication → Users)
  - Should see user with `patient@test.com`
  - Click verification link (or manually verify in Supabase dashboard)
  - Expected: User marked as verified

- [ ] **Login as patient**
  - Go to landing page → "Continue as Patient"
  - Login with `patient@test.com` / `Patient@123456`
  - Expected: Successfully logged in, redirected to clinic search

### 1.2 Staff/Doctor Registration & Login
- [ ] **Signup as staff**
  - Go to landing page → "Partner Login"
  - Create clinic + add staff account
  - Enter: 
    - Email: `staff@clinic.com`
    - Password: `Staff@123456`
    - Role: `RECEPTIONIST`
  - Expected: Account created in `user_profiles` table

- [ ] **Login as staff**
  - Go to Partner Login
  - Enter `staff@clinic.com` / `Staff@123456`
  - Expected: Successfully logged in, redirected to reception dashboard

### 1.3 Session Persistence
- [ ] **Refresh page after login**
  - Login as patient
  - Refresh browser
  - Expected: Still logged in (session persisted)

- [ ] **Close and reopen browser**
  - Login as patient
  - Close all tabs
  - Reopen same URL
  - Expected: Session remembered (check localStorage has `clinicq_session_v2`)

---

## 2. Clinic & Doctor Management ✓

### 2.1 Clinic List
- [ ] **Load clinics**
  - Go to "Search Clinics" as patient
  - Expected: See clinics loaded from Supabase (not INITIAL_CLINICS)
  - Console should show: "Clinics loaded from Supabase: X"

- [ ] **Filter clinics**
  - Search by city
  - Expected: Results filtered correctly

### 2.2 Doctor Management
- [ ] **View doctors for clinic**
  - Select a clinic
  - Go to Doctor list
  - Expected: Doctors loaded from `doctorService.getDoctors()`

- [ ] **Doctor availability**
  - Doctor sets status to "ON_BREAK"
  - Patient views clinic
  - Expected: Doctor shown as unavailable

---

## 3. Queue & Patient Management ✓

### 3.1 Add Patient to Queue
- [ ] **Check-in patient (Kiosk)**
  - Go to clinic kiosk
  - Fill patient info:
    - Name: `John Doe`
    - Phone: `9999999999`
    - Select doctor
  - Click "Check In"
  - Expected: 
    - Patient added to queue in Supabase
    - Gets token number
    - Appears in reception dashboard realtime

- [ ] **Verify database**
  - Go to Supabase Dashboard → Table Editor → `patients`
  - Should see new patient entry
  - Check status: `WAITING`
  - Check clinic_id, doctor_id filled correctly

### 3.2 Realtime Queue Updates
- [ ] **Open reception dashboard in 2 windows**
  - Window 1: Reception dashboard
  - Window 2: Kiosk check-in page
  - In Window 2: Add patient
  - Expected: Window 1 updates instantly (no page refresh needed)
  - Console shows: "Queue updated - patients: X"

- [ ] **Doctor picks next patient**
  - In reception: Mark patient as "WITH_DOCTOR"
  - Expected: 
    - Status changes to `WITH_DOCTOR` in DB
    - Queue position updates
    - Next patient highlighted

- [ ] **Complete patient**
  - In reception: Mark patient as "COMPLETED"
  - Expected: 
    - Removed from active queue
    - Moved to completed
    - Feedback/rating form shown

### 3.3 Patient Vitals
- [ ] **Record vitals**
  - In reception: Click patient → Add Vitals
  - Enter: BP `120/80`, Temp `98.6`
  - Save
  - Expected: Vitals stored in `patients.vitals` JSONB field

---

## 4. Realtime Subscriptions ✓

### 4.1 Clinic Updates
- [ ] **Edit clinic in 2 windows**
  - Window 1: Admin dashboard → Clinic settings
  - Window 2: Patient view clinic list
  - In Window 1: Change clinic name
  - Expected: Window 2 updates instantly

### 4.2 Patient Status Changes
- [ ] **Multiple staff members updating**
  - Reception Window 1: Mark patient as "WITH_DOCTOR"
  - Doctor Window 2: Same patient visible as "WITH_DOCTOR"
  - Expected: Both windows sync realtime

### 4.3 Doctor Availability
- [ ] **Doctor changes status**
  - Doctor dashboard: Toggle status to "ON_BREAK"
  - Patient window: Doctor shown as unavailable
  - Expected: Updates within 1-2 seconds

---

## 5. Error Handling ✓

### 5.1 Network Errors
- [ ] **Simulate network error**
  - Chrome DevTools → Network tab → Offline
  - Try to load clinics
  - Expected: Error toast shown, graceful fallback

- [ ] **Recover from error**
  - Go online again
  - Retry
  - Expected: Data loads successfully

### 5.2 Invalid Data
- [ ] **Register with invalid email**
  - Try: `notanemail`
  - Expected: Validation error shown

- [ ] **Duplicate patient phone**
  - Add same phone twice
  - Expected: Error or warning

---

## 6. Performance Testing ✓

### 6.1 Load Testing
- [ ] **Load 100+ patients in queue**
  - CLI: Run seed script (if available)
  - Expected: Queue still responsive
  - No UI lag or freezes

- [ ] **Monitor console**
  - Open DevTools Console
  - Check for errors
  - Expected: No errors, only info logs

### 6.2 Database Query Performance
- [ ] **Check Supabase Logs**
  - Dashboard → Logs
  - Verify queries are fast (<100ms)
  - No N+1 query issues

---

## 7. Security Testing ✓

### 7.1 Authentication
- [ ] **Try invalid credentials**
  - Login with wrong password
  - Expected: "Invalid email or password" error

- [ ] **Try accessing other user's data**
  - Patient 1 logged in
  - Try to access Patient 2's appointments
  - Expected: RLS policy blocks access

### 7.2 Role-Based Access
- [ ] **Patient tries accessing staff portal**
  - As patient, try manually navigating to `/clinic/xyz/reception`
  - Expected: Redirected or access denied

- [ ] **Doctor tries accessing admin panel**
  - As doctor, try navigating to `/admin`
  - Expected: Redirected or access denied

---

## 8. Integration Test (Full Flow)

### Complete User Journey
1. [ ] **Patient flow**
   - Sign up
   - Search clinics
   - View doctor
   - Book appointment or walk-in check-in
   - View appointment status realtime
   - Rate doctor

2. [ ] **Staff flow**
   - Sign in
   - View clinic queue
   - Add patient manually
   - Update patient status
   - Mark completed

3. [ ] **Doctor flow**
   - Sign in
   - View assigned patients
   - Mark patient "WITH_DOCTOR"
   - Complete patient
   - View ratings

---

## 9. Database Integrity ✓

### 9.1 Check Relationships
```sql
-- Run in Supabase SQL Editor
-- Check foreign keys are valid
SELECT * FROM patients WHERE clinic_id NOT IN (SELECT id FROM clinics);
SELECT * FROM patients WHERE doctor_id NOT IN (SELECT id FROM doctors);
SELECT * FROM doctors WHERE clinic_id NOT IN (SELECT id FROM clinics);
```

- [ ] All queries return 0 rows (no orphaned data)

### 9.2 Check Indexes
```sql
-- Verify indexes exist
SELECT * FROM pg_stat_user_indexes WHERE schemaname='public';
```

- [ ] Should see indexes for: clinic_id, doctor_id, status, phone, etc.

---

## 10. Monitoring & Observability ✓

### 10.1 Console Logs
- [ ] Check for expected logs:
  - "Clinics loaded from Supabase: X"
  - "Loaded X patients for clinic"
  - "Queue updated - patients: X"
  - "Realtime clinic update received"

- [ ] No error logs

### 10.2 Supabase Analytics
- [ ] Dashboard → Analytics
  - Check API usage
  - Verify realtime subscriptions active
  - Monitor for errors

---

## 11. Cleanup & Validation

### 11.1 Remove test data
```bash
# Optional: Clean up test data before production
# In Supabase SQL Editor:
DELETE FROM patients WHERE email LIKE '%@test.com';
DELETE FROM user_profiles WHERE email LIKE '%@test.com';
```

### 11.2 Final checklist
- [ ] No console errors
- [ ] All services initialized
- [ ] Realtime subscriptions active
- [ ] Database integrity verified
- [ ] Performance acceptable

---

## Common Issues & Fixes

### Issue: "relation does not exist"
**Solution:** Re-run SUPABASE_SCHEMA_FIXED.sql in Supabase SQL Editor

### Issue: Realtime not updating
**Solution:** 
- Check Network tab → WebSocket connection open
- Verify RLS policies not blocking subscription
- Check `ALTER PUBLICATION supabase_realtime` was executed

### Issue: Auth fails with "Invalid credentials"
**Solution:**
- Verify user exists in Supabase Auth (Settings → Users)
- Check email is verified
- Try password reset

### Issue: CORS errors
**Solution:**
- Go to Supabase Settings → API Settings
- Add your frontend URL to CORS allow-list
- Or configure in development: use `http://localhost:5173`

---

## Sign-Off

When all tests pass:

- [ ] Feature complete
- [ ] No breaking errors
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for staging deployment

**Date tested:** ___________
**Tested by:** ___________
**Environment:** `development` / `staging`
