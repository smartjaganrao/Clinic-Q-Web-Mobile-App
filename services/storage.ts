
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

  subscribe(listener: (clinics: Clinic[]) => void) {
    this.listeners.push(listener);
    listener([...this.clinics]); // Initial data
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async getClinics(): Promise<Clinic[]> {
    await delay(50); // Simulate fetch
    return [...this.clinics];
  }

  // --- AUTHENTICATION OPERATIONS ---

  async authenticatePartner(email: string, pass: string): Promise<{role: UserRole, clinicId: string, userId: string, name: string} | null> {
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

  async addPatient(clinicId: string, patient: Patient) {
    await delay(100);
    this.clinics = this.clinics.map(c => 
      c.id === clinicId ? { ...c, patients: [...c.patients, patient] } : c
    );
    this.save();
  }

  async updatePatient(clinicId: string, patientId: string, updates: Partial<Patient>) {
    await delay(50);
    this.clinics = this.clinics.map(c => 
      c.id === clinicId 
      ? { ...c, patients: c.patients.map(p => p.id === patientId ? { ...p, ...updates } : p) }
      : c
    );
    this.save();
  }

  async updatePatientStatus(clinicId: string, patientId: string, status: PatientStatus) {
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

  async bulkUpdatePatientStatus(clinicId: string, patientIds: string[], status: PatientStatus) {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId
          ? { ...c, patients: c.patients.map(p => patientIds.includes(p.id) ? { ...p, status } : p) }
          : c
      );
      this.save();
  }

  async reorderQueue(clinicId: string, draggedId: string, targetId: string) {
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

  async deletePatient(clinicId: string, patientId: string) {
    await delay(50);
    this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => p.id !== patientId) } : c);
    this.save();
  }

  async deleteMultiplePatients(clinicId: string, patientIds: string[]) {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, patients: c.patients.filter(p => !patientIds.includes(p.id)) } : c);
      this.save();
  }

  // --- DOCTOR OPERATIONS ---

  async addDoctor(clinicId: string, doctor: Doctor) {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: [...c.doctors, doctor] } : c);
      this.save();
  }

  async updateDoctor(clinicId: string, doctorId: string, updates: Partial<Doctor>) {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.map(d => d.id === doctorId ? { ...d, ...updates } : d) } : c);
      this.save();
  }

  async deleteDoctor(clinicId: string, doctorId: string) {
      await delay(50);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, doctors: c.doctors.filter(d => d.id !== doctorId) } : c);
      this.save();
  }

  async updateDoctorStatus(clinicId: string, doctorId: string, status: DoctorStatus, delayMinutes: number) {
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
  async addClinicStaff(clinicId: string, staff: Staff) {
      await delay(100);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: [...(c.staff || []), staff] } : c
      );
      this.save();
  }

  async updateClinicStaff(clinicId: string, staffId: string, updates: Partial<Staff>) {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId 
          ? { ...c, staff: (c.staff || []).map(s => s.id === staffId ? { ...s, ...updates } : s) }
          : c
      );
      this.save();
  }

  async deleteClinicStaff(clinicId: string, staffId: string) {
      await delay(50);
      this.clinics = this.clinics.map(c => 
          c.id === clinicId ? { ...c, staff: (c.staff || []).filter(s => s.id !== staffId) } : c
      );
      this.save();
  }

  // --- CLINIC OPERATIONS ---

  // Fix: Added missing clinic operations methods
  async createClinic(clinic: Clinic) {
      await delay(200);
      this.clinics = [...this.clinics, { ...clinic, staff: clinic.staff || [] }];
      this.save();
  }

  async updateClinic(clinicId: string, updates: Partial<Clinic>) {
      await delay(100);
      this.clinics = this.clinics.map(c => c.id === clinicId ? { ...c, ...updates } : c);
      this.save();
  }

  async deleteClinic(clinicId: string) {
      await delay(100);
      this.clinics = this.clinics.filter(c => c.id !== clinicId);
      this.save();
  }

  async resetSystem() {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
      this.save();
  }

  async deleteAllData() {
      await delay(500);
      localStorage.removeItem(STORAGE_KEY);
      this.clinics = [];
      this.save();
  }
}

// Fix: Exporting the storage instance for use in other modules
export const storage = new StorageService();
