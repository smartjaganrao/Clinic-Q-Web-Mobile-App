
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useMatch, useLocation } from 'react-router-dom';
import { Clinic, Patient, PatientStatus, DoctorStatus, Doctor, ClinicOperationMode } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';
// Imported Modules
import { ClinicCard } from '../features/patient/components/ClinicCard';
import { DoctorSearchCard } from '../features/patient/components/DoctorSearchCard'; // New Import
import { MapPanel } from '../features/patient/components/MapPanel';
import { DoctorProfileModal } from '../features/patient/components/DoctorProfileModal';
import { Modal } from '../components/Modal';
import L from 'leaflet';

import { 
    ArrowLeft, MapPin, Search, Calendar, QrCode, 
    AlertTriangle, Star, Clock, Filter, Stethoscope, Smile, 
    Baby, Heart, Activity, Sparkles, LayoutGrid, Eye, Ear, 
    Navigation, Timer, Building2, 
    Info, Lock, History, X, AlertCircle, Sun, Moon,
    User, Users, Plus, LogOut, Coffee, LogIn, CloudSun, List as ListIcon, Crosshair, Zap, ExternalLink, ShieldCheck,
    CheckCircle2, Globe, Edit2, Trash2, Footprints, ChevronRight, FileText, MoonStar, MessageSquare
} from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  isGuest?: boolean;
  onLoginClick?: (phone?: string, name?: string) => void;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void;
  onCancelVisit: (clinicId: string, pId: string) => void;
  onCheckIn: (clinicId: string, pId: string) => void;
  preSelectedClinicId?: string;
  onClearPendingAction: () => void;
  initialSearchMode?: 'DOCTOR' | 'CLINIC'; // New Prop
}

// --- HELPER FUNCTIONS ---

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const isClinicOpen = (hours?: string) => {
    if (!hours) return false;
    if (hours.toLowerCase() === '24 hours') return true;
    try {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startStr, endStr] = hours.split('-').map(s => s.trim());
        if (!startStr || !endStr) return false;
        const parseToMins = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return null;
            let [_, h, m, p] = match;
            let hour = parseInt(h);
            const min = parseInt(m);
            const isPm = p.toUpperCase() === 'PM';
            if (isPm && hour !== 12) hour += 12;
            if (!isPm && hour === 12) hour = 0;
            return hour * 60 + min;
        };
        const startMins = parseToMins(startStr);
        const endMins = parseToMins(endStr);
        if (startMins === null || endMins === null) return false;
        return currentMins >= startMins && currentMins <= endMins;
    } catch (e) {
        return false;
    }
};

const getNextAvailability = (doctor: Doctor, daysToCheck: number = 14): { status: 'now' | 'future', start: Date } | null => {
    const now = new Date();
    if (doctor.status === DoctorStatus.AVAILABLE) { 
         const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
         const schedule = doctor.weeklySchedule.find((s) => s.day === dayName);
         if (schedule && !schedule.isOff && schedule.slots) {
             const currentMins = now.getHours() * 60 + now.getMinutes();
             const inSlot = schedule.slots.some((slot) => {
                 if (slot.active === false) return false;
                 const [sh, sm] = slot.startTime.split(':').map(Number);
                 const [eh, em] = slot.endTime.split(':').map(Number);
                 const s = sh * 60 + sm;
                 let e = eh * 60 + em;
                 if (e <= s) e += 24 * 60; 
                 return currentMins >= s && currentMins < e;
             });
             if (inSlot) return { status: 'now', start: now };
         }
    }
    for (let i = 0; i < daysToCheck; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = doctor.weeklySchedule.find((s) => s.day === dayName);
        if (schedule && !schedule.isOff && schedule.slots && schedule.slots.length > 0) {
            const slots = [...schedule.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
            for (const slot of slots) {
                if (slot.active === false) continue;
                const [sh, sm] = slot.startTime.split(':').map(Number);
                const slotStart = new Date(d);
                slotStart.setHours(sh, sm, 0, 0);
                if (slotStart > now) {
                    return { status: 'future', start: slotStart };
                }
            }
        }
    }
    return null;
};

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

const RELATIONSHIP_OPTIONS = [
    "Mother", "Father", "Husband", "Wife", "Son", "Daughter", 
    "Brother", "Sister", "Grandfather", "Grandmother", "Friend"
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

interface GroupedSlots {
    Morning: {value: string, label: string}[];
    Afternoon: {value: string, label: string}[];
    Evening: {value: string, label: string}[];
    Night: {value: string, label: string}[];
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
  clinics, userPhone, userName, isGuest, onLoginClick, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit, onCheckIn, preSelectedClinicId, onClearPendingAction, initialSearchMode
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ROUTER-DRIVEN STATE (Derived from URL)
  // Route Structure:
  // - /patient/find (default)
  // - /patient/find/clinic/:clinicId
  // - /patient/find/clinic/:clinicId/book/:doctorId
  // - /patient/visits (active)
  // - /patient/history
  // - /patient/profile

  // Use useMatch to parse route params manually since this component is rendered on wildcard parent
  const matchBook = useMatch('/patient/find/clinic/:clinicId/book/:doctorId');
  const matchClinic = useMatch('/patient/find/clinic/:clinicId');
  const matchActive = useMatch('/patient/visits');
  const matchHistory = useMatch('/patient/history');
  const matchProfile = useMatch('/patient/profile');
  const matchFind = useMatch('/patient/find');

  // Derive State from Routes
  const activeTab = useMemo<'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE'>(() => {
    if (matchActive) return 'ACTIVE';
    if (matchHistory) return 'HISTORY';
    if (matchProfile) return 'PROFILE';
    return 'BOOK'; // Default fallback
  }, [matchActive, matchHistory, matchProfile]);

  const bookingView = useMemo<'LIST' | 'CLINIC_DETAILS' | 'FORM'>(() => {
    if (matchBook) return 'FORM';
    if (matchClinic) return 'CLINIC_DETAILS';
    return 'LIST';
  }, [matchBook, matchClinic]);

  const selectedClinicId = matchBook?.params.clinicId || matchClinic?.params.clinicId || null;
  const selectedDoctorId = matchBook?.params.doctorId || null;

  // Handle Redirect on Mount if needed
  useEffect(() => {
      // If we are at root /patient, redirect to find
      if (location.pathname === '/patient' || location.pathname === '/patient/') {
          navigate('/patient/find', { replace: true });
      }
  }, [location.pathname, navigate]);

  // Handle Pre-selected ID (e.g. from QR Scan)
  useEffect(() => { 
      if (preSelectedClinicId) { 
          // Use router navigation instead of state
          navigate(`/patient/find/clinic/${preSelectedClinicId}`);
          onClearPendingAction(); 
          const clinic = clinics.find(c => c.id === preSelectedClinicId); 
          if (clinic) { setSelectedCity(clinic.city); } 
      } 
  }, [preSelectedClinicId, clinics, onClearPendingAction, navigate]);

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'DOCTOR' | 'CLINIC'>(initialSearchMode || 'CLINIC');

  // FILTERS STATE
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'NEAR' | 'WAIT' | 'FEE'>('NEAR');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isCustomRelation, setIsCustomRelation] = useState(false); // State for custom relation input
  
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [travelTime, setTravelTime] = useState('15'); 
  const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF'); 
  
  // MAP STATE
  const [showMap, setShowMap] = useState(true); 
  const clinicCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedClinicId, setHighlightedClinicId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false); // New state for manual pin mode
  
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState('Male');

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; visit: any | null }>({ isOpen: false, visit: null });
  const [showLateWarningModal, setShowLateWarningModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // DOCTOR PROFILE MODAL STATE
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);

  // FEEDBACK STATE
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; visit: any | null; rating: number; text: string }>({ isOpen: false, visit: null, rating: 0, text: '' });

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);
  const selectedDoctor = selectedClinic?.doctors.find(d => d.id === selectedDoctorId);

  // Navigation Helpers
  const navigateToView = (view: 'LIST' | 'CLINIC_DETAILS' | 'FORM', clinicId: string | null, doctorId?: string) => {
      if (view === 'LIST') navigate('/patient/find');
      else if (view === 'CLINIC_DETAILS' && clinicId) navigate(`/patient/find/clinic/${clinicId}`);
      else if (view === 'FORM' && clinicId && doctorId) navigate(`/patient/find/clinic/${clinicId}/book/${doctorId}`);
  };

  const handleTabSwitch = (newTab: 'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE') => {
      if (newTab === 'ACTIVE') navigate('/patient/visits');
      else if (newTab === 'HISTORY') navigate('/patient/history');
      else if (newTab === 'PROFILE') navigate('/patient/profile');
      else navigate('/patient/find');
  };

  const handleUIBack = () => {
      // Logic to go back one level
      if (bookingView === 'FORM') {
           navigate(`/patient/find/clinic/${selectedClinicId}`);
      } else if (bookingView === 'CLINIC_DETAILS') {
           navigate('/patient/find');
      } else {
          onBack();
      }
  };

  // Get clinic associated with viewing doctor (needed for finding operation mode)
  const viewingDoctorClinic = useMemo(() => {
      if (!viewingDoctor) return undefined;
      // If we are already in a clinic context (selectedClinicId), use that
      if (selectedClinicId) return clinics.find(c => c.id === selectedClinicId);
      // Otherwise find the clinic this doctor belongs to
      return clinics.find(c => c.doctors.some(d => d.id === viewingDoctor.id));
  }, [viewingDoctor, selectedClinicId, clinics]);

  // --- TRAVEL TIME ESTIMATE ---
  const travelEstimate = useMemo(() => {
      if (userLocation && selectedClinic?.geoLocation) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng);
          // Heuristic: 2 mins per km (30km/h average city speed) + 5 mins buffer for parking/walking
          const mins = Math.ceil(dist * 2 + 5);
          return { dist: dist.toFixed(1), mins };
      }
      return null;
  }, [userLocation, selectedClinic]);

  // Use travel estimate as default if available
  useEffect(() => {
      if (travelEstimate) {
          // Find closest bucket
          const mins = travelEstimate.mins;
          if (mins <= 10) setTravelTime('5');
          else if (mins <= 20) setTravelTime('15');
          else if (mins <= 40) setTravelTime('30');
          else if (mins <= 55) setTravelTime('45');
          else setTravelTime('60');
      }
  }, [travelEstimate]);

  useEffect(() => {
      if (isGuest) return; 
      try {
          const saved = localStorage.getItem(`clinicq_patient_${userPhone}`);
          if (saved) setUserProfile(JSON.parse(saved));
          else {
              const defaultProfile = { name: userName, phone: userPhone, age: '', gender: '', familyMembers: [] };
              setUserProfile(defaultProfile);
              localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(defaultProfile));
          }
      } catch (e) { console.error("Profile load error", e); }
  }, [userPhone, userName, isGuest]);

  const handleAddMember = () => { if (!newMember.name || !newMember.age || !newMember.relation) { addToast("Please fill all details", "error"); return; } if (userProfile) { let updatedMembers = [...(userProfile.familyMembers || [])]; if (editingMemberIndex !== null) { updatedMembers[editingMemberIndex] = newMember; addToast("Family member updated!", "success"); } else { updatedMembers.push(newMember); addToast("Family member added!", "success"); } const updatedProfile = { ...userProfile, familyMembers: updatedMembers }; setUserProfile(updatedProfile); localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile)); if (activeTab === 'BOOK' && bookingView === 'FORM') { setBookingFor(newMember.name); } setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setEditingMemberIndex(null); setShowAddMember(false); } };
  
  const handleEditMember = (index: number) => { 
      if (userProfile && userProfile.familyMembers[index]) { 
          const member = userProfile.familyMembers[index];
          setNewMember(member); 
          setEditingMemberIndex(index);
          setIsCustomRelation(!RELATIONSHIP_OPTIONS.includes(member.relation));
          setShowAddMember(true); 
      } 
  };
  
  const handleDeleteMember = (index: number) => { if (userProfile && window.confirm("Remove this family member?")) { const updatedMembers = userProfile.familyMembers.filter((_, i) => i !== index); const updatedProfile = { ...userProfile, familyMembers: updatedMembers }; setUserProfile(updatedProfile); localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile)); addToast("Family member removed.", "info"); } };
  
  // --- DERIVED DATA FOR FILTERS ---
  const uniqueCities = useMemo(() => ['All Cities', ...Array.from(new Set(clinics.map(c => c.city))).sort()], [clinics]);
  
  const uniqueSpecialties = useMemo(() => {
      const set = new Set<string>();
      clinics.forEach(c => c.doctors.forEach(d => set.add(d.specialty)));
      return ['All Specialties', ...Array.from(set).sort()];
  }, [clinics]);

  const activeVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', room: doc?.roomNumber || '-' }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  const historyVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', notes: p.notes }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  
  // --- FILTERING LOGIC ---
  const filteredClinics = useMemo(() => { 
      let filtered = clinics; 
      if (searchQuery) { 
          const q = searchQuery.toLowerCase(); 
          const matchedTypes: string[] = []; 
          Object.keys(SYMPTOM_MAP).forEach(key => { if (q.includes(key)) matchedTypes.push(...SYMPTOM_MAP[key]); }); 
          
          filtered = filtered.filter(c => 
              c.name.toLowerCase().includes(q) || 
              c.city.toLowerCase().includes(q) || 
              c.doctors.some(d => d.specialty.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)) || 
              (matchedTypes.length > 0 && c.type && matchedTypes.includes(c.type))
          ); 
      }
      if (selectedCity !== 'All Cities') {
          filtered = filtered.filter(c => c.city === selectedCity);
      }
      if (selectedSpecialty !== 'All Specialties') {
          filtered = filtered.filter(c => c.doctors.some(d => d.specialty === selectedSpecialty));
      }
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
      if (showOpenOnly) {
          filtered = filtered.filter(c => isClinicOpen(c.operatingHours));
      }
      return filtered.sort((a, b) => {
          if (sortBy === 'NEAR' && userLocation) {
              const distA = a.geoLocation ? calculateDistance(userLocation.lat, userLocation.lng, a.geoLocation.lat, a.geoLocation.lng) : 99999;
              const distB = b.geoLocation ? calculateDistance(userLocation.lat, userLocation.lng, b.geoLocation.lat, b.geoLocation.lng) : 99999;
              return distA - distB;
          }
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
          return 0; // Default order
      }); 
  }, [clinics, searchQuery, selectedCategory, sortBy, selectedCity, selectedSpecialty, userLocation, showOpenOnly]);

  // --- DOCTOR SEARCH FILTERING (FLATTENED LIST) ---
  const filteredDoctors = useMemo(() => {
      // Step 1: Flatten ALL doctors from all clinics
      const allDoctors = clinics.flatMap(clinic => clinic.doctors.map(doctor => ({ doctor, clinic })));

      // Step 2: Apply Filters
      return allDoctors.filter(({ doctor, clinic }) => {
          const q = searchQuery.toLowerCase();
          
          // Search Logic
          if (q) {
              const matchesName = doctor.name.toLowerCase().includes(q);
              const matchesSpecialty = doctor.specialty.toLowerCase().includes(q);
              const matchesClinic = clinic.name.toLowerCase().includes(q);
              const matchesCity = clinic.city.toLowerCase().includes(q);
              
              if (!matchesName && !matchesSpecialty && !matchesClinic && !matchesCity) return false;
          }

          // City Logic
          if (selectedCity !== 'All Cities' && clinic.city !== selectedCity) return false;

          // Specialty Logic
          if (selectedSpecialty !== 'All Specialties' && doctor.specialty !== selectedSpecialty) return false;

          // Category Logic
          if (selectedCategory !== 'ALL') {
              const cat = selectedCategory.toLowerCase();
              if (cat === 'dental' && !doctor.specialty.toLowerCase().includes('dent')) return false;
              else if (cat === 'pediatric' && !doctor.specialty.toLowerCase().includes('pedia')) return false;
              // ... can expand per strict definition, but simpler is often better for filtering
          }

          return true;
      }).sort((a, b) => {
          // Sort Logic
          if (sortBy === 'NEAR' && userLocation && a.clinic.geoLocation && b.clinic.geoLocation) {
              const distA = calculateDistance(userLocation.lat, userLocation.lng, a.clinic.geoLocation.lat, a.clinic.geoLocation.lng);
              const distB = calculateDistance(userLocation.lat, userLocation.lng, b.clinic.geoLocation.lat, b.clinic.geoLocation.lng);
              return distA - distB;
          }
          if (sortBy === 'FEE') return a.doctor.consultationFee - b.doctor.consultationFee;
          // Default to rating/relevance
          return b.doctor.rating - a.doctor.rating;
      });
  }, [clinics, searchQuery, selectedCity, selectedSpecialty, selectedCategory, sortBy, userLocation]);


  // --- SMART DOCTOR-SPECIFIC WAIT LOGIC ---
  const getDoctorWaitDetails = (clinic: Clinic, doctorId: string) => {
      const doc = clinic.doctors.find(d => d.id === doctorId);
      if (!doc) return { count: 0, time: 0 };
      const physicalQueue = clinic.patients.filter(p => p.doctorId === doctorId && p.status === PatientStatus.WAITING);
      let waitMinutes = physicalQueue.length * 15;
      waitMinutes += (doc.delayMinutes || 0);
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];
      const lookAheadWindow = Math.max(waitMinutes + 30, 60);
      const upcomingAppointments = clinic.patients.filter(p => {
          if (p.doctorId !== doctorId) return false;
          if (p.visitType !== 'APPOINTMENT') return false;
          if (p.status === PatientStatus.CANCELLED || p.status === PatientStatus.COMPLETED || p.status === PatientStatus.WITH_DOCTOR) return false;
          if (p.status === PatientStatus.WAITING) return false;
          if (p.appointmentDate !== todayStr) return false;
          if (!p.appointmentTime) return false;
          const [h, m] = p.appointmentTime.split(':').map(Number);
          const apptMins = h * 60 + m;
          return apptMins > currentMins && apptMins <= (currentMins + lookAheadWindow);
      });
      waitMinutes += (upcomingAppointments.length * 15);
      const totalCount = physicalQueue.length + upcomingAppointments.length;
      return { count: totalCount, time: waitMinutes };
  };

  const getClinicWaitStats = (clinic: Clinic) => {
      let relevantDoctors = clinic.doctors;
      if (selectedCategory !== 'ALL') {
          // ... (Existing category filter logic)
          const term = selectedCategory.toLowerCase();
          if (term === 'dental') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (term === 'pediatric') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('pedia'));
          // ... (truncated for brevity, same logic as before)
          else if (term === 'ent') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('ent'));
          
          if (relevantDoctors.length === 0) relevantDoctors = clinic.doctors;
      }

      if (relevantDoctors.length === 0) {
          return { 
              min: 0, 
              max: 0, 
              label: 'No Doctors', 
              bgColor: 'bg-slate-100', 
              textColor: 'text-slate-500', 
              borderColor: 'border-slate-200', 
              raw: '0', 
              mapColor: 'bg-slate-500', 
              peopleCount: '0', 
              dotColor: 'bg-slate-400' 
          };
      }

      // Calculate total wait times
      const waitTimes = relevantDoctors.map(d => getDoctorWaitDetails(clinic, d.id));
      const times = waitTimes.map(w => w.time);
      const counts = waitTimes.map(w => w.count);
      
      const min = Math.min(...times);
      const max = Math.max(...times);
      const minPeople = Math.min(...counts);
      const maxPeople = Math.max(...counts);
      
      const avg = (min + max) / 2;
      
      // UPDATED VISUAL INDICATORS
      let color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      let mapColor = 'bg-emerald-500';
      let label = 'Fast Moving';
      let dotColor = 'bg-emerald-500';
      
      if (avg > 20) { 
          color = 'bg-amber-100 text-amber-800 border-amber-200'; 
          mapColor = 'bg-amber-500'; 
          label = 'Moderate Queue';
          dotColor = 'bg-amber-500';
      }
      if (avg > 45) { 
          color = 'bg-rose-100 text-rose-800 border-rose-200'; 
          mapColor = 'bg-rose-500'; 
          label = 'High Demand'; 
          dotColor = 'bg-rose-500';
      }

      const raw = min === max ? `${min}` : `${min}-${max}`;
      const peopleStr = minPeople === maxPeople ? `${minPeople}` : `${minPeople}-${maxPeople}`;
      
      return { 
          min, 
          max, 
          label, 
          bgColor: color.split(' ')[0], 
          textColor: color.split(' ')[1], 
          borderColor: color.split(' ')[2],
          raw, 
          mapColor, 
          peopleCount: peopleStr,
          dotColor
      };
  };

  const getFeeRange = (clinic: Clinic) => { if (!clinic.doctors.length) return 'N/A'; const fees = clinic.doctors.map(d => d.consultationFee); const min = Math.min(...fees); const max = Math.max(...fees); return min === max ? `₹${min}` : `₹${min} - ₹${max}`; };
  
  const getRelevantDoctors = (clinic: Clinic) => {
      let relevant = clinic.doctors;
      if (selectedSpecialty !== 'All Specialties') {
          relevant = relevant.filter(d => d.specialty === selectedSpecialty);
      } else if (selectedCategory !== 'ALL') {
          const cat = selectedCategory.toLowerCase();
          if (cat === 'dental') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (cat === 'pediatric') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('pedia'));
      }
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matched = relevant.filter(d => d.name.toLowerCase().includes(q));
          if (matched.length > 0) relevant = matched;
      }
      return relevant;
  };

  const getSmartQueueDetails = (visit: any) => { const clinic = clinics.find(c => c.id === visit.clinicId); const doctor = clinic?.doctors.find(d => d.id === visit.doctorId); if (!clinic || !doctor) return { peopleAhead: 0, waitTime: 0, currentToken: '-', message: 'Loading...', color: 'text-slate-500' }; const peopleAhead = clinic.patients.filter(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WAITING && p.timeAdded < visit.timeAdded ).length; const servingPatient = clinic.patients.find(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WITH_DOCTOR); const currentToken = servingPatient ? `#${servingPatient.tokenNumber}` : 'Not Started'; let baseWait = peopleAhead * 15; if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes; const now = new Date(); now.setMinutes(now.getMinutes() + baseWait); const expectedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); let message = `~${baseWait} mins wait`; let color = 'text-slate-600'; let bgColor = 'bg-slate-100'; if (doctor.status === DoctorStatus.ON_BREAK) { message = "Doctor is on break"; color = "text-orange-700"; bgColor = "bg-orange-100"; } else if (doctor.delayMinutes > 0) { message = `Delayed by ${doctor.delayMinutes} mins`; color = "text-red-700"; bgColor = "bg-red-100"; } else if (visit.isCheckedIn) { if (peopleAhead === 0) { message = "You are next! Get ready."; color = "text-green-700"; bgColor = "bg-green-100"; } else if (peopleAhead < 3) { message = "Almost your turn. Stay close."; color = "text-blue-700"; bgColor = "bg-blue-100"; } else { message = "Checked in. Relax in lobby."; color = "text-green-700"; bgColor = "bg-green-5"; } } else { if (peopleAhead < 3) { message = "Rush! Reaching your turn."; color = "text-red-700"; bgColor = "bg-red-100"; } else { message = "Start travelling to clinic."; color = "text-blue-700"; bgColor = "bg-blue-100"; } } return { peopleAhead, waitTime: baseWait, expectedTime, currentToken, message, color, bgColor, doctorStatus: doctor.status }; };
  
  useEffect(() => { let timer: ReturnType<typeof setTimeout>; if (showQRScanner) { timer = setTimeout(() => { if (clinics.length > 0) { let targetClinicId = selectedClinicId; if (!targetClinicId) { const visitNeedsCheckIn = activeVisits.find(v => !v.isCheckedIn && v.status === PatientStatus.WAITING); targetClinicId = visitNeedsCheckIn ? visitNeedsCheckIn.clinicId : clinics[0].id; } const activeVisit = activeVisits.find(v => v.clinicId === targetClinicId && v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED); if (activeVisit) { if (!activeVisit.isCheckedIn) { onCheckIn(targetClinicId!, activeVisit.id); addToast(`Checked in at ${activeVisit.clinicName}!`, "success"); } else { addToast(`Already checked in at ${activeVisit.clinicName}.`, "info"); } navigate('/patient/visits'); } else { if (targetClinicId) { navigateToView('CLINIC_DETAILS', targetClinicId); addToast("QR Detected. Loading clinic details...", "success"); } } setShowQRScanner(false); } }, 2000); } return () => clearTimeout(timer); }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn, addToast, navigate]);

  const submitBooking = (overrideName?: string, overridePhone?: string) => {
      let pName = overrideName || userName;
      let pPhone = overridePhone || userPhone;
      let pAge = isGuest ? guestAge : userProfile?.age;
      let pGender = isGuest ? guestGender : userProfile?.gender;
      if (!isGuest && bookingFor !== 'MYSELF') {
          const member = userProfile?.familyMembers.find(m => m.name === bookingFor);
          if (member) { pName = member.name; pAge = member.age; pGender = member.gender; }
      }
      const currentClinic = clinics.find(c => c.id === selectedClinicId);
      if (currentClinic) {
          const isDuplicate = currentClinic.patients.some(p => {
              const isSameUser = p.phone === pPhone && p.name.toLowerCase() === pName.toLowerCase();
              if (!isSameUser) return false;
              if (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR || p.status === PatientStatus.ON_HOLD) return true;
              if (visitType === 'APPOINTMENT' && p.visitType === 'APPOINTMENT' && p.appointmentDate === apptDate && p.status !== PatientStatus.CANCELLED && p.status !== PatientStatus.COMPLETED) return true;
              return false;
          });
          if (isDuplicate) { addToast(`Duplicate: ${pName} already has an active visit in this clinic.`, "error"); return; }
      }
      onGetToken(pName, pPhone, selectedDoctorId!, selectedClinicId!, visitType === 'APPOINTMENT' ? apptTime : undefined, visitType === 'APPOINTMENT' ? apptDate : undefined, pAge, pGender, symptoms);
      
      // Update state and history to jump to Active tab
      navigate('/patient/visits');
      setSymptoms(''); 
      setVisitType('WALK_IN'); 
      setApptDate(''); 
      setApptTime(''); 
      setBookingFor('MYSELF'); 
      setShowLateWarningModal(false); 
      setShowAuthModal(false);
      setViewingDoctor(null); // Close doctor profile if open
  };

  const handleBookToken = (e?: React.MouseEvent) => {
      e?.preventDefault();
      if (!selectedClinicId || !selectedDoctorId) return;
      if (isGuest) {
          if (!guestName.trim() || !guestAge) { addToast("Please enter your Name and Age", "error"); return; }
          setShowAuthModal(true); return;
      }
      const clinic = clinics.find(c => c.id === selectedClinicId);
      const waitDetails = clinic && selectedDoctorId ? getDoctorWaitDetails(clinic, selectedDoctorId) : { count: 0, time: 0 };
      const estimatedWaitMins = waitDetails.time;
      const travelMins = parseInt(travelTime) || 0;
      
      // Check for late arrival risks
      if (visitType === 'WALK_IN' && travelMins > estimatedWaitMins + 10) { 
          setShowLateWarningModal(true); 
          return; 
      }
      
      submitBooking();
  };

  const handleAuthSuccess = (phone: string, name: string, isExisting: boolean) => {
      if (onLoginClick) onLoginClick(phone, name);
      if (isExisting) { addToast(`Welcome back ${name}! Please confirm booking details.`, "info"); setShowAuthModal(false); } else { submitBooking(name, phone); }
  };

  const handleBookFromProfile = () => {
      setViewingDoctor(null); // Close modal
      if (!viewingDoctor) return;
      
      // Need to identify the clinic the doctor belongs to.
      const clinic = clinics.find(c => c.doctors.some(d => d.id === viewingDoctor.id));
      
      if (clinic) {
          // Set initial visit type based on mode
          if (clinic.operationMode === ClinicOperationMode.WALK_IN) {
              setVisitType('WALK_IN');
          } else {
              setVisitType('APPOINTMENT');
          }
          navigateToView('FORM', clinic.id, viewingDoctor.id);
      } else {
          addToast("Could not find clinic details", "error");
      }
  };

  const handleSubmitFeedback = () => {
      if (feedbackModal.visit) {
          onUpdateDetails(feedbackModal.visit.id, {
              rating: feedbackModal.rating,
              feedback: feedbackModal.text
          });
          addToast("Thank you for your feedback!", "success");
          setFeedbackModal({ isOpen: false, visit: null, rating: 0, text: '' });
      }
  };

  // Map Handlers (Delegated to MapPanel via Props, or used here for state)
  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) { addToast("Geolocation is not supported by your browser", "error"); setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setIsLocating(false);
            setSortBy('NEAR'); 
            setIsPickingLocation(false);
        },
        (error) => {
            console.error("Geolocation error details:", error);
            let msg = "Unable to retrieve location.";
            if (error.code === 1) msg = "Location permission denied. Allow access in settings.";
            else if (error.code === 2) msg = "Location unavailable. Check GPS/Network.";
            else if (error.code === 3) msg = "Location request timed out. Try again.";
            else if (error.message) msg = `Location error: ${error.message}`;
            addToast(msg, "error");
            setIsLocating(false);
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handleMarkerDragEnd = (latlng: L.LatLng) => { setUserLocation({ lat: latlng.lat, lng: latlng.lng }); setSortBy('NEAR'); addToast("Location updated!", "success"); };
  const handleMapSelection = (latlng: L.LatLng) => { setUserLocation({ lat: latlng.lat, lng: latlng.lng }); setIsPickingLocation(false); setSortBy('NEAR'); addToast("Location pinned!", "success"); };

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation && !selectedClinicId) return [userLocation.lat, userLocation.lng];
    if (selectedClinicId) { const c = clinics.find(cl => cl.id === selectedClinicId); if (c && c.geoLocation) return [c.geoLocation.lat, c.geoLocation.lng]; }
    if (filteredClinics.length > 0 && filteredClinics[0].geoLocation) { return [filteredClinics[0].geoLocation.lat, filteredClinics[0].geoLocation.lng]; }
    return [13.0850, 80.2100];
  }, [selectedClinicId, filteredClinics, userLocation]);

  const scrollToClinic = (clinicId: string) => {
    setHighlightedClinicId(clinicId);
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) { const element = clinicCardRefs.current[clinicId]; if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    setTimeout(() => { setHighlightedClinicId(null); }, 2000);
  };

  
  const waitStats = selectedClinic && selectedDoctorId ? getDoctorWaitDetails(selectedClinic, selectedDoctorId) : { count: 0, time: 0 };
  
  const isWalkInAllowed = useMemo(() => { 
      if (!selectedDoctor) return false; 
      const now = new Date(); 
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; 
      const today = days[now.getDay()]; 
      const schedule = selectedDoctor.weeklySchedule.find(s => s.day === today); 
      if (!schedule || schedule.isOff) return false; 
      const currentMins = now.getHours() * 60 + now.getMinutes(); 
      return schedule.slots.some(slot => { 
          if (slot.active === false) return false;
          const [startH, startM] = slot.startTime.split(':').map(Number); 
          const [endH, endM] = slot.endTime.split(':').map(Number); 
          const startMins = startH * 60 + startM; 
          let endMins = endH * 60 + endM;
          // Handle overnight wrap
          if (endMins <= startMins) endMins += 24 * 60;
          
          return currentMins >= startMins && currentMins < endMins; 
      }); 
  }, [selectedDoctor]);
  
  // Force visit type based on Clinic Mode
  useEffect(() => { 
      if (selectedClinicId) {
          const clinic = clinics.find(c => c.id === selectedClinicId);
          if (clinic) {
              if (clinic.operationMode === ClinicOperationMode.WALK_IN) {
                  setVisitType('WALK_IN');
              } else if (clinic.operationMode === ClinicOperationMode.APPOINTMENT) {
                  setVisitType('APPOINTMENT');
              } else if (selectedDoctorId && !isWalkInAllowed && visitType === 'WALK_IN') {
                  // Hybrid Logic: If Walk-in shift over, switch to appt
                  setVisitType('APPOINTMENT'); 
              }
          }
      }
  }, [selectedClinicId, selectedDoctorId, isWalkInAllowed, clinics, visitType]);

  const confirmCancel = () => { if (cancelModal.visit) { onCancelVisit(cancelModal.visit.clinicId, cancelModal.visit.id); addToast("Appointment Cancelled", "info"); setCancelModal({ isOpen: false, visit: null }); } };
  
  // Memoized Booking Dates/Slots (same logic)
  const bookingDates = useMemo(() => { if (!selectedDoctor) return []; const days = []; const today = new Date(); for(let i=0; i<14; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }); const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName); days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate(), isOff: !schedule || schedule.isOff, schedule }); } return days; }, [selectedDoctor]);
  
  const groupedTimeSlots = useMemo<GroupedSlots>(() => { 
      const groups: GroupedSlots = { Morning: [], Afternoon: [], Evening: [], Night: [] }; 
      if (!selectedDoctor || !apptDate) return groups; 
      const selectedDayObj = bookingDates.find(d => d.dateStr === apptDate); 
      if (!selectedDayObj || selectedDayObj.isOff || !selectedDayObj.schedule) return groups; 
      
      selectedDayObj.schedule.slots.forEach(timeSlot => { 
          const { startTime, endTime } = timeSlot; 
          const [startH, startM] = startTime.split(':').map(Number); 
          const [endH, endM] = endTime.split(':').map(Number); 
          let currentMins = startH * 60 + startM; 
          let endMins = endH * 60 + endM; 
          const shiftStartMins = startH * 60 + startM; 
          
          if (endMins <= currentMins) endMins += 24 * 60;

          const now = new Date(); 
          const isToday = apptDate === now.toISOString().split('T')[0]; 
          const nowMins = now.getHours() * 60 + now.getMinutes(); 
          
          const MIN_NOTICE_MINS = 30; 
          
          while (currentMins + 15 <= endMins) { 
              if (!isToday || currentMins > (nowMins + MIN_NOTICE_MINS)) { 
                  let displayMins = currentMins % (24 * 60);
                  const h = Math.floor(displayMins / 60); 
                  const m = displayMins % 60; 
                  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; 
                  const suffix = h >= 12 ? 'PM' : 'AM'; 
                  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h; 
                  const displayStr = `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`; 
                  const slotObj = { value: timeStr, label: displayStr }; 
                  
                  if (h >= 5 && h < 12) groups.Morning.push(slotObj); 
                  else if (h >= 12 && h < 17) groups.Afternoon.push(slotObj); 
                  else if (h >= 17 && h < 21) groups.Evening.push(slotObj);
                  else groups.Night.push(slotObj); 
              } 
              currentMins += 15; 
          } 
      }); 
      return groups; 
  }, [selectedDoctor, apptDate, bookingDates]);
  
  const hasAnySlots = useMemo(() => { 
      return groupedTimeSlots.Morning.length > 0 || 
             groupedTimeSlots.Afternoon.length > 0 || 
             groupedTimeSlots.Evening.length > 0 || 
             groupedTimeSlots.Night.length > 0; 
  }, [groupedTimeSlots]);

  const getDoctorTodaySchedule = (doc: any) => { const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const today = days[new Date().getDay()]; const schedule = doc.weeklySchedule.find((s: any) => s.day === today); if (!schedule || schedule.isOff) return <span className="text-red-500 font-bold text-[10px]">OFF Today</span>; if (schedule.slots.length === 1) return <span className="text-green-700 font-bold text-[10px]">{schedule.slots[0].startTime} - {schedule.slots[0].endTime}</span>; return <span className="text-green-700 font-bold text-[10px]">{schedule.slots.length} Shifts Today</span>; };
  const getLinkedClinics = (doc: Doctor) => { return clinics.filter(c => c.doctors.some(d => d.masterId === doc.masterId && c.id !== selectedClinicId)); };
  
  const navItems = [ { id: 'BOOK', label: 'Find Care', icon: Search }, { id: 'ACTIVE', label: 'Active Visits', icon: Ticket }, { id: 'HISTORY', label: 'History', icon: History }, { id: 'PROFILE', label: 'Profile', icon: User } ];
  function Ticket({ className }: { className?: string }) { return ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" /> </svg> ); }
  const GuestLoginCard = () => ( <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center"> <div className="bg-slate-100 p-6 rounded-full mb-6"><Lock className="h-10 w-10 text-slate-400" /></div> <h3 className="text-xl font-bold text-slate-800 mb-2">Login Required</h3> <p className="text-slate-500 mb-8 max-w-xs">Please login to access your appointments and medical history.</p> <Button onClick={() => onLoginClick && onLoginClick()} size="lg" className="shadow-lg px-10">Login / Register</Button> </div> );

  const isClinicWalkInOnly = selectedClinic?.operationMode === ClinicOperationMode.WALK_IN;
  const isClinicApptOnly = selectedClinic?.operationMode === ClinicOperationMode.APPOINTMENT;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30"> 
            <div className="p-6 border-b border-slate-100"> 
                <div className="flex items-center gap-2"> <Logo className="h-8 w-8" /> <span className="font-bold text-xl text-slate-900 tracking-tight">Smart<span className="text-primary-600">QFlow</span></span> </div> 
            </div> 
            <div className="flex-1 py-6 px-4 space-y-2"> 
                {navItems.map(item => ( <button key={item.id} onClick={() => handleTabSwitch(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}> <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} /> {item.label} </button> ))} 
            </div> 
            <div className="p-4 border-t border-slate-100"> 
                <div className="flex items-center gap-3 px-4 py-3"> <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">{isGuest ? <User className="h-5 w-5" /> : userName.charAt(0)}</div> <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{userName}</p><p className="text-xs text-slate-500 truncate">{userPhone}</p></div> </div> {isGuest ? ( <Button onClick={() => onLoginClick && onLoginClick()} className="w-full mt-2 justify-center gap-2 shadow-md"><LogIn className="h-4 w-4" /> Login</Button> ) : ( <button onClick={onBack} className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut className="h-4 w-4" /> Logout</button> )} 
            </div> 
        </aside>
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 w-full">
            {/* MOBILE HEADER */}
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    {bookingView !== 'LIST' && activeTab === 'BOOK' ? (
                        <Button variant="ghost" size="sm" onClick={handleUIBack} className="p-0 mr-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={onBack} className="p-0 mr-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div><h1 className="font-bold text-slate-900 leading-none text-lg">{activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Booking' : navItems.find(n => n.id === activeTab)?.label}</h1></div>
                </div>
                <div className="flex gap-2"><button onClick={() => setShowQRScanner(true)} className="bg-slate-900 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"><QrCode className="h-5 w-5" /> </button></div>
            </header>
            
            {/* DESKTOP HEADER */}
            <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shrink-0 z-10"> <div><h2 className="text-2xl font-bold text-slate-900">{activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Appointment Details' : activeTab === 'ACTIVE' ? 'Your Active Visits' : activeTab === 'HISTORY' ? 'Visit History' : activeTab === 'PROFILE' ? 'My Profile' : 'Find Care'}</h2></div> <div className="flex items-center gap-4"><Button variant="outline" onClick={() => setShowQRScanner(true)} className="hidden md:flex"><QrCode className="h-4 w-4 mr-2" /> Scan QR Code</Button></div> </header>

            <div className={`flex-1 flex flex-col w-full relative ${activeTab === 'BOOK' && bookingView === 'LIST' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden scroll-smooth pb-24 md:pb-0'}`}>
                {activeTab === 'ACTIVE' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full h-full px-4 md:px-8 py-6 max-w-[1920px] mx-auto"> {activeVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"> {activeVisits.map(visit => { const queueStats = getSmartQueueDetails(visit); return ( <Card key={visit.id} className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"> <div className="p-5 pb-2 flex justify-between items-start"><div><h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3><p className="text-sm text-slate-500">Dr. {visit.doctorName} • {visit.room ? `Room ${visit.room}` : ''}</p></div><Badge status={visit.status} /></div> <div className="px-5 mb-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit"><User className="h-3 w-3" /> {visit.name}</span></div> <div className="bg-slate-50 border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center"><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Token</div><div className="text-3xl font-black text-slate-900">#{visit.tokenNumber}</div></div><div className="border-x border-slate-200"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Now Serving</div><div className={`text-3xl font-bold ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>{visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken}</div></div><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People Ahead</div><div className="text-3xl font-bold text-slate-900">{queueStats.peopleAhead}</div></div></div> <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold`}>{queueStats.doctorStatus === DoctorStatus.ON_BREAK ? <Coffee className="h-5 w-5" /> : queueStats.doctorStatus === DoctorStatus.AVAILABLE ? <Timer className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}<div className="flex-1"><p>{queueStats.message}</p>{visit.status === PatientStatus.WAITING && (<p className="text-[10px] opacity-80 font-normal">Est. Time: {queueStats.expectedTime}</p>)}</div></div> {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 flex items-center gap-2 border-t border-orange-100"><Info className="h-4 w-4 flex-shrink-0" /><span>{queueStats.peopleAhead < 3 ? "Almost your turn! Please ask receptionist to Check-in now." : "Please ask receptionist to Check-in once you arrive."}</span></div>)} <div className="p-4 flex gap-2 mt-auto">{!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => setShowQRScanner(true)}><QrCode className="h-4 w-4 mr-2" /> Scan to Check-In</Button>)}<Button variant="secondary" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelModal({ isOpen: true, visit })} disabled={visit.status === PatientStatus.WITH_DOCTOR}>Cancel</Button></div> </Card> ); })} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><Calendar className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No active visits</h3><p className="text-slate-500 mb-6 text-center max-w-sm">Book an appointment or scan a QR code at a clinic to see your live status here.</p><Button onClick={() => handleTabSwitch('BOOK')} size="lg" className="shadow-lg">Find a Doctor</Button></div> )} </div> ) )}

                {activeTab === 'HISTORY' && (
                    isGuest ? <GuestLoginCard /> : (
                        <div className="w-full h-full px-4 md:px-8 py-6 max-w-[1920px] mx-auto">
                            {historyVisits.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {historyVisits.map(visit => (
                                    <div key={visit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 h-full hover:border-primary-200 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className={`p-3 rounded-lg flex-shrink-0 ${visit.status === PatientStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {visit.status === PatientStatus.COMPLETED ? <CheckCircle2 className="h-6 w-6" /> : <X className="h-6 w-6" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 truncate text-base">{visit.clinicName}</h3>
                                                    <p className="text-sm text-slate-500 truncate">Dr. {visit.doctorName}</p>
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(visit.timeAdded).toLocaleDateString()} at {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {visit.diagnosis && (
                                                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Diagnosis</p>
                                                        <p className="text-sm text-slate-700 font-medium">{visit.diagnosis}</p>
                                                    </div>
                                                )}
                                                {visit.notes && (
                                                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><FileText className="h-3 w-3" /> Doctor Notes</p>
                                                        <p className="text-sm text-slate-600 italic leading-relaxed">"{visit.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                                            {/* Rating Section */}
                                            {visit.status === PatientStatus.COMPLETED && (
                                                <div className="flex-1">
                                                    {visit.rating ? (
                                                        <div className="flex items-center gap-1 text-yellow-400">
                                                            {Array.from({length: 5}).map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < visit.rating ? 'fill-current' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setFeedbackModal({ isOpen: true, visit, rating: 0, text: '' })}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                        >
                                                            Rate Visit
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <Button size="sm" variant="outline" className="text-primary-700 border-primary-200 hover:bg-primary-50" onClick={() => {
                                                const clinic = clinics.find(c => c.id === visit.clinicId);
                                                if (clinic) {
                                                    const doc = clinic.doctors.find(d => d.id === visit.doctorId);
                                                    if (doc) {
                                                        // Use Router Navigation for rebooking
                                                        // Logic for mode
                                                        const mode = clinic.operationMode === ClinicOperationMode.WALK_IN ? 'WALK_IN' : 'APPOINTMENT';
                                                        setVisitType(mode);
                                                        navigateToView('FORM', clinic.id, doc.id);
                                                    } else {
                                                        addToast("Doctor is no longer available.", "error");
                                                    }
                                                } else {
                                                    addToast("Clinic is no longer available.", "error");
                                                }
                                            }}>
                                                Book Again
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 opacity-50">
                                    <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                    <p>No visit history found.</p>
                                </div>
                            )}
                        </div>
                    )
                )}

                {activeTab === 'PROFILE' && (
                    isGuest ? <GuestLoginCard /> : (
                        <div className="w-full px-4 md:px-8 py-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Left Col: Profile Card */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 mb-4 border-4 border-white shadow-md">
                                        {userName.charAt(0)}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">{userName}</h2>
                                    <p className="text-slate-500 font-mono text-lg mb-4">{userPhone}</p>
                                    <div className="flex gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                                        <span className="font-bold">{userProfile?.age || '--'} Yrs</span>
                                        <span>•</span>
                                        <span className="font-bold">{userProfile?.gender || '--'}</span>
                                    </div>
                                    <div className="mt-8 w-full">
                                        <button onClick={onBack} className="w-full flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition-colors border border-red-100">
                                            <LogOut className="h-5 w-5" /> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Family Members */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Users className="h-5 w-5 text-primary-600" /> Family Members</h3>
                                        <Button size="sm" variant="outline" onClick={() => { setEditingMemberIndex(null); setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setShowAddMember(true); }}>
                                            <Plus className="h-4 w-4 mr-2" /> Add New
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {userProfile?.familyMembers && userProfile.familyMembers.length > 0 ? (
                                            userProfile.familyMembers.map((member, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{member.name}</p>
                                                            <p className="text-xs text-slate-500 font-medium">{member.relation} • {member.age} Yrs</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEditMember(idx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDeleteMember(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-8 text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                No family members added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'BOOK' && (
                    <div className="h-full flex flex-col">
                        {bookingView === 'LIST' && (
                            <div className="h-full flex flex-col">
                                {/* Search & Filters Header - Compact */}
                                <div className="px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0 w-full">
                                    <div className="w-full flex flex-col gap-2">
                                        <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                                            {/* Search Input - Expands */}
                                            <div className="relative flex-1 w-full">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input 
                                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                                    placeholder={searchMode === 'DOCTOR' ? "Search doctor..." : "Search clinic..."}
                                                    value={searchQuery} 
                                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                                />
                                            </div>

                                            {/* Controls Row */}
                                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                                {/* Mode Switcher */}
                                                <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
                                                    <button onClick={() => setSearchMode('CLINIC')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${searchMode === 'CLINIC' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Building2 className="h-3 w-3" /> Clinics</button>
                                                    <button onClick={() => setSearchMode('DOCTOR')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${searchMode === 'DOCTOR' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Stethoscope className="h-3 w-3" /> Doctors</button>
                                                </div>

                                                {/* Locate Button */}
                                                <button onClick={handleLocateMe} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 font-bold text-xs whitespace-nowrap shrink-0">
                                                    {isLocating ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span> : <Crosshair className="h-3 w-3" />} {userLocation ? 'Near Me' : 'Locate'}
                                                </button>

                                                {/* Map Toggle (Mobile Only) */}
                                                <button onClick={() => setShowMap(!showMap)} className="md:hidden p-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                                                    <MapPin className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Filters Row */}
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {/* City Filter */}
                                            <div className="relative shrink-0">
                                                <select className="pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                                                    {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 rotate-90 pointer-events-none" />
                                            </div>

                                            {/* Open Now Toggle */}
                                            <button onClick={() => setShowOpenOnly(!showOpenOnly)} className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${showOpenOnly ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                                <Clock className="h-3 w-3" /> Open Now
                                            </button>

                                            <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0 self-center"></div>

                                            {/* Categories */}
                                            {CATEGORIES.map(cat => (
                                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border whitespace-nowrap shrink-0 ${selectedCategory === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <cat.icon className="h-3 w-3" />
                                                    <span className="text-xs font-bold">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* SPLIT VIEW CONTENT */}
                                <div className="flex-1 overflow-hidden flex relative">
                                    {/* LIST PANEL - Adjusted Width to 65% on Desktop */}
                                    <div className={`w-full md:w-[65%] h-full overflow-y-auto bg-slate-50/50 p-2 md:p-4 custom-scrollbar block`}>
                                         <div className="w-full space-y-3 pb-20 md:pb-0">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="font-bold text-slate-900 text-sm">
                                                    {searchMode === 'CLINIC' 
                                                        ? `${filteredClinics.length} Clinics` 
                                                        : `${filteredDoctors.length} Doctors`}
                                                </h3>
                                                <select className="bg-transparent text-xs font-bold text-slate-500 cursor-pointer focus:outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                                    <option value="NEAR">Nearest</option>
                                                    <option value="WAIT">Short Wait</option>
                                                    <option value="FEE">Low Fee</option>
                                                </select>
                                            </div>

                                            {/* Responsive Grid for Cards */}
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                {/* CLINIC MODE RENDERING */}
                                                {searchMode === 'CLINIC' && filteredClinics.map(clinic => {
                                                    const waitInfo = getClinicWaitStats(clinic); 
                                                    const feeRange = getFeeRange(clinic); 
                                                    const rating = (clinic.doctors.reduce((acc, d) => acc + d.rating, 0) / (clinic.doctors.length || 1)).toFixed(1); 
                                                    const relevantDoctors = getRelevantDoctors(clinic);
                                                    const isHighlighted = highlightedClinicId === clinic.id;
                                                    
                                                    // Calculate display distance
                                                    let distLabel = '~1.2 km';
                                                    let gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + ' ' + clinic.address)}`;
                                                    if (userLocation && clinic.geoLocation) {
                                                        const d = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
                                                        distLabel = `${d.toFixed(1)} km`;
                                                        gmapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinic.geoLocation.lat},${clinic.geoLocation.lng}&travelmode=driving`;
                                                    } else if (clinic.geoLocation) {
                                                        gmapsLink = `https://www.google.com/maps/search/?api=1&query=${clinic.geoLocation.lat},${clinic.geoLocation.lng}`;
                                                    }

                                                    return (
                                                        <ClinicCard
                                                            key={clinic.id}
                                                            clinic={clinic}
                                                            waitInfo={waitInfo}
                                                            feeRange={feeRange}
                                                            rating={rating}
                                                            distLabel={distLabel}
                                                            gmapsLink={gmapsLink}
                                                            relevantDoctors={relevantDoctors}
                                                            isHighlighted={isHighlighted}
                                                            cardRef={(el) => { clinicCardRefs.current[clinic.id] = el; }}
                                                            onSelect={() => navigateToView('CLINIC_DETAILS', clinic.id)}
                                                            onBook={() => { 
                                                                if (clinic.operationMode === ClinicOperationMode.WALK_IN) return;
                                                                navigateToView('CLINIC_DETAILS', clinic.id); 
                                                                setVisitType('APPOINTMENT'); 
                                                            }}
                                                            onQueue={() => { 
                                                                if (clinic.operationMode === ClinicOperationMode.APPOINTMENT) return;
                                                                navigateToView('CLINIC_DETAILS', clinic.id); 
                                                                setVisitType('WALK_IN'); 
                                                            }}
                                                            onViewDoctor={(doc) => setViewingDoctor(doc)}
                                                        />
                                                    );
                                                })}

                                                {/* DOCTOR MODE RENDERING */}
                                                {searchMode === 'DOCTOR' && filteredDoctors.map(({ doctor, clinic }) => {
                                                    // Calculate Distance
                                                    let distLabel = '~1.2 km';
                                                    if (userLocation && clinic.geoLocation) {
                                                        const d = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
                                                        distLabel = `${d.toFixed(1)} km`;
                                                    }

                                                    // Calculate Next Slot
                                                    const next = getNextAvailability(doctor, 14);
                                                    const formatShort = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                                    const nextSlotLabel = next ? (next.status === 'now' ? 'Available Now' : `Next: ${formatShort(next.start)}`) : 'No Slots';
                                                    const isWalkInAllowed = next?.status === 'now' || doctor.isAvailable;

                                                    return (
                                                        <DoctorSearchCard 
                                                            key={doctor.id}
                                                            doctor={doctor}
                                                            clinic={clinic}
                                                            distLabel={distLabel}
                                                            nextSlotLabel={nextSlotLabel}
                                                            isWalkInAllowed={isWalkInAllowed}
                                                            onBook={() => {
                                                                if (clinic.operationMode === ClinicOperationMode.WALK_IN) {
                                                                    setVisitType('WALK_IN');
                                                                } else if (clinic.operationMode === ClinicOperationMode.APPOINTMENT) {
                                                                    setVisitType('APPOINTMENT');
                                                                } else {
                                                                    setVisitType('APPOINTMENT');
                                                                }
                                                                navigateToView('FORM', clinic.id, doctor.id);
                                                            }}
                                                            onViewProfile={() => setViewingDoctor(doctor)}
                                                        />
                                                    );
                                                })}

                                                {((searchMode === 'CLINIC' && filteredClinics.length === 0) || (searchMode === 'DOCTOR' && filteredDoctors.length === 0)) && ( 
                                                    <div className="col-span-full text-center py-12 opacity-50"> 
                                                        <Filter className="h-12 w-12 mx-auto mb-3 text-slate-300" /> 
                                                        <p>No results found.</p> 
                                                    </div> 
                                                )}
                                            </div>
                                         </div>
                                    </div>

                                    {/* MAP PANEL (Right on Desktop, Hidden on Mobile) */}
                                    <MapPanel 
                                        clinics={searchMode === 'CLINIC' ? filteredClinics : Array.from(new Set(filteredDoctors.map(d => d.clinic)))} // In Doctor mode, show unique clinics on map
                                        userLocation={userLocation}
                                        mapCenter={mapCenter}
                                        isPickingLocation={isPickingLocation}
                                        isLocating={isLocating}
                                        showMap={showMap}
                                        getClinicWaitStats={getClinicWaitStats}
                                        onLocationSelect={handleMapSelection}
                                        onMarkerDragEnd={handleMarkerDragEnd}
                                        onLocateMe={handleLocateMe}
                                        onMarkerClick={scrollToClinic}
                                        onBookClick={(id) => navigateToView('CLINIC_DETAILS', id)}
                                        onClosePickingLocation={() => setIsPickingLocation(false)}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {bookingView === 'CLINIC_DETAILS' && selectedClinic && (
                            <div className="animate-in slide-in-from-right duration-300 bg-white min-h-full md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 md:overflow-hidden md:max-w-5xl md:mx-auto pt-4 md:pt-0">
                                {/* Clinic Details View Content */}
                                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                                    <Button variant="ghost" size="sm" onClick={handleUIBack} className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <h2 className="font-bold text-slate-900 truncate text-lg">{selectedClinic.name}</h2>
                                </div>
                                <div className="p-4 md:p-8 pb-24 h-full overflow-y-auto custom-scrollbar">
                                    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6 relative shadow-sm group">
                                        {selectedClinic.imageUrl ? ( <img src={selectedClinic.imageUrl} alt={selectedClinic.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> ) : ( <div className="w-full h-full bg-slate-100 flex items-center justify-center"> <Building2 className="h-16 w-16 text-slate-300" /> </div> )}
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm"> <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" /> 4.5 </div>
                                    </div>
                                    <div className="mb-8 grid md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div> <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block ${isClinicOpen(selectedClinic.operatingHours) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}> {isClinicOpen(selectedClinic.operatingHours) ? 'Open Now' : 'Closed'} </span> <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedClinic.name}</h1> </div>
                                            </div>
                                            <div className="space-y-3 text-sm text-slate-600">
                                                <p className="flex items-start gap-3"> <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" /> {selectedClinic.address}, {selectedClinic.city} - {selectedClinic.pincode} </p>
                                                <p className="flex items-center gap-3"> <Clock className="h-5 w-5 text-slate-400" /> {selectedClinic.operatingHours || '09:00 - 21:00'} </p>
                                                <p className="flex items-center gap-3"> <Navigation className="h-5 w-5 text-slate-400" /> {userLocation && selectedClinic.geoLocation ? `${calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng).toFixed(1)} km from your location` : ( <button onClick={handleLocateMe} className="text-blue-600 font-bold hover:underline flex items-center gap-1"> <Crosshair className="h-3 w-3" /> Enable location to see distance </button> )} </p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {selectedClinic.about && (<div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider"><Info className="h-4 w-4 text-primary-600" /> About Clinic</h3><p className="text-sm text-slate-600 leading-relaxed">{selectedClinic.about}</p></div>)}
                                            {selectedClinic.amenities && selectedClinic.amenities.length > 0 && (<div><h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Facilities</h3><div className="flex flex-wrap gap-2">{selectedClinic.amenities.map(item => (<span key={item} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> {item}</span>))}</div></div>)}
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
                                                    const linked = getLinkedClinics(doc);
                                                    const waitDetails = getDoctorWaitDetails(selectedClinic, doc.id);
                                                    let waitColor = 'bg-green-100 text-green-700';
                                                    if (waitDetails.time > 20) waitColor = 'bg-yellow-100 text-yellow-700';
                                                    if (waitDetails.time > 45) waitColor = 'bg-red-100 text-red-700';
                                                    
                                                    const isClinicWalkInOnly = selectedClinic.operationMode === ClinicOperationMode.WALK_IN;
                                                    const isClinicApptOnly = selectedClinic.operationMode === ClinicOperationMode.APPOINTMENT;

                                                    return (
                                                        <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-lg transition-all hover:border-primary-200 group relative">
                                                            <div 
                                                                className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start cursor-pointer"
                                                                onClick={() => setViewingDoctor(doc)}
                                                            >
                                                                <div className="relative flex-shrink-0"> <img src={doc.avatarUrl} alt={`Dr. ${doc.name}`} className="h-20 w-20 rounded-2xl object-cover bg-slate-100 border border-slate-100 shadow-inner" /> <span className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${activeNow ? 'bg-emerald-500' : (canBook ? 'bg-yellow-400' : 'bg-slate-300')}`} title={availLabel}></span> </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0"> <div className="flex items-center gap-3"><h4 className="font-bold text-slate-900 text-lg truncate hover:text-primary-600 transition-colors">Dr. {doc.name}</h4></div> <div className="mt-1 text-sm text-slate-700 truncate">{doc.specialty}</div> </div>
                                                                        <div className="flex items-center gap-3 ml-2 sm:ml-0"><div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700"><Star className="h-4 w-4 fill-current text-yellow-500" /> {doc.rating ?? '4.5'}</div></div>
                                                                    </div>
                                                                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500"> <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {(doc as any).experience ?? '10'} yrs</div> <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> {(doc as any).languages?.join(', ')}</div> </div>
                                                                    <div className="mt-2"> <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${waitColor}`}> <Timer className="h-3 w-3" /> {waitDetails.time}m Wait ({waitDetails.count} Pts) </span> </div>
                                                                    {linked.length > 0 && ( <div className="mt-2 text-xs text-slate-500"> <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Also practices at:</span> <div className="flex flex-wrap gap-1 mt-1"> {linked.map(lc => ( <span key={lc.id} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 cursor-default" title={`Switch clinic to view details`}>{lc.name}</span> ))} </div> </div> )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                                <div className="flex flex-col text-xs text-slate-500"> <div className="uppercase font-bold text-[10px] tracking-wide text-slate-400">Availability & Fees</div> <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">{getDoctorTodaySchedule(doc)}<span className="text-xs text-slate-400">·</span><span className="font-bold text-sm text-slate-900">₹{doc.consultationFee}</span></div> </div>
                                                                <div className="flex items-center gap-3">
                                                                    {!isClinicApptOnly && (
                                                                        <Button onClick={() => { navigateToView('FORM', selectedClinic.id, doc.id); setVisitType('WALK_IN'); }} disabled={!canBook || !activeNow} size="sm" variant="ghost" className={`h-9 px-3 text-xs ${!activeNow ? 'opacity-50' : 'text-slate-700'}`} title="Join Queue directly"> 
                                                                            {isClinicWalkInOnly ? 'Details' : 'Queue'} 
                                                                        </Button>
                                                                    )}
                                                                    {!isClinicWalkInOnly && (
                                                                        <Button onClick={() => { navigateToView('FORM', selectedClinic.id, doc.id); setVisitType('APPOINTMENT'); }} disabled={!canBook} size="sm" className={`h-9 px-4 ${canBook ? 'shadow-md' : 'opacity-60 cursor-not-allowed'}`}> Book </Button>
                                                                    )}
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
                        {/* Booking Form reused from earlier (ensure it works with imports) */}
                        {bookingView === 'FORM' && selectedClinic && selectedDoctorId && (
                             <div className="animate-in slide-in-from-right duration-300 bg-slate-100 min-h-full flex justify-center">
                                 {/* Single Column Container */}
                                 <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col relative">
                                    
                                    {/* Header */}
                                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                                        <Button variant="ghost" size="sm" onClick={handleUIBack} className="rounded-full w-10 h-10 p-0 border border-slate-200 hover:bg-slate-100">
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                        <div>
                                            <h2 className="font-bold text-slate-900 text-lg leading-tight">Booking Summary</h2>
                                            <p className="text-xs text-slate-500">Complete your visit details</p>
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24">
                                        
                                        {/* Doctor Summary Card */}
                                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex gap-4 items-start">
                                            <img src={selectedDoctor.avatarUrl} className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm border border-slate-100" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 text-lg truncate">{selectedDoctor.name}</h3>
                                                <p className="text-sm text-primary-700 font-medium mb-1">{selectedDoctor.specialty}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="h-3 w-3" /> {selectedClinic.name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-900">₹{selectedDoctor.consultationFee}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fee</div>
                                            </div>
                                        </div>

                                        {/* Queue Stats Row */}
                                        {!isClinicWalkInOnly && !isClinicApptOnly && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                                    <span className="text-blue-800 text-[10px] font-bold uppercase tracking-wide mb-1">Patients Waiting</span>
                                                    <span className="text-2xl font-black text-slate-900">{waitStats.count}</span>
                                                </div>
                                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                                    <span className="text-amber-800 text-[10px] font-bold uppercase tracking-wide mb-1">Est. Wait Time</span>
                                                    <span className="text-2xl font-black text-slate-900">~{waitStats.time}<span className="text-sm font-bold text-slate-500 ml-1">m</span></span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Walk-in Only Blocker */}
                                        {isClinicWalkInOnly ? (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                                <Footprints className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                                <h3 className="font-bold text-slate-900 mb-1">Walk-In Only</h3>
                                                <p className="text-sm text-slate-500">This clinic does not accept online tokens. Please visit the reception.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <hr className="border-slate-100" />

                                                {/* 1. Patient Details */}
                                                <div className="space-y-3">
                                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</span>
                                                        Who is this for?
                                                    </h3>
                                                    {/* ... Patient Selector Logic ... */}
                                                    {isGuest ? (
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                                            <Input label="Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="bg-white" />
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <Input label="Age" type="number" value={guestAge} onChange={e => setGuestAge(e.target.value)} className="bg-white" />
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">Gender</label>
                                                                    <select className="w-full p-2 border rounded-lg bg-white" value={guestGender} onChange={e => setGuestGender(e.target.value)}><option>Male</option><option>Female</option></select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                                                            <div className="flex gap-3">
                                                                <button onClick={() => setBookingFor('MYSELF')} className={`flex-shrink-0 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${bookingFor === 'MYSELF' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-slate-100 bg-white text-slate-500'}`}>
                                                                    <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs"><User className="h-4 w-4" /></div>
                                                                    <div className="text-left"><div className="text-xs font-bold">Myself</div></div>
                                                                </button>
                                                                {userProfile?.familyMembers?.map((m, i) => (
                                                                    <button key={i} onClick={() => setBookingFor(m.name)} className={`flex-shrink-0 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${bookingFor === m.name ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-slate-100 bg-white text-slate-500'}`}>
                                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs"><Users className="h-4 w-4" /></div>
                                                                        <div className="text-left"><div className="text-xs font-bold truncate max-w-[80px]">{m.name}</div></div>
                                                                    </button>
                                                                ))}
                                                                <button onClick={() => { setEditingMemberIndex(null); setNewMember({name:'', age:'', gender:'Male', relation:''}); setShowAddMember(true); }} className="flex-shrink-0 w-12 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-primary-400 hover:text-primary-600"><Plus className="h-5 w-5" /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. Visit Type */}
                                                <div className="space-y-3">
                                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</span>
                                                        Visit Type
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button disabled={!isWalkInAllowed || isClinicApptOnly} onClick={() => setVisitType('WALK_IN')} className={`p-3 rounded-xl border text-left transition-all ${visitType === 'WALK_IN' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'} ${(!isWalkInAllowed || isClinicApptOnly) && 'opacity-50 cursor-not-allowed'}`}>
                                                            <Zap className="h-5 w-5 mb-2" />
                                                            <div className="font-bold text-sm">Join Queue</div>
                                                            <div className="text-[10px] opacity-70">Get token now</div>
                                                        </button>
                                                        <button disabled={isClinicWalkInOnly} onClick={() => setVisitType('APPOINTMENT')} className={`p-3 rounded-xl border text-left transition-all ${visitType === 'APPOINTMENT' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'} ${isClinicWalkInOnly && 'opacity-50 cursor-not-allowed'}`}>
                                                            <Calendar className="h-5 w-5 mb-2" />
                                                            <div className="font-bold text-sm">Book Slot</div>
                                                            <div className="text-[10px] opacity-70">Schedule for later</div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 3. Conditional Input */}
                                                {visitType === 'WALK_IN' ? (
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Travel Time</label>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="5" max="60" step="5" value={travelTime} onChange={e => setTravelTime(e.target.value)} className="flex-1 accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none" />
                                                            <span className="font-bold text-slate-900 w-16 text-right">{travelTime} m</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar -mx-4 px-4">
                                                            {bookingDates.map((d, i) => (
                                                                <button key={i} disabled={d.isOff} onClick={() => { setApptDate(d.dateStr); setApptTime(''); }} className={`flex-shrink-0 w-14 h-16 flex flex-col items-center justify-center rounded-xl border transition-all ${apptDate === d.dateStr ? 'bg-purple-600 text-white border-purple-600 shadow-md' : d.isOff ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                                    <span className="text-[10px] font-bold uppercase">{d.dayShort}</span>
                                                                    <span className="text-lg font-bold">{d.dayNum}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {apptDate && hasAnySlots ? (
                                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                                {groupedTimeSlots.Morning.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Sun className="h-3 w-3" /> Morning</h4>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {groupedTimeSlots.Morning.map(slot => (
                                                                                <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${apptTime === slot.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                                                                                    {slot.label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {groupedTimeSlots.Afternoon.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><CloudSun className="h-3 w-3" /> Afternoon</h4>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {groupedTimeSlots.Afternoon.map(slot => (
                                                                                <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${apptTime === slot.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                                                                                    {slot.label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {groupedTimeSlots.Evening.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Moon className="h-3 w-3" /> Evening</h4>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {groupedTimeSlots.Evening.map(slot => (
                                                                                <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${apptTime === slot.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                                                                                    {slot.label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {groupedTimeSlots.Night.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><MoonStar className="h-3 w-3" /> Night</h4>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {groupedTimeSlots.Night.map(slot => (
                                                                                <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${apptTime === slot.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                                                                                    {slot.label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                                No slots available for this date
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 4. Symptoms */}
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-slate-900">Reason for visit</h3>
                                                    <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none resize-none" rows={2} placeholder="e.g. Fever, Headache..." value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Bottom Bar */}
                                    {!isClinicWalkInOnly && (
                                        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                            <Button 
                                                className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary-200"
                                                onClick={handleBookToken}
                                                disabled={(!isGuest && !userProfile) || (visitType === 'APPOINTMENT' && (!apptDate || !apptTime))}
                                            >
                                                {visitType === 'APPOINTMENT' ? 'Confirm Booking' : 'Get Token Now'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                )}


                {/* MODALS */}
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} initialName={guestName} initialAge={guestAge} initialGender={guestGender} addToast={addToast} />
                <DoctorProfileModal isOpen={!!viewingDoctor} onClose={() => setViewingDoctor(null)} doctor={viewingDoctor} operationMode={viewingDoctorClinic?.operationMode} onBook={handleBookFromProfile} />
                {showAddMember && (<div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10"><h3 className="text-lg font-bold mb-4">{editingMemberIndex !== null ? 'Edit Family Member' : 'Add Family Member'}</h3><div className="space-y-3"><Input label="Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} /><div className="grid grid-cols-2 gap-3"><Input label="Age" type="number" value={newMember.age} onChange={e => setNewMember({...newMember, age: e.target.value})} /><div><label className="block text-sm font-medium mb-1">Gender</label><select className="w-full p-2 border rounded-lg" value={newMember.gender} onChange={e => setNewMember({...newMember, gender: e.target.value})}><option>Male</option><option>Female</option></select></div></div><div><label className="block text-sm font-medium mb-1">Relation</label>{isCustomRelation ? (<div className="flex gap-2"><Input value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value})} placeholder="Enter relation" autoFocus /><button onClick={() => setIsCustomRelation(false)} className="text-xs text-blue-600 underline whitespace-nowrap px-2">Select List</button></div>) : (<select className="w-full p-2 border rounded-lg" value={RELATIONSHIP_OPTIONS.includes(newMember.relation) ? newMember.relation : ''} onChange={(e) => { if (e.target.value === 'OTHER') setIsCustomRelation(true); else setNewMember({...newMember, relation: e.target.value}); }}><option value="" disabled>Select...</option>{RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}<option value="OTHER">Other (Type Custom)</option></select>)}</div></div><div className="flex gap-3 mt-6"><Button variant="secondary" className="flex-1" onClick={() => setShowAddMember(false)}>Cancel</Button><Button className="flex-1" onClick={handleAddMember}>Save</Button></div></div></div>)}
                {/* Cancel Modal */}
                {cancelModal.isOpen && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertCircle className="h-6 w-6" /></div><h3 className="text-lg font-bold text-center mb-2">Cancel Appointment?</h3><p className="text-slate-500 text-center text-sm mb-6">Are you sure you want to cancel your visit with <strong>{cancelModal.visit?.doctorName}</strong>?</p><div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => setCancelModal({ isOpen: false, visit: null })}>Keep it</Button><Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600" onClick={confirmCancel}>Yes, Cancel</Button></div></div></div>)}
                {/* Late Warning Modal */}
                {showLateWarningModal && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95"><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><Timer className="h-6 w-6" /></div><h3 className="text-lg font-bold text-center mb-2">High Wait Time Risk</h3><p className="text-slate-500 text-center text-sm mb-6">Your travel time ({travelTime} mins) is longer than the estimated wait ({waitStats.time} mins). You might miss your turn.</p><div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => setShowLateWarningModal(false)}>Go Back</Button><Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" onClick={() => { setShowLateWarningModal(false); submitBooking(); }}>Book Anyway</Button></div></div></div>)}
                
                {/* FEEDBACK MODAL */}
                <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} title="Rate Your Visit">
                    <div className="space-y-6 text-center pt-2">
                        <p className="text-slate-600">How was your experience with<br/><strong className="text-lg text-slate-900">Dr. {feedbackModal.visit?.doctorName}</strong>?</p>
                        
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star}
                                    onClick={() => setFeedbackModal({...feedbackModal, rating: star})}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star 
                                        className={`h-10 w-10 ${star <= feedbackModal.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            placeholder="Tell us what you liked or what we can improve..."
                            rows={3}
                            value={feedbackModal.text}
                            onChange={(e) => setFeedbackModal({...feedbackModal, text: e.target.value})}
                        />

                        <Button 
                            className="w-full" 
                            disabled={feedbackModal.rating === 0}
                            onClick={handleSubmitFeedback}
                        >
                            Submit Feedback
                        </Button>
                    </div>
                </Modal>
            </div>
        </main>
    </div>
  );
};
