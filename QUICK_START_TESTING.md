# 🚀 Quick Start Testing Guide (5 minutes)

## Setup
```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:5173 in browser
```

## Test Flow (5 steps)

### Step 1: Check Backend Connection ✓
1. Open browser console (`F12`)
2. Look for: `"Clinics loaded from Supabase: X"`
3. ✅ Success if you see clinic count

### Step 2: Patient Signup
1. Click **"Continue as Patient"**
2. Click **"Sign Up"**
3. Fill:
   - Name: `Test User`
   - Phone: `9876543210`
   - Email: `test@demo.com`
   - Password: `Test@123456`
4. Click **Create Account**
5. ✅ Success: Email verification screen shown

### Step 3: Verify Email
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find `test@demo.com`
3. Click user → Click the email icon to confirm
4. (Or use email link if configured)
5. ✅ Success: User marked as verified

### Step 4: Patient Login
1. Go back to login page
2. Login with `test@demo.com` / `Test@123456`
3. ✅ Success: See clinic list loaded

### Step 5: Test Realtime Queue
1. Open two browser windows side-by-side
2. **Window 1:** Go to **Kiosk** (select any clinic → Kiosk)
3. **Window 2:** Go to **Reception** dashboard
4. **Window 1:** Add patient
   - Name: `John Doe`
   - Phone: `9999999999`
   - Select doctor
   - Click **Check In**
5. **Window 2:** 
   - ✅ Success: New patient appears instantly in queue

---

## Expected Results

| Step | Status | Evidence |
|------|--------|----------|
| Backend connected | ✅ | Console shows clinic count |
| User signed up | ✅ | Email in Supabase Auth |
| User verified | ✅ | "Email confirmed at" timestamp |
| User logged in | ✅ | See clinic list |
| Realtime queue | ✅ | Patient appears instantly (no refresh) |

---

## If Something Goes Wrong

### Problem: "Clinics loaded: 0"
→ Check Supabase table has clinics
→ Run: `SELECT COUNT(*) FROM clinics;`

### Problem: Signup fails
→ Check Supabase Auth is enabled
→ Check password meets requirements

### Problem: Queue doesn't update
→ Check WebSocket in Network tab
→ Refresh and try again

### Problem: Email verification stuck
→ Manually verify in Supabase Auth → Users
→ Or skip and try login

---

## Success! 🎉

If you see real-time queue updates, **backend integration is working!**

### Next: Full Testing
Run the complete [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

### Questions?
Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
