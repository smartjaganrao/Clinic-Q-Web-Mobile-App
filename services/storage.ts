
import { Clinic, Patient, Doctor, Staff, PatientStatus, DoctorStatus, PlanType, DaySchedule, ClinicType, UserRole } from '../types';
import { INITIAL_CLINICS, SUPER_ADMIN_PROFILE } from '../constants';

const STORAGE_KEY = 'clinicq_db_v2';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StorageService {
  private clinics: Clinic[] = [];
  private listeners: ((clinics: Clinic[]) => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.clinics = JSON.parse(stored);
          this.sanitizeData(); // Ensure data integrity
        } else {
          // Deep copy to prevent mutation of the constant
          this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
          this.save();
        }
      }
    } catch (e) {
      console.error("Storage Load Error", e);
      this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
    }
  }

  private sanitizeData() {
      // Fix potential human errors or data corruption in existing storage
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let changed = false;

      this.clinics.forEach(clinic => {
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
          });
      });

      if (changed) {
          console.warn("Sanitized corrupted data in storage.");
          this.save();
      }
  }

  private save() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.clinics));
        this.notify();
      }
    } catch (e) {
      console.error("Storage Save Error", e);
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.clinics]));
  }

  // --- PUBLIC API (Mimics Firebase/DB Interface) ---

  subscribe = (listener: (clinics: Clinic[]) => void) => {
    this.listeners.push(listener);
    listener([...this.clinics]); // Initial data
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
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

  addPatient = async (clinicId: string, patient: Patient) => {
    await delay(100);
    this.clinics = this.clinics.map(c => 
      c.id === clinicId ? { ...c, patients: [...c.patients, patient] } : c
    );
    this.save();
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
    this.save();
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
    this.save();
  }

  bulkUpdatePatientStatus = async (clinicId: string, patientIds: string[], status: PatientStatus) => {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId
          ? { ...c, patients: c.patients.map(p => patientIds.includes(p.id) ? { ...p, status } : p) }
          : c
      );
      this.save();
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
      this.save();
  }

  deletePatient = async (clinicId: string, patientId: string) => {
    await delay(50);
    this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => p.id !== patientId) } : c);
    this.save();
  }

  deleteMultiplePatients = async (clinicId: string, patientIds: string[]) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => !patientIds.includes(p.id)) } : c);
      this.save();
  }

  // --- DOCTOR OPERATIONS ---

  addDoctor = async (clinicId: string, doctor: Doctor) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: [...c.doctors, doctor] } : c);
      this.save();
  }

  updateDoctor = async (clinicId: string, doctorId: string, updates: Partial<Doctor>) => {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.map(d => d.id === doctorId ? { ...d, ...updates } : d) } : c);
      this.save();
  }

  deleteDoctor = async (clinicId: string, doctorId: string) => {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.filter(d => d.id !== doctorId) } : c);
      this.save();
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
      this.save();
  }

  // --- STAFF OPERATIONS (NEW) ---

  // Fix: Completed missing addClinicStaff method and added other essential staff operations
  addClinicStaff = async (clinicId: string, staff: Staff) => {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: [...(c.staff || []), staff] } : c
      );
      this.save();
  }

  updateClinicStaff = async (clinicId: string, staffId: string, updates: Partial<Staff>) => {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId 
          ? { ...c, staff: (c.staff || []).map(s => s.id === staffId ? { ...s, ...updates } : s) }
          : c
      );
      this.save();
  }

  deleteClinicStaff = async (clinicId: string, staffId: string) => {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: (c.staff || []).filter(s => s.id !== staffId) } : c
      );
      this.save();
  }

  // --- CLINIC OPERATIONS ---

  // Fix: Added missing clinic operations methods
  createClinic = async (clinic: Clinic) => {
      await delay(200);
      this.clinics = [...this.clinics, { ...clinic, staff: clinic.staff || [] }];
      this.save();
  }

  updateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, ...updates } : c);
      this.save();
  }

  deleteClinic = async (clinicId: string) => {
      await delay(100);
      this.clinics = this.clinics.filter(c => c.id !== clinicId);
      this.save();
  }

  resetSystem = async () => {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
      this.save();
  }

  deleteAllData = async () => {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = [];
      this.save();
  }
}

// Fix: Exporting the storage instance for use in other modules
export const storage = new StorageService();
