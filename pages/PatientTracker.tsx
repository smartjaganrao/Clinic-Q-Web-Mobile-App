
import React, { useState, useEffect, useMemo } from 'react';
import { PatientStatus, Clinic, Patient, DoctorStatus } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { ArrowLeft, MapPin, Search, Building, Ticket, CalendarCheck, User, Users, Plus, Trash2, Save, History, Clock, ChevronRight, Activity, ChevronLeft, AlertTriangle, QrCode, Map, List, ScanLine, LogOut, Zap, AlertCircle, LocateFixed, Navigation, Heart, Smile, Baby, Stethoscope, Microscope, Brain, Filter, FileText, RefreshCcw, Bell, BellRing, BellOff, Calendar, Star, XCircle, Map as MapIcon, CheckCircle, X, Thermometer, Sparkles, Check, Info, Wallet, ShieldCheck, ThumbsUp, ArrowUpDown, ChevronDown, GraduationCap, Languages, BadgeCheck, Phone, FilterX, Clock12 } from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, appointmentTime?: string, appointmentDate?: string, age?: string, gender?: any, symptoms?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void; // New: For ratings
  onCancelVisit: (clinicId: string, patientId: string) => void; // New: For cancellation
  onCheckIn: (clinicId: string, patientId: string) => void; // New: For QR Check-in
  // New props for Deep Linking / Smart QR
  preSelectedClinicId?: string;
  onClearPendingAction?: () => void;
}

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    age?: string;
    gender?: 'Male' | 'Female' | 'Other';
}

interface PatientDataStore {
    name: string;
    phone: string;
    familyMembers: FamilyMember[];
}

interface Reminder {
    id: string; // correlates to patient/visit ID
    triggerTime: number; // timestamp
    minutesBefore: number;
    message: string;
    sent: boolean;
}

// Categories for Filter
const CATEGORIES = [
    { id: 'General Physician', label: 'General', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
    { id: 'Dentist', label: 'Dentist', icon: Smile, color: 'text-yellow-600 bg-yellow-50' },
    { id: 'Pediatrician', label: 'Kids', icon: Baby, color: 'text-pink-600 bg-pink-50' },
    { id: 'Cardiologist', label: 'Heart', icon: Heart, color: 'text-red-600 bg-red-50' },
    { id: 'Dermatologist', label: 'Skin', icon: User, color: 'text-purple-600 bg-purple-50' },
    { id: 'Orthopedic', label: 'Bone', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'Gynecologist', label: 'Women', icon: User, color: 'text-rose-600 bg-rose-50' },
];

// Symptom to Category Mapper for "Smart Search"
const SYMPTOM_MAP: Record<string, string> = {
    'fever': 'General Physician',
    'cold': 'General Physician',
    'cough': 'General Physician',
    'flu': 'General Physician',
    'headache': 'General Physician',
    'stomach': 'General Physician',
    'tooth': 'Dentist',
    'gum': 'Dentist',
    'root canal': 'Dentist',
    'child': 'Pediatrician',
    'baby': 'Pediatrician',
    'heart': 'Cardiologist',
    'chest': 'Cardiologist',
    'bp': 'Cardiologist',
    'rash': 'Dermatologist',
    'pimple': 'Dermatologist',
    'acne': 'Dermatologist',
    'bone': 'Orthopedic',
    'joint': 'Orthopedic',
    'fracture': 'Orthopedic',
    'pregnant': 'Gynecologist',
    'period': 'Gynecologist'
};

// Helper for Local Date String (YYYY-MM-DD)
const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to parse Appointment Date/Time strings to Timestamp
const parseAppointmentDateTime = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hr, min] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, hr, min).getTime();
};

// Haversine Formula for distance (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const getFacilities = (clinicName: string) => {
    if (clinicName.includes('Hospital')) return ['Pharmacy', 'X-Ray', 'Parking', '24/7', 'ICU', 'Ambulance'];
    if (clinicName.includes('Dental')) return ['X-Ray', 'Cosmetic', 'Implants', 'Aligners'];
    return ['Pharmacy', 'Parking', 'Online Reports', 'Wheelchair'];
};

const getClinicImage = (slug: string) => {
    if (slug.includes('dental')) return "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800";
    if (slug.includes('heart')) return "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=800";
    if (slug.includes('care')) return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800";
    return "https://images.unsplash.com/photo-1587351021759-3e566b9af923?auto=format&fit=crop&q=80&w=800";
};

// Mock Doctor Details (Experience, Languages)
const getDoctorExtras = (id: string) => {
    const seed = id.charCodeAt(id.length - 1);
    const exp = 5 + (seed % 20);
    const langs = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi'];
    // Deterministic random slice
    const docLangs = langs.slice(seed % 3, (seed % 3) + 2 + (seed % 2));
    if (!docLangs.includes('English')) docLangs.unshift('English');
    return {
        experience: exp,
        languages: docLangs.join(', '),
        qualifications: 'MBBS, MD'
    };
};

const getRandomRating = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to range 3.8 to 4.9
    const rating = 3.8 + (Math.abs(hash) % 12) / 10;
    return rating.toFixed(1);
};

const getRandomReviewCount = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to range 20 to 500
    return 20 + (Math.abs(hash) % 481);
};

export const PatientTracker: React.FC<PatientTrackerProps> = ({ 
    clinics, userPhone, userName, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit, onCheckIn,
    preSelectedClinicId, onClearPendingAction 
}) => {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'HISTORY' | 'PROFILE'>('NEW');
  // Sub-view state for better navigation flow: SEARCH -> CLINIC_DETAILS -> BOOKING
  const [bookingView, setBookingView] = useState<'SEARCH' | 'CLINIC_DETAILS' | 'BOOKING_FORM'>('SEARCH');
  const [detailsTab, setDetailsTab] = useState<'OVERVIEW' | 'DOCTORS' | 'REVIEWS'>('DOCTORS');

  // -- LOCAL STORAGE / PROFILE STATE --
  const [userProfileName, setUserProfileName] = useState(userName);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // -- SEARCH & MAP STATE --
  const [searchCity, setSearchCity] = useState<string>(''); // City Filter
  const [searchQuery, setSearchQuery] = useState(''); // Name Filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'NEAREST' | 'WAIT_TIME' | 'RATING'>('RELEVANCE');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // -- DOCTOR FILTER STATE (Clinic Details View) --
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorSortBy, setDoctorSortBy] = useState<'DEFAULT' | 'RATING' | 'EXPERIENCE' | 'FEE_LOW' | 'FEE_HIGH'>('DEFAULT');

  // -- CANCEL CONFIRMATION STATE --
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; clinicId: string; visitId: string; patientName: string } | null>(null);

  // Extract unique cities
  const availableCities = useMemo(() => {
      const cities = new Set(clinics.map(c => c.city).filter(Boolean));
      return Array.from(cities).sort();
  }, [clinics]);

  // Load data specific to logged-in phone number
  useEffect(() => {
      const storageKey = `clinicq_patient_${userPhone}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
          const parsed: PatientDataStore = JSON.parse(savedData);
          setUserProfileName(parsed.name);
          setFamilyMembers(parsed.familyMembers || []);
      } else {
          saveDataToStorage(userName, []);
      }
      const savedReminders = localStorage.getItem(`clinicq_reminders_${userPhone}`);
      if (savedReminders) {
          setReminders(JSON.parse(savedReminders));
      }
  }, [userPhone]);

  const saveDataToStorage = (name: string, members: FamilyMember[]) => {
      const storageKey = `clinicq_patient_${userPhone}`;
      const data: PatientDataStore = { name: name, phone: userPhone, familyMembers: members };
      localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const saveReminders = (newReminders: Reminder[]) => {
      setReminders(newReminders);
      localStorage.setItem(`clinicq_reminders_${userPhone}`, JSON.stringify(newReminders));
  };

  // -- VISITS DATA DERIVATION --
  const allUserVisits = useMemo(() => {
      if (!userPhone) return [];
      const visits: any[] = [];
      clinics.forEach(c => {
          c.patients.forEach(p => {
              if (p.phone === userPhone) {
                  const doc = c.doctors.find(d => d.id === p.doctorId);
                  visits.push({
                      ...p,
                      clinicId: c.id,
                      clinicName: c.name,
                      clinicGeo: c.geoLocation,
                      doctorName: doc?.name || 'Unknown',
                      doctorRoom: doc?.roomNumber || '-',
                      doctorDelay: doc?.delayMinutes || 0
                  });
              }
          });
      });
      return visits.sort((a, b) => b.timeAdded - a.timeAdded);
  }, [clinics, userPhone]);

  const activeVisits = allUserVisits.filter(v => v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED && v.status !== PatientStatus.SKIPPED);
  const historyVisits = allUserVisits.filter(v => v.status === PatientStatus.COMPLETED || v.status === PatientStatus.CANCELLED || v.status === PatientStatus.SKIPPED);

  // -- QR LOGIC --
  useEffect(() => {
    if (preSelectedClinicId) {
        const activeVisit = activeVisits.find(v => v.clinicId === preSelectedClinicId);
        if (activeVisit) {
            if (!activeVisit.isCheckedIn) {
                 onCheckIn(preSelectedClinicId, activeVisit.id);
                 addToast("Auto Check-in Successful! You are marked 'Here'.", "success");
            } else {
                 addToast("You are already checked in.", "info");
            }
            setActiveTab('ACTIVE');
            setSelectedClinicId(preSelectedClinicId);
        } else {
            setSelectedClinicId(preSelectedClinicId);
            setActiveTab('NEW');
            setBookingView('CLINIC_DETAILS'); // Go to details first
            addToast("Welcome! Clinic detected.", "success");
        }
        if (onClearPendingAction) onClearPendingAction();
    }
  }, [preSelectedClinicId, activeVisits, onCheckIn, addToast, onClearPendingAction]);

  // -- REMINDER CHECKER --
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          reminders.forEach(r => {
              if (!r.sent && r.triggerTime <= now) {
                  addToast(`🔔 Reminder: ${r.message}`, 'info');
                  setReminders(prev => {
                      const updated = prev.map(item => item.id === r.id ? { ...item, sent: true } : item);
                      localStorage.setItem(`clinicq_reminders_${userPhone}`, JSON.stringify(updated));
                      return updated;
                  });
              }
          });
      }, 10000);
      return () => clearInterval(interval);
  }, [reminders, userPhone, addToast]);

  const handleSetReminder = (visitId: string, appointmentTimestamp: number, minutesBefore: number, doctorName: string) => {
      const triggerTime = appointmentTimestamp - (minutesBefore * 60 * 1000);
      if (triggerTime <= Date.now()) {
          addToast("This time has already passed. Cannot set reminder.", "warning");
          return;
      }
      const newReminder: Reminder = {
          id: visitId,
          triggerTime,
          minutesBefore,
          message: `Your appointment with ${doctorName} is in ${minutesBefore} minutes!`,
          sent: false
      };
      const updated = [...reminders.filter(r => r.id !== visitId), newReminder];
      saveReminders(updated);
      addToast(`Reminder set for ${minutesBefore} minutes before appointment.`, "success");
  };

  const handleRemoveReminder = (visitId: string) => {
      const updated = reminders.filter(r => r.id !== visitId);
      saveReminders(updated);
      addToast("Reminder removed.", "info");
  };

  // -- PROFILE HANDLERS --
  const handleUpdateProfile = (newName: string) => {
      setUserProfileName(newName);
      saveDataToStorage(newName, familyMembers);
      addToast("Profile name updated", "success");
  };

  const addFamilyMember = (name: string, relation: string, age: string, gender: any) => {
      const newMember = { id: Date.now().toString(), name, relation, age, gender };
      const updatedMembers = [...familyMembers, newMember];
      setFamilyMembers(updatedMembers);
      saveDataToStorage(userProfileName, updatedMembers);
      addToast(`${name} added to family`, "success");
  };

  const removeFamilyMember = (id: string) => {
      const updatedMembers = familyMembers.filter(m => m.id !== id);
      setFamilyMembers(updatedMembers);
      saveDataToStorage(userProfileName, updatedMembers);
      addToast("Family member removed", "info");
  };

  // -- LOCATION --
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
        addToast("Geolocation is not supported by your browser", "error");
        return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setIsLocating(false);
            setSortBy('NEAREST'); // Auto switch sort
            setSearchCity(''); // Clear city to show absolute nearest
            addToast("Location detected! Sorted by nearest.", "success");
        },
        (error) => {
            setIsLocating(false);
            addToast("Unable to retrieve location. Please check permissions.", "error");
        }
    );
  };

  const handleGetDirections = (clinic: Clinic) => {
      const { lat, lng } = clinic.geoLocation || { lat: 0, lng: 0 };
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleRateVisit = (visitId: string, rating: number) => {
      onUpdateDetails(visitId, { rating });
      addToast("Thank you for your feedback!", "success");
  };

  const handleCancelClick = (e: React.MouseEvent, clinicId: string, visitId: string, patientName: string) => {
      e.stopPropagation();
      setCancelModal({ isOpen: true, clinicId, visitId, patientName });
  };

  const confirmCancel = () => {
      if (cancelModal) {
          onCancelVisit(cancelModal.clinicId, cancelModal.visitId);
          addToast("Appointment cancelled successfully.", "info");
          setCancelModal(null);
      }
  };

  // -- BOOKING FORM STATE --
  const [tokenInput, setTokenInput] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<any | null>(null);
  const [manualSearchError, setManualSearchError] = useState('');
  const [isAppointmentMode, setIsAppointmentMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('myself');
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [chosenDateStr, setChosenDateStr] = useState(getLocalYYYYMMDD(new Date()));

  const currentClinic = clinics.find(c => c.id === selectedClinicId);

  useEffect(() => {
      if (activeTab === 'NEW' && userProfileName && !newName) {
          setNewName(userProfileName);
          setNewPhone(userPhone);
          setSelectedMemberId('myself');
      }
  }, [activeTab, userProfileName, userPhone]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showQRScanner) {
        timer = setTimeout(() => {
           if (clinics.length > 0) {
               const scannedClinicId = selectedClinicId || clinics[0].id;
               const activeVisit = activeVisits.find(v => v.clinicId === scannedClinicId);
               if (activeVisit) {
                   onCheckIn(scannedClinicId, activeVisit.id);
                   setActiveTab('ACTIVE');
                   setShowQRScanner(false);
               } else {
                   setSelectedClinicId(scannedClinicId);
                   setBookingView('CLINIC_DETAILS'); // Go to details
                   setShowQRScanner(false);
                   addToast("QR Detected. Loading clinic...", "success");
               }
           }
        }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn]);

  const { availableSlots, scheduleStatus } = useMemo(() => {
      const result = { availableSlots: [] as string[], scheduleStatus: { isOff: false, shiftStarted: false, workingHours: '' } };
      if (!currentClinic || !selectedDocId) return result;
      const doc = currentClinic.doctors.find(d => d.id === selectedDocId);
      if (!doc) return result;
      const [y, m, dNum] = chosenDateStr.split('-').map(Number);
      const chosenDateObj = new Date(y, m - 1, dNum);
      const dayOfWeekName = chosenDateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = doc.weeklySchedule.find(s => s.day === dayOfWeekName);
      
      if (!daySchedule || daySchedule.isOff) { result.scheduleStatus.isOff = true; return result; }
      result.scheduleStatus.workingHours = `${daySchedule.startTime} - ${daySchedule.endTime}`;

      const localTodayStr = getLocalYYYYMMDD(new Date());
      if (chosenDateStr === localTodayStr) {
          const now = new Date();
          const [sH, sM] = daySchedule.startTime.split(':').map(Number);
          const startMins = sH * 60 + sM;
          const currentMins = now.getHours() * 60 + now.getMinutes();
          if (currentMins >= startMins) { result.scheduleStatus.shiftStarted = true; return result; }
      }

      const takenSlots = new Set(
          currentClinic.patients
            .filter(p => p.doctorId === selectedDocId && p.status !== PatientStatus.CANCELLED && p.appointmentTime && p.appointmentDate === chosenDateStr)
            .map(p => p.appointmentTime)
      );

      const slots = [];
      const [startH, startM] = daySchedule.startTime.split(':').map(Number);
      const [endH, endM] = daySchedule.endTime.split(':').map(Number);
      let currentH = startH; let currentM = startM;
      while (currentH < endH || (currentH === endH && currentM < endM)) {
          const timeString = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
          if (!takenSlots.has(timeString)) slots.push(timeString);
          currentM += 20; if (currentM >= 60) { currentH += 1; currentM -= 60; }
      }
      result.availableSlots = slots;
      return result;
  }, [currentClinic, selectedDocId, chosenDateStr]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClinic) return;
    const num = parseInt(tokenInput);
    const found = currentClinic.patients.find(p => p.tokenNumber === num && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED);
    if (found) { 
        const doc = currentClinic.doctors.find(d => d.id === found.doctorId);
        setSearchedPatient({
            ...found, clinicId: currentClinic.id, clinicName: currentClinic.name, doctorName: doc?.name, doctorRoom: doc?.roomNumber
        }); 
        setManualSearchError(''); 
    } else { setManualSearchError('Token not found or visit completed.'); setSearchedPatient(null); }
  };

  const handleGetToken = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentClinic || !selectedDocId) return;
      
      const isDuplicate = currentClinic.patients.some(p => 
        p.phone === newPhone &&
        p.name.trim().toLowerCase() === newName.trim().toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
      );
      if (isDuplicate) { addToast(`"${newName}" is already in the queue.`, "error"); return; }
      if (isAppointmentMode && !selectedSlot) { addToast("Please select a time slot", "error"); return; }
      
      if (selectedMemberId === 'myself' && newName !== userProfileName) { handleUpdateProfile(newName); }

      onGetToken(newName, newPhone, selectedDocId, currentClinic.id, isAppointmentMode ? selectedSlot : undefined, isAppointmentMode ? chosenDateStr : undefined, newAge, newGender, newSymptoms);
      setActiveTab('ACTIVE');
      setBookingView('SEARCH');
      // Fix: Reset selected clinic so going back to Find Care works
      setSelectedClinicId('');
      setNewName(''); setNewPhone(''); setNewAge(''); setNewSymptoms(''); setSelectedDocId(''); setSelectedSlot(''); setIsAppointmentMode(false);
  };

  const getQueueInfoForVisit = (visit: any) => {
    const clinic = clinics.find(c => c.id === visit.clinicId);
    if (!clinic || visit.status !== PatientStatus.WAITING) return null;
    const queue = clinic.patients.filter(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WAITING);
    const now = new Date();
    
    if (visit.visitType === 'APPOINTMENT' && visit.appointmentDate && visit.appointmentTime) {
        const todayStr = getLocalYYYYMMDD(now);
        if (visit.appointmentDate > todayStr) return { position: '-', estWait: 0, doctorDelay: 0, statusMsg: `Scheduled for ${visit.appointmentDate}.` };
        if (visit.appointmentDate === todayStr) {
            const apptTime = parseAppointmentDateTime(visit.appointmentDate, visit.appointmentTime);
            const diffMins = (apptTime - now.getTime()) / (1000 * 60);
            if (diffMins > 60) return { position: '-', estWait: Math.floor(diffMins), doctorDelay: 0, statusMsg: `Appointment in approx ${Math.floor(diffMins/60)} hrs.` };
            if (diffMins > 30) return { position: '-', estWait: Math.floor(diffMins), doctorDelay: 0, statusMsg: `Start heading to clinic. ${Math.floor(diffMins)}m to go.` };
            if (diffMins > 0) return { position: '-', estWait: Math.floor(diffMins), doctorDelay: 0, statusMsg: `Slot coming up! Check-in at reception.` };
            if (diffMins < -15 && !visit.isCheckedIn) return { position: '-', estWait: 0, doctorDelay: 0, statusMsg: `LATE! Check-in immediately.` };
        }
    }
    const sortedQueue = queue; // Simplified for display, real sort in Reception
    const position = sortedQueue.findIndex(p => p.id === visit.id);
    if (position === -1) return null;
    const doctorDelay = visit.doctorDelay || 0;
    const baseWait = (position + 1) * 10;
    const totalWait = baseWait + doctorDelay;
    let statusMsg = doctorDelay > 0 ? `Doctor delayed by ${doctorDelay}m.` : position === 0 ? "You are next!" : position <= 2 ? "Almost your turn." : "Queue moving smoothly.";
    
    return { position: position + 1, estWait: totalWait, doctorDelay: doctorDelay, statusMsg: statusMsg };
  };

  const selectPatient = (type: 'myself' | 'member' | 'new', memberId?: string) => {
      if (type === 'myself') {
          setNewName(userProfileName); setNewPhone(userPhone); setNewAge(''); setNewGender('Male'); setSelectedMemberId('myself');
      } else if (type === 'member' && memberId) {
          const member = familyMembers.find(m => m.id === memberId);
          if (member) { setNewName(member.name); setNewPhone(userPhone); setNewAge(member.age || ''); setNewGender(member.gender || 'Male'); setSelectedMemberId(memberId); }
      } else {
          setNewName(''); setNewPhone(userPhone || ''); setNewAge(''); setNewGender('Male'); setSelectedMemberId('custom');
      }
  };

  const handleBookAgain = (clinicId: string, doctorId: string) => {
      setSelectedClinicId(clinicId); setSelectedDocId(doctorId); setActiveTab('NEW'); setBookingView('BOOKING_FORM'); setIsAppointmentMode(false);
  };

  const handleClinicCardClick = (clinicId: string) => {
      setSelectedClinicId(clinicId);
      setBookingView('CLINIC_DETAILS');
  };

  const handleBookDoctor = (doctorId: string) => {
      setSelectedDocId(doctorId);
      setBookingView('BOOKING_FORM');
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear(); const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); const startDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
    const todayStr = getLocalYYYYMMDD(new Date());
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = dateStr < todayStr;
        days.push(<button key={day} type="button" disabled={isPast} onClick={() => { setChosenDateStr(dateStr); setSelectedSlot(''); }} className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all mx-auto ${isPast ? 'text-slate-300' : 'hover:bg-purple-100'} ${dateStr === chosenDateStr ? 'bg-purple-600 text-white' : ''}`}>{day}</button>);
    }
    return days;
  };

  // SMART BACK BUTTON LOGIC
  const handleInternalBack = () => {
      // 1. Deep linking in Find Care (NEW) tab
      if (activeTab === 'NEW' && selectedClinicId) {
          if (bookingView === 'BOOKING_FORM') {
              setBookingView('CLINIC_DETAILS');
              return;
          }
          if (bookingView === 'CLINIC_DETAILS') {
              setBookingView('SEARCH');
              setSelectedClinicId('');
              return;
          }
          // Failsafe if state gets stuck
          setBookingView('SEARCH');
          setSelectedClinicId('');
          return;
      }

      // 2. Tab Navigation - If not on Home tab, go to Home tab
      if (activeTab !== 'NEW') {
          setActiveTab('NEW');
          // Ensure we go back to root search when switching back
          if(selectedClinicId) setSelectedClinicId('');
          return;
      }

      // 3. Root Level - Exit App
      onBack();
  };

  // Determine which icon to show for the Back button
  // Show ArrowLeft (Back) if:
  // - We are in the NEW tab but deeper than the root search list (selectedClinicId is set)
  // - We are in any other tab (Active, History, Profile)
  const showArrowBack = (activeTab === 'NEW' && !!selectedClinicId) || activeTab !== 'NEW';

  // FILTERED CLINICS LOGIC (For Discovery View)
  const filteredClinics = useMemo(() => {
     if (activeTab !== 'NEW' || selectedClinicId) return [];
     
     return clinics
        .map(clinic => {
            let distance = null;
            if (userLocation && clinic.geoLocation) distance = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
            
            // Calculate Min/Max Fee
            const fees = clinic.doctors.map(d => d.consultationFee);
            const minFee = Math.min(...fees);
            const maxFee = Math.max(...fees);
            const feeDisplay = minFee === maxFee ? `₹${minFee}` : `₹${minFee} - ₹${maxFee}`;

            return { ...clinic, distance, 
                rating: getRandomRating(clinic.id), 
                reviews: getRandomReviewCount(clinic.id),
                feeDisplay,
                facilities: getFacilities(clinic.name),
                image: getClinicImage(clinic.slug)
            };
        })
        .filter(c => {
            const matchesCity = searchCity ? c.city === searchCity : true;
            const q = searchQuery.toLowerCase();
            let inferredSpecialty = '';
            Object.keys(SYMPTOM_MAP).forEach(s => { if (q.includes(s)) inferredSpecialty = SYMPTOM_MAP[s].toLowerCase(); });
            const matchesText = !q ? true : (c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.doctors.some(d => d.specialty.toLowerCase().includes(q)) || (inferredSpecialty && c.doctors.some(d => d.specialty.toLowerCase().includes(inferredSpecialty))));
            const matchesCategory = selectedCategory ? c.doctors.some(d => d.specialty === selectedCategory) : true;
            return matchesCity && matchesText && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'NEAREST' && userLocation) return (a.distance || 999) - (b.distance || 999);
            if (sortBy === 'RATING') return parseFloat(b.rating) - parseFloat(a.rating);
            if (sortBy === 'WAIT_TIME') {
                const aLoad = a.patients.filter(p => p.status === PatientStatus.WAITING).length;
                const bLoad = b.patients.filter(p => p.status === PatientStatus.WAITING).length;
                return aLoad - bLoad;
            }
            return 0; // Default
        });
  }, [clinics, searchCity, searchQuery, selectedCategory, sortBy, userLocation, activeTab, selectedClinicId]);

  if (showQRScanner) {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
              <button onClick={() => setShowQRScanner(false)} className="absolute top-4 left-4 p-2 bg-black/50 rounded-full"><ArrowLeft className="h-6 w-6" /></button>
              <div className="w-64 h-64 border-2 border-primary-500 rounded-2xl relative overflow-hidden bg-white/5">
                  <div className="absolute inset-0 border-t-4 border-primary-500 animate-pulse top-0 h-full w-full bg-gradient-to-b from-primary-500/20 to-transparent"></div>
              </div>
              <p className="mt-8 text-center px-6">Scan QR at reception to Check-in</p>
          </div>
      );
  }

  // ------------------------------------------------------------------------------------------------
  // UNIFIED MAIN APP LAYOUT (With Persistent Bottom Nav)
  // ------------------------------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
        {/* CUSTOM CANCEL MODAL */}
        {cancelModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 scale-100 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Appointment?</h3>
                        <p className="text-slate-500 text-sm">
                            Are you sure you want to cancel the visit for <span className="font-bold text-slate-900">{cancelModal.patientName}</span>? 
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={() => setCancelModal(null)}>
                            Go Back
                        </Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600" 
                            onClick={confirmCancel}
                        >
                            Yes, Cancel
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* DYNAMIC HEADER */}
        {/* Scenario 1: Discovery Mode (Find Care Root) -> Location + Search Header */}
        {!selectedClinicId && activeTab === 'NEW' ? (
            <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-40 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleInternalBack}>
                        <LogOut className="h-5 w-5 text-red-500" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg text-slate-900 leading-none">Find Care</h1>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {searchCity || 'All Cities'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={handleUseLocation} className={`p-2 rounded-full border transition-all ${isLocating ? 'bg-primary-50 border-primary-200 text-primary-600 animate-pulse' : 'bg-white border-slate-200 text-slate-500'}`}>
                        <LocateFixed className="h-5 w-5" />
                     </button>
                     <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md" onClick={() => setActiveTab('PROFILE')}>
                        <User className="h-4 w-4" />
                     </div>
                </div>
            </header>
        ) : (
            /* Scenario 2: Deep Link or Other Tabs -> Back Button Header */
            <header className={`bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 ${bookingView === 'CLINIC_DETAILS' ? 'shadow-none border-b-0' : ''}`}>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleInternalBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex flex-col">
                        <h1 className="font-bold text-slate-900 truncate max-w-[200px]">
                            {selectedClinicId && activeTab === 'NEW' ? (bookingView === 'CLINIC_DETAILS' ? 'Hospital Info' : currentClinic?.name) : (activeTab === 'ACTIVE' ? 'Active Visits' : activeTab === 'HISTORY' ? 'History' : 'Profile')}
                        </h1>
                    </div>
                </div>
                {bookingView !== 'CLINIC_DETAILS' && (
                    <button onClick={() => setActiveTab('PROFILE')} className="p-2 hover:bg-slate-100 rounded-full">
                        <Users className="h-5 w-5 text-slate-600" />
                    </button>
                )}
            </header>
        )}

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 max-w-md mx-auto w-full pb-24 overflow-x-hidden">
            
            {/* VIEW: DISCOVERY / FIND CARE (ROOT) */}
            {!selectedClinicId && activeTab === 'NEW' && (
                <>
                {/* Search & Filter Section */}
                <div className="bg-white p-4 pb-0 z-10 sticky top-[60px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
                    {/* Search Bar */}
                    <div className="relative mb-4 shadow-sm rounded-xl">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                             <Search className="h-5 w-5" />
                         </div>
                         <input 
                            type="text"
                            placeholder="Doctor, Clinic, or 'Fever'..."
                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                         {searchQuery && (
                             <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1">
                                 <X className="h-4 w-4" />
                             </button>
                         )}
                    </div>

                    {/* Filter Row 1: City & Sort */}
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                        <div className="relative flex-shrink-0 min-w-[120px]">
                            <select 
                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 appearance-none"
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                            >
                                <option value="">All Cities</option>
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative flex-shrink-0 min-w-[130px]">
                            <select 
                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 appearance-none"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                            >
                                <option value="RELEVANCE">Relevance</option>
                                <option value="NEAREST">Nearest</option>
                                <option value="WAIT_TIME">Wait Time</option>
                                <option value="RATING">Rating</option>
                            </select>
                            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                        
                        <button onClick={() => setShowQRScanner(true)} className="flex-shrink-0 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                            <QrCode className="h-3.5 w-3.5" /> Scan
                        </button>
                    </div>

                    {/* Categories Chips */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${isSelected ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RESULTS LIST */}
                <div className="px-4 space-y-5 pb-6 bg-slate-50 pt-4">
                    <div className="flex items-center justify-between px-1">
                         <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Clinics Near You</h3>
                         <span className="text-xs text-slate-500 font-medium">{filteredClinics.length} found</span>
                    </div>

                    {filteredClinics.length > 0 ? filteredClinics.map(clinic => {
                        const matchingDoctors = searchQuery 
                            ? clinic.doctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
                            : clinic.doctors;
                        
                        const load = clinic.patients.filter(p => p.status === PatientStatus.WAITING).length;
                        const avgWait = load * 10;
                        const isCrowded = load >= 5;

                        return (
                            <div 
                                key={clinic.id}
                                onClick={() => handleClinicCardClick(clinic.id)}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 active:scale-[0.99] transition-all cursor-pointer overflow-hidden hover:shadow-md group"
                            >
                                {/* CARD HEADER: Image & Badges */}
                                <div className="h-32 bg-slate-200 relative">
                                    <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    
                                    {/* Top Tags */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                            <ShieldCheck className="h-3 w-3 text-blue-500" /> Verified
                                        </span>
                                        {clinic.plan === 'Premium' && (
                                            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                                                Premium
                                            </span>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div className="absolute bottom-3 left-3 text-white">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                {clinic.rating} <Star className="h-3 w-3 fill-current" />
                                            </span>
                                            <span className="text-[10px] text-white/80 font-medium underline">{clinic.reviews} Patient Stories</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD BODY */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg leading-tight">{clinic.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {clinic.city}, {clinic.address.split(',')[0]} 
                                                {clinic.distance !== null && <span className="font-bold text-slate-700">• {clinic.distance.toFixed(1)} km</span>}
                                            </p>
                                        </div>
                                        {/* Live Status - THE USP */}
                                        <div className="text-right">
                                            {isCrowded ? (
                                                <div className="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100 inline-flex items-center gap-1">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Heavy
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-green-100 inline-flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Live
                                                </div>
                                            )}
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                ~{Math.max(5, avgWait)}m Wait
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="my-3 h-px bg-slate-100"></div>

                                    {/* Doctors & Facilities */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                                            {matchingDoctors.slice(0, 3).map((d) => (
                                                <div key={d.id} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                                    <img src={d.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                </div>
                                            ))}
                                            {matchingDoctors.length > 3 && (
                                                <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    +{matchingDoctors.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1">
                                                {matchingDoctors[0]?.name} <span className="font-normal text-slate-500">& Team</span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 line-clamp-1">
                                                {matchingDoctors.map(d => d.specialty).slice(0, 2).join(', ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {clinic.facilities.map((f: string) => (
                                            <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                {f}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Consultation</span>
                                            <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                                                <Wallet className="h-3.5 w-3.5 text-slate-400" /> {clinic.feeDisplay}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-colors">
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-12 px-8">
                            <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">No clinics found</h3>
                            <p className="text-sm text-slate-500 mb-6">We couldn't find any matches for "{searchQuery}". Try different filters.</p>
                            <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSearchCity(''); setSelectedCategory(null); }}>
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>
                </>
            )}

            {/* VIEW: CLINIC DETAILS (The New Feature) */}
            {activeTab === 'NEW' && selectedClinicId && bookingView === 'CLINIC_DETAILS' && currentClinic && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 bg-slate-50 min-h-full">
                    
                    {/* Hero Section */}
                    <div className="relative h-48 w-full bg-slate-300">
                        <img src={getClinicImage(currentClinic.slug)} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h2 className="text-2xl font-bold leading-tight mb-1">{currentClinic.name}</h2>
                            <p className="text-sm text-white/80 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {currentClinic.address}
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="bg-white p-4 flex justify-between border-b border-slate-100 shadow-sm relative z-10 -mt-2 rounded-t-xl">
                        <div className="text-center flex-1 border-r border-slate-100">
                            <div className="flex items-center justify-center gap-1 text-slate-900 font-bold">
                                {getRandomRating(currentClinic.id)} <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </div>
                            <div className="text-[10px] text-slate-500">{getRandomReviewCount(currentClinic.id)} Reviews</div>
                        </div>
                        <div className="text-center flex-1 border-r border-slate-100">
                            <div className="flex items-center justify-center gap-1 text-slate-900 font-bold">
                                <Clock className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-[10px] text-slate-500">{currentClinic.operatingHours || 'Open 24/7'}</div>
                        </div>
                        <div className="text-center flex-1">
                            <div className="flex items-center justify-center gap-1 text-slate-900 font-bold">
                                <MapIcon className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-[10px] text-slate-500">1.2 km</div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white border-b border-slate-200 sticky top-[60px] z-30 shadow-sm">
                        <div className="flex">
                             <button onClick={() => setDetailsTab('DOCTORS')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${detailsTab === 'DOCTORS' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}>Doctors</button>
                             <button onClick={() => setDetailsTab('OVERVIEW')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${detailsTab === 'OVERVIEW' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}>Overview</button>
                             <button onClick={() => setDetailsTab('REVIEWS')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${detailsTab === 'REVIEWS' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}>Reviews</button>
                        </div>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* DOCTORS TAB */}
                        {detailsTab === 'DOCTORS' && (
                            <div className="space-y-4 animate-in fade-in">
                                {/* Doctor Filters */}
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                                     <div className="relative mb-3">
                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                         <input 
                                             placeholder="Search Specialist..." 
                                             className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                             value={doctorSearchQuery}
                                             onChange={(e) => setDoctorSearchQuery(e.target.value)}
                                         />
                                     </div>
                                     <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                         {['DEFAULT', 'RATING', 'EXPERIENCE', 'FEE_LOW', 'FEE_HIGH'].map(sort => (
                                             <button 
                                                key={sort}
                                                onClick={() => setDoctorSortBy(sort as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 whitespace-nowrap transition-colors ${doctorSortBy === sort ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                             >
                                                 {sort === 'DEFAULT' ? 'Relevance' : sort === 'RATING' ? 'Top Rated' : sort === 'EXPERIENCE' ? 'Experience' : sort === 'FEE_LOW' ? 'Lowest Fee' : 'Highest Fee'}
                                             </button>
                                         ))}
                                     </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800">Available Specialists</h3>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Live Status Active</span>
                                </div>
                                
                                {currentClinic.doctors
                                    .filter(d => d.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase()))
                                    .sort((a,b) => {
                                        if (doctorSortBy === 'RATING') return b.rating - a.rating;
                                        if (doctorSortBy === 'FEE_LOW') return a.consultationFee - b.consultationFee;
                                        if (doctorSortBy === 'FEE_HIGH') return b.consultationFee - a.consultationFee;
                                        return 0;
                                    })
                                    .map(doc => {
                                    const details = getDoctorExtras(doc.id);
                                    // Use specific doctor fee and rating
                                    const fee = doc.consultationFee;
                                    const rating = doc.rating;
                                    const reviewCount = doc.reviewCount;
                                    
                                    const load = currentClinic.patients.filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING).length;
                                    const avgWait = Math.max(5, load * 10);
                                    
                                    // Get Doctor's schedule for TODAY
                                    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                    const schedule = doc.weeklySchedule.find(s => s.day === todayName);
                                    const timeStr = schedule && !schedule.isOff ? `${schedule.startTime} - ${schedule.endTime}` : 'Off Duty';
                                    
                                    return (
                                        <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="p-4 flex gap-4">
                                                <div className="relative">
                                                    <img src={doc.avatarUrl} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                                                    {doc.status === DoctorStatus.AVAILABLE ? (
                                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                    ) : (
                                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-orange-500 border-2 border-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                                        <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2 py-1 rounded">₹{fee}</div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-1">{doc.specialty}</p>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex items-center gap-0.5 bg-green-500 text-white px-1.5 rounded text-[10px] font-bold">
                                                            {rating} <Star className="h-2 w-2 fill-current" />
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 underline">{reviewCount} Reviews</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mb-2">{details.qualifications} • {details.experience} Yrs Exp</p>
                                                    
                                                    {/* Individual Timings */}
                                                    <div className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded w-fit">
                                                        <Clock12 className="h-3 w-3 text-slate-400" />
                                                        <span className="text-slate-600 font-medium">Today: {timeStr}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Live Status Strip */}
                                            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center">
                                                 <div className="flex items-center gap-2">
                                                     {doc.status === DoctorStatus.AVAILABLE ? (
                                                         <>
                                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                                            <span className="text-xs font-bold text-green-700">In Cabin</span>
                                                         </>
                                                     ) : (
                                                        <>
                                                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                                            <span className="text-xs font-bold text-orange-700">{doc.status === DoctorStatus.ON_BREAK ? 'On Break' : 'Offline'}</span>
                                                        </>
                                                     )}
                                                     <span className="text-slate-300">|</span>
                                                     <span className="text-xs text-slate-500">{load} Waiting (~{avgWait}m)</span>
                                                 </div>
                                                 <Button size="sm" onClick={() => handleBookDoctor(doc.id)}>Book Visit</Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {currentClinic.doctors.filter(d => d.name.toLowerCase().includes(doctorSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <FilterX className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                                        <p className="text-sm">No doctors match your filters</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* OVERVIEW TAB */}
                        {detailsTab === 'OVERVIEW' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-2">About Hospital</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {currentClinic.name} is a premier healthcare facility committed to providing high-quality medical care. 
                                        Equipped with modern technology and staffed by experienced professionals, we ensure patient comfort and recovery.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 mb-3">Amenities & Facilities</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {getFacilities(currentClinic.name).map(fac => (
                                            <div key={fac} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700">
                                                <CheckCircle className="h-4 w-4 text-primary-500" />
                                                {fac}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                     <h4 className="font-bold text-slate-900 mb-3">Location</h4>
                                     <div className="bg-slate-200 h-40 w-full rounded-xl flex items-center justify-center relative overflow-hidden">
                                          <MapPin className="h-8 w-8 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
                                          <div className="absolute inset-0 opacity-50 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Google_Maps_Logo_2020.svg/2275px-Google_Maps_Logo_2020.svg.png')] bg-cover bg-center grayscale"></div>
                                          <Button variant="secondary" size="sm" className="absolute bottom-4 bg-white shadow-lg" onClick={() => handleGetDirections(currentClinic)}>
                                              <Navigation className="h-3 w-3 mr-2" /> Get Directions
                                          </Button>
                                     </div>
                                     <p className="text-xs text-slate-500 mt-2 text-center">{currentClinic.address}</p>
                                </div>
                            </div>
                        )}

                         {/* REVIEWS TAB */}
                         {detailsTab === 'REVIEWS' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-slate-900">{getRandomRating(currentClinic.id)}</div>
                                        <div className="flex text-yellow-400 gap-0.5 justify-center mb-1">
                                            <Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current opacity-50" />
                                        </div>
                                        <div className="text-[10px] text-slate-400">{getRandomReviewCount(currentClinic.id)} Verified Reviews</div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {[5,4,3,2,1].map((n, i) => (
                                            <div key={n} className="flex items-center gap-2 text-[10px]">
                                                <span className="w-2 font-bold text-slate-400">{n}</span>
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="bg-primary-500 h-full rounded-full" style={{ width: `${80 - (i * 15)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {[1,2,3].map((r) => (
                                        <div key={r} className="bg-white p-4 rounded-xl border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">S{r}</div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">Suresh K.</div>
                                                        <div className="text-[10px] text-slate-400">2 days ago • Verified Patient</div>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-400 gap-0.5"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                "Excellent service by the doctor. The queue management app made it so easy, I didn't have to wait in the crowd."
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            )}

            {/* VIEW: BOOKING FORM */}
            {activeTab === 'NEW' && selectedClinicId && bookingView === 'BOOKING_FORM' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 pt-4 px-4">
                    <div className="flex justify-center gap-4 mb-6">
                        <button 
                            type="button" 
                            onClick={() => setIsAppointmentMode(false)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-colors ${!isAppointmentMode ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                            <Ticket className="h-4 w-4" /> Walk-In
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsAppointmentMode(true)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-colors ${isAppointmentMode ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                            <CalendarCheck className="h-4 w-4" /> Appointment
                        </button>
                    </div>

                    <Card className="p-6">
                        <form onSubmit={handleGetToken} className="space-y-5">
                             
                             {/* Patient Selector */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Who is this for?</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => selectPatient('myself')}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedMemberId === 'myself' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        Myself ({userProfileName.split(' ')[0]})
                                    </button>
                                    {familyMembers.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => selectPatient('member', m.id)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedMemberId === m.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                        >
                                            {m.name} ({m.relation})
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => selectPatient('new')}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all ${selectedMemberId === 'custom' ? 'bg-slate-100 text-slate-900 border-slate-400' : 'bg-white text-slate-400 border-slate-300'}`}
                                    >
                                        + Other
                                    </button>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <Input 
                                    label="Full Name"
                                    placeholder="e.g. Rahul Verma"
                                    value={newName}
                                    onChange={(e) => { setNewName(e.target.value); setSelectedMemberId('custom'); }}
                                    required
                                />
                                <Input 
                                    label="Phone Number"
                                    placeholder="10 digit mobile"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Age"
                                        type="number"
                                        placeholder="25"
                                        value={newAge}
                                        onChange={(e) => setNewAge(e.target.value)}
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                        <select 
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={newGender}
                                            onChange={(e) => setNewGender(e.target.value as any)}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <Input 
                                    label="Reason for Visit / Symptoms"
                                    placeholder="e.g. Fever, Headache"
                                    value={newSymptoms}
                                    onChange={(e) => setNewSymptoms(e.target.value)}
                                />
                             </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                                <select 
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedDocId}
                                    onChange={(e) => { setSelectedDocId(e.target.value); setSelectedSlot(''); }}
                                    required
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {currentClinic?.doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            {/* CALENDAR & SLOTS */}
                            {isAppointmentMode && selectedDocId && (
                                <div className="animate-in fade-in space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-slate-800">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronRight className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-xs font-bold text-slate-400">{d}</span>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {renderCalendar()}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-700">Available Slots</label>
                                            {scheduleStatus.workingHours && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {scheduleStatus.workingHours}
                                                </span>
                                            )}
                                        </div>
                                        {scheduleStatus.shiftStarted ? (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                                <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-orange-800">Booking Closed for Today</p>
                                                <p className="text-xs text-orange-600 mt-1">Doctor's shift started. Use Walk-In.</p>
                                            </div>
                                        ) : scheduleStatus.isOff ? (
                                            <div className="p-4 bg-slate-100 rounded-lg text-center text-slate-500 text-sm">Doctor is OFF.</div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`px-2 py-2 text-sm rounded border transition-all ${selectedSlot === slot ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}
                                                    >
                                                        {slot}
                                                    </button>
                                                )) : (
                                                    <p className="col-span-3 text-sm text-slate-500 text-center py-4 bg-slate-50 rounded italic">No slots available.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className={`w-full mt-4 h-12 text-lg shadow-lg ${isAppointmentMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'shadow-primary-200'}`} 
                                disabled={isAppointmentMode && (!selectedSlot || !selectedDocId)}
                            >
                                {isAppointmentMode ? 'Confirm Appointment' : 'Get Token Now'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* VIEW: ACTIVE TOKENS */}
            {activeTab === 'ACTIVE' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 px-4 pt-4">
                    {!userPhone && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg"><p className="text-sm text-yellow-800">Please re-login.</p></div>}
                    {activeVisits.length > 0 ? activeVisits.map((visit) => {
                            const queueInfo = getQueueInfoForVisit(visit);
                            const isAppt = visit.visitType === 'APPOINTMENT';
                            const apptTime = isAppt && visit.appointmentDate && visit.appointmentTime ? parseAppointmentDateTime(visit.appointmentDate, visit.appointmentTime) : null;
                            const existingReminder = reminders.find(r => r.id === visit.id && !r.sent);
                            const isWithDoctor = visit.status === PatientStatus.WITH_DOCTOR;

                            return (
                                <Card key={visit.id} className={`p-6 border-t-4 relative overflow-hidden mb-4 ${visit.isEmergency ? 'border-t-orange-500' : isAppt ? 'border-t-purple-500' : 'border-t-primary-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                            <p className="text-sm font-semibold text-primary-700 flex items-center gap-1"><User className="h-3 w-3" /> {visit.name}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge status={visit.status} />
                                            {visit.isCheckedIn && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle className="h-3 w-3"/> CHECKED IN</span>}
                                        </div>
                                    </div>
                                    <div className="text-center mb-6 relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{visit.isEmergency ? 'Emergency Token' : isAppt ? 'Appointment Token' : 'Walk-in Token'}</p>
                                        <div className={`text-5xl font-black mt-2 break-all ${visit.isEmergency ? 'text-orange-500' : isAppt ? 'text-purple-600' : 'text-primary-600'}`}>#{visit.tokenNumber}</div>
                                        {isAppt && <span className="inline-block mt-2 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">{visit.appointmentDate} @ {visit.appointmentTime}</span>}
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-full text-slate-600"><MapPin className="h-5 w-5" /></div>
                                                <div><p className="text-xs text-slate-500">Doctor</p><p className="font-medium text-slate-900">{visit.doctorName}</p></div>
                                            </div>
                                            <div className="text-right"><p className="text-xs text-slate-500">Room</p><p className="font-bold text-slate-900">{visit.doctorRoom}</p></div>
                                        </div>
                                        {isAppt && apptTime && apptTime > Date.now() && visit.status === PatientStatus.WAITING && (
                                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">{existingReminder ? <BellRing className="h-3 w-3 text-purple-600" /> : <Bell className="h-3 w-3" />} Reminder</div>
                                                {existingReminder ? (
                                                     <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded-lg"><span className="text-xs text-purple-700 font-medium">{existingReminder.minutesBefore}m before</span><button onClick={() => handleRemoveReminder(visit.id)} className="text-slate-400 hover:text-red-500"><BellOff className="h-3 w-3" /></button></div>
                                                ) : (
                                                     <div className="flex gap-1"><button onClick={() => handleSetReminder(visit.id, apptTime, 15, visit.doctorName)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded">15m</button><button onClick={() => handleSetReminder(visit.id, apptTime, 30, visit.doctorName)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded">30m</button></div>
                                                )}
                                            </div>
                                        )}
                                        {visit.status === PatientStatus.WAITING && queueInfo && (
                                            <>
                                            {queueInfo.doctorDelay > 0 && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5" /> <div><strong>Doctor Delayed</strong><br/>Running {queueInfo.doctorDelay} mins late.</div></div>}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 text-center bg-slate-800 text-white rounded-lg"><div className="text-2xl font-bold mb-1">{queueInfo.position}</div><p className="text-xs opacity-70 font-medium">People Ahead</p></div>
                                                <div className="p-3 text-center bg-white border border-slate-200 rounded-lg"><div className="text-2xl font-bold text-slate-900 mb-1">{queueInfo.estWait}<span className="text-sm font-normal text-slate-400">min</span></div><p className="text-xs text-slate-500 font-medium">Est. Wait Time</p></div>
                                            </div>
                                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm text-center font-medium border border-blue-100">{queueInfo.statusMsg}</div>
                                            </>
                                        )}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                            <button onClick={() => handleGetDirections(visit as Clinic)} className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"><MapIcon className="h-4 w-4" /> Get Directions</button>
                                            <button onClick={(e) => handleCancelClick(e, visit.clinicId, visit.id, visit.name)} disabled={isWithDoctor} className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg ${isWithDoctor ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}><XCircle className="h-4 w-4" /> Cancel</button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        }) : !manualSearchError && <div className="text-center py-8 text-slate-400">No active tokens found.</div>}

                    {/* MANUAL SEARCH FALLBACK */}
                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Search className="h-4 w-4" /> Track by ID (Manual)</h4>
                        <Card className="p-6 bg-white">
                            {searchedPatient ? (
                                <div><div className="flex justify-between items-center mb-4"><h3 className="font-bold">{searchedPatient.clinicName}</h3><button onClick={() => setSearchedPatient(null)} className="text-xs text-red-500 hover:underline">Clear</button></div><div className="text-center mb-4"><div className="text-4xl font-bold text-slate-800">#{searchedPatient.tokenNumber}</div><Badge status={searchedPatient.status} /></div></div>
                            ) : (
                                <form onSubmit={handleManualSearch} className="flex gap-2 w-full"><Input placeholder="Token #" type="number" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} required /><Button type="submit" variant="secondary">Track</Button></form>
                            )}
                            {manualSearchError && <p className="text-red-500 text-sm mt-2">{manualSearchError}</p>}
                        </Card>
                    </div>
                </div>
            )}

            {/* VIEW: HISTORY */}
            {activeTab === 'HISTORY' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 px-4 pt-4">
                     {!userPhone && <div className="text-center p-8 text-slate-400">Session error. Please re-login.</div>}
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start"><Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" /><div className="text-xs text-blue-800"><p className="font-bold">Showing history linked to {userPhone}</p></div></div>
                     {historyVisits.length > 0 ? historyVisits.map((visit) => {
                             const isAppt = visit.visitType === 'APPOINTMENT';
                             return (
                             <Card key={visit.id} className="p-0 overflow-hidden border border-slate-200 flex flex-col">
                                 <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center"><div className="flex items-center gap-3"><div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-500"><Building className="h-5 w-5" /></div><div><h3 className="font-bold text-slate-900 text-sm">{visit.clinicName}</h3><div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3 w-3" />{new Date(visit.timeAdded).toLocaleDateString()}</div></div></div><Badge status={visit.status} /></div>
                                 <div className="p-4"><div className="flex justify-between items-start mb-4"><div><div className="flex items-center gap-2 text-sm text-slate-900 font-bold mb-1"><User className="h-4 w-4 text-primary-600" />{visit.doctorName}</div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAppt ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{isAppt ? 'APPOINTMENT' : 'WALK-IN'}</span></div></div>
                                     {visit.notes && <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-4"><div className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 uppercase mb-1"><FileText className="h-3 w-3" /> Consultation Notes</div><p className="text-xs text-slate-700 italic">"{visit.notes}"</p></div>}
                                     {visit.status === PatientStatus.COMPLETED && (<div className="mb-4">{!visit.rating ? (<div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">Rate:</span>{[1,2,3,4,5].map(star => (<button key={star} onClick={() => handleRateVisit(visit.id, star)} className="text-slate-300 hover:text-yellow-400"><Star className="h-5 w-5 fill-current" /></button>))}</div>) : (<div className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4 fill-current" /><span className="text-xs text-slate-400 ml-2">Rated</span></div>)}</div>)}
                                     <Button variant="secondary" size="sm" className="w-full" onClick={() => handleBookAgain(visit.clinicId, visit.doctorId)}><RefreshCcw className="h-3 w-3 mr-2" /> Book Again</Button>
                                 </div>
                             </Card>
                         )}) : <div className="text-center py-12"><History className="h-12 w-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">No past visits found.</p></div>}
                 </div>
            )}

            {/* VIEW: PROFILE */}
            {activeTab === 'PROFILE' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 px-4 pt-4">
                     <Card className="p-6"><h3 className="font-bold text-lg mb-4">My Details</h3><div className="space-y-4"><Input label="My Name" value={userProfileName} onChange={(e) => handleUpdateProfile(e.target.value)} /><Input label="Phone" value={userPhone} disabled /></div></Card>
                     <div className="space-y-3"><h3 className="font-bold text-lg px-1">Family Members</h3>{familyMembers.map((member) => (<div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between shadow-sm"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">{member.name[0]}</div><div><div className="font-bold text-slate-900">{member.name}</div><div className="text-xs text-slate-500">{member.relation}</div></div></div><button onClick={() => removeFamilyMember(member.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-5 w-5" /></button></div>))}
                         <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = fd.get('n') as string; const rel = fd.get('r') as string; const age = fd.get('a') as string; const gen = fd.get('g'); if(name && rel) { addFamilyMember(name, rel, age, gen); (e.target as HTMLFormElement).reset(); }}} className="bg-slate-50 p-4 rounded-xl mt-4"><h4 className="text-sm font-bold mb-3">Add Member</h4><div className="space-y-3"><div className="flex gap-2"><input name="n" placeholder="Name" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" required /><input name="r" placeholder="Relation" className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm" required /></div><div className="flex gap-2"><input name="a" type="number" placeholder="Age" className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm" required /><select name="g" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="Male">Male</option><option value="Female">Female</option></select></div><Button type="submit" size="sm" variant="secondary" className="w-full"><Plus className="h-4 w-4 mr-2" /> Add</Button></div></form>
                     </div>
                 </div>
            )}
        </main>
        
        {/* PERSISTENT BOTTOM NAVIGATION (VISIBLE EVERYWHERE) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pt-2 pb-6 px-6 flex justify-around max-w-md mx-auto z-50 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
            <button 
                onClick={() => { setActiveTab('NEW'); if (selectedClinicId) { /* Optional: Reset view on double tap? */ } }} 
                className={`flex flex-col items-center transition-all ${activeTab === 'NEW' ? 'text-primary-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className={`px-4 py-1 mb-1 rounded-full ${activeTab === 'NEW' ? 'bg-primary-50' : ''}`}>
                    <Building className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold">Find Care</span>
            </button>
            <button 
                onClick={() => setActiveTab('ACTIVE')} 
                className={`flex flex-col items-center transition-all ${activeTab === 'ACTIVE' ? 'text-primary-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className={`px-4 py-1 mb-1 rounded-full ${activeTab === 'ACTIVE' ? 'bg-primary-50' : ''}`}>
                    <Activity className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold">Active</span>
            </button>
            <button 
                onClick={() => setActiveTab('HISTORY')} 
                className={`flex flex-col items-center transition-all ${activeTab === 'HISTORY' ? 'text-primary-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
                 <div className={`px-4 py-1 mb-1 rounded-full ${activeTab === 'HISTORY' ? 'bg-primary-50' : ''}`}>
                    <History className="h-6 w-6" />
                 </div>
                <span className="text-[10px] font-bold">History</span>
            </button>
        </div>
    </div>
  );
};
