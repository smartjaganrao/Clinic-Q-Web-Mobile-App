
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

// Helper Component for Pull-to-Refresh
const PullToRefresh = ({ onRefresh, children, className }: { onRefresh: () => Promise<void>, children: React.ReactNode, className?: string }) => {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasVibrated, setHasVibrated] = useState(false);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY <= 5) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && window.scrollY <= 5 && !isRefreshing) {
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 0) {
                const newDist = Math.min(diff * 0.5, threshold * 1.5);
                setPullDistance(newDist);
                
                if (newDist >= threshold && !hasVibrated) {
                    if (navigator.vibrate) navigator.vibrate(15);
                    setHasVibrated(true);
                } else if (newDist < threshold && hasVibrated) {
                    setHasVibrated(false);
                }
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > threshold * 0.8) {
            setIsRefreshing(true);
            setPullDistance(threshold);
            await onRefresh();
            setIsRefreshing(false);
        }
        setStartY(0);
        setPullDistance(0);
        setHasVibrated(false);
    };

    return (
        <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className={className} style={{ overscrollBehaviorY: 'contain' }}>
            <div className="fixed top-0 left-0 w-full flex justify-center pt-4 pointer-events-none z-40 transition-opacity duration-200" style={{ opacity: pullDistance > 0 ? Math.min(pullDistance / threshold, 1) : 0, transform: `translateY(${pullDistance > 0 ? 0 : -50}px)` }}>
                <div className={`bg-white rounded-full p-2 shadow-md border border-slate-200 ${isRefreshing ? 'animate-spin' : ''}`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
            </div>
            <div style={{ transform: `translateY(${pullDistance}px)`, transition: isRefreshing ? 'transform 0.2s' : 'transform 0.1s ease-out' }}>{children}</div>
        </div>
    );
};

// Helper Component for Back to Top
const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isVisible) return null;

    return (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-90 hover:opacity-100" aria-label="Back to top">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
    );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------------------------------------------------------
  // ENVIRONMENT CONFIGURATION
  // ------------------------------------------------------------------
  useEffect(() => {
      // Attempt to load Supabase config from environment variables
      const getEnv = (key: string) => {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env) {
              // @ts-ignore
              return import.meta.env[`VITE_${key}`] || import.meta.env[key];
          }
          if (typeof process !== 'undefined' && process.env) {
              return process.env[`REACT_APP_${key}`] || process.env[key];
          }
          return null;
      };

      const envUrl = getEnv('SB_URL');
      const envKey = getEnv('SB_KEY');

      if (envUrl && envKey) {
          const storedUrl = localStorage.getItem('sb_url');
          if (storedUrl !== envUrl) {
              console.log("Initializing Supabase from Environment Variables");
              saveSupabaseConfig(envUrl, envKey);
              localStorage.removeItem('clinicq_data');
              window.location.reload();
          }
      }
  }, []);

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
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

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
          setLastSynced(new Date());
          console.log("Realtime Update Received:", new Date().toISOString());
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
        let targetPatientId = pendingAction.patientId;

        // Resolve 'current' placeholder if coming from QR scan
        if (targetPatientId === 'current') {
            const clinic = clinics.find(c => c.id === pendingAction.clinicId);
            const visit = clinic?.patients.find(p => p.phone === phone && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD));
            
            if (visit) {
                targetPatientId = visit.id;
            } else {
                addToast("No active visit found to check-in.", "error");
                setPendingAction(null);
                navigate('/patient');
                return;
            }
        }

        handlePatientCheckIn(pendingAction.clinicId, targetPatientId);
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
      localStorage.removeItem('clinicq_data');
      addToast("Config saved. Reloading to sync with Database...", "success");
      setTimeout(() => window.location.reload(), 1500);
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
DROP TRIGGER IF EXISTS trigger_sync_patients_json ON public.patients;
DROP TRIGGER IF EXISTS trigger_sync_doctors_json ON public.doctors;
DROP FUNCTION IF EXISTS sync_patients_to_clinic_json;
DROP FUNCTION IF EXISTS sync_doctors_to_clinic_json;
DROP TRIGGER IF EXISTS sync_doctors_cols ON public.doctors;
DROP TRIGGER IF EXISTS sync_patients_cols ON public.patients;
DROP FUNCTION IF EXISTS sync_generated_columns;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- 1. Clinics Table (Parent)
create table public.clinics (
  id text primary key,
  name text not null,
  data jsonb default '{}'::jsonb -- Stores only clinic settings/metadata, NO nested patients/doctors
);

-- 2. Doctors Table (Normalized)
create table public.doctors (
  id text primary key,
  clinic_id text references public.clinics(id) on delete cascade,
  name text,
  data jsonb not null -- Doctor details
);

-- 3. Patients Table (Normalized)
create table public.patients (
  id text primary key,
  clinic_id text references public.clinics(id) on delete cascade,
  doctor_id text references public.doctors(id) on delete set null,
  name text, -- Populated via trigger
  status text, -- Populated via trigger
  queue_order int default 0,
  data jsonb not null -- Patient details
);

-- Enable Realtime
alter publication supabase_realtime add table public.clinics;
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.patients;

-- Security (Demo Mode - Idempotent)
alter table public.clinics enable row level security;
create policy "Public Access" on public.clinics for all using (true);

alter table public.doctors enable row level security;
create policy "Public Access Docs" on public.doctors for all using (true);

alter table public.patients enable row level security;
create policy "Public Access Pts" on public.patients for all using (true);

-- Indexes for Performance (Optimization)
create index idx_doctors_clinic_id on public.doctors(clinic_id);
create index idx_patients_clinic_id on public.patients(clinic_id);
create index idx_patients_doctor_id on public.patients(doctor_id);
create index idx_patients_status on public.patients(status);

-- 5. Data Sync Triggers (Auto-populate columns from JSON)
-- Ensures 'name' and 'status' columns are always in sync with 'data' JSON
create or replace function sync_generated_columns() returns trigger as $$
begin
  if new.data ? 'name' then
    new.name := new.data->>'name';
  end if;
  if TG_TABLE_NAME = 'patients' and new.data ? 'status' then
    new.status := new.data->>'status';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger sync_doctors_cols before insert or update on doctors
for each row execute function sync_generated_columns();

create trigger sync_patients_cols before insert or update on patients
for each row execute function sync_generated_columns();

-- 4. Master View (Simplifies Fetching for Frontend)
-- Aggregates Doctors and Patients back into the Clinic JSON structure
create or replace view public.clinics_master as
select 
  c.id,
  c.name,
  c.data || jsonb_build_object(
    'doctors', (
      select coalesce(jsonb_agg(
        d.data || jsonb_build_object('id', d.id, 'clinicId', d.clinic_id, 'name', d.name)
      ), '[]'::jsonb)
      from doctors d 
      where d.clinic_id = c.id
    ),
    'patients', (
      select coalesce(jsonb_agg(
        p.data || jsonb_build_object(
          'id', p.id, 
          'clinicId', p.clinic_id, 
          'doctorId', p.doctor_id, 
          'name', p.name,
          'status', p.status, 
          'queueOrder', p.queue_order
        ) order by p.queue_order asc, p.id asc
      ), '[]'::jsonb)
      from patients p 
      where p.clinic_id = c.id
    )
  ) as data
from clinics c;

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
                      <Button onClick={() => handleSupabaseSetup(url, key)}>Save & Connect</Button>
                      <Button variant="outline" onClick={() => {
                          localStorage.removeItem('clinicq_data');
                          window.location.reload();
                      }} disabled={!getSupabase()}>Force Sync from DB</Button>
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
                      3. Enter credentials here and click Save & Connect.<br/>
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
            patientAuth ? <Navigate to="/patient" replace /> : (
                <PatientLogin 
                  onLogin={handlePatientLogin}
                  onBack={handlePatientLoginBack}
                  addToast={addToast}
                  pendingActionMessage={pendingAction?.type === 'CHECK_IN' ? 'Login to confirm your arrival' : undefined}
                />
            )
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
                        {lastSynced && (
                            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
                                <div className="flex items-center bg-white/90 backdrop-blur border border-green-200 rounded-full shadow-sm px-3 py-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse mr-2" />
                                    <span className="text-xs text-green-700 font-medium">
                                        Live Sync: {lastSynced.toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        )}
                        <ReceptionDashboard 
                            doctors={currentClinic.doctors}
                            patients={currentClinic.patients}
                            staff={currentClinic.staff}
                            clinicName={currentClinic.name}
                            clinicType={currentClinic.type}
                            operationMode={currentClinic.operationMode}
                            clinicData={currentClinic}
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
                            onHoldPatient={handleHoldPatient}
                            onResumePatient={handleHoldPatientResume}
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
                        {lastSynced && (
                            <span className="ml-4 text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full animate-pulse border border-green-700">
                                ● Live Sync: {lastSynced.toLocaleTimeString()}
                            </span>
                        )}
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
            <>
                <PullToRefresh 
                    className="relative min-h-screen bg-slate-50"
                    onRefresh={async () => { await new Promise(r => setTimeout(r, 800)); window.location.reload(); }}
                >
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
                </PullToRefresh>
                <BackToTop />
            </>
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
