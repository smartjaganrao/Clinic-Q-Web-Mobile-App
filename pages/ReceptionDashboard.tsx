
// ... existing imports ...
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, Staff, ClinicOperationMode, Clinic } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp, Users, MapPin, Settings, Footprints, CalendarClock, Shuffle, Building2, ImageIcon, Plus, X, Globe, Crosshair
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

// ... (KEEP ALL MAP COMPONENTS & INTERFACES) ...
// --- MAP COMPONENTS ---
const DefaultIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: #ef4444; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);"></div>`,
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
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
};

interface ReceptionDashboardProps {
    doctors: Doctor[];
    patients: Patient[];
    staff?: Staff[];
    clinicName: string;
    clinicType?: ClinicType;
    operationMode?: ClinicOperationMode; 
    clinicData?: Clinic; // Pass full clinic data for settings
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
    // Staff Props
    onAddStaff?: (staff: Staff) => void;
    onUpdateStaff?: (id: string, updates: Partial<Staff>) => void;
    onDeleteStaff?: (id: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const COMMON_AMENITIES = [
  'Pharmacy', 'Pathology Lab', 'X-Ray', 'Ultrasound',
  'Parking', 'Wheelchair Access', 'Wifi', 'Cafeteria',
  'Ambulance', '24x7 Emergency', 'ICU', 'Operation Theater'
];

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, staff = [], clinicName, clinicType, operationMode = ClinicOperationMode.HYBRID_FULL, clinicData,
    onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onCancelPatient, onUpdateClinicSettings, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, onBulkUpdateStatus, 
    onAddStaff, onUpdateStaff, onDeleteStaff, addToast
}) => {
    const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'STAFF' | 'REPORTS'>('QUEUE');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // 'ACTIVE', 'ALL', 'WAITING', 'WITH_DOCTOR'
    const [filterType, setFilterType] = useState<string>('ALL');

    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // Settings Modal
    
    // Doctor Modal State
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

    // Edit Patient Modal
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

    // Settings State
    const [activeSettingsTab, setActiveSettingsTab] = useState<'GENERAL' | 'LOCATION' | 'BRANDING'>('GENERAL');
    const [settingsForm, setSettingsForm] = useState<Partial<Clinic>>({});
    const [newAmenity, setNewAmenity] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);

    // Deck State
    const [isDeckExpanded, setIsDeckExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync settings state when modal opens
    useEffect(() => {
        if (isSettingsModalOpen && clinicData) {
            setSettingsForm({
                name: clinicName,
                operationMode: operationMode,
                type: clinicData.type,
                about: clinicData.about || '',
                contactPhone: clinicData.contactPhone || '',
                address: clinicData.address || '',
                city: clinicData.city || '',
                pincode: clinicData.pincode || '',
                imageUrl: clinicData.imageUrl || '',
                amenities: clinicData.amenities || [],
                operatingHours: clinicData.operatingHours || '09:00 AM - 09:00 PM',
                geoLocation: clinicData.geoLocation || { lat: 13.0827, lng: 80.2707 } // Default Chennai if missing
            });
            setActiveSettingsTab('GENERAL');
            setMapSearchQuery('');
        } else if (isSettingsModalOpen) {
            // Fallback if clinicData not passed (should ideally be passed)
            setSettingsForm({
                name: clinicName,
                operationMode: operationMode,
                type: clinicType,
                geoLocation: { lat: 13.0827, lng: 80.2707 }
            });
        }
    }, [isSettingsModalOpen, clinicName, operationMode, clinicData, clinicType]);

    // ... (Keep existing handlers for Map, Doctors, Patients) ...
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

    // Estimated Times Calculation
    const estimatedTimes = useMemo(() => {
        const times: Record<string, number> = {};
        doctors.forEach(doc => {
            const docQueue = patients
                .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                .sort((a, b) => a.timeAdded - b.timeAdded); // Simple FIFO for estimation
            
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

    // Helper: Unified Sorting Logic
    const sortPatients = (list: Patient[]) => {
        return list.sort((a, b) => {
            if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
            }
            if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
            
            if (a.isEmergency && b.isEmergency) {
                const hasNokA = a.nextOfKin?.name && a.nextOfKin?.phone;
                const hasNokB = b.nextOfKin?.name && b.nextOfKin?.phone;
                if (hasNokA !== hasNokB) return hasNokA ? 1 : -1; 
            }

            // NEW: Prioritize Checked In
            const checkInA = a.isCheckedIn ? 1 : 0;
            const checkInB = b.isCheckedIn ? 1 : 0;
            if (checkInA !== checkInB) return checkInB - checkInA;

            const getStatusPriority = (s: PatientStatus) => {
                if (s === PatientStatus.ON_HOLD) return 0;
                if (s === PatientStatus.WAITING) return 1;
                return 2;
            };
            const priorityA = getStatusPriority(a.status);
            const priorityB = getStatusPriority(b.status);
            if (priorityA !== priorityB) return priorityA - priorityB;
            const getSortTime = (p: Patient) => {
                if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
                    return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
                }
                return p.timeAdded;
            };
            return getSortTime(a) - getSortTime(b);
        });
    };

    // Derived Lists
    const filteredPatients = useMemo(() => {
        let list = patients;

        // 1. Status Filter
        if (filterStatus === 'ACTIVE') {
            list = list.filter(p => p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED);
        } else if (filterStatus !== 'ALL') {
            list = list.filter(p => p.status === filterStatus);
        }

        // 2. Doctor Filter
        if (filterDoctorId !== 'ALL') {
            list = list.filter(p => p.doctorId === filterDoctorId);
        }

        // 3. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.tokenNumber.toString().includes(q));
        }

        // Use sophisticated sorting
        return sortPatients([...list]);
    }, [patients, filterStatus, filterDoctorId, searchQuery]);

    const uniquePatients = useMemo(() => {
        const unique = new Map<string, Patient>();
        patients.forEach(p => {
            const key = `${p.phone}_${p.name.toLowerCase()}`;
            if (!unique.has(key)) {
                unique.set(key, p);
            } else {
                if (p.timeAdded > unique.get(key)!.timeAdded) {
                    unique.set(key, p);
                }
            }
        });
        let list = Array.from(unique.values());
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
        }
        return list;
    }, [patients, searchQuery]);

    const nextUpPatientIds = useMemo(() => {
        const ids = new Set<string>();
        doctors.forEach(doc => {
            const queue = patients
                .filter(p => p.doctorId === doc.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD));
            const sortedQueue = sortPatients([...queue]);
            if (sortedQueue.length > 0) ids.add(sortedQueue[0].id);
        });
        return ids;
    }, [patients, doctors]);

    const doctorQueueStats = useMemo(() => {
        return doctors.map(doc => {
            const queue = patients.filter(p => p.doctorId === doc.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD));
            const current = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
            const sortedQueue = sortPatients([...queue]);
            const next = sortedQueue.length > 0 ? sortedQueue[0] : null;
            return { doc, count: queue.length, current, next };
        });
    }, [doctors, patients]);

    // Sorted Deck Logic
    const sortedDeckStats = useMemo(() => {
        // Return original order to prevent layout shifts on selection
        return [...doctorQueueStats];
    }, [doctorQueueStats]);

    const visibleDeckStats = useMemo(() => {
        if (isDeckExpanded) return sortedDeckStats;
        // Collapsed logic: Mobile shows 1 doctor (+ All), Desktop shows 5 (+ All)
        const limit = isMobile ? 1 : 5;
        return sortedDeckStats.slice(0, limit);
    }, [sortedDeckStats, isDeckExpanded, isMobile]);

    const hiddenDeckCount = sortedDeckStats.length - visibleDeckStats.length;

    // Handlers
    const clearFilters = () => {
        setSearchQuery('');
        setFilterDoctorId('ALL');
        setFilterStatus('ACTIVE');
        setFilterType('ALL');
    };

    const handleLocalDragDrop = (draggedId: string, targetId: string) => {
        onDragDrop(draggedId, targetId);
    };

    const handleSaveDoctor = (data: any) => {
        if (doctorModalMode === 'ADD') {
            onAddDoctor(data.name, data.specialty, data.room, data.schedule, data.mobile, data.regNo, data.masterId, data.avatarUrl, parseFloat(data.fee), parseFloat(data.consultationTime));
        } else if (editingDoctorId) {
            onEditDoctor(editingDoctorId, {
                ...data,
                weeklySchedule: data.schedule, // CRITICAL FIX: Map schedule to weeklySchedule
                consultationFee: parseFloat(data.fee),
                consultationTime: parseFloat(data.consultationTime)
            });
        }
    };

    const handleAddPresetSlot = (doctorId: string, day: string) => {
        const doc = doctors.find(d => d.id === doctorId);
        if (doc) {
            const newSchedule = doc.weeklySchedule.map(s => {
                if (s.day === day) {
                    return {
                        ...s,
                        isOff: false,
                        slots: [...(s.slots || []), { startTime: '09:00', endTime: '13:00', active: true, label: 'Morning' }]
                    };
                }
                return s;
            });
            onEditDoctor(doctorId, { weeklySchedule: newSchedule });
            addToast('Morning slot added', 'success');
        }
    };

    const handleSaveEditedPatient = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPatient) {
            onEditPatient(editingPatient.id, {
                name: editingPatient.name,
                age: editingPatient.age,
                gender: editingPatient.gender,
                phone: editingPatient.phone,
                address: editingPatient.address,
                city: editingPatient.city,
                country: editingPatient.country
            });
            setEditingPatient(null);
            addToast('Patient updated', 'success');
        }
    };

    const handleSaveVitals = (e: React.FormEvent) => {
        e.preventDefault();
        if (vitalsPatient) {
            onEditPatient(vitalsPatient.id, { vitals: vitalsPatient.vitals });
            setVitalsPatient(null);
            addToast('Vitals recorded', 'success');
        }
    };

    const handleSaveSettings = () => {
        onUpdateClinicSettings(settingsForm);
        setIsSettingsModalOpen(false);
        addToast("Settings Updated", "success");
    };

    const handleAddAmenity = (name: string) => {
        if (!name || (settingsForm.amenities || []).includes(name)) return;
        setSettingsForm({ ...settingsForm, amenities: [...(settingsForm.amenities || []), name] });
        setNewAmenity('');
    };

    const handleRemoveAmenity = (name: string) => {
        setSettingsForm({ ...settingsForm, amenities: (settingsForm.amenities || []).filter(a => a !== name) });
    };

    const getPatientHistoryData = (patient: Patient) => {
        return patients.filter(p => p.phone === patient.phone).sort((a, b) => b.timeAdded - a.timeAdded);
    };

    // BULK HANDLERS FOR DATABASE TABLE
    const handleBulkDelete = (selectedPatients: Patient[]) => {
        // Collect all IDs for the selected unique patients
        const idsToDelete: string[] = [];
        selectedPatients.forEach(p => {
            const matched = patients.filter(pat => pat.phone === p.phone).map(pat => pat.id);
            idsToDelete.push(...matched);
        });
        if (idsToDelete.length > 0) {
            onDeleteMultiplePatients(idsToDelete);
        }
    };

    const handleBulkStatusChange = (selectedPatients: Patient[], status: PatientStatus) => {
        if (!onBulkUpdateStatus) return;
        const idsToUpdate: string[] = [];
        selectedPatients.forEach(p => {
            // Find active/latest visit for this patient
            const latest = patients
                .filter(pat => pat.phone === p.phone && pat.status !== PatientStatus.COMPLETED && pat.status !== PatientStatus.CANCELLED)
                .sort((a, b) => b.timeAdded - a.timeAdded)[0];
            
            if (latest) idsToUpdate.push(latest.id);
        });
        
        if (idsToUpdate.length > 0) {
            onBulkUpdateStatus(idsToUpdate, status);
        } else {
            addToast("No active visits found for selected patients", "warning");
        }
    };

    const isFiltered = searchQuery !== '' || filterDoctorId !== 'ALL' || filterStatus !== 'ACTIVE' || filterType !== 'ALL';

    return (
        <div className="h-full flex flex-col bg-slate-50 w-full max-w-[100vw] overflow-hidden">
            {/* HEADER & TABS */}
            <div className="flex flex-col flex-shrink-0 bg-white shadow-sm z-30 w-full">
                <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{clinicName}</h1>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full"><Settings className="h-4 w-4" /></button>
                        </div>
                        <div className="hidden sm:flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500 items-center">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {clinicData?.operatingHours || '9am - 9pm'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded font-bold uppercase text-[9px] bg-indigo-100 text-indigo-700">
                                {operationMode.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                    {/* DESKTOP TABS */}
                    <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-lg flex-shrink-0">
                        <button onClick={() => setActiveTab('QUEUE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'QUEUE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><List className="h-3 w-3" /> Queue</button>
                        <button onClick={() => setActiveTab('DATABASE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DATABASE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Database className="h-3 w-3" /> Patients</button>
                        <button onClick={() => setActiveTab('DOCTORS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DOCTORS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Stethoscope className="h-3 w-3" /> Doctors</button>
                        <button onClick={() => setActiveTab('STAFF')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'STAFF' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Users className="h-3 w-3" /> Staff</button>
                        <button onClick={() => setActiveTab('REPORTS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'REPORTS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><BarChart3 className="h-3 w-3" /> Reports</button>
                    </div>
                </div>

                {/* DOCTOR STATUS DECK - Only visible in Queue Tab */}
                {activeTab === 'QUEUE' && (
                    <div className="bg-white border-b border-slate-200 w-full overflow-hidden transition-all duration-300">
                        {/* ... (Keep Doctor Status Deck) ... */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-2 p-2 max-w-[1920px] mx-auto">
                            {/* "All" Card */}
                            <button 
                                onClick={() => setFilterDoctorId('ALL')} 
                                className={`
                                    w-full
                                    p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between h-28
                                    ${filterDoctorId === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-lg ring-2 ring-slate-900 ring-offset-1' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 hover:shadow-sm'}
                                `}
                            >
                                <div>
                                    <div className="font-bold text-xs">All Doctors</div>
                                    <div className={`text-[9px] mt-0.5 ${filterDoctorId === 'ALL' ? 'text-slate-400' : 'text-slate-500'}`}>Overview</div>
                                </div>
                                <div className="mt-auto">
                                    <div className="text-xl font-black tracking-tight leading-none">{patients.filter(p => p.status === PatientStatus.WAITING).length}</div>
                                    <div className={`text-[8px] uppercase font-bold tracking-wider mt-1 ${filterDoctorId === 'ALL' ? 'text-slate-500' : 'text-slate-400'}`}>Total Waiting</div>
                                </div>
                            </button>

                            {/* Individual Doctor Cards */}
                            {visibleDeckStats.map(({ doc, current, next, count }) => {
                                const isSelected = filterDoctorId === doc.id;
                                return (
                                    <button 
                                        key={doc.id}
                                        onClick={() => setFilterDoctorId(isSelected ? 'ALL' : doc.id)}
                                        className={`
                                            w-full
                                            p-2.5 rounded-xl border transition-all text-left relative group 
                                            flex flex-col h-28 justify-between
                                            ${isSelected ? 'bg-white border-primary-500 ring-2 ring-primary-500 shadow-md z-10' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                                        `}
                                    >
                                        <div className="flex items-start gap-2 w-full">
                                            <div className="relative flex-shrink-0">
                                                <img src={doc.avatarUrl} className="w-8 h-8 rounded-full bg-slate-100 object-cover border border-slate-100" />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-900 text-xs truncate leading-tight">{doc.name}</div>
                                                <div className="text-[9px] text-slate-500 truncate mt-0.5">{doc.specialty}</div>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="grid grid-cols-3 gap-px bg-slate-100 rounded-lg p-[1px] border border-slate-200">
                                                {/* Serving */}
                                                <div className="bg-white rounded-l-md p-1 flex flex-col justify-center items-center">
                                                    <div className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Serving</div>
                                                    <div className={`text-xs font-black truncate ${current ? 'text-blue-600' : 'text-slate-300'}`}>
                                                        {current ? `#${current.tokenNumber}` : '--'}
                                                    </div>
                                                </div>
                                                {/* Next */}
                                                <div className="bg-white p-1 flex flex-col justify-center items-center">
                                                    <div className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Next</div>
                                                    <div className={`text-xs font-black truncate ${next ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                        {next ? `#${next.tokenNumber}` : '--'}
                                                    </div>
                                                </div>
                                                {/* Waiting */}
                                                <div className="bg-white rounded-r-md p-1 flex flex-col justify-center items-center">
                                                    <div className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Wait</div>
                                                    <div className="text-xs font-black text-slate-700">
                                                        {count}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Expand/Collapse Control */}
                        {doctors.length > (isMobile ? 1 : 5) && (
                            <button 
                                onClick={() => setIsDeckExpanded(!isDeckExpanded)}
                                className="w-full py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 border-t border-slate-100 transition-colors"
                            >
                                {isDeckExpanded ? (
                                    <>Show Less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                    <>Show {hiddenDeckCount} more doctors <ChevronDown className="h-3 w-3" /></>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-slate-100 pb-16 sm:pb-0">
                {activeTab === 'QUEUE' && (
                    <QueueTable 
                        patients={filteredPatients}
                        doctors={doctors}
                        estimatedTimes={estimatedTimes}
                        isFiltered={isFiltered}
                        nextUpPatientIds={nextUpPatientIds}
                        onUpdateStatus={onUpdateStatus}
                        onManualReorder={onManualReorder}
                        onDragDrop={handleLocalDragDrop}
                        onManualCheckIn={onManualCheckIn}
                        onEditPatient={(p) => setEditingPatient(p)}
                        onVitalsClick={(p) => setVitalsPatient(p)}
                        onToggleEmergency={onToggleEmergency}
                        onCancelPatient={onCancelPatient}
                    />
                )}

                {activeTab === 'DATABASE' && (
                    <PatientDatabaseTable 
                        patients={uniquePatients}
                        doctors={doctors}
                        onHistoryClick={(p) => setHistoryPatient(p)}
                        onEditClick={(p) => setEditingPatient(p)}
                        onDeleteClick={(p) => { if(window.confirm(`Delete history for ${p.name}?`)) onDeleteMultiplePatients(patients.filter(pat => pat.phone === p.phone).map(pat => pat.id)); }}
                        onBulkDelete={handleBulkDelete}
                        onBulkStatusChange={handleBulkStatusChange}
                    />
                )}

                {activeTab === 'DOCTORS' && (
                    <DoctorManager 
                        doctors={doctors}
                        onAddDoctor={() => { setDoctorModalMode('ADD'); setEditingDoctorData(undefined); setIsDoctorModalOpen(true); }}
                        onEditDoctor={(doc) => { setDoctorModalMode('EDIT'); setEditingDoctorId(doc.id); setEditingDoctorData(doc); setIsDoctorModalOpen(true); }}
                        onDeleteDoctor={(id) => { if(window.confirm("Remove Doctor?")) onDeleteDoctor(id); }}
                        onAddPresetSlot={handleAddPresetSlot}
                        onStatusChange={(id, status) => onEditDoctor(id, { status })}
                    />
                )}

                {activeTab === 'STAFF' && onAddStaff && onUpdateStaff && onDeleteStaff && (
                    <StaffManager 
                        staff={staff}
                        onAddStaff={onAddStaff}
                        onUpdateStaff={onUpdateStaff}
                        onDeleteStaff={onDeleteStaff}
                    />
                )}

                {activeTab === 'REPORTS' && (
                    <ReceptionStats patients={patients} doctors={doctors} />
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="sm:hidden bg-white border-t border-slate-200 fixed bottom-0 w-full z-40 flex justify-around py-2 px-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
                <button onClick={() => setActiveTab('QUEUE')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === 'QUEUE' ? 'text-primary-700' : 'text-slate-400'}`}>
                    <div className={`p-1 rounded-full ${activeTab === 'QUEUE' ? 'bg-primary-50' : ''}`}>
                        <List className={`h-5 w-5 ${activeTab === 'QUEUE' ? 'stroke-primary-600' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold">Queue</span>
                </button>
                <button onClick={() => setActiveTab('DATABASE')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === 'DATABASE' ? 'text-primary-700' : 'text-slate-400'}`}>
                    <div className={`p-1 rounded-full ${activeTab === 'DATABASE' ? 'bg-primary-50' : ''}`}>
                        <Database className={`h-5 w-5 ${activeTab === 'DATABASE' ? 'stroke-primary-600' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold">Patients</span>
                </button>
                <button onClick={() => setActiveTab('DOCTORS')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === 'DOCTORS' ? 'text-primary-700' : 'text-slate-400'}`}>
                    <div className={`p-1 rounded-full ${activeTab === 'DOCTORS' ? 'bg-primary-50' : ''}`}>
                        <Stethoscope className={`h-5 w-5 ${activeTab === 'DOCTORS' ? 'stroke-primary-600' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold">Doctors</span>
                </button>
                <button onClick={() => setActiveTab('STAFF')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === 'STAFF' ? 'text-primary-700' : 'text-slate-400'}`}>
                    <div className={`p-1 rounded-full ${activeTab === 'STAFF' ? 'bg-primary-50' : ''}`}>
                        <Users className={`h-5 w-5 ${activeTab === 'STAFF' ? 'stroke-primary-600' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold">Staff</span>
                </button>
            </nav>

            {/* MODALS */}
            <AddPatientModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onAdd={onAddPatient} doctors={doctors} patients={patients} addToast={addToast} />
            <DoctorFormModal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} mode={doctorModalMode} initialData={editingDoctorData} onSave={handleSaveDoctor} onCheckMasterDoctor={onCheckMasterDoctor} addToast={addToast} />
            
            {/* Improved Settings Modal */}
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Clinic Configuration" maxWidth="max-w-2xl">
                <div className="flex border-b border-slate-200 mb-6">
                    <button onClick={() => setActiveSettingsTab('GENERAL')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'GENERAL' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>General</button>
                    <button onClick={() => setActiveSettingsTab('LOCATION')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'LOCATION' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Location</button>
                    <button onClick={() => setActiveSettingsTab('BRANDING')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeSettingsTab === 'BRANDING' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Branding & Amenities</button>
                </div>

                <div className="space-y-6">
                    {activeSettingsTab === 'GENERAL' && (
                        <div className="space-y-4 animate-in fade-in">
                            <Input label="Clinic Name" value={settingsForm.name || ''} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Type</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white" value={settingsForm.type} onChange={e => setSettingsForm({ ...settingsForm, type: e.target.value as ClinicType })}>
                                        {Object.values(ClinicType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <Input label="Contact Phone" value={settingsForm.contactPhone || ''} onChange={e => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })} />
                            </div>

                            <Input label="Operating Hours (e.g. 09:00 AM - 09:00 PM)" value={settingsForm.operatingHours || ''} onChange={e => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })} />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">About / Tagline</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20" value={settingsForm.about || ''} onChange={e => setSettingsForm({ ...settingsForm, about: e.target.value })} placeholder="Brief description of your clinic..." />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-medium text-slate-700">Operation Mode</label>
                                <select 
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    value={settingsForm.operationMode} 
                                    onChange={e => setSettingsForm({ ...settingsForm, operationMode: e.target.value as ClinicOperationMode })}
                                >
                                    <option value={ClinicOperationMode.DIRECT_WALK_IN}>Direct Walk-in Only</option>
                                    <option value={ClinicOperationMode.ONLINE_WALK_IN}>Online Walk-in Only</option>
                                    <option value={ClinicOperationMode.BOTH_WALK_IN}>Direct Walk-in & Online Token</option>
                                    <option value={ClinicOperationMode.HYBRID_DIRECT_APPT}>Hybrid: Direct Walk-in & Appointment</option>
                                    <option value={ClinicOperationMode.HYBRID_FULL}>Hybrid: Direct, Online Token & Appointment</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ... (Keep Location and Branding Tabs unchanged) ... */}
                    {activeSettingsTab === 'LOCATION' && (
                        <div className="space-y-4 animate-in fade-in">
                            <Input label="Address Line 1" value={settingsForm.address || ''} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="City" value={settingsForm.city || ''} onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })} />
                                <Input label="Pincode" value={settingsForm.pincode || ''} onChange={e => setSettingsForm({ ...settingsForm, pincode: e.target.value })} />
                            </div>
                            
                            <div className="border-t border-slate-200 pt-4 mt-2">
                                <label className="block text-sm font-bold text-slate-800 mb-2">Pin Location on Map</label>
                                
                                {/* Search Bar */}
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search location (e.g. Anna Nagar, Chennai)" 
                                            className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-300 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                            value={mapSearchQuery}
                                            onChange={(e) => setMapSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                                        />
                                    </div>
                                    <Button onClick={handleSearchLocation} disabled={!mapSearchQuery || isSearchingLocation}>
                                        {isSearchingLocation ? '...' : 'Search'}
                                    </Button>
                                </div>

                                {/* Map */}
                                <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm relative z-0">
                                    <MapContainer 
                                        center={[settingsForm.geoLocation?.lat || 13.0827, settingsForm.geoLocation?.lng || 80.2707]} 
                                        zoom={13} 
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <MapUpdater center={[settingsForm.geoLocation?.lat || 13.0827, settingsForm.geoLocation?.lng || 80.2707]} />
                                        <Marker position={[settingsForm.geoLocation?.lat || 13.0827, settingsForm.geoLocation?.lng || 80.2707]} icon={DefaultIcon} />
                                        <MapClickHandler onLocationSelect={(lat, lng) => setSettingsForm(prev => ({ ...prev, geoLocation: { lat, lng } }))} />
                                    </MapContainer>
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold shadow-sm z-[400] pointer-events-none">
                                        Tap to pin
                                    </div>
                                </div>

                                {/* Lat/Lng Manual Input */}
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Lat</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-mono" 
                                            value={settingsForm.geoLocation?.lat || ''} 
                                            onChange={e => setSettingsForm(prev => ({ ...prev, geoLocation: { ...prev.geoLocation!, lat: parseFloat(e.target.value) } }))} 
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Lng</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-mono" 
                                            value={settingsForm.geoLocation?.lng || ''} 
                                            onChange={e => setSettingsForm(prev => ({ ...prev, geoLocation: { ...prev.geoLocation!, lng: parseFloat(e.target.value) } }))} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSettingsTab === 'BRANDING' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Clinic Image URL</label>
                                <div className="flex gap-4 items-start">
                                    <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {settingsForm.imageUrl ? <img src={settingsForm.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 w-8 text-slate-300" />}
                                    </div>
                                    <div className="flex-1">
                                        <Input placeholder="https://example.com/image.jpg" value={settingsForm.imageUrl || ''} onChange={e => setSettingsForm({ ...settingsForm, imageUrl: e.target.value })} />
                                        <p className="text-xs text-slate-500 mt-2">Enter a direct image link. This will be shown to patients.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(settingsForm.amenities || []).map(amenity => (
                                        <span key={amenity} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                            {amenity}
                                            <button onClick={() => handleRemoveAmenity(amenity)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Add amenity (e.g. Parking)"
                                        value={newAmenity}
                                        onChange={e => setNewAmenity(e.target.value)}
                                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddAmenity(newAmenity); } }}
                                    />
                                    <Button onClick={() => handleAddAmenity(newAmenity)} size="sm" variant="secondary"><Plus className="h-4 w-4" /></Button>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Popular</p>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_AMENITIES.filter(a => !(settingsForm.amenities || []).includes(a)).map(a => (
                                            <button key={a} onClick={() => handleAddAmenity(a)} className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                                                + {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* ... (Keep existing modals: Patient, Doctor etc) ... */}
            <Modal isOpen={!!editingPatient} onClose={() => setEditingPatient(null)} title="Edit Patient Profile" maxWidth="max-w-md">
                {/* ... existing content ... */}
                {editingPatient && (
                    <form onSubmit={handleSaveEditedPatient} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2 border border-blue-100 flex gap-2"><Activity className="h-5 w-5 flex-shrink-0" /><p>Changes apply to <strong>all visits</strong>.</p></div>
                        <Input label="Name" value={editingPatient.name} onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Age" value={editingPatient.age || ''} onChange={(e) => setEditingPatient({...editingPatient, age: e.target.value})} />
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editingPatient.gender} onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                        </div>
                        <Input label="Phone" value={editingPatient.phone} onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})} required />
                        
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</h4>
                            <Input label="Address" value={editingPatient.address || ''} onChange={(e) => setEditingPatient({...editingPatient, address: e.target.value})} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="City" value={editingPatient.city || ''} onChange={(e) => setEditingPatient({...editingPatient, city: e.target.value})} />
                                <Input label="Country" value={editingPatient.country || ''} onChange={(e) => setEditingPatient({...editingPatient, country: e.target.value})} />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setEditingPatient(null)}>Cancel</Button><Button type="submit">Save</Button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!vitalsPatient} onClose={() => setVitalsPatient(null)} title="Record Vitals" maxWidth="max-w-2xl">
                {/* ... existing content ... */}
                {vitalsPatient && (
                    <form onSubmit={handleSaveVitals} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200">{vitalsPatient.tokenNumber}</div><div><h3 className="font-bold text-slate-900">{vitalsPatient.name}</h3><p className="text-xs text-slate-500">{vitalsPatient.age} Yrs • {vitalsPatient.gender}</p></div></div></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">BP (mmHg)</label><Input placeholder="120/80" value={vitalsPatient.vitals?.bp || ''} onChange={(e) => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, bp: e.target.value}})} /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Temp (°F)</label><Input placeholder="98.6" value={vitalsPatient.vitals?.temp || ''} onChange={(e) => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, temp: e.target.value}})} /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Pulse (bpm)</label><Input placeholder="72" value={vitalsPatient.vitals?.pulse || ''} onChange={(e) => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, pulse: e.target.value}})} /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Weight (kg)</label><Input placeholder="65" value={vitalsPatient.vitals?.weight || ''} onChange={(e) => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, weight: e.target.value}})} /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">SpO2 (%)</label><Input placeholder="98" value={vitalsPatient.vitals?.spo2 || ''} onChange={(e) => setVitalsPatient({...vitalsPatient, vitals: {...vitalsPatient.vitals, spo2: e.target.value}})} /></div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setVitalsPatient(null)}>Cancel</Button><Button type="submit">Save Vitals</Button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} title="Patient History" maxWidth="max-w-2xl">
                {/* ... existing content ... */}
                {historyPatient && (() => {
                    const history = getPatientHistoryData(historyPatient);
                    return (
                        <div className="space-y-4">
                            {history.map(visit => (
                                <div key={visit.id} className="relative pl-6 pb-4 border-l border-slate-200 ml-2">
                                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <div><span className="text-xs font-bold text-slate-500">{new Date(visit.timeAdded).toLocaleDateString()}</span><h5 className="font-bold text-slate-900 text-sm">Dr. {doctors.find(d => d.id === visit.doctorId)?.name}</h5></div>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{visit.status}</span>
                                        </div>
                                        {visit.symptoms && <p className="text-xs text-slate-600"><strong>Sx:</strong> {visit.symptoms}</p>}
                                        {visit.diagnosis && <p className="text-xs text-slate-600"><strong>Dx:</strong> {visit.diagnosis}</p>}
                                        {visit.notes && <div className="mt-2 bg-slate-50 p-2 rounded text-[10px] text-slate-500 italic">{visit.notes}</div>}
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-center text-slate-400 py-4">No history found.</p>}
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};
