
import { Clinic, Patient, Doctor, Staff, PatientStatus, DoctorStatus, PlanType, DaySchedule, ClinicType, UserRole } from '../types';
import { INITIAL_CLINICS, SUPER_ADMIN_PROFILE } from '../constants';
import { getSupabase } from './supabaseClient';

const STORAGE_KEY = 'clinicq_db_v2';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StorageService {
  private clinics: Clinic[] = [];
  private listeners: ((clinics: Clinic[]) => void)[] = [];
  private alertListeners: ((msg: string, type: 'info' | 'success' | 'warning' | 'error') => void)[] = [];
  private syncTimers: { [key: string]: any } = {};

  constructor() {
    this.load();
    if (typeof window !== 'undefined') {
        setInterval(() => this.checkDoctorDelays(), 60000); // Check delays every minute
    }
  }

  private async load() {
    try {
      // 1. Load from LocalStorage first (Cache/Offline support)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        this.clinics = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
                    } catch (e) {
                        console.warn('Failed to parse stored clinics, falling back to initial clinics.', e);
                        this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
                        this.saveLocal();
                    }
                } else {
                    this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
                    this.saveLocal();
                }
        this.sanitizeData();
        this.notify(); // Render cached data immediately
      }

      // 2. Try syncing with Supabase
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.from('clinics').select('*');
                    if (!error && data) {
          if (data.length === 0 && this.clinics.length > 0) {
            // Remote is empty but we have local data (Fresh Sync). Keep local data.
            console.log("Remote DB is empty. Preserving local data for seeding.");
          } else {
                        // Update local state with Cloud data (filter out null rows)
                        const mapped = data.map((row: any) => row && row.data).filter(Boolean);
                        this.clinics = Array.isArray(mapped) ? mapped : [];
                        this.saveLocal(); // Update cache
                        this.notify();
                    }
          
          // 3. Enable Realtime Subscriptions
          supabase.channel('public:clinics')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const updatedClinic = payload.new.data;
                    this.clinics = this.clinics.map(c => c.id === updatedClinic.id ? updatedClinic : c);
                    if (!this.clinics.find(c => c.id === updatedClinic.id)) {
                        this.clinics.push(updatedClinic);
                    }
                    this.saveLocal();
                    this.notify();
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    this.clinics = this.clinics.filter(c => c.id !== deletedId);
                    this.saveLocal();
                    this.notify();
                }
            })
            .subscribe();

          // 4. Enable Granular Alerts (Patients Table)
          supabase.channel('public:patients_alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, (payload) => {
                const pData = payload.new.data;
                if (pData && pData.name) {
                    this.notifyAlert(`New Patient: ${pData.name} (Token #${pData.tokenNumber})`, 'info');
                }
            })
            .subscribe();
        }
      }
    } catch (e) {
      console.error("Storage Load Error", e);
    }
  }

  private sanitizeData() {
      // Fix potential human errors or data corruption in existing storage
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let changed = false;

      this.clinics.forEach(clinic => {
          if (!clinic) return; // Skip corrupt/null entries
          // Ensure arrays exist to avoid runtime errors
          clinic.doctors = Array.isArray(clinic.doctors) ? clinic.doctors : [];
          clinic.patients = Array.isArray(clinic.patients) ? clinic.patients : [];
          clinic.staff = Array.isArray(clinic.staff) ? clinic.staff : [];

          clinic.doctors.forEach(doc => {
              if (!doc.weeklySchedule || !Array.isArray(doc.weeklySchedule) || doc.weeklySchedule.length !== 7) {
                  // Rebuild schedule if missing or incomplete
                  doc.weeklySchedule = days.map(d => ({
                      day: d,
                      slots: [{ startTime: '09:00', endTime: '17:00', active: true, label: 'Regular' }],
                      isOff: d === 'Sunday'
                  }));
                  changed = true;
              } else {
                  // Ensure specific structure of existing schedule
                  doc.weeklySchedule.forEach(day => {
                      if (!day.slots) day.slots = [];
                      // Ensure slots have valid times or defaults
                      day.slots.forEach(slot => {
                          if (!slot.startTime) slot.startTime = "09:00";
                          if (!slot.endTime) slot.endTime = "17:00";
                      });
                  });
              }

              // Calculate dynamic average consultation time based on history
              // This ensures wait time calculations are based on actual doctor performance
              const completedVisits = clinic.patients.filter(p => 
                  p.doctorId === doc.id && 
                  p.status === PatientStatus.COMPLETED && 
                  p.timeStarted && 
                  p.timeCompleted &&
                  p.timeCompleted > p.timeStarted
              ).sort((a, b) => (b.timeCompleted || 0) - (a.timeCompleted || 0)).slice(0, 20);

              if (completedVisits.length >= 3) {
                  const totalTime = completedVisits.reduce((sum, p) => sum + ((p.timeCompleted! - p.timeStarted!) / 60000), 0);
                  const avgTime = Math.round(totalTime / completedVisits.length);
                  if (avgTime >= 2 && avgTime <= 60 && doc.consultationTime !== avgTime) {
                      doc.consultationTime = avgTime;
                      changed = true;
                  }
              }

              // Ensure consultationTime is valid (Critical for Wait Time Calculation)
              if (!doc.consultationTime || isNaN(doc.consultationTime)) {
                  doc.consultationTime = 15; // Default 15 mins
                  changed = true;
              }

              // Ensure delayMinutes is valid
              if (doc.delayMinutes === undefined || isNaN(doc.delayMinutes)) {
                  doc.delayMinutes = 0;
                  changed = true;
              }

              if (this.calculateClinicDelays(clinic)) changed = true;
          });

          // Sanitize Patients (Fix Token Numbers & Queue Order)
          // Group patients by doctor to normalize queueOrder
          const doctorIds = Array.from(new Set(clinic.patients.map(p => p.doctorId)));
          doctorIds.forEach(docId => {
              const docPatients = clinic.patients.filter(p => p.doctorId === docId);
              
              // Sort to determine correct order (Robust Sort)
              docPatients.sort((a, b) => {
                  if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                      const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                      const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                      if (orderA !== orderB) return orderA - orderB;
                  }
                  if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
                  
                  const getStatusPriority = (s: PatientStatus) => (s === PatientStatus.WAITING ? 0 : s === PatientStatus.ON_HOLD ? 1 : 2);
                  const pA = getStatusPriority(a.status);
                  const pB = getStatusPriority(b.status);
                  if (pA !== pB) return pA - pB;
                  
                  const getSortTime = (p: Patient) => {
                      if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
                          return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
                      }
                      return p.timeAdded;
                  };
                  return getSortTime(a) - getSortTime(b);
              });

              // Assign normalized queueOrder
              docPatients.forEach((p, idx) => {
                  if (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD) {
                      if (p.queueOrder !== idx + 1) {
                          p.queueOrder = idx + 1;
                          changed = true;
                      }
                  }
              });
          });

          clinic.patients.forEach(p => {
              if (p.tokenNumber === undefined || p.tokenNumber === null || isNaN(Number(p.tokenNumber))) {
                  p.tokenNumber = 0; // Default to 0 if corrupt, so next patient gets 1
                  changed = true;
              }
          });
      });

      if (changed) {
          console.warn("Sanitized corrupted data in storage.");
          this.saveLocal();
      }
  }

  private calculateClinicDelays(clinic: Clinic): boolean {
      let changed = false;
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      clinic.doctors.forEach(doc => {
          const overdue = clinic.patients.filter(p => 
              p.doctorId === doc.id && p.status === PatientStatus.WAITING && 
              p.visitType === 'APPOINTMENT' && p.appointmentDate === today && p.appointmentTime
          );
          
          if (overdue.length > 0) {
              const earliest = Math.min(...overdue.map(p => parseInt(p.appointmentTime!.split(':')[0], 10) * 60 + parseInt(p.appointmentTime!.split(':')[1], 10)));
              const delay = Math.max(0, currentMinutes - earliest);
              // Only flag if delay is significant (> 15 mins) to avoid jitter
              if (delay > 15 && doc.delayMinutes !== delay) {
                  doc.delayMinutes = delay;
                  changed = true;
              }
          }
      });
      return changed;
  }

  private checkDoctorDelays() {
      let anyChanged = false;
      this.clinics.forEach(clinic => {
          if (this.calculateClinicDelays(clinic)) {
              anyChanged = true;
              this.syncClinic(clinic.id);
          }
      });
      if (anyChanged) {
          this.saveLocal();
          this.notify();
      }
  }

  private saveLocal() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.clinics));
        this.notify();
      }
    } catch (e) {
      console.error("Storage Save Error", e);
    }
  }

  // Helper to push specific clinic changes to Supabase
  private async syncClinic(clinicId: string) {
      const supabase = getSupabase();
      if (!supabase) return; // Offline mode

      // Clear any pending sync for this clinic
      if (this.syncTimers[clinicId]) {
          clearTimeout(this.syncTimers[clinicId]);
      }

      // Debounce: Wait 1.5 seconds after the last change before uploading
      this.syncTimers[clinicId] = setTimeout(async () => {
          const clinic = this.clinics.find(c => c.id === clinicId);
          if (clinic) {
              await supabase.from('clinics').upsert({ id: clinic.id, name: clinic.name, data: clinic });

              // --- HYBRID SYNC: Also update relational tables ---
              
              // 1. Sync Doctors
              const doctorRows = clinic.doctors.map(d => ({
                  id: d.id,
                  clinic_id: clinic.id,
                  name: d.name,
                  data: d
              }));
              if (doctorRows.length > 0) await supabase.from('doctors').upsert(doctorRows);

              // 2. Sync Patients
              const patientRows = clinic.patients.map(p => ({
                  id: p.id,
                  clinic_id: clinic.id,
                  doctor_id: p.doctorId,
                  status: p.status,
                  queue_order: p.queueOrder || 0,
                  data: p
              }));
              if (patientRows.length > 0) await supabase.from('patients').upsert(patientRows);
          }
          delete this.syncTimers[clinicId];
      }, 1500);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.clinics]));
  }

  private notifyAlert(msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.alertListeners.forEach(listener => listener(msg, type));
  }

  // --- PUBLIC API (Mimics Firebase/DB Interface) ---

  subscribe = (listener: (clinics: Clinic[]) => void) => {
    this.listeners.push(listener);
    listener([...this.clinics]); // Initial data
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeToAlerts = (listener: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void) => {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== listener);
    };
  }

  getClinics = async (): Promise<Clinic[]> => {
    await delay(50); // Simulate fetch
    return [...this.clinics];
  }

  // --- AUTHENTICATION OPERATIONS ---

  authenticatePartner = async (email: string, pass: string): Promise<{role: UserRole, clinicId: string, userId: string, name: string} | null> => {
      await delay(300);
      
      // 1. Check Super Admin
      if (email === SUPER_ADMIN_PROFILE.email && pass === 'password') { // Demo password
          return { role: UserRole.ADMIN, clinicId: 'admin', userId: 'admin', name: SUPER_ADMIN_PROFILE.name };
      }

      // 2. Check Kiosk Demo
      if (email === 'kiosk@demo.com' && pass === 'password') {
          // Default to first clinic for demo purposes
          const defaultClinic = this.clinics[0];
          return {
              role: UserRole.KIOSK,
              clinicId: defaultClinic ? defaultClinic.id : 'clinic_chn_1',
              userId: 'kiosk_display',
              name: 'Kiosk Display'
          };
      }

      // 3. Check Dynamic Kiosk Login (Per Clinic)
      for (const clinic of this.clinics) {
          const c = clinic as any; // Access dynamic fields
          if (c.kioskEmail && c.kioskEmail === email && c.kioskPassword === pass) {
              return {
                  role: UserRole.KIOSK,
                  clinicId: clinic.id,
                  userId: 'kiosk_display',
                  name: 'Kiosk Display'
              };
          }
      }

      // 3. Check Doctor Demo (Specifically handle the 'ravi@demo.com' email from the login page)
      if (email === 'ravi@demo.com' && pass === 'password') {
          const firstClinic = this.clinics[0];
          if (firstClinic && firstClinic.doctors.length > 0) {
              const demoDoc = firstClinic.doctors[0];
              return {
                  role: UserRole.DOCTOR,
                  clinicId: firstClinic.id,
                  userId: demoDoc.id,
                  name: demoDoc.name
              };
          }
      }

      // 4. Iterate Clinics to find match
      for (const clinic of this.clinics) {
          // Check Staff
          const staffMember = clinic.staff.find(s => s.email === email && s.password === pass);
          if (staffMember) {
              return { 
                  role: UserRole.RECEPTIONIST, 
                  clinicId: clinic.id, 
                  userId: staffMember.id,
                  name: staffMember.name
              };
          }

          // Check Doctors
          const doctor = clinic.doctors.find(d => d.email === email && d.password === pass);
          if (doctor) {
              return {
                  role: UserRole.DOCTOR,
                  clinicId: clinic.id,
                  userId: doctor.id,
                  name: doctor.name
              };
          }
      }

      return null;
  }

  // --- PATIENT OPERATIONS ---

  addPatient = async (clinicId: string, patient: Patient): Promise<Patient> => {
    await delay(100);
    
    let finalPatient = { ...patient };
    
    // Calculate Token & Queue Order here to prevent race conditions
    const clinic = this.clinics.find(c => c.id === clinicId);
    if (clinic) {
        const doctorPatients = clinic.patients.filter(p => p.doctorId === finalPatient.doctorId);
        
        // Calculate Token Number (Max + 1)
        const maxToken = doctorPatients.reduce((max, p) => {
            const t = Number(p.tokenNumber);
            return !isNaN(t) && t > max ? t : max;
        }, 0);
        finalPatient.tokenNumber = maxToken + 1;
        
        // Calculate Queue Order (Max + 1) only for WALK_IN
        if (finalPatient.visitType === 'WALK_IN') {
             const maxQueueOrder = doctorPatients.reduce((max, p) => {
                const o = p.queueOrder ?? 0;
                return o > max ? o : max;
            }, 0);
            finalPatient.queueOrder = maxQueueOrder + 1;
        } else {
            finalPatient.queueOrder = undefined;
        }
    }

    this.clinics = this.clinics.map(c => 
      c.id === clinicId ? { ...c, patients: [...c.patients, finalPatient] } : c
    );
    this.saveLocal();
    
    // Use Atomic RPC to prevent race conditions (Data Loss)
    const supabase = getSupabase();
    if (supabase) {
        const { error } = await supabase.rpc('add_patient', { 
            clinic_id: clinicId, 
            patient_data: finalPatient 
        });

        // HYBRID SYNC: Also insert into 'patients' table directly
        if (!error) {
            await supabase.from('patients').upsert({
                id: finalPatient.id,
                clinic_id: clinicId,
                doctor_id: finalPatient.doctorId,
                status: finalPatient.status,
                queue_order: finalPatient.queueOrder || 0,
                data: finalPatient
            });
        }
        
        if (error) {
            console.error("RPC Failed, falling back to sync:", error);
            this.syncClinic(clinicId);
        }
    } else {
        this.syncClinic(clinicId);
    }
    
    return finalPatient;
  }

  updatePatient = async (clinicId: string, patientId: string, updates: Partial<Patient>) => {
    await delay(50);
    this.clinics = this.clinics.map(c => {
      if (c.id !== clinicId) return c;

      const patientIndex = c.patients.findIndex(p => p.id === patientId);
      if (patientIndex === -1) return c;

      const patient = c.patients[patientIndex];
      const updatedPatient = { ...patient, ...updates };

      let updatedDoctors = c.doctors;
      if (updates.rating) {
          const doctorIndex = c.doctors.findIndex(d => d.id === patient.doctorId);
          if (doctorIndex !== -1) {
              const doctor = c.doctors[doctorIndex];
              const oldRating = doctor.rating || 0;
              const oldCount = doctor.reviewCount || 0;
              const newRating = ((oldRating * oldCount) + updates.rating) / (oldCount + 1);
              
              const updatedDoctor = { 
                  ...doctor,
                  rating: parseFloat(newRating.toFixed(1)),
                  reviewCount: oldCount + 1
              };
              updatedDoctors = [
                  ...c.doctors.slice(0, doctorIndex),
                  updatedDoctor,
                  ...c.doctors.slice(doctorIndex + 1)
              ];
          }
      }

      return {
        ...c,
        patients: [
          ...c.patients.slice(0, patientIndex),
          updatedPatient,
          ...c.patients.slice(patientIndex + 1)
        ],
        doctors: updatedDoctors,
      };
    });
    this.saveLocal();
    this.syncClinic(clinicId);
  }

  updatePatientStatus = async (clinicId: string, patientId: string, status: PatientStatus) => {
    await delay(50);
    this.clinics = this.clinics.map(c => 
      c.id === clinicId 
        ? { ...c, patients: c.patients.map(p => {
            if (p.id !== patientId) return p;
            const updates: Partial<Patient> = { status };
            if (status === PatientStatus.COMPLETED) updates.timeCompleted = Date.now();
            if (status === PatientStatus.WITH_DOCTOR && !p.timeStarted) updates.timeStarted = Date.now();
            return { ...p, ...updates };
        }) }
        : c
    );
    this.saveLocal();
    this.syncClinic(clinicId);
  }

  bulkUpdatePatientStatus = async (clinicId: string, patientIds: string[], status: PatientStatus) => {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId
          ? { ...c, patients: c.patients.map(p => patientIds.includes(p.id) ? { ...p, status } : p) }
          : c
      );
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  reorderQueue = async (clinicId: string, draggedId: string, targetId: string) => {
      await delay(50);
      const clinic = this.clinics.find(c => c.id === clinicId);
      if (!clinic) return;

      const queue = clinic.patients.filter(p => p.status === PatientStatus.WAITING).sort((a,b) => (a.queueOrder || 0) - (b.queueOrder || 0));
      const draggedIndex = queue.findIndex(p => p.id === draggedId);
      const targetIndex = queue.findIndex(p => p.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder logic
      const [movedItem] = queue.splice(draggedIndex, 1);
      queue.splice(targetIndex, 0, movedItem);

      // Assign new order indices
      queue.forEach((p, idx) => { p.queueOrder = idx; });

      // Merge back into main list
      this.clinics = this.clinics.map(c => 
          c.id === clinicId 
          ? { ...c, patients: c.patients.map(p => {
              const inQueue = queue.find(q => q.id === p.id);
              return inQueue ? { ...p, queueOrder: inQueue.queueOrder } : p;
          }) }
          : c
      );
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  deletePatient = async (clinicId: string, patientId: string) => {
    await delay(50);
    this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => p.id !== patientId) } : c);
    this.saveLocal();
    this.syncClinic(clinicId);
  }

  deleteMultiplePatients = async (clinicId: string, patientIds: string[]) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => !patientIds.includes(p.id)) } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  // --- DOCTOR OPERATIONS ---

  addDoctor = async (clinicId: string, doctor: Doctor) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: [...c.doctors, doctor] } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  updateDoctor = async (clinicId: string, doctorId: string, updates: Partial<Doctor>) => {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.map(d => d.id === doctorId ? { ...d, ...updates } : d) } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  deleteDoctor = async (clinicId: string, doctorId: string) => {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.filter(d => d.id !== doctorId) } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  updateDoctorStatus = async (clinicId: string, doctorId: string, status: DoctorStatus, delayMinutes: number) => {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? {
          ...c,
          doctors: c.doctors.map(d => d.id === doctorId ? { 
              ...d, 
              status, 
              delayMinutes: delayMinutes,
              statusUpdateTime: Date.now(),
              delayStartTime: delayMinutes > 0 ? Date.now() : undefined
          } : d)
      } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  // --- STAFF OPERATIONS (NEW) ---

  // Fix: Completed missing addClinicStaff method and added other essential staff operations
  addClinicStaff = async (clinicId: string, staff: Staff) => {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: [...(c.staff || []), staff] } : c
      );
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  updateClinicStaff = async (clinicId: string, staffId: string, updates: Partial<Staff>) => {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId 
          ? { ...c, staff: (c.staff || []).map(s => s.id === staffId ? { ...s, ...updates } : s) }
          : c
      );
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  deleteClinicStaff = async (clinicId: string, staffId: string) => {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: (c.staff || []).filter(s => s.id !== staffId) } : c
      );
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  // --- CLINIC OPERATIONS ---

  // Fix: Added missing clinic operations methods
  createClinic = async (clinic: Clinic) => {
      await delay(200);
      this.clinics = [...this.clinics, { ...clinic, staff: clinic.staff || [] }];
      this.saveLocal();
      this.syncClinic(clinic.id);
  }

  updateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, ...updates } : c);
      this.saveLocal();
      this.syncClinic(clinicId);
  }

  deleteClinic = async (clinicId: string) => {
      await delay(100);
      this.clinics = this.clinics.filter(c => c.id !== clinicId);
      this.saveLocal();
      
      // Delete from Supabase
      const supabase = getSupabase();
      if (supabase) {
          await supabase.from('clinics').delete().eq('id', clinicId);
      }
  }

  resetSystem = async () => {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
      this.saveLocal();
  }

  deleteAllData = async () => {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = [];
      this.saveLocal();
      
      const supabase = getSupabase();
      if (supabase) {
          await supabase.from('clinics').delete().neq('id', '0');
      }
  }

  clearAllPatients = async () => {
      await delay(200);
      // Empty the patients array for all clinics
      this.clinics = this.clinics.map(c => ({ ...c, patients: [] }));
      this.saveLocal();
      // Trigger sync for all clinics to update Supabase
      this.clinics.forEach(c => this.syncClinic(c.id));
  }

  // --- MIGRATION TOOLS ---
  
  migrateToHybrid = async () => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase not connected");

      // 1. Sync Clinics (Parent Records)
      // We ensure the base clinic records exist so Foreign Keys work
      const clinicRows = this.clinics.map(c => ({
          id: c.id,
          name: c.name,
          data: c // Keep legacy JSON blob for fallback
      }));
      const { error: cErr } = await supabase.from('clinics').upsert(clinicRows);
      if (cErr) throw new Error("Clinic Sync Failed: " + cErr.message);

      // 2. Sync Doctors (Relational)
      const doctorRows = this.clinics.flatMap(c => 
          c.doctors.map(d => ({
              id: d.id,
              clinic_id: c.id,
              name: d.name,
              data: d // Store full profile as JSON
          }))
      );
      if (doctorRows.length > 0) {
          const { error: dErr } = await supabase.from('doctors').upsert(doctorRows);
          if (dErr) throw new Error("Doctor Sync Failed: " + dErr.message);
      }

      // 3. Sync Patients (Relational - High Traffic)
      const patientRows = this.clinics.flatMap(c => 
          c.patients.map(p => ({
              id: p.id,
              clinic_id: c.id,
              doctor_id: p.doctorId,
              status: p.status,
              queue_order: p.queueOrder || 0,
              data: p // Store details/history as JSON
          }))
      );
      if (patientRows.length > 0) {
          const { error: pErr } = await supabase.from('patients').upsert(patientRows);
          if (pErr) throw new Error("Patient Sync Failed: " + pErr.message);
      }
  }

  // --- SEEDING ---

  seedDatabase = async () => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase not connected");

      // If local is empty, fallback to INITIAL_CLINICS
      let dataToSeed = this.clinics;
      if (dataToSeed.length === 0) {
          dataToSeed = JSON.parse(JSON.stringify(INITIAL_CLINICS));
          this.clinics = dataToSeed;
          this.saveLocal();
          this.notify();
      }

      // 1. Clear existing data
      const { error: deleteError } = await supabase.from('clinics').delete().neq('id', '0');
      if (deleteError) throw new Error("Failed to clear old data: " + deleteError.message);

      // 2. Insert new data
      const rows = dataToSeed.map(c => ({
        id: c.id,
        name: c.name,
        data: c
      }));

      const { error: insertError } = await supabase.from('clinics').insert(rows);
      if (insertError) throw new Error("Failed to insert data: " + insertError.message);
  }
}

// Fix: Exporting the storage instance for use in other modules
export const storage = new StorageService();
