
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clinic, Patient, PatientStatus, ClinicType, DoctorStatus, Doctor } from '../../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';
// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { 
    ArrowLeft, MapPin, Search, Calendar, QrCode, ChevronRight, 
    AlertTriangle, Star, Clock, Filter, Stethoscope, Smile, 
    Baby, Heart, Activity, Sparkles, LayoutGrid, Eye, Ear, 
    ArrowUpRight, Navigation, Timer, ChevronDown, Building2, 
    ShieldCheck, ThumbsUp, Map as MapIcon, CheckCircle2, Info, Lock, History, X, AlertCircle, Sun, Moon,
    GraduationCap, Globe, BadgeCheck, User, Users, Plus, FileHeart, LogOut, Layout, Edit2, Trash2, Coffee, Hourglass, LogIn, ArrowRight, Sunset, CloudSun, List as ListIcon, Crosshair, Zap, ExternalLink
} from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  isGuest?: boolean;
  onLoginClick?: (phone?: string, name?: string) => void;
  onGuestBook?: (bookingData: any) => void;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void;
  onCancelVisit: (clinicId: string, pId: string) => void;
  onCheckIn: (clinicId: string, pId: string) => void;
  preSelectedClinicId?: string;
  onClearPendingAction: () => void;
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
        
        // Expected format: "09:00 AM - 09:00 PM"
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

// --- HELPER COMPONENTS FOR MAP ---

// Component to update map center when clinic selection changes or filters change
const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// Component to handle Map Clicks for Location Pinning
const MapClickHandler = ({ isActive, onLocationSelect }: { isActive: boolean, onLocationSelect: (latlng: L.LatLng) => void }) => {
    useMapEvents({
        click(e) {
            if (isActive) {
                onLocationSelect(e.latlng);
            }
        },
    });
    return null;
};

// Draggable User Marker Component
const DraggableUserMarker = ({ position, onDragEnd, icon }: { position: L.LatLngExpression, onDragEnd: (latlng: L.LatLng) => void, icon: L.DivIcon }) => {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onDragEnd(marker.getLatLng());
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            icon={icon}
            ref={markerRef}
            zIndexOffset={1000} // Ensure it stays on top of other markers
        >
            <Popup minWidth={90}>
                <div className="text-center">
                    <div className="font-bold text-slate-800">Your Location</div>
                    <div className="text-xs text-slate-500">Drag to adjust</div>
                </div>
            </Popup>
        </Marker>
    );
};

// Custom Marker Icons generator
const createCustomIcon = (colorClass: string, waitTime: string) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `
            <div class="relative group">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg ${colorClass} flex items-center justify-center text-white font-bold text-xs transform transition-transform group-hover:scale-110">
                    ${waitTime}
                </div>
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 transform"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 36], // Point at bottom
        popupAnchor: [0, -36]
    });
};

const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="relative cursor-move">
             <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10"></div>
             <div class="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
});

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
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
  clinics, userPhone, userName, isGuest, onLoginClick, onGuestBook, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit, onCheckIn, preSelectedClinicId, onClearPendingAction
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE'>('BOOK');
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(preSelectedClinicId || null);
  const [bookingView, setBookingView] = useState<'LIST' | 'CLINIC_DETAILS' | 'FORM'>('LIST');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // FILTERS STATE
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedInsurance, setSelectedInsurance] = useState('All Insurances');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'NEAR' | 'WAIT' | 'FEE'>('NEAR');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', age: '', gender: 'Male', relation: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isCustomRelation, setIsCustomRelation] = useState(false); // State for custom relation input
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [travelTime, setTravelTime] = useState('15'); 
  const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF'); 
  
  // MAP STATE
  const [showMap, setShowMap] = useState(false);
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
          // Check if relation is standard or custom
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

  const uniqueInsurances = useMemo(() => {
      const set = new Set<string>();
      clinics.forEach(c => c.acceptedInsurances?.forEach(i => set.add(i)));
      return ['All Insurances', ...Array.from(set).sort()];
  }, [clinics]);

  useEffect(() => { if (preSelectedClinicId) { setSelectedClinicId(preSelectedClinicId); setBookingView('CLINIC_DETAILS'); setActiveTab('BOOK'); onClearPendingAction(); const clinic = clinics.find(c => c.id === preSelectedClinicId); if (clinic) { setSelectedCity(clinic.city); } } }, [preSelectedClinicId, clinics, onClearPendingAction]);
  const activeVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', room: doc?.roomNumber || '-' }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  const historyVisits = useMemo(() => { if(isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown' }); } }); }); return visits.sort((a,b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);
  
  // --- FILTERING LOGIC ---
  const filteredClinics = useMemo(() => { 
      let filtered = clinics; 

      // 1. Search Query
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

      // 2. City Filter
      if (selectedCity !== 'All Cities') {
          filtered = filtered.filter(c => c.city === selectedCity);
      }

      // 3. Specialty Filter (Doctor based)
      if (selectedSpecialty !== 'All Specialties') {
          filtered = filtered.filter(c => c.doctors.some(d => d.specialty === selectedSpecialty));
      }

      // 4. Insurance Filter
      if (selectedInsurance !== 'All Insurances') {
          filtered = filtered.filter(c => c.acceptedInsurances?.includes(selectedInsurance));
      }

      // 5. Category Buttons (Quick Filter)
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

      // 6. Open Now Filter
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
  }, [clinics, searchQuery, selectedCategory, sortBy, selectedCity, selectedSpecialty, selectedInsurance, userLocation, showOpenOnly]);

  // --- SMART DOCTOR-SPECIFIC WAIT LOGIC ---
  const getDoctorWaitDetails = (clinic: Clinic, doctorId: string) => {
      const doc = clinic.doctors.find(d => d.id === doctorId);
      if (!doc) return { count: 0, time: 0 };
      
      const physicalQueue = clinic.patients.filter(p => p.doctorId === doctorId && p.status === PatientStatus.WAITING);
      
      let waitMinutes = physicalQueue.length * 15; // Base estimate (15m per person)
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
          else if (term === 'gynecology') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('gyn'));
          else if (term === 'orthopedic') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('ortho'));
          else if (term === 'dermatology') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('derm'));
          else if (term === 'ophthalmology') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('eye') || d.specialty.toLowerCase().includes('ophth'));
          else if (term === 'ent') relevantDoctors = relevantDoctors.filter(d => d.specialty.toLowerCase().includes('ent'));
          
          if (relevantDoctors.length === 0) relevantDoctors = clinic.doctors;
      }

      if (relevantDoctors.length === 0) return { min: 0, max: 0, label: 'No Doctors', color: 'bg-slate-100 text-slate-500', raw: '0' };

      const waitTimes = relevantDoctors.map(d => getDoctorWaitDetails(clinic, d.id).time);
      const min = Math.min(...waitTimes);
      const max = Math.max(...waitTimes);
      
      const avg = (min + max) / 2;
      let color = 'bg-green-100 text-green-700';
      let mapColor = 'bg-green-500';
      let label = 'Fast';
      
      if (avg > 20) { color = 'bg-yellow-100 text-yellow-700'; mapColor = 'bg-yellow-500'; label = 'Moderate'; }
      if (avg > 45) { color = 'bg-red-100 text-red-700'; mapColor = 'bg-red-500'; label = 'Busy'; }

      const raw = min === max ? `${min}` : `${min}-${max}`;
      
      return { min, max, color, label, raw, mapColor };
  };

  const getFeeRange = (clinic: Clinic) => { if (!clinic.doctors.length) return 'N/A'; const fees = clinic.doctors.map(d => d.consultationFee); const min = Math.min(...fees); const max = Math.max(...fees); return min === max ? `₹${min}` : `₹${min} - ₹${max}`; };
  
  // Updated Helper: Get relevant doctors to display on card
  const getRelevantDoctors = (clinic: Clinic) => {
      let relevant = clinic.doctors;
      
      // Filter by current filters
      if (selectedSpecialty !== 'All Specialties') {
          relevant = relevant.filter(d => d.specialty === selectedSpecialty);
      } else if (selectedCategory !== 'ALL') {
          // Broad category matching
          const cat = selectedCategory.toLowerCase();
          if (cat === 'dental') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('dent'));
          else if (cat === 'pediatric') relevant = relevant.filter(d => d.specialty.toLowerCase().includes('pedia'));
          // ... (add other broad matches as needed, or rely on specific specialty)
      }
      
      // If user searched for a doctor name, prioritize them
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matched = relevant.filter(d => d.name.toLowerCase().includes(q));
          if (matched.length > 0) relevant = matched;
      }

      return relevant;
  };

  const getSmartQueueDetails = (visit: any) => { const clinic = clinics.find(c => c.id === visit.clinicId); const doctor = clinic?.doctors.find(d => d.id === visit.doctorId); if (!clinic || !doctor) return { peopleAhead: 0, waitTime: 0, currentToken: '-', message: 'Loading...', color: 'text-slate-500' }; const peopleAhead = clinic.patients.filter(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WAITING && p.timeAdded < visit.timeAdded ).length; const servingPatient = clinic.patients.find(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WITH_DOCTOR); const currentToken = servingPatient ? `#${servingPatient.tokenNumber}` : 'Not Started'; let baseWait = peopleAhead * 15; if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes; const now = new Date(); now.setMinutes(now.getMinutes() + baseWait); const expectedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); let message = `~${baseWait} mins wait`; let color = 'text-slate-600'; let bgColor = 'bg-slate-100'; if (doctor.status === DoctorStatus.ON_BREAK) { message = "Doctor is on break"; color = "text-orange-700"; bgColor = "bg-orange-100"; } else if (doctor.delayMinutes > 0) { message = `Delayed by ${doctor.delayMinutes} mins`; color = "text-red-700"; bgColor = "bg-red-100"; } else if (visit.isCheckedIn) { if (peopleAhead === 0) { message = "You are next! Get ready."; color = "text-green-700"; bgColor = "bg-green-100"; } else if (peopleAhead < 3) { message = "Almost your turn. Stay close."; color = "text-blue-700"; bgColor = "bg-blue-100"; } else { message = "Checked in. Relax in lobby."; color = "text-green-700"; bgColor = "bg-green-5"; } } else { if (peopleAhead < 3) { message = "Rush! Reaching your turn."; color = "text-red-700"; bgColor = "bg-red-100"; } else { message = "Start travelling to clinic."; color = "text-blue-700"; bgColor = "bg-blue-100"; } } return { peopleAhead, waitTime: baseWait, expectedTime, currentToken, message, color, bgColor, doctorStatus: doctor.status }; };
  useEffect(() => { let timer: ReturnType<typeof setTimeout>; if (showQRScanner) { timer = setTimeout(() => { if (clinics.length > 0) { let targetClinicId = selectedClinicId; if (!targetClinicId) { const visitNeedsCheckIn = activeVisits.find(v => !v.isCheckedIn && v.status === PatientStatus.WAITING); targetClinicId = visitNeedsCheckIn ? visitNeedsCheckIn.clinicId : clinics[0].id; } const activeVisit = activeVisits.find(v => v.clinicId === targetClinicId && v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED); if (activeVisit) { if (!activeVisit.isCheckedIn) { onCheckIn(targetClinicId!, activeVisit.id); addToast(`Checked in at ${activeVisit.clinicName}!`, "success"); } else { addToast(`Already checked in at ${activeVisit.clinicName}.`, "info"); } setActiveTab('ACTIVE'); } else { if (targetClinicId) { setSelectedClinicId(targetClinicId); setBookingView('CLINIC_DETAILS'); setActiveTab('BOOK'); addToast("QR Detected. Loading clinic details...", "success"); } } setShowQRScanner(false); } }, 2000); } return () => clearTimeout(timer); }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn, addToast]);

  const submitBooking = (overrideName?: string, overridePhone?: string) => {
      let pName = overrideName || userName;
      let pPhone = overridePhone || userPhone;
      let pAge = isGuest ? guestAge : userProfile?.age;
      let pGender = isGuest ? guestGender : userProfile?.gender;

      if (!isGuest && bookingFor !== 'MYSELF') {
          const member = userProfile?.familyMembers.find(m => m.name === bookingFor);
          if (member) {
              pName = member.name;
              pAge = member.age;
              pGender = member.gender;
          }
      }

      // DUPLICATE BOOKING CHECK
      const currentClinic = clinics.find(c => c.id === selectedClinicId);
      if (currentClinic) {
          const isDuplicate = currentClinic.patients.some(p => {
              // Check if same patient
              const isSameUser = p.phone === pPhone && p.name.toLowerCase() === pName.toLowerCase();
              if (!isSameUser) return false;

              // Condition 1: Already active (Waiting/With Doctor/On Hold)
              if (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR || p.status === PatientStatus.ON_HOLD) {
                  return true;
              }

              // Condition 2: Pending Appointment for SAME date
              if (visitType === 'APPOINTMENT' && p.visitType === 'APPOINTMENT' && p.appointmentDate === apptDate && p.status !== PatientStatus.CANCELLED && p.status !== PatientStatus.COMPLETED) {
                  return true;
              }

              return false;
          });

          if (isDuplicate) {
              addToast(`Duplicate: ${pName} already has an active visit in this clinic.`, "error");
              return;
          }
      }

      onGetToken(pName, pPhone, selectedDoctorId!, selectedClinicId!, visitType === 'APPOINTMENT' ? apptTime : undefined, visitType === 'APPOINTMENT' ? apptDate : undefined, pAge, pGender, symptoms);
      setActiveTab('ACTIVE');
      setBookingView('LIST');
      setSelectedDoctorId(null);
      setSymptoms('');
      setVisitType('WALK_IN');
      setApptDate('');
      setApptTime('');
      setBookingFor('MYSELF');
      setShowLateWarningModal(false); 
      setShowAuthModal(false);
  };

  const handleBookToken = (e?: React.MouseEvent) => {
      e?.preventDefault();
      if (!selectedClinicId || !selectedDoctorId) return;
      if (isGuest) {
          if (!guestName.trim() || !guestAge) {
              addToast("Please enter your Name and Age", "error");
              return;
          }
          setShowAuthModal(true);
          return;
      }
      const clinic = clinics.find(c => c.id === selectedClinicId);
      // Ensure we use the smart calculator here for warning logic too
      const waitDetails = clinic && selectedDoctorId ? getDoctorWaitDetails(clinic, selectedDoctorId) : { count: 0, time: 0 };
      const estimatedWaitMins = waitDetails.time;
      
      const travelMins = parseInt(travelTime) || 0;
      if (visitType === 'WALK_IN' && travelMins > estimatedWaitMins + 10) {
          setShowLateWarningModal(true);
          return;
      }
      submitBooking();
  };

  // UPDATED: Handle auth success (Guest -> Registered transition)
  const handleAuthSuccess = (phone: string, name: string, isExisting: boolean) => {
      if (onLoginClick) onLoginClick(phone, name);
      
      if (isExisting) {
          addToast(`Welcome back ${name}! Please confirm booking details.`, "info");
          setShowAuthModal(false);
      } else {
          submitBooking(name, phone);
      }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
        addToast("Geolocation is not supported by your browser", "error");
        setIsLocating(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setIsLocating(false);
            setSortBy('NEAR'); // Auto-switch to nearest
            setShowMap(true); // Show map on mobile if hidden
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

  // Handler for dragging user marker
  const handleMarkerDragEnd = (latlng: L.LatLng) => {
      setUserLocation({ lat: latlng.lat, lng: latlng.lng });
      setSortBy('NEAR');
      addToast("Location updated!", "success");
  };

  // Handler for map click selection
  const handleMapSelection = (latlng: L.LatLng) => {
      setUserLocation({ lat: latlng.lat, lng: latlng.lng });
      setIsPickingLocation(false);
      setSortBy('NEAR');
      addToast("Location pinned!", "success");
  };

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);
  const selectedDoctor = selectedClinic?.doctors.find(d => d.id === selectedDoctorId);
  
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
          const endMins = endH * 60 + endM; 
          return currentMins >= startMins && currentMins < endMins; 
      }); 
  }, [selectedDoctor]);

  useEffect(() => { if (selectedDoctorId && !isWalkInAllowed && visitType === 'WALK_IN') { setVisitType('APPOINTMENT'); } }, [selectedDoctorId, isWalkInAllowed]);
  const confirmCancel = () => { if (cancelModal.visit) { onCancelVisit(cancelModal.visit.clinicId, cancelModal.visit.id); addToast("Appointment Cancelled", "info"); setCancelModal({ isOpen: false, visit: null }); } };
  const bookingDates = useMemo(() => { if (!selectedDoctor) return []; const days = []; const today = new Date(); for(let i=0; i<14; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }); const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName); days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate(), isOff: !schedule || schedule.isOff, schedule }); } return days; }, [selectedDoctor]);
  
  const groupedTimeSlots = useMemo<GroupedSlots>(() => {
    const groups: GroupedSlots = { Morning: [], Afternoon: [], Evening: [] };
    if (!selectedDoctor || !apptDate) return groups;
    const selectedDayObj = bookingDates.find(d => d.dateStr === apptDate);
    if (!selectedDayObj || selectedDayObj.isOff || !selectedDayObj.schedule) return groups;
    selectedDayObj.schedule.slots.forEach(timeSlot => {
        const { startTime, endTime } = timeSlot;
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let currentMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const shiftStartMins = startH * 60 + startM;
        const now = new Date();
        const isToday = apptDate === now.toISOString().split('T')[0];
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (isToday && nowMins >= shiftStartMins) { return; }
        const MIN_NOTICE_MINS = 30;
        while (currentMins + 15 <= endMins) {
            if (!isToday || currentMins > (nowMins + MIN_NOTICE_MINS)) {
                const h = Math.floor(currentMins / 60);
                const m = currentMins % 60;
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const suffix = h >= 12 ? 'PM' : 'AM';
                const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
                const displayStr = `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
                const slotObj = { value: timeStr, label: displayStr };
                if (h < 12) groups.Morning.push(slotObj);
                else if (h < 17) groups.Afternoon.push(slotObj);
                else groups.Evening.push(slotObj);
            }
            currentMins += 15;
        }
    });
    return groups;
  }, [selectedDoctor, apptDate, bookingDates]);

  const hasAnySlots = useMemo(() => {
      return groupedTimeSlots.Morning.length > 0 || groupedTimeSlots.Afternoon.length > 0 || groupedTimeSlots.Evening.length > 0;
  }, [groupedTimeSlots]);

  const getDoctorTodaySchedule = (doc: any) => { const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const today = days[new Date().getDay()]; const schedule = doc.weeklySchedule.find((s: any) => s.day === today); if (!schedule || schedule.isOff) return <span className="text-red-500 font-bold text-[10px]">OFF Today</span>; if (schedule.slots.length === 1) return <span className="text-green-700 font-bold text-[10px]">{schedule.slots[0].startTime} - {schedule.slots[0].endTime}</span>; return <span className="text-green-700 font-bold text-[10px]">{schedule.slots.length} Shifts Today</span>; };
  const getLinkedClinics = (doc: Doctor) => { return clinics.filter(c => c.doctors.some(d => d.masterId === doc.masterId && c.id !== selectedClinicId)); };
  const navItems = [ { id: 'BOOK', label: 'Find Care', icon: Search }, { id: 'ACTIVE', label: 'Active Visits', icon: Ticket }, { id: 'HISTORY', label: 'History', icon: History }, { id: 'PROFILE', label: 'Profile', icon: User } ];
  function Ticket({ className }: { className?: string }) { return ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" /> </svg> ); }
  const GuestLoginCard = () => ( <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center"> <div className="bg-slate-100 p-6 rounded-full mb-6"><Lock className="h-10 w-10 text-slate-400" /></div> <h3 className="text-xl font-bold text-slate-800 mb-2">Login Required</h3> <p className="text-slate-500 mb-8 max-w-xs">Please login to access your appointments and medical history.</p> <Button onClick={() => onLoginClick && onLoginClick()} size="lg" className="shadow-lg px-10">Login / Register</Button> </div> );

  // Map Center Calculation
  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation && !selectedClinicId) return [userLocation.lat, userLocation.lng]; // Prioritize user location
    if (selectedClinicId) {
        const c = clinics.find(cl => cl.id === selectedClinicId);
        if (c && c.geoLocation) return [c.geoLocation.lat, c.geoLocation.lng];
    }
    // Default to Chennai/First Clinic if filtered
    if (filteredClinics.length > 0 && filteredClinics[0].geoLocation) {
        return [filteredClinics[0].geoLocation.lat, filteredClinics[0].geoLocation.lng];
    }
    return [13.0850, 80.2100]; // Default Chennai
  }, [selectedClinicId, filteredClinics, userLocation]);

  const scrollToClinic = (clinicId: string) => {
    setHighlightedClinicId(clinicId);
    
    // Check if we are on desktop where split view exists
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop) {
        const element = clinicCardRefs.current[clinicId];
        if (element) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // On mobile, maybe we want to show the list?
        // For now, let's keep the map open as clicking a marker usually means you want to see the popup
        // But we will also scroll the list in background
    }

    // Remove highlight after animation
    setTimeout(() => {
      setHighlightedClinicId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30"> <div className="p-6 border-b border-slate-100"> <div className="flex items-center gap-2"> <Logo className="h-8 w-8" /> <span className="font-bold text-xl text-slate-900 tracking-tight">Smart<span className="text-primary-600">QFlow</span></span> </div> </div> <div className="flex-1 py-6 px-4 space-y-2"> {navItems.map(item => ( <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}> <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} /> {item.label} </button> ))} </div> <div className="p-4 border-t border-slate-100"> <div className="flex items-center gap-3 px-4 py-3"> <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">{isGuest ? <User className="h-5 w-5" /> : userName.charAt(0)}</div> <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{userName}</p><p className="text-xs text-slate-500 truncate">{userPhone}</p></div> </div> {isGuest ? ( <Button onClick={() => onLoginClick && onLoginClick()} className="w-full mt-2 justify-center gap-2 shadow-md"><LogIn className="h-4 w-4" /> Login</Button> ) : ( <button onClick={onBack} className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut className="h-4 w-4" /> Logout</button> )} </div> </aside>
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 w-full">
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    {bookingView !== 'LIST' && activeTab === 'BOOK' ? (
                        <Button variant="ghost" size="sm" onClick={() => { setBookingView('LIST'); setSelectedClinicId(null); }} className="p-0 mr-2 hover:bg-slate-100 rounded-full">
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
            <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shrink-0 z-10"> <div><h2 className="text-2xl font-bold text-slate-900">{activeTab === 'BOOK' && bookingView !== 'LIST' ? 'Appointment Details' : activeTab === 'ACTIVE' ? 'Your Active Visits' : activeTab === 'HISTORY' ? 'Visit History' : activeTab === 'PROFILE' ? 'My Profile' : 'Find Care'}</h2></div> <div className="flex items-center gap-4"><Button variant="outline" onClick={() => setShowQRScanner(true)} className="hidden md:flex"><QrCode className="h-4 w-4 mr-2" /> Scan QR Code</Button></div> </header>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-24 md:pb-0 p-0">
                {activeTab === 'ACTIVE' && ( isGuest ? <GuestLoginCard /> : ( <div className="px-4 md:px-0 max-w-7xl mx-auto pt-4 md:pt-8 md:px-8"> {activeVisits.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {activeVisits.map(visit => { const queueStats = getSmartQueueDetails(visit); return ( <Card key={visit.id} className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"> <div className="p-5 pb-2 flex justify-between items-start"><div><h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3><p className="text-sm text-slate-500">Dr. {visit.doctorName} • {visit.room ? `Room ${visit.room}` : ''}</p></div><Badge status={visit.status} /></div> <div className="px-5 mb-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit"><User className="h-3 w-3" /> {visit.name}</span></div> <div className="bg-slate-50 border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center"><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Token</div><div className="text-3xl font-black text-slate-900">#{visit.tokenNumber}</div></div><div className="border-x border-slate-200"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Now Serving</div><div className={`text-3xl font-bold ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>{visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken}</div></div><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People Ahead</div><div className="text-3xl font-bold text-slate-900">{queueStats.peopleAhead}</div></div></div> <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold`}>{queueStats.doctorStatus === DoctorStatus.ON_BREAK ? <Coffee className="h-5 w-5" /> : queueStats.doctorStatus === DoctorStatus.AVAILABLE ? <Timer className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}<div className="flex-1"><p>{queueStats.message}</p>{visit.status === PatientStatus.WAITING && (<p className="text-[10px] opacity-80 font-normal">Est. Time: {queueStats.expectedTime}</p>)}</div></div> {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 flex items-center gap-2 border-t border-orange-100"><Info className="h-4 w-4 flex-shrink-0" /><span>{queueStats.peopleAhead < 3 ? "Almost your turn! Please ask receptionist to Check-in now." : "Please ask receptionist to Check-in once you arrive."}</span></div>)} <div className="p-4 flex gap-2 mt-auto">{!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (<Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => setShowQRScanner(true)}><QrCode className="h-4 w-4 mr-2" /> Scan to Check-In</Button>)}<Button variant="secondary" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelModal({ isOpen: true, visit })} disabled={visit.status === PatientStatus.WITH_DOCTOR}>Cancel</Button></div> </Card> ); })} </div> ) : ( <div className="flex flex-col items-center justify-center h-[60vh] opacity-60"><div className="bg-slate-200 p-6 rounded-full mb-4"><Calendar className="h-12 w-12 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-700">No active visits</h3><p className="text-slate-500 mb-6 text-center max-w-sm">Book an appointment or scan a QR code at a clinic to see your live status here.</p><Button onClick={() => setActiveTab('BOOK')} size="lg" className="shadow-lg">Find a Doctor</Button></div> )} </div> ) )}

                {activeTab === 'BOOK' && (
                    <div className="h-full flex flex-col">
                        {bookingView === 'LIST' && (
                            <div className="h-full flex flex-col">
                                {/* Search & Filters Header */}
                                <div className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0 space-y-3">
                                    <div className="max-w-7xl mx-auto space-y-3">
                                        {/* Search Row */}
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" placeholder="Search doctor, clinic or symptoms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                            </div>
                                            {/* View Toggle - Mobile Only */}
                                            <button 
                                                onClick={() => setShowMap(!showMap)} 
                                                className="md:hidden flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                                            >
                                                {showMap ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                                                {showMap ? 'List View' : 'Map View'}
                                            </button>
                                        </div>

                                        {/* Dynamic Filters Row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {/* LOCATE ME BUTTON GROUP */}
                                            <div className="col-span-2 sm:col-span-1 flex gap-2">
                                                <button 
                                                    onClick={handleLocateMe}
                                                    disabled={isLocating}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 font-bold text-sm transition-colors"
                                                    title="Use GPS Location"
                                                >
                                                    {isLocating ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span> : <Crosshair className="h-4 w-4" />}
                                                    {userLocation && !isPickingLocation ? 'Update' : 'Locate'}
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        setIsPickingLocation(!isPickingLocation);
                                                        setShowMap(true);
                                                        if (!isPickingLocation) addToast("Click anywhere on the map to set your location", "info");
                                                    }}
                                                    className={`flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-bold text-sm transition-colors ${isPickingLocation ? 'bg-indigo-600 text-white border-indigo-600 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                    title="Set Pin on Map"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                <select 
                                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
                                                    value={selectedCity}
                                                    onChange={(e) => setSelectedCity(e.target.value)}
                                                >
                                                    {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                <select 
                                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
                                                    value={selectedSpecialty}
                                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                                >
                                                    {uniqueSpecialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                <select 
                                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
                                                    value={selectedInsurance}
                                                    onChange={(e) => setSelectedInsurance(e.target.value)}
                                                >
                                                    {uniqueInsurances.map(ins => <option key={ins} value={ins}>{ins}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Quick Categories & Open Now Toggle */}
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 items-center pb-1">
                                            <button
                                                onClick={() => setShowOpenOnly(!showOpenOnly)}
                                                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                                                    showOpenOnly 
                                                    ? 'bg-green-100 text-green-700 border-green-200 shadow-inner' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Clock className={`h-3 w-3 ${showOpenOnly ? 'text-green-600' : 'text-slate-400'}`} />
                                                Open Now
                                            </button>

                                            <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0"></div>

                                            {CATEGORIES.map(cat => (
                                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <cat.icon className="h-3 w-3" />
                                                    <span className="text-xs font-bold">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* SPLIT VIEW CONTENT */}
                                <div className="flex-1 overflow-hidden flex relative">
                                    {/* LIST PANEL (Left on Desktop, Full on Mobile if !showMap) */}
                                    <div className={`w-full md:w-[60%] lg:w-[55%] xl:w-[50%] h-full overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8 custom-scrollbar ${showMap ? 'hidden md:block' : 'block'}`}>
                                         <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-slate-900">{filteredClinics.length} Care Options Found</h3>
                                                <div className="hidden md:flex gap-2 text-xs">
                                                    <select className="bg-transparent font-bold text-slate-500 cursor-pointer focus:outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                                        <option value="NEAR">Sort: Nearest</option>
                                                        <option value="WAIT">Sort: Less Wait</option>
                                                        <option value="FEE">Sort: Low Fee</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredClinics.map(clinic => {
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
                                                        <div 
                                                            key={clinic.id} 
                                                            id={`clinic-card-${clinic.id}`}
                                                            ref={(el) => { clinicCardRefs.current[clinic.id] = el; }}
                                                            className={`bg-white rounded-2xl border p-0 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative overflow-hidden
                                                                ${isHighlighted 
                                                                    ? 'border-primary-500 ring-4 ring-primary-100 bg-primary-50 scale-[1.02] z-10' 
                                                                    : 'border-slate-200'}`}
                                                        >
                                                            {/* Card Header & Content */}
                                                            <div className="p-4 md:p-5 flex gap-3 md:gap-4 cursor-pointer" onClick={() => { setSelectedClinicId(clinic.id); setBookingView('CLINIC_DETAILS'); }}>
                                                                
                                                                {/* Clinic Image */}
                                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                                                                    {clinic.imageUrl ? (
                                                                        <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                    ) : (
                                                                        <Building2 className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
                                                                    )}
                                                                    <div className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-1 text-white uppercase tracking-wider ${waitInfo.mapColor}`}>
                                                                        {waitInfo.label}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <h3 className="font-bold text-slate-900 text-base md:text-lg truncate leading-tight group-hover:text-primary-600 transition-colors">{clinic.name}</h3>
                                                                        <span className="flex items-center text-xs font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex-shrink-0"><Star className="h-3 w-3 mr-1 fill-current" /> {rating}</span>
                                                                    </div>
                                                                    
                                                                    <div className="mb-2">
                                                                        {relevantDoctors.length > 0 ? (
                                                                            <div className="text-sm font-medium text-slate-700 truncate">
                                                                                <span className="text-slate-400 font-normal mr-1">Doctors:</span> 
                                                                                {relevantDoctors.slice(0, 2).map(d => `Dr. ${d.name.split(' ').pop()}`).join(', ')}
                                                                                {relevantDoctors.length > 2 && <span className="text-slate-400 text-xs ml-1">+{relevantDoctors.length - 2} more</span>}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-sm text-slate-400 italic">No matching doctors</div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col gap-1 mt-2">
                                                                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {distLabel}</span>
                                                                            <span className="flex items-center gap-1"><IndianRupeeIcon className="h-3 w-3" /> {feeRange}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                                             <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {clinic.operatingHours || '09:00 - 21:00'}</span>
                                                                             <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {waitInfo.raw}m Wait</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action Footer */}
                                                            <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center gap-2">
                                                                <Button 
                                                                    onClick={() => { setSelectedClinicId(clinic.id); setVisitType('APPOINTMENT'); setBookingView('CLINIC_DETAILS'); }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex-1 bg-white border-slate-200 text-slate-700 hover:text-primary-700 hover:border-primary-200 text-xs font-bold h-9"
                                                                >
                                                                    <Calendar className="h-3.5 w-3.5 mr-1.5" /> Book Appt
                                                                </Button>
                                                                
                                                                <Button 
                                                                    onClick={() => { setSelectedClinicId(clinic.id); setVisitType('WALK_IN'); setBookingView('CLINIC_DETAILS'); }}
                                                                    size="sm"
                                                                    className="flex-1 text-xs font-bold bg-slate-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all h-9"
                                                                >
                                                                    <Zap className="h-3.5 w-3.5 mr-1.5 fill-current" /> Join Queue
                                                                </Button>

                                                                <a 
                                                                    href={gmapsLink} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors h-9 w-9 flex items-center justify-center"
                                                                    title="Get Directions"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {filteredClinics.length === 0 && (
                                                    <div className="text-center py-12 opacity-50">
                                                        <Filter className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                                        <p>No clinics found.</p>
                                                    </div>
                                                )}
                                            </div>
                                         </div>
                                    </div>

                                    {/* MAP PANEL (Right on Desktop, Full on Mobile if showMap) */}
                                    <div className={`w-full md:w-[40%] lg:w-[45%] xl:w-[50%] h-full bg-slate-100 border-l border-slate-200 relative ${showMap ? 'block' : 'hidden md:block'}`}>
                                        <MapContainer 
                                            center={mapCenter} 
                                            zoom={13} 
                                            scrollWheelZoom={true} 
                                            className={isPickingLocation ? 'cursor-crosshair' : ''}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                            />
                                            <MapUpdater center={mapCenter} zoom={13} />
                                            <MapClickHandler isActive={isPickingLocation} onLocationSelect={handleMapSelection} />
                                            
                                            {/* User Marker */}
                                            {userLocation && (
                                                <DraggableUserMarker 
                                                    position={[userLocation.lat, userLocation.lng]} 
                                                    icon={userIcon}
                                                    onDragEnd={handleMarkerDragEnd}
                                                />
                                            )}

                                            {filteredClinics.map(clinic => {
                                                if (!clinic.geoLocation) return null;
                                                const waitInfo = getClinicWaitStats(clinic);
                                                const icon = createCustomIcon(waitInfo.mapColor, waitInfo.raw);
                                                
                                                return (
                                                    <Marker 
                                                        key={clinic.id} 
                                                        position={[clinic.geoLocation.lat, clinic.geoLocation.lng]}
                                                        icon={icon}
                                                        eventHandlers={{
                                                            click: () => scrollToClinic(clinic.id),
                                                        }}
                                                    >
                                                        <Tooltip direction="top" offset={[0, -36]} opacity={1}>
                                                            <div className="text-center">
                                                                <div className="font-bold text-sm">{clinic.name}</div>
                                                                <div className={`text-xs font-bold ${waitInfo.color.replace('bg-', 'text-').replace('text-', 'text-')}`}>{waitInfo.raw}m Wait</div>
                                                            </div>
                                                        </Tooltip>
                                                        <Popup className="custom-popup">
                                                            <div className="p-1 min-w-[180px]">
                                                                <h3 className="font-bold text-sm mb-1">{clinic.name}</h3>
                                                                <p className="text-xs text-slate-500 mb-2">{clinic.address}</p>
                                                                <div className="flex justify-between items-center">
                                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${waitInfo.mapColor}`}>{waitInfo.raw}m Wait</span>
                                                                    <button 
                                                                        onClick={() => { setSelectedClinicId(clinic.id); setBookingView('CLINIC_DETAILS'); }}
                                                                        className="text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold hover:bg-slate-700"
                                                                    >
                                                                        Book
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                );
                                            })}
                                        </MapContainer>
                                        
                                        {/* Floating Locate Button on Map */}
                                        <button 
                                            onClick={handleLocateMe}
                                            className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-700 active:scale-95 transition-transform"
                                            title="My Location"
                                        >
                                            {isLocating ? <span className="animate-spin block h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></span> : <Crosshair className="h-5 w-5" />}
                                        </button>

                                        {/* Map Legend */}
                                        <div className="absolute bottom-24 md:bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md text-[10px] space-y-1 z-[400]">
                                            <div className="font-bold mb-1">Live Wait Time</div>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Fast (0-20m)</div>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderate (20-45m)</div>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Busy (45m+)</div>
                                        </div>

                                        {/* Pin Mode Indicator */}
                                        {isPickingLocation && (
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2 cursor-pointer" onClick={() => setIsPickingLocation(false)}>
                                                <MapPin className="h-4 w-4 animate-bounce" />
                                                <span className="font-bold text-sm">Tap map to place pin</span>
                                                <X className="h-4 w-4 ml-2 opacity-80" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {bookingView === 'CLINIC_DETAILS' && selectedClinic && (
                            <div className="animate-in slide-in-from-right duration-300 bg-white min-h-full md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 md:overflow-hidden md:max-w-5xl md:mx-auto pt-4 md:pt-0">
                                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => { setBookingView('LIST'); setSelectedClinicId(null); }} className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></Button><h2 className="font-bold text-slate-900 truncate text-lg">{selectedClinic.name}</h2></div>
                                <div className="p-4 md:p-8 pb-24 h-full overflow-y-auto custom-scrollbar">
                                    
                                    {/* Clinic Image Banner */}
                                    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6 relative shadow-sm group">
                                        {selectedClinic.imageUrl ? (
                                            <img src={selectedClinic.imageUrl} alt={selectedClinic.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                <Building2 className="h-16 w-16 text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                                             <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" /> 4.5
                                        </div>
                                    </div>

                                    <div className="mb-8 grid md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block ${isClinicOpen(selectedClinic.operatingHours) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isClinicOpen(selectedClinic.operatingHours) ? 'Open Now' : 'Closed'}
                                                    </span>
                                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedClinic.name}</h1>
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
                                                    {userLocation && selectedClinic.geoLocation 
                                                        ? `${calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng).toFixed(1)} km from your location`
                                                        : (
                                                            <button onClick={handleLocateMe} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                                                                <Crosshair className="h-3 w-3" /> Enable location to see distance
                                                            </button>
                                                        )
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {selectedClinic.about && (<div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider"><Info className="h-4 w-4 text-primary-600" /> About Clinic</h3><p className="text-sm text-slate-600 leading-relaxed">{selectedClinic.about}</p></div>)}
                                            {selectedClinic.amenities && selectedClinic.amenities.length > 0 && (<div><h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Facilities</h3><div className="flex flex-wrap gap-2">{selectedClinic.amenities.map(item => (<span key={item} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> {item}</span>))}</div></div>)}
                                            {selectedClinic.acceptedInsurances && selectedClinic.acceptedInsurances.length > 0 && (<div><h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><ShieldCheck className="h-4 w-4 text-blue-600" /> Insurance Accepted</h3><div className="flex flex-wrap gap-2">{selectedClinic.acceptedInsurances.map(ins => (<span key={ins} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-800 shadow-sm">{ins}</span>))}</div></div>)}
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
                                                                            <div className="flex items-center gap-3"><h4 className="font-bold text-slate-900 text-lg truncate">Dr. {doc.name}</h4></div>
                                                                            <div className="mt-1 text-sm text-slate-700 truncate">{doc.specialty}</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 ml-2 sm:ml-0"><div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700"><Star className="h-4 w-4 fill-current text-yellow-500" /> {doc.rating ?? '4.5'}</div></div>
                                                                    </div>
                                                                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {(doc as any).yearsExperience ?? '10'} yrs</div>
                                                                        <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> {(doc as any).languages?.join(', ') || 'Eng, Hindi'}</div>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${waitColor}`}>
                                                                            <Timer className="h-3 w-3" /> {waitDetails.time}m Wait ({waitDetails.count} Pts)
                                                                        </span>
                                                                    </div>
                                                                    {linked.length > 0 && ( <div className="mt-2 text-xs text-slate-500"> <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Also practices at:</span> <div className="flex flex-wrap gap-1 mt-1"> {linked.map(lc => ( <span key={lc.id} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 cursor-default" title={`Switch clinic to view details`}>{lc.name}</span> ))} </div> </div> )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                                <div className="flex flex-col text-xs text-slate-500">
                                                                    <div className="uppercase font-bold text-[10px] tracking-wide text-slate-400">Availability & Fees</div>
                                                                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">{getDoctorTodaySchedule(doc)}<span className="text-xs text-slate-400">·</span><span className="font-bold text-sm text-slate-900">₹{doc.consultationFee}</span></div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {/* PRE-SELECT BUTTONS FOR DOCTOR SPECIFIC */}
                                                                    <Button 
                                                                        onClick={() => { setSelectedDoctorId(doc.id); setVisitType('WALK_IN'); setBookingView('FORM'); }} 
                                                                        disabled={!canBook || !activeNow} 
                                                                        size="sm" 
                                                                        variant="ghost"
                                                                        className={`h-9 px-3 text-xs ${!activeNow ? 'opacity-50' : 'text-slate-700'}`}
                                                                        title="Join Queue directly"
                                                                    >
                                                                        Queue
                                                                    </Button>
                                                                    <Button 
                                                                        onClick={() => { setSelectedDoctorId(doc.id); setVisitType('APPOINTMENT'); setBookingView('FORM'); }} 
                                                                        disabled={!canBook} 
                                                                        size="sm" 
                                                                        className={`h-9 px-4 ${canBook ? 'shadow-md' : 'opacity-60 cursor-not-allowed'}`}
                                                                    >
                                                                        Book
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
                             <div className="animate-in slide-in-from-right duration-300 bg-slate-50 min-h-full flex flex-col md:items-center md:justify-center md:py-8 pt-4 md:pt-0">
                                 <div className="w-full max-w-2xl bg-white md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 overflow-hidden flex flex-col max-h-full h-full md:h-auto">
                                    <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 shadow-sm flex-shrink-0"><Button variant="ghost" size="sm" className="p-0 rounded-full w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100" onClick={() => setBookingView('CLINIC_DETAILS')}><ArrowLeft className="h-4 w-4" /></Button><h2 className="font-bold text-slate-900 text-lg">Confirm Booking</h2></div>
                                    <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-24 md:pb-6 custom-scrollbar">
                                        {isGuest ? (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-4"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User className="h-5 w-5" /></div><div><h3 className="font-bold text-slate-900">Guest Details</h3><p className="text-xs text-slate-500">Enter details to book instantly.</p></div></div>
                                                <div className="space-y-3"><Input label="Patient Name" placeholder="e.g. Rahul Verma" value={guestName} onChange={e => setGuestName(e.target.value)} required /><div className="grid grid-cols-2 gap-4"><Input label="Age" type="number" placeholder="25" value={guestAge} onChange={e => setGuestAge(e.target.value)} required /><div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={guestGender} onChange={e => setGuestGender(e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div></div></div>
                                                <div className="mt-3 text-xs text-blue-800 flex items-center gap-1"><Info className="h-3 w-3" /> We will verify your mobile number next.</div>
                                            </div>
                                        ) : (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Who is this for?</label><div className="flex gap-3 overflow-x-auto no-scrollbar pb-2"><button onClick={() => setBookingFor('MYSELF')} className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === 'MYSELF' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}><User className={`h-6 w-6 ${bookingFor === 'MYSELF' ? 'text-primary-600' : 'text-slate-400'}`} /><span className="text-xs font-bold">Myself</span></button>{userProfile?.familyMembers?.map((m, idx) => (<button key={idx} onClick={() => setBookingFor(m.name)} className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border-2 transition-all ${bookingFor === m.name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}><Users className={`h-6 w-6 ${bookingFor === m.name ? 'text-primary-600' : 'text-slate-400'}`} /><span className="text-xs font-bold truncate max-w-[60px]">{m.name}</span></button>))}<button onClick={() => { setEditingMemberIndex(null); setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setIsCustomRelation(false); setShowAddMember(true); }} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[80px] p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-primary-600 hover:border-primary-400 hover:bg-slate-50 transition-colors"><Plus className="h-6 w-6" /><span className="text-xs font-bold">Add New</span></button></div></div>
                                        )}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Visit Type</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left relative overflow-hidden flex flex-col justify-between min-h-[100px] ${!isWalkInAllowed ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : visitType === 'WALK_IN' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`} 
                                                    onClick={() => isWalkInAllowed && setVisitType('WALK_IN')} 
                                                    disabled={!isWalkInAllowed}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Wait in Queue</span>
                                                        {!isWalkInAllowed && <Lock className="h-3 w-3" />}
                                                    </div>
                                                    
                                                    {isWalkInAllowed ? (
                                                        <div>
                                                            <div className="text-2xl font-black leading-none mb-1">~{waitStats.time}<span className="text-sm font-medium ml-0.5">min</span></div>
                                                            <div className="text-[10px] font-medium opacity-80">{waitStats.count} People Ahead</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-normal opacity-70">Shift Over</span>
                                                    )}
                                                    
                                                    {visitType === 'WALK_IN' && isWalkInAllowed && <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>}
                                                </button>
                                                
                                                <button 
                                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left flex flex-col justify-between min-h-[100px] ${visitType === 'APPOINTMENT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`} 
                                                    onClick={() => setVisitType('APPOINTMENT')}
                                                >
                                                    <span>Book Slot</span>
                                                    <div className="mt-auto">
                                                        <Calendar className="h-5 w-5 mb-1 opacity-50" />
                                                        <span className="block text-[10px] font-normal opacity-70">Schedule for Later</span>
                                                    </div>
                                                </button>
                                            </div>
                                            {!isWalkInAllowed && (<div className="mt-3 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg"><Info className="h-4 w-4 flex-shrink-0" /><span>Doctor is not available for walk-ins right now. Please book an appointment slot.</span></div>)}
                                        </div>
                                        {visitType === 'APPOINTMENT' && (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                                                <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-3">Select Date</label><div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">{bookingDates.map((d, idx) => (<button key={idx} disabled={d.isOff} onClick={() => { setApptDate(d.dateStr); setApptTime(''); }} className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${d.dateStr === apptDate ? 'border-primary-500 bg-primary-50 text-primary-700' : d.isOff ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'}`}><span className="text-[10px] font-bold uppercase mb-1">{d.dayShort}</span><span className="text-xl font-bold">{d.dayNum}</span>{d.isOff && <span className="text-[8px] font-bold mt-1 text-red-300">OFF</span>}</button>))}</div></div>
                                                <div>
                                                    <div className="flex justify-between items-end mb-3">
                                                        <label className="block text-sm font-bold text-slate-700">Select Time {apptDate ? '' : '(Pick a date first)'}</label>
                                                        {apptDate && new Date().toISOString().split('T')[0] === apptDate && (
                                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                                                <Info className="h-3 w-3" /> Active shifts are Walk-in only
                                                            </span>
                                                        )}
                                                        {apptDate && new Date().toISOString().split('T')[0] !== apptDate && (
                                                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded max-w-[360px] block truncate">Date: {new Date(apptDate).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    
                                                    {hasAnySlots ? (
                                                        <div className="space-y-4">
                                                            {groupedTimeSlots.Morning.length > 0 && (
                                                                <div className="mb-2">
                                                                    <div className="flex items-center gap-2 mb-2 px-1">
                                                                        <Sun className="h-4 w-4 text-orange-400" />
                                                                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">Morning ({groupedTimeSlots.Morning.length})</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                                        {groupedTimeSlots.Morning.map(slot => (
                                                                            <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${apptTime === slot.value ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>{slot.label}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {groupedTimeSlots.Afternoon.length > 0 && (
                                                                <div className="mb-2">
                                                                     <div className="flex items-center gap-2 mb-2 px-1 pt-2 border-t border-dashed border-slate-100">
                                                                        <CloudSun className="h-4 w-4 text-yellow-500" />
                                                                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">Afternoon ({groupedTimeSlots.Afternoon.length})</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                                        {groupedTimeSlots.Afternoon.map(slot => (
                                                                            <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${apptTime === slot.value ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>{slot.label}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {groupedTimeSlots.Evening.length > 0 && (
                                                                <div className="mb-2">
                                                                     <div className="flex items-center gap-2 mb-2 px-1 pt-2 border-t border-dashed border-slate-100">
                                                                        <Moon className="h-4 w-4 text-indigo-400" />
                                                                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">Evening ({groupedTimeSlots.Evening.length})</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                                        {groupedTimeSlots.Evening.map(slot => (
                                                                            <button key={slot.value} onClick={() => setApptTime(slot.value)} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${apptTime === slot.value ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>{slot.label}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                            <p className="text-slate-400 text-sm">
                                                                {apptDate && new Date().toISOString().split('T')[0] === apptDate 
                                                                    ? "Online booking closed for active shifts. Please use Walk-in." 
                                                                    : "No available slots for this date."}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {visitType === 'WALK_IN' && (<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><label className="block text-sm font-medium text-slate-700 mb-2">Time to reach clinic?</label><select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={travelTime} onChange={(e) => setTravelTime(e.target.value)}><option value="5">5 mins</option><option value="15">15 mins</option><option value="30">30 mins</option><option value="45">45 mins</option><option value="60">1 Hour+</option></select></div>)}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><Input label="Reason for Visit (Symptoms)" placeholder="e.g. High fever, stomach ache" value={symptoms} onChange={e => setSymptoms(e.target.value)} /></div>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Patient</span><span className="font-bold text-slate-900">{isGuest ? (guestName || 'Guest User') : (bookingFor === 'MYSELF' ? userProfile?.name : bookingFor)}</span></div><div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Doctor</span><span className="font-bold text-slate-900">{selectedClinic.doctors.find(d => d.id === selectedDoctorId)?.name}</span></div><div className="flex justify-between text-sm pt-2 border-t border-blue-200"><span className="text-slate-600 font-medium">Consultation Fee</span><span className="font-bold text-primary-700">₹{selectedClinic.doctors.find(d => d.id === selectedDoctorId)?.consultationFee}</span></div></div>
                                    </div>
                                    <div className="p-4 md:p-6 bg-white border-t border-slate-200 flex-shrink-0 sticky bottom-0 z-10">
                                        <Button type="button" className="w-full h-12 text-lg shadow-xl shadow-primary-100" onClick={() => handleBookToken()}>{isGuest ? 'Verify Mobile & Confirm' : 'Confirm Booking'}</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'HISTORY' && (
                    isGuest ? <GuestLoginCard /> : (
                    <div className="px-4 md:px-0 max-w-7xl mx-auto pt-4 md:pt-8 md:px-8">
                         {historyVisits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 md:pt-0">
                                {historyVisits.map(visit => (<Card key={visit.id} className={`p-5 shadow-sm border hover:shadow-md transition-shadow ${visit.status === PatientStatus.CANCELLED ? 'border-red-100 bg-red-50/30' : 'border-slate-200 bg-white'}`}><div className="flex justify-between items-start mb-2"><div><div className="text-xs text-slate-500 mb-1">{new Date(visit.timeAdded).toLocaleDateString()} at {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div><h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3><p className="text-sm text-slate-500">Dr. {visit.doctorName}</p></div><Badge status={visit.status} /></div><div className="text-xs text-slate-600 mb-2 font-bold flex items-center gap-1"><User className="h-3 w-3" /> {visit.name}</div><div className="mt-3 pt-3 border-t border-slate-100">{visit.symptoms && <div className="mb-2 text-sm text-slate-600"><span className="font-semibold">Reason:</span> {visit.symptoms}</div>}{visit.status === PatientStatus.COMPLETED && visit.notes && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 italic"><span className="block text-xs font-bold text-slate-400 uppercase mb-1">Doctor's Note</span>"{visit.notes}"</div>)}{visit.status === PatientStatus.CANCELLED && (<div className="bg-white p-3 rounded-lg border border-red-100 text-sm text-red-600 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5" /><span>Appointment cancelled. Please re-book if symptoms persist.</span></div>)}</div></Card>))}
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-50"><History className="h-16 w-16 mx-auto mb-4 text-slate-300" /><h3 className="text-lg font-bold text-slate-700">No History Found</h3><p className="text-slate-500">Your past appointments will appear here.</p></div>
                        )}
                    </div>
                    )
                )}
                
                {activeTab === 'PROFILE' && (
                    isGuest ? <GuestLoginCard /> : (userProfile && (
                    <div className="px-4 md:px-0 max-w-4xl mx-auto pt-4 md:pt-8 md:px-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg md:col-span-1 h-fit"><div className="flex flex-col items-center text-center mb-6"><div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner"><User className="h-12 w-12" /></div><h2 className="text-2xl font-bold text-slate-900">{userProfile.name}</h2><p className="text-slate-500 font-medium">{userProfile.phone}</p></div><div className="flex justify-center gap-3 text-sm font-medium text-slate-600"><span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{userProfile.age || '--'} Yrs</span><span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{userProfile.gender || '--'}</span></div></div>
                            <div className="md:col-span-2"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-primary-600" /> Family Members</h3><Button size="sm" onClick={() => { setEditingMemberIndex(null); setNewMember({ name: '', age: '', gender: 'Male', relation: '' }); setIsCustomRelation(false); setShowAddMember(true); }}><Plus className="h-4 w-4 mr-2" /> Add Member</Button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{userProfile.familyMembers?.map((member, idx) => (<div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mr-2 flex-shrink-0"><Users className="h-5 w-5" /></div><div><div className="font-bold text-slate-900">{member.name}</div><div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">{member.relation} • {member.age} Yrs</div></div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditMember(idx)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDeleteMember(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button></div></div>))}{(!userProfile.familyMembers || userProfile.familyMembers.length === 0) && (<div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"><p className="text-slate-400 mb-2">No family members added yet.</p><p className="text-xs text-slate-400">Add family to book appointments for them easily.</p></div>)}</div></div>
                        </div>
                        {/* New Logout Button for Mobile (Bottom of Profile) */}
                        <div className="mt-8 md:hidden mb-12">
                            <Button variant="secondary" onClick={onBack} className="w-full text-red-600 border-red-200 hover:bg-red-50 justify-center h-12 text-lg font-bold shadow-sm">
                                <LogOut className="h-5 w-5 mr-2" /> Logout
                            </Button>
                        </div>
                    </div>
                    ))
                )}
            </div>

            <nav className="md:hidden bg-white border-t border-slate-200 flex justify-around py-2 px-1 pb-safe fixed bottom-0 w-full z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">{navItems.map(item => (<button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}><div className={`p-1 rounded-full ${activeTab === item.id ? 'bg-primary-50' : ''}`}><item.icon className={`h-5 w-5 ${activeTab === item.id ? 'fill-primary-100' : ''}`} /></div><span className="text-[10px] font-bold">{item.label}</span></button>))}</nav>
            {showQRScanner && (<div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in"><div className="w-64 h-64 border-2 border-primary-500 rounded-2xl relative mb-8 flex items-center justify-center overflow-hidden"><div className="absolute inset-0 bg-primary-500/20 animate-pulse"></div><div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_20px_rgba(14,165,233,1)] animate-[scan_2s_ease-in-out_infinite]"></div><p className="text-white font-bold z-10">Scanning...</p></div><p className="text-slate-400 text-center mb-8">Point at clinic QR code.</p><Button variant="secondary" onClick={() => setShowQRScanner(false)}>Cancel</Button></div>)}
            {cancelModal.isOpen && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95"><div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Appointment?</h3><p className="text-sm text-slate-500 mb-6">Are you sure you want to cancel your visit with <span className="font-bold text-slate-900">{cancelModal.visit?.doctorName}</span>? This action cannot be undone.</p><div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setCancelModal({ isOpen: false, visit: null })}>No, Keep It</Button><Button className="bg-red-600 hover:bg-red-700 border-red-600" onClick={confirmCancel}>Yes, Cancel</Button></div></div></div>)}
            {showAddMember && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4">{editingMemberIndex !== null ? 'Edit Member' : 'Add Family Member'}</h3>
                        <div className="space-y-4">
                            <Input label="Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="e.g. Priya" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Age" type="number" value={newMember.age} onChange={e => setNewMember({...newMember, age: e.target.value})} placeholder="25" />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={newMember.gender} onChange={e => setNewMember({...newMember, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select>
                                </div>
                            </div>
                            
                            {/* Updated Relationship Selector with Other */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                                <select 
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={isCustomRelation ? 'Other' : newMember.relation}
                                    onChange={(e) => {
                                        if (e.target.value === 'Other') {
                                            setIsCustomRelation(true);
                                            setNewMember({ ...newMember, relation: '' }); 
                                        } else {
                                            setIsCustomRelation(false);
                                            setNewMember({ ...newMember, relation: e.target.value });
                                        }
                                    }}
                                >
                                    <option value="" disabled>Select Relationship</option>
                                    {RELATIONSHIP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    <option value="Other">Other (Type Custom)</option>
                                </select>
                                
                                {isCustomRelation && (
                                    <Input 
                                        placeholder="Enter specific relationship (e.g. Uncle)" 
                                        value={newMember.relation} 
                                        onChange={e => setNewMember({...newMember, relation: e.target.value})} 
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
                                <Button onClick={handleAddMember}>Save</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Late Arrival Warning Modal */}
            {showLateWarningModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                        <div className="bg-amber-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Late Arrival Warning</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            The current wait time is shorter than your travel time ({travelTime} mins). You might be skipped or placed ON HOLD when you arrive.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="secondary" onClick={() => setShowLateWarningModal(false)}>Cancel</Button>
                            <Button className="bg-amber-600 hover:bg-amber-700 border-amber-600" onClick={() => submitBooking()}>Proceed Anyway</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal for Guests */}
            <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                initialName={guestName}
                initialAge={guestAge}
                initialGender={guestGender}
                addToast={addToast}
            />
        </main>
    </div>
  );
};
    
    function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
      return (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12" />
          <path d="M6 8h12" />
          <path d="m6 13 8.5 10" />
          <path d="M6 13h3" />
          <path d="M9 13c6.667 0 6.667-10 0-10" />
        </svg>
      )
    }
