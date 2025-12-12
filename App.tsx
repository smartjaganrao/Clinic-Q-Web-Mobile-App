
import React, { useState, useEffect } from 'react';
import { UserRole, PatientStatus, Clinic, PlanType, Patient, Doctor, DoctorStatus, DaySchedule, AppNotification, ClinicStats, TimeSlot, ClinicType, Vitals, PainPoint, Staff } from './types';
// Removed INITIAL_CLINICS import as it's now handled in storage.ts
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
import { storage } from './services/storage';

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
  
  // Data State - Now managed via Storage Subscription
  const [clinics, setClinics] = useState<Clinic[]>([]);

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
  // Derive current user (Doctor) from fresh clinics data
  const currentUser = (userRole === UserRole.DOCTOR && currentClinic && currentUserId) 
      ? currentClinic.doctors.find(d => d.id === currentUserId) || null 
      : null;

  // ------------------------------------------------------------------
  // SUBSCRIPTION TO DATA LAYER
  // ------------------------------------------------------------------
  useEffect(() => {
      const unsubscribe = storage.subscribe((data) => {
          setClinics(data);
      });
      return () => unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // SESSION EFFECTS
  // ------------------------------------------------------------------
  
  // Safety Redirect
  useEffect(() => {
      const needsClinic = ['DASHBOARD_RECEPTION', 'DASHBOARD_DOCTOR', 'KIOSK', 'DOCTOR_LOGIN'].includes(currentView);
      // Wait for clinics to load before redirecting
      if (clinics.length > 0 && needsClinic && !currentClinic) {
          setCurrentView(userRole ? 'CLINIC_AUTH' : 'LANDING');
      }
  }, [currentView, currentClinic, userRole, clinics.length]);

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
  // HANDLERS (Now delegation to Storage Service)
  // ------------------------------------------------------------------

  // Navigation
  const handleStaffLogin = () => setCurrentView('STAFF_LOGIN');
  
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
    if (currentView !== 'PATIENT_TRACKER') {
        setCurrentView('PATIENT_TRACKER');
    }
    
    if (pendingAction) {
        if (pendingAction.type === 'CHECK_IN') {
            handlePatientCheckIn(pendingAction.clinicId, pendingAction.patientId);
            addToast("Check-in confirmed!", "success");
        } else if (pendingAction.type === 'BOOKING') {
            const b = pendingAction.data;
            handleGetToken(
                b.name, phone, b.doctorId, b.clinicId, b.apptTime, b.apptDate, b.age, b.gender, b.symptoms
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

  const handleGuestBookingAttempt = (bookingData: PendingBooking) => {
      setPendingAction({ type: 'BOOKING', data: bookingData });
      setCurrentView('PATIENT_LOGIN');
      addToast("Please verify mobile to confirm booking", "info");
  };
  
  const handlePatientLoginBack = () => {
      if (pendingAction) {
          setPendingAction(null);
          setCurrentView('PATIENT_TRACKER');
      } else {
          setCurrentView('LANDING');
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
      tokenNumber: (clinic.patients.length > 0 ? Math.max(...clinic.patients.map(p => p.tokenNumber)) : 0) + 1,
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

    await storage.addPatient(currentClinicId, newPatient);
    addToast(`Token #${newPatient.tokenNumber} generated`, 'success');
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
  const handleAddDoctor = async (name: string, specialty: string, room: string, schedule: DaySchedule[], mobile?: string, regNo?: string, masterId?: string, avatarUrl?: string, fee?: number, time?: number) => {
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
                  if (s === PatientStatus.ON_HOLD) return 0;
                  if (s === PatientStatus.WAITING) return 1;
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

  const handleResumePatient = async (id: string) => {
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
              addToast(`Switched to ${newClinic.name}`, 'success');
          } else {
              addToast("Profile not linked in target clinic", "error");
          }
      }
  };

  // PATIENT TRACKER
  const handleGetToken = async (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => {
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
          isCheckedIn: false 
      };
      
      await storage.addPatient(clinicId, newPatient);
      addToast(date ? 'Appointment Booked!' : 'Token Generated!', 'success');
  };

  const handlePatientCheckIn = async (clinicId: string, patientId: string) => {
      await storage.updatePatient(clinicId, patientId, { isCheckedIn: true });
  };

  const handleCancelVisit = async (clinicId: string, patientId: string) => {
      await storage.updatePatientStatus(clinicId, patientId, PatientStatus.CANCELLED);
  };

  const handleSimulateQRScan = (clinicId: string) => {
      if (!patientAuth) {
          setPendingAction({ type: 'CHECK_IN', clinicId, patientId: 'current' }); 
          setCurrentView('PATIENT_LOGIN');
          addToast("Login to check-in", "info");
      } else {
          const clinic = clinics.find(c => c.id === clinicId);
          const visit = clinic?.patients.find(p => p.phone === patientAuth.phone && p.status === PatientStatus.WAITING);
          
          if (visit) {
              handlePatientCheckIn(clinicId, visit.id);
              addToast("Checked In Successfully!", "success");
              setCurrentView('PATIENT_TRACKER');
          } else {
              setCurrentClinicId(clinicId);
              setCurrentView('PATIENT_TRACKER');
              addToast("No active visit found. Book now.", "info");
          }
      }
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
      handleLogout();
      addToast("System reset complete", "warning");
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
          onCreateClinic={async (name, plan, address, city, pincode, services) => {
            const newClinic: Clinic = {
              id: `clinic_${Date.now()}`,
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              plan,
              type: ClinicType.GENERAL,
              doctors: [],
              patients: [],
              staff: [],
              city: city, 
              address: address, 
              pincode: pincode,
              amenities: services
            };
            await storage.createClinic(newClinic);
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

      {/* DASHBOARDS */}
      
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
              staff={currentClinic.staff}
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
              onUpdateClinicName={(name) => storage.updateClinic(currentClinic.id, { name })}
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
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onAddStaff={handleLocalAddStaff}
              onUpdateStaff={handleLocalUpdateStaff}
              onDeleteStaff={handleLocalDeleteStaff}
              addToast={addToast}
            />
          </div>
        </div>
      )}

      {/* DOCTOR */}
      {currentView === 'DASHBOARD_DOCTOR' && currentClinic && currentUser && (() => {
        const activeDoctor = currentClinic.doctors.find(d => d.id === currentUser.id) || currentUser;
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
              onUpdatePatientDetails={(id, updates) => storage.updatePatient(currentClinic.id, id, updates)}
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
                       onAddStaff={handleAddStaff}
                       onUpdateStaff={handleUpdateStaff}
                       onDeleteStaff={handleDeleteStaff}
                       onAddDoctor={(clinicId, doc) => storage.addDoctor(clinicId, doc)}
                       onEditDoctor={(clinicId, docId, updates) => storage.updateDoctor(clinicId, docId, updates)}
                       onDeleteDoctor={(clinicId, docId) => storage.deleteDoctor(clinicId, docId)}
                       onCheckMasterDoctor={checkMasterDoctor}
                       addToast={addToast}
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
          pendingBookingDetails={pendingAction?.type === 'BOOKING' ? pendingAction.data : undefined}
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
                  handlePatientLogin(phone, name);
              } else {
                  setCurrentView('PATIENT_LOGIN');
              }
          }}
          onGuestBook={handleGuestBookingAttempt}
          onBack={handleLogout}
          onGetToken={handleGetToken}
          addToast={addToast}
          onUpdateDetails={(id, updates) => { if(currentClinicId) storage.updatePatient(currentClinicId, id, updates) }}
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
