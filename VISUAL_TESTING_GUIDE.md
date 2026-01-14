# SmartQFlow - Visual User Flow Testing Guide

**Purpose:** Step-by-step guide to test all user flows in the application  
**Time Required:** 30-45 minutes for complete testing  
**Prerequisites:** App running on http://localhost:3001/ (or your dev server)

---

## 🚀 Quick Start

```bash
# 1. Start the development server
npm run dev

# 2. Open browser
# Navigate to: http://localhost:3001/

# 3. Open browser console (F12)
# Watch for logs and errors
```

---

## 📋 Testing Checklist

Use this checklist to track your progress:

- [ ] **Flow 1:** Patient Journey (15 min)
- [ ] **Flow 2:** Doctor Journey (10 min)
- [ ] **Flow 3:** Reception Journey (10 min)
- [ ] **Flow 4:** Admin Journey (5 min)
- [ ] **Flow 5:** Kiosk Display (2 min)
- [ ] **Flow 6:** Real-time Sync (5 min)

---

## 🧪 Flow 1: Patient Journey (15 minutes)

### Step 1: Landing Page
**URL:** `http://localhost:3001/`

**Actions:**
1. ✅ Verify landing page loads
2. ✅ Check "Continue as Patient" button visible
3. ✅ Check "Partner Login" button visible
4. ✅ Verify clinic search bar present

**Expected Results:**
- Page loads without errors
- Console shows: "Clinics loaded from Supabase: X"
- No red errors in console

**Screenshot Checklist:**
- [ ] Landing page hero section
- [ ] Clinic search interface

---

### Step 2: Patient Signup
**URL:** `http://localhost:3001/login/patient`

**Actions:**
1. Click "Continue as Patient"
2. Click "Sign Up" (if available)
3. Fill form:
   - Name: `Test Patient`
   - Phone: `9876543210`
   - Email: `testpatient@example.com`
   - Password: `Test@123456`
4. Click "Sign Up"

**Expected Results:**
- Success message: "Please check your email to confirm your account"
- OR auto-login if email confirmation disabled
- No errors in console

**Common Issues:**
- ❌ "User already exists" → Use different email
- ❌ "Password too weak" → Use stronger password
- ❌ "Service not initialized" → Check Supabase config

---

### Step 3: Patient Login
**URL:** `http://localhost:3001/login/patient`

**Actions:**
1. Enter email: `testpatient@example.com`
2. Enter password: `Test@123456`
3. Click "Login"

**Expected Results:**
- Redirects to `/patient`
- Welcome message: "Welcome, Test Patient"
- Clinic list visible

**Console Logs to Check:**
```
✅ "Attempting login for: testpatient@example.com"
✅ "Login successful, user ID: xxx"
✅ "Login completed successfully for user: Test Patient"
```

---

### Step 4: Search Clinics
**URL:** `http://localhost:3001/patient`

**Actions:**
1. Use search bar to search for "Chennai" or "Mumbai"
2. Click on a clinic card
3. View clinic details

**Expected Results:**
- Clinics filtered by search query
- Clinic details page shows:
  - Clinic name, address, contact
  - List of doctors
  - Operating hours
  - Amenities

**Data to Verify:**
- [ ] Clinic name displayed
- [ ] Doctor list populated
- [ ] Ratings visible
- [ ] "Book Appointment" button present

---

### Step 5: Book Appointment
**URL:** `http://localhost:3001/patient/clinic/{clinicId}/book`

**Actions:**
1. Select a doctor
2. Choose appointment date (today or tomorrow)
3. Select time slot
4. Fill patient details:
   - Age: `30`
   - Gender: `Male`
   - Symptoms: `Fever and cough`
5. Click "Confirm Booking"

**Expected Results:**
- Success message: "Appointment booked successfully"
- Token number assigned
- Redirects to active visits

**Console Logs to Check:**
```
✅ "Patient added to queue"
✅ "Token number: X"
```

---

### Step 6: View Active Visits
**URL:** `http://localhost:3001/patient`

**Actions:**
1. Navigate to "Active Visits" tab
2. View appointment details
3. Check queue position

**Expected Results:**
- Appointment card visible with:
  - Token number
  - Doctor name
  - Clinic name
  - Status: "WAITING"
  - Queue position

**Real-time Test:**
- Keep this tab open
- In another tab, change patient status (as reception)
- Verify status updates automatically (no refresh needed)

---

### Step 7: Check-In (QR Simulation)
**URL:** `http://localhost:3001/patient`

**Actions:**
1. Click "Check In" button on appointment card
2. Confirm check-in

**Expected Results:**
- Status changes to "Checked In"
- Success message: "Checked in successfully"
- Queue position updates

---

### Step 8: Rate Doctor (Post-Visit)
**URL:** `http://localhost:3001/patient`

**Actions:**
1. After visit is completed (status: COMPLETED)
2. Click "Rate Doctor"
3. Select 5 stars
4. Write feedback: "Excellent service"
5. Submit

**Expected Results:**
- Rating saved
- Thank you message
- Visit moved to history

---

## 👨‍⚕️ Flow 2: Doctor Journey (10 minutes)

### Step 1: Doctor Login
**URL:** `http://localhost:3001/login/staff`

**Actions:**
1. Click "Partner Login" from landing page
2. Select "Doctor" role
3. Enter credentials:
   - Email: `doctor@clinic.com`
   - Password: `Doctor@123`
4. Select clinic (if multi-clinic doctor)

**Expected Results:**
- Redirects to `/clinic/{clinicId}/doctor`
- Doctor dashboard loads
- Patient queue visible

---

### Step 2: View Patient Queue
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. View list of waiting patients
2. Check patient details:
   - Token number
   - Name, age, gender
   - Symptoms
   - Wait time

**Expected Results:**
- Queue sorted by priority:
  1. Emergency patients first
  2. Appointments by time
  3. Walk-ins by token number

**Data to Verify:**
- [ ] Patient count matches reception view
- [ ] Emergency patients highlighted
- [ ] Appointment times visible

---

### Step 3: Call Next Patient
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. Click "Next Patient" button
2. Verify patient status changes to "WITH_DOCTOR"

**Expected Results:**
- Patient card highlighted
- Status: "WITH_DOCTOR"
- Timer starts (consultation time)
- Previous patient (if any) marked "COMPLETED"

**Real-time Test:**
- Open reception dashboard in another tab
- Verify status updates automatically

---

### Step 4: Record Vitals & Diagnosis
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. Click on patient card
2. Click "Add Vitals"
3. Enter:
   - BP: `120/80`
   - Temp: `98.6°F`
   - Pulse: `72`
4. Add diagnosis: `Common cold, prescribed rest and fluids`
5. Save

**Expected Results:**
- Vitals saved
- Diagnosis recorded
- Success message

---

### Step 5: Complete Consultation
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. Click "Complete" button
2. Confirm completion

**Expected Results:**
- Patient status: "COMPLETED"
- Patient removed from active queue
- Next patient automatically called (if auto-advance enabled)

---

### Step 6: Update Doctor Status
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. Click status dropdown
2. Select "ON_BREAK"
3. Set delay: 15 minutes

**Expected Results:**
- Status badge changes to "ON_BREAK"
- Delay timer visible
- Patients notified of delay

---

### Step 7: Switch Clinic (Multi-Clinic Doctor)
**URL:** `http://localhost:3001/clinic/{clinicId}/doctor`

**Actions:**
1. Click "Switch Clinic" button
2. Select another clinic
3. Verify queue loads for new clinic

**Expected Results:**
- Redirects to new clinic dashboard
- Queue updates
- Doctor profile maintained (same masterId)

---

## 🏥 Flow 3: Reception Journey (10 minutes)

### Step 1: Reception Login
**URL:** `http://localhost:3001/login/staff`

**Actions:**
1. Click "Partner Login"
2. Select "Receptionist" role
3. Enter credentials:
   - Email: `reception@clinic.com`
   - Password: `Reception@123`

**Expected Results:**
- Redirects to `/clinic/{clinicId}/reception`
- Reception dashboard loads
- Patient queue visible

---

### Step 2: Add Walk-In Patient
**URL:** `http://localhost:3001/clinic/{clinicId}/reception`

**Actions:**
1. Click "Add Patient" button
2. Fill form:
   - Name: `Walk-In Patient`
   - Phone: `9999999999`
   - Age: `25`
   - Gender: `Female`
   - Symptoms: `Headache`
   - Select doctor
3. Click "Add to Queue"

**Expected Results:**
- Patient added to queue
- Token number assigned
- Success message: "Patient added to queue"
- Patient card appears in queue

**Console Logs to Check:**
```
✅ "Patient added to queue"
✅ "Token number: X"
```

---

### Step 3: Manage Patient Queue
**URL:** `http://localhost:3001/clinic/{clinicId}/reception`

**Actions:**
1. View patient queue
2. Click on patient card
3. Update status:
   - WAITING → WITH_DOCTOR
   - WITH_DOCTOR → COMPLETED
4. Try drag-and-drop to reorder (if implemented)

**Expected Results:**
- Status updates immediately
- Queue reorders automatically
- Real-time sync with doctor dashboard

---

### Step 4: Add Doctor
**URL:** `http://localhost:3001/clinic/{clinicId}/reception`

**Actions:**
1. Navigate to "Doctors" tab
2. Click "Add Doctor"
3. Fill form:
   - Name: `Dr. New Doctor`
   - Specialty: `Cardiology`
   - Mobile: `9876543210`
   - Email: `newdoctor@clinic.com`
   - Consultation Fee: `500`
4. Save

**Expected Results:**
- Doctor added to clinic
- Doctor appears in list
- Success message

---

### Step 5: Manage Staff
**URL:** `http://localhost:3001/clinic/{clinicId}/reception`

**Actions:**
1. Navigate to "Staff" tab
2. Click "Add Staff"
3. Fill form:
   - Name: `New Receptionist`
   - Role: `RECEPTIONIST`
   - Phone: `9876543210`
   - Email: `newstaff@clinic.com`
4. Save

**Expected Results:**
- Staff member added
- Appears in staff list
- Success message

**Known Issue:**
⚠️ Staff service not fully implemented - data may not persist

---

### Step 6: View Analytics
**URL:** `http://localhost:3001/clinic/{clinicId}/reception`

**Actions:**
1. Navigate to "Analytics" tab
2. View statistics:
   - Total patients today
   - Average wait time
   - Completed consultations
   - Doctor utilization

**Expected Results:**
- Statistics displayed
- Charts/graphs visible (if implemented)
- Real-time updates

---

## 👑 Flow 4: Admin Journey (5 minutes)

### Step 1: Admin Login
**URL:** `http://localhost:3001/login/staff`

**Actions:**
1. Click "Partner Login"
2. Select "Admin" role
3. Enter credentials:
   - Email: `admin@smartqflow.com`
   - Password: `Admin@123`

**Expected Results:**
- Redirects to `/admin`
- Admin dashboard loads
- All clinics visible

---

### Step 2: View All Clinics
**URL:** `http://localhost:3001/admin`

**Actions:**
1. View clinic list
2. Check clinic details:
   - Name, city, plan
   - Subscription status
   - Doctor count, patient count

**Expected Results:**
- All clinics displayed
- Statistics accurate
- No errors

---

### Step 3: Manage Clinic
**URL:** `http://localhost:3001/admin`

**Actions:**
1. Click on a clinic
2. Edit clinic details
3. Change plan (Solo → Premium)
4. Toggle subscription status (Active → Suspended)
5. Save changes

**Expected Results:**
- Changes saved
- Success message
- Clinic list updates

---

### Step 4: System Administration
**URL:** `http://localhost:3001/admin`

**Actions:**
1. Navigate to "System" tab
2. View system health
3. Check database connection
4. View error logs (if implemented)

**Expected Results:**
- System status: "Healthy"
- Database: "Connected"
- No critical errors

---

## 📺 Flow 5: Kiosk Display (2 minutes)

### Step 1: Kiosk Login
**URL:** `http://localhost:3001/clinic/{clinicId}/kiosk`

**Actions:**
1. Navigate to kiosk URL
2. Enter kiosk credentials (if required)

**Expected Results:**
- Full-screen display
- Current queue visible
- Auto-refresh every 30 seconds

---

### Step 2: View Queue Display
**URL:** `http://localhost:3001/clinic/{clinicId}/kiosk`

**Actions:**
1. View current patient numbers
2. Check doctor availability
3. Verify real-time updates

**Expected Results:**
- Large, readable text
- Color-coded status
- Smooth animations

---

## 🔄 Flow 6: Real-time Sync Testing (5 minutes)

### Test 1: Two-Window Patient Status Update

**Setup:**
1. Open reception dashboard in Window 1
2. Open doctor dashboard in Window 2

**Actions:**
1. In Window 1 (Reception): Mark patient as "WITH_DOCTOR"
2. Watch Window 2 (Doctor): Verify status updates automatically

**Expected Results:**
- ✅ Window 2 updates within 1-2 seconds
- ✅ No page refresh needed
- ✅ Console shows: "Queue updated - patients: X"

---

### Test 2: Two-Window Doctor Status Update

**Setup:**
1. Open doctor dashboard in Window 1
2. Open patient view in Window 2

**Actions:**
1. In Window 1 (Doctor): Change status to "ON_BREAK"
2. Watch Window 2 (Patient): Verify doctor shown as unavailable

**Expected Results:**
- ✅ Window 2 updates within 1-2 seconds
- ✅ Doctor badge changes to "ON_BREAK"
- ✅ Delay message visible

---

### Test 3: Multi-User Queue Update

**Setup:**
1. Open reception dashboard in Window 1
2. Open kiosk display in Window 2
3. Open patient tracker in Window 3

**Actions:**
1. In Window 1: Add new patient
2. Watch Windows 2 & 3: Verify patient appears

**Expected Results:**
- ✅ All windows update simultaneously
- ✅ Token number consistent across all views
- ✅ No duplicate entries

---

## 🐛 Common Issues & Solutions

### Issue 1: "Service not initialized"
**Cause:** Supabase client not configured  
**Solution:**
```bash
# Check .env.local file
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

---

### Issue 2: "Clinics loaded from Supabase: 0"
**Cause:** No clinics in database  
**Solution:**
1. Go to `/setup`
2. Create a test clinic
3. Add doctors
4. Refresh page

---

### Issue 3: Real-time not working
**Cause:** WebSocket connection failed  
**Solution:**
1. Check browser console for WebSocket errors
2. Verify Supabase realtime enabled
3. Check network tab for `wss://` connections

---

### Issue 4: Login fails with "Invalid credentials"
**Cause:** User not found or wrong password  
**Solution:**
1. Check Supabase Auth dashboard
2. Verify user exists
3. Reset password if needed

---

### Issue 5: Patient not appearing in queue
**Cause:** Database insert failed  
**Solution:**
1. Check console for errors
2. Verify patient data valid
3. Check Supabase logs

---

## 📊 Testing Results Template

Use this template to document your testing results:

```markdown
## Testing Results - [Date]

### Environment
- URL: http://localhost:3001/
- Browser: Chrome 120
- Supabase: Connected ✅

### Flow 1: Patient Journey
- [ ] Landing page loads ✅
- [ ] Signup works ✅
- [ ] Login works ✅
- [ ] Search clinics ✅
- [ ] Book appointment ✅
- [ ] View active visits ✅
- [ ] Check-in ✅
- [ ] Rate doctor ✅

**Issues Found:**
1. [Issue description]
2. [Issue description]

### Flow 2: Doctor Journey
- [ ] Login works ✅
- [ ] View queue ✅
- [ ] Call next patient ✅
- [ ] Record vitals ✅
- [ ] Complete consultation ✅
- [ ] Update status ✅
- [ ] Switch clinic ✅

**Issues Found:**
1. [Issue description]

### Flow 3: Reception Journey
- [ ] Login works ✅
- [ ] Add walk-in patient ✅
- [ ] Manage queue ✅
- [ ] Add doctor ✅
- [ ] Manage staff ⚠️ (Not persisting)
- [ ] View analytics ✅

**Issues Found:**
1. Staff service not implemented

### Flow 4: Admin Journey
- [ ] Login works ✅
- [ ] View all clinics ✅
- [ ] Manage clinic ✅
- [ ] System admin ✅

**Issues Found:**
None

### Flow 5: Kiosk Display
- [ ] Kiosk loads ✅
- [ ] Queue display ✅
- [ ] Auto-refresh ✅

**Issues Found:**
None

### Flow 6: Real-time Sync
- [ ] Two-window patient update ✅
- [ ] Two-window doctor update ✅
- [ ] Multi-user queue update ✅

**Issues Found:**
None

### Overall Assessment
- **Total Tests:** 35
- **Passed:** 33
- **Failed:** 1
- **Warnings:** 1
- **Success Rate:** 94%

### Critical Issues
1. Staff service not persisting data

### Recommendations
1. Implement staffService.ts
2. Add error handling for network failures
3. Improve loading states
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Document results
2. Create production build: `npm run build`
3. Deploy to staging
4. Run smoke tests on staging
5. Deploy to production

### If Tests Fail ❌
1. Document all failures
2. Create GitHub issues
3. Prioritize by severity
4. Fix critical issues first
5. Re-test after fixes

---

## 📞 Support

If you encounter issues during testing:

1. **Check Console:** Look for error messages
2. **Check Network Tab:** Verify API calls
3. **Check Supabase Logs:** View database errors
4. **Review Documentation:** Check TROUBLESHOOTING.md
5. **Ask for Help:** Contact development team

---

**Happy Testing! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** SmartQFlow Development Team
