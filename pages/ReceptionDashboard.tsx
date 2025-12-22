
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, Staff, ClinicOperationMode, Clinic, AppointmentConfig } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp, Users, MapPin, Settings, Footprints, CalendarClock, Shuffle, Building2, ImageIcon, Plus, X, Globe, Crosshair, Trash2, Info, LayoutGrid, Zap, Mail, Shield, Save, Calendar, UserX, CheckCircle2, PauseCircle, LogOut, Upload, Image as LucideImage, Map as LucideMap, Navigation, ArrowRight, Target, LocateFixed, MapPinIcon, Layout, MessageSquare, Sparkles, CalendarDays,
    Edit2, ChevronLeft, LayoutPanelTop
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { QueueTable } from '../features/reception/components/QueueTable';
import { PatientDatabaseTable } from '../features/reception/components/PatientDatabaseTable';
import { DoctorManager } from '../features/reception/components/DoctorManager';
import { StaffManager } from '../features/reception/components/StaffManager';
import { ReceptionStats } from '../features/reception/components/ReceptionStats';
import { AddPatientModal } from '../features/reception/components/AddPatientModal';
import { DoctorFormModal } from '../features/reception/components/DoctorFormModal';
import { PatientHistoryModal } from '../features/reception/components/PatientHistoryModal';
import { VitalsModal } from '../features/reception/components/VitalsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Leaflet icon fix
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- HELPERS ---
const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getLocalTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const format12h = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr);
    const m = mStr.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${m} ${ampm}`;
};

const parseTo24h = (time12h: string) => {
    const match = time12h.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "09:00";
    let [_, hours, minutes, modifier] = match;
    let h = parseInt(hours);
    if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
    if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

// Map components
const MapClickHandler = ({ onSelect }: { onSelect: (latlng: L.LatLng) => void }) => {
    useMapEvents({
        click(e) {
            onSelect(e.latlng);
        },
    });
    return null;
};

const MapManager = ({ center, isTabActive }: { center: [number, number], isTabActive: boolean }) => {
    const map = useMap();
    useEffect(() => {
        if (isTabActive) {
            setTimeout(() => {
                map.invalidateSize();
                if (!isNaN(center[0]) && !isNaN(center[1])) {
                    map.setView(center, map.getZoom());
                }
            }, 100);
        }
    }, [isTabActive, center, map]);
    return null;
};

const COMMON_AMENITIES = ["Pharmacy", "Blood Lab", "X-Ray", "Ultra Sound", "WiFi", "Parking", "Emergency", "Cafeteria"];

interface ReceptionDashboardProps {
    doctors: Doctor[];
    patients: Patient[];
    staff?: Staff[];
    clinicName: string;
    clinicType?: ClinicType;
    operationMode?: ClinicOperationMode; 
    clinicData?: Clinic; 
    onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string, nextOfKin?: {name: string, phone: string}, address?: string, city?: string, country?: string, location?: {lat: number, lng: number}) => void;
    onEditPatient: (id: string, updates: Partial<Patient>) => void;
    onDeletePatient: (id: string) => void;
    onDeleteMultiplePatients: (ids: string[]) => void;
    onAddDoctor: (name: string, specialty: string, room: string, schedule: any[], mobile?: string, regNo?: string, masterId?: string, avatarUrl?: string, fee?: number, time?: number) => void;
    onCheckMasterDoctor: (mobile: string) => Doctor | null;
    onEditDoctor: (id: string, updates: Partial<Doctor>) => void;
    onDeleteDoctor: (id: string) => void;
    onUpdateStatus: (id: string, status: PatientStatus) => void;
    onCancelPatient: (id: string) => void;
    onUpdateClinicSettings: (updates: Partial<Clinic>) => void; 
    onToggleEmergency: (id: string) => void;
    onManualReorder: (id: string, direction: 'UP' | 'DOWN') => void;
    onDragDrop: (draggedId: string, targetId: string) => void;
    onManualCheckIn: (id: string) => void;
    onBulkUpdateStatus?: (ids: string[], status: PatientStatus) => void;
    onAddStaff?: (staff: Staff) => void;
    onUpdateStaff?: (id: string, updates: Partial<Staff>) => void;
    onDeleteStaff?: (id: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const OperationModeBadge: React.FC<{ mode: ClinicOperationMode }> = ({ mode }) => {
    const config = {
        [ClinicOperationMode.DIRECT_WALK_IN]: { label: 'Walk-In Only', styles: 'bg-orange-50 text-orange-700 border-orange-200' },
        [ClinicOperationMode.ONLINE_WALK_IN]: { label: 'Online Token Only', styles: 'bg-blue-50 text-blue-700 border-blue-200' },
        [ClinicOperationMode.BOTH_WALK_IN]: { label: 'Direct & Online', styles: 'bg-green-50 text-green-700 border-green-200' },
        [ClinicOperationMode.HYBRID_DIRECT_APPT]: { label: 'Walk-In & Appt', styles: 'bg-purple-50 text-purple-700 border-purple-200' },
        [ClinicOperationMode.HYBRID_FULL]: { label: 'HYBRID FULL ACCESS', styles: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    };
    const { label, styles } = config[mode] || { label: mode, styles: 'bg-slate-50 text-slate-700 border-slate-200' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tight shadow-sm ${styles}`}>
            {label}
        </span>
    );
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, staff = [], clinicName, clinicType, operationMode = ClinicOperationMode.HYBRID_FULL, clinicData,
    onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onCancelPatient, onUpdateClinicSettings, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, onBulkUpdateStatus, 
    onAddStaff, onUpdateStaff, onDeleteStaff, addToast
}) => {
    type DashboardTab = 'QUEUE' | 'DATABASE' | 'DOCTORS' | 'APPOINTMENTS' | 'REPORTS';
    const [activeTab, setActiveTab] = useState<DashboardTab>('QUEUE');
    const [queueSubTab, setQueueSubTab] = useState<'LIVE' | 'HOLD' | 'DONE' | 'ABSENT'>('LIVE');
    
    // --- NOTIFICATION SYSTEM / ACTIVITY MONITOR ---
    const prevPatientsRef = useRef<Patient[]>([]);
    const prevDoctorsRef = useRef<Doctor[]>([]);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        // Suppress notifications on first mount to avoid flooding
        if (isInitialLoad.current) {
            prevPatientsRef.current = [...patients];
            prevDoctorsRef.current = [...doctors];
            isInitialLoad.current = false;
            return;
        }

        // 1. Monitor New Patient Bookings (Online or Remote)
        if (patients.length > prevPatientsRef.current.length) {
            const newPatients = patients.filter(p => !prevPatientsRef.current.some(prev => prev.id === p.id));
            newPatients.forEach(p => {
                const docName = doctors.find(d => d.id === p.doctorId)?.name || 'Unknown';
                addToast(`New Booking: ${p.name} added to Dr. ${docName}'s queue.`, 'success');
            });
        }

        // 2. Monitor Status Changes (Especially Completion by Doctors)
        patients.forEach(currPatient => {
            const prevPatient = prevPatientsRef.current.find(p => p.id === currPatient.id);
            if (prevPatient && prevPatient.status !== currPatient.status) {
                const docName = doctors.find(d => d.id === currPatient.doctorId)?.name.split(' ').pop() || 'Doc';
                
                if (currPatient.status === PatientStatus.COMPLETED) {
                    addToast(`Visit Finished: Dr. ${docName} completed consultation for ${currPatient.name}.`, 'info');
                } else if (currPatient.status === PatientStatus.WITH_DOCTOR) {
                    addToast(`Now Consulting: ${currPatient.name} is in Room with Dr. ${docName}.`, 'info');
                } else if (currPatient.status === PatientStatus.SKIPPED) {
                    addToast(`Patient Skipped: ${currPatient.name} marked as absent.`, 'warning');
                }
            }
            
            // Monitor Emergency Flags
            if (prevPatient && !prevPatient.isEmergency && currPatient.isEmergency) {
                addToast(`URGENT: ${currPatient.name} escalated to Emergency priority!`, 'error');
            }
        });

        // 3. Monitor Doctor Status Changes
        doctors.forEach(currDoc => {
            const prevDoc = prevDoctorsRef.current.find(d => d.id === currDoc.id);
            if (prevDoc && prevDoc.status !== currDoc.status) {
                if (currDoc.status === DoctorStatus.ON_BREAK) {
                    addToast(`Status Update: Dr. ${currDoc.name} is now on break.`, 'warning');
                } else if (currDoc.status === DoctorStatus.AVAILABLE) {
                    addToast(`Status Update: Dr. ${currDoc.name} has returned and is available.`, 'success');
                }
            }
        });

        // Sync refs
        prevPatientsRef.current = [...patients];
        prevDoctorsRef.current = [...doctors];
    }, [patients, doctors]);
    
    // Appointment View States
    const [appointmentViewMode, setAppointmentViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
    const [filterDate, setFilterDate] = useState<string>(getLocalToday());

    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 
    const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'PROFILE' | 'LOCATION'>('GENERAL');
    
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
    const [patientHistoryToDelete, setPatientHistoryToDelete] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
    
    // Settings Form State
    const [settingsForm, setSettingsForm] = useState<Partial<Clinic>>({});
    const [newAmenity, setNewAmenity] = useState('');
    const [operatingSlots, setOperatingSlots] = useState<{ start: string, end: string }[]>([{ start: '09:00', end: '21:00' }]);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDeckExpanded, setIsDeckExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isSettingsModalOpen && clinicData) {
            setSettingsForm({
                ...clinicData,
                amenities: [...(clinicData.amenities || [])],
                geoLocation: clinicData.geoLocation || { lat: 13.0850, lng: 80.2100 }
            });

            if (clinicData.operatingHours) {
                const ranges = clinicData.operatingHours.split(',').map(r => r.trim());
                const parsedSlots = ranges.map(range => {
                    const parts = range.split('-').map(p => p.trim());
                    if (parts.length === 2) {
                        return { start: parseTo24h(parts[0]), end: parseTo24h(parts[1]) };
                    }
                    return { start: '09:00', end: '21:00' };
                });
                setOperatingSlots(parsedSlots);
            }
        }
    }, [isSettingsModalOpen, clinicData]);

    const estimatedTimes = useMemo(() => {
        const times: Record<string, number> = {};
        doctors.forEach(doc => {
            const docQueue = patients
                .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                .sort((a, b) => a.timeAdded - b.timeAdded); 
            let currentTime = Date.now();
            if (doc.status === DoctorStatus.ON_BREAK && doc.delayMinutes) currentTime += doc.delayMinutes * 60000;
            if (doc.delayMinutes && doc.status === DoctorStatus.AVAILABLE) currentTime += doc.delayMinutes * 60000;
            docQueue.forEach((p, index) => {
                times[p.id] = currentTime + (index * (doc.consultationTime || 15) * 60000);
            });
        });
        return times;
    }, [patients, doctors]);

    const queueTabCounts = useMemo(() => {
        const list = patients.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
            const dateMatch = pDate === filterDate;
            const docMatch = filterDoctorId === 'ALL' || p.doctorId === filterDoctorId;
            return dateMatch && docMatch;
        });
        return {
            LIVE: list.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR).length,
            HOLD: list.filter(p => p.status === PatientStatus.ON_HOLD).length,
            DONE: list.filter(p => p.status === PatientStatus.COMPLETED).length,
            ABSENT: list.filter(p => p.status === PatientStatus.SKIPPED).length
        };
    }, [patients, filterDate, filterDoctorId]);

    const filteredPatients = useMemo(() => {
        let list = patients.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
            return pDate === filterDate;
        });
        if (filterDoctorId !== 'ALL') list = list.filter(p => p.doctorId === filterDoctorId);
        if (activeTab === 'QUEUE') {
            if (queueSubTab === 'LIVE') list = list.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR);
            else if (queueSubTab === 'HOLD') list = list.filter(p => p.status === PatientStatus.ON_HOLD);
            else if (queueSubTab === 'DONE') list = list.filter(p => p.status === PatientStatus.COMPLETED);
            else if (queueSubTab === 'ABSENT') list = list.filter(p => p.status === PatientStatus.SKIPPED);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.tokenNumber.toString().includes(q));
        }
        return list.sort((a, b) => a.timeAdded - b.timeAdded);
    }, [patients, activeTab, queueSubTab, filterDoctorId, searchQuery, filterDate]);

    const doctorQueueStats = useMemo(() => {
        return doctors.map(doc => {
            const queue = patients.filter(p => {
                const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
                return p.doctorId === doc.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD) && pDate === filterDate;
            });
            const current = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
            const next = queue.length > 0 ? queue[0] : null;
            const dayName = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = doc.weeklySchedule.find(s => s.day === dayName);
            const shiftTiming = schedule && !schedule.isOff && schedule.slots.length > 0 
                ? schedule.slots.map(s => `${format12h(s.startTime)} - ${format12h(s.endTime)}`).join(', ')
                : 'Off Duty';
            return { doc, count: queue.length, current, next, shiftTiming };
        });
    }, [doctors, patients, filterDate]);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedHours = operatingSlots
            .map(s => `${format12h(s.start)} - ${format12h(s.end)}`)
            .join(', ');
        const finalUpdates = { ...settingsForm, operatingHours: formattedHours };
        onUpdateClinicSettings(finalUpdates);
        setIsSettingsModalOpen(false);
        addToast('Clinic settings updated!', 'success');
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettingsForm(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddAmenity = (name?: string) => {
        const value = name || newAmenity;
        if (value.trim()) {
            setSettingsForm(prev => ({
                ...prev,
                amenities: Array.from(new Set([...(prev.amenities || []), value.trim()]))
            }));
            setNewAmenity('');
        }
    };

    const updateOperatingSlot = (index: number, field: 'start' | 'end', value: string) => {
        const newSlots = [...operatingSlots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setOperatingSlots(newSlots);
    };

    const addOperatingSlot = () => {
        setOperatingSlots([...operatingSlots, { start: '17:00', end: '21:00' }]);
    };

    const removeOperatingSlot = (index: number) => {
        if (operatingSlots.length > 1) {
            setOperatingSlots(operatingSlots.filter((_, i) => i !== index));
        }
    };

    const handleMapClick = (latlng: L.LatLng) => {
        setSettingsForm(prev => ({
            ...prev,
            geoLocation: { lat: latlng.lat, lng: latlng.lng }
        }));
    };

    const handleManualCoordChange = (field: 'lat' | 'lng', value: string) => {
        if (value === '' || value === '-' || value === '.') return;
        const num = parseFloat(value);
        if (isNaN(num)) return;
        setSettingsForm(prev => ({
            ...prev,
            geoLocation: {
                lat: field === 'lat' ? num : (prev.geoLocation?.lat || 0),
                lng: field === 'lng' ? num : (prev.geoLocation?.lng || 0)
            }
        }));
    };

    const fetchCurrentGPSLocation = () => {
        if (!navigator.geolocation) {
            addToast("Geolocation is not supported by your browser", "error");
            return;
        }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setSettingsForm(prev => ({
                    ...prev,
                    geoLocation: { lat: latitude, lng: longitude }
                }));
                setIsFetchingLocation(false);
                addToast("Current location pinned!", "success");
            },
            (error) => {
                setIsFetchingLocation(false);
                addToast("Could not get location: " + error.message, "error");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const upcomingAppointments = useMemo(() => {
        return patients
            .filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate && p.status !== PatientStatus.CANCELLED && p.status !== PatientStatus.COMPLETED)
            .sort((a, b) => {
                const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime || '00:00'}`);
                const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime || '00:00'}`);
                return dateA.getTime() - dateB.getTime();
            });
    }, [patients]);

    // Calendar Helper Components & Logic
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
        const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();
        
        const days = [];
        // Pad previous month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateStr,
                appointments: patients.filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === dateStr && p.status !== PatientStatus.CANCELLED)
            });
        }
        return days;
    }, [calendarMonth, calendarYear, patients]);

    const changeMonth = (offset: number) => {
        let newMonth = calendarMonth + offset;
        let newYear = calendarYear;
        if (newMonth < 0) { newMonth = 11; newYear -= 1; }
        else if (newMonth > 11) { newMonth = 0; newYear += 1; }
        setCalendarMonth(newMonth);
        setCalendarYear(newYear);
    };

    const tabConfig: Record<DashboardTab, { label: string; icon: React.ElementType }> = {
        QUEUE: { label: 'Queue', icon: List },
        DATABASE: { label: 'Database', icon: Database },
        DOCTORS: { label: 'Doctors', icon: Stethoscope },
        APPOINTMENTS: { label: 'Appts', icon: CalendarDays },
        REPORTS: { label: 'Reports', icon: BarChart3 },
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 w-full max-w-[100vw] overflow-hidden">
            <div className="flex flex-col flex-shrink-0 bg-white border-b border-slate-200 z-30 w-full shadow-sm">
                <header className="px-6 py-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{clinicName}</h1>
                                <button onClick={() => { setSettingsTab('GENERAL'); setIsSettingsModalOpen(true); }} className="text-slate-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-all">
                                    <Settings className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shadow-inner">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <OperationModeBadge mode={clinicData?.operationMode || operationMode} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-2xl h-11 px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/10 focus-within:border-primary-400 transition-all">
                            <Search className="h-4 w-4 text-slate-400 mr-3" />
                            <input 
                                type="text" 
                                placeholder="Global Search..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none w-48 placeholder:text-slate-400" 
                            />
                        </div>
                        <Button 
                            onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} 
                            className="bg-primary-600 hover:bg-primary-700 text-white font-black px-5 rounded-2xl h-11 text-xs flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-primary-200 active:scale-95 transition-all"
                        >
                            <Plus className="h-4 w-4" /> <span>Add Patient</span>
                        </Button>
                    </div>
                </header>

                <div className="flex px-4 py-2 gap-2 overflow-x-auto no-scrollbar bg-white">
                    {(Object.keys(tabConfig) as DashboardTab[]).map(tab => {
                        const Icon = tabConfig[tab].icon;
                        const isActive = activeTab === tab;
                        return (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap
                                    ${isActive 
                                        ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 scale-105 z-10' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'}
                                `}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                {tabConfig[tab].label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'QUEUE' && (
                    <div className="bg-slate-50 border-t border-slate-200 w-full">
                        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => setFilterDoctorId('ALL')} className={`flex-shrink-0 w-28 p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-[72px] ${filterDoctorId === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                <div className="font-black text-[9px] uppercase tracking-widest opacity-80">All Doctors</div>
                                <div className="mt-auto">
                                    <div className="text-2xl font-black tracking-tighter leading-none">{doctorQueueStats.reduce((acc, d) => acc + d.count, 0)}</div>
                                    <div className={`text-[8px] uppercase font-bold tracking-widest ${filterDoctorId === 'ALL' ? 'text-slate-400' : 'text-slate-500'}`}>Total Wait</div>
                                </div>
                            </button>

                            {doctorQueueStats.map(({ doc, current, next, count, shiftTiming }) => {
                                const isSelected = filterDoctorId === doc.id;
                                return (
                                    <button key={doc.id} onClick={() => setFilterDoctorId(isSelected ? 'ALL' : doc.id)} className={`flex-shrink-0 w-44 p-3 rounded-2xl border transition-all text-left flex flex-col h-[72px] justify-between ${isSelected ? 'bg-white border-primary-500 ring-2 ring-primary-500/10 shadow-lg' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <img src={doc.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-slate-100 shadow-sm" />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-slate-900 text-[10px] truncate leading-tight">{doc.name}</div>
                                                <div className="text-[8px] text-slate-400 truncate font-black uppercase tracking-tighter">{shiftTiming}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100 mt-1.5 shadow-inner">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[7px] text-slate-400 font-black uppercase">Now</span>
                                                <span className={`text-[10px] font-black ${current && filterDate === getLocalToday() ? 'text-blue-600' : 'text-slate-300'}`}>{filterDate === getLocalToday() ? (current ? `#${current.tokenNumber}` : '--') : (doc.consultationTime || 15) + 'm'}</span>
                                            </div>
                                            <div className="flex flex-col items-center border-x border-slate-200">
                                                <span className="text-[7px] text-slate-400 font-black uppercase">Next</span>
                                                <span className={`text-[10px] font-black ${next ? 'text-indigo-600' : 'text-slate-300'}`}>{next ? `#${next.tokenNumber}` : '--'}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[7px] text-slate-400 font-black uppercase">Queue</span>
                                                <span className="text-[10px] font-black text-slate-700">{count}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden relative bg-slate-100 flex flex-col pb-[104px] sm:pb-0">
                {activeTab === 'QUEUE' && (
                    <>
                        <div className="hidden sm:flex px-4 py-2 bg-white border-b border-slate-200 items-center justify-between flex-shrink-0 z-10 gap-4">
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                <button onClick={() => setQueueSubTab('LIVE')} className={`flex items-center gap-2 h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${queueSubTab === 'LIVE' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <Activity className={`h-4 w-4 ${queueSubTab === 'LIVE' ? 'animate-pulse' : ''}`} />
                                    Live <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] ${queueSubTab === 'LIVE' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{queueTabCounts.LIVE}</span>
                                </button>
                                <button onClick={() => setQueueSubTab('HOLD')} className={`flex items-center gap-2 h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${queueSubTab === 'HOLD' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <PauseCircle className="h-4 w-4" />
                                    Hold <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] ${queueSubTab === 'HOLD' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{queueTabCounts.HOLD}</span>
                                </button>
                                <button onClick={() => setQueueSubTab('DONE')} className={`flex items-center gap-2 h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${queueSubTab === 'DONE' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Done <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] ${queueSubTab === 'DONE' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{queueTabCounts.DONE}</span>
                                </button>
                                <button onClick={() => setQueueSubTab('ABSENT')} className={`flex items-center gap-2 h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${queueSubTab === 'ABSENT' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <UserX className="h-4 w-4" />
                                    Absent <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] ${queueSubTab === 'ABSENT' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{queueTabCounts.ABSENT}</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 w-[350px] bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                                <button onClick={() => setFilterDate(getLocalToday())} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center ${filterDate === getLocalToday() ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-900'}`}>Today</button>
                                <button onClick={() => setFilterDate(getLocalTomorrow())} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center ${filterDate === getLocalTomorrow() ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-900'}`}>Tmrw</button>
                                <div className="relative flex-[1.5] flex items-center group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none z-10" />
                                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full pl-10 pr-3 h-9 bg-white border border-slate-200 rounded-xl text-[10px] font-black focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 outline-none shadow-sm appearance-none" />
                                </div>
                            </div>
                        </div>

                        <QueueTable 
                            patients={filteredPatients} doctors={doctors} estimatedTimes={estimatedTimes} isFiltered={searchQuery !== '' || filterDoctorId !== 'ALL'}
                            onUpdateStatus={onUpdateStatus} onManualReorder={onManualReorder} onDragDrop={onDragDrop} onManualCheckIn={onManualCheckIn}
                            onEditPatient={(p) => setEditingPatient(p)} onVitalsClick={(p) => setVitalsPatient(p)} onToggleEmergency={onToggleEmergency}
                            onNoShowPatient={(id) => onUpdateStatus(id, PatientStatus.SKIPPED)}
                        />

                        {/* MOBILE STICKY BOTTOM MENU */}
                        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-2 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex flex-col gap-2">
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2">
                                <button onClick={() => setQueueSubTab('LIVE')} className={`flex-1 flex flex-col items-center justify-center min-w-[72px] h-[48px] rounded-2xl transition-all ${queueSubTab === 'LIVE' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-slate-100 text-slate-500'}`}>
                                    <Activity className={`h-4 w-4 mb-0.5 ${queueSubTab === 'LIVE' ? 'animate-pulse' : ''}`} />
                                    <span className="text-[8px] font-black uppercase">Live ({queueTabCounts.LIVE})</span>
                                </button>
                                <button onClick={() => setQueueSubTab('HOLD')} className={`flex-1 flex flex-col items-center justify-center min-w-[72px] h-[48px] rounded-2xl transition-all ${queueSubTab === 'HOLD' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                    <PauseCircle className="h-4 w-4 mb-0.5" />
                                    <span className="text-[8px] font-black uppercase">Hold ({queueTabCounts.HOLD})</span>
                                </button>
                                <button onClick={() => setQueueSubTab('DONE')} className={`flex-1 flex flex-col items-center justify-center min-w-[72px] h-[48px] rounded-2xl transition-all ${queueSubTab === 'DONE' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                    <CheckCircle2 className="h-4 w-4 mb-0.5" />
                                    <span className="text-[8px] font-black uppercase">Done ({queueTabCounts.DONE})</span>
                                </button>
                                <button onClick={() => setQueueSubTab('ABSENT')} className={`flex-1 flex flex-col items-center justify-center min-w-[72px] h-[48px] rounded-2xl transition-all ${queueSubTab === 'ABSENT' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                    <UserX className="h-4 w-4 mb-0.5" />
                                    <span className="text-[8px] font-black uppercase">Absent ({queueTabCounts.ABSENT})</span>
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-1.5 h-11 bg-slate-900 rounded-2xl p-1 shadow-lg">
                                <button onClick={() => setFilterDate(getLocalToday())} className={`flex-1 h-full rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${filterDate === getLocalToday() ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Today</button>
                                <button onClick={() => setFilterDate(getLocalTomorrow())} className={`flex-1 h-full rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${filterDate === getLocalTomorrow() ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Tmrw</button>
                                <div className="flex-[1.5] h-full relative group">
                                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full h-full bg-slate-800 rounded-xl text-[9px] font-black text-white px-8 outline-none border border-slate-700 focus:ring-1 focus:ring-primary-500" />
                                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab === 'APPOINTMENTS' && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <CalendarDays className="h-7 w-7 text-primary-600" /> Scheduled Visits
                                </h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1.5">Overview of confirmed clinical appointments</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                <button onClick={() => setAppointmentViewMode('LIST')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appointmentViewMode === 'LIST' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}> List View </button>
                                <button onClick={() => setAppointmentViewMode('CALENDAR')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appointmentViewMode === 'CALENDAR' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}> Calendar </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar bg-slate-50">
                            {appointmentViewMode === 'LIST' ? (
                                upcomingAppointments.length > 0 ? (
                                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                                            <thead className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-8 py-5 border-b border-slate-200">Patient Profile</th>
                                                    <th className="px-8 py-5 border-b border-slate-200">Consultant</th>
                                                    <th className="px-8 py-5 border-b border-slate-200">Schedule</th>
                                                    <th className="px-8 py-5 border-b border-slate-200 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {upcomingAppointments.map((p) => {
                                                    const doc = doctors.find(d => d.id === p.doctorId);
                                                    const apptDateObj = new Date(p.appointmentDate!);
                                                    const isToday = p.appointmentDate === getLocalToday();
                                                    return (
                                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-8 py-4">
                                                                <div className="font-black text-slate-900 text-base">{p.name}</div>
                                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-1">{p.phone}</div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className="font-black text-slate-700">Dr. {doc?.name || 'Unknown'}</div>
                                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">{doc?.specialty}</div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${isToday ? 'bg-green-100 text-green-800 border-green-200 shadow-sm' : 'bg-blue-50 text-blue-700 border-blue-100'}`}> {isToday ? 'Today' : apptDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} </span>
                                                                    <span className="font-black text-slate-700 text-sm">{format12h(p.appointmentTime || '--:--')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {!p.isCheckedIn && ( <button onClick={() => onManualCheckIn(p.id)} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-100 active:scale-95"> Arrived </button> )}
                                                                    <button onClick={() => setEditingPatient(p)} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"> <Edit2 className="h-5 w-5" /> </button>
                                                                    <button onClick={() => onCancelPatient(p.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"> <XCircle className="h-5 w-5" /> </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                                        <CalendarDays className="h-16 w-16 mb-6 opacity-20" />
                                        <p className="font-black uppercase tracking-[0.2em] text-xs">No pending scheduled appointments</p>
                                        <Button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} variant="secondary" size="md" className="mt-8 border-slate-300 rounded-2xl px-10 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50">Schedule Visit Now</Button>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8">
                                        <div className="flex justify-between items-center mb-10">
                                            <div className="flex items-center gap-6">
                                                <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200"><ChevronLeft className="h-6 w-6 text-slate-600" /></button>
                                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter"> {new Date(calendarYear, calendarMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} </h4>
                                                <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200"><ChevronRight className="h-6 w-6 text-slate-600" /></button>
                                            </div>
                                            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-primary-500 shadow-sm"></div> With Appts</div>
                                                <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-slate-200 shadow-inner"></div> Free Days</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl border border-slate-100 overflow-hidden shadow-inner">
                                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => ( <div key={day} className="bg-slate-50 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter tracking-[0.3em]">{day}</div> ))}
                                            {calendarDays.map((dayObj, idx) => {
                                                const isToday = dayObj && dayObj.dateStr === getLocalToday();
                                                const isSelected = dayObj && dayObj.dateStr === selectedCalendarDay;
                                                return (
                                                    <div key={idx} onClick={() => dayObj && setSelectedCalendarDay(dayObj.dateStr)} className={`bg-white min-h-[120px] p-4 transition-all cursor-pointer group hover:bg-slate-50/50 ${!dayObj ? 'opacity-30' : ''} ${isSelected ? 'ring-2 ring-inset ring-primary-600 z-10 shadow-lg' : ''}`}>
                                                        {dayObj && (
                                                            <div className="flex flex-col h-full">
                                                                <div className="flex justify-between items-start">
                                                                    <span className={`text-base font-black transition-all ${isToday ? 'bg-primary-600 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 scale-110' : isSelected ? 'text-primary-600 scale-110' : 'text-slate-900 group-hover:scale-110'}`}>{dayObj.day}</span>
                                                                    {dayObj.appointments.length > 0 && ( <span className="bg-primary-50 text-primary-700 text-[10px] font-black px-2 py-1 rounded-lg border border-primary-100 shadow-sm">{dayObj.appointments.length}</span> )}
                                                                </div>
                                                                <div className="mt-auto flex flex-wrap gap-1.5">
                                                                    {dayObj.appointments.slice(0, 4).map(a => ( <div key={a.id} className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" title={`${a.name} @ ${a.appointmentTime}`}></div> ))}
                                                                    {dayObj.appointments.length > 4 && <span className="text-[10px] font-black text-slate-400 ml-1">+{dayObj.appointments.length - 4}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {selectedCalendarDay && (
                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
                                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                <h5 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs flex items-center gap-3"> <CalendarDays className="h-5 w-5 text-primary-600" /> {new Date(selectedCalendarDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} </h5>
                                                <button onClick={() => setSelectedCalendarDay(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X className="h-6 w-6" /></button>
                                            </div>
                                            <div className="p-8">
                                                {patients.filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedCalendarDay).length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {patients.filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedCalendarDay).map(p => {
                                                            const doc = doctors.find(d => d.id === p.doctorId);
                                                            return (
                                                                <div key={p.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-4 group relative hover:border-primary-400 hover:bg-white hover:shadow-xl transition-all">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="min-w-0">
                                                                            <div className="font-black text-slate-900 text-lg truncate mb-1">{p.name}</div>
                                                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{p.phone}</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">{format12h(p.appointmentTime || '--:--')}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                                                                        <img src={doc?.avatarUrl} className="w-8 h-8 rounded-xl object-cover border border-white shadow-sm" />
                                                                        <div className="min-w-0">
                                                                            <span className="text-[11px] font-black text-slate-700 block truncate leading-none">Dr. {doc?.name.split(' ').pop()}</span>
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate block mt-1">{doc?.specialty}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                                        <button onClick={() => setEditingPatient(p)} className="p-2.5 bg-white text-slate-400 hover:text-primary-600 rounded-xl shadow-lg hover:shadow-primary-100 border border-slate-100"><Edit2 className="h-4 w-4" /></button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : ( <div className="text-center py-20 text-slate-400 italic text-sm font-bold uppercase tracking-widest opacity-40">No entries for this specific date</div> )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'DATABASE' && <PatientDatabaseTable patients={patients} doctors={doctors} onHistoryClick={(p) => setHistoryPatient(p)} onEditClick={(p) => setEditingPatient(p)} onDeleteClick={(p) => setPatientHistoryToDelete(p)} />}
                {activeTab === 'DOCTORS' && <DoctorManager doctors={doctors} onAddDoctor={() => { setDoctorModalMode('ADD'); setEditingDoctorData(undefined); setIsDoctorModalOpen(true); }} onEditDoctor={(doc) => { setDoctorModalMode('EDIT'); setEditingDoctorId(doc.id); setEditingDoctorData(doc); setIsDoctorModalOpen(true); }} onDeleteDoctor={(id) => { const doc = doctors.find(d => d.id === id); if (doc) setDoctorToDelete(doc); }} onAddPresetSlot={() => {}} onStatusChange={(id, status) => onEditDoctor(id, { status })} />}
                {activeTab === 'REPORTS' && <ReceptionStats patients={patients} doctors={doctors} />}
            </div>

            {/* MODALS */}
            <AddPatientModal isOpen={isPatientModalOpen || !!editingPatient} onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} mode={editingPatient ? 'EDIT' : 'ADD'} initialData={editingPatient} onAdd={onAddPatient} onEdit={onEditPatient} doctors={doctors} patients={patients} addToast={addToast} />
            <DoctorFormModal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} mode={doctorModalMode} initialData={editingDoctorData} onSave={(data) => { if (doctorModalMode === 'EDIT' && editingDoctorId) { onEditDoctor(editingDoctorId, data); addToast('Doctor profile updated', 'success'); } else { onAddDoctor(data.name, data.specialty, data.room, data.schedule, data.mobile, data.regNo, data.masterId, data.avatarUrl, parseFloat(data.fee), parseInt(data.consultationTime)); addToast('Doctor registered', 'success'); } }} onCheckMasterDoctor={onCheckMasterDoctor} addToast={addToast} />
            <PatientHistoryModal 
                isOpen={!!historyPatient} 
                onClose={() => setHistoryPatient(null)} 
                patient={historyPatient} 
                allClinicsPatients={patients} 
                doctors={doctors} 
            />
            <VitalsModal
                isOpen={!!vitalsPatient}
                onClose={() => setVitalsPatient(null)}
                patient={vitalsPatient}
                onSave={(pid, vitals) => onEditPatient(pid, { vitals })}
            />
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Clinic Settings" maxWidth="max-w-5xl">
                <div className="flex flex-col h-[80vh] sm:h-[520px] overflow-hidden">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6 w-full sm:w-auto self-start shadow-inner border border-slate-200">
                        <button onClick={() => setSettingsTab('GENERAL')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}> <Layout className="h-4 w-4" /> General </button>
                        <button onClick={() => setSettingsTab('PROFILE')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'PROFILE' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}> <ImageIcon className="h-4 w-4" /> Profile </button>
                        <button onClick={() => setSettingsTab('LOCATION')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'LOCATION' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}> <LucideMap className="h-4 w-4" /> Location </button>
                    </div>
                    <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {settingsTab === 'GENERAL' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                    <div className="space-y-6">
                                        <div className="border-b border-slate-100 pb-3 mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Identity</span></div>
                                        <Input label="Clinic Name" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} required className="h-11 rounded-xl" />
                                        <Input label="Primary Contact" value={settingsForm.contactPhone || ''} onChange={e => setSettingsForm({...settingsForm, contactPhone: e.target.value})} className="h-11 rounded-xl" />
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Access & Flow Configuration</label>
                                            <select className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-400 outline-none bg-white appearance-none transition-all cursor-pointer" value={settingsForm.operationMode} onChange={e => setSettingsForm({...settingsForm, operationMode: e.target.value as ClinicOperationMode})}>
                                                <option value={ClinicOperationMode.DIRECT_WALK_IN}>Direct Walk-In Only</option>
                                                <option value={ClinicOperationMode.ONLINE_WALK_IN}>Online Token Only</option>
                                                <option value={ClinicOperationMode.BOTH_WALK_IN}>Direct & Online Walk-In</option>
                                                <option value={ClinicOperationMode.HYBRID_DIRECT_APPT}>Direct & Appointment</option>
                                                <option value={ClinicOperationMode.HYBRID_FULL}>Hybrid Full Access</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-6 flex flex-col min-h-[300px]">
                                        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-wrap justify-between items-center gap-2"> <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operating Shifts</span> <button type="button" onClick={addOperatingSlot} className="text-primary-600 hover:text-primary-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100 shadow-sm transition-all active:scale-95"> <Plus className="h-3.5 w-3.5" /> New Shift </button> </div>
                                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200 shadow-inner overflow-y-auto custom-scrollbar flex-1">
                                            <div className="space-y-5">
                                                {operatingSlots.map((slot, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-primary-300 transition-all">
                                                        <div className="flex items-center gap-4 sm:gap-6">
                                                            <div className="flex-1 min-w-0"> <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Opens</span> <input type="time" value={slot.start} onChange={e => updateOperatingSlot(idx, 'start', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400" /> </div>
                                                            <ArrowRight className="h-5 w-5 text-slate-300 mt-6 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0"> <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Closes</span> <input type="time" value={slot.end} onChange={e => updateOperatingSlot(idx, 'end', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400" /> </div>
                                                            {operatingSlots.length > 1 && ( <button type="button" onClick={() => removeOperatingSlot(idx)} className="mt-6 p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-lg"> <X className="h-4 w-4" /> </button> )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 p-4 rounded-2xl bg-white border border-primary-100 shadow-sm">
                                                <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.2em] flex items-center gap-3 justify-center text-center"> 
                                                    <Clock className="h-4 w-4 flex-shrink-0" /> 
                                                    {operatingSlots.map(s => `${format12h(s.start)} - ${format12h(s.end)}`).join(', ')} 
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {settingsTab === 'PROFILE' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full animate-in fade-in duration-300">
                                    <div className="flex flex-col gap-6">
                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Branding</span></div>
                                        <div className="relative group aspect-[16/8] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center transition-all hover:border-primary-400 hover:bg-white shadow-inner flex-shrink-0">
                                            {settingsForm.imageUrl ? (
                                                <> <img src={settingsForm.imageUrl} className="w-full h-full object-cover" alt="Banner" /> <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-[2px]"> <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-white rounded-2xl text-slate-900 shadow-2xl hover:scale-110 active:scale-95 transition-all"><Upload className="h-6 w-6" /></button> <button type="button" onClick={() => setSettingsForm({...settingsForm, imageUrl: ''})} className="p-4 bg-white rounded-2xl text-red-600 shadow-2xl hover:scale-110 active:scale-95 transition-all"><Trash2 className="h-6 w-6" /></button> </div> </>
                                            ) : ( <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 text-slate-400 hover:text-primary-600 transition-colors"> <LucideImage className="h-12 w-12 opacity-20" /> <span className="text-[10px] font-black uppercase tracking-[0.4em]">Upload Clinic Banner</span> </button> )}
                                            <input type="file" ref={fileInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Clinic Introduction</label>
                                            <textarea className="flex-1 w-full p-5 bg-slate-50 border border-slate-300 rounded-[2rem] text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 outline-none resize-none shadow-inner leading-relaxed" placeholder="Write a professional overview for your patients..." value={settingsForm.about || ''} onChange={e => setSettingsForm({...settingsForm, about: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Services & Amenities</span></div>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-inner">
                                            <div className="flex gap-3"> <input type="text" className="flex-1 rounded-xl border border-slate-300 px-5 h-11 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-400 outline-none min-w-0 shadow-sm" placeholder="Custom Service..." value={newAmenity} onChange={e => setNewAmenity(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())} /> <Button type="button" onClick={() => handleAddAmenity()} className="px-6 rounded-xl font-black text-[10px] tracking-[0.15em] flex-shrink-0 shadow-md">ADD</Button> </div>
                                            <div className="flex flex-wrap gap-2 mt-4"> {COMMON_AMENITIES.slice(0, 8).map(a => ( <button key={a} type="button" onClick={() => handleAddAmenity(a)} disabled={settingsForm.amenities?.includes(a)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border shadow-sm ${settingsForm.amenities?.includes(a) ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed opacity-50' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-600 hover:scale-105'}`}>{a}</button> ))} </div>
                                        </div>
                                        <div className="min-h-[150px] flex-1 bg-white rounded-[2.5rem] border border-slate-200 p-6 overflow-y-auto custom-scrollbar shadow-inner">
                                            <div className="flex flex-wrap gap-3">
                                                {settingsForm.amenities?.map((a, i) => ( <div key={i} className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary-50 text-primary-900 text-[10px] font-black border border-primary-100 shadow-sm animate-in fade-in zoom-in-95"> {a} <button type="button" onClick={() => setSettingsForm({...settingsForm, amenities: settingsForm.amenities?.filter((_, idx) => idx !== i)})} className="text-primary-300 hover:text-red-500 transition-colors p-1"><X className="h-4 w-4" /></button> </div> ))}
                                                {(!settingsForm.amenities || settingsForm.amenities.length === 0) && <div className="text-center w-full py-16 text-slate-300 italic text-[11px] font-bold uppercase tracking-[0.3em] opacity-40">No amenities defined</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {settingsTab === 'LOCATION' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300 h-full">
                                    <div className="col-span-1 flex flex-col gap-6">
                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex-shrink-0 group">
                                            <Target className="absolute -top-6 -right-6 h-24 w-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                                            <h4 className="text-sm font-black mb-2 flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary-400" /> GPS Precision Pins</h4>
                                            <p className="text-[10px] text-slate-400 leading-relaxed mb-6 uppercase tracking-wider">Enable live travel tracking for your patients by accurately pinning your entrance.</p>
                                            <div className="grid grid-cols-1 gap-3 mb-6"> 
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary-400 opacity-50">LAT</span>
                                                    <input type="number" step="0.000001" value={settingsForm.geoLocation?.lat ?? ''} onChange={(e) => handleManualCoordChange('lat', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/30 outline-none text-white shadow-inner" placeholder="0.000000" /> 
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary-400 opacity-50">LNG</span>
                                                    <input type="number" step="0.000001" value={settingsForm.geoLocation?.lng ?? ''} onChange={(e) => handleManualCoordChange('lng', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/30 outline-none text-white shadow-inner" placeholder="0.000000" /> 
                                                </div>
                                            </div>
                                            <button type="button" onClick={fetchCurrentGPSLocation} disabled={isFetchingLocation} className={`w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${isFetchingLocation ? 'bg-slate-800 text-slate-500' : 'bg-primary-600 text-white hover:bg-primary-500 hover:scale-[1.02] active:scale-95'}`}> {isFetchingLocation ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span> : <LocateFixed className="h-4 w-4" />} Sync GPS Location </button>
                                        </div>
                                        <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] space-y-4 shadow-sm flex-shrink-0"> 
                                            <Input label="Mailing Address" value={settingsForm.address || ''} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} className="h-11 rounded-xl text-sm" /> 
                                            <div className="grid grid-cols-2 gap-4"> 
                                                <Input label="City" value={settingsForm.city || ''} onChange={e => setSettingsForm({...settingsForm, city: e.target.value})} className="h-11 rounded-xl text-sm" /> 
                                                <Input label="Pincode" value={settingsForm.pincode || ''} onChange={e => setSettingsForm({...settingsForm, pincode: e.target.value})} className="h-11 rounded-xl text-sm" /> 
                                            </div> 
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2 relative min-h-[400px] rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl bg-slate-100 ring-4 ring-slate-100">
                                        <MapContainer center={(!isNaN(settingsForm.geoLocation?.lat ?? NaN)) ? [settingsForm.geoLocation!.lat, settingsForm.geoLocation!.lng] : [13.0850, 80.2100]} zoom={15} className="h-full w-full z-0">
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapManager center={(!isNaN(settingsForm.geoLocation?.lat ?? NaN)) ? [settingsForm.geoLocation!.lat, settingsForm.geoLocation!.lng] : [13.0850, 80.2100]} isTabActive={settingsTab === 'LOCATION'} />
                                            <MapClickHandler onSelect={handleMapClick} />
                                            {settingsForm.geoLocation && !isNaN(settingsForm.geoLocation.lat) && !isNaN(settingsForm.geoLocation.lng) && <Marker position={[settingsForm.geoLocation.lat, settingsForm.geoLocation.lng]} />}
                                        </MapContainer>
                                        <div className="absolute bottom-6 right-6 z-10 bg-slate-900/95 backdrop-blur-xl text-white px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4"> <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_15px_#14b8a6]"></div> <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Live Geosync Engaged</span> </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-6 flex flex-col-reverse xs:flex-row justify-end gap-3 border-t border-slate-100 mt-6 bg-white flex-shrink-0">
                            <Button variant="secondary" type="button" onClick={() => setIsSettingsModalOpen(false)} className="w-full xs:w-auto px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 border-slate-200 hover:bg-slate-50">Dismiss</Button>
                            <Button type="submit" className="w-full xs:w-auto px-16 rounded-2xl shadow-2xl shadow-primary-900/20 font-black uppercase tracking-[0.2em] h-12 bg-primary-600 hover:bg-primary-700 active:scale-[0.95] transition-all transform"> <Save className="h-5 w-5 mr-3" /> Save Changes </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};
