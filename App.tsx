import React, { useState } from 'react';
import { UserRole, PatientStatus, Clinic, PlanType, Patient, Doctor, DoctorStatus, DaySchedule, Notification } from './types';
import { INITIAL_CLINICS } from './constants';
import { LandingPage } from './pages/LandingPage';
import { StaffLogin } from './pages/StaffLogin';
import { PatientLogin } from './pages/PatientLogin';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorLogin } from './pages/DoctorLogin';
import { KioskView } from './pages/KioskView';
import { PatientTracker } from './pages/PatientTracker';
import { ClinicAuth } from './pages/ClinicAuth';
import { Monitor, LogOut, Stethoscope, Home } from 'lucide-react';
import { Button } from './components/Button';
import { ToastContainer } from './components/Toast';

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

type AppView = 
  | 'HOME' 
  | 'STAFF_LOGIN'
  | 'PATIENT_LOGIN'
  | 'PATIENT_APP' 
  | 'AUTH_CLINIC_SELECT' 
  | 'AUTH_DOCTOR_SELECT' 
  | 'DASHBOARD_RECEPTION' 
  | 'DASHBOARD_DOCTOR' 
  | 'VIEW_KIOSK';

export default function App() {
  // State Machine
  const [currentView, setCurrentView] = useState<AppView>('HOME');
  
  // Data Context
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  
  // QR Code / Deep Link Context
  // If a user scans a QR but isn't logged in, we store the clinic ID here
  // After login, we pass this to the PatientTracker to auto-open that clinic
  const [pendingClinicId, setPendingClinicId] = useState<string | null>(null);
  
  // Patient Session State
  const [loggedInPatient, setLoggedInPatient] = useState<{ phone: string; name: string } | null>(null);

  // Database State (Multi-tenant)
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  
  // Notification System
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helpers
  const currentClinic = clinics.find(c => c.id === currentClinicId);

  // ------------------------------------------------------------------
  // Data Mutations (CRUD Handlers)
  // ------------------------------------------------------------------

  const handleCreateClinic = (name: string, plan: PlanType) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const defaultSchedule = days.map(day => ({
        day, startTime: '09:00', endTime: '17:00', isOff: day === 'Sunday'
    }));

    const newClinic: Clinic = {
        id: `clinic_${generateId()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        plan,
        doctors: [{
            id: `doc_new_${generateId()}`,
            name: 'Dr. Admin',
            specialty: 'General Physician',
            roomNumber: '101',
            isAvailable: true,
            status: DoctorStatus.AVAILABLE,
            delayMinutes: 0,
            avatarUrl: `https://picsum.photos/100/100?random=${Math.random()}`,
            weeklySchedule: defaultSchedule
        }],
        patients: [],
        city: 'Bangalore', // Default city
        address: '123 Health Street',
        pincode: '000000',
        coordinates: { x: 50, y: 50 },
        geoLocation: { lat: 12.9716, lng: 77.6412 } // Default location
    };
    setClinics([...clinics, newClinic]);
    setCurrentClinicId(newClinic.id);
    
    addToast(`Welcome to ${name}! Setup successful.`, 'success');

    // Auto-route based on role
    if (selectedRole === UserRole.RECEPTIONIST || selectedRole === UserRole.ADMIN) {
        setCurrentView('DASHBOARD_RECEPTION');
    } else if (selectedRole === UserRole.KIOSK) {
        setCurrentView('VIEW_KIOSK');
    } else if (selectedRole === UserRole.DOCTOR) {
        // New clinic has 1 doctor, auto select
        setCurrentDoctorId(newClinic.doctors[0].id);
        setCurrentView('DASHBOARD_DOCTOR');
    }
  };

  const createNewPatient = (
      clinic: Clinic, 
      name: string, 
      phone: string, 
      doctorId: string, 
      appointmentTime?: string, 
      appointmentDate?: string,
      age?: string,
      gender?: 'Male' | 'Female' | 'Other',
      symptoms?: string
    ): Patient => {
    const docPatients = clinic.patients.filter(p => p.doctorId === doctorId);
    const docIndex = clinic.doctors.findIndex(d => d.id === doctorId);
    const baseToken = (docIndex + 1) * 100;
    const lastToken = docPatients.length > 0 ? Math.max(...docPatients.map(p => p.tokenNumber)) : baseToken;

    return {
      id: generateId(),
      name,
      phone,
      tokenNumber: lastToken + 1,
      status: PatientStatus.WAITING,
      doctorId,
      timeAdded: Date.now(),
      visitType: appointmentTime ? 'APPOINTMENT' : 'WALK_IN',
      appointmentTime,
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0],
      isEmergency: false,
      isCheckedIn: false,
      vitals: { bp: '', temp: '', weight: '', pulse: '' },
      painPoints: [],
      age,
      gender,
      symptoms
    };
  };

  const handleAddPatient = (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => {
    if (!currentClinic) return;
    const newPatient = createNewPatient(currentClinic, name, phone, doctorId, time, date, age, gender, symptoms);

    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id === currentClinicId) {
            return { ...c, patients: [...c.patients, newPatient] };
        }
        return c;
    }));
    addToast(`Token #${newPatient.tokenNumber} generated for ${name}`, 'success');
  };

  const handleEditPatient = (id: string, updates: Partial<Patient>) => {
    if (!currentClinic) return;
    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id === currentClinicId) {
            return {
                ...c,
                patients: c.patients.map(p => p.id === id ? { ...p, ...updates } : p)
            };
        }
        return c;
    }));
    addToast('Patient details updated', 'success');
  };

  const handleUpdatePatientDetails = (id: string, updates: Partial<Patient>) => {
      // Need to find which clinic this patient belongs to if currentClinicId is not set (e.g. from Patient App)
      // For global updates, we iterate all clinics
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.patients.some(p => p.id === id)) {
              return {
                  ...c,
                  patients: c.patients.map(p => p.id === id ? { ...p, ...updates } : p)
              };
          }
          return c;
      }));
  };

  const handlePatientCheckIn = (clinicId: string, patientId: string) => {
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id === clinicId) {
              return {
                  ...c,
                  patients: c.patients.map(p => {
                      if (p.id === patientId && !p.isCheckedIn) {
                          addToast("Check-in Successful! Queue priority updated.", "success");
                          return { ...p, isCheckedIn: true };
                      }
                      return p;
                  })
              };
          }
          return c;
      }));
  };

  const handleDeletePatient = (id: string) => {
    if (!currentClinic) return;
    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id === currentClinicId) {
            return {
                ...c,
                patients: c.patients.filter(p => p.id !== id)
            };
        }
        return c;
    }));
    addToast('Patient removed from records', 'info');
  };

  const handleToggleEmergency = (patientId: string) => {
    if (!currentClinic) return;
    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id !== currentClinicId) return c;
        return {
            ...c,
            patients: c.patients.map(p => {
                if (p.id === patientId) {
                    const newValue = !p.isEmergency;
                    addToast(newValue ? "Marked as Emergency Priority" : "Removed Emergency Priority", newValue ? "warning" : "info");
                    return { ...p, isEmergency: newValue };
                }
                return p;
            })
        };
    }));
  };

  const handleAddDoctor = (name: string, specialty: string, room: string, schedule: DaySchedule[]) => {
      if (!currentClinic) return;
      const newDoctor: Doctor = {
          id: `doc_${generateId()}`,
          name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
          specialty,
          roomNumber: room,
          isAvailable: true,
          status: DoctorStatus.AVAILABLE,
          delayMinutes: 0,
          weeklySchedule: schedule,
          avatarUrl: `https://picsum.photos/100/100?random=${Math.random()}`
      };

      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id === currentClinicId) {
              return { ...c, doctors: [...c.doctors, newDoctor] };
          }
          return c;
      }));
      addToast(`${newDoctor.name} added to staff`, 'success');
  };

  const handleEditDoctor = (id: string, updates: Partial<Doctor>) => {
      if (!currentClinic) return;
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id === currentClinicId) {
              return {
                  ...c,
                  doctors: c.doctors.map(d => d.id === id ? { ...d, ...updates } : d)
              };
          }
          return c;
      }));
      addToast('Doctor profile updated', 'success');
  };

  const handleDeleteDoctor = (id: string) => {
      if (!currentClinic) return;
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id === currentClinicId) {
              return {
                  ...c,
                  doctors: c.doctors.filter(d => d.id !== id)
              };
          }
          return c;
      }));
      addToast('Doctor removed', 'info');
  };

  const handlePatientSelfRegister = (
      name: string, 
      phone: string, 
      doctorId: string, 
      clinicId: string, 
      appointmentTime?: string, 
      appointmentDate?: string,
      age?: string,
      gender?: 'Male' | 'Female' | 'Other',
      symptoms?: string
    ) => {
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id === clinicId) {
               const newPatient = createNewPatient(c, name, phone, doctorId, appointmentTime, appointmentDate, age, gender, symptoms);
               addToast(`Booking Confirmed! Your token is #${newPatient.tokenNumber}`, 'success');
               return { ...c, patients: [...c.patients, newPatient] };
          }
          return c;
      }));
  };

  const handleUpdateStatus = (patientId: string, status: PatientStatus, specificClinicId?: string) => {
    // If specificClinicId is passed (from PatientTracker), use it. Otherwise use currentClinicId (Reception Dashboard)
    const targetClinicId = specificClinicId || currentClinicId;
    
    if (!targetClinicId) return;

    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id === targetClinicId) {
            let updatedPatients = c.patients.map(p => {
                if (p.id === patientId) {
                    const updates: Partial<Patient> = { status };
                    if (status === PatientStatus.COMPLETED) {
                        updates.timeCompleted = Date.now();
                    }
                    if (status === PatientStatus.WAITING) {
                        // If re-queued (e.g. from Skipped), update timestamp to move to bottom
                         updates.timeAdded = Date.now();
                    }
                    return { ...p, ...updates };
                }
                return p;
            });
            return { ...c, patients: updatedPatients };
        }
        return c;
    }));
  };

  const handleManualReorder = (patientId: string, direction: 'UP' | 'DOWN') => {
      if (!currentClinic) return;
      
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id !== currentClinicId) return c;
          
          const patient = c.patients.find(p => p.id === patientId);
          if (!patient) return c;

          // We only reorder WAITING patients for specific doctor
          const queue = c.patients.filter(p => p.doctorId === patient.doctorId && p.status === PatientStatus.WAITING).sort((a,b) => a.timeAdded - b.timeAdded);
          const currentIndex = queue.findIndex(p => p.id === patientId);
          
          if (currentIndex === -1) return c;
          if (direction === 'UP' && currentIndex === 0) return c;
          if (direction === 'DOWN' && currentIndex === queue.length - 1) return c;

          const swapIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
          const otherPatient = queue[swapIndex];

          // Swap timestamps to persist order logic
          const tempTime = patient.timeAdded;
          const otherTime = otherPatient.timeAdded;

          const updatedPatients = c.patients.map(p => {
              if (p.id === patientId) return { ...p, timeAdded: otherTime };
              if (p.id === otherPatient.id) return { ...p, timeAdded: tempTime };
              return p;
          });

          return { ...c, patients: updatedPatients };
      }));
  };

  const handleDragDrop = (draggedId: string, targetId: string) => {
      if (!currentClinic) return;
      
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id !== currentClinicId) return c;

          const draggedPatient = c.patients.find(p => p.id === draggedId);
          const targetPatient = c.patients.find(p => p.id === targetId);
          
          if (!draggedPatient || !targetPatient) return c;
          
          // Cannot drag onto self
          if (draggedId === targetId) return c;

          // Logic: Update Dragged Patient's timestamp to be just before/after the target
          const isMovingDown = draggedPatient.timeAdded < targetPatient.timeAdded;
          
          let newTimestamp;
          if (isMovingDown) {
              // Moving down: Place AFTER target
              newTimestamp = targetPatient.timeAdded + 1;
          } else {
              // Moving up: Place BEFORE target
              newTimestamp = targetPatient.timeAdded - 1;
          }

          const updatedPatients = c.patients.map(p => {
              if (p.id === draggedId) {
                  return { ...p, timeAdded: newTimestamp };
              }
              return p;
          });

          return { ...c, patients: updatedPatients };
      }));
      addToast("Queue reordered manually", "info");
  };

  const handleUpdateDoctorStatus = (doctorId: string, status: DoctorStatus, delayMinutes: number) => {
      if (!currentClinic) return;
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id !== currentClinicId) return c;
          return {
              ...c,
              doctors: c.doctors.map(d => d.id === doctorId ? { ...d, status, delayMinutes } : d)
          };
      }));
  };

  const handleUpdateClinicName = (name: string) => {
    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id === currentClinicId) return { ...c, name };
        return c;
    }));
    addToast('Clinic details saved', 'success');
  };

  const handleNextPatient = (doctorId: string) => {
    if (!currentClinic) return;

    setClinics(prevClinics => prevClinics.map(c => {
        if (c.id !== currentClinicId) return c;

        const nextPatients = [...c.patients];
        
        const currentIdx = nextPatients.findIndex(p => p.doctorId === doctorId && p.status === PatientStatus.WITH_DOCTOR);
        if (currentIdx !== -1) {
            nextPatients[currentIdx].status = PatientStatus.COMPLETED;
            nextPatients[currentIdx].timeCompleted = Date.now();
        }

        // Improved Selection Logic for NEXT
        const waiting = nextPatients.filter(p => p.doctorId === doctorId && p.status === PatientStatus.WAITING);
        
        waiting.sort((a, b) => {
             if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
             return a.timeAdded - b.timeAdded;
        });

        if (waiting.length > 0) {
            const nextP = waiting[0];
            const originalIdx = nextPatients.findIndex(p => p.id === nextP.id);
            if (originalIdx !== -1) {
                 nextPatients[originalIdx].status = PatientStatus.WITH_DOCTOR;
            }
        }

        return { ...c, patients: nextPatients };
    }));
  };

  const handleCompleteConsultation = (patientId: string, notes: string) => {
      if (!currentClinic) return;
      setClinics(prevClinics => prevClinics.map(c => {
          if (c.id !== currentClinicId) return c;
          return {
              ...c,
              patients: c.patients.map(p => p.id === patientId ? { ...p, status: PatientStatus.COMPLETED, notes, timeCompleted: Date.now() } : p)
          };
      }));
      addToast('Consultation completed', 'success');
  };

  const handlePatientLogin = (phone: string, name: string) => {
      setLoggedInPatient({ phone, name });
      setCurrentView('PATIENT_APP');
      
      if (pendingClinicId) {
          const clinic = clinics.find(c => c.id === pendingClinicId);
          if (clinic) {
            addToast(`Welcome ${name}! Taking you to ${clinic.name}...`, 'success');
          }
          // Do NOT clear pendingClinicId here, it is passed as a prop to PatientTracker
      } else {
          addToast(`Welcome back, ${name}`, 'success');
      }
  };

  // ------------------------------------------------------------------
  // Navigation Handlers
  // ------------------------------------------------------------------

  const goHome = () => {
    setCurrentView('HOME');
    setSelectedRole(null);
    setCurrentClinicId(null);
    setCurrentDoctorId(null);
    setLoggedInPatient(null);
    setPendingClinicId(null);
  };

  const enterPatientPortal = () => {
      setSelectedRole(UserRole.PATIENT);
      // Redirect to login first
      setCurrentView('PATIENT_LOGIN');
  };

  // Simulated QR Scan Handler from Landing Page
  const handleQRScanSimulated = (clinicId: string) => {
      setPendingClinicId(clinicId);
      
      // Scenario: User Scans QR
      // If already logged in? (In this app flow, 'goHome' clears login, but realistically:)
      if (loggedInPatient) {
          setCurrentView('PATIENT_APP');
          addToast("QR Scanned. Redirecting...", "success");
      } else {
          // Not logged in -> Go to Login
          setSelectedRole(UserRole.PATIENT);
          setCurrentView('PATIENT_LOGIN');
          addToast("Please login to continue booking.", "info");
      }
  };

  const enterStaffPortal = () => {
      setCurrentView('STAFF_LOGIN');
  };

  const handleRoleSelection = (role: UserRole) => {
      setSelectedRole(role);
      setCurrentView('AUTH_CLINIC_SELECT');
  };

  const handleClinicSelected = (clinicId: string) => {
      setCurrentClinicId(clinicId);
      
      // Route based on role
      if (selectedRole === UserRole.DOCTOR) {
          setCurrentView('AUTH_DOCTOR_SELECT');
      } else if (selectedRole === UserRole.KIOSK) {
          setCurrentView('VIEW_KIOSK');
      } else {
          // Reception / Admin
          setCurrentView('DASHBOARD_RECEPTION');
      }
  };

  const handleDoctorSelected = (doctorId: string) => {
      setCurrentDoctorId(doctorId);
      setCurrentView('DASHBOARD_DOCTOR');
  };

  // ------------------------------------------------------------------
  // Render Views
  // ------------------------------------------------------------------

  const CommonHeader = ({ title }: { title: string }) => (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
            <div className="bg-primary-600 rounded p-1">
                {selectedRole === UserRole.DOCTOR ? <Stethoscope className="text-white h-5 w-5" /> : <Monitor className="text-white h-5 w-5" />}
            </div>
            <span className="font-bold text-lg text-slate-800 hidden sm:inline">ClinicQ <span className="text-slate-400 font-normal text-sm">| {title}</span></span>
        </div>
        <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={goHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
            </Button>
            {currentView !== 'VIEW_KIOSK' && (
                 <Button variant="secondary" size="sm" onClick={() => setCurrentView('AUTH_CLINIC_SELECT')}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Switch Clinic
                </Button>
            )}
        </div>
    </header>
  );

  return (
    <>
        <ToastContainer notifications={toasts} remove={removeToast} />
        
        {(() => {
            switch (currentView) {
                case 'HOME':
                    return <LandingPage 
                        onPatientEnter={enterPatientPortal} 
                        onStaffLogin={enterStaffPortal}
                        onSimulateQRScan={handleQRScanSimulated} // Pass QR handler
                        clinics={clinics} // Pass clinics to allow simulation
                    />;

                case 'STAFF_LOGIN':
                    return <StaffLogin onSelectRole={handleRoleSelection} onBack={goHome} />;

                case 'PATIENT_LOGIN':
                    return <PatientLogin 
                        onLogin={handlePatientLogin} 
                        onBack={goHome} 
                        addToast={addToast} 
                        pendingActionMessage={pendingClinicId ? "Login to confirm booking" : undefined}
                    />;

                case 'PATIENT_APP':
                    if (!loggedInPatient) return <div>Error: Not Logged In</div>;
                    return (
                        <PatientTracker 
                            clinics={clinics} 
                            userPhone={loggedInPatient.phone}
                            userName={loggedInPatient.name}
                            onBack={goHome} 
                            onGetToken={handlePatientSelfRegister}
                            addToast={addToast}
                            onUpdateDetails={handleUpdatePatientDetails}
                            onCancelVisit={(clinicId, patientId) => {
                                // PASS EXPLICIT CLINIC ID to update function
                                handleUpdateStatus(patientId, PatientStatus.CANCELLED, clinicId);
                            }}
                            onCheckIn={handlePatientCheckIn}
                            // Pass the pending clinic from QR scan
                            preSelectedClinicId={pendingClinicId || undefined}
                            onClearPendingAction={() => setPendingClinicId(null)}
                        />
                    );

                case 'AUTH_CLINIC_SELECT':
                    return (
                        <ClinicAuth 
                            clinics={clinics} 
                            role={selectedRole || UserRole.ADMIN}
                            onSelectClinic={handleClinicSelected} 
                            onCreateClinic={handleCreateClinic}
                            onBack={() => setCurrentView('STAFF_LOGIN')}
                        />
                    );

                case 'AUTH_DOCTOR_SELECT':
                    if (!currentClinic) return <div>Error: No Clinic</div>;
                    return (
                        <DoctorLogin 
                            clinic={currentClinic}
                            onSelectDoctor={handleDoctorSelected}
                            onBack={() => setCurrentView('AUTH_CLINIC_SELECT')}
                        />
                    );

                case 'DASHBOARD_RECEPTION':
                    if (!currentClinic) return <div>Error: No Clinic</div>;
                    return (
                        <div className="h-screen flex flex-col bg-slate-50">
                            <CommonHeader title="Front Desk" />
                            <main className="flex-1 overflow-hidden">
                                <ReceptionDashboard 
                                    doctors={currentClinic.doctors} 
                                    patients={currentClinic.patients} 
                                    clinicName={currentClinic.name}
                                    onAddPatient={handleAddPatient} 
                                    onEditPatient={handleEditPatient}
                                    onDeletePatient={handleDeletePatient}
                                    onAddDoctor={handleAddDoctor}
                                    onEditDoctor={handleEditDoctor}
                                    onDeleteDoctor={handleDeleteDoctor}
                                    onUpdateStatus={handleUpdateStatus}
                                    onCancelPatient={(id) => handleUpdateStatus(id, PatientStatus.CANCELLED)}
                                    onUpdateClinicName={handleUpdateClinicName}
                                    onToggleEmergency={handleToggleEmergency}
                                    onManualReorder={handleManualReorder}
                                    onDragDrop={handleDragDrop}
                                    addToast={addToast}
                                />
                            </main>
                        </div>
                    );

                case 'DASHBOARD_DOCTOR':
                    if (!currentClinic || !currentDoctorId) return <div>Error: Missing Data</div>;
                    const activeDoctor = currentClinic.doctors.find(d => d.id === currentDoctorId);
                    if (!activeDoctor) return <div>Error: Doctor not found</div>;

                    return (
                        <div className="h-screen flex flex-col bg-slate-50">
                            <CommonHeader title="Doctor Portal" />
                            <main className="flex-1 overflow-hidden">
                                <DoctorDashboard 
                                    doctor={activeDoctor} 
                                    queue={currentClinic.patients.filter(p => p.doctorId === activeDoctor.id)}
                                    onNextPatient={() => handleNextPatient(activeDoctor.id)}
                                    onCompletePatient={handleCompleteConsultation}
                                    onUpdateStatus={handleUpdateDoctorStatus}
                                    onUpdatePatientDetails={handleUpdatePatientDetails}
                                />
                            </main>
                        </div>
                    );

                case 'VIEW_KIOSK':
                    if (!currentClinic) return <div>Error: No Clinic</div>;
                    return (
                        <>
                            <div className="fixed top-0 right-0 p-2 opacity-0 hover:opacity-100 z-50 transition-opacity">
                                <button onClick={goHome} className="bg-red-500 text-white px-4 py-2 rounded shadow-lg font-bold">Exit Kiosk</button>
                            </div>
                            <KioskView 
                                doctors={currentClinic.doctors} 
                                patients={currentClinic.patients} 
                                clinicName={currentClinic.name} 
                            />
                        </>
                    );
                    
                default:
                    return <div>Error: Unknown State</div>;
            }
        })()}
    </>
  );
}