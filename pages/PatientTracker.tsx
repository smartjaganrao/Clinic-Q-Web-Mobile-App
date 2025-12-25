import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useMatch, useLocation, useSearchParams } from 'react-router-dom';
import { Clinic, Patient, PatientStatus, DoctorStatus, Doctor, ClinicOperationMode, Review, TimeSlot } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';
// Imported Modules - Fixed Paths
import { ClinicCard } from '../features/patient/components/ClinicCard';
import { DoctorSearchCard } from '../features/patient/components/DoctorSearchCard';
import { DoctorProfileModal } from '../features/patient/components/DoctorProfileModal';
import { MapPanel } from '../features/patient/components/MapPanel';
import { Filter } from '../features/patient/components/Filter';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import L from 'leaflet';

import { 
    ArrowLeft, MapPin, Search, Calendar, QrCode, 
    AlertTriangle, Star, Clock, Stethoscope, Smile, 
    Baby, Heart, Activity, Sparkles, LayoutGrid, Eye, Ear, 
    Navigation, Timer, Building2, 
    Info, Lock, History, X, AlertCircle, Sun, Moon,
    User, Users, Plus, LogOut, Coffee, LogIn, CloudSun, List as ListIcon, Crosshair, Zap, ExternalLink, ShieldCheck,
    CheckCircle2, Globe, Edit2, Trash2, Footprints, ChevronRight, ChevronLeft, FileText, MoonStar, MessageSquare, Phone, RefreshCw, Map as MapIcon, Languages, MapPinIcon, ThumbsUp, ArrowUpDown, GraduationCap, Award, SlidersHorizontal, ChevronDown, Medal, CalendarClock, Home, LocateFixed, BriefcaseMedical
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

const isClinicOpen = (hours?: string, timezone?: string) => {
    if (!hours) return false;
    if (hours.toLowerCase() === '24 hours') return true;
    try {
        const now = getClinicCurrentTime(timezone);
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

const formatTime12h = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr);
    const m = mStr.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${m} ${ampm}`;
};

// Get current time in clinic's timezone
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

// --- HELPERS ---
const getLocalToday = (timezone?: string) => {
    const d = getClinicCurrentTime(timezone);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CATEGORIES = [
    { id: 'ALL', label: 'All Specializations', icon: LayoutGrid },
    { id: 'GENERAL', label: 'General Practice', icon: Stethoscope },
    { id: 'DENTAL', label: 'Dental Care', icon: Smile },
    { id: 'PEDIATRIC', label: 'Child Care (KIDS)', icon: Baby },
    { id: 'GYNECOLOGY', label: 'Women\'s Health', icon: Heart },
    { id: 'ORTHOPEDIC', label: 'Bone & Joint', icon: Activity },
    { id: 'DERMATOLOGY', label: 'Skin Care', icon: Sparkles },
    { id: 'OPHTHALMOLOGY', label: 'Eye Care', icon: Eye },
    { id: 'ENT', label: 'ENT Care', icon: Ear },
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
    Morning: {value: string, label: string, isBlocked?: boolean, isFull?: boolean, isBooked?: boolean}[];
    Afternoon: {value: string, label: string, isBlocked?: boolean, isFull?: boolean, isBooked?: boolean}[];
    Evening: {value: string, label: string, isBlocked?: boolean, isFull?: boolean, isBooked?: boolean}[];
    Night: {value: string, label: string, isBlocked?: boolean, isFull?: boolean, isBooked?: boolean}[];
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

function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m 6 13 8.5 10" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const searchBarContainerRef = useRef<HTMLDivElement>(null);

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTab = useMemo<'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE'>(() => {
    const path = location.pathname;
    if (path.includes('/patient/visits')) return 'ACTIVE';
    if (path.includes('/patient/history')) return 'HISTORY';
    if (path.includes('/patient/profile')) return 'PROFILE';
    return 'BOOK';
  }, [location.pathname]);

  const bookingView = useMemo<'LIST' | 'CLINIC_DETAILS' | 'DOCTOR_PROFILE' | 'FORM'>(() => {
    const path = location.pathname;
    if (path.includes('/book/')) return 'FORM';
    if (path.includes('/doctor/')) return 'DOCTOR_PROFILE';
    if (path.includes('/clinic/')) return 'CLINIC_DETAILS';
    return 'LIST';
  }, [location.pathname]);

  const matchBook = useMatch('/patient/clinic/:clinicSlug/book/:doctorSlug');
  const matchClinic = useMatch('/patient/clinic/:clinicSlug');
  const matchDoctor = useMatch('/patient/doctor/:doctorId');

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

  const selectedProfileDoctor = useMemo(() => {
      if (!matchDoctor?.params.doctorId) return undefined;
      // Find the doctor across all clinics by masterId
      for (const clinic of clinics) {
          const doctor = clinic.doctors.find(d => d.masterId === matchDoctor.params.doctorId);
          if (doctor) return doctor;
      }
      return undefined;
  }, [clinics, matchDoctor?.params.doctorId]);

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
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'NEAR' | 'WAIT' | 'FEE'>('NEAR');
  
  const [selectedDoctorGender, setSelectedDoctorGender] = useState<string>('ALL');
  const [selectedMinExperience, setSelectedMinExperience] = useState<number>(0);

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

  // Click outside listener for global suggestions
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (searchBarContainerRef.current && !searchBarContainerRef.current.contains(e.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [memberToDeleteIndex, setMemberToDeleteIndex] = useState<number | null>(null);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [travelTime, setTravelTime] = useState('15'); 
  const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF'); 
  const [selectedWalkInShiftId, setSelectedWalkInShiftId] = useState<string | null>(null);
  
  const [showMap, setShowMap] = useState(true); 
  const clinicCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedClinicId, setHighlightedClinicId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState('Male');

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; visit: any | null }>({ isOpen: false, visit: null });
  const [showLateWarningModal, setShowLateWarningModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false); // NEW: State for summary confirmation popup
  const [showTravelTimeWarning, setShowTravelTimeWarning] = useState(false); // NEW: State for travel time change warning
  const [doctorProfileModal, setDoctorProfileModal] = useState<{ isOpen: boolean; doctor: Doctor | null; clinic: Clinic | null }>({ isOpen: false, doctor: null, clinic: null });

  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; visit: any | null; rating: number; text: string }>({ isOpen: false, visit: null, rating: 0, text: '' });

  const navigateToView = (view: 'LIST' | 'CLINIC_DETAILS' | 'DOCTOR_PROFILE' | null, clinic?: Clinic | null, doctor?: Doctor, visitType?: 'WALK_IN' | 'APPOINTMENT') => {
      if (view === 'LIST') navigate('/patient/find');
      else if (view === 'CLINIC_DETAILS' && clinic) navigate(`/patient/clinic/${clinic.slug}`);
      else if (view === 'DOCTOR_PROFILE' && doctor) {
          if (clinic) {
              // Show modal when clinic context is provided
              setDoctorProfileModal({ isOpen: true, doctor, clinic });
          } else {
              // Show full page when no clinic context
              navigate(`/patient/doctor/${doctor.masterId}`);
          }
      }
      else if (clinic && doctor) {
          // Pre-select visit type if provided
          if (visitType) {
              setVisitType(visitType);
          }
          navigate(`/patient/clinic/${clinic.slug}/book/${createDoctorSlug(doctor)}`);
      }
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

  const globalSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedClinics = clinics.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 4);
    const matchedDoctors: { clinic: Clinic, doctor: Doctor }[] = [];
    
    clinics.forEach(c => {
        c.doctors.forEach(d => {
            if (d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)) {
                if (matchedDoctors.length < 5) matchedDoctors.push({ clinic: c, doctor: d });
            }
        });
    });

    return { clinics: matchedClinics, doctors: matchedDoctors };
  }, [searchQuery, clinics]);

  const handleSuggestionClick = (type: 'CLINIC' | 'DOCTOR', item: any) => {
      setShowSuggestions(false);
      setSearchQuery('');
      if (type === 'CLINIC') {
          navigateToView('CLINIC_DETAILS', item);
      } else {
          navigateToView(null, item.clinic, item.doctor);
      }
  };

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
  
  const handleDeleteMember = () => { 
      if (userProfile && memberToDeleteIndex !== null) { 
          const updatedMembers = userProfile.familyMembers.filter((_, i) => i !== memberToDeleteIndex); 
          const updatedProfile = { ...userProfile, familyMembers: updatedMembers }; 
          setUserProfile(updatedProfile); 
          localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile)); 
          addToast("Family member removed.", "info"); 
          setMemberToDeleteIndex(null);
      } 
  };
  
  const uniqueCities = useMemo(() => ['All Cities', ...Array.from(new Set(clinics.map(c => c.city))).sort()], [clinics]);
  
  const activeVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', room: doc?.roomNumber || '-' }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  const historyVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', notes: p.notes }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  
  const unratedCompletedVisit = useMemo(() => {
    return historyVisits.find(v => v.status === PatientStatus.COMPLETED && !v.rating);
  }, [historyVisits]);

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
          filtered = filtered.filter(c => clinics.some(clinic => clinic.id === c.id && clinic.doctors.some(d => d.specialty === selectedSpecialty)));
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
      if (selectedDoctorGender !== 'ALL') {
          filtered = filtered.filter(c => c.doctors.some(d => d.gender === selectedDoctorGender));
      }
      if (selectedMinExperience > 0) {
          filtered = filtered.filter(c => c.doctors.some(d => (d.experience || 0) >= selectedMinExperience));
      }
      if (showOpenOnly) {
          filtered = filtered.filter(c => isClinicOpen(c.operatingHours, c.timezone));
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
  }, [clinics, searchQuery, selectedCategory, sortBy, selectedCity, selectedSpecialty, userLocation, showOpenOnly, selectedDoctorGender, selectedMinExperience]);

  // Helper: Get Capacity Stats for a specific Shift
  const getShiftStats = (doctor: Doctor, shift: TimeSlot, dateStr: string, clinicPatients: Patient[], clinic: Clinic) => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      let endTotal = endH * 60 + endM;
      if (endTotal <= startTotal) endTotal += 24 * 60;

      const duration = endTotal - startTotal;
      const capacity = Math.floor(duration / (doctor.consultationTime || 15));

      // Load = Patients in this shift (today's walk-ins + appointments on this date)
      const shiftPatients = clinicPatients.filter(p => {
          if (p.doctorId !== doctor.id) return false;
          if (p.status === PatientStatus.CANCELLED) return false;
          
          if (p.visitType === 'APPOINTMENT' && p.appointmentDate === dateStr && p.appointmentTime) {
              const [ph, pm] = p.appointmentTime.split(':').map(Number);
              const pTotalMins = ph * 60 + pm;
              return pTotalMins >= startTotal && pTotalMins < endTotal;
          }
          
          const pDate = new Date(p.timeAdded);
          const pDateStr = pDate.toISOString().split('T')[0];
          if (p.visitType === 'WALK_IN' && pDateStr === dateStr) {
              const pTotal = pDate.getHours() * 60 + pDate.getMinutes();
              return pTotal >= startTotal && pTotal < endTotal;
          }
          
          return false;
      });

      const now = getClinicCurrentTime(clinic.timezone);
      return {
          capacity,
          load: shiftPatients.length,
          isFull: shiftPatients.length >= capacity,
          remainingMins: endTotal - (now.getHours() * 60 + now.getMinutes()),
          totalWaitMins: shiftPatients.length * (doctor.consultationTime || 15)
      };
  };

  // Grouped Doctor Logic to handle multi-clinic display
  const groupedDoctors = useMemo(() => {
      const allOccurrences = clinics.flatMap(clinic => 
          clinic.doctors.map(doc => ({ doc, clinic }))
      );

      const filteredOccurrences = allOccurrences.filter(({ doc, clinic }) => {
          const q = searchQuery.toLowerCase();
          
          if (q) {
              const matchesName = doc.name.toLowerCase().includes(q);
              const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
              const matchesClinic = clinic.name.toLowerCase().includes(q);
              const matchesCity = clinic.city.toLowerCase().includes(q);
              
              if (!matchesName && !matchesSpecialty && !matchesClinic && !matchesCity) return false;
          }

          if (selectedCity !== 'All Cities' && clinic.city !== selectedCity) return false;
          if (selectedSpecialty !== 'All Specialties' && doc.specialty !== selectedSpecialty) return false;

          if (selectedCategory !== 'ALL') {
              const cat = selectedCategory.toLowerCase();
              if (cat === 'dental' && !doc.specialty.toLowerCase().includes('dent')) return false;
              else if (cat === 'pediatric' && !doc.specialty.toLowerCase().includes('pedia')) return false;
          }
          
          if (selectedDoctorGender !== 'ALL' && doc.gender !== selectedDoctorGender) return false;
          if (selectedMinExperience > 0 && (doc.experience || 0) < selectedMinExperience) return false;

          return true;
      });

      // Grouping by masterId
      const groups: Record<string, { masterDoc: Doctor, locations: { clinic: Clinic, docInstance: Doctor, distance: number | null }[] }> = {};
      
      filteredOccurrences.forEach(({ doc, clinic }) => {
          const mId = doc.masterId;
          if (!groups[mId]) {
              groups[mId] = { masterDoc: doc, locations: [] };
          }
          
          let dist = null;
          if (userLocation && clinic.geoLocation) {
              dist = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
          }
          
          groups[mId].locations.push({ clinic, docInstance: doc, distance: dist });
      });

      return Object.values(groups).sort((a, b) => {
          if (sortBy === 'NEAR' && userLocation) {
              const minA = Math.min(...a.locations.map(l => l.distance ?? 99999));
              const minB = Math.min(...b.locations.map(l => l.distance ?? 99999));
              return minA - minB;
          }
          if (sortBy === 'FEE') {
              const minFeeA = Math.min(...a.locations.map(l => l.docInstance.consultationFee));
              const minFeeB = Math.min(...b.locations.map(l => l.docInstance.consultationFee));
              return minFeeA - minFeeB;
          }
          if (sortBy === 'WAIT') {
              const getMinWait = (group: any) => Math.min(...group.locations.map((l: any) => l.clinic.patients.filter((p: any) => p.status === PatientStatus.WAITING && p.doctorId === l.docInstance.id).length));
              return getMinWait(a) - getMinWait(b);
          }
          return (b.masterDoc.experience || 0) - (a.masterDoc.experience || 0);
      });
  }, [clinics, searchQuery, selectedCity, selectedSpecialty, selectedCategory, sortBy, userLocation, selectedDoctorGender, selectedMinExperience]);


  const getDoctorWaitDetails = (clinic: Clinic, doctorId: string) => {
      const doc = clinic.doctors.find(d => d.id === doctorId);
      if (!doc) return { count: 0, time: 0 };
      const physicalQueue = clinic.patients.filter(p => p.doctorId === doctorId && p.status === PatientStatus.WAITING);
      let waitMinutes = physicalQueue.length * 15;
      waitMinutes += (doc.delayMinutes || 0);
      const now = getClinicCurrentTime(clinic.timezone);
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = getLocalToday(clinic.timezone);
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

  const waitStats = useMemo(() => {
    if (selectedClinic && selectedDoctor) {
        return getDoctorWaitDetails(selectedClinic, selectedDoctor.id);
    }
    return { count: 0, time: 0 };
  }, [selectedClinic, selectedDoctor, clinics]);

  const getClinicWaitStats = (clinic: Clinic) => {
      // Check if clinic is open
      const isOpen = isClinicOpen(clinic.operatingHours, clinic.timezone);
      
      if (!isOpen) {
          return { 
              min: 0, max: 0, label: 'Clinic Closed', 
              bgColor: 'bg-slate-100', textColor: 'text-slate-500', borderColor: 'border-slate-200', 
              raw: 'Closed', mapColor: 'bg-slate-500', peopleCount: '0', dotColor: 'bg-slate-400' 
          };
      }

      let relevantDoctors = clinic.doctors;
      if (selectedCategory !== 'ALL') {
          const term = selectedCategory.toLowerCase();
          if (term === 'dental') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (term === 'pediatric') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('pedia'));
          else if (term === 'ent') relevantDoctors = relevantDoctors.filter(d => d.specialty.includes('ENT'));
          
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
      let label = 'Swift Movement'; 
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

  const getFeeRange = (clinic: Clinic) => { if (!clinic.doctors.length) return 'N/A'; const fees = clinic.doctors.map(d => d.consultationFee); const min = Math.min(...fees); const max = Math.min(...fees) === Math.max(...fees) ? Math.min(...fees) : Math.max(...fees); return min === max ? `₹${min}` : `₹${min} - ₹${max}`; };
  
  const getRelevantDoctors = (clinic: Clinic) => {
      let relevant = clinic.doctors;
      if (selectedSpecialty !== 'All Specialties') {
          relevant = relevant.filter(d => d.specialty === selectedSpecialty);
      } else if (selectedCategory !== 'ALL') {
          const cat = selectedCategory.toLowerCase();
          if (cat === 'dental') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (cat === 'pediatric') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('pedia'));
          else if (cat === 'ent') relevant = relevant.filter(d => d.specialty.includes('ENT'));
      }
      
      if (selectedDoctorGender !== 'ALL') {
          relevant = relevant.filter(d => d.gender === selectedDoctorGender);
      }
      if (selectedMinExperience > 0) {
          relevant = relevant.filter(d => (d.experience || 0) >= selectedMinExperience);
      }

      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matched = relevant.filter(d => d.name.toLowerCase().includes(q));
          if (matched.length > 0) relevant = matched;
      }
      return relevant;
  };

  const getSmartQueueDetails = (visit: any) => { 
      const clinic = clinics.find(c => c.id === visit.clinicId); 
      const doctor = clinic?.doctors.find(d => d.id === visit.doctorId); 
      if (!clinic || !doctor) return { peopleAhead: 0, waitTime: 0, currentToken: '-', message: 'Loading...', color: 'text-slate-500' }; 
      
      const now = getClinicCurrentTime(clinic.timezone); 
      const isToday = visit.appointmentDate === getLocalToday(clinic.timezone) || visit.visitType === 'WALK_IN';

      // SHIFT SPECIFIC PEOPLE AHEAD CALCULATION
      const getPatientShiftMins = (p: Patient, doc: Doctor) => {
          const pTimeStr = p.visitType === 'APPOINTMENT' ? p.appointmentTime : new Date(p.timeAdded).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          if (!pTimeStr) return null;
          const [ph, pm] = pTimeStr.split(':').map(Number);
          const pTotalMins = ph * 60 + pm;
          const pVisitDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
          const dayName = new Date(pVisitDate || Date.now()).toLocaleDateString('en-US', { weekday: 'long' });
          const schedule = doc.weeklySchedule.find(s => s.day === dayName);
          if (!schedule) return null;
          return schedule.slots.find(slot => {
              const [sh, sm] = slot.startTime.split(':').map(Number);
              const [eh, em] = slot.endTime.split(':').map(Number);
              const startTotal = sh * 60 + sm;
              let endTotal = eh * 60 + em;
              if (endTotal <= startTotal) endTotal += 1440;
              return pTotalMins >= startTotal && pTotalMins < endTotal;
          });
      };

      const myShift = getPatientShiftMins(visit, doctor);
      const peopleAhead = clinic.patients.filter(p => {
          if (p.doctorId !== visit.doctorId || p.status !== PatientStatus.WAITING || p.id === visit.id) return false;
          
          // Verify it's the same date (Appointment Date or Added Date)
          const pDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
          const myDate = visit.visitType === 'APPOINTMENT' ? visit.appointmentDate : new Date(visit.timeAdded).toISOString().split('T')[0];
          if (pDate !== myDate) return false;

          // Same Shift Check
          const otherShift = getPatientShiftMins(p, doctor);
          if (!myShift || !otherShift || otherShift.startTime !== myShift.startTime) return false;

          // Sequence check (timeAdded is the reliable sequence order)
          return p.timeAdded < visit.timeAdded;
      }).length;

      const servingPatient = clinic.patients.find(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WITH_DOCTOR); 
      const currentToken = servingPatient ? `#${servingPatient.tokenNumber}` : 'Not Started'; 
      
      let expectedTime = '';
      if (visit.visitType === 'APPOINTMENT' && visit.appointmentTime && visit.appointmentDate) {
          // Compare appointment date and time with current date and time
          const apptDate = new Date(visit.appointmentDate + 'T' + visit.appointmentTime);
          const nowTime = now.getTime();
          
          if (apptDate.getTime() > nowTime) {
              // Future appointment - show appointment time
              expectedTime = formatTime12h(visit.appointmentTime);
          } else {
              // Past or current appointment time - calculate based on current time + wait
              let baseWait = peopleAhead * 15;
              if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes;
              const estDate = new Date(now.getTime() + baseWait * 60000);
              expectedTime = estDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          }
      } else {
          let baseWait = peopleAhead * 15;
          if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes;
          const estDate = new Date(now.getTime() + baseWait * 60000);
          expectedTime = estDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      
      let message = ""; 
      let color = 'text-slate-600'; 
      let bgColor = 'bg-slate-100'; 
      
      const bookedTime = new Date(visit.timeAdded).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const bookedDate = new Date(visit.timeAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      if (doctor.status === DoctorStatus.ON_BREAK) { 
          message = "Doctor is on break"; 
          color = "text-orange-700"; 
          bgColor = "bg-orange-100"; 
      } else if (doctor.delayMinutes > 0) { 
          message = `Delayed by ${doctor.delayMinutes} mins`; 
          color = "text-red-700"; 
          bgColor = "bg-red-100"; 
      } else if (!isToday) {
          message = "Upcoming appointment";
          color = "text-indigo-700";
          bgColor = "bg-indigo-50";
      } else if (visit.isCheckedIn) { 
          if (peopleAhead === 0) { 
              message = "You are next! Get ready."; 
              color = "text-green-700"; 
              bgColor = "bg-green-100"; 
          } else { 
              message = "Checked in. Relax in lobby."; 
              color = "text-green-700"; 
              bgColor = "bg-green-50"; 
          } 
      } else { 
          // Today, not checked in
          if (visit.visitType === 'APPOINTMENT' && visit.appointmentTime) {
              const [h, m] = visit.appointmentTime.split(':').map(Number);
              const apptMins = h * 60 + m;
              const nowMins = now.getHours() * 60 + now.getMinutes();
              const diff = apptMins - nowMins;

              if (diff <= 15) {
                  message = "Rush! Reaching your turn.";
                  color = "text-red-700";
                  bgColor = "bg-red-100";
              } else if (diff <= 60) {
                  message = "Start travelling to clinic.";
                  color = "text-blue-700";
                  bgColor = "bg-blue-100";
              } else {
                  message = "Arrive at least 10 mins early.";
                  color = "text-slate-600";
                  bgColor = "bg-slate-100";
              }
          } else {
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
      } 
      
      return { 
          peopleAhead, 
          waitTime: peopleAhead * 15, 
          expectedTime, 
          currentToken, 
          message, 
          color, 
          bgColor, 
          doctorStatus: doctor.status, 
          bookedAt: `${bookedDate}, ${bookedTime}`,
          typeLabel: visit.visitType === 'APPOINTMENT' ? 'Appointment' : 'Live Walk-in'
      }; 
  };
  
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
              if (p.doctorId !== selectedDoctorId) return false;
              if (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR || p.status === PatientStatus.ON_HOLD) return true;
              if (visitType === 'APPOINTMENT' && p.visitType === 'APPOINTMENT' && p.appointmentDate === apptDate && p.status !== PatientStatus.CANCELLED && p.status !== PatientStatus.COMPLETED) return true;
              return false;
          });
          if (isDuplicate) { addToast(`Duplicate: ${pName} already has an active visit with this doctor!`, "error"); return; }
      }

      // For Walk-in with selected shift, validate it's not full and set booking time
      let bookingTime = visitType === 'APPOINTMENT' ? apptTime : undefined;
      if (visitType === 'WALK_IN' && selectedWalkInShiftId) {
          const clinicNow = getClinicCurrentTime(selectedClinic?.timezone);
          const shift = selectedDoctor?.weeklySchedule.find(s => s.day === clinicNow.toLocaleDateString('en-US', { weekday: 'long' }))?.slots.find(s => s.id === selectedWalkInShiftId || s.startTime === selectedWalkInShiftId);
          if (shift) {
              // Check if this shift is at capacity
              const todayStr = getLocalToday(selectedClinic?.timezone);
              const stats = getShiftStats(selectedDoctor!, shift, todayStr, selectedClinic!.patients, selectedClinic!);
              if (stats.isFull) {
                  addToast("This shift is at full capacity. Please select another shift.", "error");
                  return;
              }
              bookingTime = shift.startTime;
          }
      }

      const clinicNow = getClinicCurrentTime(selectedClinic?.timezone);
      onGetToken(pName, pPhone, selectedDoctorId!, selectedClinicId!, bookingTime, visitType === 'APPOINTMENT' ? apptDate : getLocalToday(selectedClinic?.timezone), pAge, pGender, symptoms);
      
      navigate('/patient/visits');
      setSymptoms(''); 
      setVisitType('WALK_IN'); 
      setApptDate(''); 
      setApptTime(''); 
      setBookingFor('MYSELF'); 
      setSelectedWalkInShiftId(null);
      setShowLateWarningModal(false); 
      setShowAuthModal(false);
      setShowBookingSummary(false); // NEW: Ensure modal closes
  };

  const handleBookToken = (e?: React.MouseEvent) => {
      e?.preventDefault();
      if (!selectedClinicId || !selectedDoctorId) return;
      if (isGuest) {
          setShowAuthModal(true); return;
      }
      
      const travelMins = parseInt(travelTime) || 0;

      if (visitType === 'WALK_IN') {
          // Find chosen shift stats
          const shiftStats = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
          // Fix: Accessing totalWaitMins from inside stats property
          const estimatedWaitMins = shiftStats?.stats.totalWaitMins || 0;
          
          if (travelMins > estimatedWaitMins + 15) { 
              setShowLateWarningModal(true); 
              return; 
          }
      }
      
      setShowBookingSummary(true); // NEW: Trigger summary before booking
  };

  const handleAuthSuccess = (phone: string, name: string, isExisting: boolean) => {
      if (onLoginClick) onLoginClick(phone, name);
      if (isExisting) { 
          addToast(`Welcome back ${name}! Please confirm booking details.`, "info"); 
          setShowAuthModal(false); 
          setShowBookingSummary(true); // NEW: Show summary after login
      } else { 
          submitBooking(name, phone); 
      }
  };

  const handleSubmitFeedback = () => {
      if (feedbackModal.visit && feedbackModal.rating > 0) {
          onUpdateDetails(feedbackModal.visit.id, {
              rating: feedbackModal.rating,
              feedback: feedbackModal.text
          });
          addToast("Thank you for your feedback!", "success");
          setFeedbackModal({ isOpen: false, visit: null, rating: 0, text: '' });
      } else {
          addToast("Please select a star rating", "warning");
      }
  };

  // Address Helper
  const reverseGeocode = async (lat: number, lng: number) => {
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
              const addr = data.address;
              const street = addr.road || addr.suburb || addr.neighbourhood || '';
              const city = addr.city || addr.town || addr.village || '';
              return street ? `${street}, ${city}` : city;
          }
          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (e) {
          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
  };

  // Map Handlers
  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast("Geolocation is not supported by your browser", "error");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            setUserLocation({ lat: latitude, lng: longitude });
            setIsLocating(false);
            setSortBy('NEAR');
            setIsPickingLocation(false);
            addToast("Location found!", "success");

            // Reverse Geocode to show address "Uber-style"
            const address = await reverseGeocode(latitude, longitude);
            setPinnedAddress(address);
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
        {
            timeout: 10000, // 10 second timeout
            maximumAge: 60000, // Allow cached positions up to 1 minute old
            enableHighAccuracy: true // Request GPS when available
        }
    );
  };

  const handleMarkerDragEnd = async (latlng: L.LatLng) => { 
      setUserLocation({ lat: latlng.lat, lng: latlng.lng }); 
      setSortBy('NEAR'); 
      addToast("Location updated!", "success");
      const address = await reverseGeocode(latlng.lat, latlng.lng);
      setPinnedAddress(address);
  };
  
  const handleMapSelection = async (latlng: L.LatLng) => { 
      setUserLocation({ lat: latlng.lat, lng: latlng.lng }); 
      setIsPickingLocation(false); 
      setSortBy('NEAR'); 
      addToast("Location pinned!", "success");
      const address = await reverseGeocode(latlng.lat, latlng.lng);
      setPinnedAddress(address);
  };

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
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

  // SHIFT ANALYTICS FOR WALK-INS
  const walkInShiftsToday = useMemo(() => {
      if (!selectedDoctor || !selectedClinic) return [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = getClinicCurrentTime(selectedClinic.timezone);
      const dayName = days[now.getDay()];
      const todayStr = getLocalToday(selectedClinic.timezone);
      const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName);
      
      if (!schedule || schedule.isOff) return [];

      const currentMins = now.getHours() * 60 + now.getMinutes();

      return schedule.slots.filter(s => s.active !== false).map(shift => {
          const [sh, sm] = shift.startTime.split(':').map(Number);
          const [eh, em] = shift.endTime.split(':').map(Number);
          const startTotal = sh * 60 + sm;
          let endTotal = eh * 60 + em;
          if (endTotal <= startTotal) endTotal += 1440;

          const stats = getShiftStats(selectedDoctor, shift, todayStr, selectedClinic.patients, selectedClinic);
          const isStarted = currentMins >= startTotal;
          const isEnded = currentMins >= endTotal;
          const isActive = isStarted && !isEnded;

          // Calculate Wait Time specifically for Walk-in context
          let totalWaitMins = stats.load * (selectedDoctor.consultationTime || 15);
          if (isActive) totalWaitMins += (selectedDoctor.delayMinutes || 0);

          let statusLabel = '';
          let statusColor = 'text-slate-500';
          if (isEnded) { statusLabel = 'Ended'; statusColor = 'text-slate-400'; }
          else if (isActive) { statusLabel = 'Live Now'; statusColor = 'text-green-600'; }
          else { statusLabel = `Starts ${formatTime12h(shift.startTime)}`; statusColor = 'text-blue-600'; }

          if (stats.isFull) { statusLabel = 'At Capacity'; statusColor = 'text-red-600'; }

          return {
              shift,
              isEnded,
              isActive,
              isFull: stats.isFull,
              statusLabel,
              statusColor,
              stats: { ...stats, totalWaitMins }
          };
      });
  }, [selectedDoctor, selectedClinic]);

  // Initial Shift Selection Effect
  useEffect(() => {
      if (walkInShiftsToday.length > 0 && !selectedWalkInShiftId) {
          const active = walkInShiftsToday.find(s => s.isActive && !s.isFull);
          const firstFuture = walkInShiftsToday.find(s => !s.isActive && !s.isEnded && !s.isFull);
          const anyAvailable = active || firstFuture;
          if (anyAvailable) {
              setSelectedWalkInShiftId(anyAvailable.shift.id || anyAvailable.shift.startTime);
          }
      }
  }, [walkInShiftsToday, selectedWalkInShiftId]);

  // NEW: Memoize walk-in estimation for confirmation popup
  const walkInEstimation = useMemo(() => {
    if (visitType !== 'WALK_IN' || !selectedWalkInShiftId || !selectedDoctor) return null;
    const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
    if (!selectedShift) return null;

    const mins = selectedShift.stats.totalWaitMins;
    const now = getClinicCurrentTime(selectedClinic?.timezone);
    const estDate = new Date(now.getTime() + mins * 60000);
    const estClockTime = estDate.getHours().toString().padStart(2, '0') + ':' + estDate.getMinutes().toString().padStart(2, '0');

    return {
        count: selectedShift.stats.load,
        mins,
        label: mins === 0 ? 'Immediate' : `~${mins} mins`,
        estClockTime: formatTime12h(estClockTime)
    };
  }, [visitType, selectedWalkInShiftId, selectedDoctor, walkInShiftsToday, selectedClinic]);

  const isWalkInAllowed = walkInShiftsToday.length > 0 && walkInShiftsToday.some(s => !s.isEnded && !s.isFull) && isClinicOpen(selectedClinic?.operatingHours, selectedClinic?.timezone);
  
  const isClinicDirectWalkInOnly = selectedClinic?.operationMode === ClinicOperationMode.DIRECT_WALK_IN;
  const isClinicOnlineWalkInAllowed = selectedClinic && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
  const isClinicApptAllowed = selectedClinic && [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);

  const bookingDates = useMemo(() => { if (!selectedDoctor) return []; const days = []; const today = new Date(); for(let i=0; i<14; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }); const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName); days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate(), isOff: !schedule || schedule.isOff, schedule }); } return days; }, [selectedDoctor]);

  // Auto-select date effect
  useEffect(() => {
      if (bookingView === 'FORM' && selectedDoctor && !apptDate) {
          const firstAvailable = bookingDates.find(d => !d.isOff);
          if (firstAvailable) {
              setApptDate(firstAvailable.dateStr);
          }
      }
  }, [bookingView, selectedDoctor, bookingDates, apptDate]);

  useEffect(() => { 
      if (selectedClinic) {
          let newType = visitType;
          if (isClinicDirectWalkInOnly) {
              newType = 'WALK_IN';
          } else if (isClinicOnlineWalkInAllowed && !isClinicApptAllowed) {
              newType = 'WALK_IN';
          } else if (!isClinicOnlineWalkInAllowed && isClinicApptAllowed) {
              newType = 'APPOINTMENT';
          }
          
          if (newType !== visitType) {
              setVisitType(newType);
          }
      }
  }, [selectedClinic, isClinicDirectWalkInOnly, isClinicOnlineWalkInAllowed, isClinicApptAllowed, visitType]);

  const confirmCancel = () => { if (cancelModal.visit) { onCancelVisit(cancelModal.visit.clinicId, cancelModal.visit.id); addToast("Appointment Cancelled", "info"); setCancelModal({ isOpen: false, visit: null }); } };
  
  const groupedTimeSlots = useMemo<GroupedSlots>(() => { 
      const groups: GroupedSlots = { Morning: [], Afternoon: [], Evening: [], Night: [] }; 
      if (!selectedDoctor || !apptDate || !selectedClinic) return groups; 
      const selectedDayObj = bookingDates.find(d => d.dateStr === apptDate); 
      if (!selectedDayObj || selectedDayObj.isOff || !selectedDayObj.schedule) return groups; 

      const now = getClinicCurrentTime(selectedClinic.timezone);
      const isToday = apptDate === getLocalToday(selectedClinic.timezone); 
      const nowMins = now.getHours() * 60 + now.getMinutes(); 

      // Individual Booked Slots Logic
      const existingAppts = selectedClinic.patients.filter(p => 
          p.doctorId === selectedDoctor.id && 
          p.visitType === 'APPOINTMENT' && 
          p.appointmentDate === apptDate &&
          p.status !== PatientStatus.CANCELLED
      ).map(p => p.appointmentTime);
      
      const MIN_NOTICE_MINS = 30;

      selectedDayObj.schedule.slots.forEach(shiftSlot => { 
          const { startTime, endTime } = shiftSlot; 
          const [startH, startM] = startTime.split(':').map(Number); 
          const [endH, endM] = endTime.split(':').map(Number); 
          
          let currentMins = startH * 60 + startM; 
          let endMins = endH * 60 + endM; 
          if (endMins <= currentMins) endMins += 24 * 60;

          // Shift capacity stats
          const stats = getShiftStats(selectedDoctor, shiftSlot, apptDate, selectedClinic.patients, selectedClinic);
          
          while (currentMins + 15 <= endMins) { 
              let displayMins = currentMins % (24 * 60);
              const h = Math.floor(displayMins / 60); 
              const m = displayMins % 60; 
              const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; 
              const suffix = h >= 12 ? 'PM' : 'AM'; 
              const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h; 
              const displayStr = `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`; 
              
              const isSlotPast = isToday && currentMins < nowMins;
              const isWithinNotice = isToday && currentMins <= (nowMins + MIN_NOTICE_MINS);
              const isBooked = existingAppts.includes(timeStr);

              const slotObj = { 
                  value: timeStr, 
                  label: displayStr, 
                  isBlocked: isSlotPast || isWithinNotice, 
                  isFull: stats.isFull && !(isSlotPast || isWithinNotice), 
                  isBooked: isBooked
              }; 
              
              if (h >= 5 && h < 12) groups.Morning.push(slotObj); 
              else if (h >= 12 && h < 17) groups.Afternoon.push(slotObj); 
              else if (h >= 17 && h < 21) groups.Evening.push(slotObj);
              else groups.Night.push(slotObj); 
              
              currentMins += 15; 
          } 
      }); 
      return (groups as any); 
  }, [selectedDoctor, apptDate, bookingDates, selectedClinic]);
  
  const hasAnySlots = useMemo(() => { 
      return groupedTimeSlots.Morning.length > 0 || 
             groupedTimeSlots.Afternoon.length > 0 || 
             groupedTimeSlots.Evening.length > 0 || 
             groupedTimeSlots.Night.length > 0; 
  }, [groupedTimeSlots]);

  const navItems = [ { id: 'BOOK', label: 'Find Care', icon: Search }, { id: 'ACTIVE', label: 'Active Visits', icon: Ticket }, { id: 'HISTORY', label: 'History', icon: History }, { id: 'PROFILE', label: 'Profile', icon: User } ];
  const GuestLoginCard = () => ( <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center"> <div className="bg-slate-100 p-6 rounded-full mb-6"><Lock className="h-10 w-10 text-slate-400" /></div> <h3 className="text-xl font-bold text-slate-800 mb-2">Login Required</h3> <p className="text-slate-500 mb-8 max-w-xs">Please login to access your appointments and medical history.</p> <Button onClick={() => onLoginClick && onLoginClick()} size="lg" className="shadow-lg px-10">Login / Register</Button> </div> );

  const getDoctorTodayShift = (doc: Doctor) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === today);
    if (!schedule || schedule.isOff || !schedule.slots?.length) return 'Off Today';
    return schedule.slots
        .filter(s => s.active !== false)
        .map(s => `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`)
        .join(', ');
  };

  const isDoctorShiftActive = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = getClinicCurrentTime(clinic.timezone);
    const dayName = days[now.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === dayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    const currentMins = now.getHours() * 60 + now.getMinutes();

    return schedule.slots.some(shift => {
        if (shift.active === false) return false;
        const [sh, sm] = shift.startTime.split(':').map(Number);
        const [eh, em] = shift.endTime.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        let endTotal = eh * 60 + em;
        if (endTotal <= startTotal) endTotal += 1440;

        const isStarted = currentMins >= startTotal;
        const isEnded = currentMins >= endTotal;
        return isStarted && !isEnded;
    });
  };

  const hasAvailableSlotsTomorrow = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrow = new Date(getClinicCurrentTime(clinic.timezone));
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayName = days[tomorrow.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === tomorrowDayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    return schedule.slots.some(shift => shift.active !== false);
  };

  const hasShiftsToday = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date(getClinicCurrentTime(clinic.timezone));
    const todayDayName = days[today.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === todayDayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    return schedule.slots.some(shift => shift.active !== false);
  };

  const StarRating = ({ rating, setRating, interactive = false }: { rating: number, setRating?: (r: number) => void, interactive?: boolean }) => {
    const [hover, setHover] = useState(0);
    const labels = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];
    
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`transition-all duration-200 ${interactive ? 'hover:scale-125' : 'cursor-default'}`}
                        onClick={() => interactive && setRating?.(star)}
                        onMouseEnter={() => interactive && setHover(star)}
                        onMouseLeave={() => interactive && setHover(0)}
                    >
                        <Star 
                            className={`h-10 w-10 ${
                                star <= (hover || rating) 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-200'
                            }`} 
                        />
                    </button>
                ))}
            </div>
            {interactive && <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{labels[hover || rating] || "Tap to rate"}</span>}
        </div>
    );
  };

  const isMapTabVisible = showMap && (bookingView === 'LIST' || bookingView === 'CLINIC_DETAILS');

  /**
   * REUSABLE BREADCRUMBS COMPONENT
   * Hierarchy: Home > Tab > Subview (Clinic) > Final View (Doctor)
   */
  const Breadcrumbs = () => {
    const items = useMemo(() => {
        const list = [{ label: 'Find Care', action: () => navigate('/patient/find'), icon: Search }];
        
        if (activeTab === 'ACTIVE') {
            return [{ label: 'My Active Visits', action: null, icon: Ticket }];
        }
        if (activeTab === 'HISTORY') {
            return [{ label: 'Visit History', action: null, icon: History }];
        }
        if (activeTab === 'PROFILE') {
            return [{ label: 'My Health Profile', action: null, icon: User }];
        }

        // Booking Workflow
        if (bookingView === 'DOCTOR_PROFILE' && selectedProfileDoctor) {
            list.push({ label: selectedProfileDoctor.name, action: null, icon: Stethoscope });
        } else if (bookingView === 'CLINIC_DETAILS' && selectedClinic) {
            list.push({ label: selectedClinic.name, action: null, icon: Building2 });
        } else if (bookingView === 'FORM' && selectedClinic && selectedDoctor) {
            list.push({ label: selectedClinic.name, action: () => navigateToView('CLINIC_DETAILS', selectedClinic), icon: Building2 });
            list.push({ label: `Book ${selectedDoctor.name}`, action: null, icon: Stethoscope });
        }
        
        return list;
    }, [activeTab, bookingView, selectedClinic, selectedDoctor]);

    return (
        <nav className="flex items-center gap-2 mb-4 px-1" aria-label="Breadcrumb">
            <button 
                onClick={() => navigate('/')} 
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-primary-600 transition-colors"
                title="Exit to Main Site"
            >
                <Home className="h-3 w-3" />
            </button>
            
            {items.map((item, idx) => (
                <React.Fragment key={idx}>
                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                    {item.action ? (
                        <button 
                            onClick={item.action}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors py-1 px-1.5 hover:bg-primary-50 rounded"
                        >
                            {item.icon && <item.icon className="h-2.5 w-2.5" />}
                            {item.label}
                        </button>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 py-1 px-1.5">
                            {item.icon && <item.icon className="h-2.5 w-2.5" />}
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
        <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}> 
            <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6 justify-between'} border-b border-slate-100 relative`}>
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity"
                >
                    <Logo className="h-8 w-8 flex-shrink-0" />
                    <span className={`font-bold text-xl text-slate-900 tracking-tight transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Smart<span className="text-primary-600">QFlow</span></span>
                </button>
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
            {/* PERSISTENT HEADER WITH GLOBAL SEARCH AND INTEGRATED FILTERS */}

            <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 sticky top-0 z-[60] shadow-sm shrink-0">
                <div className="flex flex-col gap-3">
                    {/* Top Row on Mobile: Location, QR, User */}
                    <div className="flex items-center justify-between lg:hidden">
                        <div className="relative flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <select 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                value={selectedCity} 
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                            <span className="truncate max-w-[120px]">{selectedCity}</span>
                            <ChevronDown className="h-3 w-3 opacity-40 shrink-0" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowQRScanner(true)} className="p-2.5 bg-primary-50 text-primary-600 rounded-xl border border-primary-100 shadow-sm active:scale-95 transition-all">
                                <QrCode className="h-5 w-5" />
                            </button>
                            {isGuest ? (
                                <button onClick={() => onLoginClick?.()} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                                    <LogIn className="h-5 w-5" />
                                </button>
                            ) : (
                                <button onClick={onBack} className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 active:scale-95 transition-all">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Row: Search + Mode Toggle */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        {/* Global Search Input */}
                        <div ref={searchBarContainerRef} className="flex-1 relative">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 h-10 md:h-12 rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-bold text-sm"
                                    placeholder="Problem (fever, cough) or doctor"
                                    value={searchQuery}
                                    onFocus={() => setShowSuggestions(true)}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {showSuggestions && globalSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 z-[70] max-h-[60vh] overflow-y-auto">
                                    {globalSuggestions.clinics.length > 0 && (
                                        <div className="p-2 border-b border-slate-50">
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Building2 className="h-3 w-3" /> Partner Clinics
                                            </div>
                                            {globalSuggestions.clinics.map(c => (
                                                <button 
                                                    key={c.id} 
                                                    onClick={() => handleSuggestionClick('CLINIC', c)}
                                                    className="w-full text-left p-3 rounded-xl hover:bg-primary-50 group flex items-center gap-4 transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                        {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <Building2 className="h-5 w-5 text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0"><div className="font-bold text-slate-900 text-sm truncate">{c.name}</div><div className="text-xs text-slate-500 truncate">{c.address}</div></div><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {globalSuggestions.doctors.length > 0 && (
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Stethoscope className="h-3 w-3" /> Specialists</div>
                                            {globalSuggestions.doctors.map(({ clinic, doctor }) => (
                                                <button key={`${clinic.id}-${doctor.id}`} onClick={() => handleSuggestionClick('DOCTOR', { clinic, doctor })} className="w-full text-left p-3 rounded-xl hover:bg-primary-50 group flex items-center gap-4 transition-colors"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><img src={doctor.avatarUrl} className="w-full h-full object-cover rounded-full" /></div><div className="flex-1 min-w-0"><div className="font-bold text-slate-900 text-sm truncate">{doctor.name}</div><div className="text-xs text-primary-600 font-bold">{doctor.specialty} <span className="text-slate-300 mx-1">•</span> <span className="text-slate-500 font-normal">{clinic.name}</span></div></div><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-400" /></button>
                                            ))}
                                        </div>
                                    )}
                                    {globalSuggestions.clinics.length === 0 && globalSuggestions.doctors.length === 0 && (
                                        <div className="p-8 text-center text-slate-400"><Search className="h-8 w-8 mx-auto mb-2 opacity-20" /><p className="text-sm font-bold">No exact matches found</p><p className="text-xs">Try searching for symptoms like 'fever'</p></div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Search Mode Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl shrink-0 h-10 md:h-11 items-center border border-slate-200/50">
                            <button onClick={() => setSearchMode('CLINIC')} className={`h-8 md:h-9 px-3 md:px-4 rounded-lg md:rounded-xl transition-all flex items-center gap-1.5 md:gap-2 ${searchMode === 'CLINIC' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Clinics</span>
                            </button>
                            <button onClick={() => setSearchMode('DOCTOR')} className={`h-8 md:h-9 px-3 md:px-4 rounded-lg md:rounded-xl transition-all flex items-center gap-1.5 md:gap-2 ${searchMode === 'DOCTOR' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Stethoscope className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Doctors</span>
                            </button>
                        </div>

                        {/* Desktop Only Controls */}
                        <div className="hidden lg:flex items-center gap-3">
                            {/* Desktop Location Selector */}
                            <div className="relative flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-600 cursor-pointer hover:text-primary-600 hover:border-primary-400 transition-all shrink-0">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <select 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    value={selectedCity} 
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                >
                                    {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                                <span className="font-bold whitespace-nowrap">{selectedCity}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </div>

                            <button
                                onClick={handleLocateMe}
                                className={`h-11 px-4 rounded-2xl border flex items-center gap-2 transition-all shrink-0 group ${pinnedAddress ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-500 hover:border-primary-400'}`}
                                title="Use Current GPS"
                            >
                                {isLocating ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></span>
                                ) : (
                                    <LocateFixed className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                                    {pinnedAddress || 'Locate'}
                                </span>
                            </button>

                            <Button variant="outline" onClick={() => setShowQRScanner(true)} className="rounded-2xl h-11 border-slate-200 px-5 text-primary-700 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                <QrCode className="h-4 w-4 mr-2" /> QR Check-in
                            </Button>

                            {isGuest ? (
                                <Button onClick={() => onLoginClick?.()} className="rounded-2xl h-11 px-6 shadow-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Sign In</Button>
                            ) : (
                                <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors px-3">Logout</button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className={`flex-1 flex flex-col w-full relative ${activeTab !== 'BOOK' ? 'overflow-y-auto overflow-x-hidden scroll-smooth pb-32 md:pb-8' : 'overflow-y-auto'}`}>
                
                {activeTab === 'ACTIVE' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full h-full px-4 md:px-8 py-0 max-w-[1920px] mx-auto"> 
                {unratedCompletedVisit && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                                <ThumbsUp className="h-7 w-7 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">How was your visit with Dr. {unratedCompletedVisit.doctorName}?</h3>
                                <p className="text-sm text-slate-600">Your feedback helps others find the best care.</p>
                            </div>
                        </div>
                        <Button onClick={() => setFeedbackModal({ isOpen: true, visit: unratedCompletedVisit, rating: 0, text: '' })} className="bg-slate-900 text-white shadow-xl hover:bg-slate-800 px-8 py-3 rounded-2xl font-bold">
                            Rate Visit Now
                        </Button>
                    </div>
                )}
                {activeVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"> {activeVisits.map(visit => { const queueStats = getSmartQueueDetails(visit); return ( <Card key={visit.id} className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"> <div className="p-5 pb-2"> <div className="flex justify-between items-start mb-2"> <div> <div className="flex items-center gap-2 mb-1"> <h3 className="font-black text-lg text-slate-900 leading-tight truncate max-w-[180px]">{visit.clinicName}</h3> </div> <p className="text-sm text-slate-500 font-bold">Dr. {visit.doctorName}</p> <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><User className="h-3 w-3" /> {visit.name}</p> </div> <div className="flex flex-col items-end gap-2"> <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${visit.visitType === 'APPOINTMENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-primary-50 text-primary-700 border-primary-200'}`}> {queueStats.typeLabel} </span> <Badge status={visit.status} /> </div> </div> <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold"> <span className="flex items-center gap-1 uppercase tracking-tighter"><Calendar className="h-3 w-3" /> Booked: {queueStats.bookedAt}</span> <span className="text-slate-300">|</span> <span className="flex items-center gap-1 uppercase tracking-tighter"><MapPin className="h-3 w-3" /> Room {visit.room}</span> </div> </div> <div className="bg-white border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center"> <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Token</div><div className="text-4xl font-black text-slate-900">#{visit.tokenNumber}</div></div> <div className="border-x border-slate-100"> <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Now Serving</div> <div className={`text-4xl font-black ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-blue-600 animate-pulse' : 'text-slate-300'}`}> {visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken} </div> </div> <div> <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">People Ahead</div> <div className="text-4xl font-black text-slate-900">{queueStats.peopleAhead}</div> </div> </div> <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold border-b border-slate-100 transition-colors`}> {queueStats.doctorStatus === DoctorStatus.ON_BREAK ? <Coffee className="h-5 w-5 animate-bounce" /> : queueStats.peopleAhead < 3 && !visit.isCheckedIn ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <Timer className="h-5 w-5" />} <div className="flex-1"> <p className="leading-tight">{queueStats.message}</p> {visit.status === PatientStatus.WAITING && ( <div className="flex gap-2 mt-1"> <span className="text-[10px] opacity-70 font-black uppercase tracking-wide">EST. TIME: {queueStats.expectedTime}</span> {visit.visitType === 'APPOINTMENT' && visit.appointmentTime && ( <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/50 px-1 rounded">Slot: {formatTime12h(visit.appointmentTime)}</span> )} </div> )} </div> </div> <div className="p-4 flex gap-2 mt-auto bg-white"> {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && ( <Button className="flex-1 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-100" onClick={() => setShowQRScanner(true)}> <QrCode className="h-4 w-4 mr-2" /> Check-In </Button> )} <Button variant="secondary" className={`flex-1 font-bold ${visit.isCheckedIn ? 'w-full' : ''} text-red-600 border-red-100 hover:bg-red-50`} onClick={() => setCancelModal({ isOpen: true, visit })} disabled={visit.status === PatientStatus.WITH_DOCTOR}> Cancel </Button> </div> </Card> ); })} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><Calendar className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No active visits</h3><p className="text-slate-500 mb-6 text-center max-sm">Book an appointment or scan a QR code at a clinic to see your live status here.</p><Button onClick={() => handleTabSwitch('BOOK')} size="lg" className="shadow-lg">Find a Doctor</Button></div> )} </div> ) )}
                {activeTab === 'HISTORY' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full h-full px-4 md:px-8 py-0 max-w-[1920px] mx-auto"> {historyVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"> {historyVisits.map(visit => ( <div key={visit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 h-full hover:border-primary-200 transition-colors"> <div className="flex-1"> <div className="flex items-start gap-3 mb-3"> <div className={`p-3 rounded-lg flex-shrink-0 ${visit.status === PatientStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}> {visit.status === PatientStatus.COMPLETED ? <CheckCircle2 className="h-6 w-6" /> : <X className="h-6 w-6" />} </div> <div className="min-w-0 flex-1"> <h3 className="font-bold text-slate-900 truncate text-base">{visit.clinicName}</h3> <p className="text-sm text-slate-500 truncate">Dr. {visit.doctorName}</p> <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(visit.timeAdded).toLocaleDateString()} at {new Date(visit.timeAdded).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true})}</p> </div> </div> <div className="space-y-2"> 
                    {visit.rating ? (
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
                            <div className="flex">
                                {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`h-3 w-3 ${s <= visit.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-amber-700">You rated this visit</span>
                        </div>
                    ) : visit.status === PatientStatus.COMPLETED && (
                        <button 
                            onClick={() => setFeedbackModal({ isOpen: true, visit, rating: 0, text: '' })}
                            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100 transition-all uppercase tracking-wider"
                        >
                            Rate Doctor
                        </button>
                    )}
                    {visit.diagnosis && ( <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"> <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Diagnosis</p> <p className="text-sm text-slate-700">{visit.diagnosis}</p> </div> )} {visit.notes && ( <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"> <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Notes</p> <p className="text-sm text-slate-700 text-ellipsis overflow-hidden line-clamp-3">{visit.notes}</p> </div> )} </div> </div> <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 italic">
                     Visit records are private and secure.
                </div> </div> ))} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><History className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No past visits</h3><p className="text-slate-500 mb-6 text-center max-sm">Your completed appointment history will appear here.</p></div> )} </div> ) )}
                {activeTab === 'PROFILE' && ( isGuest ? <GuestLoginCard /> : ( <div className="w-full max-w-3xl mx-auto px-4 py-0"> <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6"> <div className="bg-slate-900 p-6 text-white flex justify-between items-center"> <div className="flex items-center gap-4"> <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30"> {userName.charAt(0)} </div> <div> <h2 className="text-2xl font-bold">{userName}</h2> <p className="opacity-80 font-mono">{userPhone}</p> </div> </div> <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"> <LogOut className="h-5 w-5" /> </button> </div> <div className="p-6"> <div className="grid md:grid-cols-2 gap-6"> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.name}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.phone}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Age</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.age || '-'}</div> </div> <div className="space-y-1"> <label className="text-xs font-bold text-slate-500 uppercase">Gender</label> <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">{userProfile?.gender || '-'}</div> </div> </div> </div> </div> <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"> <div className="p-6 border-b border-slate-100 flex justify-between items-center"> <div> <h3 className="font-bold text-lg text-slate-900">Family Members</h3> <p className="text-sm text-slate-500">Manage profiles for your family</p> </div> <Button size="sm" onClick={() => { setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setEditingMemberIndex(null); setIsCustomRelation(false); setShowAddMember(true); }}> <Plus className="h-4 w-4 mr-2" /> Add Member </Button> </div> <div className="divide-y divide-slate-100"> {userProfile?.familyMembers && userProfile.familyMembers.length > 0 ? ( userProfile.familyMembers.map((member, idx) => ( <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"> <div className="flex items-center gap-4"> <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"> {member.name.charAt(0)} </div> <div> <div className="font-bold text-slate-900">{member.name}</div> <div className="text-xs text-slate-500">{member.relation} • {member.age} Yrs • {member.gender}</div> </div> </div> <div className="flex gap-2"> <button onClick={() => handleEditMember(idx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button> <button onClick={() => setMemberToDeleteIndex(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button> </div> </div> )) ) : ( <div className="p-8 text-center text-slate-400 italic">No family members added.</div> )} </div> </div> </div> ) )}

                {/* BOOK TAB (SEARCH & CLINIC VIEW) */}
                {activeTab === 'BOOK' && (
                    <div className="flex flex-col min-h-full">
                        {/* BREADCRUMBS AT TOP - Always visible */}
                        <div className="sticky top-0 z-20 px-4 md:px-8 py-2 bg-white border-b border-slate-100">
                            <Breadcrumbs />
                        </div>
                        
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                            <Filter
                                searchMode={searchMode}
                                setSearchMode={setSearchMode}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                userLocation={userLocation}
                                uniqueCities={uniqueCities}
                                selectedCity={selectedCity}
                                setSelectedCity={setSelectedCity}
                                showMap={showMap}
                                setShowMap={setShowMap}
                                selectedDoctorGender={selectedDoctorGender}
                                setSelectedDoctorGender={setSelectedDoctorGender}
                                selectedMinExperience={selectedMinExperience}
                                setSelectedMinExperience={setSelectedMinExperience}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                CATEGORIES={CATEGORIES}
                                bookingView={bookingView}
                            />
                        </div>
                        
                        {/* Content Area */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
                            <div className={`flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 pt-0 custom-scrollbar ${showMap && (bookingView === 'LIST' || bookingView === 'CLINIC_DETAILS') ? 'hidden md:block' : 'block'} pb-32 md:pb-8`}>
                                {bookingView === 'LIST' ? (
                                    searchMode === 'CLINIC' ? (
                                        filteredClinics.length > 0 ? (
                                            <div className={`w-full grid gap-4 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                                                {filteredClinics.map(clinic => {
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
                                                            distLabel={distLabel}
                                                            gmapsLink={`https://www.google.com/maps/search/?api=1&query=${clinic.geoLocation?.lat},${clinic.geoLocation?.lng}`}
                                                            relevantDoctors={relevantDoctors}
                                                            isHighlighted={highlightedClinicId === clinic.id}
                                                            isOpen={isClinicOpen(clinic.operatingHours, clinic.timezone)}
                                                            cardRef={el => { clinicCardRefs.current[clinic.id] = el; }}
                                                            onSelect={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                            onBook={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                            onQueue={() => navigateToView('CLINIC_DETAILS', clinic)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-slate-400">
                                                <p className="font-black uppercase tracking-[0.2em] text-sm mb-2">No clinics found</p>
                                                <p className="text-xs font-bold text-slate-400 mb-8">Try adjusting your filters or location.</p>
                                                <Building2 className="h-16 w-16 opacity-10" />
                                            </div>
                                        )
                                    ) : (
                                        /* DOCTOR SEARCH RESULTS */
                                        groupedDoctors.length > 0 ? (
                                            <div className={`w-full grid gap-6 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                                                {groupedDoctors.map(({ masterDoc, locations }) => {
                                                    return (
                                                        <DoctorSearchCard
                                                            key={masterDoc.masterId}
                                                            doctor={masterDoc}
                                                            locations={locations}
                                                            onBook={(clinic, doc) => navigateToView(null, clinic, doc)}
                                                            onClick={() => navigateToView('DOCTOR_PROFILE', null, masterDoc)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-slate-400">
                                                <p className="font-black uppercase tracking-[0.2em] text-sm mb-2">No doctors found</p>
                                                <p className="text-xs font-bold text-slate-400 mb-8">Try adjusting your filters or location.</p>
                                                <Stethoscope className="h-16 w-16 opacity-10" />
                                            </div>
                                        )
                                    )
                                ) : bookingView === 'CLINIC_DETAILS' && selectedClinic ? (
                                    // CLINIC DETAIL VIEW
                                    <div className="max-w-5xl mx-auto space-y-6">
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
                                                <button 
                                                    onClick={() => setShowMap(!showMap)}
                                                    className={`absolute top-4 right-4 p-2 rounded-xl border-2 transition-all flex items-center gap-2 z-10 ${showMap ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20'}`}
                                                    title="Locate on Map"
                                                >
                                                    <MapIcon className="h-5 w-5" />
                                                    <span className="text-xs font-black uppercase tracking-tight hidden sm:inline">{showMap ? 'Info' : 'Map'}</span>
                                                </button>
                                                <div className="absolute bottom-4 left-6 text-white w-[calc(100%-48px)]">
                                                    <div>
                                                        <h1 className="text-3xl font-black shadow-sm">{selectedClinic.name}</h1>
                                                        <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedClinic.address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                {isClinicDirectWalkInOnly && (
                                                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-4">
                                                        <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0">
                                                            <MapPinIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-orange-900 text-sm">Direct Walk-In Only</h4>
                                                            <p className="text-xs text-orange-700 leading-relaxed mt-0.5">Please visit the reception for a token.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-600">
                                                    {selectedClinic.operatingHours && <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full"><Clock className="h-4 w-4" /> {selectedClinic.operatingHours}</div>}
                                                    {selectedClinic.contactPhone && <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full"><Phone className="h-4 w-4" /> {selectedClinic.contactPhone}</div>}
                                                    <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-bold border border-primary-100 uppercase tracking-tight"><ShieldCheck className="h-4 w-4" /> Verified</div>
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {selectedClinic.doctors.map(doc => {
                                                            const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
                                                            const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
                                                            const todayShift = getDoctorTodayShift(doc);
                                                            const isAvailable = doc.status === DoctorStatus.AVAILABLE;
                                                            const hasSlotsTomorrow = hasAvailableSlotsTomorrow(doc, selectedClinic);
                                                            const hasDoctorShiftsToday = hasShiftsToday(doc, selectedClinic);
                                                            const canGetToken = canQueueOnline && hasDoctorShiftsToday;
                                                            const canBookForTomorrow = canBookAppointments && hasSlotsTomorrow;
                                                            
                                                            return (
                                                                <div 
                                                                    key={doc.id} 
                                                                    className="p-4 rounded-xl border border-slate-200 flex flex-col hover:border-primary-300 hover:shadow-md transition-all cursor-pointer bg-white group"
                                                                    onClick={() => navigateToView(null, selectedClinic, doc)}
                                                                >
                                                                    {/* Top Section: Avatar & Details */}
                                                                    <div className="flex gap-4">
                                                                        {/* Left: Avatar & Status */}
                                                                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                                            <div className="relative">
                                                                                <img src={doc.avatarUrl} className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shadow-sm" />
                                                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${isAvailable ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 text-amber-500 bg-amber-50/50 px-1.5 py-0.5 rounded-lg border border-amber-100/50">
                                                                                <Star className="h-2.5 w-2.5 fill-current" />
                                                                                <span className="text-[10px] font-black">{doc.rating.toFixed(1)}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Right: Info */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start">
                                                                                <div className="min-w-0">
                                                                                    <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors truncate">{doc.name}</h4>
                                                                                    <p className="text-[10px] text-primary-600 font-black uppercase tracking-wider">{doc.specialty}</p>
                                                                                </div>
                                                                                <div className="text-right flex-shrink-0">
                                                                                    <span className="text-base font-black text-slate-900">₹{doc.consultationFee}</span>
                                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">FEE</p>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="space-y-1.5 mt-2">
                                                                                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                                    <span className="text-[10px]">Today: <span className="font-bold text-slate-900">{todayShift}</span></span>
                                                                                </div>
                                                                                {doc.experience && (
                                                                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                                                        <Award className="h-3 w-3 text-slate-400" />
                                                                                        <span className="text-[10px]">{doc.experience}+ years experience</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Middle Section: Languages & Education */}
                                                                    <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-x-4 gap-y-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Languages className="h-3 w-3 text-slate-400" />
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {doc.languages?.slice(0, 3).map(lang => (
                                                                                    <span key={lang} className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{lang}</span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        {doc.education && doc.education.length > 0 && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <GraduationCap className="h-3 w-3 text-slate-400" />
                                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{doc.education[0]}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Bottom Section: Action Buttons */}
                                                                    <div className="flex gap-2 mt-4">
                                                                        {canBookAppointments && (
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); navigateToView(null, selectedClinic, doc, 'APPOINTMENT'); }}
                                                                                className="flex-1 h-9 px-4 rounded-lg font-bold transition-all text-[10px] uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
                                                                            >
                                                                                Book Slot
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            disabled={!canGetToken}
                                                                            onClick={(e) => { e.stopPropagation(); navigateToView(null, selectedClinic, doc, 'WALK_IN'); }}
                                                                            className={`flex-1 h-9 px-4 rounded-lg font-bold transition-all text-[10px] uppercase tracking-widest ${
                                                                                canGetToken
                                                                                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-100' 
                                                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                                            }`}
                                                                        >
                                                                            {canGetToken ? 'Get Token' : 'No Live Queue'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : bookingView === 'DOCTOR_PROFILE' && selectedProfileDoctor ? (
                                    // DOCTOR PROFILE PAGE: Enhanced 2-COLUMN FLEXIBLE LAYOUT
                                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 py-4">
                                        {/* Left: Doctor Details */}
                                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-fit p-8 relative">
                                            <div className="h-48 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl relative mb-8">
                                                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0">
                                                    <div className="p-2 bg-white rounded-2xl shadow-2xl ring-4 ring-primary-100">
                                                        <img 
                                                            src={selectedProfileDoctor.avatarUrl} 
                                                            className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover bg-slate-100 border-2 border-white shadow-lg" 
                                                            alt={selectedProfileDoctor.name}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-16 px-2 pb-2 flex flex-col items-center md:items-start">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedProfileDoctor.name}</h2>
                                                    <div className="bg-amber-50 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100 flex-shrink-0">
                                                        <Star className="h-4 w-4 fill-current" />
                                                        <span className="text-xs font-black">{selectedProfileDoctor.rating.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <p className="text-primary-600 font-bold uppercase tracking-widest flex items-center gap-2 text-[15px] mb-3">
                                                    <Stethoscope className="h-5 w-5" /> {selectedProfileDoctor.specialty}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                                        <Award className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.experience || 5}+ Years
                                                    </span>
                                                    {selectedProfileDoctor.languages && selectedProfileDoctor.languages.length > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                                            <Languages className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.languages.join(', ')}
                                                        </span>
                                                    )}
                                                    {selectedProfileDoctor.education && selectedProfileDoctor.education.length > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                                            <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.education[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedProfileDoctor.bio && (
                                                    <>
                                                        <div className="w-full border-t border-slate-100 my-4"></div>
                                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <FileText className="h-4 w-4 text-primary-500" /> About Doctor
                                                        </h3>
                                                        <p className="text-slate-600 text-base leading-relaxed text-center md:text-left">{selectedProfileDoctor.bio}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Right: Clinics List with Booking */}
                                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-fit p-6">
                                            <div className="pb-4 border-b border-slate-100 mb-4">
                                                <h3 className="text-2xl font-bold text-slate-900">Available at Clinics</h3>
                                                <p className="text-base text-slate-600 mt-1">Book an appointment at any of these locations</p>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                {clinics.filter(clinic => clinic.doctors.some(d => d.masterId === selectedProfileDoctor.masterId)).map(clinic => {
                                                    const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId)!;
                                                    const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                                                    const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                                                    const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
                                                    const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
                                                    const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
                                                    const canGetToken = canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow;
                                                    const canBookForTomorrow = canBookAppointments && hasSlotsTomorrow;
                                                    const todayShift = getDoctorTodayShift(docInstance);
                                                    return (
                                                        <div key={clinic.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 flex flex-col gap-3 shadow-sm">
                                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-slate-900 text-lg truncate mb-1">{clinic.name}</h4>
                                                                    <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                                        {clinic.address}, {clinic.city}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                                                                            <Clock className="h-4 w-4 text-primary-500" />
                                                                            Today: <span className="font-black">{todayShift}</span>
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-xs font-bold text-blue-700">
                                                                            <IndianRupeeIcon className="h-4 w-4 text-blue-400" />
                                                                            Fee: <span className="font-black">₹{docInstance.consultationFee}</span>
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                                                            isDoctorShiftActiveNow ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                                        }`}>
                                                                            {isDoctorShiftActiveNow ? 'Shift Active' : 'Offline'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    disabled={!(canGetToken || canBookForTomorrow)}
                                                                    onClick={() => navigateToView(null, clinic, docInstance)}
                                                                    className={`h-12 px-10 rounded-2xl font-extrabold shadow-lg transition-all text-xs uppercase tracking-widest whitespace-nowrap active:scale-95 ${
                                                                        (canGetToken || canBookForTomorrow)
                                                                            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700 shadow-primary-200' 
                                                                            : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-200'
                                                                    }`}
                                                                >
                                                                    {canGetToken ? 'Get Token' : canBookForTomorrow ? 'Book Tomorrow' : 'Unavailable'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : bookingView === 'FORM' && selectedDoctor ? (
                                    // REFACTORED DOCTOR BOOKING PAGE: HIGH DENSITY & SPLIT VIEW
                                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 pb-16">
                                        
                                        {/* LEFT COLUMN: COMPACT DOCTOR PROFILE (4/12) */}
                                        <div className="lg:col-span-5 xl:col-span-4 space-y-3 h-fit">
                                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                                                {/* Enhanced Header Section with Clinic Details */}
                                                <div className="h-24 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600 relative shrink-0">
                                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                                        <div className="p-2 bg-white rounded-[1.5rem] shadow-2xl ring-4 ring-white/30 backdrop-blur-sm">
                                                            <img
                                                                src={selectedDoctor.avatarUrl}
                                                                className="w-24 h-24 rounded-[1.5rem] object-cover bg-slate-100 border-2 border-white shadow-lg"
                                                                alt={selectedDoctor.name}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-12 px-5 pb-6 flex-1 flex flex-col">
                                                    {/* Doctor Info */}
                                                    <div className="text-center mb-4">
                                                        <div className="flex items-center justify-center gap-2 mb-2">
                                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedDoctor.name}</h2>
                                                            <div className="bg-amber-50 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100 flex-shrink-0">
                                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                                <span className="text-[10px] font-black">{selectedDoctor.rating.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-primary-600 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 text-[11px] mb-2">
                                                            <Stethoscope className="h-4 w-4" /> {selectedDoctor.specialty}
                                                        </p>
                                                    </div>

                                                    {/* Clinic Details Card */}
                                                    {selectedClinic && (
                                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4">
                                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <Building2 className="h-3.5 w-3.5 text-primary-500" /> Clinic Details
                                                            </h3>
                                                            <div className="space-y-2">
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{selectedClinic.name}</p>
                                                                        <p className="text-[9px] text-slate-600 leading-tight">{selectedClinic.address}, {selectedClinic.city}</p>
                                                                    </div>
                                                                </div>
                                                                {selectedClinic.phone && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                        <p className="text-[10px] font-bold text-slate-700">{selectedClinic.phone}</p>
                                                                    </div>
                                                                )}
                                                                {selectedClinic.operationMode && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                        <p className="text-[10px] font-bold text-slate-700 capitalize">{selectedClinic.operationMode.replace('_', ' ')}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Enhanced Stats Grid */}
                                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                                            <Medal className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                                            <p className="text-[10px] font-black text-slate-800 leading-none">{selectedDoctor.experience || 5}+ Y</p>
                                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">EXP</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                                            <IndianRupeeIcon className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                                            <p className="text-[10px] font-black text-slate-800 leading-none">₹{selectedDoctor.consultationFee}</p>
                                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">FEE</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                                            <Clock className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                                            <p className="text-[10px] font-black text-slate-800 leading-none">{selectedDoctor.consultationTime || 15}m</p>
                                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">TIME</p>
                                                        </div>
                                                    </div>

                                                    {/* Enhanced Profile Summary */}
                                                    <div className="flex-1 flex flex-col justify-end space-y-4">
                                                        {selectedDoctor.bio && (
                                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                    <FileText className="h-3 w-3 text-primary-500" /> About Doctor
                                                                </h3>
                                                                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">{selectedDoctor.bio}</p>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {selectedDoctor.education && (
                                                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                        <GraduationCap className="h-3 w-3 text-primary-500" /> Qualifications
                                                                    </h3>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {selectedDoctor.education.slice(0, 3).map((edu, i) => (
                                                                            <span key={i} className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">{edu}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedDoctor.languages && (
                                                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                        <Languages className="h-3 w-3 text-primary-500" /> Languages
                                                                    </h3>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {selectedDoctor.languages.slice(0, 4).map((lang, i) => (
                                                                            <span key={i} className="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100">{lang}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN: BOOKING FLOW (8/12) */}
                                        <div className="lg:col-span-7 xl:col-span-8">
                                            {!isClinicDirectWalkInOnly ? (
                                                <div className="bg-white p-3 md:p-4 rounded-[2rem] shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                                    {/* Patient Profile Selection */}
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Who are you booking for?</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button onClick={() => setBookingFor('MYSELF')} className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${bookingFor === 'MYSELF' ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}><User className="h-3.5 w-3.5" /> Myself</button>
                                                            {userProfile?.familyMembers?.map(m => (
                                                                <button key={m.name} onClick={() => setBookingFor(m.name)} className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${bookingFor === m.name ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}><Users className="h-3.5 w-3.5" /> {m.name}</button>
                                                            ))}
                                                            <button onClick={() => setShowAddMember(true)} className="px-5 py-2.5 rounded-xl text-xs font-black border border-dashed border-slate-300 text-slate-500 hover:text-primary-600 transition-all flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> Family</button>
                                                        </div>
                                                    </div>

                                                    {/* Mode Selection */}
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Select Visit Type</label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <div onClick={() => isClinicOnlineWalkInAllowed && isWalkInAllowed && setVisitType('WALK_IN')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${visitType === 'WALK_IN' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-500/20' : (isClinicOnlineWalkInAllowed && isWalkInAllowed) ? 'border-slate-100 hover:border-slate-200' : 'border-slate-50 opacity-40 grayscale pointer-events-none'}`}>
                                                                <div className={`p-2 rounded-xl ${visitType === 'WALK_IN' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Zap className="h-5 w-5 fill-current" /></div>
                                                                <div>
                                                                    <div className="flex items-center gap-2"><span className={`font-black uppercase tracking-widest text-[11px] ${visitType === 'WALK_IN' ? 'text-primary-900' : 'text-slate-700'}`}>Live Token</span>{visitType === 'WALK_IN' && <CheckCircle2 className="h-3.5 w-3.5 text-primary-600" />}</div>
                                                                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">Join the live queue now.</p>
                                                                </div>
                                                            </div>
                                                            <div onClick={() => isClinicApptAllowed && setVisitType('APPOINTMENT')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${visitType === 'APPOINTMENT' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500/20' : isClinicApptAllowed ? 'border-slate-100 hover:border-slate-200' : 'border-slate-50 opacity-40 grayscale pointer-events-none'}`}>
                                                                <div className={`p-2 rounded-xl ${visitType === 'APPOINTMENT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><CalendarClock className="h-5 w-5" /></div>
                                                                <div>
                                                                    <div className="flex items-center gap-2"><span className={`font-black uppercase tracking-widest text-[11px] ${visitType === 'APPOINTMENT' ? 'text-indigo-900' : 'text-slate-700'}`}>Appointment</span>{visitType === 'APPOINTMENT' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}</div>
                                                                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">Pick a confirmed slot.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Slot Selection View (Date/Time or Shifts) */}
                                                    <div className="bg-slate-50/50 p-3 rounded-[1.5rem] border border-slate-100">
                                                        {visitType === 'WALK_IN' ? (
                                                            <div className="space-y-3">
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Availability (Today)</label>
                                                                
                                                                {/* Travel Time & Arrival Analysis - Side by Side */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {/* Travel Time Selector */}
                                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Travel Time</label>
                                                                        <select
                                                                            value={travelTime}
                                                                            onChange={(e) => {
                                                                                setTravelTime(e.target.value);
                                                                                setShowTravelTimeWarning(true);
                                                                                // Auto-hide warning after 3 seconds
                                                                                setTimeout(() => setShowTravelTimeWarning(false), 3000);
                                                                            }}
                                                                            className="w-full p-2 text-sm font-bold border border-slate-200 rounded-lg bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                                                        >
                                                                            <option value="5">5 minutes</option>
                                                                            <option value="10">10 minutes</option>
                                                                            <option value="15">15 minutes</option>
                                                                            <option value="20">20 minutes</option>
                                                                            <option value="30">30 minutes</option>
                                                                            <option value="45">45 minutes</option>
                                                                            <option value="60">1 hour</option>
                                                                        </select>
                                                                        <p className="text-[9px] text-slate-500 mt-1 flex-1">Estimated time to reach the clinic</p>

                                                                        {/* Travel Time Warning */}
                                                                        {showTravelTimeWarning && (
                                                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                                <div className="flex items-center gap-2">
                                                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                                                                    <p className="text-[9px] font-bold text-amber-800">Travel time updated! Check arrival analysis to ensure you arrive on time.</p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Live Arrival Comparison */}
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
                                                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Arrival Analysis</h4>
                                                                        {selectedWalkInShiftId ? (() => {
                                                                            const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
                                                                            if (!selectedShift) return (
                                                                                <div className="flex-1 flex items-center justify-center">
                                                                                    <p className="text-[9px] text-slate-400 text-center">Select a shift to see arrival analysis</p>
                                                                                </div>
                                                                            );

                                                                            const now = new Date();
                                                                            const travelMins = parseInt(travelTime);
                                                                            const arrivalTime = new Date(now.getTime() + travelMins * 60000);
                                                                            const estimatedTurn = new Date(now.getTime() + selectedShift.stats.totalWaitMins * 60000);
                                                                            const isLateRisk = (travelMins + 10) > selectedShift.stats.totalWaitMins;

                                                                            return (
                                                                                <div className="flex-1 space-y-3">
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        <div className="text-center">
                                                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Your Arrival</div>
                                                                                            <div className="text-sm font-black text-slate-900">{arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Est. Turn</div>
                                                                                            <div className="text-sm font-black text-slate-900">{estimatedTurn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {isLateRisk && (
                                                                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                                                                <span className="text-[10px] font-bold text-orange-800">Late Arrival Warning</span>
                                                                                            </div>
                                                                                            <p className="text-[9px] text-orange-700 mt-0.5">Your travel time may exceed the estimated wait. You might lose your spot.</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })() : (
                                                                            <div className="flex-1 flex items-center justify-center">
                                                                                <p className="text-[9px] text-slate-400 text-center">Select a shift to see arrival analysis</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {walkInShiftsToday.map(({ shift, statusLabel, statusColor, stats, isEnded, isFull }) => (
                                                                        <div key={shift.id || shift.startTime} onClick={() => !isEnded && !isFull && setSelectedWalkInShiftId(shift.id || shift.startTime)} className={`p-2 rounded-xl border-2 transition-all ${(!isEnded && !isFull) ? 'cursor-pointer' : 'cursor-not-allowed'} ${selectedWalkInShiftId === (shift.id || shift.startTime) ? 'border-primary-600 bg-white shadow-md' : (isEnded || isFull) ? 'bg-slate-100/50 border-transparent opacity-40 grayscale' : 'bg-white border-slate-200 hover:border-primary-300'}`}>
                                                                            <div className="flex justify-between items-start mb-1"><div className={`p-1.5 rounded-lg ${selectedWalkInShiftId === (shift.id || shift.startTime) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Clock className="h-3 w-3" /></div><span className={`text-[7px] font-black uppercase tracking-wider ${statusColor}`}>{statusLabel}</span></div>
                                                                            <h4 className="font-black text-slate-800 text-xs">{shift.label || 'Regular Shift'}</h4>
                                                                            <p className="text-[8px] text-slate-400 font-bold mb-1">{formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}</p>
                                                                            {!isEnded && <div className="border-t border-slate-50 pt-1 flex justify-between items-center"><span className="text-[8px] font-bold text-slate-500">{stats.load} Waiting</span><span className={`text-[9px] font-black ${stats.totalWaitMins > 30 ? 'text-orange-600' : 'text-emerald-600'}`}>~{stats.totalWaitMins}m Wait</span></div>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                                                    {bookingDates.map(day => (
                                                                        <button key={day.dateStr} disabled={day.isOff} onClick={() => { setApptDate(day.dateStr); setApptTime(''); }} className={`flex-shrink-0 w-10 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${apptDate === day.dateStr ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : day.isOff ? 'bg-slate-100/50 text-slate-300 border-transparent' : 'bg-white border-slate-200 hover:border-indigo-400'}`}><span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{day.dayShort}</span><span className="text-sm font-black">{day.dayNum}</span></button>
                                                                    ))}
                                                                </div>
                                                                {apptDate && (
                                                                    <div className="space-y-2">
                                                                        {(Object.entries(groupedTimeSlots) as [string, any[]][]).map(([period, slots]) => slots.length > 0 && (
                                                                            <div key={period}>
                                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">{period}</span>
                                                                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 flex-wrap">
                                                                                    {slots.map(slot => (
                                                                                        <button key={slot.time} disabled={slot.isBlocked || slot.isFull || slot.isBooked} onClick={() => setApptTime(slot.value)} className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${slot.isBlocked || slot.isFull || slot.isBooked ? 'bg-slate-100 text-slate-300 border-transparent grayscale' : apptTime === slot.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-md z-10' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}>{formatTime12h(slot.value)}</button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Symptoms Input and Confirm */}
                                                    <div className="space-y-2">
                                                        <Input label="Short Summary of Symptoms" placeholder="e.g. Fever since 2 days, Back pain" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                                                        
                                                        <div className="flex flex-col gap-1">
                                                            <button 
                                                                className={`w-full h-12 text-lg font-black rounded-2xl shadow-xl transition-all text-white disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98] ${visitType === 'APPOINTMENT' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-100'}`} 
                                                                disabled={(visitType === 'APPOINTMENT' && (!apptDate || !apptTime)) || (visitType === 'WALK_IN' && !selectedWalkInShiftId)} 
                                                                onClick={() => {
                                                                    if (visitType === 'WALK_IN' && selectedWalkInShiftId) {
                                                                        const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
                                                                        if (selectedShift) {
                                                                            const travelMins = parseInt(travelTime);
                                                                            const isLateRisk = (travelMins + 10) > selectedShift.stats.totalWaitMins;
                                                                            if (isLateRisk) {
                                                                                setShowLateWarningModal(true);
                                                                                return;
                                                                            }
                                                                        }
                                                                    }
                                                                    handleBookToken();
                                                                }}
                                                            >
                                                                {visitType === 'APPOINTMENT' ? 'Confirm Appointment' : 'Join Live Queue'}
                                                            </button>
                                                            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                                <ShieldCheck className="h-3 w-3" /> Secure & Instant Confirmation
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-orange-50/50 p-12 rounded-[2rem] border-2 border-dashed border-orange-200 text-center space-y-6">
                                                    <div className="p-4 bg-white rounded-full inline-block shadow-lg border border-orange-100"><MapPinIcon className="h-8 w-8 text-orange-600" /></div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-orange-900 uppercase tracking-widest">Visit Clinic for Token</h3>
                                                        <p className="text-xs text-orange-700 mt-2 font-bold opacity-80">This clinic currently only supports in-person token collection.</p>
                                                    </div>
                                                    <button className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-lg transition-all transform active:scale-95 flex items-center gap-2 mx-auto text-xs uppercase tracking-widest" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedClinic?.geoLocation?.lat},${selectedClinic?.geoLocation?.lng}`)}>
                                                        <Navigation className="h-4 w-4" /> Get Directions
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Map Panel */}
                            {isMapTabVisible && (
                                <MapPanel
                                    key={`map-${showMap}-${bookingView}-${userLocation ? 'located' : 'not'}`}
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
                                        if (c) {
                                            if (window.innerWidth < 768) setShowMap(false);
                                            navigateToView('CLINIC_DETAILS', c);
                                        }
                                    }}
                                    onClosePickingLocation={() => setIsPickingLocation(false)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
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
        <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} title="Submit Visit Feedback" maxWidth="max-w-md">
            <div className="text-center py-4 flex flex-col gap-6">
                <div>
                    <p className="text-slate-500 mb-4">How was your experience with <strong>Dr. {feedbackModal.visit?.doctorName}</strong>?</p>
                    <StarRating rating={feedbackModal.rating} setRating={(r) => setFeedbackModal({...feedbackModal, rating: r})} interactive={true} />
                </div>
                
                <textarea 
                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none bg-slate-50"
                    rows={4}
                    placeholder="Describe your visit experience (optional)..."
                    value={feedbackModal.text}
                    onChange={(e) => setFeedbackModal({...feedbackModal, text: e.target.value})}
                />
                
                <div className="flex flex-col gap-2">
                    <Button onClick={handleSubmitFeedback} className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-100">
                        Submit Feedback
                    </Button>
                    <button onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2">
                        Maybe later
                    </button>
                </div>
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
                    <Button onClick={() => { setShowLateWarningModal(false); setShowBookingSummary(true); }} className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                        Proceed Anyway
                    </Button>
                    <Button variant="secondary" onClick={() => setShowLateWarningModal(false)} className="w-full">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>

        {/* BOOKING SUMMARY MODAL - NEW FEATURE */}
        <Modal isOpen={showBookingSummary} onClose={() => setShowBookingSummary(false)} title="Verify Booking Details" maxWidth="max-w-md">
            <div className="space-y-6">
                {/* Doctor & Clinic Details Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
                            <img src={selectedDoctor?.avatarUrl} className="w-full h-full object-cover" alt={selectedDoctor?.name} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 leading-tight">{selectedDoctor?.name}</h4>
                            <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{selectedDoctor?.specialty}</p>
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5"><Building2 className="h-2.5 w-2.5" /> {selectedClinic?.name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Patient</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                                <User className="h-3.5 w-3.5 text-primary-500" />
                                {bookingFor === 'MYSELF' ? userName : bookingFor}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Visit Type</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                                {visitType === 'WALK_IN' ? <Zap className="h-3.5 w-3.5 text-primary-500" /> : <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />}
                                {visitType === 'WALK_IN' ? 'Live Token' : 'Appointment'}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Schedule</span>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                    <Clock className="h-3.5 w-3.5 text-primary-500" />
                                    {visitType === 'WALK_IN' ? (
                                        <>Today • {walkInEstimation?.estClockTime} <span className="text-[10px] font-medium text-slate-400 ml-1">(est. turn)</span></>
                                    ) : (
                                        <>{new Date(apptDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatTime12h(apptTime)}</>
                                    )}
                                </div>
                                {visitType === 'WALK_IN' && selectedWalkInShiftId && (() => {
                                    const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
                                    if (!selectedShift) return null;
                                    
                                    const now = new Date();
                                    const travelMins = parseInt(travelTime);
                                    const arrivalTime = new Date(now.getTime() + travelMins * 60000);
                                    
                                    return (
                                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                            <Navigation className="h-3 w-3 text-blue-500" />
                                            <span>Your arrival: <strong>{arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong> ({travelTime} min travel)</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {symptoms && (
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Stated Symptoms</span>
                        <p className="text-sm text-slate-700 italic font-medium leading-relaxed">{symptoms}</p>
                    </div>
                )}

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 items-start">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                        Please arrive 10 minutes before your scheduled time. You can track your live turn status in the "Active Visits" tab.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={() => submitBooking()} className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-100">
                        Confirm & Book Now
                    </Button>
                    <button onClick={() => setShowBookingSummary(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2 flex items-center justify-center gap-2">
                        <Edit2 className="h-3.5 w-3.5" /> Modify Details
                    </button>
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
        
        {/* Cancel Confirmation Modal */}
        {cancelModal.isOpen && (
            <Modal isOpen={true} onClose={() => setCancelModal({ isOpen: false, visit: null })} title="Cancel Visit?" maxWidth="max-w-sm">
                <div className="text-center">
                    <p className="text-slate-600 mb-6">Are you sure you want to cancel your visit? This action cannot be undone.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setCancelModal({ isOpen: false, visit: null })}>Keep Visit</Button>
                        {/* Fix: Changed confirmDelete to correctly referenced confirmCancel function */}
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmCancel}>Yes, Cancel</Button>
                    </div>
                </div>
            </Modal>
        )}

        <ConfirmationModal 
            isOpen={memberToDeleteIndex !== null}
            onClose={() => setMemberToDeleteIndex(null)}
            onConfirm={handleDeleteMember}
            title="Remove Family Member?"
            message={`Are you sure you want to remove this family member from your profile?`}
            confirmLabel="Remove Member"
            variant="danger"
        />

        <DoctorProfileModal
            isOpen={doctorProfileModal.isOpen}
            onClose={() => setDoctorProfileModal({ isOpen: false, doctor: null, clinic: null })}
            doctor={doctorProfileModal.doctor}
            operationMode={doctorProfileModal.clinic?.operationMode}
            clinic={doctorProfileModal.clinic}
            onBook={() => {
                if (doctorProfileModal.doctor && doctorProfileModal.clinic) {
                    navigateToView(null, doctorProfileModal.clinic, doctorProfileModal.doctor);
                    setDoctorProfileModal({ isOpen: false, doctor: null, clinic: null });
                }
            }}
        />
    </div>
  );
};
