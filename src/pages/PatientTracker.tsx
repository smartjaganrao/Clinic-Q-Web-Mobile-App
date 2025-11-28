import React, { useState, useEffect, useMemo } from 'react';
import { Clinic, Patient, PatientStatus, ClinicType, DoctorStatus } from '../../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { 
    ArrowLeft, MapPin, Search, Calendar, QrCode, ChevronRight, 
    AlertTriangle, Star, Clock, Filter, Stethoscope, Smile, 
    Baby, Heart, Activity, Sparkles, LayoutGrid, Eye, Ear, 
    ArrowUpRight, Navigation, Timer, ChevronDown, Building2, 
    ShieldCheck, ThumbsUp, CheckCircle2, Info, Lock, History, X, AlertCircle, Sun, Moon,
    GraduationCap, Globe, BadgeCheck, User, Users, Plus, FileHeart, LogOut, Layout, Edit2, Trash2, Coffee, Hourglass
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
  const [selectedInsurance, setSelectedInsurance] = useState<string>('ALL');

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);

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
          let updatedMembers = [...(userProfile.familyMembers || [])];
          
          if (editingMemberIndex !== null) {
              // Edit existing
              updatedMembers[editingMemberIndex] = newMember;
              addToast("Family member updated!", "success");
          } else {
              // Add new
              updatedMembers.push(newMember);
              addToast("Family member added!", "success");
          }

          const updatedProfile = {
              ...userProfile,
              familyMembers: updatedMembers
          };
          setUserProfile(updatedProfile);
          localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile));
          
          // Auto-select the new/edited member if in booking flow
          if (activeTab === 'BOOK' && bookingView === 'FORM') {
              setBookingFor(newMember.name);
          }

          setNewMember({ name: '', age: '', gender: 'Male', relation: '' });
          setEditingMemberIndex(null);
          setShowAddMember(false);
      }
  };

  const handleEditMember = (index: number) => {
      if (userProfile && userProfile.familyMembers[index]) {
          setNewMember(userProfile.familyMembers[index]);
          setEditingMemberIndex(index);
          setShowAddMember(true);
      }
  };

  const handleDeleteMember = (index: number) => {
      if (userProfile && window.confirm("Remove this family member?")) {
           const updatedMembers = userProfile.familyMembers.filter((_, i) => i !== index);
           const updatedProfile = { ...userProfile, familyMembers: updatedMembers };
           setUserProfile(updatedProfile);
           localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile));
           addToast("Family member removed.", "info");
      }
  };

  // Extract available cities
  const availableCities = useMemo(() => {
      const cities = Array.from(new Set(clinics.map(c => c.city)));
      return ['All Cities', ...cities];
  }, [clinics]);

  // Extract available insurances
  const availableInsurances = useMemo(() => {
      const insuranceSet = new Set<string>();
      clinics.forEach(c => {
          c.acceptedInsurances?.forEach(ins => insuranceSet.add(ins));
      });
      return ['ALL', ...Array.from(insuranceSet).sort()];
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

  // --- SMART SEARCH LOGIC --- (No changes here)
  const filteredClinics = useMemo(() => {
      let filtered = clinics;

      // 0. City Filter
      if (selectedCity !== 'All Cities') {
          filtered = filtered.filter(c => c.city === selectedCity);
      }

      // 1. Insurance Filter
      if (selectedInsurance !== 'ALL') {
          filtered = filtered.filter(c => c.acceptedInsurances?.includes(selectedInsurance));
      }

      // 2. Search Query (Name, City, Doctor Name, or Symptom)
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchedTypes: string[] = [];
          Object.keys(SYMPTOM_MAP).forEach(key => {
              if (q.includes(key)) matchedTypes.push(...SYMPTOM_MAP[key]);
          });

          filtered = filtered.filter(c => 
              c.name.toLowerCase().includes(q) || 
              c.city.toLowerCase().includes(q) ||
              c.doctors.some(d => d.specialty.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)) ||
              (matchedTypes.length > 0 && c.type && matchedTypes.includes(c.type))
          );
      }

      // 3. Category Filter
      if (selectedCategory !== 'ALL') {
          filtered = filtered.filter(c => {
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

      // 4. Sorting
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
          return 0; 
      });
  }, [clinics, searchQuery, selectedCategory, sortBy, selectedCity, selectedInsurance]);

  // Helper: Get Wait Info
  const getClinicWaitInfo = (clinic: Clinic) => {
      const waitingCount = clinic.patients.filter(p => p.status === PatientStatus.WAITING).length;
      const waitTime = waitingCount * 15; 
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

  // Smart Queue Details Calculator
  const getSmartQueueDetails = (visit: any) => {
      const clinic = clinics.find(c => c.id === visit.clinicId);
      const doctor = clinic?.doctors.find(d => d.id === visit.doctorId);
      
      if (!clinic || !doctor) return { peopleAhead: 0, waitTime: 0, currentToken: '-', message: 'Loading...', color: 'text-slate-500' };

      // Calculate People Ahead
      const peopleAhead = clinic.patients.filter(p => 
          p.doctorId === visit.doctorId && 
          p.status === PatientStatus.WAITING && 
          p.timeAdded < visit.timeAdded // Simplified logic: who came before me
      ).length;

      // Current Serving Token
      const servingPatient = clinic.patients.find(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WITH_DOCTOR);
      const currentToken = servingPatient ? `#${servingPatient.tokenNumber}` : 'Not Started';

      // Calculate Wait Time
      let baseWait = peopleAhead * 15; // 15 min per person
      if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes;
      
      // Time formatting
      const now = new Date();
      now.setMinutes(now.getMinutes() + baseWait);
      const expectedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Status Message Logic
      let message = `~${baseWait} mins wait`;
      let color = 'text-slate-600';
      let bgColor = 'bg-slate-100';

      if (doctor.status === DoctorStatus.ON_BREAK) {
          message = "Doctor is on break";
          color = "text-orange-700";
          bgColor = "bg-orange-100";
      } else if (doctor.delayMinutes > 0) {
          message = `Delayed by ${doctor.delayMinutes} mins`;
          color = "text-red-700";
          bgColor = "bg-red-100";
      } else if (visit.isCheckedIn) {
          if (peopleAhead === 0) {
              message = "You are next! Get ready.";
              color = "text-green-700";
              bgColor = "bg-green-100";
          } else if (peopleAhead < 3) {
              message = "Almost your turn. Stay close.";
              color = "text-blue-700";
              bgColor = "bg-blue-100";
          } else {
              message = "Checked in. Relax in lobby.";
              color = "text-green-700";
              bgColor = "bg-green-50";
          }
      } else {
          // Not checked in
          if (peopleAhead < 3) {
              message = "Rush! Reaching your turn.";
              color = "text-red-700";
              bgColor = "bg-red-100";
          } else {
              message = "Start travelling to clinic.";
              color = "text-blue-700";
              bgColor = "bg-blue-100";
          }
      }

      return { 
          peopleAhead, 
          waitTime: baseWait, 
          expectedTime, 
          currentToken, 
          message, 
          color,
          bgColor,
          doctorStatus: doctor.status
      };
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
          userPhone, 
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
      
      const schedule = selectedDoctor.weeklySchedule.find(s => s.day === today as any);
      if (!schedule || schedule.isOff || !schedule.slots || schedule.slots.length === 0) return false;

      const currentMins = now.getHours() * 60 + now.getMinutes();

      // Check if any slot contains the current time (handles overnight slots)
      const isInsideSlot = (slotStart: string, slotEnd: string) => {
          const [sh, sm] = slotStart.split(':').map(Number);
          const [eh, em] = slotEnd.split(':').map(Number);
          let start = sh * 60 + sm;
          let end = eh * 60 + em;
          if (end <= start) end += 24 * 60; // overnight

          // If currentMins might be in the wrapped part, also consider +24h
          const cur = currentMins;
          const curAlt = currentMins + 24 * 60;

          return (cur >= start && cur < end) || (curAlt >= start && curAlt < end);
      };

      return schedule.slots.some((slot: any) => slot.active !== false && isInsideSlot(slot.startTime, slot.endTime));
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

  // --- DATE & TIME SLOT GENERATION --- (No changes)
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
      if (!selectedDayObj || selectedDayObj.isOff || !selectedDayObj.schedule || !selectedDayObj.schedule.slots) return [];

      const slots: { value: string; label: string }[] = [];

      const now = new Date();
      const isToday = apptDate === now.toISOString().split('T')[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();

      const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

      // Build ranges that belong to the selected date only.
      // For each slot in the day's schedule:
      //  - if not overnight (start <= end) -> include [start,end)
      //  - if overnight (start > end) -> include [start,24:00) for this date
      // Additionally include tail parts from previous day's overnight slots (00:00 -> end)

      const ranges: {start:string,end:string}[] = [];

      // ranges from today's schedule
      const addTodayRange = (start: string, end: string) => {
          const s = timeToMins(start);
          const e = timeToMins(end);
          if (e <= s) {
              // overnight -> for the schedule's date we include start..24:00
              ranges.push({ start, end: '24:00' });
          } else {
              ranges.push({ start, end });
          }
      };

      selectedDayObj.schedule.slots.forEach((slot: any) => {
          if (slot.active === false) return;
          addTodayRange(slot.startTime, slot.endTime);
      });

      // also consider previous day's overnight slots that spill into this date
      const prevIndex = bookingDates.findIndex(d => d.dateStr === apptDate) - 1;
      if (prevIndex >= 0) {
          const prevSched = bookingDates[prevIndex].schedule;
          if (prevSched && prevSched.slots) {
              prevSched.slots.forEach((slot: any) => {
                  const s = timeToMins(slot.startTime);
                  const e = timeToMins(slot.endTime);
                  if (slot.active === false) return;
                  if (e <= s) {
                      // Overnight slot from previous day contributes 00:00..end to this date
                      ranges.push({ start: '00:00', end: slot.endTime });
                  }
              });
          }
      }

      const genForRange = (start: string, end: string) => {
          let startM = timeToMins(start === '24:00' ? '00:00' : start);
          let endM = timeToMins(end === '24:00' ? '00:00' : end);
          // Special-case '24:00' meaning end of the day -> treat as 1440
          if (end === '24:00') endM = 24 * 60;
          // If end is earlier than start (shouldn't happen here) adjust
          if (endM <= startM) endM += 24 * 60;

          let cur = startM;
          while (cur + 15 <= endM) {
              // For today's date skip times already passed
              if (!isToday || cur > nowMins) {
                  const minutesOfDay = cur % (24*60);
                  const h = Math.floor(minutesOfDay / 60);
                  const m = minutesOfDay % 60;
                  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

                  const suffix = h >= 12 ? 'PM' : 'AM';
                  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
                  const displayStr = `${displayH}:${m.toString().padStart(2,'0')} ${suffix}`;
                  slots.push({ value: timeStr, label: displayStr });
              }
              cur += 15;
          }
      };

      // iterate each range (today's + previous overnight fragments)
      ranges.forEach(r => genForRange(r.start, r.end));

      // remove duplicates and sort
      const uniq = new Map<string, string>();
      slots.forEach(s => uniq.set(s.value, s.label));
      return Array.from(uniq.entries()).map(([value,label]) => ({ value, label }));
  }, [selectedDoctor, apptDate, bookingDates]);

  const getDoctorTodaySchedule = (doc: any) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const schedule = doc.weeklySchedule.find((s: any) => s.day === today);
    if (!schedule || schedule.isOff || !schedule.slots || schedule.slots.length === 0) return <span className="text-red-500 font-bold text-[10px]">OFF Today</span>;
    const ranges = schedule.slots.map((sl: any) => `${sl.startTime} - ${sl.endTime}`);
    return <span className="text-green-700 font-bold text-[10px]">{ranges.join(', ')}</span>;
  };

  // Returns next availability object for a doctor within next `maxDays` days.
  const getNextAvailability = (doc: any, maxDays = 14) => {
      if (!doc || !doc.weeklySchedule) return null;
      const now = new Date();

      // Helper to build Date from day (Date) and time string 'HH:MM'
      const buildDateTime = (dateObj: Date, timeStr: string) => {
          const [hh, mm] = timeStr.split(':').map(Number);
          const dt = new Date(dateObj);
          dt.setHours(hh, mm, 0, 0);
          return dt;
      };

      let nextCandidate: { start: Date; end: Date; status: 'now' | 'upcoming' } | null = null;

      for (let i = 0; i < maxDays; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() + i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          const schedule = doc.weeklySchedule.find((s: any) => s.day === dayName);
          if (!schedule || schedule.isOff || !schedule.slots) continue;

          for (const sl of schedule.slots) {
              if (!sl.active) continue;

              const startDt = buildDateTime(d, sl.startTime);
              let endDt = buildDateTime(d, sl.endTime);
              // overnight: end <= start -> end next day
              if (endDt <= startDt) {
                  endDt = new Date(endDt);
                  endDt.setDate(endDt.getDate() + 1);
              }

              if (now >= startDt && now < endDt) {
                  // available now
                  return { start: startDt, end: endDt, status: 'now' as const };
              }

              if (startDt > now) {
                  if (!nextCandidate || startDt < nextCandidate.start) {
                      nextCandidate = { start: startDt, end: endDt, status: 'upcoming' };
                  }
              }
          }
      }

      return nextCandidate;
  };

  // Navigation Items for Sidebar
  const navItems = [
      { id: 'ACTIVE', label: 'Active Visits', icon: Ticket },
      { id: 'BOOK', label: 'Find Care', icon: Search },
      { id: 'HISTORY', label: 'History', icon: History },
      { id: 'PROFILE', label: 'Profile', icon: User }
  ];

  function Ticket({ className }: { className?: string }) {
      return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
          </svg>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row overflow-hidden font-sans">
        
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    <span className="font-bold text-xl text-slate-900 tracking-tight">Smart<span className="text-primary-600">QFlow</span></span>
                </div>
            </div>
            
            <div className="flex-1 py-6 px-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            activeTab === item.id 
                            ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                        <p className="text-xs text-slate-500 truncate">{userPhone}</p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" /> Logout
                </button>
            </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 w-full">
            
            {/* MOBILE HEADER */}
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    {bookingView !== 'LIST' && activeTab === 'BOOK' ? (
                        <Button variant="ghost" size="sm" onClick={() => { setBookingView('LIST'); setSelectedClinicId(null); }} className="p-0 mr-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                         <Logo className="h-8 w-8" />
                    )}
                    <div>
                        <h1 className="font-bold text-slate-900 leading-none text-lg">
                            {activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Booking' : navItems.find(n => n.id === activeTab)?.label}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowQRScanner(true)}
                        className="bg-slate-900 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                    >
                        <QrCode className="h-5 w-5" /> 
                    </button>
                </div>
            </header>

            {/* DESKTOP HEADER */}
            <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shrink-0 z-10">
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">
                         {activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Appointment Details' : 
                          activeTab === 'ACTIVE' ? 'Your Active Visits' : 
                          activeTab === 'HISTORY' ? 'Visit History' :
                          activeTab === 'PROFILE' ? 'My Profile' : 'Find Care'}
                     </h2>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <Button 
                        variant="outline" 
                        onClick={() => setShowQRScanner(true)}
                        className="hidden md:flex"
                     >
                         <QrCode className="h-4 w-4 mr-2" /> Scan QR Code
                     </Button>
                 </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-24 md:pb-8 p-0 md:p-8">
                
                {/* 1. ACTIVE TAB */}
                {activeTab === 'ACTIVE' && (
                    <div className="px-4 md:px-0 max-w-7xl mx-auto">
                        {activeVisits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 md:pt-0">
                                {activeVisits.map(visit => {
                                    // Calculate Smart Status
                                    const queueStats = getSmartQueueDetails(visit);
                                    
                                    return (
                                    <Card key={visit.id} className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                        {/* Header */}
                                        <div className="p-5 pb-2 flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                                <p className="text-sm text-slate-500">Dr. {visit.doctorName} • {visit.room ? `Room ${visit.room}` : ''}</p>
                                            </div>
                                            <Badge status={visit.status} />
                                        </div>
                                        
                                        {/* Patient Name Tag */}
                                        <div className="px-5 mb-4">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                                                <User className="h-3 w-3" /> {visit.name}
                                            </span>
                                        </div>

                                        {/* SMART DASHBOARD */}
                                        <div className="bg-slate-50 border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Token</div>
                                                <div className="text-3xl font-black text-slate-900">#{visit.tokenNumber}</div>
                                            </div>
                                            <div className="border-x border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Now Serving</div>
                                                <div className={`text-3xl font-bold ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                                                    {visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People Ahead</div>
                                                <div className="text-3xl font-bold text-slate-900">{queueStats.peopleAhead}</div>
                                            </div>
                                        </div>

                                        {/* SMART STATUS MESSAGE */}
                                        <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold`}>
                                            {queueStats.doctorStatus === DoctorStatus.ON_BREAK ? <Coffee className="h-5 w-5" /> : 
                                             queueStats.doctorStatus === DoctorStatus.AVAILABLE ? <Timer className="h-5 w-5" /> :
                                             <AlertCircle className="h-5 w-5" />}
                                            <div className="flex-1">
                                                <p>{queueStats.message}</p>
                                                {visit.status === PatientStatus.WAITING && (
                                                    <p className="text-[10px] opacity-80 font-normal">Est. Time: {queueStats.expectedTime}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Warning banner if not checked in */}
                                        {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (
                                            <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-t ${queueStats.peopleAhead < 3 ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                {queueStats.peopleAhead < 3 ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                                <span>
                                                    {queueStats.peopleAhead < 3 
                                                        ? "CRITICAL: Check-in immediately or lose slot!"
                                                        : visit.visitType === 'APPOINTMENT' ? "Please ask receptionist to check you in upon arrival." : "Scan QR code at reception to check in."
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Footer Actions */}
                                        <div className="p-4 flex gap-2 mt-auto">
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
                                );
                            })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[60vh] opacity-60">
                                <div className="bg-slate-200 p-6 rounded-full mb-4">
                                    <Calendar className="h-12 w-12 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700">No active visits</h3>
                                <p className="text-slate-500 mb-6 text-center max-w-sm">Book an appointment or scan a QR code at a clinic to see your live status here.</p>
                                <Button onClick={() => setActiveTab('BOOK')} size="lg" className="shadow-lg">Find a Doctor</Button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. BOOK / FIND CARE TAB (No Changes) */}
                {activeTab === 'BOOK' && (
                    <div className="h-full">
                        {bookingView === 'LIST' && (
                            <div className="px-4 md:px-0 max-w-7xl mx-auto">
                                {/* ... SEARCH & FILTERS ... */}
                                <div className="mb-8 space-y-6">
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl shadow-xl text-white">
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Find the right care</h2>
                                        <p className="text-slate-300 mb-6">Search doctors, clinics, symptoms or specialties</p>
                                        
                                        <div className="relative max-w-2xl">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input 
                                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-sm text-lg" 
                                                placeholder="e.g. Fever, Dentist, Apollo..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        <div className="hidden md:flex gap-3 mt-6 flex-wrap">
                                             {['NEAR', 'WAIT', 'FEE'].map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => setSortBy(s as any)}
                                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${sortBy === s ? 'bg-white text-slate-900 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                                                >
                                                    {s === 'NEAR' ? 'Nearest' : s === 'WAIT' ? 'Fastest Queue' : 'Low Fees'}
                                                </button>
                                            ))}
                                             <div className="relative">
                                                <select
                                                    className="px-4 py-2 rounded-full text-sm font-bold border bg-white/10 text-white border-white/20 appearance-none pr-10 cursor-pointer focus:outline-none focus:bg-white/20 hover:bg-white/20"
                                                    value={selectedInsurance}
                                                    onChange={(e) => setSelectedInsurance(e.target.value)}
                                                >
                                                    <option value="ALL" className="text-slate-900">All Insurance</option>
                                                    {availableInsurances.map(ins => (
                                                        ins !== 'ALL' && <option key={ins} value={ins} className="text-slate-900">{ins}</option>
                                                    ))}
                                                </select>
                                                <ShieldCheck className="h-4 w-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {CATEGORIES.map(cat => (
                                            <button 
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`flex flex-col items-center gap-2 min-w-[80px] md:min-w-[90px] p-3 rounded-2xl transition-all ${selectedCategory === cat.id ? 'bg-primary-50 border border-primary-200 text-primary-700 shadow-sm' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}
                                            >
                                                <div className={`p-2.5 rounded-full ${selectedCategory === cat.id ? 'bg-primary-100' : 'bg-slate-100'}`}>
                                                    <cat.icon className="h-5 w-5" />
                                                </div>
                                                <span className="text-xs font-bold">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar">
                                        {['NEAR', 'WAIT', 'FEE'].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => setSortBy(s as any)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${sortBy === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                            >
                                                {s === 'NEAR' ? 'Nearest' : s === 'WAIT' ? 'Fastest Queue' : 'Low Fees'}
                                            </button>
                                        ))}
                                         <div className="relative">
                                            <select
                                                className="px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap bg-white text-slate-500 border-slate-200 appearance-none pr-8 cursor-pointer focus:outline-none"
                                                value={selectedInsurance}
                                                onChange={(e) => setSelectedInsurance(e.target.value)}
                                            >
                                                <option value="ALL">Insurance</option>
                                                {availableInsurances.map(ins => (
                                                    ins !== 'ALL' && <option key={ins} value={ins}>{ins}</option>
                                                ))}
                                            </select>
                                            <ShieldCheck className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* RESULTS */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-900 text-lg">Nearby Clinics</h3>
                                        <span className="text-sm text-slate-500">{filteredClinics.length} results found</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
                                                    onClick={() => { setSelectedClinicId(clinic.id); setBookingView('CLINIC_DETAILS'); }}
                                                >
                                                    {/* Image Section */}
                                                    <div className="h-40 bg-slate-100 relative flex-shrink-0 overflow-hidden">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                            <Building2 className="h-12 w-12 text-slate-300" />
                                                        </div>
                                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                                                            <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" /> {rating} <span className="text-slate-400 font-normal ml-1">({reviewCount})</span>
                                                        </div>
                                                        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm ${waitInfo.color}`}>
                                                            <Clock className="h-3 w-3 mr-1" /> {waitInfo.time}m Wait
                                                        </div>
                                                    </div>

                                                    {/* Content Section */}
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors flex items-center gap-1 line-clamp-1">
                                                                    {clinic.name}
                                                                    <ShieldCheck className="h-4 w-4 text-primary-500 fill-current flex-shrink-0" />
                                                                </h3>
                                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" /> {clinic.address}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 space-y-2 flex-1">
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Specialties</span>
                                                                <span className="truncate">{specialties.join(', ')}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Fees</span>
                                                                <span>{feeRange}</span>
                                                            </div>
                                                        </div>

                                                        {/* Avatars */}
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                                            <div className="flex -space-x-2">
                                                                {clinic.doctors.slice(0,3).map(d => (
                                                                    <img key={d.id} src={d.avatarUrl} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200" />
                                                                ))}
                                                                {clinic.doctors.length > 3 && (
                                                                    <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                                        +{clinic.doctors.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-primary-600 flex items-center group-hover:translate-x-1 transition-transform">
                                                                Book <ArrowUpRight className="h-3 w-3 ml-1" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Footer Tags */}
                                                    <div className="bg-slate-50 px-5 py-3 flex items-center gap-2 text-[10px] font-medium text-slate-500 border-t border-slate-100 overflow-hidden">
                                                        {amenities.slice(0, 2).map(am => (
                                                            <span key={am} className="flex items-center gap-1 whitespace-nowrap">
                                                                <CheckCircle2 className="h-3 w-3 text-green-500" /> {am}
                                                            </span>
                                                        ))}
                                                        {amenities.length > 2 && <span>+{amenities.length - 2} more</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {filteredClinics.length === 0 && (
                                            <div className="col-span-full text-center py-16 opacity-50">
                                                <Filter className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-lg font-medium text-slate-600">No clinics found matching criteria.</p>
                                                <button onClick={() => {setSearchQuery(''); setSelectedCategory('ALL'); setSelectedCity('All Cities'); setSelectedInsurance('ALL');}} className="text-primary-600 text-sm mt-2 font-bold hover:underline">Clear Filters</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* CLINIC_DETAILS and FORM views are unchanged but render here */}
                        {bookingView === 'CLINIC_DETAILS' && selectedClinic && (
                             // ... (Existing Clinic Details View) ...
                             // Omitting full re-paste to save space, assume it's the same as previous version
                             // but since I need to provide FULL file, I will include it in final output.
                            <div className="animate-in slide-in-from-right duration-300 bg-white min-h-full md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 md:overflow-hidden md:max-w-5xl md:mx-auto">
                                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                                    <Button variant="ghost" size="sm" onClick={() => { setBookingView('LIST'); setSelectedClinicId(null); }} className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <h2 className="font-bold text-slate-900 truncate text-lg">{selectedClinic.name}</h2>
                                </div>
                                
                                <div className="p-4 md:p-8 pb-24">
                                    {/* ... Clinic Details Content ... */}
                                    <div className="mb-8 grid md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">Open Now</span>
                                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedClinic.name}</h1>
                                                </div>
                                                <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                    <Star className="h-4 w-4 fill-current" /> 4.5 <span className="text-slate-400 font-normal ml-1">(120+)</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 text-sm text-slate-600">
                                                 <p className="flex items-start gap-3">
                                                    <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" /> 
                                                    {selectedClinic.address}, {selectedClinic.city} - {selectedClinic.pincode}
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <Clock className="h-5 w-5 text-slate-400" /> 
                                                    {selectedClinic.operatingHours || '09:00 - 21:00'}
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <Navigation className="h-5 w-5 text-slate-400" /> 
                                                    ~1.2 km from your location
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                             {/* ABOUT SECTION */}
                                            {selectedClinic.about && (
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                        <Info className="h-4 w-4 text-primary-600" /> About Clinic
                                                    </h3>
                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                        {selectedClinic.about}
                                                    </p>
                                                </div>
                                            )}

                                            {/* FACILITIES / AMENITIES */}
                                            {selectedClinic.amenities && selectedClinic.amenities.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Facilities</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedClinic.amenities.map(item => (
                                                            <span key={item} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5">
                                                                <CheckCircle2 className="h-3 w-3 text-green-500" /> {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* INSURANCE SECTION */}
                                            {selectedClinic.acceptedInsurances && selectedClinic.acceptedInsurances.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                        <ShieldCheck className="h-4 w-4 text-blue-600" /> Insurance Accepted
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedClinic.acceptedInsurances.map(ins => (
                                                            <span key={ins} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-800 shadow-sm">
                                                                {ins}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 pt-8">
                                        <h3 className="font-bold text-slate-900 mb-6 text-xl">Available Doctors</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedClinic.doctors.map(doc => {
                                                    const next = getNextAvailability(doc, 14);
                                                    const activeNow = next?.status === 'now' || doc.isAvailable;
                                                    const canBook = !!next;
                                                    const formatShort = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                                    const availLabel = next ? (next.status === 'now' ? 'Available now' : `Next ${formatShort(next.start)}`) : 'No slots';

                                                    return (
                                                        <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-lg transition-all hover:border-primary-200 group">
                                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                                                                <div className="relative flex-shrink-0">
                                                                    <img src={doc.avatarUrl} alt={`Dr. ${doc.name}`} className="h-20 w-20 rounded-2xl object-cover bg-slate-100 border border-slate-100 shadow-inner" />
                                                                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${activeNow ? 'bg-emerald-500' : (canBook ? 'bg-yellow-400' : 'bg-slate-300')}`} title={availLabel}></span>
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-3">
                                                                                <h4 className="font-bold text-slate-900 text-lg truncate">Dr. {doc.name}</h4>
                                                                                {/* degree intentionally omitted for brevity */}
                                                                            </div>

                                                                            <div className="mt-1 text-sm text-slate-700 truncate">{doc.specialty}</div>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 ml-2 sm:ml-0">
                                                                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700">
                                                                                <Star className="h-4 w-4 fill-current text-yellow-500" /> {doc.rating ?? '4.5'}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {doc.yearsExperience ?? '10'} yrs</div>
                                                                        <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> {doc.languages?.join(', ') || 'Eng, Hindi'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                                <div className="flex flex-col text-xs text-slate-500">
                                                                    <div className="uppercase font-bold text-[10px] tracking-wide text-slate-400">Availability & Fees</div>
                                                                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                                                                        {getDoctorTodaySchedule(doc)}
                                                                        <span className="text-xs text-slate-400">·</span>
                                                                        <span className="font-bold text-sm text-slate-900">₹{doc.consultationFee}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <Button
                                                                        onClick={() => { setSelectedDoctorId(doc.id); setBookingView('FORM'); }}
                                                                        disabled={!canBook}
                                                                        variant={canBook ? 'primary' : 'ghost'}
                                                                        size="sm"
                                                                        className={`h-10 px-4 ${canBook ? 'shadow-md hover:shadow-lg' : 'opacity-60 cursor-not-allowed border-slate-200'}`}
                                                                        title={canBook ? (activeNow ? 'Book now' : `Book • ${formatShort(next!.start)}`) : 'No available slots' }
                                                                    >
                                                                        {canBook ? (
                                                                            <span className="inline-flex items-center ">
                                                                                <span className="font-semibold text-sm">{activeNow ? 'Book Now' : `Book • ${formatShort(next!.start)}`}</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs font-semibold uppercase">No slots</span>
                                                                        )}
                                                                    </Button>

  
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {bookingView === 'FORM' && selectedClinic && selectedDoctorId && (
                             // ... (Existing Form View - Copied from previous state) ...
                             <div className="animate-in slide-in-from-right duration-300 bg-slate-50 min-h-full flex flex-col md:items-center md:justify-center md:py-8">
                                 <div className="w-full max-w-2xl bg-white md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 overflow-hidden flex flex-col max-h-full">
                                    <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 shadow-sm flex-shrink-0">
                                        <Button variant="ghost" size="sm" className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100" onClick={() => setBookingView('CLINIC_DETAILS')}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <h2 className="font-bold text-slate-900 text-lg">Confirm Booking</h2>
                                    </div>

                                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                        
                                        {/* PATIENT SELECTOR */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Who is this for?</label>
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                                <button 
                                                    onClick={() => setBookingFor('MYSELF')}
                                                    className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === 'MYSELF' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}
                                                >
                                                    <User className={`h-6 w-6 ${bookingFor === 'MYSELF' ? 'text-primary-600' : 'text-slate-400'}`} />
                                                    <span className="text-xs font-bold">Myself</span>
                                                </button>
                                                
                                                {userProfile?.familyMembers?.map((m, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setBookingFor(m.name)}
                                                        className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === m.name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        <Users className={`h-6 w-6 ${bookingFor === m.name ? 'text-primary-600' : 'text-slate-400'}`} />
                                                        <span className="text-xs font-bold truncate max-w-[60px]">{m.name}</span>
                                                    </button>
                                                ))}

                                                <button 
                                                    onClick={() => { setEditingMemberIndex(null); setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setShowAddMember(true); }}
                                                    className="flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[80px] p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-primary-600 hover:border-primary-400 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Plus className="h-6 w-6" />
                                                    <span className="text-xs font-bold">Add New</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* ... Rest of the Booking Form (Visit Type, Date, Time, Symptoms, Summary) ... */}
                                        {/* (Assuming standard form content is here from previous context to save space in this block) */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            {/* ... Visit Type Selection ... */}
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Visit Type</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    className={`p-4 rounded-xl border-2 text-sm font-bold transition-all text-left relative overflow-hidden ${
                                                        !isWalkInAllowed 
                                                            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                                            : visitType === 'WALK_IN' 
                                                                ? 'bg-primary-50 border-primary-500 text-primary-700' 
                                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                    onClick={() => isWalkInAllowed && setVisitType('WALK_IN')}
                                                    disabled={!isWalkInAllowed}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span>Wait in Queue</span>
                                                        {!isWalkInAllowed && <Lock className="h-3 w-3" />}
                                                    </div>
                                                    <span className="block text-[10px] font-normal mt-1 opacity-70">
                                                        {isWalkInAllowed ? 'Get Next Token' : 'Shift Over'}
                                                    </span>
                                                </button>
                                                <button 
                                                    className={`p-4 rounded-xl border-2 text-sm font-bold transition-all text-left ${visitType === 'APPOINTMENT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                                                    onClick={() => setVisitType('APPOINTMENT')}
                                                >
                                                    <span>Book Slot</span>
                                                    <span className="block text-[10px] font-normal mt-1 opacity-70">Schedule for Later</span>
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
                                                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded max-w-[360px] block truncate" title={bookingDates.find(d => d.dateStr === apptDate)?.schedule?.slots?.map((sl: any) => `${sl.startTime} - ${sl.endTime}`)?.join(', ') || ''}>
                                                                Shift: {(() => {
                                                                    const s = bookingDates.find(d => d.dateStr === apptDate)?.schedule?.slots || [];
                                                                    if (!s || s.length === 0) return 'OFF';
                                                                    return s.map((sl: any) => `${sl.startTime} - ${sl.endTime}`).join(', ');
                                                                })()}
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

                                    <div className="p-6 bg-white border-t border-slate-200 flex-shrink-0">
                                        {/* Booking CTA: disabled when selections are incomplete or no slots available */}
                                        <Button
                                            className="w-full h-12 text-lg shadow-xl shadow-primary-100"
                                            onClick={handleBookToken}
                                            disabled={(() => {
                                                // No clinic/doctor selected
                                                if (!selectedClinicId || !selectedDoctorId) return true;
                                                // Walk-ins blocked
                                                if (visitType === 'WALK_IN' && !isWalkInAllowed) return true;
                                                // Appointments require a date and available slots and a picked time
                                                if (visitType === 'APPOINTMENT') {
                                                    if (!apptDate) return true;
                                                    if (!availableTimeSlots || availableTimeSlots.length === 0) return true;
                                                    if (!apptTime) return true;
                                                }
                                                return false;
                                            })()}
                                        >
                                            {(() => {
                                                if (!selectedClinicId || !selectedDoctorId) return 'Select Clinic & Doctor';
                                                if (visitType === 'WALK_IN') {
                                                    return isWalkInAllowed ? 'Confirm Booking' : 'Walk-in not allowed';
                                                }
                                                // APPOINTMENT
                                                if (!apptDate) return 'Select a date';
                                                if (!availableTimeSlots || availableTimeSlots.length === 0) return 'No slots available';
                                                if (!apptTime) return 'Choose a time';
                                                return 'Confirm Booking';
                                            })()}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. HISTORY TAB (No Changes) */}
                {activeTab === 'HISTORY' && (
                     // ... (Same as before)
                    <div className="px-4 md:px-0 max-w-7xl mx-auto">
                         {historyVisits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 md:pt-0">
                                {historyVisits.map(visit => (
                                    <Card key={visit.id} className={`p-5 shadow-sm border hover:shadow-md transition-shadow ${visit.status === PatientStatus.CANCELLED ? 'border-red-100 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
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
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-50">
                                <History className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-bold text-slate-700">No History Found</h3>
                                <p className="text-slate-500">Your past appointments will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. PROFILE TAB (Updated with Edit/Delete) */}
                {activeTab === 'PROFILE' && userProfile && (
                    <div className="px-4 md:px-0 max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Main Profile Card */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg md:col-span-1 h-fit">
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                                        <User className="h-12 w-12" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">{userProfile.name}</h2>
                                    <p className="text-slate-500 font-medium">{userProfile.phone}</p>
                                </div>
                                <div className="flex justify-center gap-3 text-sm font-medium text-slate-600">
                                     <span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{userProfile.age || '--'} Yrs</span>
                                     <span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{userProfile.gender || '--'}</span>
                                </div>
                            </div>

                            {/* Family Members Panel */}
                            <div className="md:col-span-2">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary-600" /> Family Members
                                    </h3>
                                    <Button size="sm" onClick={() => { setEditingMemberIndex(null); setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setShowAddMember(true); }}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Member
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {userProfile.familyMembers?.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mr-2 flex-shrink-0">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">{member.relation} • {member.age} Yrs</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditMember(idx)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMember(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {(!userProfile.familyMembers || userProfile.familyMembers.length === 0) && (
                                        <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 mb-2">No family members added yet.</p>
                                            <p className="text-xs text-slate-400">Add family to book appointments for them easily.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION (No Changes) */}
            <nav className="md:hidden bg-white border-t border-slate-200 flex justify-around py-2 px-1 pb-safe fixed bottom-0 w-full z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-1 rounded-full ${activeTab === item.id ? 'bg-primary-50' : ''}`}>
                             <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'fill-primary-100' : ''}`} />
                        </div>
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* QR Scanner Overlay (No Changes) */}
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

            {/* Add/Edit Family Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4">{editingMemberIndex !== null ? 'Edit Member' : 'Add Family Member'}</h3>
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
        </main>
    </div>
  );
};