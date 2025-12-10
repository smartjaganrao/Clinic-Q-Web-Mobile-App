
import React, { useState, useEffect } from 'react';
import { UserRole, PatientStatus, Clinic, PlanType, Patient, Doctor, DoctorStatus, DaySchedule, AppNotification, ClinicStats, TimeSlot, ClinicType, Vitals, PainPoint } from './types';
import { INITIAL_CLINICS } from './constants';
import { LandingPage } from './pages/LandingPage';
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

type AppView = 
  | 'LANDING' 
  | 'STAFF_LOGIN'
  | 'PATIENT_LOGIN'
  | 'PATIENT_TRACKER' 
  | 'CLINIC_AUTH' 
  | 'DOCTOR_LOGIN' 
  | 'DASHBOARD_RECEPTION' 
  | 'DASHBOARD_DOCTOR' 
  | 'ADMIN_DASHBOARD'
  | 'KIOSK';

interface PendingBooking {
    name: string;
    age: string;
    gender: string;
    doctorId: string;
    clinicId: string;
    visitType: 'WALK_IN' | 'APPOINTMENT';
    apptTime?: string;
    apptDate?: string;
    symptoms?: string;
}

export default function App() {
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

  // State Machine
  const [currentView, setCurrentView] = useState<AppView>(session?.currentView || 'LANDING');
  const [userRole, setUserRole] = useState<UserRole | null>(session?.userRole || null);
  
  // Data State - Initialize with Persistence Logic
  // Simplified: Seeding is now handled in index.tsx via services/mockData.ts
  const [clinics, setClinics] = useState<Clinic[]>(() => {
      try {
          const saved = localStorage.getItem('clinicq_db_v2');
          return saved ? JSON.parse(saved) : INITIAL_CLINICS;
      } catch (e) {
          console.error("Failed to load data", e);
          return INITIAL_CLINICS;
      }
  });

  const [currentClinicId, setCurrentClinicId] = useState<string | null>(session?.selectedClinicId || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(session?.currentUser?.id || null); // Store ID, derive object
  
  // Patient Auth
  const [patientAuth, setPatientAuth] = useState<{name: string, phone: string} | null>(session?.loggedInPatient || null);
  const [initialSearchMode, setInitialSearchMode] = useState<'DOCTOR' | 'CLINIC'>('CLINIC');
  
  // Unified Pending Action State
  const [pendingAction, setPendingAction] = useState<{ type: 'CHECK_IN', clinicId: string, patientId: string } | { type: 'BOOKING', data: PendingBooking } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Derived State
  const currentClinic = clinics.find(c => c.id === currentClinicId) || null;
  // Derive current user (Doctor) from fresh clinics data to ensure state updates reflect immediately
  const currentUser = (userRole === UserRole.DOCTOR && currentClinic && currentUserId) 
      ? currentClinic.doctors.find(d => d.id === currentUserId) || null 
      : null;

  // ------------------------------------------------------------------
  // PERSISTENCE EFFECTS
  // ------------------------------------------------------------------
  
  // Safety Redirect
  useEffect(() => {
      const needsClinic = ['DASHBOARD_RECEPTION', 'DASHBOARD_DOCTOR', 'KIOSK', 'DOCTOR_LOGIN'].includes(currentView);
      if (needsClinic && !currentClinic) {
          setCurrentView(userRole ? 'CLINIC_AUTH' : 'LANDING');
      }
  }, [currentView, currentClinic, userRole]);

  // Sync Data Across Tabs (Concurrency)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'clinicq_db_v2' && e.newValue) {
            try {
                const updatedClinics = JSON.parse(e.newValue);
                // Updating state will trigger the save effect below, but since the value
                // in state will match localStorage, the save effect's equality check prevents a loop.
                setClinics(updatedClinics);
            } catch (err) {
                console.error("Failed to sync external changes:", err);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save Database on ANY change
  useEffect(() => {
    if (clinics.length > 0) {
      const key = 'clinicq_db_v2';
      const current = localStorage.getItem(key);
      const next = JSON.stringify(clinics);
      // Prevent loop by checking if value actually changed
      if (current !== next) {
        localStorage.setItem(key, next);
      }
    }
  }, [clinics]);

  // Save Session
  useEffect(() => {
    const s = {
      currentView,
      userRole,
      selectedClinicId: currentClinicId,
      currentUser: currentUser ? { id: currentUser.id } : null,
      loggedInPatient: patientAuth
    };
    localStorage.setItem('clinicq_session_v2', JSON.stringify(s));
  }, [currentView, userRole, currentClinicId, currentUser, patientAuth]);

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

  // Navigation
  const handleStaffLogin = () => setCurrentView('STAFF_LOGIN');
  
  // UPDATED: Go straight to Tracker even if not logged in (Guest Mode)
  const handlePatientEnter = (mode?: 'DOCTOR' | 'CLINIC') => {
      setInitialSearchMode(mode || 'CLINIC');
      setCurrentView('PATIENT_TRACKER');
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    if (role === UserRole.ADMIN) {
        setCurrentView('ADMIN_DASHBOARD');
    } else {
        setCurrentView('CLINIC_AUTH');
    }
  };

  const handleClinicSelect = (clinicId: string) => {
    setCurrentClinicId(clinicId);
    if (userRole === UserRole.DOCTOR) {
      setCurrentView('DOCTOR_LOGIN');
    } else if (userRole === UserRole.RECEPTIONIST) {
      setCurrentView('DASHBOARD_RECEPTION');
    } else if (userRole === UserRole.KIOSK) {
      setCurrentView('KIOSK');
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    setCurrentUserId(doctorId);
    setCurrentView('DASHBOARD_DOCTOR');
  };

  // PATIENT LOGIN & AUTO-BOOKING LOGIC
  const handlePatientLogin = (phone: string, name: string) => {
    setPatientAuth({ phone, name });
    // IMPORTANT: Do not force navigation if we are already in tracker (prevents unmount)
    if (currentView !== 'PATIENT_TRACKER') {
        setCurrentView('PATIENT_TRACKER');
    }
    
    if (pendingAction) {
        if (pendingAction.type === 'CHECK_IN') {
            handlePatientCheckIn(pendingAction.clinicId, pendingAction.patientId);
            addToast("Check-in confirmed!", "success");
        } else if (pendingAction.type === 'BOOKING') {
            // AUTO-EXECUTE BOOKING
            const b = pendingAction.data;
            handleGetToken(
                b.name, // Use booking name which might be guest name or family member
                phone,  // Use verified phone
                b.doctorId, b.clinicId, b.apptTime, b.apptDate, b.age, b.gender, b.symptoms
            );
            addToast("Booking Confirmed Successfully!", "success");
        }
        setPendingAction(null);
    } else {
        addToast(`Welcome, ${name}`, "success");
    }
  };

  const handleLogout = () => {
    setCurrentView('LANDING');
    setUserRole(null);
    setCurrentClinicId(null);
    setCurrentUserId(null);
    setPatientAuth(null);
    setPendingAction(null);
    localStorage.removeItem('clinicq_session_v2');
  };

  // Handle Guest Booking Hand-off
  const handleGuestBookingAttempt = (bookingData: PendingBooking) => {
      setPendingAction({ type: 'BOOKING', data: bookingData });
      setCurrentView('PATIENT_LOGIN');
      addToast("Please verify mobile to confirm booking", "info");
  };
  
  // Smart Back Handler for Patient Login
  const handlePatientLoginBack = () => {
      if (pendingAction) {
          // If we were trying to do something (like guest booking), cancel it and go back to tracker
          setPendingAction(null);
          setCurrentView('PATIENT_TRACKER');
      } else {
          // Normal login attempt, go back to Landing
          setCurrentView('LANDING');
      }
  };

  // RECEPTION HANDLERS
  const handleAddPatient = (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => {
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
      tokenNumber: (clinic.patients.length > 0 ? Math.max(...clinic.patients.map(p => p.tokenNumber)) : 0) + 1,
      name, phone, doctorId,
      status: PatientStatus.WAITING,
      timeAdded: Date.now(),
      visitType: date && time ? 'APPOINTMENT' : 'WALK_IN',
      appointmentDate: date || getLocalToday(),
      appointmentTime: time,
      isCheckedIn: !date, // Walk-ins are checked in by default (physically present)
      age, gender, symptoms
    };

    setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, patients: [...c.patients, newPatient] } : c));
    addToast(`Token #${newPatient.tokenNumber} generated`, 'success');
  };

  const handleUpdateStatus = (patientId: string, status: PatientStatus) => {
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

    setClinics(prev => prev.map(c => 
        c.id === currentClinicId 
        ? { ...c, patients: c.patients.map(p => p.id === patientId ? { ...p, status, timeCompleted: status === PatientStatus.COMPLETED ? Date.now() : p.timeCompleted } : p) }
        : c
    ));
  };

  const handleEditPatient = (id: string, updates: Partial<Patient>) => {
    if (!currentClinicId) return;
    setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, ...updates } : p) } : c));
  };

  const handleDeletePatient = (id: string) => {
    if (!currentClinicId) return;
    setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, patients: c.patients.filter(p => p.id !== id) } : c));
    addToast('Patient deleted', 'info');
  };

  const handleDeleteMultiplePatients = (ids: string[]) => {
      if (!currentClinicId) return;
      setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, patients: c.patients.filter(p => !ids.includes(p.id)) } : c));
      addToast(`${ids.length} records deleted`, 'info');
  };

  // DOCTOR MANAGEMENT
  const handleAddDoctor = (name: string, specialty: string, room: string, schedule: DaySchedule[], mobile?: string, regNo?: string, masterId?: string, avatarUrl?: string, fee?: number, time?: number) => {
      if (!currentClinicId) return;
      const newMasterId = masterId || `master_${Date.now()}`;
      const newDoc: Doctor = {
          id: `doc_${Date.now()}`,
          masterId: newMasterId,
          name, specialty, roomNumber: room,
          mobile: mobile || '', registrationNumber: regNo,
          weeklySchedule: schedule,
          isAvailable: true, status: DoctorStatus.AVAILABLE,
          delayMinutes: 0,
          consultationFee: fee || 500, rating: 5.0, reviewCount: 0,
          consultationTime: time || 15,
          avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${newMasterId}`
      };
      setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, doctors: [...c.doctors, newDoc] } : c));
  };

  const handleEditDoctor = (id: string, updates: Partial<Doctor>) => {
      if (!currentClinicId) return;
      setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, doctors: c.doctors.map(d => d.id === id ? { ...d, ...updates } : d) } : c));
  };

  const handleDeleteDoctor = (id: string) => {
      if (!currentClinicId) return;
      setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, doctors: c.doctors.filter(d => d.id !== id) } : c));
      addToast('Doctor removed', 'info');
  };

  const checkMasterDoctor = (mobile: string): Doctor | null => {
      for (const c of clinics) {
          const found = c.doctors.find(d => d.mobile === mobile);
          if (found) return found;
      }
      return null;
  };

  // DOCTOR DASHBOARD
  const handleUpdateDoctorStatus = (doctorId: string, status: DoctorStatus, delay: number) => {
      if (!currentClinicId) return;
      setClinics(prev => prev.map(c => c.id === currentClinicId ? {
          ...c,
          doctors: c.doctors.map(d => d.id === doctorId ? { 
              ...d, 
              status, 
              delayMinutes: delay,
              statusUpdateTime: Date.now(),
              delayStartTime: delay > 0 ? Date.now() : undefined
          } : d)
      } : c));
  };

  const handleNextPatient = () => {
      if (!currentClinic || !currentUser) return;
      
      // Effective sort time helper (Appointment vs Arrival)
      const getSortTime = (p: Patient) => {
          if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
              return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
          }
          return p.timeAdded;
      };

      // Sophisticated Sorting matching Dashboard logic
      const queue = currentClinic.patients
          .filter(p => p.doctorId === currentUser.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD))
          .sort((a, b) => {
              // 1. Manual Queue Order (Overrides Priority)
              if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                  const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                  const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                  if (orderA !== orderB) return orderA - orderB;
              }

              // 2. Emergency Priority
              if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;

              // 3. Status Priority: ON_HOLD > WAITING
              const getStatusPriority = (s: PatientStatus) => {
                  if (s === PatientStatus.ON_HOLD) return 0;
                  if (s === PatientStatus.WAITING) return 1;
                  return 2;
              };
              const pA = getStatusPriority(a.status);
              const pB = getStatusPriority(b.status);
              if (pA !== pB) return pA - pB;

              // 4. Time-based sort
              return getSortTime(a) - getSortTime(b);
          });
      
      if (queue.length === 0) {
          addToast("No patients in queue", "info");
          return;
      }
      
      // Complete current if any
      const active = currentClinic.patients.find(p => p.doctorId === currentUser.id && p.status === PatientStatus.WITH_DOCTOR);
      if (active) handleUpdateStatus(active.id, PatientStatus.COMPLETED);
      
      handleUpdateStatus(queue[0].id, PatientStatus.WITH_DOCTOR);
  };

  const handleCompletePatient = (id: string, notes: string) => {
      if (!currentClinicId) return;
      setClinics(prev => prev.map(c => c.id === currentClinicId ? {
          ...c,
          patients: c.patients.map(p => p.id === id ? { ...p, status: PatientStatus.COMPLETED, notes, timeCompleted: Date.now() } : p)
      } : c));
      addToast("Visit completed", "success");
  };
  
  const handleHoldPatient = (id: string) => {
      handleUpdateStatus(id, PatientStatus.ON_HOLD);
      addToast("Patient held", "warning");
  };

  const handleResumePatient = (id: string) => {
      handleUpdateStatus(id, PatientStatus.WAITING);
      // Hack: Update timeAdded to move to front? Or just status. 
      // For now just status change makes them show up in queue again.
      addToast("Patient back in queue", "info");
  };

  // DOCTOR: Switch Clinic
  const handleSwitchClinic = (targetClinicId: string) => {
      if (!currentUser) return;
      // Need to find the doctor ID in the new clinic that matches the current master ID
      const newClinic = clinics.find(c => c.id === targetClinicId);
      if (newClinic && currentUser) {
          const linkedDoc = newClinic.doctors.find(d => d.masterId === currentUser.masterId);
          if (linkedDoc) {
              setCurrentClinicId(targetClinicId);
              setCurrentUserId(linkedDoc.id);
              addToast(`Switched to ${newClinic.name}`, 'success');
          } else {
              addToast("Profile not linked in target clinic", "error");
          }
      }
  };

  // PATIENT TRACKER
  const handleGetToken = (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => {
      const clinic = clinics.find(c => c.id === clinicId);
      if (!clinic) return;
      
      const newPatient: Patient = {
          id: `pat_remote_${Date.now()}`,
          tokenNumber: Math.floor(Math.random() * 1000),
          name, phone, doctorId,
          status: PatientStatus.WAITING,
          timeAdded: Date.now(),
          visitType: date && time ? 'APPOINTMENT' : 'WALK_IN',
          appointmentDate: date, appointmentTime: time,
          age, gender, symptoms,
          isCheckedIn: false // Remote bookings not checked in
      };
      
      setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, patients: [...c.patients, newPatient] } : c));
      addToast(date ? 'Appointment Booked!' : 'Token Generated!', 'success');
  };

  const handlePatientCheckIn = (clinicId: string, patientId: string) => {
      setClinics(prev => prev.map(c => {
          if (c.id !== clinicId) return c;
          return {
              ...c,
              patients: c.patients.map(p => p.id === patientId ? { ...p, isCheckedIn: true } : p)
          };
      }));
  };

  const handleCancelVisit = (clinicId: string, patientId: string) => {
      setClinics(prev => prev.map(c => {
          if (c.id !== clinicId) return c;
          return {
              ...c,
              patients: c.patients.map(p => p.id === patientId ? { ...p, status: PatientStatus.CANCELLED } : p)
          };
      }));
  };

  const handleSimulateQRScan = (clinicId: string) => {
      if (!patientAuth) {
          setPendingAction({ type: 'CHECK_IN', clinicId, patientId: 'current' }); // Placeholder ID logic
          setCurrentView('PATIENT_LOGIN');
          addToast("Login to check-in", "info");
      } else {
          // Logic to find user's active appointment in this clinic
          const clinic = clinics.find(c => c.id === clinicId);
          const visit = clinic?.patients.find(p => p.phone === patientAuth.phone && p.status === PatientStatus.WAITING);
          
          if (visit) {
              handlePatientCheckIn(clinicId, visit.id);
              addToast("Checked In Successfully!", "success");
              setCurrentView('PATIENT_TRACKER');
          } else {
              setCurrentClinicId(clinicId); // Pre-select clinic for booking
              setCurrentView('PATIENT_TRACKER');
              addToast("No active visit found. Book now.", "info");
          }
      }
  };

  // ADMIN HANDLERS
  const handleUpdateClinicPlan = (clinicId: string, plan: PlanType) => {
      setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, plan } : c));
      addToast("Plan updated", "success");
  };
  const handleToggleClinicStatus = (clinicId: string) => {
      setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, subscriptionStatus: c.subscriptionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : c));
  };
  const handleDeleteClinic = (clinicId: string) => {
      setClinics(prev => prev.filter(c => c.id !== clinicId));
  };
  const handleEditClinic = (clinicId: string, updates: Partial<Clinic>) => {
      setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, ...updates } : c));
  };
  const handleResetSystem = () => {
      localStorage.removeItem('clinicq_db_v2');
      localStorage.removeItem('clinicq_session_v2');
      setClinics(INITIAL_CLINICS);
      handleLogout();
      addToast("System reset complete", "warning");
  };

  return (
    <>
      <ToastContainer notifications={notifications} remove={removeToast} />
      
      {currentView === 'LANDING' && (
        <LandingPage 
          onPatientEnter={handlePatientEnter} 
          onStaffLogin={handleStaffLogin}
          onSimulateQRScan={handleSimulateQRScan}
          clinics={clinics}
        />
      )}

      {currentView === 'STAFF_LOGIN' && <StaffLogin onSelectRole={handleRoleSelect} onBack={handleLogout} />}

      {currentView === 'CLINIC_AUTH' && userRole && (
        <ClinicAuth 
          clinics={clinics}
          onSelectClinic={handleClinicSelect}
          onCreateClinic={(name, plan, address, city, pincode, services) => {
            const newClinic: Clinic = {
              id: `clinic_${Date.now()}`,
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              plan,
              type: ClinicType.GENERAL,
              doctors: [],
              patients: [],
              city: city, 
              address: address, 
              pincode: pincode,
              amenities: services
            };
            setClinics([...clinics, newClinic]);
            handleClinicSelect(newClinic.id);
          }}
          onBack={() => setCurrentView('STAFF_LOGIN')}
          role={userRole}
        />
      )}

      {currentView === 'DOCTOR_LOGIN' && currentClinic && (
        <DoctorLogin 
          clinic={currentClinic}
          onSelectDoctor={handleDoctorSelect}
          onBack={() => setCurrentView('CLINIC_AUTH')}
        />
      )}

      {/* 5. DASHBOARDS */}
      
      {/* RECEPTION */}
      {currentView === 'DASHBOARD_RECEPTION' && currentClinic && (
        <div className="flex flex-col h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-20">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-none">SmartQFlow</h1>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Reception Console</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{currentClinic.name}</p>
                  <p className="text-xs text-slate-500">{currentClinic.city}</p>
               </div>
               <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" /> Logout
               </Button>
            </div>
          </header>
          <div className="flex-1 overflow-hidden bg-slate-50">
            <ReceptionDashboard 
              doctors={currentClinic.doctors}
              patients={currentClinic.patients}
              clinicName={currentClinic.name}
              clinicType={currentClinic.type}
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
              onUpdateClinicName={(name) => setClinics(prev => prev.map(c => c.id === currentClinicId ? { ...c, name } : c))}
              onToggleEmergency={(id) => {
                  const p = currentClinic.patients.find(pat => pat.id === id);
                  if (p) handleEditPatient(id, { isEmergency: !p.isEmergency });
              }}
              onManualReorder={(id, direction) => {
                  addToast("Reordering not fully implemented in demo", "info");
              }}
              onDragDrop={(draggedId, targetId) => {
                   addToast("Reordering updated", "success");
              }}
              onManualCheckIn={(id) => handlePatientCheckIn(currentClinic.id, id)}
              addToast={addToast}
            />
          </div>
        </div>
      )}

      {/* DOCTOR */}
      {currentView === 'DASHBOARD_DOCTOR' && currentClinic && currentUser && (() => {
        const activeDoctor = currentClinic.doctors.find(d => d.id === currentUser.id) || currentUser;
        // Find linked clinics for switcher
        const linkedClinics = activeDoctor.masterId 
            ? clinics.filter(c => c.doctors.some(d => d.masterId === activeDoctor.masterId))
            : [];

        return (
        <div className="flex flex-col h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-20">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-none">SmartQFlow</h1>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Doctor Console</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Dr. {activeDoctor.name}</p>
                <p className="text-xs text-slate-500">{activeDoctor.specialty}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-hidden bg-slate-50">
            <DoctorDashboard 
              doctor={activeDoctor}
              queue={currentClinic.patients.filter(p => p.doctorId === activeDoctor.id && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED)}
              linkedClinics={linkedClinics}
              currentClinicId={currentClinic.id}
              onSwitchClinic={handleSwitchClinic}
              onNextPatient={handleNextPatient}
              onCompletePatient={handleCompletePatient}
              onUpdateStatus={handleUpdateDoctorStatus}
              onUpdatePatientDetails={handleEditPatient}
              onHoldPatient={handleHoldPatient}
              onResumePatient={handleResumePatient}
            />
          </div>
        </div>
        );
      })()}

      {/* KIOSK */}
      {currentView === 'KIOSK' && currentClinic && (
        <KioskView 
          doctors={currentClinic.doctors}
          patients={currentClinic.patients}
          clinicName={currentClinic.name}
          onExit={handleLogout}
        />
      )}

      {/* ADMIN */}
      {currentView === 'ADMIN_DASHBOARD' && (
          <div className="flex flex-col h-screen">
               <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md z-20">
                  <div className="flex items-center gap-3"><Logo className="h-8 w-8" /><span className="font-bold text-xl">Super Admin</span></div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
               </header>
               <div className="flex-1 overflow-hidden">
                   <AdminDashboard 
                       clinics={clinics}
                       onUpdatePlan={handleUpdateClinicPlan}
                       onToggleStatus={handleToggleClinicStatus}
                       onDeleteClinic={handleDeleteClinic}
                       onEditClinic={handleEditClinic}
                       onResetSystem={handleResetSystem}
                   />
               </div>
          </div>
      )}

      {/* PATIENT APP FLOW */}
      {currentView === 'PATIENT_LOGIN' && (
        <PatientLogin 
          onLogin={handlePatientLogin}
          onBack={handlePatientLoginBack}
          addToast={addToast}
          pendingActionMessage={pendingAction?.type === 'CHECK_IN' ? 'Login to confirm your arrival' : pendingAction?.type === 'BOOKING' ? 'Verify mobile number to confirm booking' : undefined}
          pendingBookingDetails={pendingAction?.type === 'BOOKING' ? pendingAction.data : undefined} // Pass booking data
        />
      )}

      {currentView === 'PATIENT_TRACKER' && (
        <PatientTracker 
          clinics={clinics}
          userPhone={patientAuth?.phone || ''}
          userName={patientAuth?.name || 'Guest'}
          isGuest={!patientAuth}
          onLoginClick={(phone, name) => {
              if (phone && name) {
                  // In-place login from Tracker modal
                  handlePatientLogin(phone, name);
              } else {
                  // Manual navigation to login page
                  setCurrentView('PATIENT_LOGIN');
              }
          }}
          onGuestBook={handleGuestBookingAttempt} // Pass new handler
          onBack={handleLogout}
          onGetToken={handleGetToken}
          addToast={addToast}
          onUpdateDetails={handleEditPatient}
          onCancelVisit={handleCancelVisit}
          onCheckIn={handlePatientCheckIn}
          preSelectedClinicId={currentClinicId || undefined}
          onClearPendingAction={() => setCurrentClinicId(null)}
          initialSearchMode={initialSearchMode}
        />
      )}
    </>
  );
}