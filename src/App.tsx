import React, { useState, useEffect } from 'react';
import { UserRole, PatientStatus, Clinic, PlanType, Patient, Doctor, DoctorStatus, DaySchedule, Notification, ClinicStats } from '.././types';
import { INITIAL_CLINICS } from '.././constants';
import { LandingPage } from './pages/LandingPage';
import { StaffLogin } from './pages/StaffLogin';
import { PatientLogin } from './pages/PatientLogin';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorLogin } from './pages/DoctorLogin';
import { KioskView } from './pages/KioskView';
import { PatientTracker } from './pages/PatientTracker';
import { ClinicAuth } from './pages/ClinicAuth';
import { Monitor, LogOut, Stethoscope, Home, ShieldCheck } from 'lucide-react';
import { Button } from './components/Button';
import { ToastContainer } from './components/Toast';
import { Logo } from './components/Logo';

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
  | 'HOME' 
  | 'STAFF_LOGIN'
  | 'PATIENT_LOGIN'
  | 'PATIENT_APP' 
  | 'AUTH_CLINIC_SELECT' 
  | 'AUTH_DOCTOR_SELECT' 
  | 'DASHBOARD_RECEPTION' 
  | 'DASHBOARD_DOCTOR' 
  | 'DASHBOARD_ADMIN'
  | 'VIEW_KIOSK';

export default function App() {
  
  // ------------------------------------------------------------------
  // SESSION PERSISTENCE (Restore state on refresh)
  // ------------------------------------------------------------------
  // Fixed: Use correct v2 key to match save logic
  const getSession = () => {
    try {
      const s = localStorage.getItem('clinicq_session_v2');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  };
  
  const session = getSession();

  // State Machine
  const [currentView, setCurrentView] = useState<AppView>(session?.currentView || 'HOME');
  const [userRole, setUserRole] = useState<UserRole | null>(session?.userRole || null);
  
  // Data State - Fixed: Initialize synchronously to prevent blank screen render
  const [clinics, setClinics] = useState<Clinic[]>(() => {
      try {
          const saved = localStorage.getItem('clinicq_db_v2');
          return saved ? JSON.parse(saved) : INITIAL_CLINICS;
      } catch {
          return INITIAL_CLINICS;
      }
  });

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(session?.selectedClinicId || null);
  const [currentUser, setCurrentUser] = useState<any>(session?.currentUser || null);
  
  // Notifications
  const [toasts, setToasts] = useState<Notification[]>([]);

  // QR / Deep Link State
  const [pendingClinicId, setPendingClinicId] = useState<string | null>(null);
  
  // Patient Auth State
  const [loggedInPatient, setLoggedInPatient] = useState<{name: string, phone: string} | null>(session?.loggedInPatient || null);

  // ------------------------------------------------------------------
  // INIT & PERSISTENCE
  // ------------------------------------------------------------------
  
  // Safety Redirect: If on a dashboard but no clinic is selected/found, go back.
  useEffect(() => {
      const needsClinic = ['DASHBOARD_RECEPTION', 'DASHBOARD_DOCTOR', 'VIEW_KIOSK', 'AUTH_DOCTOR_SELECT'].includes(currentView);
      const isClinicValid = selectedClinicId && clinics.find(c => c.id === selectedClinicId);
      
      if (needsClinic && !isClinicValid) {
          // Fallback to clinic selection or home to prevent blank screen
          setCurrentView(userRole ? 'AUTH_CLINIC_SELECT' : 'HOME');
          if (selectedClinicId) setSelectedClinicId(null); 
      }
  }, [currentView, selectedClinicId, clinics, userRole]);

  // Save Database on Change
  useEffect(() => {
    if (clinics.length > 0) {
      localStorage.setItem('clinicq_db_v2', JSON.stringify(clinics));
    }
  }, [clinics]);

  // Save Session on Change
  useEffect(() => {
    const s = {
      currentView,
      userRole,
      selectedClinicId,
      currentUser,
      loggedInPatient
    };
    localStorage.setItem('clinicq_session_v2', JSON.stringify(s));
  }, [currentView, userRole, selectedClinicId, currentUser, loggedInPatient]);

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const currentClinic = clinics.find(c => c.id === selectedClinicId);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  // 1. Navigation & Auth
  const handleStaffLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === UserRole.ADMIN) {
        setCurrentView('DASHBOARD_ADMIN');
    } else {
        setCurrentView('AUTH_CLINIC_SELECT');
    }
  };

  const handlePatientEnter = () => {
    if (loggedInPatient) {
        setCurrentView('PATIENT_APP');
    } else {
        setCurrentView('PATIENT_LOGIN');
    }
  };

  const handlePatientLoginSuccess = (phone: string, name: string) => {
      setLoggedInPatient({ phone, name });
      setCurrentView('PATIENT_APP');
      addToast(`Welcome back, ${name}`, 'success');
  };

  const handleClinicSelect = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    if (userRole === UserRole.DOCTOR) {
      setCurrentView('AUTH_DOCTOR_SELECT');
    } else if (userRole === UserRole.RECEPTIONIST) {
      setCurrentView('DASHBOARD_RECEPTION');
    } else if (userRole === UserRole.KIOSK) {
      setCurrentView('VIEW_KIOSK');
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    if (!currentClinic) return;
    const doctor = currentClinic.doctors.find(d => d.id === doctorId);
    if (doctor) {
      setCurrentUser(doctor);
      setCurrentView('DASHBOARD_DOCTOR');
    }
  };

  const handleLogout = () => {
    setCurrentView('HOME');
    setUserRole(null);
    setSelectedClinicId(null);
    setCurrentUser(null);
    setLoggedInPatient(null);
    localStorage.removeItem('clinicq_session_v2');
  };

  // 2. Patient Management (Reception)
  const handleAddPatient = (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => {
    if (!currentClinic) return;

    // Check for Duplicate in Active Queue
    const isDuplicate = currentClinic.patients.some(p => 
        p.phone === phone && 
        p.name.toLowerCase() === name.toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
    );

    if (isDuplicate) {
        addToast("Patient is already in the active queue.", "error");
        return;
    }

    const doctor = currentClinic.doctors.find(d => d.id === doctorId);
    
    const visitType = date && time ? 'APPOINTMENT' : 'WALK_IN';

    const newPatient: Patient = {
      id: generateId(),
      tokenNumber: (currentClinic.patients.length > 0 ? Math.max(...currentClinic.patients.map(p => p.tokenNumber)) : 0) + 1,
      name,
      phone,
      status: PatientStatus.WAITING,
      doctorId,
      timeAdded: Date.now(),
      visitType,
      appointmentDate: date || getLocalToday(),
      appointmentTime: time,
      isCheckedIn: visitType === 'WALK_IN', // Walk-ins are physically present
      age,
      gender,
      symptoms
    };

    const updatedClinics = clinics.map(c => 
      c.id === currentClinic.id 
        ? { ...c, patients: [...c.patients, newPatient] }
        : c
    );
    setClinics(updatedClinics);
    
    // Simulate SMS/WhatsApp
    const docName = doctor ? doctor.name : 'Doctor';
    addToast(`Token #${newPatient.tokenNumber} generated for ${docName}`, 'success');
  };

  // 2b. Patient App Booking Handler (Supports Clinic ID Override)
  const handlePatientBooking = (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => {
      const targetClinic = clinics.find(c => c.id === clinicId);
      if (!targetClinic) {
          addToast("Clinic not found", "error");
          return;
      }

      // Check for Duplicate in Active Queue
      const isDuplicate = targetClinic.patients.some(p => 
          p.phone === phone && 
          p.name.toLowerCase() === name.toLowerCase() && 
          (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
      );

      if (isDuplicate) {
          addToast("You have an active booking already.", "error");
          return;
      }

      const visitType = date && time ? 'APPOINTMENT' : 'WALK_IN';

      const newPatient: Patient = {
        id: generateId(),
        tokenNumber: (targetClinic.patients.length > 0 ? Math.max(...targetClinic.patients.map(p => p.tokenNumber)) : 0) + 1,
        name,
        phone,
        status: PatientStatus.WAITING,
        doctorId,
        timeAdded: Date.now(),
        visitType,
        appointmentDate: date || getLocalToday(),
        appointmentTime: time,
        isCheckedIn: false, // Patient App bookings are remote -> Not checked in yet
        age,
        gender,
        symptoms
      };

      const updatedClinics = clinics.map(c => 
        c.id === clinicId 
          ? { ...c, patients: [...c.patients, newPatient] }
          : c
      );
      setClinics(updatedClinics);
      
      const docName = targetClinic.doctors.find(d => d.id === doctorId)?.name || 'Doctor';
      addToast(`Booking confirmed! Token #${newPatient.tokenNumber} with ${docName}`, 'success');
  };

  const handleUpdateStatus = (patientId: string, status: PatientStatus) => {
    if (!currentClinic) return;
    
    // Constraint: Only one patient WITH_DOCTOR per doctor
    if (status === PatientStatus.WITH_DOCTOR) {
        const patient = currentClinic.patients.find(p => p.id === patientId);
        const activePatient = currentClinic.patients.find(p => p.doctorId === patient?.doctorId && p.status === PatientStatus.WITH_DOCTOR);
        if (activePatient && activePatient.id !== patientId) {
            addToast("Doctor is currently with a patient. Complete that visit first.", "error");
            return;
        }
    }

    const updatedClinics = clinics.map(c => {
      if (c.id === currentClinic.id) {
        return {
          ...c,
          patients: c.patients.map(p => 
            p.id === patientId 
              ? { ...p, status, timeCompleted: status === PatientStatus.COMPLETED ? Date.now() : p.timeCompleted } 
              : p
          )
        };
      }
      return c;
    });
    setClinics(updatedClinics);
  };

  const handleDeletePatient = (patientId: string) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.filter(p => p.id !== patientId) } 
          : c
      ));
      addToast("Patient record deleted.", "info");
  };

  const handleDeleteMultiplePatients = (ids: string[]) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.filter(p => !ids.includes(p.id)) } 
          : c
      ));
      addToast(`${ids.length} records deleted.`, "info");
  };

  const handleEditPatient = (id: string, updates: Partial<Patient>) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, ...updates } : p) } 
          : c
      ));
  };

  const handleToggleEmergency = (id: string) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, isEmergency: !p.isEmergency } : p) } 
          : c
      ));
  };

  const handleManualReorder = (id: string, direction: 'UP' | 'DOWN') => {
      if (!currentClinic) return;
      const queue = currentClinic.patients.filter(p => p.status === PatientStatus.WAITING).sort((a,b) => a.timeAdded - b.timeAdded);
      const index = queue.findIndex(p => p.id === id);
      if (index === -1) return;
      
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= queue.length) return;

      const targetPatient = queue[targetIndex];
      // Swap timestamps to persist order
      const tempTime = targetPatient.timeAdded;
      
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => {
              if (p.id === id) return { ...p, timeAdded: tempTime };
              if (p.id === targetPatient.id) return { ...p, timeAdded: queue[index].timeAdded };
              return p;
          })} 
          : c
      ));
  };

  const handleDragDrop = (draggedId: string, targetId: string) => {
      if (!currentClinic) return;
      const draggedP = currentClinic.patients.find(p => p.id === draggedId);
      const targetP = currentClinic.patients.find(p => p.id === targetId);
      
      if (draggedP && targetP) {
          const newTime = targetP.timeAdded - 1; 
          
          setClinics(clinics.map(c => 
              c.id === currentClinic.id 
              ? { ...c, patients: c.patients.map(p => p.id === draggedId ? { ...p, timeAdded: newTime } : p) }
              : c
          ));
      }
  };

  const handleReceptionCheckIn = (id: string) => {
      handleEditPatient(id, { isCheckedIn: true });
      addToast("Patient marked as checked-in.", "success");
  };

  // 3. Doctor Dashboard
  const handleUpdateDoctorStatus = (doctorId: string, status: DoctorStatus, delay: number) => {
    if (!currentClinic) return;
    
    // Check previous state for toasts to avoid spamming
    const doc = currentClinic.doctors.find(d => d.id === doctorId);
    if (doc) {
        if (status === DoctorStatus.ON_BREAK && doc.status !== DoctorStatus.ON_BREAK) {
            addToast("Queue paused (On Break)", "warning");
        }
        if (delay > 0 && doc.delayMinutes !== delay) {
            addToast(`Delay of ${delay}m reported`, "warning");
        }
    }

    const updatedClinics = clinics.map(c => {
      if (c.id === currentClinic.id) {
        return {
          ...c,
          doctors: c.doctors.map(d => {
            if (d.id !== doctorId) return d;
            
            const now = Date.now();
            let newStatusTime = d.statusUpdateTime;
            let newDelayTime = d.delayStartTime;

            // Update status timer ONLY if status changes
            if (d.status !== status) {
                newStatusTime = now;
            }

            // Update delay timer ONLY if delay starts or duration changes
            if (d.delayMinutes !== delay) {
                newDelayTime = delay > 0 ? now : undefined;
            }

            // Init status timer if missing and not available
            if (!newStatusTime && status !== DoctorStatus.AVAILABLE) {
                newStatusTime = now;
            }

            return { 
                ...d, 
                status, 
                delayMinutes: delay, 
                statusUpdateTime: newStatusTime, 
                delayStartTime: newDelayTime 
            };
          })
        };
      }
      return c;
    });
    setClinics(updatedClinics);
  };

  const handleNextPatient = () => {
    if (!currentClinic || !currentUser) return;
    
    // Find Next Priority Patient
    // 1. Emergency
    // 2. Appointments (Checked In + On Time)
    // 3. Walk-in / Late Appts
    
    const queue = currentClinic.patients
        .filter(p => p.doctorId === currentUser.id && p.status === PatientStatus.WAITING)
        .sort((a, b) => {
            if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
            // Basic sort by time for now, Smart Logic is in DoctorDashboard view
            return a.timeAdded - b.timeAdded; 
        });

    if (queue.length === 0) {
      addToast("No waiting patients.", "info");
      return;
    }

    const nextP = queue[0];
    const currentP = currentClinic.patients.find(p => p.doctorId === currentUser.id && p.status === PatientStatus.WITH_DOCTOR);

    const updatedClinics = clinics.map(c => {
      if (c.id === currentClinic.id) {
        let newPatients = [...c.patients];
        // Complete current
        if (currentP) {
            newPatients = newPatients.map(p => p.id === currentP.id ? { ...p, status: PatientStatus.COMPLETED, timeCompleted: Date.now() } : p);
        }
        // Start next
        newPatients = newPatients.map(p => p.id === nextP.id ? { ...p, status: PatientStatus.WITH_DOCTOR } : p);
        return { ...c, patients: newPatients };
      }
      return c;
    });
    setClinics(updatedClinics);
  };

  const handleHoldPatient = (id: string) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, status: PatientStatus.ON_HOLD } : p) } 
          : c
      ));
      addToast("Patient put on hold", "warning");
  };

  const handleResumePatient = (id: string) => {
      if (!currentClinic) return;
      // Check if doc is free
      const activeP = currentClinic.patients.find(p => p.doctorId === currentUser.id && p.status === PatientStatus.WITH_DOCTOR);
      if (activeP) {
          addToast("Please finish current consultation first", "error");
          return;
      }
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, status: PatientStatus.WITH_DOCTOR } : p) } 
          : c
      ));
      addToast("Resumed consultation", "success");
  };

  const handleCompletePatient = (id: string, notes: string) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => 
          c.id === currentClinic.id 
          ? { ...c, patients: c.patients.map(p => p.id === id ? { ...p, status: PatientStatus.COMPLETED, timeCompleted: Date.now(), notes } : p) } 
          : c
      ));
      addToast("Visit completed", "success");
  };

  // 4. Staff Management
  const handleAddDoctor = (name: string, specialty: string, room: string, schedule: DaySchedule[]) => {
      if (!currentClinic) return;
      const newDoc: Doctor = {
          id: generateId(),
          name,
          specialty,
          roomNumber: room,
          isAvailable: true,
          status: DoctorStatus.AVAILABLE,
          delayMinutes: 0,
          avatarUrl: `https://i.pravatar.cc/150?u=${name}`,
          weeklySchedule: schedule,
          consultationFee: 500,
          rating: 0,
          reviewCount: 0
      };
      setClinics(clinics.map(c => c.id === currentClinic.id ? { ...c, doctors: [...c.doctors, newDoc] } : c));
  };

  const handleEditDoctor = (id: string, updates: Partial<Doctor>) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => c.id === currentClinic.id ? { ...c, doctors: c.doctors.map(d => d.id === id ? { ...d, ...updates } : d) } : c));
  };

  const handleDeleteDoctor = (id: string) => {
      if (!currentClinic) return;
      setClinics(clinics.map(c => c.id === currentClinic.id ? { ...c, doctors: c.doctors.filter(d => d.id !== id) } : c));
  };

  // 5. Admin Dashboard
  const handleCreateClinic = (name: string, plan: PlanType) => {
      const newClinic: Clinic = {
          id: generateId(),
          name,
          slug: name.toLowerCase().replace(/ /g, '-'),
          plan,
          doctors: [],
          patients: [],
          city: 'Unknown',
          address: 'Update Address',
          pincode: '000000',
          operatingHours: '09:00 AM - 09:00 PM', // Default
          about: 'Welcome to our clinic. We provide quality healthcare services.', // Default
          amenities: ['Waiting Area', 'Wifi', 'Drinking Water'], // Default
          subscriptionStatus: 'ACTIVE',
          joinedDate: Date.now()
      };
      setClinics([...clinics, newClinic]);
      setSelectedClinicId(newClinic.id);
      setCurrentView('DASHBOARD_RECEPTION'); // Go directly to Reception so Admin can setup doctors
      setUserRole(UserRole.RECEPTIONIST); // Auto-assume role for immediate setup
      addToast("Clinic created! Add doctors to get started.", "success");
  };

  const handleUpdateClinicPlan = (clinicId: string, plan: PlanType) => {
      setClinics(clinics.map(c => c.id === clinicId ? { ...c, plan } : c));
      addToast("Subscription plan updated", "success");
  };

  const handleToggleClinicStatus = (clinicId: string) => {
      setClinics(clinics.map(c => 
          c.id === clinicId 
          ? { ...c, subscriptionStatus: c.subscriptionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } 
          : c
      ));
  };

  const handleDeleteClinic = (clinicId: string) => {
      setClinics(clinics.filter(c => c.id !== clinicId));
      addToast("Clinic deleted permanently", "warning");
  };

  const handleEditClinic = (id: string, updates: Partial<Clinic>) => {
      setClinics(clinics.map(c => c.id === id ? { ...c, ...updates } : c));
      addToast("Clinic details updated", "success");
  };

  // 6. Patient App & QR
  const handleSimulateQR = (clinicId: string) => {
      if (loggedInPatient) {
          // Check if patient has active visit here
          const clinic = clinics.find(c => c.id === clinicId);
          const activeVisit = clinic?.patients.find(p => p.phone === loggedInPatient.phone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED);
          
          if (activeVisit) {
              handleReceptionCheckIn(activeVisit.id); // Auto Check-in
              setSelectedClinicId(clinicId);
              setCurrentView('PATIENT_APP');
          } else {
              setPendingClinicId(clinicId);
              setCurrentView('PATIENT_APP'); // Will trigger "New Booking" view
          }
      } else {
          setPendingClinicId(clinicId);
          setCurrentView('PATIENT_LOGIN');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <ToastContainer notifications={toasts} remove={removeToast} />
      
      {/* ----------------- HOME / LANDING ----------------- */}
      {currentView === 'HOME' && (
        <LandingPage 
          onPatientEnter={handlePatientEnter} 
          onStaffLogin={() => setCurrentView('STAFF_LOGIN')} 
          onSimulateQRScan={handleSimulateQR}
          clinics={clinics}
        />
      )}

      {/* ----------------- STAFF AUTH ----------------- */}
      {currentView === 'STAFF_LOGIN' && (
        <StaffLogin 
          onSelectRole={handleStaffLogin} 
          onBack={() => setCurrentView('HOME')} 
        />
      )}

      {currentView === 'AUTH_CLINIC_SELECT' && (
        <ClinicAuth 
          clinics={clinics} 
          onSelectClinic={handleClinicSelect} 
          onCreateClinic={handleCreateClinic}
          onBack={() => setCurrentView('STAFF_LOGIN')}
          role={userRole!} 
        />
      )}

      {currentView === 'AUTH_DOCTOR_SELECT' && currentClinic && (
        <DoctorLogin 
          clinic={currentClinic} 
          onSelectDoctor={handleDoctorSelect} 
          onBack={() => setCurrentView('AUTH_CLINIC_SELECT')} 
        />
      )}

      {/* ----------------- PATIENT AUTH ----------------- */}
      {currentView === 'PATIENT_LOGIN' && (
        <PatientLogin 
          onLogin={handlePatientLoginSuccess}
          onBack={() => setCurrentView('HOME')}
          addToast={addToast}
          pendingActionMessage={pendingClinicId ? "Login to confirm your check-in" : undefined}
        />
      )}

      {/* ----------------- DASHBOARDS ----------------- */}
      
      {/* 1. RECEPTION */}
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
                <p className="text-sm font-medium text-slate-900">Front Desk</p>
                <p className="text-xs text-slate-500">{currentClinic.name}</p>
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
              onEditDoctor={handleEditDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onUpdateStatus={handleUpdateStatus}
              onCancelPatient={(id) => handleUpdateStatus(id, PatientStatus.CANCELLED)}
              onUpdateClinicName={(name) => setClinics(clinics.map(c => c.id === currentClinic.id ? { ...c, name } : c))}
              onToggleEmergency={handleToggleEmergency}
              onManualReorder={handleManualReorder}
              onDragDrop={handleDragDrop}
              onManualCheckIn={handleReceptionCheckIn}
              addToast={addToast}
            />
          </div>
        </div>
      )}

      {/* 2. DOCTOR */}
      {currentView === 'DASHBOARD_DOCTOR' && currentClinic && currentUser && (() => {
        // Fix: Use the live doctor object from clinics state instead of stale currentUser state
        const activeDoctor = currentClinic.doctors.find(d => d.id === currentUser.id) || currentUser;
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

      {/* 3. KIOSK */}
      {currentView === 'VIEW_KIOSK' && currentClinic && (
        <KioskView 
          doctors={currentClinic.doctors}
          patients={currentClinic.patients}
          clinicName={currentClinic.name}
          onExit={handleLogout}
        />
      )}

      {/* 4. PATIENT APP */}
      {currentView === 'PATIENT_APP' && loggedInPatient && (
        <PatientTracker 
          clinics={clinics}
          userPhone={loggedInPatient.phone}
          userName={loggedInPatient.name}
          onBack={handleLogout}
          onGetToken={handlePatientBooking}
          addToast={addToast}
          onUpdateDetails={handleEditPatient}
          onCancelVisit={(clinicId, pId) => {
              // Safer implementation: Don't rely on closure 'clinics' variable check.
              // Directly use functional update to find and modify the target.
              setClinics(prev => prev.map(cl => 
                  cl.id === clinicId 
                  ? { ...cl, patients: cl.patients.map(p => p.id === pId ? { ...p, status: PatientStatus.CANCELLED } : p) } 
                  : cl
              ));
          }}
          onCheckIn={(clinicId, pId) => {
              setClinics(prev => prev.map(cl => 
                  cl.id === clinicId 
                  ? { ...cl, patients: cl.patients.map(p => p.id === pId ? { ...p, isCheckedIn: true } : p) } 
                  : cl
              ));
          }}
          preSelectedClinicId={pendingClinicId || undefined}
          onClearPendingAction={() => setPendingClinicId(null)}
        />
      )}

      {/* 5. ADMIN DASHBOARD */}
      {currentView === 'DASHBOARD_ADMIN' && (
          <div className="flex flex-col h-screen">
              <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md z-20">
                  <div className="flex items-center gap-3">
                      <Logo className="h-8 w-8 bg-white rounded p-1" />
                      <div>
                          <h1 className="text-xl font-bold leading-none">SmartQFlow</h1>
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">System Admin</span>
                      </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-800">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
              </header>
              <div className="flex-1 overflow-hidden bg-slate-100">
                  <AdminDashboard 
                      clinics={clinics}
                      onUpdatePlan={handleUpdateClinicPlan}
                      onToggleStatus={handleToggleClinicStatus}
                      onDeleteClinic={handleDeleteClinic}
                      onEditClinic={handleEditClinic}
                  />
              </div>
          </div>
      )}

    </div>
  );
}