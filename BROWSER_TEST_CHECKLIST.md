# 🧪 BROWSER TESTING CHECKLIST (30 minutes)

## Quick Test Commands
```bash
npm run dev
# Open: http://localhost:3000 or http://localhost:3001
```

## ✅ CRITICAL TESTS

### 1. Patient Flow (10 minutes)
- [ ] Open `/` → Click "Patient Login" or "Guest"
- [ ] Navigate to `/patient` → Verify clinics load
- [ ] Check console: "Clinics loaded from Supabase: X" (X > 0)
- [ ] Click clinic → Verify doctors display
- [ ] Book appointment → Verify token generation
- [ ] No `/doctor/null` routes

### 2. Admin Panel (10 minutes)  
- [ ] Navigate to `/admin`
- [ ] Add doctor → Verify saves to database
- [ ] Edit doctor → Verify changes persist
- [ ] Delete doctor → Verify removal
- [ ] Refresh page → Verify data persists

### 3. Real-time Test (5 minutes)
- [ ] Open app in 2 browser tabs
- [ ] Tab A: Change doctor status
- [ ] Tab B: Verify auto-update (no refresh needed)

### 4. Console Check (5 minutes)
- [ ] F12 → Console tab
- [ ] No red errors
- [ ] No 404 network failures
- [ ] Supabase connection confirmed

## 🚀 IF ALL TESTS PASS → DEPLOY TO PRODUCTION

## 🔧 IF ISSUES FOUND
- Check Supabase connection
- Verify environment variables
- Check network tab for failed requests
- Review console errors