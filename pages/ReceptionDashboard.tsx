
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, Staff, ClinicOperationMode, Clinic, AppointmentConfig, TimeSlot } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp, Users, MapPin, Settings, Footprints, CalendarClock, Shuffle, Building2, ImageIcon, Plus, X, Globe, Crosshair, Trash2, Info, LayoutGrid, Zap, Mail, Shield, Save, Calendar, CheckCircle2, PauseCircle, Timer, Bell, MessageSquare, ShieldCheck, Repeat, Clock3, AlertCircle, CalendarX, Menu, UserX, Navigation, Navigation2
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
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Logo } from '../components/Logo';

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
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
};

const parse12hTo24h = (time12: string) => {
    if (!time12 || typeof time12 !== 'string') return "09:00";
    const cleanTime = time12.trim().toUpperCase();
    if (cleanTime === '24 HOURS') return "00:00";
    
    const parts = cleanTime.split(/\s+/);
    if (parts.length < 2) return "09:00";
    
    const [time, modifier] = parts;
    const timeParts = time.split(':');
    if (timeParts.length < 2) return "09:00";
    
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1].padStart(2, '0');
    
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// --- MAP COMPONENTS FOR SETTINGS ---
const SettingsPinIcon = L.divIcon({
    className: 'settings-pin',
    html: `<div style="background-color: #0d9488; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 14);
    }, [center, map]);
    return null;
};

// Helper for draggable marker to update coordinates
const DraggableSettingsMarker = ({ position, onDragEnd }: { position: [number, number], onDragEnd: (lat: number, lng: number) => void }) => {
    const markerRef = React.useRef<L.Marker>(null);
    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const { lat, lng } = marker.getLatLng();
                onDragEnd(lat, lng);
            }
        },
    }), [onDragEnd]);

    return (
        <Marker 
            draggable={true} 
            eventHandlers={eventHandlers} 
            position={position} 
            icon={SettingsPinIcon} 
            ref={markerRef} 
        />
    );
};

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
        [ClinicOperationMode.DIRECT_WALK_IN]: {
            label: 'Walk-In Only',
            styles: 'bg-orange-50 text-orange-700 border-orange-200',
            icon: Footprints
        },
        [ClinicOperationMode.ONLINE_WALK_IN]: {
            label: 'Online Token Only',
            styles: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: Zap
        },
        [ClinicOperationMode.BOTH_WALK_IN]: {
            label: 'Walk-In & Online Token',
            styles: 'bg-green-50 text-green-700 border-green-200',
            icon: Shuffle
        },
        [ClinicOperationMode.HYBRID_DIRECT_APPT]: {
            label: 'Walk-In & Appointment',
            styles: 'bg-purple-50 text-purple-700 border-purple-200',
            icon: CalendarClock
        },
        [ClinicOperationMode.HYBRID_FULL]: {
            label: 'Hybrid Full Access',
            styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            icon: LayoutGrid
        }
    };
    const { label, styles, icon: Icon } = config[mode] || { label: mode, styles: 'bg-slate-50 text-slate-700 border-slate-200', icon: Info };
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tight shadow-sm ${styles}`}>
            <Icon className="h-2 w-2" />
            <span className="truncate">{label}</span>
        </span>
    );
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, staff = [], clinicName, clinicType, operationMode = ClinicOperationMode.HYBRID_FULL, clinicData,
    onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onUpdateClinicSettings, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, onBulkUpdateStatus, 
    onAddStaff, onUpdateStaff, onDeleteStaff, addToast
}) => {
    const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'STAFF' | 'REPORTS' | 'APPOINTMENTS'>('QUEUE');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
    const [queueSubTab, setQueueSubTab] = useState<'ACTIVE' | 'HOLD' | 'COMPLETED' | 'SKIPPED'>('ACTIVE');
    const [filterDate, setFilterDate] = useState<string>(getLocalToday());
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

    // Feature Specific Modals
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    
    // Doctor Modal State
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

    // Patient History Deletion State
    const [patientHistoryToDelete, setPatientHistoryToDelete] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

    // Settings State
    const [activeSettingsTab, setActiveSettingsTab] = useState<'GENERAL' | 'LOCATION' | 'BRANDING'>('GENERAL');
    const [settingsForm, setSettingsForm] = useState<Partial<Clinic>>({});
    const [hoursRange, setHoursRange] = useState({ start: '09:00', end: '21:00' });
    const [newAmenity, setNewAmenity] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    // Appointment Config State
    const [apptConfig, setApptConfig] = useState<AppointmentConfig>({
        slotDuration: 15,
        bufferTime: 5,
        maxDaysInAdvance: 14,
        enableEmailNotifications: true,
        emailTemplate: 'Your appointment at {clinic_name} with {doctor_name} is confirmed for {date} at {time}.',
        lateArrivalThreshold: 10,
        lateArrivalAction: 'PENALTY'
    });

    useEffect(() => {
        if (clinicData?.appointmentConfig) {
            setApptConfig(prev => ({
                ...prev,
                ...clinicData.appointmentConfig
            }));
        }
    }, [clinicData]);

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Sync settings state when modal opens
    useEffect(() => {
        if (isSettingsModalOpen && clinicData) {
            const h = clinicData.operatingHours || '09:00 AM - 09:00 PM';
            let startVal = '09:00';
            let endVal = '21:00';
            
            if (h.toUpperCase() !== '24 HOURS' && h.includes(' - ')) {
                const [startPart, endPart] = h.split(' - ');
                startVal = parse12hTo24h(startPart);
                endVal = parse12hTo24h(endPart);
            } else if (h.toUpperCase() === '24 HOURS') {
                startVal = '00:00';
                endVal = '23:59';
            }

            setSettingsForm({
                name: clinicName,
                operationMode: clinicData.operationMode || operationMode,
                type: clinicData.type,
                about: clinicData.about || '',
                contactPhone: clinicData.contactPhone || '',
                address: clinicData.address || '',
                city: clinicData.city || '',
                pincode: clinicData.pincode || '',
                imageUrl: clinicData.imageUrl || '',
                amenities: clinicData.amenities || [],
                operatingHours: h,
                geoLocation: clinicData.geoLocation || { lat: 13.0827, lng: 80.2707 } 
            });
            setHoursRange({
                start: startVal,
                end: endVal
            });
            setActiveSettingsTab('GENERAL');
            setMapSearchQuery('');
        }
    }, [isSettingsModalOpen, clinicName, operationMode, clinicData, clinicType]);

    const handleSearchLocation = async () => {
        if (!mapSearchQuery) return;
        setIsSearchingLocation(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setSettingsForm(prev => ({ ...prev, geoLocation: { lat, lng: lon } }));
                addToast("Location found!", "success");
            } else {
                addToast("Location not found", "error");
            }
        } catch (e) {
            addToast("Error searching location", "error");
        } finally {
            setIsSearchingLocation(false);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            addToast("Geolocation not supported", "error");
            return;
        }
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setSettingsForm(prev => ({ 
                    ...prev, 
                    geoLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
                }));
                setIsDetectingLocation(false);
                addToast("Current location detected!", "success");
            },
            (err) => {
                setIsDetectingLocation(false);
                addToast("Could not detect location. Please check permissions.", "error");
            },
            { enableHighAccuracy: true }
        );
    };

    const estimatedTimes = useMemo(() => {
        const times: Record<string, number> = {};
        doctors.forEach(doc => {
            const docQueue = patients
                .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                .sort((a, b) => a.timeAdded - b.timeAdded); 
            
            let currentTime = Date.now();
            if (doc.status === DoctorStatus.ON_BREAK && doc.delayMinutes) {
                currentTime += doc.delayMinutes * 60000;
            }
            if (doc.delayMinutes && doc.status === DoctorStatus.AVAILABLE) {
                currentTime += doc.delayMinutes * 60000;
            }

            docQueue.forEach((p, index) => {
                times[p.id] = currentTime + (index * (doc.consultationTime || 15) * 60000);
            });
        });
        return times;
    }, [patients, doctors]);

    const sortPatients = (list: Patient[]) => {
        return list.sort((a, b) => {
            if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
            }
            if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
            const checkInA = a.isCheckedIn ? 1 : 0;
            const checkInB = b.isCheckedIn ? 1 : 0;
            if (checkInA !== checkInB) return checkInB - checkInA;
            return a.timeAdded - b.timeAdded;
        });
    };

    const filteredPatients = useMemo(() => {
        let list = patients.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate 
                ? p.appointmentDate 
                : new Date(p.timeAdded).toISOString().split('T')[0];
            return pDate === filterDate;
        });

        if (queueSubTab === 'ACTIVE') {
            list = list.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR);
        } else if (queueSubTab === 'HOLD') {
            list = list.filter(p => p.status === PatientStatus.ON_HOLD);
        } else if (queueSubTab === 'COMPLETED') {
            list = list.filter(p => p.status === PatientStatus.COMPLETED);
        } else if (queueSubTab === 'SKIPPED') {
            list = list.filter(p => p.status === PatientStatus.SKIPPED);
        }

        if (filterDoctorId !== 'ALL') {
            list = list.filter(p => p.doctorId === filterDoctorId);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.tokenNumber.toString().includes(q));
        }
        return sortPatients([...list]);
    }, [patients, queueSubTab, filterDoctorId, searchQuery, filterDate]);

    const subTabCounts = useMemo(() => {
        const dateFiltered = patients.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate 
                ? p.appointmentDate 
                : new Date(p.timeAdded).toISOString().split('T')[0];
            return pDate === filterDate;
        });
        const docFiltered = filterDoctorId === 'ALL' ? dateFiltered : dateFiltered.filter(p => p.doctorId === filterDoctorId);
        return {
            ACTIVE: docFiltered.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR).length,
            HOLD: docFiltered.filter(p => p.status === PatientStatus.ON_HOLD).length,
            COMPLETED: docFiltered.filter(p => p.status === PatientStatus.COMPLETED).length,
            SKIPPED: docFiltered.filter(p => p.status === PatientStatus.SKIPPED).length
        };
    }, [patients, filterDate, filterDoctorId]);

    const uniquePatients = useMemo(() => {
        const unique = new Map<string, Patient>();
        patients.forEach(p => {
            const key = `${p.phone}_${p.name.toLowerCase()}`;
            if (!unique.has(key)) unique.set(key, p);
            else if (p.timeAdded > unique.get(key)!.timeAdded) unique.set(key, p);
        });
        let list = Array.from(unique.values());
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
        }
        return list;
    }, [patients, searchQuery]);

    const isDoctorOnShift = (doc: Doctor, targetDate: string) => {
        const dayName = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = doc.weeklySchedule.find(s => s.day === dayName);
        if (!schedule || schedule.isOff || !schedule.slots?.length) return false;
        if (targetDate === getLocalToday()) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            return schedule.slots.some(slot => {
                const [sh, sm] = slot.startTime.split(':').map(Number);
                const [eh, em] = slot.endTime.split(':').map(Number);
                const sTotal = sh * 60 + sm;
                let eTotal = eh * 60 + em;
                if (eTotal <= sTotal) eTotal += 1440;
                return currentMins >= sTotal && currentMins < eTotal;
            });
        }
        return true; 
    };

    const doctorQueueStats = useMemo(() => {
        const activeDocs = doctors.filter(doc => isDoctorOnShift(doc, filterDate));
        return activeDocs.map(doc => {
            const queue = patients.filter(p => {
                const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
                return p.doctorId === doc.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD) && pDate === filterDate;
            });
            const current = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
            const next = sortPatients([...queue])[0] || null;
            const dayName = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = doc.weeklySchedule.find(s => s.day === dayName);
            const shiftTiming = schedule && !schedule.isOff && schedule.slots.length > 0 
                ? schedule.slots.map(s => `${format12h(s.startTime)} - ${format12h(s.endTime)}`).join(', ')
                : 'Off Duty';
            return { doc, count: queue.length, current, next, shiftTiming };
        });
    }, [doctors, patients, filterDate]);

    const handleSaveSettings = () => {
        const hString = `${format12h(hoursRange.start)} - ${format12h(hoursRange.end)}`;
        onUpdateClinicSettings({ ...settingsForm, operatingHours: hString });
        setIsSettingsModalOpen(false);
        addToast("Settings Updated", "success");
    };

    const handleUpdateApptConfig = (updates: Partial<AppointmentConfig>) => {
        const newConfig = { ...apptConfig, ...updates };
        setApptConfig(newConfig);
        onUpdateClinicSettings({ appointmentConfig: newConfig });
        addToast("Appointment Settings Updated", "success");
    };

    const handleAddAmenity = () => {
        if (!newAmenity || (settingsForm.amenities || []).includes(newAmenity)) return;
        setSettingsForm({ ...settingsForm, amenities: [...(settingsForm.amenities || []), newAmenity] });
        setNewAmenity('');
    };

    const handleRemoveAmenity = (name: string) => {
        setSettingsForm({ ...settingsForm, amenities: (settingsForm.amenities || []).filter(a => a !== name) });
    };

    const handleAddHoliday = () => {
        if (!newHolidayDate) return;
        const currentHolidays = clinicData?.holidays || [];
        if (currentHolidays.includes(newHolidayDate)) {
            addToast("Date already blocked", "warning");
            return;
        }
        onUpdateClinicSettings({ holidays: [...currentHolidays, newHolidayDate] });
        setNewHolidayDate('');
        addToast("Holiday added to calendar", "success");
    };

    const handleRemoveHoliday = (date: string) => {
        const currentHolidays = clinicData?.holidays || [];
        onUpdateClinicSettings({ holidays: currentHolidays.filter(h => h !== date) });
        addToast("Date removed from holidays", "info");
    };

    // Mobile Navigation Configuration
    const mobileNavItems = [
        { id: 'QUEUE', label: 'Queue', icon: List },
        { id: 'DATABASE', label: 'Patients', icon: Database },
        { id: 'DOCTORS', label: 'Doctors', icon: Stethoscope },
        { id: 'APPOINTMENTS', label: 'Appts', icon: CalendarClock },
        { id: 'REPORTS', label: 'Reports', icon: BarChart3 }
    ];

    return (
        <div className="h-full flex flex-col bg-slate-50 w-full max-w-[100vw] overflow-hidden">
            {/* COMPACT TOP HEADER */}
            <div className="flex flex-col flex-shrink-0 bg-white shadow-sm z-30 w-full border-b border-slate-100">
                <div className="px-4 sm:px-6 py-1.5 sm:py-2 flex justify-between items-center">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="lg:hidden">
                            <Logo className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-base font-black text-slate-900 truncate tracking-tight">{clinicName}</h1>
                                <button onClick={() => setIsSettingsModalOpen(true)} className="text-slate-300 hover:text-slate-600 p-1 transition-all"><Settings className="h-3 w-3" /></button>
                            </div>
                            <div className="hidden sm:flex flex-wrap gap-1.5 mt-0.5 text-[8px] text-slate-400 items-center font-bold uppercase tracking-wider">
                                <span className="text-slate-900 bg-slate-100 px-1 py-0.5 rounded flex items-center gap-1 flex-shrink-0 font-mono">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {clinicData?.operatingHours && (
                                    <span className="text-slate-500 bg-slate-50 px-1 py-0.5 rounded flex items-center gap-1 flex-shrink-0 border border-slate-100">
                                        <Clock className="h-2 w-2" /> {clinicData.operatingHours}
                                    </span>
                                )}
                                <OperationModeBadge mode={clinicData?.operationMode || operationMode} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <Button onClick={() => setIsPatientModalOpen(true)} size="sm" className="bg-primary-600 hover:bg-primary-700 text-white font-black shadow-md shadow-primary-100 flex items-center gap-1.5 px-3 sm:px-4 h-7 rounded-lg text-[10px]">
                            <Plus className="h-3 w-3" /> <span className="hidden xs:inline">Add Patient</span><span className="xs:hidden">Add</span>
                        </Button>
                        
                        {/* Desktop Tab Bar */}
                        <div className="hidden lg:flex gap-1 bg-slate-100 p-1 rounded-xl ml-4">
                            {mobileNavItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)} 
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${activeTab === item.id ? 'bg-white shadow-sm text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <item.icon className="h-2.5" /> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sub-header for Date selection in Queue tab */}
                {activeTab === 'QUEUE' && (
                    <div className="bg-white border-t border-slate-100 w-full">
                        <div className="px-4 sm:px-6 py-1 bg-slate-50/30 flex items-center gap-3 overflow-x-auto no-scrollbar">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Viewing:</span>
                            <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm flex-shrink-0">
                                <button onClick={() => setFilterDate(getLocalToday())} className={`px-3 py-0.5 rounded-md text-[9px] font-black transition-all ${filterDate === getLocalToday() ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Today</button>
                                <button onClick={() => setFilterDate(getLocalTomorrow())} className={`px-3 py-0.5 rounded-md text-[9px] font-black transition-all ${filterDate === getLocalTomorrow() ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Tomorrow</button>
                            </div>
                            <div className="relative flex-shrink-0">
                                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 text-slate-400" />
                                <input 
                                    type="date" 
                                    value={filterDate} 
                                    onChange={(e) => setFilterDate(e.target.value)} 
                                    className="pl-6 pr-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black focus:ring-2 focus:ring-primary-500 outline-none w-28 shadow-sm" 
                                />
                            </div>
                        </div>

                        {/* Doctor Quick Cards - More Compact */}
                        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar bg-white snap-x snap-mandatory scroll-smooth border-b border-slate-100 shadow-inner">
                            <button 
                                onClick={() => setFilterDoctorId('ALL')} 
                                className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between h-14 min-w-[100px] flex-shrink-0 snap-center ${filterDoctorId === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/10' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 hover:shadow-sm'}`}
                            >
                                <div>
                                    <div className="font-black text-[8px] uppercase tracking-tighter leading-none">All Doctors</div>
                                </div>
                                <div className="mt-auto flex justify-between items-end">
                                    <div className="text-xl font-black tracking-tighter leading-none">{patients.filter(p => p.status === PatientStatus.WAITING && (p.appointmentDate === filterDate || (p.visitType === 'WALK_IN' && filterDate === getLocalToday()))).length}</div>
                                    <div className="text-[7px] uppercase font-black tracking-widest mb-0.5 opacity-60">Wait</div>
                                </div>
                            </button>
                            
                            {doctorQueueStats.map(({ doc, current, next, count, shiftTiming }) => {
                                const isSelected = filterDoctorId === doc.id;
                                return (
                                    <button 
                                        key={doc.id} 
                                        onClick={() => setFilterDoctorId(isSelected ? 'ALL' : doc.id)} 
                                        className={`p-2 rounded-xl border transition-all text-left relative flex flex-col h-14 min-w-[140px] flex-shrink-0 justify-between snap-center ${isSelected ? 'bg-white border-primary-500 ring-2 ring-primary-500/10 shadow-md z-10' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-start gap-1.5">
                                            <div className="relative flex-shrink-0">
                                                <img src={doc.avatarUrl} className="w-5 h-5 rounded-lg object-cover border border-slate-100" />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-[1px] border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-slate-900 text-[9px] truncate leading-tight">{doc.name.split(' ').pop()}</div>
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="grid grid-cols-3 gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                                <div className="bg-white rounded-md p-0.5 flex flex-col items-center">
                                                    <div className="text-[5px] font-black text-slate-300 uppercase leading-none">Now</div>
                                                    <div className={`text-[8px] font-black ${current ? 'text-blue-600' : 'text-slate-200'}`}>{current ? `#${current.tokenNumber}` : '--'}</div>
                                                </div>
                                                <div className="bg-white rounded-md p-0.5 flex flex-col items-center">
                                                    <div className="text-[5px] font-black text-slate-300 uppercase leading-none">Next</div>
                                                    <div className={`text-[8px] font-black ${next ? 'text-indigo-600' : 'text-slate-200'}`}>{next ? `#${next.tokenNumber}` : '--'}</div>
                                                </div>
                                                <div className={`rounded-md p-0.5 flex flex-col items-center ${count > 0 ? 'bg-primary-600' : 'bg-slate-200'}`}>
                                                    <div className={`text-[5px] font-black uppercase leading-none ${count > 0 ? 'text-primary-200' : 'text-slate-400'}`}>Q</div>
                                                    <div className={`text-[8px] font-black ${count > 0 ? 'text-white' : 'text-slate-400'}`}>{count}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-slate-100 pb-20 lg:pb-0 flex flex-col">
                {activeTab === 'QUEUE' && (
                    <>
                        <div className="px-4 sm:px-6 py-0.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 gap-4 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                                <button onClick={() => setQueueSubTab('ACTIVE')} className={`px-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${queueSubTab === 'ACTIVE' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Activity className="h-3" /> Live ({subTabCounts.ACTIVE})</button>
                                <button onClick={() => setQueueSubTab('HOLD')} className={`px-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${queueSubTab === 'HOLD' ? 'border-orange-500 text-orange-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><PauseCircle className="h-3" /> Hold ({subTabCounts.HOLD})</button>
                                <button onClick={() => setQueueSubTab('COMPLETED')} className={`px-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${queueSubTab === 'COMPLETED' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><CheckCircle2 className="h-3" /> Done ({subTabCounts.COMPLETED})</button>
                                <button onClick={() => setQueueSubTab('SKIPPED')} className={`px-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${queueSubTab === 'SKIPPED' ? 'border-rose-500 text-rose-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><UserX className="h-3" /> Absent ({subTabCounts.SKIPPED})</button>
                            </div>
                            <div className="relative group w-40 sm:w-48 hidden xs:block"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 text-slate-300" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold outline-none w-full transition-all focus:bg-white" /></div>
                        </div>
                        <QueueTable patients={filteredPatients} doctors={doctors} estimatedTimes={estimatedTimes} isFiltered={searchQuery !== '' || filterDoctorId !== 'ALL'} nextUpPatientIds={new Set(doctorQueueStats.map(s => s.next?.id).filter(Boolean) as string[])} onUpdateStatus={onUpdateStatus} onManualReorder={onManualReorder} onDragDrop={onDragDrop} onManualCheckIn={onManualCheckIn} onEditPatient={setEditingPatient} onVitalsClick={setVitalsPatient} onToggleEmergency={onToggleEmergency} onNoShowPatient={(id) => onUpdateStatus(id, PatientStatus.SKIPPED)} />
                    </>
                )}
                {activeTab === 'DATABASE' && <PatientDatabaseTable patients={uniquePatients} doctors={doctors} onHistoryClick={setHistoryPatient} onEditClick={setEditingPatient} onDeleteClick={setPatientHistoryToDelete} />}
                {activeTab === 'DOCTORS' && <DoctorManager doctors={doctors} onAddDoctor={() => { setDoctorModalMode('ADD'); setEditingDoctorData(undefined); setIsDoctorModalOpen(true); }} onEditDoctor={(doc) => { setDoctorModalMode('EDIT'); setEditingDoctorId(doc.id); setEditingDoctorData(doc); setIsDoctorModalOpen(true); }} onDeleteDoctor={onDeleteDoctor} onAddPresetSlot={() => {}} onStatusChange={(id, status) => onEditDoctor(id, { status })} />}
                {activeTab === 'STAFF' && onAddStaff && onUpdateStaff && onDeleteStaff && <StaffManager staff={staff} onAddStaff={onAddStaff} onUpdateStaff={onUpdateStaff} onDeleteStaff={onDeleteStaff} />}
                {activeTab === 'REPORTS' && <ReceptionStats patients={patients} doctors={doctors} />}
                {activeTab === 'APPOINTMENTS' && (
                    <div className="p-4 sm:p-8 overflow-y-auto h-full custom-scrollbar animate-in fade-in pb-32">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Appointment Settings <CalendarClock className="h-6 sm:h-8 w-6 sm:w-8 text-primary-600" />
                                </h2>
                                <p className="text-slate-500 font-medium mt-1 text-sm">Configure slot logic and automated patient alerts.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CARD: Scheduling Parameters */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock3 className="h-4 w-4" /> Scheduling Logic
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Default Slot Duration</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[10, 15, 20, 30].map(mins => (
                                                    <button 
                                                        key={mins}
                                                        onClick={() => handleUpdateApptConfig({ slotDuration: mins })}
                                                        className={`py-2 rounded-xl text-xs font-black transition-all border ${apptConfig.slotDuration === mins ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Buffer Time (m)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                                    value={apptConfig.bufferTime}
                                                    onChange={e => handleUpdateApptConfig({ bufferTime: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Lead Time (Days)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                                    value={apptConfig.maxDaysInAdvance}
                                                    onChange={e => handleUpdateApptConfig({ maxDaysInAdvance: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3">
                                        <Info className="h-5 w-5 text-primary-600 flex-shrink-0" />
                                        <p className="text-[11px] text-primary-800 leading-relaxed font-medium">
                                            These settings apply globally to all new appointments. Doctors can still override individual consultation times in their dashboard.
                                        </p>
                                    </div>
                                </div>

                                {/* CARD: Communication & Alerts */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Bell className="h-4 w-4" /> Automation & Alerts
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                                                <p className="text-[10px] text-slate-500">Auto-send confirmation and reminders</p>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateApptConfig({ enableEmailNotifications: !apptConfig.enableEmailNotifications })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${apptConfig.enableEmailNotifications ? 'bg-primary-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${apptConfig.enableEmailNotifications ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <MessageSquare className="h-3 w-3" /> Confirmation Template
                                            </label>
                                            <textarea 
                                                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-primary-500 outline-none resize-none leading-relaxed"
                                                value={apptConfig.emailTemplate}
                                                onChange={e => handleUpdateApptConfig({ emailTemplate: e.target.value })}
                                                placeholder="Enter message template..."
                                            />
                                            <div className="flex flex-wrap gap-1.5">
                                                {['{patient_name}', '{doctor_name}', '{date}', '{time}'].map(tag => (
                                                    <span key={tag} className="text-[9px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded-lg cursor-default hover:text-primary-600 transition-colors">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD: SaaS Value Add - No Show Policy */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" /> Late Arrival Policy
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Automate how the queue treats patients who arrive late for their confirmed slots.</p>
                                    
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Threshold</p>
                                            <p className="text-xl font-black text-slate-900">{apptConfig.lateArrivalThreshold}m</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Action</p>
                                            <p className="text-xs font-black text-primary-600 uppercase">
                                                {apptConfig.lateArrivalAction === 'PENALTY' ? 'Penalty Pos.' : apptConfig.lateArrivalAction === 'SKIP' ? 'Auto-Skip' : 'Notify only'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => setIsPolicyModalOpen(true)}
                                            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
                                        >
                                            Customize Policy
                                        </button>
                                    </div>
                                </div>

                                {/* CARD: Holiday Sync */}
                                <div className="bg-gradient-to-br from-indigo-600 to-primary-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-black opacity-60 uppercase tracking-widest mb-4">Integrations</h3>
                                        <h4 className="text-xl font-bold mb-2">Clinic Holiday Sync</h4>
                                        <p className="text-xs opacity-80 leading-relaxed">Bulk block all doctor slots for public holidays or clinic maintenance events with one tap.</p>
                                    </div>
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => setIsHolidayModalOpen(true)}
                                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            <Calendar className="h-4 w-4" /> Manage Calendar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY BOTTOM NAVIGATION FOR MOBILE/TABLET */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[40] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
                <div className="flex justify-around items-center h-16 sm:h-20">
                    {mobileNavItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button 
                                key={item.id} 
                                onClick={() => setActiveTab(item.id as any)} 
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600`}
                    >
                        <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight opacity-70">Admin</span>
                    </button>
                </div>
            </div>

            {/* Late Arrival Policy Modal */}
            <Modal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} title="Late Arrival Logic" maxWidth="max-w-md">
                <div className="space-y-6">
                    <p className="text-sm text-slate-500">Configure how the automated queue system handles patients who arrive after their scheduled time slot.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Late Threshold (Minutes)</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                value={apptConfig.lateArrivalThreshold}
                                onChange={e => setApptConfig({ ...apptConfig, lateArrivalThreshold: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-[10px] text-slate-400 mt-1.5 italic">Example: If threshold is 10m, a 10:00 AM patient becomes "Late" at 10:11 AM.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Automated Action</label>
                            <div className="space-y-2">
                                {[
                                    { id: 'PENALTY', label: 'Penalty Position', desc: 'Move patient 5 spots back in the queue.' },
                                    { id: 'SKIP', label: 'Auto-Skip', desc: 'Mark patient as No-Show and remove from queue.' },
                                    { id: 'NOTIFY', label: 'Notify Only', desc: 'Just highlight the patient on dashboard.' }
                                ].map(action => (
                                    <button 
                                        key={action.id}
                                        onClick={() => setApptConfig({ ...apptConfig, lateArrivalAction: action.id as any })}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${apptConfig.lateArrivalAction === action.id ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className={`p-2 rounded-full ${apptConfig.lateArrivalAction === action.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {apptConfig.lateArrivalAction === action.id ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${apptConfig.lateArrivalAction === action.id ? 'text-primary-900' : 'text-slate-800'}`}>{action.label}</div>
                                            <div className="text-[10px] text-slate-500">{action.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsPolicyModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => { handleUpdateApptConfig(apptConfig); setIsPolicyModalOpen(false); }}>Save Policy</Button>
                    </div>
                </div>
            </Modal>

            {/* Holiday Sync Modal */}
            <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Clinic Holiday Calendar" maxWidth="max-w-md">
                <div className="space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                        <Info className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                        <p className="text-xs text-indigo-800 leading-relaxed">
                            Blocking a date will automatically cancel all existing appointments and disable slot booking for all doctors in this clinic for that day.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                value={newHolidayDate}
                                min={getLocalToday()}
                                onChange={e => setNewHolidayDate(e.target.value)}
                            />
                            <Button onClick={handleAddHoliday} disabled={!newHolidayDate}>
                                <Plus className="h-4 w-4 mr-1.5" /> Block Date
                            </Button>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upcoming Holidays / Closures</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {(clinicData?.holidays || []).length > 0 ? (
                                    clinicData?.holidays?.sort().map(h => (
                                        <div key={h} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-indigo-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <CalendarX className="h-4 w-4 text-rose-500" />
                                                <span className="text-sm font-bold text-slate-700">
                                                    {new Date(h).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveHoliday(h)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400 italic text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        No holidays scheduled.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button variant="secondary" onClick={() => setIsHolidayModalOpen(false)}>Close Calendar</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Clinic Configuration" maxWidth="max-w-4xl">
                <div className="flex border-b border-slate-200 mb-6 sticky top-0 bg-white z-10">
                    <button onClick={() => setActiveSettingsTab('GENERAL')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'GENERAL' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}>General Info</button>
                    <button onClick={() => setActiveSettingsTab('LOCATION')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'LOCATION' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}>Location & Map</button>
                    <button onClick={() => setActiveSettingsTab('BRANDING')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'BRANDING' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}>Branding & Amenities</button>
                </div>

                <div className="space-y-6">
                    {activeSettingsTab === 'GENERAL' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Clinic Name" value={settingsForm.name || ''} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} />
                                <Input label="Contact Phone" value={settingsForm.contactPhone || ''} onChange={e => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="h-3" /> Opens At</label>
                                    <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" value={hoursRange.start} onChange={e => setHoursRange({ ...hoursRange, start: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="h-3" /> Closes At</label>
                                    <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" value={hoursRange.end} onChange={e => setHoursRange({ ...hoursRange, end: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Clinic About / Description</label>
                                <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm min-h-[100px] outline-none focus:ring-1 focus:ring-primary-500" value={settingsForm.about || ''} onChange={e => setSettingsForm({ ...settingsForm, about: e.target.value })} placeholder="Briefly describe your clinic..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Operational Mode</label>
                                <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white" value={settingsForm.operationMode} onChange={e => setSettingsForm({ ...settingsForm, operationMode: e.target.value as ClinicOperationMode })}>
                                    {Object.values(ClinicOperationMode).map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeSettingsTab === 'LOCATION' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="City" value={settingsForm.city || ''} onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })} />
                                <Input label="Pincode" value={settingsForm.pincode || ''} onChange={e => setSettingsForm({ ...settingsForm, pincode: e.target.value })} />
                            </div>
                            <Input label="Full Address" value={settingsForm.address || ''} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                            
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <Navigation2 className="h-4 w-4 text-primary-600" /> Precise Coordinates
                                    </label>
                                    <button 
                                        onClick={handleDetectLocation} 
                                        disabled={isDetectingLocation}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-white border border-primary-100 px-3 py-1.5 rounded-lg shadow-sm hover:bg-primary-50 transition-all flex items-center gap-2"
                                    >
                                        {isDetectingLocation ? <div className="h-3 w-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div> : <Crosshair className="h-3 w-3" />}
                                        Detect My Location
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                                        <input 
                                            type="number" 
                                            step="0.000001"
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={settingsForm.geoLocation?.lat || ''}
                                            onChange={e => setSettingsForm({ ...settingsForm, geoLocation: { ...settingsForm.geoLocation!, lat: parseFloat(e.target.value) || 0 } })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                                        <input 
                                            type="number" 
                                            step="0.000001"
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={settingsForm.geoLocation?.lng || ''}
                                            onChange={e => setSettingsForm({ ...settingsForm, geoLocation: { ...settingsForm.geoLocation!, lng: parseFloat(e.target.value) || 0 } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Globe className="h-4" /> Pin Location on Map</label>
                                <div className="flex gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Search locality, street..." 
                                            value={mapSearchQuery} 
                                            onChange={e => setMapSearchQuery(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && handleSearchLocation()} 
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleSearchLocation} isLoading={isSearchingLocation} variant="secondary">Search</Button>
                                </div>
                                <div className="h-[300px] rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                                    <MapContainer center={[settingsForm.geoLocation?.lat || 13.0827, settingsForm.geoLocation?.lng || 80.2707]} zoom={14} className="h-full w-full">
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <MapUpdater center={[settingsForm.geoLocation?.lat || 13.0827, settingsForm.geoLocation?.lng || 80.2707]} />
                                        <MapClickHandler onLocationSelect={(lat, lng) => setSettingsForm({ ...settingsForm, geoLocation: { lat, lng } })} />
                                        {settingsForm.geoLocation && (
                                            <DraggableSettingsMarker 
                                                position={[settingsForm.geoLocation.lat, settingsForm.geoLocation.lng]} 
                                                onDragEnd={(lat, lng) => setSettingsForm({ ...settingsForm, geoLocation: { lat, lng } })}
                                            />
                                        )}
                                    </MapContainer>
                                    <div className="absolute bottom-2 left-2 z-[400] bg-white/90 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-600 shadow-sm border border-slate-200 flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span>Lat: {settingsForm.geoLocation?.lat.toFixed(6)}</span>
                                            <span>Lng: {settingsForm.geoLocation?.lng.toFixed(6)}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Drag the pin or click on the map to set the exact clinic entrance.</p>
                            </div>
                        </div>
                    )}

                    {activeSettingsTab === 'BRANDING' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Clinic Image URL</label>
                                <div className="flex gap-4 items-center">
                                    <div className="w-24 h-24 bg-slate-100 rounded-2xl border border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                                        {settingsForm.imageUrl ? <img src={settingsForm.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 text-slate-300" />}
                                    </div>
                                    <Input placeholder="https://image-url.com/clinic.jpg" value={settingsForm.imageUrl || ''} onChange={e => setSettingsForm({ ...settingsForm, imageUrl: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Amenities & Facilities</label>
                                <div className="flex gap-2">
                                    <Input placeholder="e.g. WiFi, Parking, Pharmacy" value={newAmenity} onChange={e => setNewAmenity(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAmenity()} />
                                    <Button onClick={handleAddAmenity} variant="secondary"><Plus className="h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {(settingsForm.amenities || []).map(a => (
                                        <span key={a} className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl border border-primary-100 text-xs font-bold flex items-center gap-2 group">
                                            {a}
                                            <button onClick={() => handleRemoveAmenity(a)} className="text-primary-300 hover:text-primary-600 transition-colors"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                    {(!settingsForm.amenities || settingsForm.amenities.length === 0) && <p className="text-xs text-slate-400 italic">No amenities added.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
                    <Button variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSettings} className="px-10 shadow-lg shadow-primary-200">Save Clinic Config</Button>
                </div>
            </Modal>

            <AddPatientModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onAdd={onAddPatient} doctors={doctors} patients={patients} addToast={addToast} />
            <DoctorFormModal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} mode={doctorModalMode} initialData={editingDoctorData} onSave={(data) => {
                if (doctorModalMode === 'ADD') onAddDoctor(data.name, data.specialty, data.room, data.schedule, data.mobile, data.regNo, data.masterId, data.avatarUrl, parseFloat(data.fee), parseFloat(data.consultationTime));
                else if (editingDoctorId) onEditDoctor(editingDoctorId, { ...data, weeklySchedule: data.schedule, consultationFee: parseFloat(data.fee), consultationTime: parseFloat(data.consultationTime) });
            }} onCheckMasterDoctor={onCheckMasterDoctor} addToast={addToast} />
            
            <ConfirmationModal isOpen={!!doctorToDelete} onClose={() => setDoctorToDelete(null)} onConfirm={() => { if(doctorToDelete) { onDeleteDoctor(doctorToDelete.id); setDoctorToDelete(null); } }} title="Remove Doctor?" message={`Remove Dr. ${doctorToDelete?.name}?`} confirmLabel="Remove" variant="danger" />
            <ConfirmationModal isOpen={!!patientHistoryToDelete} onClose={() => setPatientHistoryToDelete(null)} onConfirm={() => { if(patientHistoryToDelete) { const ids = patients.filter(pat => pat.phone === patientHistoryToDelete.phone).map(pat => pat.id); onDeleteMultiplePatients(ids); setPatientHistoryToDelete(null); addToast(`History for ${patientHistoryToDelete.name} deleted`, 'info'); } }} title="Delete Patient History?" message={`Permanently delete records for ${patientHistoryToDelete?.name}?`} confirmLabel="Delete" variant="danger" />
            
            <Modal isOpen={!!editingPatient} onClose={() => setEditingPatient(null)} title="Edit Patient Profile" maxWidth="max-w-md">
                {editingPatient && (
                    <form onSubmit={(e) => { e.preventDefault(); onEditPatient(editingPatient.id, { name: editingPatient.name, phone: editingPatient.phone, age: editingPatient.age, gender: editingPatient.gender }); setEditingPatient(null); addToast('Patient updated', 'success'); }} className="space-y-4">
                        <Input label="Name" value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Phone" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} required />
                            <Input label="Age" value={editingPatient.age || ''} onChange={e => setEditingPatient({...editingPatient, age: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setEditingPatient(null)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!vitalsPatient} onClose={() => setVitalsPatient(null)} title="Vitals Recording" maxWidth="max-w-2xl">
                {vitalsPatient && (
                    <form onSubmit={(e) => { e.preventDefault(); onEditPatient(vitalsPatient.id, { vitals: vitalsPatient.vitals }); setVitalsPatient(null); addToast('Vitals recorded', 'success'); }} className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <Input label="BP" placeholder="120/80" value={vitalsPatient.vitals?.bp || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, bp: e.target.value}})} />
                            <Input label="Temp (°F)" placeholder="98.6" value={vitalsPatient.vitals?.temp || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, temp: e.target.value}})} />
                            <Input label="Pulse (bpm)" placeholder="72" value={vitalsPatient.vitals?.pulse || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, pulse: e.target.value}})} />
                            <Input label="SpO2 (%)" placeholder="98" value={vitalsPatient.vitals?.spo2 || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, spo2: e.target.value}})} />
                            <Input label="Weight (kg)" placeholder="70" value={vitalsPatient.vitals?.weight || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, weight: e.target.value}})} />
                            <Input label="Height" placeholder="170cm" value={vitalsPatient.vitals?.height || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, height: e.target.value}})} />
                            <div className="col-span-2">
                                <Input label="Blood Sugar (mg/dL)" placeholder="100" value={vitalsPatient.vitals?.sugar || ''} onChange={e => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, sugar: e.target.value}})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={() => setVitalsPatient(null)}>Cancel</Button><Button type="submit">Update Vitals</Button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} title="Visit History" maxWidth="max-w-2xl">
                {historyPatient && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {patients.filter(p => p.phone === historyPatient.phone).sort((a,b) => b.timeAdded - a.timeAdded).map(visit => (
                            <div key={visit.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(visit.timeAdded).toLocaleDateString()}</div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${visit.status === PatientStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{visit.status}</span>
                                </div>
                                <div className="font-bold text-slate-800 text-sm mb-1">Dr. {doctors.find(d => d.id === visit.doctorId)?.name}</div>
                                {visit.notes && <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 mt-2">"{visit.notes}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};
