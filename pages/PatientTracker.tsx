
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useMatch, useLocation, useSearchParams } from 'react-router-dom';
import { Clinic, Patient, PatientStatus, DoctorStatus, Doctor, ClinicOperationMode, Review } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';
// Imported Modules
import { ClinicCard } from '../features/patient/components/ClinicCard';
import { DoctorSearchCard } from '../features/patient/components/DoctorSearchCard';
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
    CheckCircle2, Globe, Edit2, Trash2, Footprints, ChevronRight, ChevronLeft, FileText, MoonStar, MessageSquare, Phone
} from 'lucide-react';

// SEO URL Helpers
const toSlug = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

const createDoctorSlug = (doc: Doctor) => {
    // Format: dr-name-specialty-id
    return `${toSlug(doc.name)}-${toSlug(doc.specialty)}-${doc.id}`;
};

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

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  isGuest: boolean;
  onLoginClick?: (phone?: string, name?: string) => void;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void;
  onCancelVisit: (clinicId: string, patientId: string) => void;
  onCheckIn: (clinicId: string, patientId: string) => void;
  preSelectedClinicId?: string;
  onClearPendingAction: () => void;
  initialSearchMode?: 'DOCTOR' | 'CLINIC';
}

function Ticket({ className }: { className?: string }) { 
    return ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" /> </svg> ); 
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
  clinics, userPhone, userName, isGuest, onLoginClick, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit, onCheckIn, preSelectedClinicId, onClearPendingAction, initialSearchMode
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeTab = useMemo<'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE'>(() => {
    const path = location.pathname;
    if (path.includes('/patient/visits')) return 'ACTIVE';
    if (path.includes('/patient/history')) return 'HISTORY';
    if (path.includes('/patient/profile')) return 'PROFILE';
    return 'BOOK';
  }, [location.pathname]);

  const bookingView = useMemo<'LIST' | 'CLINIC_DETAILS' | 'FORM'>(() => {
    const path = location.pathname;
    if (path.includes('/book/')) return 'FORM';
    if (path.includes('/clinic/')) return 'CLINIC_DETAILS';
    return 'LIST';
  }, [location.pathname]);

  const matchBook = useMatch('/patient/clinic/:clinicSlug/book/:doctorSlug');
  const matchClinic = useMatch('/patient/clinic/:clinicSlug');

  const selectedClinicSlug = matchBook?.params.clinicSlug || matchClinic?.params.clinicSlug || null;
  const selectedDoctorSlug = matchBook?.params.doctorSlug || null;

  const selectedClinic = useMemo(() => {
      if (!selectedClinicSlug) return undefined;
      return clinics.find(c => c.slug === selectedClinicSlug || c.id === selectedClinicSlug);
  }, [clinics, selectedClinicSlug]);

  const selectedDoctor = useMemo(() => {
      if (!selectedDoctorSlug || !selectedClinic) return undefined;
      return selectedClinic.doctors.find(d => createDoctorSlug(d) === selectedDoctorSlug || d.id === selectedDoctorSlug);
  }, [selectedClinic, selectedDoctorSlug]);

  const selectedClinicId = selectedClinic?.id || null;
  const selectedDoctorId = selectedDoctor?.id || null;

  useEffect(() => {
      if (location.pathname === '/patient' || location.pathname === '/patient/') {
          navigate('/patient/find', { replace: true });
      }
  }, [location.pathname, navigate]);

  useEffect(() => { 
      if (preSelectedClinicId) { 
          const clinic = clinics.find(c => c.id === preSelectedClinicId); 
          onClearPendingAction(); 
          if (clinic) { 
              setSelectedCity(clinic.city); 
              navigate(`/patient/clinic/${clinic.slug}`);
          } 
      } 
  }, [preSelectedClinicId, clinics, onClearPendingAction, navigate]);

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'DOCTOR' | 'CLINIC'>(initialSearchMode || 'CLINIC');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'NEAR' | 'WAIT' | 'FEE'>('NEAR');

  useEffect(() => {
      const q = searchParams.get('q');
      const city = searchParams.get('city');
      
      if (q) {
          setSearchQuery(q);
      }
      
      if (city) {
          const hasCity = clinics.some(c => c.city.toLowerCase() === city.toLowerCase());
          if (hasCity) {
              const matchedCity = clinics.find(c => c.city.toLowerCase() === city.toLowerCase())?.city;
              if (matchedCity) setSelectedCity(matchedCity);
          }
      }
  }, [searchParams, clinics]);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [travelTime, setTravelTime] = useState('15'); 
  const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF'); 
  
  const [showMap, setShowMap] = useState(true); 
  const clinicCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedClinicId, setHighlightedClinicId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false); 
  
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState('Male');

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; visit: any | null }>({ isOpen: false, visit: null });
  const [showLateWarningModal, setShowLateWarningModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; visit: any | null; rating: number; text: string }>({ isOpen: false, visit: null, rating: 0, text: '' });

  const navigateToView = (view: 'LIST' | 'CLINIC_DETAILS' | 'FORM', clinic: Clinic | null, doctor?: Doctor) => {
      if (view === 'LIST') navigate('/patient/find');
      else if (view === 'CLINIC_DETAILS' && clinic) navigate(`/patient/clinic/${clinic.slug}`);
      else if (view === 'FORM' && clinic && doctor) navigate(`/patient/clinic/${clinic.slug}/book/${createDoctorSlug(doctor)}`);
  };

  const handleTabSwitch = (newTab: 'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE') => {
      if (newTab === 'ACTIVE') navigate('/patient/visits');
      else if (newTab === 'HISTORY') navigate('/patient/history');
      else if (newTab === 'PROFILE') navigate('/patient/profile');
      else navigate('/patient/find');
  };

  const handleUIBack = () => {
      if (bookingView === 'FORM' && selectedClinic) {
           navigate(`/patient/clinic/${selectedClinic.slug}`);
      } else if (bookingView === 'CLINIC_DETAILS') {
           navigate('/patient/find');
      } else {
          onBack();
      }
  };

  const viewingDoctorClinic = useMemo(() => {
      if (!viewingDoctor) return undefined;
      if (selectedClinicId && selectedClinic) return selectedClinic;
      return clinics.find(c => c.doctors.some(d => d.id === viewingDoctor.id));
  }, [viewingDoctor, selectedClinicId, clinics, selectedClinic]);

  const travelEstimate = useMemo(() => {
      if (userLocation && selectedClinic?.geoLocation) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng);
          const mins = Math.ceil(dist * 2 + 5);
          return { dist: dist.toFixed(1), mins };
      }
      return null;
  }, [userLocation, selectedClinic]);

  useEffect(() => {
      if (travelEstimate) {
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

  const handleAddMember = () => { 
      if (!newMember.name || !newMember.age || !newMember.relation) { addToast("Please fill all details", "error"); return; } 
      if (userProfile) { 
          let updatedMembers = [...(userProfile.familyMembers || [])]; 
          if (editingMemberIndex !== null) { 
              updatedMembers[editingMemberIndex] = newMember; 
              addToast("Family member updated!", "success"); 
          } else { 
              updatedMembers.push(newMember); 
              addToast("Family member added!", "success"); 
          } 
          const updatedProfile = { ...userProfile, familyMembers: updatedMembers }; 
          setUserProfile(updatedProfile); 
          localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile)); 
          
          if (activeTab === 'BOOK' && bookingView === 'FORM') { setBookingFor(newMember.name); } 
          
          setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); 
          setEditingMemberIndex(null); 
          setShowAddMember(false); 
      } 
  };
  
  const handleEditMember = (index: number) => { 
      if (userProfile && userProfile.familyMembers[index]) { 
          const member = userProfile.familyMembers[index];
          setNewMember(member); 
          setEditingMemberIndex(index);
          setIsCustomRelation(!RELATIONSHIP_OPTIONS.includes(member.relation));
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
  
  const uniqueCities = useMemo(() => ['All Cities', ...Array.from(new Set(clinics.map(c => c.city))).sort()], [clinics]);
  
  const activeVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', room: doc?.roomNumber || '-' }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  const historyVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', notes: p.notes }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  
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

  const filteredDoctors = useMemo(() => {
      const allDoctors = clinics.flatMap(clinic => clinic.doctors.map(doctor => ({ doctor, clinic })));
      return allDoctors.filter(({ doctor, clinic }) => {
          const q = searchQuery.toLowerCase();
          
          if (q) {
              const matchesName = doctor.name.toLowerCase().includes(q);
              const matchesSpecialty = doctor.specialty.toLowerCase().includes(q);
              const matchesClinic = clinic.name.toLowerCase().includes(q);
              const matchesCity = clinic.city.toLowerCase().includes(q);
              
              if (!matchesName && !matchesSpecialty && !matchesClinic && !matchesCity) return false;
          }

          if (selectedCity !== 'All Cities' && clinic.city !== selectedCity) return false;
          if (selectedSpecialty !== 'All Specialties' && doctor.specialty !== selectedSpecialty) return false;

          if (selectedCategory !== 'ALL') {
              const cat = selectedCategory.toLowerCase();
              if (cat === 'dental' && !doctor.specialty.toLowerCase().includes('dent')) return false;
              else if (cat === 'pediatric' && !doctor.specialty.toLowerCase().includes('pedia')) return false;
          }

          return true;
      }).sort((a, b) => {
          if (sortBy === 'NEAR' && userLocation && a.clinic.geoLocation && b.clinic.geoLocation) {
              const distA = calculateDistance(userLocation.lat, userLocation.lng, a.clinic.geoLocation.lat, a.clinic.geoLocation.lng);
              const distB = calculateDistance(userLocation.lat, userLocation.lng, b.clinic.geoLocation.lat, b.clinic.geoLocation.lng);
              return distA - distB;
          }
          if (sortBy === 'FEE') return a.doctor.consultationFee - b.doctor.consultationFee;
          return b.doctor.rating - a.doctor.rating;
      });
  }, [clinics, searchQuery, selectedCity, selectedSpecialty, selectedCategory, sortBy, userLocation]);


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
          const term = selectedCategory.toLowerCase();
          if (term === 'dental') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (term === 'pediatric') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('pedia'));
          else if (term === 'ent') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('ent'));
          
          if (relevantDoctors.length === 0) relevantDoctors = clinic.doctors;
      }

      if (relevantDoctors.length === 0) {
          return { 
              min: 0, max: 0, label: 'No Doctors', 
              bgColor: 'bg-slate-100', textColor: 'text-slate-500', borderColor: 'border-slate-200', 
              raw: '0', mapColor: 'bg-slate-500', peopleCount: '0', dotColor: 'bg-slate-400' 
          };
      }

      const waitTimes = relevantDoctors.map(d => getDoctorWaitDetails(clinic, d.id));
      const times = waitTimes.map(w => w.time);
      const counts = waitTimes.map(w => w.count);
      
      const min = Math.min(...times);
      const max = Math.max(...times);
      const minPeople = Math.min(...counts);
      const maxPeople = Math.max(...counts);
      
      const avg = (min + max) / 2;
      
      let color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      let mapColor = 'bg-emerald-500';
      let label = 'Swift Movement'; // NEW Actionable Sentiment
      let dotColor = 'bg-emerald-500';
      
      if (avg <= 10) label = 'Immediate Entry';
      else if (avg <= 20) label = 'Ready for Walk-in';
      else if (avg > 20) { 
          color = 'bg-amber-100 text-amber-800 border-amber-200'; mapColor = 'bg-amber-500'; label = 'Steady Flow'; dotColor = 'bg-amber-500';
      }
      if (avg > 45) { 
          color = 'bg-rose-100 text-rose-800 border-rose-200'; mapColor = 'bg-rose-500'; label = 'High Demand'; dotColor = 'bg-rose-500';
      }

      const raw = min === max ? `${min}` : `${min}-${max}`;
      const peopleStr = minPeople === maxPeople ? `${minPeople}` : `${minPeople}-${maxPeople}`;
      
      return { min, max, label, bgColor: color.split(' ')[0], textColor: color.split(' ')[1], borderColor: color.split(' ')[2], raw, mapColor, peopleCount: peopleStr, dotColor };
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
  
  useEffect(() => { let timer: ReturnType<typeof setTimeout>; if (showQRScanner) { timer = setTimeout(() => { if (clinics.length > 0) { let targetClinicId = selectedClinicId; if (!targetClinicId) { const visitNeedsCheckIn = activeVisits.find(v => !v.isCheckedIn && v.status === PatientStatus.WAITING); targetClinicId = visitNeedsCheckIn ? visitNeedsCheckIn.clinicId : clinics[0].id; } const activeVisit = activeVisits.find(v => v.clinicId === targetClinicId && v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED); if (activeVisit) { if (!activeVisit.isCheckedIn) { onCheckIn(targetClinicId!, activeVisit.id); addToast(`Checked in at ${activeVisit.clinicName}!`, "success"); } else { addToast(`Already checked in at ${activeVisit.clinicName}.`, "info"); } navigate('/patient/visits'); } else { if (targetClinicId) { const targetClinic = clinics.find(c => c.id === targetClinicId); if(targetClinic) navigateToView('CLINIC_DETAILS', targetClinic); addToast("QR Detected. Loading clinic details...", "success"); } } setShowQRScanner(false); } }, 2000); } return () => clearTimeout(timer); }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn, addToast, navigate]);

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
      
      navigate('/patient/visits');
      setSymptoms(''); 
      setVisitType('WALK_IN'); 
      setApptDate(''); 
      setApptTime(''); 
      setBookingFor('MYSELF'); 
      setShowLateWarningModal(false); 
      setShowAuthModal(false);
      setViewingDoctor(null);
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
      setViewingDoctor(null); 
      if (!viewingDoctor) return;
      
      const clinic = clinics.find(c => c.doctors.some(d => d.id === viewingDoctor.id));
      
      if (clinic) {
          const mode = clinic.operationMode;
          // Set to available mode or fallback
          if ([ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(mode)) {
              setVisitType('WALK_IN');
          } else {
              setVisitType('APPOINTMENT');
          }
          navigateToView('FORM', clinic, viewingDoctor);
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

  // Map Handlers
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
    if (selectedClinicId && selectedClinic) { if (selectedClinic.geoLocation) return [selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng]; }
    if (filteredClinics.length > 0 && filteredClinics[0].geoLocation) { return [filteredClinics[0].geoLocation.lat, filteredClinics[0].geoLocation.lng]; }
    return [13.0850, 80.2100];
  }, [selectedClinicId, filteredClinics, userLocation, selectedClinic]);

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
          if (endMins <= startMins) endMins += 24 * 60;
          return currentMins >= startMins && currentMins < endMins; 
      }); 
  }, [selectedDoctor]);
  
  const isClinicDirectWalkInOnly = selectedClinic?.operationMode === ClinicOperationMode.DIRECT_WALK_IN;
  const isClinicOnlineWalkInAllowed = selectedClinic && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
  const isClinicApptAllowed = selectedClinic && [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);

  useEffect(() => { 
      if (selectedClinic) {
          if (isClinicDirectWalkInOnly) {
              setVisitType('WALK_IN'); // User sees "Walk In Only" banner
          } else if (isClinicOnlineWalkInAllowed && !isClinicApptAllowed) {
              setVisitType('WALK_IN');
          } else if (!isClinicOnlineWalkInAllowed && isClinicApptAllowed) {
              setVisitType('APPOINTMENT');
          } else if (selectedDoctorId && !isWalkInAllowed && visitType === 'WALK_IN' && isClinicApptAllowed) {
              setVisitType('APPOINTMENT'); 
          }
      }
  }, [selectedClinic, selectedDoctorId, isWalkInAllowed, visitType, isClinicDirectWalkInOnly, isClinicOnlineWalkInAllowed, isClinicApptAllowed]);

  const confirmCancel = () => { if (cancelModal.visit) { onCancelVisit(cancelModal.visit.clinicId, cancelModal.visit.id); addToast("Appointment Cancelled", "info"); setCancelModal({ isOpen: false, visit: null }); } };
  
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

  const navItems = [ { id: 'BOOK', label: 'Find Care', icon: Search }, { id: 'ACTIVE', label: 'Active Visits', icon: Ticket }, { id: 'HISTORY', label: 'History', icon: History }, { id: 'PROFILE', label: 'Profile', icon: User } ];
  const GuestLoginCard = () => ( <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center"> <div className="bg-slate-100 p-6 rounded-full mb-6"><Lock className="h-10 w-10 text-slate-400" /></div> <h3 className="text-xl font-bold text-slate-800 mb-2">Login Required</h3> <p className="text-slate-500 mb-8 max-w-xs">Please login to access your appointments and medical history.</p> <Button onClick={() => onLoginClick && onLoginClick()} size="lg" className="shadow-lg px-10">Login / Register</Button> </div> );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
        <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}> 
            <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6 justify-between'} border-b border-slate-100 relative`}>
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                    <Logo className="h-8 w-8 flex-shrink-0" />
                    <span className={`font-bold text-xl text-slate-900 tracking-tight transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Smart<span className="text-primary-600">QFlow</span></span>
                </div>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-primary-600 z-50 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                >
                    <ChevronLeft className="h-3 w-3" />
                </button>
            </div>
            <div className="flex-1 py-6 px-3 space-y-2"> 
                {navItems.map(item => ( 
                    <button 
                        key={item.id} 
                        onClick={() => handleTabSwitch(item.id as any)} 
                        className={`relative group w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === item.id ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    > 
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} /> 
                        <span className={`ml-3 transition-all duration-200 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            {item.label}
                        </span>
                        {isSidebarCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                {item.label}
                            </div>
                        )}
                    </button> 
                ))} 
            </div> 
            <div className="p-4 border-t border-slate-100"> 
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-0 py-2`}> 
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">{isGuest ? <User className="h-5 w-5" /> : userName.charAt(0)}</div> 
                    {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                            <p className="text-xs text-slate-500 truncate">{userPhone}</p>
                        </div>
                    )}
                </div> 
                <button onClick={isGuest ? () => onLoginClick && onLoginClick() : onBack} className={`w-full mt-2 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} p-2 text-sm ${isGuest ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}>
                    {isGuest ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                    {!isSidebarCollapsed && <span>{isGuest ? 'Login' : 'Logout'}</span>}
                </button>
            </div> 
        </aside>
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 w-full">
            {/* MOBILE & TABLET HEADER */}
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    {bookingView !== 'LIST' && activeTab === 'BOOK' ? (
                        <Button variant="ghost" size="sm" onClick={handleUIBack} className="p-0 mr-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={onBack} className="p-0 mr-2 hover:bg-slate-100 rounded-full text-red-500">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    )}
                    <div><h1 className="font-bold text-slate-900 leading-none text-lg">{activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Booking' : navItems.find(n => n.id === activeTab)?.label}</h1></div>
                </div>
                <div className="flex gap-2"><button onClick={() => setShowQRScanner(true)} className="bg-slate-900 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"><QrCode className="h-5 w-5" /> </button></div>
            </header>

            {/* DESKTOP HEADER (WITH BACK BUTTONS) */}
            <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shrink-0 z-10"> 
                <div className="flex items-center gap-4">
                    {bookingView !== 'LIST' && activeTab === 'BOOK' && (
                        <Button variant="ghost" size="sm" onClick={handleUIBack} className="p-2 mr-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft className="h-6 w-6 text-slate-700" />
                        </Button>
                    )}
                    <h2 className="text-2xl font-bold text-slate-900">
                        {activeTab === 'BOOK' ? (
                            bookingView === 'FORM' ? 'Appointment Details' : 
                            bookingView === 'CLINIC_DETAILS' ? 'Clinic Profile' : 'Find Care'
                        ) : activeTab === 'ACTIVE' ? 'Your Active Visits' : 
                        activeTab === 'HISTORY' ? 'Visit History' : 
                        activeTab === 'PROFILE' ? 'My Profile' : 'Search'
                        }
                    </h2>
                </div> 
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setShowQRScanner(true)} className="hidden md:flex">
                        <QrCode className="h-4 w-4 mr-2" /> Scan QR Code
                    </Button>
                    {bookingView === 'LIST' && (
                        <Button variant="ghost" onClick={onBack} className="text-red-500 hover:bg-red-50">
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    )}
                </div> 
            </header>

            <div className={`flex-1 flex flex-col w-full relative ${activeTab === 'BOOK' && bookingView === 'LIST' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden scroll-smooth pb-32 md:pb-8'}`}>
                {activeTab === 'ACTIVE' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full h-full px-4 md:px-8 py-6 max-w-[1920px] mx-auto"> {activeVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"> {activeVisits.map(visit => { const queueStats = getSmartQueueDetails(visit); return ( <Card key={visit.id} className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"> <div className="p-5 pb-2 flex justify-between items-start"><div><h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3><p className="text-sm text-slate-500">Dr. {visit.doctorName} • {visit.room ? `Room ${visit.room}` : ''}</p></div><Badge status={visit.status} /></div> <div className="px-5 mb-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit"><User className="h-3 w-3" /> {visit.name}</span></div> <div className="bg-slate-50 border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center"><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Token</div><div className="text-3xl font-black text-slate-900">#{visit.tokenNumber}</div></div><div className="border-x border-slate-200"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Now Serving</div><div className={`text-3xl font-bold ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>{visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken}</div></div><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People Ahead</div><div className="text-3xl font-bold text-slate-900">{queueStats.peopleAhead}</div></div></div> <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold`}>{queueStats.doctorStatus === DoctorStatus.ON_BREAK ? <Coffee className="h-5 w-5" /> : queueStats.doctorStatus === DoctorStatus.AVAILABLE ? <Timer className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}<div className="flex-1"><p>{queueStats.message}</p>{visit.status === PatientStatus.WAITING && (<p className="text-[10px] opacity-80 font-normal">Est. Time: {queueStats.expectedTime}</p>)}</div></div> {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 flex items-center gap-2 border-t border-orange-100"><Info className="h-4 w-4 flex-shrink-0" /><span>{queueStats.peopleAhead < 3 ? "Almost your turn! Please ask receptionist to Check-in now." : "Please ask receptionist to Check-in once you arrive."}</span></div>)} <div className="p-4 flex gap-2 mt-auto">{!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => setShowQRScanner(true)}><QrCode className="h-4 w-4 mr-2" /> Scan to Check-In</Button>)}<Button variant="secondary" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelModal({ isOpen: true, visit })} disabled={visit.status === PatientStatus.WITH_DOCTOR}>Cancel</Button></div> </Card> ); })} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><Calendar className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No active visits</h3><p className="text-slate-500 mb-6 text-center max-w-sm">Book an appointment or scan a QR code at a clinic to see your live status here.</p><Button onClick={() => handleTabSwitch('BOOK')} size="lg" className="shadow-lg">Find a Doctor</Button></div> )} </div> ) )}
                {activeTab === 'HISTORY' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full h-full px-4 md:px-8 py-6 max-w-[1920px] mx-auto"> {historyVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"> {historyVisits.map(visit => ( <div key={visit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 h-full hover:border-primary-200 transition-colors"> <div className="flex-1"> <div className="flex items-start gap-3 mb-3"> <div className={`p-3 rounded-lg flex-shrink-0 ${visit.status === PatientStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}> {visit.status === PatientStatus.COMPLETED ? <CheckCircle2 className="h-6 w-6" /> : <X className="h-6 w-6" />} </div> <div className="min-w-0"> <h3 className="font-bold text-slate-900 truncate text-base">{visit.clinicName}</h3> <p className="text-sm text-slate-500 truncate">Dr. {visit.doctorName}</p> <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(visit.timeAdded).toLocaleDateString()} at {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p> </div> </div> <div className="space-y-2"> {visit.diagnosis && ( <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"> <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Diagnosis</p> <p className="text-sm text-slate-700">{visit.diagnosis}</p> </div> )} {visit.notes && ( <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"> <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Notes</p> <p className="text-sm text-slate-700 text-ellipsis overflow-hidden line-clamp-3">{visit.notes}</p> </div> )} </div> </div> <div className="pt-3 border-t border-slate-100 flex justify-between items-center"> <div className="flex text-yellow-400 text-xs"> {visit.rating ? ( <> <Star className="h-3 w-3 fill-current" /> <span className="text-slate-600 ml-1 font-bold">{visit.rating}/5</span> </> ) : ( <span className="text-slate-400 italic">No rating</span> )} </div> <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFeedbackModal({ isOpen: true, visit, rating: visit.rating || 0, text: visit.feedback || '' })}> {visit.rating ? 'Edit Feedback' : 'Rate Visit'} </Button> </div> </div> ))} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><History className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No past visits</h3><p className="text-slate-500 mb-6 text-center max-w-sm">Your completed appointment history will appear here.</p></div> )} </div> ) )}
                {activeTab === 'PROFILE' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full max-w-3xl mx-auto px-4 py-8"> <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6"> <div className="bg-slate-900 p-6 text-white flex justify-between items-center"> <div className="flex items-center gap-4"> <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30"> {userName.charAt(0)} </div> <div> <h2 className="text-2xl font-bold">{userName}</h2> <p className="opacity-80 font-mono">{userPhone}</p> </div> </div> <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"> <LogOut className="h-5 w-5" /> </button> </div> <div className="p-6"> <div className="grid md:grid-cols-2 gap-6"> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.name}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.phone}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Age</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.age || '-'}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Gender</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.gender || '-'}</div> </div> </div> </div> </div> <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"> <div className="p-6 border-b border-slate-100 flex justify-between items-center"> <div> <h3 className="font-bold text-lg text-slate-900">Family Members</h3> <p className="text-sm text-slate-500">Manage profiles for your family</p> </div> <Button size="sm" onClick={() => { setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setEditingMemberIndex(null); setIsCustomRelation(false); setShowAddMember(true); }}> <Plus className="h-4 w-4 mr-2" /> Add Member </Button> </div> <div className="divide-y divide-slate-100"> {userProfile?.familyMembers && userProfile.familyMembers.length > 0 ? ( userProfile.familyMembers.map((member, idx) => ( <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"> <div className="flex items-center gap-4"> <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"> {member.name.charAt(0)} </div> <div> <div className="font-bold text-slate-900">{member.name}</div> <div className="text-xs text-slate-500">{member.relation} • {member.age} Yrs • {member.gender}</div> </div> </div> <div className="flex gap-2"> <button onClick={() => handleEditMember(idx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button> <button onClick={() => handleDeleteMember(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button> </div> </div> )) ) : ( <div className="p-8 text-center text-slate-400 italic">No family members added.</div> )} </div> </div> </div> ) )}

                {/* BOOK TAB (SEARCH & CLINIC VIEW) */}
                {activeTab === 'BOOK' && (
                    <div className="h-full flex flex-col">
                        {/* Search & Filter Bar */}
                        {bookingView === 'LIST' && (
                            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4 shadow-sm">
                                {/* Search Inputs */}
                                <div className="flex flex-col lg:flex-row gap-3 mb-4">
                                    <div className="flex-1 flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                placeholder={searchMode === 'CLINIC' ? "Search clinics..." : "Search doctors..."}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        
                                        {/* Integrated Mode Toggle */}
                                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 flex-shrink-0">
                                            <button 
                                                onClick={() => setSearchMode('CLINIC')}
                                                className={`flex items-center justify-center gap-2 px-3 rounded-lg text-sm font-bold transition-all ${searchMode === 'CLINIC' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                                                title="Search Clinics"
                                            >
                                                <Building2 className="h-4 w-4" />
                                                <span className="hidden sm:inline">Clinics</span>
                                            </button>
                                            <button 
                                                onClick={() => setSearchMode('DOCTOR')}
                                                className={`flex items-center justify-center gap-2 px-3 rounded-lg text-sm font-bold transition-all ${searchMode === 'DOCTOR' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                                                title="Search Doctors"
                                            >
                                                <Stethoscope className="h-4 w-4" />
                                                <span className="hidden sm:inline">Doctors</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        <select 
                                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                        >
                                            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                                        </select>
                                        <Button variant="secondary" className="whitespace-nowrap px-4" onClick={() => setShowMap(!showMap)}>
                                            {showMap ? 'Hide Map' : 'Show Map'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <cat.icon className="h-3 w-3" /> {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* List Section */}
                            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${showMap && bookingView !== 'FORM' ? '' : 'w-full'}`}>
                                {bookingView === 'LIST' ? (
                                    searchMode === 'CLINIC' ? (
                                        <div className={`grid gap-4 mx-auto ${showMap ? 'grid-cols-1 xl:grid-cols-2 max-w-5xl' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                            {filteredClinics.length > 0 ? (
                                                filteredClinics.map(clinic => {
                                                    const waitInfo = getClinicWaitStats(clinic);
                                                    const relevantDoctors = getRelevantDoctors(clinic);
                                                    const feeRange = getFeeRange(clinic);
                                                    
                                                    let distLabel = '---';
                                                    if (userLocation && clinic.geoLocation) {
                                                        const dist = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng).toFixed(1);
                                                        distLabel = `${dist} km`;
                                                    }

                                                    return (
                                                        <ClinicCard
                                                            key={clinic.id}
                                                            clinic={clinic}
                                                            waitInfo={waitInfo}
                                                            feeRange={feeRange}
                                                            rating={(Math.random() * 1 + 4).toFixed(1)} 
                                                            distLabel={distLabel}
                                                            gmapsLink={`https://www.google.com/maps/search/?api=1&query=${clinic.geoLocation?.lat},${clinic.geoLocation?.lng}`}
                                                            relevantDoctors={relevantDoctors}
                                                            isHighlighted={highlightedClinicId === clinic.id}
                                                            cardRef={el => { clinicCardRefs.current[clinic.id] = el; }}
                                                            onSelect={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                            onBook={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                            onQueue={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                            onViewDoctor={(doc) => setViewingDoctor(doc)}
                                                        />
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-20 text-slate-400 col-span-full">
                                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                    <p>No clinics found matching your criteria.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* DOCTOR SEARCH RESULTS */
                                        <div className={`grid gap-4 mx-auto ${showMap ? 'grid-cols-1 xl:grid-cols-2 max-w-5xl' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                            {filteredDoctors.length > 0 ? (
                                                filteredDoctors.map(({ doctor, clinic }) => {
                                                    let distLabel = '';
                                                    if (userLocation && clinic.geoLocation) {
                                                        distLabel = `${calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng).toFixed(1)} km`;
                                                    }
                                                    
                                                    // Determine availability label
                                                    const availability = getNextAvailability(doctor);
                                                    let nextSlotLabel = 'No Slots';
                                                    let isWalkIn = false;
                                                    
                                                    if (availability) {
                                                        if (availability.status === 'now') {
                                                            nextSlotLabel = 'Available Now';
                                                            isWalkIn = true;
                                                        } else {
                                                            nextSlotLabel = `Next: ${availability.start.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})} ${availability.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
                                                        }
                                                    }

                                                    return (
                                                        <DoctorSearchCard
                                                            key={doctor.id}
                                                            doctor={doctor}
                                                            clinic={clinic}
                                                            distLabel={distLabel}
                                                            nextSlotLabel={nextSlotLabel}
                                                            isWalkInAllowed={isWalkIn}
                                                            onBook={() => navigateToView('FORM', clinic, doctor)}
                                                            onViewProfile={() => setViewingDoctor(doctor)}
                                                        />
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-20 text-slate-400 col-span-full">
                                                    <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                    <p>No doctors found matching your criteria.</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : bookingView === 'CLINIC_DETAILS' && selectedClinic ? (
                                    // CLINIC DETAIL VIEW
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="h-48 bg-slate-200 relative">
                                                {selectedClinic.imageUrl ? (
                                                    <img src={selectedClinic.imageUrl} className="w-full h-full object-cover" alt={selectedClinic.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                        <Building2 className="h-16 w-16" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-4 left-6 text-white">
                                                    <h1 className="text-3xl font-bold shadow-sm">{selectedClinic.name}</h1>
                                                    <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedClinic.address}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-600">
                                                    {selectedClinic.operatingHours && <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full"><Clock className="h-4 w-4" /> {selectedClinic.operatingHours}</div>}
                                                    {selectedClinic.contactPhone && <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full"><Phone className="h-4 w-4" /> {selectedClinic.contactPhone}</div>}
                                                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full"><Star className="h-4 w-4 text-yellow-500 fill-current" /> 4.5 Rating</div>
                                                </div>

                                                <div className="mb-8">
                                                    <h3 className="font-bold text-slate-900 mb-2 text-lg">About Clinic</h3>
                                                    <p className="text-slate-600 leading-relaxed text-sm">
                                                        {selectedClinic.about || "A premier healthcare facility dedicated to providing comprehensive medical care."}
                                                    </p>
                                                </div>

                                                {selectedClinic.amenities && (
                                                    <div className="mb-8">
                                                        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Facilities</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedClinic.amenities.map(a => (
                                                                <span key={a} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">{a}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="border-t border-slate-100 pt-8">
                                                    <h3 className="font-bold text-slate-900 mb-4 text-xl">Available Doctors</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {selectedClinic.doctors.map(doc => {
                                                            const docWait = getDoctorWaitDetails(selectedClinic, doc.id);
                                                            const canQueue = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
                                                            
                                                            return (
                                                                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 flex gap-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer bg-white group" onClick={() => navigateToView('FORM', selectedClinic, doc)}>
                                                                    <img src={doc.avatarUrl} className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-100" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <h4 className="font-bold text-slate-900 truncate">{doc.name}</h4>
                                                                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">₹{doc.consultationFee}</span>
                                                                        </div>
                                                                        <p className="text-sm text-primary-600 font-medium">{doc.specialty}</p>
                                                                        
                                                                        {/* NEW: LIVE QUEUE DETAILS IN CLINIC PROFILE */}
                                                                        {canQueue ? (
                                                                            <div className="flex items-center gap-2 mt-2">
                                                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${docWait.time < 30 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${docWait.time < 30 ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
                                                                                    ~{docWait.time}m wait
                                                                                </div>
                                                                                <span className="text-[10px] text-slate-400 font-medium">{docWait.count} ahead</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                                                <span>{doc.experience} Yrs Exp</span>
                                                                                <span>•</span>
                                                                                <span>{doc.rating} ★</span>
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-3">
                                                                            <span className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-lg group-hover:bg-primary-600 transition-all shadow-md group-hover:shadow-primary-200">
                                                                                {canQueue ? 'Join Queue' : 'Book Visit'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : bookingView === 'FORM' && selectedDoctor ? (
                                    // BOOKING FORM
                                    <div className="max-w-2xl mx-auto space-y-6 pb-20">
                                        {/* Doctor Header */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
                                            <img src={selectedDoctor.avatarUrl} className="w-20 h-20 rounded-xl object-cover border border-slate-100" />
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                                                <p className="text-primary-600 font-medium">{selectedDoctor.specialty}</p>
                                                <p className="text-sm text-slate-500 mt-1">{selectedClinic?.name} • Room {selectedDoctor.roomNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900">₹{selectedDoctor.consultationFee}</p>
                                                <p className="text-xs text-slate-400">Consultation Fee</p>
                                            </div>
                                        </div>

                                        {/* Booking Form */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                                            {/* Patient Selector */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-3">Who is this for?</label>
                                                <div className="flex flex-wrap gap-3">
                                                    <button 
                                                        onClick={() => setBookingFor('MYSELF')}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${bookingFor === 'MYSELF' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <User className="h-4 w-4" /> Myself
                                                    </button>
                                                    {userProfile?.familyMembers?.map(m => (
                                                        <button 
                                                            key={m.name}
                                                            onClick={() => setBookingFor(m.name)}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${bookingFor === m.name ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <Users className="h-4 w-4" /> {m.name}
                                                        </button>
                                                    ))}
                                                    <button onClick={() => { setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setEditingMemberIndex(null); setIsCustomRelation(false); setShowAddMember(true); }} className="px-4 py-2 rounded-xl text-sm font-bold border border-dashed border-slate-300 text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center gap-2">
                                                        <Plus className="h-4 w-4" /> New
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Guest Details if applicable */}
                                            {isGuest && (
                                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <Input label="Your Name" value={guestName} onChange={e => setGuestName(e.target.value)} required placeholder="Full Name" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input label="Age" value={guestAge} onChange={e => setGuestAge(e.target.value)} required type="number" placeholder="Yrs" />
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                                            <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm h-10" value={guestGender} onChange={e => setGuestGender(e.target.value)}>
                                                                <option>Male</option><option>Female</option><option>Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Visit Type (Walk-in vs Appointment) */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-3">Visit Type</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Walk-in Option */}
                                                    <div 
                                                        onClick={() => {
                                                            if (isClinicDirectWalkInOnly) return; 
                                                            if (!isClinicOnlineWalkInAllowed) return; // Disable if online walkin not allowed
                                                            setVisitType('WALK_IN');
                                                        }}
                                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${visitType === 'WALK_IN' ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : isClinicOnlineWalkInAllowed ? 'border-slate-200 hover:border-slate-300' : 'border-slate-100 opacity-50 cursor-not-allowed'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`font-bold ${visitType === 'WALK_IN' ? 'text-primary-800' : 'text-slate-700'}`}>Walk-In Now</span>
                                                            {visitType === 'WALK_IN' && <CheckCircle2 className="h-5 w-5 text-primary-600" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500">Join the live queue immediately.</p>
                                                        <div className={`mt-3 text-xs font-bold ${waitStats.time < 30 ? 'text-green-600' : 'text-orange-600'}`}>
                                                            ~{waitStats.time} mins wait • {waitStats.count} ahead
                                                        </div>
                                                        {!isClinicOnlineWalkInAllowed && !isClinicDirectWalkInOnly && (
                                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                                                                <span className="bg-white px-2 py-1 rounded text-[10px] font-bold shadow-sm text-slate-500 border">Not Available</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Appointment Option */}
                                                    <div 
                                                        onClick={() => {
                                                            if (!isClinicApptAllowed) return; 
                                                            setVisitType('APPOINTMENT'); 
                                                            if(!apptDate) setApptDate(bookingDates.find(d => !d.isOff)?.dateStr || '');
                                                        }}
                                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${visitType === 'APPOINTMENT' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100' : isClinicApptAllowed ? 'border-slate-200 hover:border-slate-300' : 'border-slate-100 opacity-50 cursor-not-allowed'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`font-bold ${visitType === 'APPOINTMENT' ? 'text-purple-800' : 'text-slate-700'}`}>Schedule for Later</span>
                                                            {visitType === 'APPOINTMENT' && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500">Book a specific time slot.</p>
                                                        {!isClinicApptAllowed && (
                                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                                                                <span className="bg-white px-2 py-1 rounded text-[10px] font-bold shadow-sm text-slate-500 border">Not Available</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Travel Time Logic for Walk-in */}
                                            {visitType === 'WALK_IN' && (
                                                <div className="space-y-3 animate-in fade-in">
                                                    <label className="block text-sm font-bold text-slate-700">How long will it take you to reach?</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {['5', '10', '15', '20', '30', '45', '60'].map(m => (
                                                            <button 
                                                                key={m}
                                                                onClick={() => setTravelTime(m)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${travelTime === m ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                            >
                                                                {m} min
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-slate-400">We use this to estimate your arrival and hold your spot if needed.</p>
                                                </div>
                                            )}

                                            {/* Appointment Slot Picker */}
                                            {visitType === 'APPOINTMENT' && (
                                                <div className="space-y-4 animate-in fade-in">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Date</label>
                                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                                            {bookingDates.map(day => (
                                                                <button
                                                                    key={day.dateStr}
                                                                    disabled={day.isOff}
                                                                    onClick={() => { setApptDate(day.dateStr); setApptTime(''); }}
                                                                    className={`flex-shrink-0 w-14 h-20 rounded-xl border flex flex-col items-center justify-center transition-all ${apptDate === day.dateStr ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : day.isOff ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">{day.dayShort}</span>
                                                                    <span className="text-xl font-bold">{day.dayNum}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {apptDate && (
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Time</label>
                                                            {!hasAnySlots ? (
                                                                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-sm">No slots available for this date.</div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {(Object.entries(groupedTimeSlots) as [string, {value: string, label: string}[]][]).map(([period, slots]) => slots.length > 0 && (
                                                                        <div key={period}>
                                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{period}</h4>
                                                                            <div className="grid grid-cols-4 gap-2">
                                                                                {slots.map(slot => (
                                                                                    <button
                                                                                        key={slot.value}
                                                                                        onClick={() => setApptTime(slot.value)}
                                                                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${apptTime === slot.value ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}
                                                                                    >
                                                                                        {slot.value}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Symptoms */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Visit (Optional)</label>
                                                <textarea 
                                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none h-20"
                                                    placeholder="e.g. Fever since last night, Stomach ache..."
                                                    value={symptoms}
                                                    onChange={e => setSymptoms(e.target.value)}
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <Button 
                                                size="lg" 
                                                className={`w-full h-14 text-lg font-bold shadow-xl transform active:scale-[0.98] transition-all ${visitType === 'APPOINTMENT' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200'}`}
                                                disabled={visitType === 'APPOINTMENT' && (!apptDate || !apptTime)}
                                                onClick={handleBookToken}
                                            >
                                                {visitType === 'APPOINTMENT' ? 'Confirm Appointment' : 'Join Queue Now'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Map Panel (Desktop Right) - REMOVED from Appointment Form for focus */}
                            {showMap && bookingView !== 'FORM' && (
                                <MapPanel
                                    clinics={filteredClinics}
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
                                    onBookClick={(id) => {
                                        const c = clinics.find(x => x.id === id);
                                        if (c) navigateToView('CLINIC_DETAILS', c);
                                    }}
                                    onClosePickingLocation={() => setIsPickingLocation(false)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION (PERSISTENT) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
                <div className="flex justify-around items-center h-20">
                    {navItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabSwitch(item.id as any)}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all ${isActive ? 'text-primary-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <item.icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </main>

        {/* MODALS */}
        <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title={editingMemberIndex !== null ? "Edit Family Member" : "Add Family Member"} maxWidth="max-w-md">
            <div className="space-y-4 pt-2">
                <Input label="Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Age" type="number" value={newMember.age} onChange={e => setNewMember({ ...newMember, age: e.target.value })} required />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={newMember.gender} onChange={e => setNewMember({ ...newMember, gender: e.target.value })}>
                            <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                    {!isCustomRelation ? (
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 mb-2" value={newMember.relation} onChange={e => { if (e.target.value === 'Other') setIsCustomRelation(true); else setNewMember({ ...newMember, relation: e.target.value }); }}>
                            <option value="">Select...</option>
                            {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            <option value="Other">Other (Type custom)</option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <Input placeholder="e.g. Uncle" value={newMember.relation} onChange={e => setNewMember({ ...newMember, relation: e.target.value })} className="flex-1" autoFocus />
                            <Button variant="secondary" onClick={() => setIsCustomRelation(false)}>List</Button>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
                    <Button onClick={handleAddMember}>Save Member</Button>
                </div>
            </div>
        </Modal>

        {/* FEEDBACK MODAL */}
        <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} title="Rate Your Visit" maxWidth="max-w-md">
            <div className="text-center py-4">
                <p className="text-slate-500 mb-4">How was your experience with <strong>Dr. {feedbackModal.visit?.doctorName}</strong>?</p>
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setFeedbackModal({ ...feedbackModal, rating: star })} className="transition-transform hover:scale-110 focus:outline-none">
                            <Star className={`h-10 w-10 ${star <= feedbackModal.rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                        </button>
                    ))}
                </div>
                <textarea 
                    className="w-full p-3 border border-slate-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    rows={3}
                    placeholder="Write a review (optional)..."
                    value={feedbackModal.text}
                    onChange={(e) => setFeedbackModal({...feedbackModal, text: e.target.value})}
                />
                <Button onClick={handleSubmitFeedback} disabled={feedbackModal.rating === 0} className="w-full">Submit Feedback</Button>
            </div>
        </Modal>

        {/* LATE WARNING MODAL */}
        <Modal isOpen={showLateWarningModal} onClose={() => setShowLateWarningModal(false)} title="Late Arrival Warning" maxWidth="max-w-sm">
            <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-slate-600 mb-6">
                    Your travel time ({travelTime} mins) is longer than the current estimated wait time.
                    You might arrive late and lose your spot.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={submitBooking} className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                        Book Anyway (I'll Rush)
                    </Button>
                    <Button variant="secondary" onClick={() => setShowLateWarningModal(false)} className="w-full">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>

        <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            onSuccess={handleAuthSuccess}
            initialName={guestName}
            initialAge={guestAge}
            initialGender={guestGender}
            addToast={addToast}
        />

        <DoctorProfileModal 
            isOpen={!!viewingDoctor} 
            onClose={() => setViewingDoctor(null)} 
            doctor={viewingDoctor} 
            operationMode={viewingDoctorClinic?.operationMode}
            onBook={handleBookFromProfile}
        />
        
        {/* Cancel Confirmation Modal */}
        {cancelModal.isOpen && (
            <Modal isOpen={true} onClose={() => setCancelModal({ isOpen: false, visit: null })} title="Cancel Visit?" maxWidth="max-w-sm">
                <div className="text-center">
                    <p className="text-slate-600 mb-6">Are you sure you want to cancel your visit? This action cannot be undone.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setCancelModal({ isOpen: false, visit: null })}>Keep Visit</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmCancel}>Yes, Cancel</Button>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
};
