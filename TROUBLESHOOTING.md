# Quick Troubleshooting Guide

## 🔴 Error: "relation 'public.clinics' does not exist"

**Cause:** Database schema not deployed

**Fix:**
1. Open Supabase Dashboard → SQL Editor
2. Paste content of `SUPABASE_SCHEMA_FIXED.sql`
3. Click Run
4. Refresh app

---

## 🔴 Error: "Cannot read property 'getAllClinics' of undefined"

**Cause:** Service not initialized

**Fix:**
```typescript
// In App.tsx, make sure import exists:
import { clinicService } from './services/clinicService';
import { patientService } from './services/patientService';
```

---

## 🔴 Auth not working: "Invalid email or password"

**Cause:** User doesn't exist in Supabase Auth OR password wrong

**Fix:**
1. Verify user exists:
   - Go to Supabase → Authentication → Users
   - Should see the email address
2. Check email is verified:
   - Click user → Check "Email confirmed at"
   - If empty, manually confirm via dashboard
3. Try password reset flow

---

## 🔴 Realtime updates not working

**Cause:** WebSocket connection not established

**Fix:**
1. Check browser DevTools → Network tab
   - Look for WebSocket connection to `wss://your-project.supabase.co`
   - Should be "101 Switching Protocols" (successful)

2. Verify subscriptions enabled in Supabase:
   ```sql
   SELECT * FROM pg_publication;
   ```
   Should see `supabase_realtime`

3. Check RLS policies not blocking:
   ```sql
   SELECT * FROM pg_policies WHERE tablename='patients';
   ```

---

## 🔴 Error: "Clinic not found" when checking in patients

**Cause:** currentClinicId not set

**Fix:**
1. Make sure you're logged in as staff/doctor
2. Selected a clinic
3. currentClinicId should be in URL: `/clinic/xyz/reception`

---

## 🔴 Patients not appearing in queue

**Cause:** Wrong clinic or filter active

**Fix:**
1. Verify patients added for correct clinic
2. Check status filter:
   - "LIVE" tab shows WAITING + ON_HOLD
   - "DONE" tab shows COMPLETED
3. Check date filter matches today

---

## 🔴 New clinics/doctors not loading

**Cause:** Data not loaded from Supabase

**Fix:**
1. Check console for errors
2. Manually refresh browser `Ctrl+R`
3. Clear cache: `Ctrl+Shift+Delete`
4. Verify data exists in Supabase Table Editor

---

## 🟡 Performance issue: App is slow

**Cause:** Too many realtime subscriptions or large dataset

**Fix:**
1. Check network requests:
   - Chrome DevTools → Network tab
   - Should see query times < 500ms
2. Check how many patients loaded:
   - Console: `patients.length`
   - If > 1000, paginate or filter
3. Check for memory leaks:
   - Chrome DevTools → Memory tab
   - Heap size should be < 500MB

---

## 🟡 Duplicate data/records

**Cause:** Multiple inserts or subscription not cleaned up

**Fix:**
1. Check for duplicate subscriptions in code:
   ```typescript
   // ❌ WRONG: Creates new subscription each render
   useEffect(() => {
     service.subscribe(handler);
   });

   // ✅ CORRECT: Single subscription
   useEffect(() => {
     const unsub = service.subscribe(handler);
     return () => unsub();
   }, []);
   ```

2. Clean up old data:
   ```sql
   DELETE FROM patients WHERE created_at < NOW() - INTERVAL '30 days';
   ```

---

## 🟢 Everything works but needs optimization

### Optimization Tips

1. **Add pagination to large lists**
   ```typescript
   const { data, pageCount } = await clinicService.getAllClinics({ 
     limit: 20, 
     offset: 0 
   });
   ```

2. **Add caching**
   ```typescript
   const cache = new Map();
   cache.set('clinics', data);
   // Return from cache if available
   ```

3. **Debounce search**
   ```typescript
   const debouncedSearch = debounce((query) => {
     clinicService.searchClinics(query);
   }, 300);
   ```

4. **Monitor with Supabase Analytics**
   - Dashboard → Analytics
   - Check API response times
   - Monitor realtime connections

---

## 📝 Testing Credentials

### For testing (use these during development):

**Patient Account:**
- Email: `patient@test.com`
- Password: `Patient@123456`

**Staff Account:**
- Email: `staff@clinic.com`
- Password: `Staff@123456`

**Doctor Account:**
- Email: `doctor@clinic.com`
- Password: `Doctor@123456`

Create these via signup flow first.

---

## 📞 Getting Help

### Check these first:
1. Browser console for errors: `F12 → Console`
2. Supabase logs: Dashboard → Logs
3. Database tables: Dashboard → Table Editor
4. SQL queries: Dashboard → SQL Editor

### Enable debug logging:
```typescript
// In App.tsx or service files
const DEBUG = true;
if (DEBUG) console.log("Service method called", params);
```

---

## ✅ Health Check Commands

Run these in browser console to verify everything:

```javascript
// Check Supabase client
console.log(supabase);

// Check clinics loaded
console.log(clinics);

// Check patients loaded
console.log(patients);

// Check auth state
console.log(localStorage.getItem('clinicq_session_v2'));

// Check network
fetch('https://your-project.supabase.co/rest/v1/clinics?limit=1', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
}).then(r => r.json()).then(console.log);
```

---

## 🎯 Next Steps After Testing

- [ ] Run complete testing checklist
- [ ] Fix any issues found
- [ ] Deploy to staging
- [ ] Run staging tests
- [ ] Deploy to production
