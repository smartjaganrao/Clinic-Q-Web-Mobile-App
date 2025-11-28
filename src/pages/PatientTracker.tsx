import React, { useState, useEffect, useMemo } from 'react';
import { Clinic, Patient, PatientStatus, ClinicType } from '../../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { 
    ArrowLeft, MapPin, Search, Calendar, QrCode, ChevronRight, 
    AlertTriangle, Star, Clock, Filter, Stethoscope, Smile, 
    Baby, Heart, Activity, Sparkles, LayoutGrid, Eye, Ear, 
    ArrowUpRight, Navigation, Timer, ChevronDown, Building2, 
    ShieldCheck, ThumbsUp, Map, CheckCircle2, Info, Lock, History, X, AlertCircle, Sun, Moon,
    GraduationCap, Globe, BadgeCheck, User, Users, Plus
} from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void;
  onCancelVisit: (clinicId: string, pId: string) => void;
  onCheckIn: (clinicId: string, pId: string) => void;
  preSelectedClinicId?: string;
  onClearPendingAction: () => void;
}

const CATEGORIES = [
    { id: 'ALL', label: 'All', icon: LayoutGrid },
    { id: 'GENERAL', label: 'General', icon: Stethoscope },
    { id: 'DENTAL', label: 'Dental', icon: Smile },
    { id: 'PEDIATRIC', label: 'Kids', icon: Baby },
    { id: 'GYNECOLOGY', label: 'Women', icon: Heart },
    { id: 'ORTHOPEDIC', label: 'Bone', icon: Activity },
    { id: 'DERMATOLOGY', label: 'Skin', icon: Sparkles },
    { id: 'OPHTHALMOLOGY', label: 'Eye', icon: Eye },
    { id: 'ENT', label: 'ENT', icon: Ear },
];

// Symptom Mapper for Smart Search
const SYMPTOM_MAP: Record<string, string[]> = {
    'fever': ['GENERAL', 'PEDIATRIC'],
    'cold': ['GENERAL', 'PEDIATRIC', 'ENT'],
    'cough': ['GENERAL', 'PEDIATRIC', 'ENT'],
    'stomach': ['GENERAL', 'PEDIATRIC'],
    'tooth': ['DENTAL'],
    'gum': ['DENTAL'],
    'skin': ['DERMATOLOGY'],
    'acne': ['DERMATOLOGY'],
    'bone': ['ORTHOPEDIC'],
    'joint': ['ORTHOPEDIC'],
    'back': ['ORTHOPEDIC', 'GYNECOLOGY'],
    'pregnancy': ['GYNECOLOGY'],
    'baby': ['PEDIATRIC'],
    'heart': ['CARDIOLOGY'],
    'chest': ['CARDIOLOGY', 'GENERAL'],
    'eye': ['OPHTHALMOLOGY'],
    'vision': ['OPHTHALMOLOGY'],
    'ear': ['ENT'],
};

interface FamilyMember {
    name: string;
    age: string;
    gender: string;
    relation: string;
}

interface UserProfile {
    name: string;
    phone: string;
    age: string;
    gender: string;
    familyMembers: FamilyMember[];
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
  clinics,
  userPhone,
  userName,
  onBack,
  onGetToken,
  addToast,
  onUpdateDetails,
  onCancelVisit,
  onCheckIn,
  preSelectedClinicId,
  onClearPendingAction
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE'>('ACTIVE');
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(preSelectedClinicId || null);
  const [bookingView, setBookingView] = useState<'LIST' | 'CLINIC_DETAILS' | 'FORM'>('LIST');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEAR' | 'WAIT' | 'FEE'>('NEAR');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });

  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [travelTime, setTravelTime] = useState('15'); // Default 15 mins
  const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF'); // 'MYSELF' or Family Member Name

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; visit: any | null }>({ isOpen: false, visit: null });

  // Load Profile
  useEffect(() => {
      try {
          const saved = localStorage.getItem(`clinicq_patient_${userPhone}`);
          if (saved) {
              setUserProfile(JSON.parse(saved));
          } else {
              // Create default profile if missing
              const defaultProfile = { name: userName, phone: userPhone, age: '', gender: '', familyMembers: [] };
              setUserProfile(defaultProfile);
              localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(defaultProfile));
          }
      } catch (e) {
          console.error("Profile load error", e);
      }
  }, [userPhone, userName]);

  const handleAddMember = () => {
      if (!newMember.name || !newMember.age || !newMember.relation) {
          addToast("Please fill all details", "error");
          return;
      }
      if (userProfile) {
          const updatedProfile = {
              ...userProfile,
              familyMembers: [...(userProfile.familyMembers || []), newMember]
          };
          setUserProfile(updatedProfile);
          localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile));
          setNewMember({ name: '', age: '', gender: 'Male', relation: '' });
          setShowAddMember(false);
          addToast("Family member added!", "success");
      }
  };

  // Extract available cities
  const availableCities = useMemo(() => {
      const cities = Array.from(new Set(clinics.map(c => c.city)));
      return ['All Cities', ...cities];
  }, [clinics]);

  // Handle deep link / pre-selection
  useEffect(() => {
    if (preSelectedClinicId) {
        setSelectedClinicId(preSelectedClinicId);
        setBookingView('CLINIC_DETAILS');
        setActiveTab('BOOK');
        onClearPendingAction();

        // Auto-switch city context based on selected clinic
        const clinic = clinics.find(c => c.id === preSelectedClinicId);
        if (clinic) {
            setSelectedCity(clinic.city);
        }
    }
  }, [preSelectedClinicId, clinics, onClearPendingAction]);

  // Derived state for Active Visits
  const activeVisits = useMemo(() => {
      const visits: (Patient & { clinicName: string, clinicId: string, doctorName: string, room: string })[] = [];
      clinics.forEach(c => {
          c.patients.forEach(p => {
              if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) {
                  const doc = c.doctors.find(d => d.id === p.doctorId);
                  visits.push({
                      ...p,
                      clinicName: c.name,
                      clinicId: c.id,
                      doctorName: doc?.name || 'Unknown',
                      room: doc?.roomNumber || '-'
                  });
              }
          });
      });
      return visits.sort((a,b) => b.timeAdded - a.timeAdded);
  }, [clinics, userPhone]);

  // Derived state for History (Completed or Cancelled)
  const historyVisits = useMemo(() => {
      const visits: (Patient & { clinicName: string, clinicId: string, doctorName: string })[] = [];
      clinics.forEach(c => {
          c.patients.forEach(p => {
              if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) {
                  const doc = c.doctors.find(d => d.id === p.doctorId);
                  visits.push({
                      ...p,
                      clinicName: c.name,
                      clinicId: c.id,
                      doctorName: doc?.name || 'Unknown'
                  });
              }
          });
      });
      return visits.sort((a,b) => b.timeAdded - a.timeAdded);
  }, [clinics, userPhone]);

  // --- SMART SEARCH LOGIC ---
  const filteredClinics = useMemo(() => {
      let filtered = clinics;

      // 0. City Filter
      if (selectedCity !== 'All Cities') {
          filtered = filtered.filter(c => c.city === selectedCity);
      }

      // 1. Search Query (Name, City, or Symptom)
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          // Check for symptom keywords
          const matchedTypes: string[] = [];
          Object.keys(SYMPTOM_MAP).forEach(key => {
              if (q.includes(key)) matchedTypes.push(...SYMPTOM_MAP[key]);
          });

          filtered = filtered.filter(c => 
              c.name.toLowerCase().includes(q) || 
              c.city.toLowerCase().includes(q) ||
              c.doctors.some(d => d.specialty.toLowerCase().includes(q)) ||
              (matchedTypes.length > 0 && c.type && matchedTypes.includes(c.type))
          );
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
          filtered = filtered.filter(c => {
              // Map UI categories to ClinicTypes/Specialties
              if (selectedCategory === 'GENERAL') return c.type === 'GENERAL';
              if (selectedCategory === 'DENTAL') return c.type === 'DENTAL';
              if (selectedCategory === 'PEDIATRIC') return c.type === 'PEDIATRIC';
              if (selectedCategory === 'GYNECOLOGY') return c.type === 'GYNECOLOGY';
              if (selectedCategory === 'ORTHOPEDIC') return c.type === 'ORTHOPEDIC';
              if (selectedCategory === 'DERMATOLOGY') return c.type === 'DERMATOLOGY';
              if (selectedCategory === 'OPHTHALMOLOGY') return c.doctors.some(d => d.specialty.includes('Ophthalm') || d.specialty.includes('Eye'));
              if (selectedCategory === 'ENT') return c.doctors.some(d => d.specialty.includes('ENT'));
              return true;
          });
      }

      // 3. Sorting
      return filtered.sort((a, b) => {
          if (sortBy === 'WAIT') {
              const waitA = a.patients.filter(p => p.status === PatientStatus.WAITING).length;
              const waitB = b.patients.filter(p => p.status === PatientStatus.WAITING).length;
              return waitA - waitB;
          }
          if (sortBy === 'FEE') {
              const feeA = Math.min(...a.doctors.map(d => d.consultationFee));
              const feeB = Math.min(...b.doctors.map(d => d.consultationFee));
              return feeA - feeB;
          }
          // Default: Mock "Near Me" (just random shuffle for demo stability, real would use geoLocation)
          return 0; 
      });
  }, [clinics, searchQuery, selectedCategory, sortBy, selectedCity]);

  // Helper: Get Wait Info
  const getClinicWaitInfo = (clinic: Clinic) => {
      const waitingCount = clinic.patients.filter(p => p.status === PatientStatus.WAITING).length;
      const waitTime = waitingCount * 15; // Approx 15 mins per patient
      let statusColor = 'bg-green-100 text-green-700';
      let label = 'Low Traffic';
      
      if (waitingCount > 5) {
          statusColor = 'bg-yellow-100 text-yellow-700';
          label = 'Moderate';
      }
      if (waitingCount > 10) {
          statusColor = 'bg-red-100 text-red-700';
          label = 'High Traffic';
      }

      return { count: waitingCount, time: waitTime, color: statusColor, label };
  };

  // Helper: Get Fee Range
  const getFeeRange = (clinic: Clinic) => {
      if (!clinic.doctors.length) return 'N/A';
      const fees = clinic.doctors.map(d => d.consultationFee);
      const min = Math.min(...fees);
      const max = Math.max(...fees);
      return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  };

  // Helper: Get Unique Specialties
  const getClinicSpecialties = (clinic: Clinic) => {
      if (!clinic.doctors || clinic.doctors.length === 0) return [];
      const specs = new Set(clinic.doctors.map(d => d.specialty));
      return Array.from(specs).slice(0, 3);
  };

  // QR Scan Simulation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showQRScanner) {
        timer = setTimeout(() => {
           if (clinics.length > 0) {
               let targetClinicId = selectedClinicId;
               // Auto detect if booked
               if (!targetClinicId) {
                   const visitNeedsCheckIn = activeVisits.find(v => !v.isCheckedIn && v.status === PatientStatus.WAITING);
                   targetClinicId = visitNeedsCheckIn ? visitNeedsCheckIn.clinicId : clinics[0].id;
               }

               const activeVisit = activeVisits.find(v => v.clinicId === targetClinicId && v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED);
               
               if (activeVisit) {
                   if (!activeVisit.isCheckedIn) {
                        onCheckIn(targetClinicId!, activeVisit.id);
                        addToast(`Checked in at ${activeVisit.clinicName}!`, "success");
                   } else {
                        addToast(`Already checked in at ${activeVisit.clinicName}.`, "info");
                   }
                   setActiveTab('ACTIVE');
               } else {
                   if (targetClinicId) {
                       setSelectedClinicId(targetClinicId);
                       setBookingView('CLINIC_DETAILS'); 
                       setActiveTab('BOOK');
                       addToast("QR Detected. Loading clinic details...", "success");
                   }
               }
               setShowQRScanner(false);
           }
        }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn, addToast]);

  const handleBookToken = () => {
      if (!selectedClinicId || !selectedDoctorId) return;
      
      // Determine Patient Details (Myself or Family)
      let pName = userName;
      let pAge = userProfile?.age;
      let pGender = userProfile?.gender;

      if (bookingFor !== 'MYSELF') {
          const member = userProfile?.familyMembers.find(m => m.name === bookingFor);
          if (member) {
              pName = member.name;
              pAge = member.age;
              pGender = member.gender;
          }
      }

      // Late Arrival Logic
      const clinic = clinics.find(c => c.id === selectedClinicId);
      const waitInfo = clinic ? getClinicWaitInfo(clinic) : { time: 0 };
      const travelMins = parseInt(travelTime) || 0;

      if (visitType === 'WALK_IN' && travelMins > waitInfo.time + 10) {
          const proceed = window.confirm(
              `⚠️ Late Arrival Warning\n\nCurrent wait time is ${waitInfo.time} mins, but you will take ${travelMins} mins to reach.\n\nYou might be skipped or placed ON HOLD.\n\nDo you want to proceed anyway?`
          );
          if (!proceed) return;
      }

      onGetToken(
          pName, 
          userPhone, // Always primary user phone for notifications
          selectedDoctorId, 
          selectedClinicId, 
          visitType === 'APPOINTMENT' ? apptTime : undefined,
          visitType === 'APPOINTMENT' ? apptDate : undefined,
          pAge, pGender,
          symptoms
      );
      
      setActiveTab('ACTIVE');
      setBookingView('LIST');
      setSelectedDoctorId(null);
      setSymptoms('');
      setVisitType('WALK_IN');
      setApptDate('');
      setApptTime('');
      setBookingFor('MYSELF');
  };

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);
  const selectedDoctor = selectedClinic?.doctors.find(d => d.id === selectedDoctorId);

  // LOGIC: Check if doctor is currently available for Walk-ins
  const isWalkInAllowed = useMemo(() => {
      if (!selectedDoctor) return false;
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[now.getDay()];
      
      const schedule = selectedDoctor.weeklySchedule.find(s => s.day === today);
      if (!schedule || schedule.isOff) return false;

      // Parse times
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      return currentMins >= startMins && currentMins < endMins;
  }, [selectedDoctor]);

  // If walk-in is not allowed, default to Appointment
  useEffect(() => {
      if (selectedDoctorId && !isWalkInAllowed && visitType === 'WALK_IN') {
          setVisitType('APPOINTMENT');
      }
  }, [selectedDoctorId, isWalkInAllowed]);

  const confirmCancel = () => {
      if (cancelModal.visit) {
          onCancelVisit(cancelModal.visit.clinicId, cancelModal.visit.id);
          addToast("Appointment Cancelled", "info");
          setCancelModal({ isOpen: false, visit: null });
      }
  };

  // --- DATE & TIME SLOT GENERATION ---
  const bookingDates = useMemo(() => {
      if (!selectedDoctor) return [];
      const days = [];
      const today = new Date();
      
      for(let i=0; i<14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName);
          
          days.push({
              date: d,
              dateStr: d.toISOString().split('T')[0], // YYYY-MM-DD
              dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
              dayNum: d.getDate(),
              isOff: !schedule || schedule.isOff,
              schedule
          });
      }
      return days;
  }, [selectedDoctor]);

  const availableTimeSlots = useMemo(() => {
      if (!selectedDoctor || !apptDate) return [];
      
      const selectedDayObj = bookingDates.find(d => d.dateStr === apptDate);
      if (!selectedDayObj || selectedDayObj.isOff || !selectedDayObj.schedule) return [];

      const { startTime, endTime } = selectedDayObj.schedule;
      const slots = [];
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      let currentMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      // If today, filter past slots
      const now = new Date();
      const isToday = apptDate === now.toISOString().split('T')[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();

      // STRICT SLOT GENERATION: Only generate if slot + 15 min duration is within limits
      while (currentMins + 15 <= endMins) {
          if (!isToday || currentMins > nowMins) {
              const h = Math.floor(currentMins / 60);
              const m = currentMins % 60;
              const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              
              // Display format 12h
              const suffix = h >= 12 ? 'PM' : 'AM';
              const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
              const displayStr = `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;

              slots.push({ value: timeStr, label: displayStr });
          }
          currentMins += 15; // 15 min intervals
      }
      return slots;
  }, [selectedDoctor, apptDate, bookingDates]);

  // Helper to display doctor's schedule for today in the list
  const getDoctorTodaySchedule = (doc: any) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const schedule = doc.weeklySchedule.find((s: any) => s.day === today);
      if (!schedule || schedule.isOff) return <span className="text-red-500 font-bold text-[10px]">OFF Today</span>;
      return <span className="text-green-700 font-bold text-[10px]">{schedule.startTime} - {schedule.endTime}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                 <Button variant="ghost" size="sm" onClick={onBack} className="p-0 mr-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
                 <div>
                     <h1 className="font-bold text-slate-900 leading-none">Find Care</h1>
                     <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <div className="relative">
                            <select 
                                className="bg-transparent border-none p-0 pr-4 text-slate-700 font-bold focus:ring-0 cursor-pointer appearance-none outline-none"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                     </div>
                 </div>
             </div>
             <div className="flex gap-2">
                 <button 
                    onClick={() => setShowQRScanner(true)}
                    className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                 >
                     <QrCode className="h-5 w-5" /> <span className="text-xs font-bold hidden sm:inline">Scan</span>
                 </button>
             </div>
        </header>

        {/* QR Scanner Overlay */}
        {showQRScanner && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in">
                <div className="w-64 h-64 border-2 border-primary-500 rounded-2xl relative mb-8 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-primary-500/20 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_20px_rgba(14,165,233,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <p className="text-white font-bold z-10">Scanning...</p>
                </div>
                <p className="text-slate-400 text-center mb-8">Point at clinic QR code.</p>
                <Button variant="secondary" onClick={() => setShowQRScanner(false)}>Cancel</Button>
            </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModal.isOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                    <div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Appointment?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to cancel your visit with <span className="font-bold text-slate-900">{cancelModal.visit?.doctorName}</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setCancelModal({ isOpen: false, visit: null })}>No, Keep It</Button>
                        <Button className="bg-red-600 hover:bg-red-700 border-red-600" onClick={confirmCancel}>Yes, Cancel</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
            
            {/* Nav Tabs */}
            <div className="p-4 pb-0">
                <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
                    <button 
                        onClick={() => setActiveTab('ACTIVE')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'ACTIVE' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Active ({activeVisits.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('BOOK')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'BOOK' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Find Care
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        History
                    </button>
                    <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'PROFILE' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Profile
                    </button>
                </div>
            </div>

            {activeTab === 'PROFILE' && userProfile && (
                <div className="px-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{userProfile.name}</h2>
                                <p className="text-slate-500">{userProfile.phone}</p>
                                <div className="flex gap-2 mt-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded">{userProfile.age || '--'} Yrs</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">{userProfile.gender || '--'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Family Members</h3>
                                <button onClick={() => setShowAddMember(true)} className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline">
                                    <Plus className="h-4 w-4" /> Add New
                                </button>
                            </div>

                            <div className="space-y-3">
                                {userProfile.familyMembers?.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.relation} • {member.age} Yrs</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!userProfile.familyMembers || userProfile.familyMembers.length === 0) && (
                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                        No family members added.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showAddMember && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                                <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
                                <div className="space-y-4">
                                    <Input 
                                        label="Name" 
                                        value={newMember.name} 
                                        onChange={e => setNewMember({...newMember, name: e.target.value})} 
                                        placeholder="e.g. Priya"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input 
                                            label="Age" 
                                            type="number"
                                            value={newMember.age} 
                                            onChange={e => setNewMember({...newMember, age: e.target.value})} 
                                            placeholder="25"
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                            <select 
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                value={newMember.gender}
                                                onChange={e => setNewMember({...newMember, gender: e.target.value})}
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Input 
                                        label="Relationship" 
                                        value={newMember.relation} 
                                        onChange={e => setNewMember({...newMember, relation: e.target.value})} 
                                        placeholder="e.g. Mother, Son"
                                    />
                                    <div className="flex gap-3 justify-end pt-2">
                                        <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
                                        <Button onClick={handleAddMember}>Save</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'ACTIVE' && (
                <div className="px-4 space-y-4">
                    {activeVisits.length > 0 ? activeVisits.map(visit => (
                        <Card key={visit.id} className="p-5 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                    <p className="text-sm text-slate-500">Dr. {visit.doctorName}</p>
                                </div>
                                <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Token</div>
                                    <div className="text-2xl font-black text-slate-800 leading-none">#{visit.tokenNumber}</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mb-4 flex-wrap">
                                <Badge status={visit.status} />
                                {visit.isEmergency && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Emergency</span>}
                                {visit.visitType === 'APPOINTMENT' && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">Appt: {visit.appointmentTime}</span>}
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <User className="h-3 w-3" /> {visit.name}
                                </span>
                            </div>

                            {visit.status === PatientStatus.WAITING && (
                                <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`font-bold ${visit.isCheckedIn ? 'text-green-600' : 'text-orange-600'}`}>
                                            {visit.isCheckedIn ? 'Checked In' : 'On the way'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Est. Wait</span>
                                        <span className="font-bold text-slate-900 flex items-center gap-1">
                                            <Timer className="h-3 w-3" /> ~15 mins
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (
                                    <Button 
                                        className="flex-1 bg-slate-900 hover:bg-slate-800" 
                                        onClick={() => setShowQRScanner(true)}
                                    >
                                        <QrCode className="h-4 w-4 mr-2" /> Scan to Check-In
                                    </Button>
                                )}
                                <Button 
                                    variant="secondary" 
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setCancelModal({ isOpen: true, visit })}
                                    disabled={visit.status === PatientStatus.WITH_DOCTOR}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    )) : (
                        <div className="text-center py-12 opacity-50 flex flex-col items-center">
                            <div className="bg-slate-100 p-6 rounded-full inline-block mb-4">
                                <Calendar className="h-10 w-10 text-slate-400" />
                            </div>
                            <p className="font-medium text-slate-600">No active visits.</p>
                            <p className="text-sm text-slate-400 mb-4">Book a consultation to see status.</p>
                            <Button variant="outline" onClick={() => setActiveTab('BOOK')}>Find Care</Button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="px-4 space-y-4">
                    {historyVisits.length > 0 ? historyVisits.map(visit => (
                        <Card key={visit.id} className={`p-5 shadow-sm border ${visit.status === PatientStatus.CANCELLED ? 'border-red-100 bg-red-50/30' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">{new Date(visit.timeAdded).toLocaleDateString()} at {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                    <p className="text-sm text-slate-500">Dr. {visit.doctorName}</p>
                                </div>
                                <Badge status={visit.status} />
                            </div>
                            <div className="text-xs text-slate-600 mb-2 font-bold flex items-center gap-1">
                                <User className="h-3 w-3" /> {visit.name}
                            </div>
                            
                            {/* Medical Details */}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                {visit.symptoms && (
                                    <div className="mb-2 text-sm text-slate-600">
                                        <span className="font-semibold">Reason:</span> {visit.symptoms}
                                    </div>
                                )}
                                
                                {visit.status === PatientStatus.COMPLETED && visit.notes && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 italic">
                                        <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Doctor's Note</span>
                                        "{visit.notes}"
                                    </div>
                                )}

                                {visit.status === PatientStatus.CANCELLED && (
                                    <div className="bg-white p-3 rounded-lg border border-red-100 text-sm text-red-600 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5" />
                                        <span>Appointment cancelled. Please re-book if symptoms persist.</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )) : (
                        <div className="text-center py-12 opacity-50">
                            <History className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                            <p>No history found.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'BOOK' && (
                <div className="h-full">
                    {bookingView === 'LIST' && (
                        <div className="space-y-6">
                            
                            {/* SEARCH HERO */}
                            <div className="px-4">
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white mb-6">
                                    <h2 className="text-xl font-bold mb-1">Find the right care</h2>
                                    <p className="text-slate-300 text-sm mb-4">Search doctors, clinics, or symptoms</p>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                            placeholder="e.g. Fever, Dentist, Apollo..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* CATEGORIES */}
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-2">
                                    {CATEGORIES.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl transition-all ${selectedCategory === cat.id ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <div className={`p-2 rounded-full ${selectedCategory === cat.id ? 'bg-primary-100' : 'bg-slate-100'}`}>
                                                <cat.icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* FILTERS */}
                                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                                    {['NEAR', 'WAIT', 'FEE'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => setSortBy(s as any)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${sortBy === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >
                                            {s === 'NEAR' ? 'Nearest' : s === 'WAIT' ? 'Fastest Queue' : 'Low Fees'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* RESULTS */}
                            <div className="px-4 pb-20 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900">Nearby Clinics</h3>
                                    <span className="text-xs text-slate-500">{filteredClinics.length} results</span>
                                </div>

                               {filteredClinics.map(clinic => {
                                    const waitInfo = getClinicWaitInfo(clinic);
                                    const feeRange = getFeeRange(clinic);
                                    const rating = (clinic.doctors.reduce((acc, d) => acc + d.rating, 0) / (clinic.doctors.length || 1)).toFixed(1);
                                    const reviewCount = clinic.doctors.reduce((acc, d) => acc + d.reviewCount, 0);
                                    const specialties = getClinicSpecialties(clinic);
                                    const amenities = clinic.amenities || ['Sanitized', 'Professional Staff'];

                                    return (
                                        <div 
                                            key={clinic.id} 
                                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                                            onClick={() => { setSelectedClinicId(clinic.id); setBookingView('CLINIC_DETAILS'); }}
                                        >
                                            <div className="flex flex-col sm:flex-row">
                                                {/* Image / Visual Section */}
                                                <div className="w-full h-40 sm:w-32 sm:h-auto bg-slate-100 relative flex-shrink-0">
                                                    {/* Placeholder gradient mimicking a photo */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200 flex items-center justify-center">
                                                        <Building2 className="h-10 w-10 text-slate-300" />
                                                    </div>
                                                    <div className="absolute top-2 right-2 sm:hidden">
                                                         <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm ${waitInfo.color}`}>
                                                            <Clock className="h-3 w-3 mr-1" /> {waitInfo.time}m
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content Section */}
                                                <div className="p-4 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors flex items-center gap-1">
                                                                {clinic.name}
                                                                <ShieldCheck className="h-4 w-4 text-primary-500 fill-current" />
                                                            </h3>
                                                            <p className="text-xs text-slate-500 mt-1">{clinic.address}</p>
                                                        </div>
                                                        <div className="hidden sm:block text-right">
                                                             <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm justify-end mb-1 ${waitInfo.color}`}>
                                                                <Clock className="h-3 w-3 mr-1" /> {waitInfo.time}m Wait
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-medium">Live Status</div>
                                                        </div>
                                                    </div>

                                                    {/* Stats Row */}
                                                    <div className="flex items-center gap-4 mt-3 text-xs border-b border-slate-100 pb-3 mb-3">
                                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded font-bold">
                                                            <span className="bg-green-600 text-white p-0.5 rounded-sm"><Star className="h-2.5 w-2.5 fill-current" /></span>
                                                            {rating}
                                                        </div>
                                                        <span className="text-slate-500 underline decoration-dotted">{reviewCount} Patient Stories</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="text-slate-700 font-medium">{clinic.city}</span>
                                                    </div>

                                                    {/* Details Row */}
                                                    <div className="flex flex-wrap gap-y-2 justify-between items-end">
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="font-bold text-slate-700">Specialties:</span>
                                                                <span className="truncate max-w-[200px]">{specialties.join(', ')}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="font-bold text-slate-700">Fee:</span>
                                                                <span>{feeRange}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-green-600 font-medium">Available Today</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <Button size="sm" className="h-9 px-6 shadow-md shadow-primary-100 w-full sm:w-auto mt-2 sm:mt-0">
                                                            Book Appointment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Footer Tags with Real Amenities - UPDATED STYLE */}
                                            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-100">
                                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                                    {amenities.slice(0, 3).map(am => (
                                                        <span key={am} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-medium text-slate-600 shadow-sm whitespace-nowrap flex-shrink-0">
                                                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" /> {am}
                                                        </span>
                                                    ))}
                                                    {amenities.length > 3 && (
                                                        <span className="text-[10px] text-slate-400 font-medium bg-white border border-slate-200 px-1.5 py-1 rounded flex-shrink-0">+{amenities.length - 3}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider hidden sm:inline-block">Sponsored</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                          
                                {filteredClinics.length === 0 && (
                                    <div className="text-center py-12 opacity-50">
                                        <Filter className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                        <p>No clinics found matching criteria.</p>
                                        <button onClick={() => {setSearchQuery(''); setSelectedCategory('ALL'); setSelectedCity('All Cities');}} className="text-primary-600 text-sm mt-2 font-bold">Clear Filters</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {bookingView === 'CLINIC_DETAILS' && selectedClinic && (
                        <div className="animate-in slide-in-from-right duration-300 bg-white min-h-full">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                                <Button variant="ghost" size="sm" onClick={() => { setBookingView('LIST'); setSelectedClinicId(null); }} className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="font-bold text-slate-900 truncate">{selectedClinic.name}</h2>
                            </div>
                            
                            <div className="p-4 pb-24">
                                <div className="mb-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                            <Star className="h-4 w-4 fill-current" /> 4.5 (120+ Reviews)
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Open Now</span>
                                    </div>
                                    <p className="text-slate-500 text-sm flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /> 
                                        {selectedClinic.address}
                                    </p>
                                    <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedClinic.operatingHours || '09:00 - 21:00'}</span>
                                        <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> 1.2 km away</span>
                                    </div>
                                </div>

                                {/* ABOUT SECTION */}
                                {selectedClinic.about && (
                                    <div className="mb-6">
                                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-primary-600" /> About Clinic
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                                            {selectedClinic.about}
                                        </p>
                                    </div>
                                )}

                                {/* FACILITIES / AMENITIES */}
                                {selectedClinic.amenities && selectedClinic.amenities.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="font-bold text-slate-900 mb-3">Facilities</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClinic.amenities.map(item => (
                                                <span key={item} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" /> {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <h3 className="font-bold text-slate-900 mb-4 text-lg">Doctors</h3>
                                <div className="space-y-4">
                                    {selectedClinic.doctors.map(doc => (
                                        <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex gap-4 mb-4">
                                                <div className="relative flex-shrink-0">
                                                    <img src={doc.avatarUrl} className="h-16 w-16 rounded-full object-cover bg-slate-100 border border-slate-100" />
                                                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${doc.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-900 text-lg truncate">{doc.name}</h4>
                                                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-xs font-bold text-green-700 border border-green-100">
                                                            <Star className="h-3 w-3 fill-current" /> {doc.rating || '4.5'}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-primary-600 mb-1">{doc.specialty}</p>
                                                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> MBBS, MD</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 12 Yrs Exp</span>
                                                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Eng, Hindi</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Next Available</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 font-bold text-sm">Today, 10:00 AM</span>
                                                        <span className="text-xs text-slate-300">|</span>
                                                        <span className="text-slate-900 font-bold text-sm">₹{doc.consultationFee}</span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={() => { setSelectedDoctorId(doc.id); setBookingView('FORM'); }}
                                                    disabled={!doc.isAvailable}
                                                    className="shadow-md"
                                                >
                                                    Book Visit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {bookingView === 'FORM' && selectedClinic && selectedDoctorId && (
                        <div className="animate-in slide-in-from-right duration-300 bg-slate-50 min-h-full flex flex-col">
                             <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
                                <Button variant="ghost" size="sm" className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50" onClick={() => setBookingView('CLINIC_DETAILS')}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="font-bold text-slate-900">Confirm Booking</h2>
                            </div>

                            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                                
                                {/* PATIENT SELECTOR */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Who is this for?</label>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        <button 
                                            onClick={() => setBookingFor('MYSELF')}
                                            className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === 'MYSELF' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500'}`}
                                        >
                                            <User className={`h-6 w-6 ${bookingFor === 'MYSELF' ? 'text-primary-600' : 'text-slate-400'}`} />
                                            <span className="text-xs font-bold">Myself</span>
                                        </button>
                                        
                                        {userProfile?.familyMembers?.map((m, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setBookingFor(m.name)}
                                                className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === m.name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500'}`}
                                            >
                                                <Users className={`h-6 w-6 ${bookingFor === m.name ? 'text-primary-600' : 'text-slate-400'}`} />
                                                <span className="text-xs font-bold truncate max-w-[60px]">{m.name}</span>
                                            </button>
                                        ))}

                                        <button 
                                            onClick={() => setActiveTab('PROFILE')}
                                            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[80px] p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-primary-600 hover:border-primary-400 hover:bg-slate-50 transition-colors"
                                        >
                                            <Plus className="h-6 w-6" />
                                            <span className="text-xs font-bold">Add New</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Visit Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                                !isWalkInAllowed 
                                                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                                    : visitType === 'WALK_IN' 
                                                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                                                        : 'bg-white border-slate-100 text-slate-500'
                                            }`}
                                            onClick={() => isWalkInAllowed && setVisitType('WALK_IN')}
                                            disabled={!isWalkInAllowed}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>Wait in Queue</span>
                                                {!isWalkInAllowed && <Lock className="h-3 w-3" />}
                                            </div>
                                            <span className="block text-[10px] font-normal mt-1 opacity-70">
                                                {isWalkInAllowed ? 'Immediate Token' : 'Not Available Now'}
                                            </span>
                                        </button>
                                        <button 
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${visitType === 'APPOINTMENT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-100 text-slate-500'}`}
                                            onClick={() => setVisitType('APPOINTMENT')}
                                        >
                                            Book Slot
                                            <span className="block text-[10px] font-normal mt-1 opacity-70">Specific Time</span>
                                        </button>
                                    </div>
                                    {!isWalkInAllowed && (
                                        <div className="mt-3 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                                            <Info className="h-4 w-4 flex-shrink-0" />
                                            <span>Doctor is not available for walk-ins right now. Please book an appointment slot.</span>
                                        </div>
                                    )}
                                </div>

                                {visitType === 'APPOINTMENT' && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                                        {/* Date Scroller */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-bold text-slate-700 mb-3">Select Date</label>
                                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                                {bookingDates.map((d, idx) => (
                                                    <button
                                                        key={idx}
                                                        disabled={d.isOff}
                                                        onClick={() => { setApptDate(d.dateStr); setApptTime(''); }}
                                                        className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                                                            d.dateStr === apptDate 
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700' 
                                                                : d.isOff 
                                                                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase mb-1">{d.dayShort}</span>
                                                        <span className="text-xl font-bold">{d.dayNum}</span>
                                                        {d.isOff && <span className="text-[8px] font-bold mt-1 text-red-300">OFF</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Time Slot Grid */}
                                        <div>
                                            <div className="flex justify-between items-end mb-3">
                                                <label className="block text-sm font-bold text-slate-700">
                                                    Select Time {apptDate ? '' : '(Pick a date first)'}
                                                </label>
                                                {apptDate && (
                                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                                        Shift: {bookingDates.find(d => d.dateStr === apptDate)?.schedule?.startTime} - {bookingDates.find(d => d.dateStr === apptDate)?.schedule?.endTime}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {availableTimeSlots.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {availableTimeSlots.map(slot => (
                                                        <button
                                                            key={slot.value}
                                                            onClick={() => setApptTime(slot.value)}
                                                            className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                                                                apptTime === slot.value
                                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                                                            }`}
                                                        >
                                                            {slot.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    <p className="text-slate-400 text-sm">
                                                        {apptDate ? "No available slots for this date." : "Select a date to view slots."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {visitType === 'WALK_IN' && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Time to reach clinic?</label>
                                        <select 
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                            value={travelTime}
                                            onChange={(e) => setTravelTime(e.target.value)}
                                        >
                                            <option value="5">5 mins</option>
                                            <option value="15">15 mins</option>
                                            <option value="30">30 mins</option>
                                            <option value="45">45 mins</option>
                                            <option value="60">1 Hour+</option>
                                        </select>
                                    </div>
                                )}

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <Input 
                                        label="Reason for Visit (Symptoms)" 
                                        placeholder="e.g. High fever, stomach ache"
                                        value={symptoms}
                                        onChange={e => setSymptoms(e.target.value)}
                                    />
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500">Patient</span>
                                        <span className="font-bold text-slate-900">{bookingFor === 'MYSELF' ? userProfile?.name : bookingFor}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500">Doctor</span>
                                        <span className="font-bold text-slate-900">{selectedClinic.doctors.find(d => d.id === selectedDoctorId)?.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                                        <span className="text-slate-600 font-medium">Consultation Fee</span>
                                        <span className="font-bold text-primary-700">₹{selectedClinic.doctors.find(d => d.id === selectedDoctorId)?.consultationFee}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white border-t border-slate-200">
                                <Button className="w-full h-12 text-lg shadow-xl shadow-primary-100" onClick={handleBookToken}>
                                    Confirm & Generate Token
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};