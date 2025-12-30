
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useMatch, useLocation, useSearchParams } from 'react-router-dom';
import { Clinic, Patient, PatientStatus, DoctorStatus, Doctor, ClinicOperationMode, Review, TimeSlot, FamilyMember, UserProfile, GroupedSlots } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';
import { MapPanel } from '../features/patient/components/MapPanel';
import { Filter } from '../features/patient/components/Filter';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import L from 'leaflet';
import {
    ArrowLeft, MapPin, Search, QrCode,
    AlertTriangle, Star, Clock, Stethoscope,
    Navigation, Timer, Building2,
    Info, Lock, History, X,
    User, Users, Plus, LogOut, Coffee, LogIn, Menu,
    ChevronRight, ChevronLeft, Home, LocateFixed,
    Map as MapIcon, ChevronDown,
    CalendarClock,
    Zap,
    Edit2,
    List
} from 'lucide-react';
import { createDoctorSlug } from '../utils/slugs';
import { calculateDistance, reverseGeocode } from '../utils/geolocation';
import { isClinicOpen, getClinicCurrentTime, getLocalToday, formatTime12h, getDoctorTodayShifts } from '../utils/time';
import { CATEGORIES, RELATIONSHIP_OPTIONS, SYMPTOM_MAP, INITIAL_USER_PROFILE } from '../constants';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { GuestLoginCard } from '../features/patient/components/GuestLoginCard';
import { ActiveVisitsView } from '../features/patient/views/ActiveVisitsView';
import { HistoryVisitsView } from '../features/patient/views/HistoryVisitsView';
import { ProfileView } from '../features/patient/views/ProfileView';
import { ClinicListView } from '../features/patient/views/booking/ClinicListView';
import { DoctorListView } from '../features/patient/views/booking/DoctorListView';
import { ClinicDetailView } from '../features/patient/views/booking/ClinicDetailView';
import { DoctorProfileView } from '../features/patient/views/booking/DoctorProfileView';
import { BookingFormView } from '../features/patient/views/booking/BookingFormView';
import { DoctorProfileModal } from '../features/patient/components/DoctorProfileModal';
import { StarRating } from '../components/StarRating';
import { Ticket } from '../components/icons';
import { SessionMode } from '../types';

interface PatientTrackerProps {
    clinics: Clinic[];
    userPhone: string;
    userName: string;
    isGuest: boolean;
    onLoginClick?: (phone?: string, name?: string) => void;
    onBack: () => void;
    onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, visitType: 'WALK_IN' | 'APPOINTMENT', time?: string, date?: string, age?: string, gender?: any, symptoms?: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onUpdateDetails: (clinicId: string, id: string, updates: Partial<Patient>) => void;
    onCancelVisit: (clinicId: string, patientId: string) => void;
    onCheckIn: (clinicId: string, patientId: string) => void;
    preSelectedClinicId?: string;
    onClearPendingAction: () => void;
    initialSearchMode?: 'DOCTOR' | 'CLINIC';
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
    clinics, userPhone, userName, isGuest, onLoginClick, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit, onCheckIn, preSelectedClinicId, onClearPendingAction, initialSearchMode
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const searchBarContainerRef = useRef<HTMLDivElement>(null);

    const quickSearches = [
        { term: 'Fever', emoji: '🤒' },
        { term: 'Cold & Cough', emoji: '🤧' },
        { term: 'Tooth Pain', emoji: '🦷' },
        { term: 'Child Doctor', emoji: '👶' },
        { term: 'Heart Specialist', emoji: '❤️' }
    ];

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
        
        const allInstances = clinics.flatMap(c => c.doctors.filter(d => d.masterId === matchDoctor?.params.doctorId));
        if (allInstances.length === 0) return undefined;
    
        const profile = { ...allInstances[0] };
        const allReviews = allInstances.flatMap(d => d.reviews || []);
        profile.reviews = allReviews;
    
        return profile;
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

    const isSymptomSearch = useMemo(() => {
        if (!searchQuery.trim()) return false;
        const q = searchQuery.toLowerCase();
        const searchWords = q.split(/\s+/);
        return Object.keys(SYMPTOM_MAP).some(key =>
            searchWords.some(word => key.toLowerCase().includes(word))
        );
    }, [searchQuery]);

    // Auto-populate symptoms field when searching for symptoms
    useEffect(() => {
        if (isSymptomSearch && searchQuery.trim()) {
            setSymptoms(searchQuery.trim());
        }
    }, [isSymptomSearch, searchQuery]);

    const [symptoms, setSymptoms] = useState('');
    const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
    const [apptDate, setApptDate] = useState('');
    const [apptTime, setApptTime] = useState('');
    const [travelTime, setTravelTime] = useState('0'); // Default set to 0 mins
    const [bookingFor, setBookingFor] = useState<'MYSELF' | string>('MYSELF');
    const [selectedWalkInShiftId, setSelectedWalkInShiftId] = useState<string | null>(null);

    // Initialize showMap based on screen width
    const [showMap, setShowMap] = useState(window.innerWidth >= 768);
    
    const clinicCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [highlightedClinicId, setHighlightedClinicId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pinnedAddress, setPinnedAddress] = useState<string | null>('Locate Me');
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
        setIsMobileMenuOpen(false);
        if (newTab === 'ACTIVE') navigate('/patient/visits');
        else if (newTab === 'HISTORY') navigate('/patient/history');
        else if (newTab === 'PROFILE') navigate('/patient/profile');
        else navigate('/patient/find');
    };

    const globalSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return null;
        const q = searchQuery.toLowerCase();

        // Check for symptom matches - check if any word from search query appears in symptom keys
        const searchWords = q.toLowerCase().split(/\s+/);
        const matchedSpecialties = Object.keys(SYMPTOM_MAP)
            .filter(key => searchWords.some(word => key.toLowerCase().includes(word)))
            .map(key => SYMPTOM_MAP[key]);

        const matchedClinics = clinics.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.doctors.some(d =>
                d.specialty.toLowerCase().includes(q) ||
                d.name.toLowerCase().includes(q) ||
                (matchedSpecialties.length > 0 && matchedSpecialties.includes(d.specialty))
            )
        ).slice(0, 4);

        const matchedDoctors: { clinic: Clinic, doctor: Doctor }[] = [];

        clinics.forEach(c => {
            c.doctors.forEach(d => {
                const specialtyFromSymptomMatch = matchedSpecialties.length > 0 && matchedSpecialties.includes(d.specialty);
                const nameMatch = d.name.toLowerCase().includes(q);
                const specialtyNameMatch = d.specialty.toLowerCase().includes(q);

                if (specialtyFromSymptomMatch || nameMatch || specialtyNameMatch) {
                    if (matchedDoctors.length < 5) matchedDoctors.push({ clinic: c, doctor: d });
                }
            });
        });

        return { clinics: matchedClinics, doctors: matchedDoctors };
    }, [searchQuery, clinics]);

    const handleSuggestionClick = (type: 'CLINIC' | 'DOCTOR', item: any) => {
        setShowSuggestions(false);
        const wasSymptomSearch = isSymptomSearch;
        setSearchQuery('');
        // Clear symptoms only if this wasn't a symptom search
        if (!wasSymptomSearch) {
            setSymptoms('');
        }
        if (type === 'CLINIC') {
            navigateToView('CLINIC_DETAILS', item);
        } else {
            navigateToView(null, item.clinic, item.doctor);
        }
    };

    const handleQuickSearch = (term: string) => {
        // For terms with symptom mappings, use symptom search
        if (term === 'Fever' || term === 'Cold & Cough' || term === 'Tooth Pain' || term === 'Child Doctor') {
            setSearchQuery(term);
            setSelectedCategory('ALL'); // Don't filter by category for symptom searches
        } else if (term === 'Heart Specialist') {
            // For terms without symptom mappings, use specialty search
            setSearchQuery('Cardiologist');
            setSelectedCategory('ALL');
        }

        setSearchMode('DOCTOR');
        setShowSuggestions(true); // Show suggestions dropdown
        setSelectedSpecialty('All Specialties'); // Reset specialty to avoid conflicts
    };

    const travelEstimate = useMemo(() => {
        if (userLocation && selectedClinic?.geoLocation) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng);
            // Only show travel estimate if distance is significant
            if (dist < 0.2) return { dist: dist.toFixed(2), mins: 0 };
            const mins = Math.ceil(dist * 2);
            return { dist: dist.toFixed(1), mins };
        }
        return null;
    }, [userLocation, selectedClinic]);

    useEffect(() => {
        if (travelEstimate) {
            const mins = travelEstimate.mins;
            if (mins <= 2) setTravelTime('0');
            else if (mins <= 10) setTravelTime('5');
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
            if (saved) {
                setUserProfile(JSON.parse(saved));
            } else {
                if (userPhone === INITIAL_USER_PROFILE.phone) {
                    setUserProfile(INITIAL_USER_PROFILE);
                    localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(INITIAL_USER_PROFILE));
                } else {
                    const defaultProfile = { name: userName, phone: userPhone, age: '', gender: '', familyMembers: [] };
                    setUserProfile(defaultProfile);
                    localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(defaultProfile));
                }
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

    const activeVisits = useMemo(() => { 
        if (isGuest) return []; 
        const visits: any[] = []; 
        clinics.forEach(c => { 
            c.patients.forEach(p => { 
                if (p.phone === userPhone && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED) { 
                    const doc = c.doctors.find(d => d.id === p.doctorId); 
                    visits.push({ 
                        ...p, 
                        clinicName: c.name, 
                        clinicId: c.id, 
                        doctorName: doc?.name || 'Unknown', 
                        room: doc?.roomNumber || '-',
                        clinicGeo: c.geoLocation // Pass clinic location for distance calc
                    }); 
                } 
            }); 
        }); 
        return visits.sort((a, b) => b.timeAdded - a.timeAdded); 
    }, [clinics, userPhone, isGuest]);

    const historyVisits = useMemo(() => { if (isGuest) return []; const visits: any[] = []; clinics.forEach(c => { c.patients.forEach(p => { if (p.phone === userPhone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED)) { const doc = c.doctors.find(d => d.id === p.doctorId); visits.push({ ...p, clinicName: c.name, clinicId: c.id, doctorName: doc?.name || 'Unknown', notes: p.notes }); } }); }); return visits.sort((a, b) => b.timeAdded - a.timeAdded); }, [clinics, userPhone, isGuest]);

    const unratedCompletedVisit = useMemo(() => {
        return historyVisits.find(v => v.status === PatientStatus.COMPLETED && !v.rating);
    }, [historyVisits]);

    // COMBINED RELEVANT DOCTORS HELPER (used for list and card display)
    const getRelevantDoctors = (clinic: Clinic) => {
        let relevant = clinic.doctors;

        // Filter by Search Query (if applicable to doctor name or specialty)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
    
            // New logic: Check for symptom mapping - check if any word from search query appears in symptom keys
            const searchWords = q.toLowerCase().split(/\s+/);
            const matchedSpecialties = Object.keys(SYMPTOM_MAP)
                .filter(key => searchWords.some(word => key.toLowerCase().includes(word)))
                .map(key => SYMPTOM_MAP[key]);
    
            relevant = relevant.filter(d => {
                const specialtyFromSymptomMatch = matchedSpecialties.length > 0 && matchedSpecialties.includes(d.specialty);
                const nameMatch = d.name.toLowerCase().includes(q);
                const specialtyNameMatch = d.specialty.toLowerCase().includes(q);
                return specialtyFromSymptomMatch || nameMatch || specialtyNameMatch;
            });
        }

        // Filter by Specialty
        if (selectedSpecialty !== 'All Specialties') {
            relevant = relevant.filter(d => d.specialty === selectedSpecialty);
        } else if (selectedCategory !== 'ALL') {
            const cat = selectedCategory.toLowerCase();
            relevant = relevant.filter(d => {
                const spec = d.specialty.toLowerCase();
                if (cat === 'general') return spec.includes('physician');
                if (cat === 'pediatric') return spec.includes('pedia');
                if (cat === 'dental') return spec.includes('dent');
                if (cat === 'ophthalmology') return spec.includes('ophthalm');
                if (cat === 'orthopedic') return spec.includes('ortho');
                if (cat === 'gynecology') return spec.includes('gyne');
                if (cat === 'cardiology') return spec.includes('cardio');
                if (cat === 'dermatology') return spec.includes('derma');
                if (cat === 'ent') return spec.includes('ent');
                if (cat === 'surgery') return spec.includes('surgeon');
                return false;
            });
        }

        // Filter by Gender
        if (selectedDoctorGender !== 'ALL') {
            relevant = relevant.filter(d => d.gender === selectedDoctorGender);
        }

        // Filter by Experience (User's specific request)
        if (selectedMinExperience > 0) {
            relevant = relevant.filter(d => (d.experience || 0) >= selectedMinExperience);
        }

        return relevant;
    };

    const filteredClinics = useMemo(() => {
        let filtered = clinics;

        // 1. Clinic-Level Text Search (City or Name)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            
            // Check for symptom matches - check if any word from search query appears in symptom keys
            const searchWords = q.toLowerCase().split(/\s+/);
            const matchedSpecialties = Object.keys(SYMPTOM_MAP)
                .filter(key => searchWords.some(word => key.toLowerCase().includes(word)))
                .map(key => SYMPTOM_MAP[key]);

            // Match if clinic name, city, or any of its doctors match
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.city.toLowerCase().includes(q) ||
                c.doctors.some(d => 
                    d.specialty.toLowerCase().includes(q) || 
                    d.name.toLowerCase().includes(q) ||
                    (matchedSpecialties.length > 0 && matchedSpecialties.includes(d.specialty))
                )
            );
        }

        // 2. City Filter
        if (selectedCity !== 'All Cities') {
            filtered = filtered.filter(c => c.city === selectedCity);
        }

        // 3. Open Status Filter
        if (showOpenOnly) {
            filtered = filtered.filter(c => isClinicOpen(c.operatingHours, c.timezone));
        }

        // 4. Combined Doctor Filters (SPECIALTY + GENDER + EXPERIENCE)
        // Hide clinic if NO doctor matches the combination of active filters
        filtered = filtered.filter(c => {
            const matchingDoctors = getRelevantDoctors(c);
            return matchingDoctors.length > 0;
        });

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

        // Load = Patients in this shift (today's appointments + walk-ins mapped to this shift)
        const shiftPatients = clinicPatients.filter(p => {
            if (p.doctorId !== doctor.id) return false;
            if (p.status === PatientStatus.CANCELLED) return false;

            // Count any patient scheduled into this shift by appointmentDate/Time (works for both Appointment and Advance Walk-in bookings)
            if (p.appointmentDate === dateStr && p.appointmentTime) {
                const [ph, pm] = p.appointmentTime.split(':').map(Number);
                const pTotalMins = ph * 60 + pm;
                if (pTotalMins >= startTotal && pTotalMins < endTotal) return true;
            }

            // Fallback: same-day live walk-ins without appointmentTime, bucket by timeAdded
            const pDate = new Date(p.timeAdded);
            const pDateStr = pDate.toISOString().split('T')[0];
            if (!p.appointmentTime && pDateStr === dateStr) {
                const pTotal = pDate.getHours() * 60 + pDate.getMinutes();
                if (pTotal >= startTotal && pTotal < endTotal) return true;
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
                const matchedSpecialties = Object.keys(SYMPTOM_MAP)
                    .filter(key => key.toLowerCase().includes(q))
                    .map(key => SYMPTOM_MAP[key]);

                const specialtyFromSymptomMatch = matchedSpecialties.length > 0 && matchedSpecialties.includes(doc.specialty);
                const matchesName = doc.name.toLowerCase().includes(q);
                const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
                const matchesClinic = clinic.name.toLowerCase().includes(q);
                const matchesCity = clinic.city.toLowerCase().includes(q);

                if (!specialtyFromSymptomMatch && !matchesName && !matchesSpecialty && !matchesClinic && !matchesCity) return false;
            }

            if (selectedCity !== 'All Cities' && clinic.city !== selectedCity) return false;
            if (selectedSpecialty !== 'All Specialties' && doc.specialty !== selectedSpecialty) return false;

            if (selectedCategory !== 'ALL') {
                const cat = selectedCategory.toLowerCase();
                const spec = doc.specialty.toLowerCase();
                if (cat === 'dental' && !spec.includes('dent')) return false;
                if (cat === 'pediatric' && !spec.includes('pedia')) return false;
                if (cat === 'gynecology' && !(spec.includes('gyne') || spec.includes('women'))) return false;
                if (cat === 'orthopedic' && !(spec.includes('ortho') || spec.includes('bone'))) return false;
                if (cat === 'dermatology' && !(spec.includes('derma') || spec.includes('skin'))) return false;
                if (cat === 'ophthalmology' && !(spec.includes('ophthalm') || spec.includes('eye'))) return false;
                if (cat === 'ent' && !(spec.includes('ent') || spec.includes('ear'))) return false;
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

        // Important: Wait stats should reflect the matching doctors if filters are active
        let relevantDoctors = getRelevantDoctors(clinic);
        if (relevantDoctors.length === 0) {
            // Fallback if no relevant docs match filters, but clinic is open
            relevantDoctors = clinic.doctors;
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

    const getFeeRange = (clinic: Clinic) => {
        const relevant = getRelevantDoctors(clinic);
        if (!relevant.length) return 'N/A';
        const fees = relevant.map(d => d.consultationFee);
        const min = Math.min(...fees);
        const max = Math.max(...fees);
        return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
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
        // Calculate people ahead based on visit type
        let peopleAhead = 0;

        if (visit.visitType === 'APPOINTMENT' || (visit.visitType === 'WALK_IN' && visit.appointmentTime)) {
            // For advance bookings and appointments, count ALL previous bookings in the same time slot
            peopleAhead = clinic.patients.filter(p => {
                if (p.doctorId !== visit.doctorId || p.id === visit.id) return false;
                // For advance bookings, include all patients with appointments, not just active ones
                // Only exclude completed and cancelled
                if (p.status === PatientStatus.CANCELLED || p.status === PatientStatus.COMPLETED) return false;

                // Must have appointment details
                if (!p.appointmentDate || !p.appointmentTime) return false;

                // Same date
                if (p.appointmentDate !== visit.appointmentDate) return false;

                // Same shift
                const otherShift = getPatientShiftMins(p, doctor);
                if (!myShift || !otherShift || otherShift.startTime !== myShift.startTime) return false;

                // Earlier appointment time
                const [pH, pM] = p.appointmentTime.split(':').map(Number);
                const [myH, myM] = visit.appointmentTime.split(':').map(Number);
                const pTime = pH * 60 + pM;
                const myTime = myH * 60 + myM;

                return pTime < myTime;
            }).length;
        } else {
            // For live walk-ins, use the existing logic based on booking time
            peopleAhead = clinic.patients.filter(p => {
                if (p.doctorId !== visit.doctorId || p.id === visit.id) return false;
                // Exclude completed/cancelled patients
                if (p.status === PatientStatus.CANCELLED || p.status === PatientStatus.COMPLETED) return false;

                // Verify it's the same date
                const pDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
                const myDate = visit.visitType === 'APPOINTMENT' ? visit.appointmentDate : new Date(visit.timeAdded).toISOString().split('T')[0];
                if (pDate !== myDate) return false;

                // Same Shift Check
                const otherShift = getPatientShiftMins(p, doctor);
                if (!myShift || !otherShift || otherShift.startTime !== myShift.startTime) return false;

                // For live walk-ins, use booking time ordering
                return new Date(p.timeAdded).getTime() < new Date(visit.timeAdded).getTime();
            }).length;
        }

        const servingPatient = clinic.patients.find(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WITH_DOCTOR);
        const currentToken = servingPatient ? `#${servingPatient.tokenNumber}` : 'Not Started';

        // Determine if there's a specific scheduled time (ONLY for true Appointments)
        const hasScheduledTime = visit.visitType === 'APPOINTMENT' && visit.appointmentTime && visit.appointmentDate;
        // Strict check if the visit's appointment date is today for messaging
        const actualIsToday = visit.appointmentDate === getLocalToday(clinic.timezone);

        let expectedTime = '';
        let scheduledTime = '';
        let estimatedArrivalTime = '';

        if (hasScheduledTime) {
            // For appointments, always show the scheduled time
            scheduledTime = formatTime12h(visit.appointmentTime);

            const apptDate = new Date(visit.appointmentDate + 'T' + visit.appointmentTime);
            const nowTime = now.getTime();

            // Calculate current estimation
            let baseWait = peopleAhead * (doctor.consultationTime || 15);
            if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes;
            
            const currentEstDate = new Date(now.getTime() + baseWait * 60000);
            const currentEstTimeStr = formatTime12h(currentEstDate.getHours().toString().padStart(2, '0') + ':' + currentEstDate.getMinutes().toString().padStart(2, '0'));

            if (apptDate.getTime() > nowTime) {
                // Future scheduled time - calculate estimated arrival time based on appointment time + people ahead
                const baseApptTimeMs = apptDate.getTime();
                let estimatedArrivalMs = baseApptTimeMs;

                // Add time for people already ahead in this specific slot/shift before this patient
                estimatedArrivalMs += peopleAhead * (doctor.consultationTime || 15) * 60000;

                const estDate = new Date(estimatedArrivalMs);
                estimatedArrivalTime = formatTime12h(estDate.getHours().toString().padStart(2, '0') + ':' + estDate.getMinutes().toString().padStart(2, '0'));

                // For future appointments, show scheduled time as primary
                expectedTime = scheduledTime;
            } else {
                // Scheduled time has passed/is current - show estimation as EST
                expectedTime = scheduledTime;
                estimatedArrivalTime = currentEstTimeStr;
            }
        } else {
            // This block is for WALK_INs or Walk-ins with a shift marker
            let baseWait = peopleAhead * (doctor.consultationTime || 15);
            if (doctor.delayMinutes > 0) baseWait += doctor.delayMinutes;
            
            // For advance walk-ins, if the shift hasn't started yet, calculate from shift start
            const visitTimeStr = visit.appointmentTime || new Date(visit.timeAdded).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
            const visitDate = visit.appointmentDate || new Date(visit.timeAdded).toISOString().split('T')[0];
            const visitDateTime = new Date(visitDate + 'T' + visitTimeStr);
            
            if (visitDateTime.getTime() > now.getTime()) {
                 // Future shift
                 const estimatedArrivalMs = visitDateTime.getTime() + (peopleAhead * (doctor.consultationTime || 15) * 60000);
                 const estDate = new Date(estimatedArrivalMs);
                 expectedTime = formatTime12h(estDate.getHours().toString().padStart(2, '0') + ':' + estDate.getMinutes().toString().padStart(2, '0'));
            } else {
                 // Active shift
                 const estDate = new Date(now.getTime() + baseWait * 60000);
                 expectedTime = formatTime12h(estDate.getHours().toString().padStart(2, '0') + ':' + estDate.getMinutes().toString().padStart(2, '0'));
            }
        }

        let message = "";
        let color = 'text-slate-600';
        let bgColor = 'bg-slate-100';

        const bookedTime = new Date(visit.timeAdded).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        const bookedDate = new Date(visit.timeAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        if (!actualIsToday && hasScheduledTime) { // Check if it's a scheduled visit for a future date
            // Check if advance booking is disabled for this clinic
            const clinic = clinics.find(c => c.id === visit.clinicId);
            if (clinic?.enableAdvanceBooking === false) {
                message = "Advance booking not allowed";
                color = "text-red-700";
                bgColor = "bg-red-50";
            } else {
                message = "Upcoming appointment";
                color = "text-indigo-700";
                bgColor = "bg-indigo-50";
            }
        } else if (doctor.status === DoctorStatus.ON_BREAK) {
            message = "Doctor is on break";
            color = "text-orange-700";
            bgColor = "bg-orange-100";
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
            scheduledTime,
            estimatedArrivalTime,
            currentToken,
            message,
            color,
            bgColor,
            doctorStatus: doctor.status,
            bookedAt: `${bookedDate}, ${bookedTime}`,
            typeLabel: visit.visitType === 'APPOINTMENT' ? 'Appointment' : 'Live Walk-in'
        };
    };

    useEffect(() => { let timer: ReturnType<typeof setTimeout>; if (showQRScanner) { timer = setTimeout(() => { if (clinics.length > 0) { let targetClinicId = selectedClinicId; if (!targetClinicId) { const visitNeedsCheckIn = activeVisits.find(v => !v.isCheckedIn && v.status === PatientStatus.WAITING); targetClinicId = visitNeedsCheckIn ? visitNeedsCheckIn.clinicId : clinics[0].id; } const activeVisit = activeVisits.find(v => v.clinicId === targetClinicId && v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED); if (activeVisit) { if (!activeVisit.isCheckedIn) { onCheckIn(targetClinicId!, activeVisit.id); addToast(`Checked in at ${activeVisit.clinicName}!`, "success"); } else { addToast(`Already checked in at ${activeVisit.clinicName}.`, "info"); } navigate('/patient/visits'); } else { if (targetClinicId) { const targetClinic = clinics.find(c => c.id === targetClinicId); if (targetClinic) navigateToView('CLINIC_DETAILS', targetClinic); addToast("QR Detected. Loading clinic details...", "success"); } } setShowQRScanner(false); } }, 2000); } return () => clearTimeout(timer); }, [showQRScanner, clinics, activeVisits, selectedClinicId, onCheckIn, addToast, navigate]);

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

                // Determine if advance booking
                const currentMins = clinicNow.getHours() * 60 + clinicNow.getMinutes();
                const [sh, sm] = shift.startTime.split(':').map(Number);
                const startTotal = sh * 60 + sm;
                const isActive = currentMins >= startTotal;

                // Calculate effective load (including this new booking)
                const effectiveLoad = stats.load + 1;
                let estimatedWaitDuration = effectiveLoad * (selectedDoctor!.consultationTime || 15);

                if (isActive) {
                    // For active shift, add doctor's delay and estimate from now
                    estimatedWaitDuration += (selectedDoctor!.delayMinutes || 0);
                    const finalEstDate = new Date(clinicNow.getTime() + estimatedWaitDuration * 60000);
                    bookingTime = finalEstDate.getHours().toString().padStart(2, '0') + ':' + finalEstDate.getMinutes().toString().padStart(2, '0');
                } else {
                    // For advance shift, estimate from shift start
                    let baseFutureTime = new Date(clinicNow);
                    baseFutureTime.setHours(sh, sm, 0, 0);
                    const finalEstDate = new Date(baseFutureTime.getTime() + estimatedWaitDuration * 60000);
                    bookingTime = finalEstDate.getHours().toString().padStart(2, '0') + ':' + finalEstDate.getMinutes().toString().padStart(2, '0');
                }
            }
        }

        const clinicNow = getClinicCurrentTime(selectedClinic?.timezone);
        onGetToken(pName, pPhone, selectedDoctorId!, selectedClinicId!, visitType, bookingTime, visitType === 'APPOINTMENT' ? apptDate : getLocalToday(selectedClinic?.timezone), pAge, pGender, symptoms);

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
            // Late arrival warning only applies for LIVE shift context
            const chosenShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
            const isLive = !!chosenShift?.isActive && !chosenShift?.isFull && !chosenShift?.isEnded;
            if (isLive) {
                const estimatedWaitMins = chosenShift?.stats.totalWaitMins || 0;
                if (travelMins > estimatedWaitMins + 15 && travelMins > 0) {
                    setShowLateWarningModal(true);
                    return;
                }
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
            onUpdateDetails(feedbackModal.visit.clinicId, feedbackModal.visit.id, {
                rating: feedbackModal.rating,
                feedback: feedbackModal.text
            });
            addToast("Thank you for your feedback!", "success");
            setFeedbackModal({ isOpen: false, visit: null, rating: 0, text: '' });
        } else {
            addToast("Please select a star rating", "warning");
        }
    };
    const handleLocateMe = async () => {
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

                // Reverse Geocode to show address "Uber-style" AND auto-select city
                const { address, city } = await reverseGeocode(latitude, longitude);
                setPinnedAddress(address);

                // Auto-select city if found in our list
                if (city) {
                    const matchedCity = uniqueCities.find(c => c.toLowerCase() === city.toLowerCase());
                    if (matchedCity) {
                        setSelectedCity(matchedCity);
                    }
                }
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
        const { address, city } = await reverseGeocode(latlng.lat, latlng.lng);
        setPinnedAddress(address);
        if (city) {
            const matchedCity = uniqueCities.find(c => c.toLowerCase() === city.toLowerCase());
            if (matchedCity) setSelectedCity(matchedCity);
        }
    };

    const handleMapSelection = async (latlng: L.LatLng) => {
        setUserLocation({ lat: latlng.lat, lng: latlng.lng });
        setIsPickingLocation(false);
        setSortBy('NEAR');
        addToast("Location pinned!", "success");
        const { address, city } = await reverseGeocode(latlng.lat, latlng.lng);
        setPinnedAddress(address);
        if (city) {
            const matchedCity = uniqueCities.find(c => c.toLowerCase() === city.toLowerCase());
            if (matchedCity) setSelectedCity(matchedCity);
        }
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

        // Filter shifts that are not Appointment only
        let shifts = schedule.slots.filter(s => s.active !== false && (!s.mode || s.mode === SessionMode.WALK_IN || s.mode === SessionMode.HYBRID)).map(shift => {
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
                load: stats.load,           // Flattened for easy access
                totalWaitMins,             // Flattened for easy access
                stats: { ...stats, totalWaitMins }
            };
        });

        // Filter out future shifts if advance booking is disabled
        if (selectedClinic.enableAdvanceBooking === false) {
            shifts = shifts.filter(s => s.isActive);
        }

        return shifts;
    }, [selectedDoctor, selectedClinic]);

    // Initial Shift Selection Effect
    useEffect(() => {
        if (walkInShiftsToday.length > 0 && !selectedWalkInShiftId) {
            const active = walkInShiftsToday.find(s => s.isActive && !s.isFull);
            const firstFuture = walkInShiftsToday.find(s => !s.isActive && !s.isEnded && !s.isFull);
            const anyAvailable = active || firstFuture;
            if (anyAvailable) {
                setSelectedWalkInShiftId(anyAvailable.shift.id || anyAvailable.shift.startTime || walkInShiftsToday[0].shift.startTime);
            }
        }
    }, [walkInShiftsToday, selectedWalkInShiftId]);

    // NEW: Memoize walk-in estimation for confirmation popup
    const walkInEstimation = useMemo(() => {
        if (visitType !== 'WALK_IN' || !selectedWalkInShiftId || !selectedDoctor || !selectedClinic) return null;
        const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
        if (!selectedShift) return null;

        // The 'stats.load' from selectedShift is the count of existing patients in that shift.
        // For a new booking, we need to add 1 to this load for the calculation.
        const effectiveLoad = selectedShift.stats.load + 1; // Include the new booking in the load

        // Calculate base wait time from effective load and consultation time
        let estimatedWaitDuration = effectiveLoad * (selectedDoctor.consultationTime || 15);

        const now = getClinicCurrentTime(selectedClinic.timezone);
        const [shiftStartH, shiftStartM] = selectedShift.shift.startTime.split(':').map(Number);

        let finalEstDate: Date;
        let finalEstMins: number; // This will represent the duration of the wait

        if (selectedShift.isActive) { // This is for an active/live shift
            // For active shifts, add doctor's current delay and estimate from 'now'
            estimatedWaitDuration += (selectedDoctor.delayMinutes || 0);
            finalEstDate = new Date(now.getTime() + estimatedWaitDuration * 60000);
            finalEstMins = estimatedWaitDuration;
        } else { // This is an advance booking for a future shift
            // Base time is the shift start time on 'today's' date (relative to the clinic's timezone)
            let baseFutureTime = new Date(now); // Clone 'now' to keep current date part
            baseFutureTime.setHours(shiftStartH, shiftStartM, 0, 0); // Set time to shift start time

            // If the shift starts in the future (later today or tomorrow etc.), calculate from shift start.
            // If the shift start time has already passed today but is not "active" (meaning it has ended),
            // then it implies booking for next day's same shift. For simplicity here, we assume if not active, it's future.
            
            finalEstDate = new Date(baseFutureTime.getTime() + estimatedWaitDuration * 60000);
            finalEstMins = estimatedWaitDuration;
        }

        const estClockTime = finalEstDate.getHours().toString().padStart(2, '0') + ':' + finalEstDate.getMinutes().toString().padStart(2, '0');

        return {
            count: effectiveLoad,
            mins: finalEstMins,
            label: finalEstMins === 0 ? 'Immediate' : `~${finalEstMins} mins`,
            estClockTime: formatTime12h(estClockTime)
        };
    }, [visitType, selectedWalkInShiftId, selectedDoctor, walkInShiftsToday, selectedClinic]);

    // Split walk-in availability:
    // - canBookWalkInToday: any not-ended and not-full shift exists today (advance token allowed even if clinic closed)
    // - canJoinLiveWalkInNow: there's an active, not-full shift and clinic is open (join live queue now)
    const canBookWalkInToday = walkInShiftsToday.length > 0 && walkInShiftsToday.some(s => !s.isEnded && !s.isFull);
    const canJoinLiveWalkInNow = walkInShiftsToday.some(s => s.isActive && !s.isFull) && isClinicOpen(selectedClinic?.operatingHours, selectedClinic?.timezone);

    // Selection-aware allowance for BookingFormView
    const selectedWalkInShift = selectedWalkInShiftId ? walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId) : undefined;
    const isWalkInAllowed = selectedClinic?.enableAdvanceBooking === false
        ? (selectedWalkInShift ? (!selectedWalkInShift.isEnded && !selectedWalkInShift.isFull && selectedWalkInShift.isActive) : canJoinLiveWalkInNow)
        : (selectedWalkInShift ? (!selectedWalkInShift.isEnded && !selectedWalkInShift.isFull) : canBookWalkInToday);

    const isClinicDirectWalkInOnly = selectedClinic?.operationMode === ClinicOperationMode.DIRECT_WALK_IN;
    const isClinicOnlineWalkInAllowed = selectedClinic && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
    const isClinicApptAllowed = selectedClinic && [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);

    const bookingDates = useMemo(() => { if (!selectedDoctor) return []; const days = []; const today = new Date(); for (let i = 0; i < 14; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }); const schedule = selectedDoctor.weeklySchedule.find(s => s.day === dayName); days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate(), isOff: !schedule || schedule.isOff, schedule }); } return days; }, [selectedDoctor]);

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

    const handleUpdateProfile = (updatedProfile: UserProfile) => {
        setUserProfile(updatedProfile);
        localStorage.setItem(`clinicq_patient_${userPhone}`, JSON.stringify(updatedProfile));
        addToast("Profile updated successfully!", "success");
    };

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
            // SKIP WALK-IN ONLY SLOTS
            if (shiftSlot.mode === SessionMode.WALK_IN) return;

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

    const navItems = [{ id: 'BOOK', label: 'Find Care', icon: Search }, { id: 'ACTIVE', label: 'Active Visits', icon: Ticket }, { id: 'HISTORY', label: 'History', icon: History }, { id: 'PROFILE', label: 'Profile', icon: User }];

    const isMapTabVisible = showMap && (bookingView === 'LIST' || bookingView === 'CLINIC_DETAILS');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
            fixed md:sticky top-0 left-0 h-screen z-[100] md:z-30 shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col
            ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}>
                <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'px-6 justify-between'} px-6 md:px-auto border-b border-slate-100 relative`}>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity"
                    >
                        <Logo className="h-8 w-8 flex-shrink-0" />
                        <span className={`font-bold text-xl text-slate-900 tracking-tight transition-opacity duration-200 ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>Smart<span className="text-primary-600">QFlow</span></span>
                    </button>
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-primary-600 z-50 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 py-6 px-3 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleTabSwitch(item.id as any)}
                            className={`relative group w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center md:px-0' : 'px-4'} px-4 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === item.id ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                            <span className={`ml-3 transition-all duration-200 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
                                {item.label}
                            </span>
                            {isSidebarCollapsed && (
                                <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100">
                    <div className={`flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'gap-3'} gap-3 px-0 py-2`}>
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">{isGuest ? <User className="h-5 w-5" /> : userName.charAt(0)}</div>
                        {(!isSidebarCollapsed || isMobileMenuOpen) && (
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                                <p className="text-xs text-slate-500 truncate">{userPhone}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={isGuest ? () => onLoginClick && onLoginClick() : onBack} className={`w-full mt-2 flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'justify-center gap-2'} justify-center gap-2 p-2 text-sm ${isGuest ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}>
                        {isGuest ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                        {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{isGuest ? 'Login' : 'Logout'}</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 w-full">
                {/* PERSISTENT HEADER WITH GLOBAL SEARCH AND INTEGRATED FILTERS */}

                <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 sticky top-0 z-[60] shadow-sm shrink-0">
                    <div className="flex flex-col gap-3">
                        {/* Top Row on Mobile: Menu, Location, QR, User */}
                        <div className="flex items-center justify-between lg:hidden">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Open Menu"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
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

                                <button
                                    onClick={handleLocateMe}
                                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-widest ${pinnedAddress ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-700 hover:border-primary-400'}`}
                                    title="Fetch Current Location"
                                >
                                    {isLocating ? (
                                        <span className="animate-spin h-3 w-3 border border-primary-500 border-t-transparent rounded-full"></span>
                                    ) : (
                                        <LocateFixed className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="truncate max-w-[100px] text-slate-800 font-medium">
                                        {pinnedAddress || 'Locate Me'}
                                    </span>
                                </button>
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
                                        placeholder="Search by symptoms, doctor, or clinic"
                                        value={searchQuery}
                                        onFocus={() => setShowSuggestions(true)}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setShowSuggestions(false);
                                                setSelectedCategory('ALL');
                                                setSelectedCity('All Cities');
                                                setSelectedSpecialty('All Specialties');
                                                setShowOpenOnly(false);
                                                setSelectedDoctorGender('ALL');
                                                setSelectedMinExperience(0);
                                                setSortBy('NEAR');
                                            }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 rounded-lg transition-all shadow-sm"
                                        >
                                            <X className="h-4 w-4" />
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
                                            <div className="p-8 text-center text-slate-400"><Search className="h-8 w-8 mx-auto mb-2 opacity-20" /><p className="text-sm font-bold">No matches found</p><p className="text-xs">Try searching for symptoms, doctor names, or clinic names</p></div>
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
                                        {pinnedAddress || 'Locate Me'}
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

                        {/* Quick Suggestions */}
                        {isGuest && (
                            <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                                <span className="text-sm font-bold text-slate-500 shrink-0">Popular:</span>
                                {quickSearches.map(search => (
                                    <button
                                        key={search.term}
                                        onClick={() => handleQuickSearch(search.term)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shrink-0"
                                    >
                                        <span>{search.emoji}</span>
                                        <span>{search.term}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className={`flex-1 flex flex-col w-full relative ${activeTab !== 'BOOK' ? 'overflow-y-auto overflow-x-hidden scroll-smooth pb-32 md:pb-8' : 'overflow-hidden'}`}>
                    {activeTab === 'ACTIVE' && (
                        isGuest ? (
                            <GuestLoginCard onLoginClick={onLoginClick} />
                        ) : (
                            <ActiveVisitsView
                                activeVisits={activeVisits}
                                getSmartQueueDetails={getSmartQueueDetails}
                                setCancelModal={setCancelModal}
                                setShowQRScanner={setShowQRScanner}
                                handleTabSwitch={handleTabSwitch}
                                userLocation={userLocation}
                                clinics={clinics}
                            />
                        )
                    )}
                    {activeTab === 'HISTORY' && (
                        isGuest ? (
                            <GuestLoginCard onLoginClick={onLoginClick} />
                        ) : (
                            <HistoryVisitsView
                                historyVisits={historyVisits}
                                setFeedbackModal={setFeedbackModal}
                            />
                        )
                    )}
                    {activeTab === 'PROFILE' && (
                        isGuest ? (
                            <GuestLoginCard onLoginClick={onLoginClick} />
                        ) : (
                            <ProfileView
                                userName={userName}
                                userPhone={userPhone}
                                userProfile={userProfile}
                                onBack={onBack}
                                setNewMember={setNewMember}
                                setEditingMemberIndex={setEditingMemberIndex}
                                setIsCustomRelation={setIsCustomRelation}
                                setShowAddMember={setShowAddMember}
                                handleEditMember={handleEditMember}
                                setMemberToDeleteIndex={setMemberToDeleteIndex}
                                handleUpdateProfile={handleUpdateProfile}
                            />
                        )
                    )}
                    {activeTab === 'BOOK' && (
                        <div className="flex flex-col min-h-full">
                            {/* BREADCRUMBS AT TOP - Always visible */}
                            <div className="sticky top-0 z-20 px-4 md:px-8 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex-1 overflow-hidden">
                                    <Breadcrumbs
                                        activeTab={activeTab}
                                        bookingView={bookingView}
                                        selectedClinic={selectedClinic}
                                        selectedDoctor={selectedDoctor}
                                        selectedProfileDoctor={selectedProfileDoctor}
                                        navigateToView={navigateToView}
                                    />
                                </div>
                                
                                {(bookingView === 'LIST' || bookingView === 'CLINIC_DETAILS') && (
                                    <button
                                        onClick={() => setShowMap(!showMap)}
                                        className={`md:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            showMap 
                                            ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                            : 'bg-primary-50 text-primary-700 border-primary-100'
                                        }`}
                                    >
                                        {showMap ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                                        {showMap ? 'List' : 'Map'}
                                    </button>
                                )}
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
                                    showOpenOnly={showOpenOnly}
                                    setShowOpenOnly={setShowOpenOnly}
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
                                            <ClinicListView
                                                filteredClinics={filteredClinics}
                                                getClinicWaitStats={getClinicWaitStats}
                                                getRelevantDoctors={getRelevantDoctors}
                                                getFeeRange={getFeeRange}
                                                userLocation={userLocation}
                                                highlightedClinicId={highlightedClinicId}
                                                clinicCardRefs={clinicCardRefs}
                                                navigateToView={navigateToView}
                                                showMap={showMap}
                                            />
                                        ) : (
                                            <DoctorListView
                                                groupedDoctors={groupedDoctors}
                                                navigateToView={navigateToView}
                                                showMap={showMap}
                                            />
                                        )
                                    ) : bookingView === 'CLINIC_DETAILS' && selectedClinic ? (
                                        <ClinicDetailView
                                            selectedClinic={selectedClinic}
                                            setShowMap={setShowMap}
                                            showMap={showMap}
                                            navigateToView={navigateToView}
                                        />
                                    ) : bookingView === 'DOCTOR_PROFILE' && selectedProfileDoctor ? (
                                        <DoctorProfileView
                                            selectedProfileDoctor={selectedProfileDoctor}
                                            clinics={clinics}
                                            navigateToView={navigateToView}
                                        />
                                    ) : bookingView === 'FORM' && selectedDoctor ? (
                                        <BookingFormView
                                            selectedDoctor={selectedDoctor}
                                            selectedClinic={selectedClinic}
                                            userProfile={userProfile}
                                            bookingFor={bookingFor}
                                            setBookingFor={setBookingFor}
                                            setShowAddMember={setShowAddMember}
                                            visitType={visitType}
                                            setVisitType={setVisitType}
                                            isClinicOnlineWalkInAllowed={isClinicOnlineWalkInAllowed}
                                            isWalkInAllowed={isWalkInAllowed}
                                            isClinicApptAllowed={isClinicApptAllowed}
                                            travelTime={travelTime}
                                            setTravelTime={setTravelTime}
                                            setShowTravelTimeWarning={setShowTravelTimeWarning}
                                            walkInShiftsToday={walkInShiftsToday}
                                            selectedWalkInShiftId={selectedWalkInShiftId}
                                            setSelectedWalkInShiftId={setSelectedWalkInShiftId}
                                            getClinicCurrentTime={getClinicCurrentTime}
                                            bookingDates={bookingDates}
                                            apptDate={apptDate}
                                            setApptDate={setApptDate}
                                            setApptTime={setApptTime}
                                            groupedTimeSlots={groupedTimeSlots}
                                            apptTime={apptTime}
                                            symptoms={symptoms}
                                            setSymptoms={setSymptoms}
                                            handleBookToken={handleBookToken}
                                            walkInEstimation={walkInEstimation}
                                            isClinicDirectWalkInOnly={isClinicDirectWalkInOnly}
                                            formatTime12h={formatTime12h}
                                        />
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
            <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} title="Submit Visit Feedback" maxWidth="max-w-md">
                <div className="text-center py-4 flex flex-col gap-6">
                    <div>
                        <p className="text-slate-500 mb-4">How was your experience with <strong>Dr. {feedbackModal.visit?.doctorName}</strong>?</p>
                        <StarRating rating={feedbackModal.rating} setRating={(r) => setFeedbackModal({ ...feedbackModal, rating: r })} interactive={true} />
                    </div>

                    <textarea
                        className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none bg-slate-50"
                        rows={4}
                        placeholder="Describe your visit experience (optional)..."
                        value={feedbackModal.text}
                        onChange={(e) => setFeedbackModal({ ...feedbackModal, text: e.target.value })}
                    />

                    <div className="flex flex-col gap-2">
                        <Button onClick={handleSubmitFeedback} className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-100">
                            Submit Feedback
                        </Button>
                        <button onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2">
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
                                        {visitType === 'WALK_IN' ? <>Today • {walkInEstimation?.estClockTime} <span className="text-[10px] font-medium text-slate-400 ml-1">(est. turn)</span></> : (
                                            <>{new Date(apptDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatTime12h(apptTime)}</>
                                        )}
                                    </div>
                                    {visitType === 'WALK_IN' && selectedWalkInShiftId && (() => {
                                        const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
                                        if (!selectedShift) return null;
                                        const isAdvance = !selectedShift.isActive;
                                        if (isAdvance) return null; // Hide arrival for advance booking

                                        const now = getClinicCurrentTime(selectedClinic?.timezone);
                                        const travelMins = parseInt(travelTime);
                                        const arrivalTime = new Date(now.getTime() + travelMins * 60000);

                                        return (
                                            <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                                <Navigation className="h-3 w-3 text-blue-500" />
                                                <span>Your arrival: <strong>{arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({travelTime} min travel)</span>
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
                            <Button variant="secondary" onClick={setCancelModal.bind(null, { isOpen: false, visit: null })}>Keep Visit</Button>
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
