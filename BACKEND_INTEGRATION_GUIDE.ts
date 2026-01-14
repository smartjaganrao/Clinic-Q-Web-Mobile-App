/**
 * SUPABASE BACKEND INTEGRATION - COMPLETE SETUP GUIDE
 * 
 * This guide walks you through setting up full Supabase backend integration
 * removing all localStorage dependencies and mock data.
 */

// ============================================================================
// STEP 1: ENVIRONMENT SETUP
// ============================================================================

/**
 * Create a .env.local file in your project root with:
 * 
 * VITE_SUPABASE_URL=https://your-project.supabase.co
 * VITE_SUPABASE_ANON_KEY=your-anon-public-key
 * 
 * Get these from Supabase Dashboard:
 * 1. Go to Project Settings > API
 * 2. Copy URL and anon public key
 */

// ============================================================================
// STEP 2: DATABASE SCHEMA SETUP
// ============================================================================

/**
 * 1. Open Supabase Dashboard
 * 2. Go to SQL Editor
 * 3. Copy all SQL from SUPABASE_SCHEMA.sql
 * 4. Paste and execute in SQL Editor
 * 5. Wait for all tables to be created
 * 
 * This creates:
 * - user_profiles (extends Supabase auth)
 * - clinics, doctors, patients, staff, appointments
 * - Helper functions for queue stats, availability, etc.
 * - Row-level security policies
 * - Realtime subscriptions
 */

// ============================================================================
// STEP 3: UPDATE APP.TSX
// ============================================================================

/**
 * Replace the import section in App.tsx with:
 * 
 * import { backendManager, authService, clinicService, patientService, doctorService } from './services/backendManager';
 * import { UserRole, Clinic, Patient, Doctor } from './types';
 * 
 * Add this initialization code in App component:
 * 
 * useEffect(() => {
 *   const initializeBackend = async () => {
 *     try {
 *       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 *       const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 *       
 *       if (!supabaseUrl || !supabaseKey) {
 *         console.error('Supabase credentials not configured');
 *         return;
 *       }
 *       
 *       await backendManager.initialize(supabaseUrl, supabaseKey);
 *       
 *       // Subscribe to auth changes
 *       authService.onAuthStateChange((user) => {
 *         if (user) {
 *           console.log('User authenticated:', user.name);
 *           handleSystemLogin(user.role, user.clinicId || '', user.id);
 *         }
 *       });
 *       
 *       // Load clinics from database
 *       const clinics = await clinicService.getAllClinics();
 *       setClinics(clinics);
 *       
 *     } catch (error) {
 *       console.error('Failed to initialize backend:', error);
 *     }
 *   };
 *   
 *   initializeBackend();
 * }, []);
 */

// ============================================================================
// STEP 4: AUTHENTICATION INTEGRATION
// ============================================================================

/**
 * Replace all localStorage-based auth with service calls:
 * 
 * OLD (localStorage):
 * localStorage.setItem(`clinicq_patient_${email}`, JSON.stringify(user));
 * 
 * NEW (Supabase):
 * const result = await authService.login({ email, password });
 * if (result.success) {
 *   handlePatientLogin(result.user!.phone, result.user!.name);
 * }
 * 
 * Registration:
 * const result = await authService.signup({
 *   email,
 *   password,
 *   name,
 *   phone,
 *   role: UserRole.PATIENT
 * });
 */

// ============================================================================
// STEP 5: CLINIC OPERATIONS
// ============================================================================

/**
 * Get all clinics:
 * const clinics = await clinicService.getAllClinics();
 * 
 * Search clinics:
 * const results = await clinicService.searchClinics(searchQuery);
 * 
 * Get nearby clinics:
 * const nearByClinics = await clinicService.getNearByClinics(lat, lng, radiusKm);
 * 
 * Subscribe to clinic updates:
 * const unsubscribe = clinicService.subscribeToClinic(clinicId, (clinic) => {
 *   setClinics(prev => prev.map(c => c.id === clinic.id ? clinic : c));
 * });
 */

// ============================================================================
// STEP 6: PATIENT QUEUE MANAGEMENT
// ============================================================================

/**
 * Add patient to queue:
 * const result = await patientService.addPatient(clinicId, {
 *   id: generateId(),
 *   name: patientName,
 *   phone: patientPhone,
 *   doctorId: selectedDoctorId,
 *   status: PatientStatus.WAITING,
 *   visitType: 'WALK_IN',
 *   timeAdded: Date.now(),
 *   age: age,
 *   gender: gender,
 *   symptoms: symptoms
 * });
 * 
 * Get clinic queue:
 * const patients = await patientService.getClinicQueue({
 *   clinicId,
 *   doctorId: selectedDoctorId
 * });
 * 
 * Update patient status:
 * await patientService.updatePatientStatus(patientId, PatientStatus.WITH_DOCTOR);
 * 
 * Subscribe to queue updates:
 * const unsubscribe = patientService.subscribeToQueue(clinicId, (patients) => {
 *   setQueue(patients);
 * });
 * 
 * Check in patient:
 * await patientService.checkInPatient(patientId);
 */

// ============================================================================
// STEP 7: DOCTOR MANAGEMENT
// ============================================================================

/**
 * Get doctors in clinic:
 * const doctors = await doctorService.getDoctors({ clinicId });
 * 
 * Get doctors by specialty:
 * const cardiologists = await doctorService.getDoctorsBySpecialty(clinicId, 'Cardiology');
 * 
 * Update doctor status:
 * await doctorService.updateDoctorStatus(doctorId, DoctorStatus.ON_BREAK);
 * 
 * Update doctor schedule:
 * await doctorService.updateDoctorSchedule(doctorId, newSchedule);
 * 
 * Get doctor availability:
 * const availability = await doctorService.getDoctorAvailability(doctorId, '2026-01-15');
 * 
 * Subscribe to doctor updates:
 * const unsubscribe = doctorService.subscribeToDoctor(doctorId, (doctor) => {
 *   updateDoctorUI(doctor);
 * });
 */

// ============================================================================
// STEP 8: REMOVE LOCALSTORAGE USAGE
// ============================================================================

/**
 * Find and replace all localStorage calls:
 * 
 * Patient auth data → authService
 * Session data → authService.getSession()
 * Recent searches → Database table (optional)
 * UI preferences (kiosk voice) → User metadata via authService.updateProfile()
 * 
 * SEARCH & REPLACE:
 * 
 * OLD: localStorage.getItem(`clinicq_patient_${email}`)
 * NEW: await authService.getCurrentUser()
 * 
 * OLD: localStorage.setItem('clinicq_session_v2', JSON.stringify(session))
 * NEW: authService handles session automatically via Supabase
 * 
 * OLD: localStorage.removeItem(...)
 * NEW: await authService.logout()
 */

// ============================================================================
// STEP 9: EXAMPLE: COMPLETE PATIENT FLOW
// ============================================================================

/**
 * // Patient Signup
 * const handlePatientSignup = async (email: string, password: string, name: string, phone: string) => {
 *   const result = await authService.signup({
 *     email,
 *     password,
 *     name,
 *     phone,
 *     role: UserRole.PATIENT
 *   });
 *   
 *   if (result.success) {
 *     setPatientAuth({ name: result.user!.name, phone: result.user!.phone });
 *     navigate('/patient');
 *   } else {
 *     addToast(result.error || 'Signup failed', 'error');
 *   }
 * };
 * 
 * // Patient Login
 * const handlePatientLogin = async (email: string, password: string) => {
 *   const result = await authService.login({ email, password });
 *   
 *   if (result.success && result.user?.role === UserRole.PATIENT) {
 *     setPatientAuth({ name: result.user.name, phone: result.user.phone });
 *     navigate('/patient');
 *   } else {
 *     addToast('Login failed', 'error');
 *   }
 * };
 * 
 * // Get Token (Queue)
 * const handleGetToken = async (name: string, phone: string, doctorId: string, clinicId: string) => {
 *   const result = await patientService.addPatient(clinicId, {
 *     id: `pat_${Date.now()}`,
 *     name,
 *     phone,
 *     doctorId,
 *     status: PatientStatus.WAITING,
 *     visitType: 'WALK_IN',
 *     timeAdded: Date.now(),
 *     age: '25',
 *     gender: 'Male'
 *   });
 *   
 *   if (result.success) {
 *     addToast('Token received!', 'success');
 *   }
 * };
 * 
 * // View Queue (Realtime)
 * useEffect(() => {
 *   const unsubscribe = patientService.subscribeToQueue(clinicId, (patients) => {
 *     setQueue(patients.filter(p => p.doctorId === selectedDoctorId));
 *   });
 *   return unsubscribe;
 * }, [clinicId, selectedDoctorId]);
 */

// ============================================================================
// STEP 10: MIGRATION CHECKLIST
// ============================================================================

/**
 * ☐ Create Supabase project
 * ☐ Run SQL schema setup
 * ☐ Configure environment variables
 * ☐ Create user_profiles table
 * ☐ Set up storage buckets for images
 * ☐ Replace all localStorage calls with service methods
 * ☐ Remove mockData.ts imports
 * ☐ Remove INITIAL_CLINICS from constants.ts (use database)
 * ☐ Update all components to use new services
 * ☐ Test authentication flow (signup, login, logout)
 * ☐ Test clinic operations (list, search, details)
 * ☐ Test patient queue (add, update status, subscribe)
 * ☐ Test doctor operations (list, schedule, availability)
 * ☐ Test realtime subscriptions (queue, clinic updates)
 * ☐ Test permissions (RLS policies)
 * ☐ Performance test with large datasets
 * ☐ Load test concurrent users
 * ☐ Set up error logging/monitoring
 * ☐ Deploy to production
 */

// ============================================================================
// STEP 11: COMMON PATTERNS
// ============================================================================

/**
 * Pattern: Protected Route (check authentication)
 * 
 * const ProtectedRoute = ({ children }: any) => {
 *   const user = authService.getCurrentUser();
 *   if (!user) return <Navigate to="/login" />;
 *   return children;
 * };
 * 
 * <Route path="/clinic/:clinicId/doctor" element={
 *   <ProtectedRoute>
 *     <DoctorDashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * ========================================================================
 * 
 * Pattern: Real-time Queue Display
 * 
 * useEffect(() => {
 *   const unsubscribe = patientService.subscribeToQueue(clinicId, (patients) => {
 *     // Filter and sort patients
 *     const sortedQueue = patients
 *       .filter(p => p.status === PatientStatus.WAITING)
 *       .sort((a, b) => a.tokenNumber - b.tokenNumber);
 *     setQueue(sortedQueue);
 *   });
 *   return unsubscribe;
 * }, [clinicId]);
 * 
 * ========================================================================
 * 
 * Pattern: Update Multiple Related Records
 * 
 * // Update patient status when doctor calls next
 * const handleCallNext = async (patientId: string) => {
 *   // Move patient to WITH_DOCTOR
 *   await patientService.updatePatientStatus(patientId, PatientStatus.WITH_DOCTOR);
 *   
 *   // Update doctor status if needed
 *   await doctorService.updateDoctorStatus(doctorId, DoctorStatus.AVAILABLE);
 *   
 *   // Real-time subscribers will auto-update
 * };
 * 
 * ========================================================================
 * 
 * Pattern: Error Handling
 * 
 * const handleAddPatient = async () => {
 *   const result = await patientService.addPatient(clinicId, patientData);
 *   
 *   if (result.success) {
 *     addToast('Patient added successfully', 'success');
 *   } else {
 *     addToast(result.error || 'Failed to add patient', 'error');
 *     console.error('Detailed error:', result.error);
 *   }
 * };
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Issue: "Supabase credentials not configured"
 * Solution: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
 * 
 * Issue: "Service not initialized"
 * Solution: Call backendManager.initialize() before using services
 * 
 * Issue: RLS policy denying access
 * Solution: Check that user has necessary roles/permissions in database
 * 
 * Issue: Realtime not updating
 * Solution: Ensure table is included in realtime publication settings
 * 
 * Issue: Performance issues
 * Solution: Check indexes, add missing indexes for frequently queried columns
 * 
 * Issue: Auth not persisting on page reload
 * Solution: authService handles this via Supabase session, check browser cookies/storage
 */

export const INTEGRATION_GUIDE = {
  steps: 11,
  completionTime: '2-4 hours',
  difficulty: 'Intermediate',
  prerequisites: [
    'Supabase account',
    'Node.js environment',
    'Basic SQL knowledge (optional)',
    'React/TypeScript familiarity'
  ]
};
