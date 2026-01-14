# SmartQFlow - Logic Issues by User Role

**Generated:** January 2025  
**Purpose:** Comprehensive list of logic issues, bugs, and edge cases for each user role  
**Priority:** Critical for production deployment

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### All Users

1. **Real-time Sync Failure Handling**
   - **Issue:** No fallback when WebSocket connection drops
   - **Impact:** Users see stale data without knowing
   - **Location:** `hooks/useRealtimeQueue.ts`, `hooks/useDoctorStatusSync.ts`
   - **Fix:** Add connection status indicator + auto-retry logic

2. **Race Condition in Status Updates**
   - **Issue:** Multiple users updating same patient status simultaneously
   - **Impact:** Data inconsistency, lost updates
   - **Location:** `App.tsx` - `handleUpdateStatus`
   - **Fix:** Implement optimistic locking with version numbers

3. **Token Number Collision**
   - **Issue:** `get_next_token_number` RPC may return duplicate tokens under high load
   - **Impact:** Two patients get same token number
   - **Location:** `services/patientService.ts` - `addPatient`
   - **Fix:** Use database sequence or atomic increment

---

## 👨‍⚕️ PATIENT FLOW ISSUES

### Authentication & Login

4. **Guest Mode Data Loss**
   - **Issue:** Guest bookings lost if user doesn't login
   - **Impact:** Patients lose their queue position
   - **Location:** `pages/PatientTracker.tsx` - `handleAuthSuccess`
   - **Fix:** Store guest bookings in localStorage, migrate on login

5. **Email Verification Loop**
   - **Issue:** Users can't login until email verified, but no resend option
   - **Impact:** Users stuck, can't access app
   - **Location:** `services/authService.ts` - `login`
   - **Fix:** Add "Resend Verification Email" button

6. **Session Expiry Without Warning**
   - **Issue:** JWT expires silently, user sees errors
   - **Impact:** Confusing UX, data loss
   - **Location:** `services/authService.ts`
   - **Fix:** Add token refresh logic + expiry warning

### Booking & Queue Management

7. **Duplicate Booking Prevention Incomplete**
   - **Issue:** Check only looks at active visits, not future appointments
   - **Impact:** User can book multiple appointments for same doctor/day
   - **Location:** `pages/PatientTracker.tsx` - `submitBooking`
   - **Fix:** Check all appointments for same date/doctor

8. **Walk-in Shift Capacity Not Enforced**
   - **Issue:** Capacity check happens client-side only
   - **Impact:** Race condition allows overbooking
   - **Location:** `pages/PatientTracker.tsx` - `handleBookToken`
   - **Fix:** Server-side capacity validation in `patientService.addPatient`

9. **Appointment Time Slot Conflicts**
   - **Issue:** Multiple patients can book same time slot
   - **Impact:** Double bookings
   - **Location:** `pages/PatientTracker.tsx` - `groupedTimeSlots`
   - **Fix:** Lock time slots during booking transaction

10. **Late Arrival Warning Calculation Wrong**
    - **Issue:** Uses estimated wait time, not actual appointment time
    - **Impact:** False warnings for appointment bookings
    - **Location:** `pages/PatientTracker.tsx` - `handleBookToken`
    - **Fix:** Different logic for appointments vs walk-ins

11. **Queue Position Calculation Inconsistent**
    - **Issue:** Different sorting logic in Patient vs Doctor view
    - **Impact:** Patient sees wrong position
    - **Location:** `pages/PatientTracker.tsx` - `getSmartQueueDetails`
    - **Fix:** Use `patientService.standardQueueSort` everywhere

12. **Check-in Without Validation**
    - **Issue:** Patient can check-in hours before appointment
    - **Impact:** Queue congestion, inaccurate wait times
    - **Location:** `App.tsx` - `handlePatientCheckIn`
    - **Fix:** Add time window validation (e.g., 30 mins before)

### Real-time Updates

13. **Status Change Notifications Missing**
    - **Issue:** Patient not notified when status changes to "WITH_DOCTOR"
    - **Impact:** Patient misses their turn
    - **Location:** `pages/PatientTracker.tsx` - `ActiveVisitsView`
    - **Fix:** Add browser notifications + sound alerts

14. **Doctor Delay Not Reflected**
    - **Issue:** Estimated time doesn't update when doctor sets delay
    - **Impact:** Patients arrive too early
    - **Location:** `pages/PatientTracker.tsx` - `getSmartQueueDetails`
    - **Fix:** Subscribe to doctor status changes

### Edge Cases

15. **Timezone Handling Broken**
    - **Issue:** `getClinicCurrentTime` doesn't handle DST
    - **Impact:** Wrong appointment times during DST transitions
    - **Location:** `App.tsx`, `utils/time.ts`
    - **Fix:** Use proper timezone library (date-fns-tz or luxon)

16. **Family Member Booking Confusion**
    - **Issue:** Booking for family member uses wrong age/gender
    - **Impact:** Incorrect patient demographics
    - **Location:** `pages/PatientTracker.tsx` - `submitBooking`
    - **Fix:** Validate member data before submission

17. **Cancel Visit Without Confirmation**
    - **Issue:** One-click cancel, no undo
    - **Impact:** Accidental cancellations
    - **Location:** `pages/PatientTracker.tsx` - `handleCancelVisit`
    - **Fix:** Already has confirmation modal, but needs undo option

---

## 👨‍⚕️ DOCTOR FLOW ISSUES

### Queue Management

18. **Next Patient Logic Flawed**
    - **Issue:** Doesn't respect manual queue reordering
    - **Impact:** Wrong patient called
    - **Location:** `App.tsx` - `handleNextPatient`
    - **Fix:** Use `queueOrder` field if set

19. **Multiple Patients "WITH_DOCTOR" Possible**
    - **Issue:** Constraint only checked client-side
    - **Impact:** Doctor sees multiple active patients
    - **Location:** `App.tsx` - `handleUpdateStatus`
    - **Fix:** Database constraint + server-side validation

20. **Hold Patient Without Notes**
    - **Issue:** No reason recorded for holding patient
    - **Impact:** Confusion when resuming
    - **Location:** `pages/DoctorDashboard.tsx` - `handleHoldPatient`
    - **Fix:** Add optional notes field

21. **Consultation Timer Not Tracked**
    - **Issue:** No tracking of actual consultation duration
    - **Impact:** Can't optimize scheduling
    - **Location:** `pages/DoctorDashboard.tsx`
    - **Fix:** Track `timeStarted` and calculate duration

### Status Management

22. **Break Timer Doesn't Pause Queue**
    - **Issue:** Estimated times still count down during break
    - **Impact:** Inaccurate patient ETAs
    - **Location:** `pages/DoctorDashboard.tsx` - `toggleBreak`
    - **Fix:** Recalculate all ETAs when status changes

23. **Delay Expiry Not Synced**
    - **Issue:** Delay clears locally but not in database
    - **Impact:** Other users still see delay
    - **Location:** `pages/DoctorDashboard.tsx` - `useEffect` for delay expiry
    - **Fix:** Call `onUpdateStatus` when delay expires

24. **Off-Shift Detection Incomplete**
    - **Issue:** Only checks current time, not future appointments
    - **Impact:** Doctor can't see upcoming appointments
    - **Location:** `pages/DoctorDashboard.tsx` - `isOffShift`
    - **Fix:** Show appointments even when off-shift

### Multi-Clinic Support

25. **Clinic Switch Loses Current Patient**
    - **Issue:** Switching clinics doesn't complete current consultation
    - **Impact:** Patient left in "WITH_DOCTOR" state
    - **Location:** `App.tsx` - `handleSwitchClinic`
    - **Fix:** Warn if active patient, require completion first

26. **Master ID Sync Issues**
    - **Issue:** Doctor profile changes don't sync across clinics
    - **Impact:** Inconsistent doctor info
    - **Location:** `services/doctorService.ts`
    - **Fix:** Update all instances when masterId matches

---

## 🏥 RECEPTION FLOW ISSUES

### Patient Management

27. **Duplicate Patient Detection Too Strict**
    - **Issue:** Blocks same patient booking different doctors
    - **Impact:** Patient can't see multiple doctors same day
    - **Location:** `App.tsx` - `handleAddPatient`
    - **Fix:** Allow duplicates if different doctorId

28. **Bulk Status Update No Validation**
    - **Issue:** Can mark patient "WITH_DOCTOR" when doctor busy
    - **Impact:** Data inconsistency
    - **Location:** `App.tsx` - `handleBulkUpdateStatus`
    - **Fix:** Validate each status change

29. **Manual Reorder Not Persisted**
    - **Issue:** `queueOrder` changes lost on refresh
    - **Impact:** Queue resets to default order
    - **Location:** `App.tsx` - `handleManualReorder`
    - **Fix:** Persist to database immediately

30. **Drag-Drop Queue Reorder Not Implemented**
    - **Issue:** Shows toast "coming soon"
    - **Impact:** Manual reordering difficult
    - **Location:** `App.tsx` - `handleDragDrop`
    - **Fix:** Implement actual drag-drop logic

### Doctor Management

31. **Doctor Schedule Validation Weak**
    - **Issue:** Can create overlapping shifts
    - **Impact:** Booking conflicts
    - **Location:** `features/reception/components/DoctorFormModal.tsx`
    - **Fix:** Check for overlaps before saving

32. **Doctor Deletion Doesn't Handle Active Patients**
    - **Issue:** Deleting doctor leaves patients orphaned
    - **Impact:** Patients can't be served
    - **Location:** `App.tsx` - `handleDeleteDoctor`
    - **Fix:** Prevent deletion if active patients, or reassign

33. **Master Doctor Check Race Condition**
    - **Issue:** Two receptionists can create duplicate master profiles
    - **Impact:** Doctor appears twice in system
    - **Location:** `App.tsx` - `checkMasterDoctor`
    - **Fix:** Database unique constraint on mobile number

### Settings & Configuration

34. **Clinic Hours Copy Overwrites Custom Schedules**
    - **Issue:** "Copy Monday to All" loses weekend customizations
    - **Impact:** Incorrect operating hours
    - **Location:** `pages/ReceptionDashboard.tsx` - `copyMondayToAll`
    - **Fix:** Add confirmation dialog

35. **Location Pin Doesn't Validate Coordinates**
    - **Issue:** Can set invalid lat/lng (e.g., 0,0)
    - **Impact:** Patients can't find clinic
    - **Location:** `pages/ReceptionDashboard.tsx` - `handleLocationSelected`
    - **Fix:** Validate coordinates are within reasonable bounds

36. **Amenity Duplicates Allowed**
    - **Issue:** Can add same amenity multiple times
    - **Impact:** Messy UI
    - **Location:** `pages/ReceptionDashboard.tsx` - `handleAddAmenity`
    - **Fix:** Already uses `Array.from(new Set(...))` but needs trim/lowercase

---

## 👑 ADMIN FLOW ISSUES

### Clinic Management

37. **Clinic Deletion No Cascade**
    - **Issue:** Deleting clinic doesn't delete doctors/patients
    - **Impact:** Orphaned data
    - **Location:** `App.tsx` - `handleDeleteClinic`
    - **Fix:** Implement cascade delete or soft delete

38. **Plan Change No Validation**
    - **Issue:** Can downgrade plan without checking limits
    - **Impact:** Clinic exceeds new plan limits
    - **Location:** `App.tsx` - `handleUpdateClinicPlan`
    - **Fix:** Validate doctor count, patient count vs plan limits

39. **Subscription Status Toggle Immediate**
    - **Issue:** No grace period for suspended clinics
    - **Impact:** Abrupt service interruption
    - **Location:** `App.tsx` - `handleToggleClinicStatus`
    - **Fix:** Add grace period + notification

### System Administration

40. **Reset System Not Implemented**
    - **Issue:** Shows "coming soon" toast
    - **Impact:** Can't reset for testing
    - **Location:** `App.tsx` - `handleResetSystem`
    - **Fix:** Implement actual reset logic

41. **Delete All Data Not Implemented**
    - **Issue:** Shows "coming soon" toast
    - **Impact:** Can't clean test data
    - **Location:** `App.tsx` - `handleDeleteAllData`
    - **Fix:** Implement with strong confirmation

---

## 📺 KIOSK FLOW ISSUES

42. **No Auto-Refresh**
    - **Issue:** Kiosk display doesn't update automatically
    - **Impact:** Shows stale queue data
    - **Location:** `pages/KioskView.tsx`
    - **Fix:** Add auto-refresh every 30 seconds

43. **No Screensaver Mode**
    - **Issue:** Display stays on 24/7
    - **Impact:** Screen burn-in
    - **Location:** `pages/KioskView.tsx`
    - **Fix:** Add idle detection + screensaver

44. **Exit Button Accessible**
    - **Issue:** Anyone can exit kiosk mode
    - **Impact:** Security risk
    - **Location:** `pages/KioskView.tsx`
    - **Fix:** Require password to exit

---

## 🔄 CROSS-CUTTING ISSUES

### Data Synchronization

45. **Optimistic Updates Can Fail Silently**
    - **Issue:** UI updates before server confirms
    - **Impact:** User sees success but data not saved
    - **Location:** Multiple places in `App.tsx`
    - **Fix:** Revert optimistic updates on error

46. **No Conflict Resolution**
    - **Issue:** Last write wins, no merge logic
    - **Impact:** Data loss when multiple users edit
    - **Location:** All update handlers
    - **Fix:** Implement version-based conflict detection

47. **Subscription Memory Leaks**
    - **Issue:** Subscriptions not cleaned up on unmount
    - **Impact:** Memory grows, performance degrades
    - **Location:** `pages/PatientTracker.tsx`, `pages/DoctorDashboard.tsx`
    - **Fix:** Ensure all `useEffect` return cleanup functions

### Error Handling

48. **Network Errors Not User-Friendly**
    - **Issue:** Shows technical error messages
    - **Impact:** User confusion
    - **Location:** All service calls
    - **Fix:** Map errors to user-friendly messages

49. **No Retry Logic**
    - **Issue:** Failed API calls not retried
    - **Impact:** Transient failures become permanent
    - **Location:** All services
    - **Fix:** Implement exponential backoff retry

50. **Offline Mode Not Supported**
    - **Issue:** App breaks when offline
    - **Impact:** Can't use in poor connectivity
    - **Location:** All components
    - **Fix:** Add offline detection + queue

### Performance

51. **Large Queue Rendering Slow**
    - **Issue:** Renders all patients at once
    - **Impact:** UI lag with 100+ patients
    - **Location:** `features/reception/components/QueueTable.tsx`
    - **Fix:** Implement virtual scrolling

52. **Unnecessary Re-renders**
    - **Issue:** Entire queue re-renders on single patient update
    - **Impact:** Poor performance
    - **Location:** `pages/ReceptionDashboard.tsx`
    - **Fix:** Use React.memo + useMemo for patient cards

53. **No Debouncing on Search**
    - **Issue:** Filters on every keystroke
    - **Impact:** Excessive re-renders
    - **Location:** `pages/PatientTracker.tsx`, `pages/ReceptionDashboard.tsx`
    - **Fix:** Debounce search input (300ms)

### Security

54. **No Role-Based Access Control**
    - **Issue:** URL-based access, no server validation
    - **Impact:** Users can access unauthorized pages
    - **Location:** `App.tsx` routing
    - **Fix:** Add route guards + server-side auth

55. **Patient Data Exposed in URL**
    - **Issue:** Patient IDs in URL params
    - **Impact:** Privacy risk
    - **Location:** Multiple routes
    - **Fix:** Use session storage instead

56. **No Rate Limiting**
    - **Issue:** Can spam API calls
    - **Impact:** DoS vulnerability
    - **Location:** All services
    - **Fix:** Implement client-side throttling + server rate limits

---

## 📊 PRIORITY MATRIX

| Priority | Count | Must Fix Before Production |
|----------|-------|----------------------------|
| 🔴 Critical | 15 | YES |
| 🟡 High | 25 | YES |
| 🟢 Medium | 12 | Recommended |
| 🔵 Low | 4 | Nice to have |
| **TOTAL** | **56** | **40 must fix** |

---

## 🎯 RECOMMENDED FIX ORDER

### Week 1: Critical Data Integrity
1. Token number collision (#3)
2. Race condition in status updates (#2)
3. Multiple patients WITH_DOCTOR (#19)
4. Duplicate booking prevention (#7)
5. Appointment time slot conflicts (#9)

### Week 2: Real-time & Sync
6. Real-time sync failure handling (#1)
7. Optimistic updates can fail (#45)
8. Subscription memory leaks (#47)
9. Status change notifications (#13)
10. Doctor delay not reflected (#14)

### Week 3: User Experience
11. Queue position calculation (#11)
12. Next patient logic (#18)
13. Timezone handling (#15)
14. Session expiry warning (#6)
15. Email verification loop (#5)

### Week 4: Edge Cases & Polish
16. Walk-in capacity enforcement (#8)
17. Check-in validation (#12)
18. Duplicate patient detection (#27)
19. Doctor deletion handling (#32)
20. Clinic hours validation (#34)

---

## 🔧 TESTING RECOMMENDATIONS

### Unit Tests Needed
- `patientService.standardQueueSort` - Test all sorting scenarios
- `getClinicCurrentTime` - Test timezone edge cases
- `getSmartQueueDetails` - Test queue position calculation
- `validateDoctorSchedule` - Test overlap detection

### Integration Tests Needed
- Patient booking flow (walk-in + appointment)
- Doctor consultation flow (call → complete)
- Reception queue management
- Real-time sync between multiple users

### E2E Tests Needed
- Complete patient journey (signup → book → check-in → rate)
- Doctor multi-clinic workflow
- Reception daily operations
- Admin clinic management

---

## 📝 CODE QUALITY ISSUES

### TypeScript Issues
57. **Unsafe Type Assertions**
    - **Issue:** Multiple `as any` casts
    - **Location:** Throughout codebase
    - **Fix:** Proper type definitions

58. **Missing Null Checks**
    - **Issue:** Optional chaining not used consistently
    - **Location:** Multiple files
    - **Fix:** Add defensive null checks

### React Best Practices
59. **useEffect Dependencies Incomplete**
    - **Issue:** Missing dependencies in useEffect
    - **Location:** Multiple components
    - **Fix:** Add all dependencies or use useCallback

60. **State Updates Not Batched**
    - **Issue:** Multiple setState calls in sequence
    - **Location:** Multiple handlers
    - **Fix:** Use React 18 automatic batching

---

## 🚀 QUICK WINS (< 1 hour each)

1. Add loading spinners to all buttons
2. Add "Resend Verification Email" button
3. Add confirmation dialog for cancel visit
4. Add debouncing to search inputs
5. Add connection status indicator
6. Add browser notification permission request
7. Add "Back to Top" button on long lists
8. Add keyboard shortcuts (Esc to close modals)
9. Add auto-focus on modal inputs
10. Add success animations on actions

---

## 📚 DOCUMENTATION NEEDED

1. API error codes and meanings
2. Queue sorting algorithm explanation
3. Timezone handling guide
4. Real-time subscription lifecycle
5. Optimistic update patterns
6. Testing guide for each user role
7. Deployment checklist
8. Monitoring and alerting setup

---

**End of Report**

**Next Steps:**
1. Review this document with development team
2. Prioritize fixes based on business impact
3. Create GitHub issues for each item
4. Assign owners and deadlines
5. Set up testing framework
6. Begin Week 1 critical fixes

**Estimated Time to Fix All Critical Issues:** 4-6 weeks

