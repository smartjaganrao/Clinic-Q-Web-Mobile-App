
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { UserRole, PatientStatus, Clinic, PlanType, Patient, Doctor, DoctorStatus, DaySchedule, AppNotification, ClinicStats, TimeSlot, ClinicType, Vitals, PainPoint, Staff, ClinicOperationMode } from './types';
import { LandingPage } from './pages/LandingPage';
import { ClinicLandingPage } from './pages/ClinicLandingPage';
import { StaffLogin } from './pages/StaffLogin';
import { ClinicAuth } from './pages/ClinicAuth';
import { DoctorLogin } from './pages/DoctorLogin';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { KioskView } from './pages/KioskView';
import { PatientLogin } from './pages/PatientLogin';
import { PatientTracker } from './pages/PatientTracker';
import { AdminDashboard } from './pages/AdminDashboard';
import { ToastContainer } from './components/Toast';
import { Logo } from './components/Logo';
import { Button } from './components/Button';
import { LogOut } from 'lucide-react';
import { storage } from './services/storage';
import { saveSupabaseConfig, getSupabase } from './services/supabaseClient';

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Utility to get Local Date String YYYY-MM-DD
const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Utility to get clinic's current time in their timezone
const getClinicCurrentTime = (timezone?: string) => {
    const now = new Date();
    // For now, handle common timezones. In production, use a proper timezone library
    let offsetHours = 0;
    if (timezone === 'Asia/Kolkata') {
        offsetHours = 5.5; // IST is UTC+5:30
    } else if (timezone === 'Asia/Dubai') {
        offsetHours = 4; // GST is UTC+4
    } else if (timezone === 'Europe/London') {
        offsetHours = 0; // GMT/BST
    } else if (timezone === 'America/New_York') {
        offsetHours = -5; // EST, simplified
    } else if (timezone === 'Asia/Shanghai') {
        offsetHours = 8; // CST
    } else {
        // Default to client's local time if timezone not recognized
        return now;
    }

    // Calculate the time in clinic timezone
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (offsetHours * 3600000));
};

// Helper Component to Sync URL Params with State
const RouteSyncer = ({ currentClinicId, onSync }: { currentClinicId: string | null, onSync: (id: string) => void }) => {
    const params = useParams();
    useEffect(() => {
        if (params.clinicId && params.clinicId !== currentClinicId) {
            onSync(params.clinicId);
        }
    }, [params.clinicId, currentClinicId, onSync]);
    return null;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------------------------------------------------------
  // SESSION PERSISTENCE
  // ------------------------------------------------------------------
  const getSession = () => {
    try {
      const s = localStorage.getItem('clinicq_session_v2');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  };
  
  const session = getSession();

  // Global State
  const [userRole, setUserRole] = useState<UserRole | null>(session?.userRole || null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isInitialized, setIsInitialized] = useState(false); // Track if storage has loaded
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(session?.selectedClinicId || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(session?.currentUser?.id || null);
  
  // Patient Auth
  const [patientAuth, setPatientAuth] = useState<{name: string, phone: string} | null>(session?.loggedInPatient || null);
  const [initialSearchMode, setInitialSearchMode] = useState<'DOCTOR' | 'CLINIC'>('CLINIC');
  
  // Pending Action
  const [pendingAction, setPendingAction] = useState<{ type: 'CHECK_IN', clinicId: string, patientId: string } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ------------------------------------------------------------------
  // SUBSCRIPTION TO DATA LAYER
  // ------------------------------------------------------------------
  const playNotificationSound = () => {
      // Simple notification chime
      const audio = new Audio('./assets/sounds/notification.mp3');
      audio.play().catch(e => console.log("Audio play blocked (interaction required):", e));
  };

  useEffect(() => {
      const unsubscribe = storage.subscribe((data) => {
          setClinics(data);
          setIsInitialized(true);
      });

      const unsubscribeAlerts = storage.subscribeToAlerts((msg, type) => {
          addToast(msg, type);
          if (msg.includes("New Patient")) {
              playNotificationSound();
          }
      });

      return () => {
          unsubscribe();
          unsubscribeAlerts();
      };
  }, []);

  // ------------------------------------------------------------------
  // DERIVED STATE HELPERS
  // ------------------------------------------------------------------
  
  const currentClinic = clinics.find(c => c.id === currentClinicId) || null;
  const currentUser = (userRole === UserRole.DOCTOR && currentClinic && currentUserId) 
      ? currentClinic.doctors.find(d => d.id === currentUserId) || null 
      : null;

  // Save Session
  useEffect(() => {
    const s = {
      // currentView removed, strictly URL based now
      userRole,
      selectedClinicId: currentClinicId,
      currentUser: currentUser ? { id: currentUser.id } : null,
      loggedInPatient: patientAuth
    };
    localStorage.setItem('clinicq_session_v2', JSON.stringify(s));
  }, [userRole, currentClinicId, currentUser, patientAuth]);

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  const handleStaffLogin = () => navigate('/login/staff');
  
  const handlePatientEnter = (mode?: 'DOCTOR' | 'CLINIC', query?: string, loc?: string) => {
      setInitialSearchMode(mode || 'CLINIC');
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (loc) params.append('city', loc);
      navigate({ pathname: '/patient', search: params.toString() });
  };

  // Unified System Login (Staff, Doctor, Admin)
  const handleSystemLogin = (role: UserRole, clinicId: string, userId: string) => {
      setUserRole(role);
      setCurrentClinicId(clinicId);
      setCurrentUserId(userId);
      
      // Navigate based on role
      if (role === UserRole.ADMIN) {
          navigate('/admin');
      } else if (role === UserRole.RECEPTIONIST) {
          navigate(`/clinic/${clinicId}/reception`);
      } else if (role === UserRole.DOCTOR) {
          navigate(`/clinic/${clinicId}/doctor`);
      } else if (role === UserRole.KIOSK) {
          navigate(`/clinic/${clinicId}/kiosk`);
      } else {
          // Fallback or specific kiosk logic if needed
          navigate('/');
      }
  };

  const handleClinicSelect = (clinicId: string) => {
    setCurrentClinicId(clinicId);
    if (userRole === UserRole.DOCTOR) {
      navigate(`/clinic/${clinicId}/login`);
    } else if (userRole === UserRole.RECEPTIONIST) {
      navigate(`/clinic/${clinicId}/reception`);
    } else if (userRole === UserRole.KIOSK) {
      navigate(`/clinic/${clinicId}/kiosk`);
    } else {
        // Fix for Demo Mode: If no role is selected (e.g. browsing clinics in setup),
        // default to Receptionist view to let them explore.
        setUserRole(UserRole.RECEPTIONIST);
        navigate(`/clinic/${clinicId}/reception`);
        addToast("Entering Demo Mode", "info");
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    setUserRole(UserRole.DOCTOR);
    setCurrentUserId(doctorId);
    navigate(`/clinic/${currentClinicId}/doctor`);
  };

  // PATIENT TRACKER Check-in helper
  const handlePatientCheckIn = async (clinicId: string, patientId: string) => {
      await storage.updatePatient(clinicId, patientId, { isCheckedIn: true });
  };

  // PATIENT LOGIN & AUTO-BOOKING LOGIC
  const handlePatientLogin = (phone: string, name: string) => {
    setPatientAuth({ phone, name });
    
    // Redirect logic
    if (pendingAction && pendingAction.type === 'CHECK_IN') {
        handlePatientCheckIn(pendingAction.clinicId, pendingAction.patientId);
        addToast("Check-in confirmed!", "success");
        setPendingAction(null);
        navigate('/patient');
    } else {
        addToast(`Welcome, ${name}`, "success");
        navigate('/patient');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentClinicId(null);
    setCurrentUserId(null);
    setPatientAuth(null);
    setPendingAction(null);
    localStorage.removeItem('clinicq_session_v2');
    navigate('/');
  };
  
  const handlePatientLoginBack = () => {
      if (pendingAction) {
          setPendingAction(null);
          navigate('/patient');
      } else {
          navigate('/');
      }
  };

  // RECEPTION HANDLERS
  const handleAddPatient = async (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string, nextOfKin?: {name: string, phone: string}, address?: string, city?: string, country?: string, location?: {lat: number, lng: number}) => {
    if (!currentClinicId) return;
    const clinic = clinics.find(c => c.id === currentClinicId);
    if (!clinic) return;

    // Check duplicates
    const isDuplicate = clinic.patients.some(p => 
        p.phone === phone && 
        p.name.toLowerCase() === name.toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
    );

    if (isDuplicate) {
        addToast("Patient already in queue", "error");
        return;
    }

    const newPatient: Patient = {
      id: `pat_${Date.now()}`,
      tokenNumber: 0, // Placeholder, calculated in storage
      queueOrder: undefined, // Placeholder, calculated in storage
      name, phone, doctorId,
      status: PatientStatus.WAITING,
      timeAdded: Date.now(),
      visitType: date && time ? 'APPOINTMENT' : 'WALK_IN',
      appointmentDate: date || getLocalToday(),
      appointmentTime: time,
      isCheckedIn: !date, // Walk-ins checked in by default
      age, gender, symptoms,
      nextOfKin,
      address, city, country, location
    };

    const addedPatient = await storage.addPatient(currentClinicId, newPatient);
    addToast(`Token #${addedPatient.tokenNumber} generated`, 'success');
    playNotificationSound();
  };

  const handleUpdateStatus = async (patientId: string, status: PatientStatus) => {
    if (!currentClinicId) return;
    
    // Constraint: One patient with doctor at a time
    if (status === PatientStatus.WITH_DOCTOR) {
        const clinic = clinics.find(c => c.id === currentClinicId);
        const patient = clinic?.patients.find(p => p.id === patientId);
        if (clinic && patient) {
            const active = clinic.patients.find(p => p.doctorId === patient.doctorId && p.status === PatientStatus.WITH_DOCTOR);
            if (active && active.id !== patientId) {
                addToast("Doctor is busy. Complete current visit first.", "error");
                return;
            }
        }
    }

    await storage.updatePatientStatus(currentClinicId, patientId, status);
  };

  const handleBulkUpdateStatus = async (ids: string[], status: PatientStatus) => {
      if (!currentClinicId) return;
      await storage.bulkUpdatePatientStatus(currentClinicId, ids, status);
      addToast(`${ids.length} patients updated`, "success");
  };

  const handleEditPatient = async (id: string, updates: Partial<Patient>) => {
    if (!currentClinicId) return;
    await storage.updatePatient(currentClinicId, id, updates);
  };

  const handleDeletePatient = async (id: string) => {
    if (!currentClinicId) return;
    await storage.deletePatient(currentClinicId, id);
    addToast('Patient deleted', 'info');
  };

  const handleDeleteMultiplePatients = async (ids: string[]) => {
      if (!currentClinicId) return;
      await storage.deleteMultiplePatients(currentClinicId, ids);
      addToast(`${ids.length} records deleted`, 'info');
  };

  // DOCTOR MANAGEMENT (Reception Context)
  const handleAddDoctor = async (data: Partial<Doctor>) => {
      if (!currentClinicId) return;
      const newMasterId = data.masterId || `master_${Date.now()}`;
      const newDoc: Doctor = {
          id: `doc_${Date.now()}`,
          masterId: newMasterId,
          name: data.name || 'Unnamed Doctor',
          specialty: data.specialty || 'General',
          roomNumber: data.roomNumber || 'N/A',
          mobile: data.mobile || '',
          registrationNumber: data.registrationNumber,
          email: data.email,
          password: data.password,
          weeklySchedule: data.weeklySchedule || [],
          isAvailable: true, status: DoctorStatus.AVAILABLE,
          delayMinutes: 0,
          consultationFee: data.consultationFee || 500,
          consultationTime: data.consultationTime || 15,
          avatarUrl: data.avatarUrl || `https://i.pravatar.cc/150?u=${newMasterId}`,
          bio: data.bio,
          education: data.education,
          languages: data.languages,
          experience: data.experience,
          rating: 5.0, // default
          reviewCount: 0, // default
      };
      await storage.addDoctor(currentClinicId, newDoc);
  };

  const handleEditDoctor = async (id: string, updates: Partial<Doctor>) => {
      if (!currentClinicId) return;
      await storage.updateDoctor(currentClinicId, id, updates);
  };

  const handleDeleteDoctor = async (id: string) => {
      if (!currentClinicId) return;
      await storage.deleteDoctor(currentClinicId, id);
      addToast('Doctor removed', 'info');
  };

  // STAFF MANAGEMENT (Reception Context)
  const handleLocalAddStaff = async (staff: Staff) => {
      if (!currentClinicId) return;
      await storage.addClinicStaff(currentClinicId, staff);
      addToast('Staff member added', 'success');
  };

  const handleLocalUpdateStaff = async (id: string, updates: Partial<Staff>) => {
      if (!currentClinicId) return;
      await storage.updateClinicStaff(currentClinicId, id, updates);
      addToast('Staff updated', 'success');
  };

  const handleLocalDeleteStaff = async (id: string) => {
      if (!currentClinicId) return;
      await storage.deleteClinicStaff(currentClinicId, id);
      addToast('Staff removed', 'info');
  };

  const checkMasterDoctor = (mobile: string): Doctor | null => {
      for (const c of clinics) {
          const found = c.doctors.find(d => d.mobile === mobile);
          if (found) return found;
      }
      return null;
  };

  // DOCTOR DASHBOARD
  const handleUpdateDoctorStatus = async (doctorId: string, status: DoctorStatus, delay: number) => {
      if (!currentClinicId) return;
      await storage.updateDoctorStatus(currentClinicId, doctorId, status, delay);
  };

  const handleNextPatient = async () => {
      if (!currentClinic || !currentUser) return;
      
      const getSortTime = (p: Patient) => {
          if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
              return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
          }
          return p.timeAdded;
      };

      const queue = currentClinic.patients
          .filter(p => p.doctorId === currentUser.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD))
          .sort((a, b) => {
              if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                  const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                  const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                  if (orderA !== orderB) return orderA - orderB;
              }
              if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
              if (a.isEmergency && b.isEmergency) {
                  const hasNokA = a.nextOfKin?.name && a.nextOfKin?.phone;
                  const hasNokB = b.nextOfKin?.name && b.nextOfKin?.phone;
                  if (hasNokA !== hasNokB) return hasNokA ? 1 : -1; 
              }
              const getStatusPriority = (s: PatientStatus) => {
                  if (s === PatientStatus.WAITING) return 0;
                  if (s === PatientStatus.ON_HOLD) return 1;
                  return 2;
              };
              const pA = getStatusPriority(a.status);
              const pB = getStatusPriority(b.status);
              if (pA !== pB) return pA - pB;
              return getSortTime(a) - getSortTime(b);
          });
      
      if (queue.length === 0) {
          addToast("No patients in queue", "info");
          return;
      }
      
      const active = currentClinic.patients.find(p => p.doctorId === currentUser.id && p.status === PatientStatus.WITH_DOCTOR);
      if (active) await storage.updatePatientStatus(currentClinic.id, active.id, PatientStatus.COMPLETED);
      
      await storage.updatePatientStatus(currentClinic.id, queue[0].id, PatientStatus.WITH_DOCTOR);
  };

  const handleCompletePatient = async (id: string, notes: string) => {
      if (!currentClinicId) return;
      await storage.updatePatient(currentClinicId, id, { status: PatientStatus.COMPLETED, notes, timeCompleted: Date.now() });
      addToast("Visit completed", "success");
  };
  
  const handleHoldPatient = async (id: string) => {
      if (!currentClinicId) return;
      await storage.updatePatientStatus(currentClinicId, id, PatientStatus.ON_HOLD);
      addToast("Patient held", "warning");
  };

  const handleHoldPatientResume = async (id: string) => {
      if (!currentClinicId) return;
      await storage.updatePatientStatus(currentClinicId, id, PatientStatus.WAITING);
      addToast("Patient back in queue", "info");
  };

  // DOCTOR: Switch Clinic
  const handleSwitchClinic = (targetClinicId: string) => {
      if (!currentUser) return;
      const newClinic = clinics.find(c => c.id === targetClinicId);
      if (newClinic && currentUser) {
          const linkedDoc = newClinic.doctors.find(d => d.masterId === currentUser.masterId);
          if (linkedDoc) {
              setCurrentClinicId(targetClinicId);
              setCurrentUserId(linkedDoc.id);
              navigate(`/clinic/${targetClinicId}/doctor`);
              addToast(`Switched to ${newClinic.name}`, 'success');
          } else {
              addToast("Profile not linked in target clinic", "error");
          }
      }
  };

  // PATIENT TRACKER: Get token handler
    const handleGetToken = async (name: string, phone: string, doctorId: string, clinicId: string, visitType: 'WALK_IN' | 'APPOINTMENT', time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => {
        const clinic = clinics.find(c => c.id === clinicId);
        if (!clinic) return;
        
        const newPatient: Patient = {
            id: `pat_remote_${Date.now()}`,
            tokenNumber: 0, // Placeholder, calculated in storage
            queueOrder: undefined, // Placeholder, calculated in storage
            name, phone, doctorId,
            status: PatientStatus.WAITING,
            timeAdded: Date.now(),
            visitType,
            appointmentDate: date || getLocalToday(), appointmentTime: time,
            age, gender, symptoms,
            isCheckedIn: false 
        };
        
        await storage.addPatient(clinicId, newPatient);
    };

  const handleCancelVisit = async (clinicId: string, patientId: string) => {
      await storage.updatePatientStatus(clinicId, patientId, PatientStatus.CANCELLED);
  };

  const handleSimulateQRScan = (clinicId: string) => {
      if (!patientAuth) {
          setPendingAction({ type: 'CHECK_IN', clinicId, patientId: 'current' }); 
          navigate('/login/patient');
          addToast("Login to check-in", "info");
      } else {
          const clinic = clinics.find(c => c.id === clinicId);
          const visit = clinic?.patients.find(p => p.phone === patientAuth.phone && p.status === PatientStatus.WAITING);
          
          if (visit) {
              handlePatientCheckIn(clinicId, visit.id);
              addToast("Checked In Successfully!", "success");
              navigate('/patient');
          } else {
              setCurrentClinicId(clinicId);
              navigate('/patient');
              addToast("No active visit found. Book now.", "info");
          }
      }
  };

  const handleDragDrop = async (draggedId: string, targetId: string) => {
      if (!currentClinicId) return;
      await storage.reorderQueue(currentClinicId, draggedId, targetId);
      addToast("Queue reordered", "success");
  };

  // ADMIN HANDLERS
  const handleUpdateClinicPlan = async (clinicId: string, plan: PlanType) => {
      await storage.updateClinic(clinicId, { plan });
      addToast("Plan updated", "success");
  };
  const handleToggleClinicStatus = async (clinicId: string) => {
      const clinic = clinics.find(c => c.id === clinicId);
      if(clinic) await storage.updateClinic(clinicId, { subscriptionStatus: clinic.subscriptionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' });
  };
  const handleDeleteClinic = async (clinicId: string) => {
      await storage.deleteClinic(clinicId);
  };
  const handleEditClinic = async (clinicId: string, updates: Partial<Clinic>) => {
      await storage.updateClinic(clinicId, updates);
  };
  const handleResetSystem = async () => {
      await storage.resetSystem();
      // handleLogout(); // Removed logout to keep testing flow
      addToast("System reset to Mock Data", "warning");
  };
  const handleDeleteAllData = async () => {
      await storage.deleteAllData();
      // handleLogout(); // Removed logout to keep testing flow
      addToast("All data deleted. System is empty.", "error");
  };

  // ADMIN STAFF HANDLERS (SUPER ADMIN)
  const handleAddStaff = async (clinicId: string, staff: Staff) => {
      await storage.addClinicStaff(clinicId, staff);
      addToast("Staff member added", "success");
  };
  const handleUpdateStaff = async (clinicId: string, staffId: string, updates: Partial<Staff>) => {
      await storage.updateClinicStaff(clinicId, staffId, updates);
      addToast("Staff updated", "success");
  };
  const handleDeleteStaff = async (clinicId: string, staffId: string) => {
      await storage.deleteClinicStaff(clinicId, staffId);
      addToast("Staff removed", "info");
  };

  // SUPABASE SETUP HANDLER
  const handleSupabaseSetup = async (url: string, key: string) => {
      if(!url || !key) {
          addToast("Please enter URL and Key", "error");
          return;
      }
      saveSupabaseConfig(url, key);
  };

  const handleSeedData = async () => {
      try {
          addToast("Syncing data to Supabase...", "info");
          await storage.seedDatabase();
          addToast("Data synced successfully!", "success");
      } catch (e: any) {
          addToast(e.message, "error");
      }
  };

  const handleClearPatients = async () => {
      // Confirm before deleting
      if (window.confirm("Are you sure you want to delete ALL patient data? This cannot be undone.")) {
          await storage.clearAllPatients();
          addToast("All patients cleared from Local & DB", "success");
      }
  };

  const handleMigrateToHybrid = async () => {
      if (window.confirm("This will copy all local data into new Relational Tables (Doctors, Patients) in Supabase. Continue?")) {
          try {
              addToast("Starting migration...", "info");
              await storage.migrateToHybrid();
              addToast("Migration successful! Tables populated.", "success");
          } catch (e: any) {
              addToast("Migration failed: " + e.message, "error");
          }
      }
  };

  // Setup Component (Inline for simplicity)
  const SupabaseSetup = () => {
      const [url, setUrl] = useState(localStorage.getItem('sb_url') || '');
      const [key, setKey] = useState(localStorage.getItem('sb_key') || '');
      const [showSql, setShowSql] = useState(false);

      const sqlScript = `-- Run this in Supabase SQL Editor
-- RESET SCHEMA (Fixes UUID vs Text ID mismatch)
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- 1. Clinics Table (Parent)
create table public.clinics (
  id text primary key,
  name text not null,
  data jsonb
);

-- 2. Doctors Table (Hybrid)
create table public.doctors (
  id text primary key,
  clinic_id text references public.clinics(id) on delete cascade,
  name text,
  data jsonb not null
);

-- 3. Patients Table (Hybrid)
create table public.patients (
  id text primary key,
  clinic_id text references public.clinics(id) on delete cascade,
  doctor_id text references public.doctors(id) on delete set null,
  status text not null,
  queue_order int default 0,
  data jsonb not null
);

-- Enable Realtime (Safe to run multiple times)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clinics') then
    alter publication supabase_realtime add table public.clinics;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'doctors') then
    alter publication supabase_realtime add table public.doctors;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'patients') then
    alter publication supabase_realtime add table public.patients;
  end if;
end;
$$;

-- Security (Demo Mode - Idempotent)
alter table public.clinics enable row level security;
create policy "Public Access" on public.clinics for all using (true);

alter table public.doctors enable row level security;
create policy "Public Access Docs" on public.doctors for all using (true);

alter table public.patients enable row level security;
create policy "Public Access Pts" on public.patients for all using (true);

-- Atomic Update Function (Required for Booking)
create or replace function add_patient(clinic_id text, patient_data jsonb)
returns void as $$ begin update clinics set data = jsonb_set(data, '{patients}', coalesce(data->'patients', '[]'::jsonb) || patient_data) where id = clinic_id; end; $$ language plpgsql;

-- Reload Schema Cache (Critical for 'Could not find column' errors)
NOTIFY pgrst, 'reload config';`;

      return (
          <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border mt-10">
              <h2 className="text-xl font-bold mb-4">Connect to Supabase</h2>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">Project URL</label>
                      <input value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border rounded" placeholder="https://xyz.supabase.co" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Anon Key</label>
                      <input value={key} onChange={e => setKey(e.target.value)} className="w-full p-2 border rounded" placeholder="eyJh..." />
                  </div>
                  <div className="flex gap-4 pt-2">
                      <Button onClick={() => handleSupabaseSetup(url, key)}>Save Config</Button>
                      <Button variant="outline" onClick={handleSeedData} disabled={!getSupabase()}>Push Local Data to DB</Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearPatients} disabled={!getSupabase()}>Clear All Patients</Button>
                      <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleMigrateToHybrid} disabled={!getSupabase()}>Migrate to Hybrid</Button>
                  </div>
                  
                  <div className="mt-6 border-t pt-4">
                      <button 
                          onClick={() => setShowSql(!showSql)}
                          className="text-sm text-blue-600 underline mb-2 hover:text-blue-800"
                      >
                          {showSql ? 'Hide SQL Script' : 'Show SQL Script to Create Tables'}
                      </button>
                      
                      {showSql && (
                          <div className="bg-slate-900 text-slate-50 p-4 rounded-md text-xs font-mono overflow-x-auto relative">
                              <pre>{sqlScript}</pre>
                              <Button 
                                  size="sm" 
                                  className="absolute top-2 right-2 h-6 text-xs bg-slate-700 hover:bg-slate-600"
                                  onClick={() => {
                                      navigator.clipboard.writeText(sqlScript);
                                      addToast("SQL copied to clipboard", "success");
                                  }}
                              >
                                  Copy
                              </Button>
                          </div>
                      )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                      1. Create a project on Supabase.<br/>
                      2. Run the SQL script provided.<br/>
                      3. Enter credentials here and click Save.<br/>
                      4. Click "Push Local Data" to seed the database.
                  </p>
              </div>
          </div>
      );
  };

  // --- COMPONENT RENDER ---

  // Ensure app is loaded before checking for empty data
  if (!isInitialized) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                  <Logo className="h-10 w-10 animate-bounce" />
                  <p className="text-slate-500 font-medium">Loading SmartQFlow...</p>
              </div>
          </div>
      );
  }

  return (
    <>
      <ToastContainer notifications={notifications} remove={removeToast} />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={
            <LandingPage 
              onPatientEnter={handlePatientEnter} 
              onClinicMarketing={() => navigate('/for-clinics')}
              onStaffLogin={handleStaffLogin}
              onSimulateQRScan={handleSimulateQRScan}
              clinics={clinics}
            />
        } />
        
        <Route path="/for-clinics" element={
            <ClinicLandingPage
              onStartFreeTrial={() => navigate('/setup')} 
              onLogin={handleStaffLogin}
              onBackToPatient={() => navigate('/')}
            />
        } />

        <Route path="/login/staff" element={
            <StaffLogin onLoginSuccess={handleSystemLogin} onBack={() => navigate('/for-clinics')} />
        } />

        <Route path="/login/patient" element={
            <PatientLogin 
              onLogin={handlePatientLogin}
              onBack={handlePatientLoginBack}
              addToast={addToast}
              pendingActionMessage={pendingAction?.type === 'CHECK_IN' ? 'Login to confirm your arrival' : undefined}
            />
        } />

        {/* CLINIC REGISTRATION / SETUP - PUBLIC ACCESS */}
        <Route path="/setup" element={
            <ClinicAuth 
              clinics={clinics}
              onSelectClinic={handleClinicSelect}
              onRegister={(clinicId, userId) => handleSystemLogin(UserRole.RECEPTIONIST, clinicId, userId)}
              onBack={() => navigate('/login/staff')}
              // role is optional now
            />
        } />

        <Route path="/clinic/:clinicId/login" element={
            <>
                <RouteSyncer currentClinicId={currentClinicId} onSync={setCurrentClinicId} />
                {currentClinic ? (
                    <div className="min-h-screen bg-slate-50 flex flex-col">
                        <DoctorLogin 
                            clinic={currentClinic}
                            onSelectDoctor={handleDoctorSelect}
                            onBack={() => navigate('/setup')}
                        />
                        <div className="w-full max-w-md mx-auto p-4 pb-12">
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-500">Demo: Quick Login</span></div>
                            </div>
                            <div className="grid gap-2">
                                {currentClinic.doctors.length === 0 && <div className="text-center text-xs text-slate-400 italic">No doctors found.</div>}
                                {currentClinic.doctors.map(d => (
                                    <Button key={d.id} variant="outline" className="w-full justify-start gap-3 bg-white hover:bg-blue-50 hover:border-blue-200" onClick={() => handleDoctorSelect(d.id)}>
                                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{d.name.charAt(0)}</div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium">{d.name}</span>
                                            <span className="text-[10px] text-slate-500">{d.specialty}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : <div className="p-8 text-center">Loading Clinic Data...</div>}
            </>
        } />

        {/* DASHBOARDS - Updated to be full-screen SaaS interfaces */}
        <Route path="/clinic/:clinicId/reception" element={
            <>
                <RouteSyncer currentClinicId={currentClinicId} onSync={setCurrentClinicId} />
                {currentClinic && (
                    <div className="relative min-h-screen">
                        <ReceptionDashboard 
                            doctors={currentClinic.doctors}
                            patients={currentClinic.patients}
                            staff={currentClinic.staff}
                            clinicName={currentClinic.name}
                            clinicType={currentClinic.type}
                            operationMode={currentClinic.operationMode}
                            clinicData={currentClinic}
                            /* Fixed: Replaced short/incorrect names (oe, me, D, H, J, pt, ne, Ne, re, fe, ve, Ge, Ye, xe) with their correct handler function names */
                            onAddPatient={handleAddPatient}
                            onEditPatient={handleEditPatient}
                            onDeletePatient={handleDeletePatient}
                            onDeleteMultiplePatients={handleDeleteMultiplePatients}
                            onAddDoctor={handleAddDoctor}
                            onCheckMasterDoctor={checkMasterDoctor}
                            onEditDoctor={handleEditDoctor}
                            onDeleteDoctor={handleDeleteDoctor}
                            onUpdateStatus={handleUpdateStatus}
                            onCancelPatient={(id) => handleUpdateStatus(id, PatientStatus.CANCELLED)}
                            onUpdateClinicSettings={(updates) => storage.updateClinic(currentClinic.id, updates)}
                            onToggleEmergency={(id) => {
                                const p = currentClinic.patients.find(pat => pat.id === id);
                                if (p) handleEditPatient(id, { isEmergency: !p.isEmergency });
                            }}
                            onManualReorder={(id, direction) => {
                                addToast("Reordering not fully implemented in demo", "info");
                            }}
                            onDragDrop={handleDragDrop}
                            onManualCheckIn={(id) => handlePatientCheckIn(currentClinic.id, id)}
                            onBulkUpdateStatus={handleBulkUpdateStatus}
                            onAddStaff={handleLocalAddStaff}
                            onUpdateStaff={handleLocalUpdateStaff}
                            onDeleteStaff={handleLocalDeleteStaff}
                            onLogout={handleLogout}
                            addToast={addToast}
                            onSetupKiosk={() => navigate(`/clinic/${currentClinic.id}/reception/kiosk-settings`)}
                        />
                    </div>
                )}
            </>
        } />

        <Route path="/clinic/:clinicId/reception/kiosk-settings" element={
            <>
                <RouteSyncer currentClinicId={currentClinicId} onSync={setCurrentClinicId} />
                <div className="min-h-screen bg-slate-50 p-8">
                    <KioskSettings 
                        clinic={currentClinic}
                        clinicId={currentClinicId}
                        onUpdate={(id, data) => storage.updateClinic(id, data)}
                        onBack={() => navigate(`/clinic/${currentClinicId}/reception`)}
                        addToast={addToast}
                    />
                </div>
            </>
        } />

        <Route path="/clinic/:clinicId/doctor" element={
            <>
                <RouteSyncer currentClinicId={currentClinicId} onSync={setCurrentClinicId} />
                {currentClinic && currentUser && (() => {
                    const activeDoctor = currentClinic.doctors.find(d => d.id === currentUser.id) || currentUser;
                    const linkedClinics = activeDoctor.masterId 
                        ? clinics.filter(c => c.doctors.some(d => d.masterId === activeDoctor.masterId))
                        : [];

                    return (
                        <DoctorDashboard 
                            doctor={activeDoctor}
                            queue={currentClinic.patients.filter(p => p.doctorId === activeDoctor.id && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED)}
                            linkedClinics={linkedClinics}
                            currentClinicId={currentClinic.id}
                            clinicName={currentClinic.name}
                            clinicCity={currentClinic.city}
                            onSwitchClinic={handleSwitchClinic}
                            onNextPatient={handleNextPatient}
                            onCompletePatient={handleCompletePatient}
                            onUpdateStatus={handleUpdateDoctorStatus}
                            onUpdatePatientDetails={(id, updates) => storage.updatePatient(currentClinic.id, id, updates)}
                            /* Fixed: Replaced incorrect handler name Vn with handleHoldPatient */
                            onHoldPatient={handleHoldPatient}
                            onResumePatient={handleHoldPatientResume}
                            /* Fixed: Replaced incorrect handler name xe with handleLogout */
                            onLogout={handleLogout}
                        />
                    );
                })()}
            </>
        } />

        <Route path="/clinic/:clinicId/kiosk" element={
            <>
                <RouteSyncer currentClinicId={currentClinicId} onSync={setCurrentClinicId} />
                {currentClinic && (
                    <KioskView 
                        doctors={currentClinic.doctors}
                        patients={currentClinic.patients}
                        clinicName={currentClinic.name}
                        onExit={handleLogout}
                    />
                )}
            </>
        } />

        <Route path="/admin" element={
            <div className="flex flex-col h-screen">
                <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md z-20">
                    <button 
                        onClick={() => navigate('/')} 
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <Logo className="h-8 w-8" />
                        <span className="font-bold text-xl">Super Admin</span>
                    </button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </header>
                <div className="flex-1 overflow-hidden">
                    <div className="bg-slate-100 p-2 text-center text-xs"><a href="/#/admin/db-setup" className="text-blue-600 underline">Configure Database</a></div>
                    <AdminDashboard 
                        clinics={clinics}
                        onUpdatePlan={handleUpdateClinicPlan}
                        onToggleStatus={handleToggleClinicStatus}
                        onDeleteClinic={handleDeleteClinic}
                        onEditClinic={handleEditClinic}
                        onResetSystem={handleResetSystem}
                        onDeleteAllData={handleDeleteAllData}
                        onAddStaff={handleAddStaff}
                        onUpdateStaff={handleUpdateStaff}
                        onDeleteStaff={handleDeleteStaff}
                        onAddDoctor={(clinicId, doc) => storage.addDoctor(clinicId, doc)}
                        onEditDoctor={(clinicId, docId, updates) => storage.updateDoctor(clinicId, docId, updates)}
                        onDeleteDoctor={(clinicId, docId) => storage.deleteDoctor(clinicId, docId)}
                        /* Fixed: Replaced pt with checkMasterDoctor */
                        onCheckMasterDoctor={checkMasterDoctor}
                        addToast={addToast}
                    />
                </div>
            </div>
        } />

        <Route path="/admin/db-setup" element={
            <div className="min-h-screen bg-slate-50 p-8"><SupabaseSetup /><Button className="mt-4" variant="ghost" onClick={() => navigate('/admin')}>Back to Admin</Button></div>
        } />

        {/* PATIENT TRACKER - Updated with Wildcard for Sub-Routes */}
        <Route path="/patient/*" element={
            <PatientTracker 
                clinics={clinics}
                userPhone={patientAuth?.phone || ''}
                userName={patientAuth?.name || 'Guest'}
                isGuest={!patientAuth}
                onLoginClick={(phone, name) => {
                    if (phone && name) {
                        handlePatientLogin(phone, name);
                    } else {
                        navigate('/login/patient');
                    }
                }}
                onBack={handleLogout}
                onGetToken={handleGetToken}
                addToast={addToast}
                onUpdateDetails={storage.updatePatient}
                onCancelVisit={handleCancelVisit}
                onCheckIn={handlePatientCheckIn}
                preSelectedClinicId={currentClinicId || undefined}
                onClearPendingAction={() => setCurrentClinicId(null)}
                initialSearchMode={initialSearchMode}
            />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Moved outside App to prevent re-renders wiping state
const KioskSettings = ({ clinic, clinicId, onUpdate, onBack, addToast }: { 
    clinic: Clinic | null, 
    clinicId: string | null, 
    onUpdate: (id: string, data: any) => Promise<void>, 
    onBack: () => void,
    addToast: (msg: string, type: any) => void 
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    useEffect(() => {
        if (clinic) {
            setEmail((clinic as any).kioskEmail || '');
            setPassword((clinic as any).kioskPassword || '');
        }
    }, [clinic]);

    const handleSave = async () => {
        if (!clinicId) return;
        await onUpdate(clinicId, { ['kioskEmail' as any]: email.trim(), ['kioskPassword' as any]: password.trim() });
        addToast("Kiosk credentials updated", "success");
    };

    if (!clinic) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-sm border mt-10">
            <h2 className="text-xl font-bold mb-4">Kiosk Login Setup</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Kiosk Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="kiosk@clinic.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kiosk Password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" type="password" placeholder="******" />
                </div>
                <div className="flex gap-4 pt-2">
                    <Button onClick={handleSave}>Save Credentials</Button>
                    <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
                </div>
            </div>
        </div>
    );
};
