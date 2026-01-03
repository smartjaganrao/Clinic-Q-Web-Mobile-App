
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, Staff, ClinicOperationMode, Clinic, AppointmentConfig, SessionMode, ClinicDayConfig, Shift } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp, Users, MapPin, Settings, Footprints, CalendarClock, Shuffle, Building2, ImageIcon, Plus, X, Globe, Crosshair, Trash2, Info, LayoutGrid, Zap, Mail, Shield, Save, Calendar, UserX, CheckCircle2, PauseCircle, LogOut, Upload, Image as LucideImage, Map as LucideMap, Navigation, ArrowRight, Target, LocateFixed, MapPinIcon, Layout, MessageSquare, Sparkles, CalendarDays,
    Edit2, ChevronLeft, LayoutPanelTop, Monitor, Smartphone, Bell, LifeBuoy, Loader2, ShieldCheck, Menu, Copy
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
import { Logo } from '../components/Logo';
import { reverseGeocode } from '../utils/geolocation';
import { getActiveSession, getQueueSorter, parseTimeMins } from '../utils/time';
import { validateDoctorSchedule } from '../services/validation';

// Leaflet icon fix
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const getClinicCurrentTime = (timezone?: string) => {
    const now = new Date();
    let offsetHours = 0;
    if (timezone === 'Asia/Kolkata') offsetHours = 5.5;
    else if (timezone === 'Asia/Dubai') offsetHours = 4;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (offsetHours * 3600000));
};

const getLocalToday = (timezone?: string) => {
    const d = getClinicCurrentTime(timezone);
    return d.toISOString().split('T')[0];
};

const getPatientDateStr = (timeAdded: number, timezone?: string) => {
    const d = new Date(timeAdded);
    let offsetHours = 0;
    if (timezone === 'Asia/Kolkata') offsetHours = 5.5;
    else if (timezone === 'Asia/Dubai') offsetHours = 4;
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const clinicTime = new Date(utc + (offsetHours * 3600000));
    return clinicTime.toISOString().split('T')[0];
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

const parseTimeTo24h = (timeStr: string) => {
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "09:00";
    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    if (period.toUpperCase() === 'PM' && h < 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
    onAddDoctor: (data: Partial<Doctor>) => void;
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
    onLogout?: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onSetupKiosk?: () => void;
}

// Sub-component for Map Location Picker
const LocationPicker = ({ onSelect }: { onSelect: (latlng: L.LatLng) => void }) => {
    useMapEvents({ click(e) { onSelect(e.latlng); } });
    return null;
};

// Sub-component for Map View Fix
const MapInvalidator = ({ center, isTabActive }: { center: [number, number], isTabActive: boolean }) => {
    const map = useMap();
    useEffect(() => {
        if (isTabActive) {
            setTimeout(() => {
                map.invalidateSize();
                if (center && !isNaN(center[0]) && !isNaN(center[1])) {
                    map.setView(center, map.getZoom());
                }
            }, 100);
        }
    }, [isTabActive, center, map]);
    return null;
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors: s, patients: t, staff: a = [], clinicName: o, clinicType: c, operationMode: f = ClinicOperationMode.HYBRID_FULL, clinicData: m,
    onAddPatient: y, onEditPatient: b, onDeletePatient: v, onDeleteMultiplePatients: N,
    onAddDoctor: T, onCheckMasterDoctor: C, onEditDoctor: k, onDeleteDoctor: R, onUpdateStatus: U, onCancelPatient: B, onUpdateClinicSettings: P, 
    onToggleEmergency: te, onManualReorder: M, onDragDrop: W, onManualCheckIn: G, 
    onAddStaff: se, onUpdateStaff: Z, onDeleteStaff: De, onLogout, addToast: he, onSetupKiosk
}) => {
    const onAddPatient = y;
    const onEditPatient = b;
    const onDeletePatient = v;
    const onUpdateStatus = U;
    const onManualCheckIn = G;
    const onEditDoctor = k;
    const onAddDoctor = T;
    const onDeleteDoctor = R;

    type DashboardTab = 'QUEUE' | 'DATABASE' | 'DOCTORS' | 'REPORTS' | 'APPOINTMENTS' | 'SETTINGS';
    const [ke, Me] = useState<DashboardTab>('QUEUE');
    const [O, ee] = useState<'LIVE' | 'HOLD' | 'DONE' | 'ABSENT'>('LIVE');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [ve, Ge] = useState('');
    const [Ye, pt] = useState<string>('ALL');
    const [ut, Gn] = useState<string>(() => getLocalToday(m?.timezone));

    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
    
    const [settingsSubTab, setSettingsSubTab] = useState<'GENERAL' | 'PROFILE' | 'LOCATION' | 'HOURS'>('GENERAL');
    const [settingsForm, setSettingsForm] = useState<Partial<Clinic>>({});
    const [amenityInput, setAmenityInput] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentTime, setCurrentTime] = useState(() => getClinicCurrentTime(m?.timezone));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getClinicCurrentTime(m?.timezone)), 1000);
        return () => clearInterval(timer);
    }, [m?.timezone]);

    useEffect(() => {
        if (ke === 'SETTINGS' && m) {
            setSettingsForm({
                ...m,
                amenities: [...(m.amenities || [])],
                geoLocation: m.geoLocation || { lat: 13.085, lng: 80.21 },
                workingHours: m.workingHours || DAYS.map(day => ({
                    dayOfWeek: day,
                    isOpen: false,
                    shifts: []
                }))
            });
        }
    }, [ke, m?.id]); // Fixed: Only re-initialize when switching tabs or clinic ID changes, not on every queue update

    const estimatedTimesMap = useMemo(() => {
        const times: Record<string, number> = {};
        s.forEach(doc => {
            // Use robust sorting logic to match Doctor's view
            const docQueue = t.filter(p => p.doctorId === doc.id && (p.status === PatientStatus.WAITING || p.status === PatientStatus.ON_HOLD))
                .sort((a, b) => {
                    // 1. Queue Order
                    if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                        const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                        const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                        if (orderA !== orderB) return orderA - orderB;
                    }
                    // 2. Emergency
                    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
                    // 3. Status (WAITING before ON_HOLD)
                    const getStatusPriority = (s: PatientStatus) => (s === PatientStatus.WAITING ? 0 : s === PatientStatus.ON_HOLD ? 1 : 2);
                    const pA = getStatusPriority(a.status);
                    const pB = getStatusPriority(b.status);
                    if (pA !== pB) return pA - pB;
                    // 4. Time
                    const getSortTime = (p: Patient) => {
                        if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
                            return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
                        }
                        return p.timeAdded;
                    };
                    return getSortTime(a) - getSortTime(b);
                });

            let nextAvailable = Date.now();
            if (doc.delayMinutes > 0) nextAvailable += doc.delayMinutes * 60000;
            
            let cumulativeTime = 0;
            docQueue.forEach((p) => {
                if (p.status === PatientStatus.WAITING) {
                    times[p.id] = nextAvailable + cumulativeTime;
                    cumulativeTime += (doc.consultationTime || 15) * 60000;
                }
            });
        });
        return times;
    }, [s, t]);

    const stats = useMemo(() => {
        const today = ut;
        const todayPatients = t.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : getPatientDateStr(p.timeAdded, m?.timezone);
            return pDate === today;
        });
        return {
            total: todayPatients.length,
            waiting: todayPatients.filter(p => p.status === PatientStatus.WAITING).length,
            done: todayPatients.filter(p => p.status === PatientStatus.COMPLETED).length,
            revenue: todayPatients.filter(p => p.status === PatientStatus.COMPLETED).reduce((acc, p) => {
                const doc = s.find(d => d.id === p.doctorId);
                return acc + (doc?.consultationFee || 0);
            }, 0)
        };
    }, [t, s, m, ut]);

    const patientsForTabs = useMemo(() => {
        let list = t.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : getPatientDateStr(p.timeAdded, m?.timezone);
            return pDate === ut;
        });
        if (Ye !== 'ALL') list = list.filter(p => p.doctorId === Ye);
        return list;
    }, [t, Ye, ut, m?.timezone]);

    const tabCounts = useMemo(() => ({
        LIVE: patientsForTabs.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR).length,
        HOLD: patientsForTabs.filter(p => p.status === PatientStatus.ON_HOLD).length,
        DONE: patientsForTabs.filter(p => p.status === PatientStatus.COMPLETED).length,
        ABSENT: patientsForTabs.filter(p => p.status === PatientStatus.SKIPPED).length
    }), [patientsForTabs]);

    const filteredPatients = useMemo(() => {
        let list = t.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' && p.appointmentDate ? p.appointmentDate : getPatientDateStr(p.timeAdded, m?.timezone);
            return pDate === ut;
        });
        if (Ye !== 'ALL') list = list.filter(p => p.doctorId === Ye);
        
        if (ke === 'QUEUE') {
            if (O === 'LIVE') list = list.filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR);
            else if (O === 'HOLD') list = list.filter(p => p.status === PatientStatus.ON_HOLD);
            else if (O === 'DONE') list = list.filter(p => p.status === PatientStatus.COMPLETED);
            else if (O === 'ABSENT') list = list.filter(p => p.status === PatientStatus.SKIPPED);
        }
        
        if (ve) {
            const q = ve.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.tokenNumber.toString().includes(q));
        }

        // Robust Sorting Logic (Matches Doctor View & Estimated Time Calculation)
        return list.sort((a, b) => {
            // 1. Queue Order
            if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
                const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
            }
            // 2. Emergency
            if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
            // 3. Status (WAITING before ON_HOLD)
            const getStatusPriority = (s: PatientStatus) => (s === PatientStatus.WAITING ? 0 : s === PatientStatus.ON_HOLD ? 1 : 2);
            const pA = getStatusPriority(a.status);
            const pB = getStatusPriority(b.status);
            if (pA !== pB) return pA - pB;
            // 4. Time
            const getSortTime = (p: Patient) => {
                if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
                    return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
                }
                return p.timeAdded;
            };
            return getSortTime(a) - getSortTime(b);
        });
    }, [t, ke, O, Ye, ve, ut, m, s]);

    const sidebarItems = [
        { id: 'QUEUE', label: 'Control Tower', icon: Monitor },
        { id: 'DATABASE', label: 'Patient CRM', icon: Users },
        { id: 'DOCTORS', label: 'Medical Staff', icon: Stethoscope },
        { id: 'REPORTS', label: 'Business Stats', icon: BarChart3 },
    ];

    const navigateDate = (direction: 'PREV' | 'NEXT') => {
        const d = new Date(ut);
        d.setDate(d.getDate() + (direction === 'NEXT' ? 1 : -1));
        Gn(d.toISOString().split('T')[0]);
    };

    const handleSettingsSave = (e: React.FormEvent) => {
        e.preventDefault();
        P(settingsForm);
        he("Clinic settings updated!", "success");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSettingsForm(prev => ({ ...prev, imageUrl: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handleLocationSelected = async (latlng: L.LatLng) => {
        setSettingsForm(prev => ({ 
            ...prev, 
            geoLocation: { lat: latlng.lat, lng: latlng.lng } 
        }));
        try {
            const { address, city, pincode } = await reverseGeocode(latlng.lat, latlng.lng);
            setSettingsForm(prev => ({ 
                ...prev, 
                address: address || prev.address,
                city: city || prev.city,
                pincode: pincode || prev.pincode
            }));
        } catch (e) {
            console.error("Reverse geocoding failed", e);
        }
    };

    const handleLocateMe = async () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (p) => { 
                const lat = p.coords.latitude;
                const lng = p.coords.longitude;
                setSettingsForm(prev => ({ ...prev, geoLocation: { lat, lng } }));
                try {
                    const { address, city, pincode } = await reverseGeocode(lat, lng);
                    setSettingsForm(prev => ({ 
                        ...prev, 
                        address: address || prev.address,
                        city: city || prev.city,
                        pincode: pincode || prev.pincode
                    }));
                    he("Location and address synced!", "success");
                } catch (e) {
                    he("Location synced, but address lookup failed.", "warning");
                }
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                he("Could not access your location.", "error");
            },
            { enableHighAccuracy: true }
        );
    };

    const queueTabColors = {
        LIVE: { active: 'bg-primary-600 text-white shadow-primary-200', inactive: 'text-primary-600 hover:bg-primary-50' },
        HOLD: { active: 'bg-orange-500 text-white shadow-orange-200', inactive: 'text-orange-600 hover:bg-orange-50' },
        DONE: { active: 'bg-emerald-600 text-white shadow-emerald-200', inactive: 'text-emerald-600 hover:bg-emerald-50' },
        ABSENT: { active: 'bg-rose-600 text-white shadow-rose-200', inactive: 'text-rose-600 hover:bg-rose-50' }
    };

    const doctorQueueStats = useMemo(() => {
        const statsArray = s.map(F => {
            const waitingPatients = t.filter(Ze => {
                const pDateStr = Ze.visitType === "APPOINTMENT" && Ze.appointmentDate 
                    ? Ze.appointmentDate 
                    : getPatientDateStr(Ze.timeAdded, m?.timezone);
                return Ze.doctorId === F.id && (Ze.status === PatientStatus.WAITING || Ze.status === PatientStatus.ON_HOLD) && pDateStr === ut;
            });
            const servingPatient = t.find(Ze => Ze.doctorId === F.id && Ze.status === PatientStatus.WITH_DOCTOR);
            const nextPatient = waitingPatients.length > 0 ? waitingPatients[0] : null;
            return {
                doc: F,
                count: waitingPatients.length,
                current: servingPatient,
                next: nextPatient
            };
        });
        // Updated sorting: Descending order (highest count first)
        return statsArray.sort((a, b) => b.count - a.count);
    }, [s, t, ut, m?.timezone]);

    const handleAddAmenity = (val?: string) => {
        const amenity = typeof val === 'string' ? val : amenityInput;
        if (amenity.trim()) {
            setSettingsForm(prev => ({
                ...prev,
                amenities: Array.from(new Set([...(prev.amenities || []), amenity.trim()]))
            }));
            setAmenityInput('');
        }
    };

    const handleWorkingHoursToggle = (index: number) => {
        if (!settingsForm.workingHours) return;
        const newHours = [...settingsForm.workingHours];
        const isOpen = !newHours[index].isOpen;
        let shifts = newHours[index].shifts;
        
        if (isOpen && shifts.length === 0) {
            shifts = [{ start: '09:00', end: '17:00' }];
        }
        
        newHours[index] = { ...newHours[index], isOpen, shifts };
        setSettingsForm(prev => ({ ...prev, workingHours: newHours }));
    };

    const handleWorkingHoursShiftChange = (dayIndex: number, shiftIndex: number, field: keyof Shift, value: string) => {
        if (!settingsForm.workingHours) return;
        const newHours = [...settingsForm.workingHours];
        newHours[dayIndex] = {
            ...newHours[dayIndex],
            shifts: newHours[dayIndex].shifts.map((s, i) => i === shiftIndex ? { ...s, [field]: value } : s)
        };
        setSettingsForm(prev => ({ ...prev, workingHours: newHours }));
    };

    const addWorkingHoursShift = (dayIndex: number) => {
        if (!settingsForm.workingHours) return;
        const newHours = [...settingsForm.workingHours];
        newHours[dayIndex] = { ...newHours[dayIndex], shifts: [...newHours[dayIndex].shifts, { start: '18:00', end: '21:00' }] };
        setSettingsForm(prev => ({ ...prev, workingHours: newHours }));
    };

    const removeWorkingHoursShift = (dayIndex: number, shiftIndex: number) => {
        if (!settingsForm.workingHours) return;
        const newHours = [...settingsForm.workingHours];
        newHours[dayIndex] = { ...newHours[dayIndex], shifts: newHours[dayIndex].shifts.filter((_, i) => i !== shiftIndex) };
        setSettingsForm(prev => ({ ...prev, workingHours: newHours }));
    };

    const copyMondayToAll = () => {
        if (!settingsForm.workingHours) return;
        const newHours = [...settingsForm.workingHours];
        const mondayConfig = newHours.find(h => h.dayOfWeek === 'MON');
        
        if (!mondayConfig) {
            he("Monday configuration not found.", "error");
            return;
        }

        const updatedHours = newHours.map(h => {
            if (h.dayOfWeek === 'MON') return h;
            return {
                ...h,
                isOpen: mondayConfig.isOpen,
                shifts: JSON.parse(JSON.stringify(mondayConfig.shifts))
            };
        });
        
        setSettingsForm(prev => ({ ...prev, workingHours: updatedHours }));
        he("Monday's schedule copied to all days", "success");
    };

    const totalWaitingCount = useMemo(() => doctorQueueStats.reduce((acc, d) => acc + d.count, 0), [doctorQueueStats]);

    return (
        <div className="h-screen flex bg-slate-100 overflow-hidden">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-[70] bg-slate-900 flex flex-col transition-all duration-300 
                ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-screen lg:shadow-none
                ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
                w-64
            `}>
                <div className={`p-6 flex items-center gap-3 overflow-hidden justify-between lg:justify-start ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                         <Logo className="h-8 w-8 shrink-0" />
                         {!isSidebarCollapsed && (
                            <div className="animate-in fade-in duration-300">
                                <h1 className="text-white font-black text-lg tracking-tight leading-none">Smart<span className="text-teal-400">QFlow</span></h1>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OPD System</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-24 bg-teal-500 text-slate-900 p-1 rounded-full shadow-lg hover:bg-teal-400 transition-all z-[60] hidden lg:block"
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                Me(item.id as DashboardTab);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${ke === item.id ? 'bg-teal-500 text-slate-900 shadow-xl shadow-teal-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                            title={isSidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`h-5 w-5 shrink-0 ${ke === item.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-teal-400'}`} />
                            {!isSidebarCollapsed && <span className="font-black text-xs uppercase tracking-widest truncate animate-in fade-in slide-in-from-left-2">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-3 mt-auto border-t border-white/5">
                    <button 
                        onClick={() => {
                            Me('SETTINGS');
                            setIsMobileMenuOpen(false);
                        }} 
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center' : ''} ${ke === 'SETTINGS' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        title={isSidebarCollapsed ? 'Clinic Setup' : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        {!isSidebarCollapsed && <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2">Clinic Setup</span>}
                    </button>
                    <button 
                        onClick={() => {
                            if (onSetupKiosk) onSetupKiosk();
                            setIsMobileMenuOpen(false);
                        }} 
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center' : ''} text-slate-500 hover:text-white hover:bg-white/5`}
                        title={isSidebarCollapsed ? 'Kiosk Setup' : undefined}
                    >
                        <Smartphone className="h-5 w-5 shrink-0" />
                        {!isSidebarCollapsed && <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2">Kiosk Setup</span>}
                    </button>
                    {!isSidebarCollapsed && (
                        <div className="mt-4 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-3 w-3 text-teal-400" />
                                <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Premium Plan</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Multibranch sync active.</p>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                            <Menu className="h-6 w-6" />
                        </button>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{ke === 'QUEUE' ? 'Live Mission Control' : ke.replace('_', ' ')}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                <span className="text-sm font-black text-white bg-teal-600 px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">{o}</span>
                            </div>
                        </div>
                        <div className="hidden xl:flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today Load</span>
                                <span className="text-lg font-black text-slate-900">{stats.total}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100"></div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                                <span className="text-lg font-black text-teal-600">₹{stats.revenue}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-2xl h-11 px-4 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all mr-2">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input 
                                type="text" 
                                placeholder="Patient Name / Phone..." 
                                className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none w-32 lg:w-48 placeholder:text-slate-400"
                                value={ve}
                                onChange={e => Ge(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block text-right mr-3">
                                <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{o}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{m?.city || 'Chennai'}</p>
                            </div>
                            <Button 
                                onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                                className="bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-500/10 rounded-2xl h-10 sm:h-11 px-4 sm:px-6 font-black text-xs uppercase tracking-widest whitespace-nowrap"
                            >
                                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Check-in</span>
                            </Button>
                            <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl border border-transparent hover:border-red-100" title="Log out">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {ke === 'QUEUE' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="bg-white border-b border-slate-100 px-2 sm:px-6 py-2 sm:py-4 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                                <button 
                                    onClick={() => pt('ALL')} 
                                    className={`relative px-3 py-2 sm:px-6 sm:py-4 h-20 sm:h-24 rounded-xl sm:rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border flex flex-col items-center justify-center min-w-[90px] sm:min-w-[110px] ${Ye === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    <div className={`absolute -top-2 -right-1 sm:-top-4 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base font-black shadow-xl border-2 ${Ye === 'ALL' ? 'bg-white text-slate-900 border-slate-100' : 'bg-slate-900 text-white border-white'}`}>
                                        {totalWaitingCount}
                                    </div>
                                    ALL QUEUES
                                </button>
                                {doctorQueueStats.map(({ doc, count, current, next }) => {
                                    const isActive = Ye === doc.id;
                                    const isAvailable = doc.status === DoctorStatus.AVAILABLE;
                                    return (
                                        <button 
                                            key={doc.id} 
                                            onClick={() => pt(doc.id)} 
                                            className={`relative px-2 py-2 sm:px-4 sm:py-3 h-20 sm:h-24 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap border flex flex-col items-start gap-1 min-w-[100px] sm:min-w-[120px] shadow-sm ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200 ring-2 ring-primary-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'}`}
                                        >
                                            <div className={`absolute -top-2 -right-1 sm:-top-4 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base font-black shadow-xl border-2 ${isActive ? 'bg-white text-primary-600 border-primary-100' : 'bg-primary-600 text-white border-white'}`}>
                                                {count}
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></div>
                                                <span className={`text-[10px] sm:text-[12px] font-black truncate max-w-[80px] sm:max-w-[90px] ${isActive ? 'text-white' : 'text-slate-900'}`}>Dr. {doc.name.split(' ').pop()}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 w-full text-left mt-0.5">
                                                <div className={`flex justify-between items-center ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                                    <span className="text-[9px] sm:text-[10px] font-extrabold opacity-60">NOW</span>
                                                    <span className={`text-xs sm:text-[15px] font-black leading-none ${isActive ? 'text-white' : 'text-emerald-600'}`}>
                                                        {current ? `#${current.tokenNumber}` : '--'}
                                                    </span>
                                                </div>
                                                <div className={`flex justify-between items-center ${isActive ? 'text-white/90' : 'text-slate-500'}`}>
                                                    <span className="text-[9px] sm:text-[10px] font-extrabold opacity-60">NEXT</span>
                                                    <span className={`text-xs sm:text-[15px] font-black leading-none ${isActive ? 'text-primary-100' : 'text-blue-500'}`}>
                                                        {next ? `#${next.tokenNumber}` : '--'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4 sm:gap-0">
                                <div className="flex gap-2 p-1.5 bg-slate-200/40 rounded-2xl border border-slate-200/50 overflow-x-auto w-full sm:w-auto no-scrollbar">
                                    {(['LIVE', 'HOLD', 'DONE', 'ABSENT'] as const).map(t => {
                                        const isActive = O === t;
                                        const colorSet = queueTabColors[t];
                                        const count = tabCounts[t];
                                        const Icon = t === 'LIVE' ? Activity : t === 'HOLD' ? PauseCircle : t === 'DONE' ? CheckCircle2 : XCircle;

                                        return (
                                            <button 
                                                key={t}
                                                onClick={() => ee(t)}
                                                className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-1 sm:flex-none flex items-center gap-2 ${isActive ? `${colorSet.active} border-transparent shadow-md` : `${colorSet.inactive} border-transparent hover:border-slate-100`}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {t}
                                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white/20' : 'bg-slate-200/50'}`}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date Context:</span>
                                    <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-primary-400 transition-all">
                                        <button 
                                            onClick={() => navigateDate('PREV')} 
                                            className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 border-r border-slate-200 transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center px-3 gap-2">
                                            <CalendarDays className="h-3.5 w-3.5 text-primary-500" />
                                            <input 
                                                type="date" 
                                                value={ut} 
                                                onChange={e => Gn(e.target.value)} 
                                                className="bg-transparent border-none py-2 text-xs font-black text-slate-700 outline-none" 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => navigateDate('NEXT')} 
                                            className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 border-l border-slate-200 transition-colors"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 px-0 md:px-8 pb-0 md:pb-8">
                                <div className="h-full bg-slate-50 md:bg-white rounded-none md:rounded-[2.5rem] border-0 md:border border-slate-200 md:shadow-xl md:shadow-slate-200/50 overflow-hidden flex flex-col">
                                    <QueueTable 
                                        patients={filteredPatients} 
                                        doctors={s} 
                                        estimatedTimes={estimatedTimesMap} 
                                        isFiltered={true}
                                        onUpdateStatus={onUpdateStatus} 
                                        onManualReorder={M} 
                                        onDragDrop={W} 
                                        onManualCheckIn={onManualCheckIn} 
                                        onEditPatient={(p) => setEditingPatient(p)} 
                                        onVitalsClick={(p) => setVitalsPatient(p)} 
                                        onToggleEmergency={te} 
                                        onNoShowPatient={(id) => onUpdateStatus(id, PatientStatus.SKIPPED)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {ke === 'DATABASE' && <div className="p-4 md:p-8 h-full overflow-hidden"><div className="h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden"><PatientDatabaseTable patients={t} doctors={s} onHistoryClick={(p) => setHistoryPatient(p)} onEditClick={(p) => setEditingPatient(p)} onDeleteClick={(p) => onDeletePatient(p.id)} /></div></div>}
                    {ke === 'DOCTORS' && (
                        <DoctorManager 
                            doctors={s} 
                            onAddDoctor={() => { setEditingDoctor(null); setIsDoctorModalOpen(true); }} 
                            onEditDoctor={(doc) => { setEditingDoctor(doc); setIsDoctorModalOpen(true); }} 
                            onDeleteDoctor={(id) => { const d = s.find(doc => doc.id === id); if(d) setDoctorToDelete(d); }} 
                            onAddPresetSlot={() => {}} 
                            onStatusChange={(id, status) => onEditDoctor(id, { status })} 
                        />
                    )}
                    {ke === 'REPORTS' && <ReceptionStats patients={t} doctors={s} />}
                    {ke === 'SETTINGS' && (
                        <div className="p-4 md:p-8 h-full overflow-hidden">
                            <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Clinic Configuration</h2>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Manage your clinic profile, location, and operating hours.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 mx-6 mt-6 rounded-2xl self-start shadow-inner border border-slate-200">
                                        {(['GENERAL', 'PROFILE', 'LOCATION', 'HOURS'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setSettingsSubTab(tab)}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}
                                            >
                                                {tab === 'GENERAL' && <Layout className="h-4 w-4" />}
                                                {tab === 'PROFILE' && <ImageIcon className="h-4 w-4" />}
                                                {tab === 'LOCATION' && <MapPin className="h-4 w-4" />}
                                                {tab === 'HOURS' && <CalendarClock className="h-4 w-4" />}
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSettingsSave} className="flex-1 flex flex-col overflow-hidden p-6">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
                                            {settingsSubTab === 'GENERAL' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                                    <div className="space-y-6">
                                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinic Identity</span></div>
                                                        <Input label="Clinic Name" value={settingsForm.name || ''} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} required />
                                                        <Input label="Contact Phone" value={settingsForm.contactPhone || ''} onChange={e => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })} />
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-2">Operation Mode</label>
                                                            <select 
                                                                className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold bg-white"
                                                                value={settingsForm.operationMode}
                                                                onChange={e => setSettingsForm({ ...settingsForm, operationMode: e.target.value as ClinicOperationMode })}
                                                            >
                                                                {Object.values(ClinicOperationMode).map(mode => <option key={mode} value={mode}>{mode.replace(/_/g, ' ')}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                            <div>
                                                                <label htmlFor="enableAdvanceBooking" className="text-sm font-bold text-slate-800">Enable Advance Token Booking</label>
                                                                <p className="text-xs text-slate-500 mt-1">Allow patients to book a token for a future shift on the same day.</p>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                id="enableAdvanceBooking"
                                                                checked={settingsForm.enableAdvanceBooking || false}
                                                                onChange={e => setSettingsForm({ ...settingsForm, enableAdvanceBooking: e.target.checked })}
                                                                className="h-5 w-5 rounded-md text-primary-600 focus:ring-2 focus:ring-primary-500/50 border-slate-300 shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {settingsSubTab === 'PROFILE' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                                    <div className="space-y-6">
                                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Branding</span></div>
                                                        <div className="relative aspect-video bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center hover:border-primary-400 transition-all group">
                                                            {settingsForm.imageUrl ? (
                                                                <>
                                                                    <img src={settingsForm.imageUrl} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-xl text-slate-900"><Upload className="h-5 w-5" /></button>
                                                                        <button type="button" onClick={() => setSettingsForm(prev => ({ ...prev, imageUrl: '' }))} className="p-3 bg-white rounded-xl text-red-600"><Trash2 className="h-5 w-5" /></button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 text-slate-400 hover:text-primary-600 transition-colors">
                                                                    <ImageIcon className="h-12 w-12 opacity-20" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Upload Clinic Banner</span>
                                                                </button>
                                                            )}
                                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                                        </div>
                                                        <textarea 
                                                            className="w-full h-32 p-4 rounded-2xl border border-slate-300 text-sm font-bold bg-slate-50 focus:bg-white outline-none resize-none" 
                                                            placeholder="Clinic overview..."
                                                            value={settingsForm.about || ''}
                                                            onChange={e => setSettingsForm(prev => ({ ...prev, about: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenities</span></div>
                                                        <div className="flex gap-2">
                                                            <input type="text" className="flex-1 h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold" placeholder="Add amenity..." value={amenityInput} onChange={e => setAmenityInput(e.target.value)} />
                                                            <button type="button" onClick={() => handleAddAmenity()} className="bg-primary-600 text-white px-4 rounded-xl font-bold">ADD</button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {settingsForm.amenities?.map((a, i) => (
                                                                <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-900 text-[10px] font-black border border-primary-100 rounded-xl">
                                                                    {a} <button type="button" onClick={() => setSettingsForm(prev => ({ ...prev, amenities: prev.amenities?.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {settingsSubTab === 'LOCATION' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in h-full">
                                                    <div className="col-span-1 space-y-6">
                                                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden flex-shrink-0 group">
                                                            <Target className="absolute -top-6 -right-6 h-24 w-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                                                            <h4 className="text-sm font-black mb-2 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary-400" /> GPS Precision Pins</h4>
                                                            <p className="text-[10px] text-slate-400 leading-relaxed mb-6 uppercase tracking-wider">Enable live travel tracking for your patients by accurately pinning your entrance.</p>
                                                            <div className="grid grid-cols-1 gap-3 mb-6">
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary-400 opacity-50">LAT</span>
                                                                    <input 
                                                                        type="number" 
                                                                        step="0.000001" 
                                                                        value={settingsForm.geoLocation?.lat ?? ""} 
                                                                        onChange={e => {
                                                                            const val = parseFloat(e.target.value);
                                                                            if (!isNaN(val)) setSettingsForm(prev => ({ ...prev, geoLocation: { lat: val, lng: prev.geoLocation?.lng || 0 } }));
                                                                        }}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/30 outline-none text-white shadow-inner"
                                                                        placeholder="0.000000"
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary-400 opacity-50">LNG</span>
                                                                    <input 
                                                                        type="number" 
                                                                        step="0.000001" 
                                                                        value={settingsForm.geoLocation?.lng ?? ""} 
                                                                        onChange={e => {
                                                                            const val = parseFloat(e.target.value);
                                                                            if (!isNaN(val)) setSettingsForm(prev => ({ ...prev, geoLocation: { lat: prev.geoLocation?.lat || 0, lng: val } }));
                                                                        }}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/30 outline-none text-white shadow-inner"
                                                                        placeholder="0.000000"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={handleLocateMe}
                                                                disabled={isLocating}
                                                                className={`w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${isLocating ? 'bg-slate-800 text-slate-500' : 'bg-primary-600 text-white hover:bg-primary-500 hover:scale-[1.02] active:scale-95'}`}
                                                            >
                                                                {isLocating ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LocateFixed className="h-4 w-4" />} Sync GPS Location
                                                            </button>
                                                        </div>
                                                        <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] space-y-4 shadow-sm flex-shrink-0">
                                                            <Input label="Mailing Address" value={settingsForm.address || ''} onChange={e => setSettingsForm(prev => ({ ...prev, address: e.target.value }))} className="h-11 rounded-xl text-sm" />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <Input label="City" value={settingsForm.city || ''} onChange={e => setSettingsForm(prev => ({ ...prev, city: e.target.value }))} className="h-11 rounded-xl text-sm" />
                                                                <Input label="Pincode" value={settingsForm.pincode || ''} onChange={e => setSettingsForm(prev => ({ ...prev, pincode: e.target.value }))} className="h-11 rounded-xl text-sm" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 relative min-h-[400px] rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl bg-slate-100 ring-4 ring-slate-100">
                                                        <MapContainer center={[settingsForm.geoLocation?.lat || 13.085, settingsForm.geoLocation?.lng || 80.21]} zoom={15} className="h-full w-full z-0">
                                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                            <MapInvalidator center={[settingsForm.geoLocation?.lat || 13.085, settingsForm.geoLocation?.lng || 80.21]} isTabActive={settingsSubTab === 'LOCATION'} />
                                                            <LocationPicker onSelect={handleLocationSelected} />
                                                            {settingsForm.geoLocation && <Marker position={[settingsForm.geoLocation.lat, settingsForm.geoLocation.lng]} />}
                                                        </MapContainer>
                                                        <div className="absolute bottom-6 right-6 z-10 bg-slate-900/95 backdrop-blur-xl text-white px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
                                                            <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_15px_#14b8a6]" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Live Geosync Engaged</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {settingsSubTab === 'HOURS' && (
                                                <div className="animate-in fade-in duration-300 space-y-6">
                                                    <div className="border-b border-slate-100 pb-3 flex justify-between items-end">
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Weekly Working Hours</span>
                                                            <p className="text-xs text-slate-500 mt-1">Define the outer boundary for doctor schedules.</p>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={copyMondayToAll}
                                                            className="text-primary-600 text-[10px] font-black uppercase tracking-widest hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition-colors"
                                                        >
                                                            <Copy className="h-3 w-3" /> Copy Mon to All
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {settingsForm.workingHours?.map((config, dayIndex) => (
                                                            <div key={config.dayOfWeek} className={`p-4 rounded-2xl border transition-all ${config.isOpen ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 font-black text-slate-700">{config.dayOfWeek}</div>
                                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={config.isOpen} 
                                                                            onChange={() => handleWorkingHoursToggle(dayIndex)}
                                                                            className="w-5 h-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                        />
                                                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{config.isOpen ? 'Open' : 'Closed'}</span>
                                                                    </label>
                                                                    {config.isOpen && (
                                                                        <button type="button" onClick={() => addWorkingHoursShift(dayIndex)} className="ml-auto text-primary-600 text-[10px] font-black uppercase tracking-widest hover:text-primary-700 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Shift</button>
                                                                    )}
                                                                </div>
                                                                {config.isOpen && (
                                                                    <div className="mt-4 space-y-2 pl-16">
                                                                        {config.shifts.map((shift, sIndex) => (
                                                                            <div key={sIndex} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                                                                                <input type="time" value={shift.start} onChange={(e) => handleWorkingHoursShiftChange(dayIndex, sIndex, 'start', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" />
                                                                                <span className="text-slate-300 font-bold">-</span>
                                                                                <input type="time" value={shift.end} onChange={(e) => handleWorkingHoursShiftChange(dayIndex, sIndex, 'end', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" />
                                                                                <button type="button" onClick={() => removeWorkingHoursShift(dayIndex, sIndex)} className="text-red-400 hover:text-red-600 p-1"><X className="h-3 w-3" /></button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 flex flex-col-reverse xs:flex-row justify-end gap-3 border-t border-slate-100 mt-6 bg-white flex-shrink-0">
                                            <Button type="submit" className="w-full xs:w-auto px-16 rounded-2xl shadow-2xl shadow-primary-900/20 font-black uppercase tracking-[0.2em] h-12 bg-primary-600 hover:bg-primary-700 active:scale-[0.95] transition-all transform"><Save className="h-5 w-5 mr-3" /> Save Changes</Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AddPatientModal isOpen={isPatientModalOpen || !!editingPatient} onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} mode={editingPatient ? 'EDIT' : 'ADD'} initialData={editingPatient} operationMode={f} onAdd={onAddPatient} onEdit={onEditPatient} doctors={s} patients={t} addToast={he} />
            <PatientHistoryModal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} patient={historyPatient} allClinicsPatients={t} doctors={s} />
            <VitalsModal isOpen={!!vitalsPatient} onClose={() => setVitalsPatient(null)} patient={vitalsPatient} onSave={(pid, vitals) => onEditPatient(pid, { vitals })} />
            
            <DoctorFormModal 
                isOpen={isDoctorModalOpen || !!editingDoctor} 
                onClose={() => { setIsDoctorModalOpen(false); setEditingDoctor(null); }} 
                mode={editingDoctor ? 'EDIT' : 'ADD'} 
                initialData={editingDoctor || undefined} 
                onCheckMasterDoctor={C}
                addToast={he}
                clinicOperatingHours={m?.operatingHours} // Pass clinic operating hours for validation
                clinicWorkingHours={m?.workingHours}
                validateSlot={(day, start, end) => {
                    if (!m?.workingHours) return { isValid: true };
                    const dayShort = day.substring(0, 3).toUpperCase();
                    const dayConfig = m.workingHours.find(d => d.dayOfWeek === dayShort);
                    return validateDoctorSchedule(dayConfig, start, end);
                }}
                onSave={(data) => {
                    if (editingDoctor) {
                        // Map form data to Doctor object for editing
                        const doctorUpdates: Partial<Doctor> = {
                            ...data,
                            roomNumber: data.room, // map `room` to `roomNumber`
                            weeklySchedule: data.schedule, // ensure schedule is passed
                            consultationFee: data.fee,
                            consultationTime: data.consultationTime,
                        };
                        onEditDoctor(editingDoctor.id, doctorUpdates);
                    } else {
                        // Map form data to Doctor object for adding
                        const newDoctorData: Partial<Doctor> = {
                            ...data,
                            roomNumber: data.room,
                            weeklySchedule: data.schedule,
                            consultationFee: data.fee,
                            consultationTime: data.consultationTime,
                        };
                        onAddDoctor(newDoctorData);
                    }
                }}
            />

            <ConfirmationModal 
                isOpen={!!doctorToDelete} 
                onClose={() => setDoctorToDelete(null)} 
                onConfirm={() => { if(doctorToDelete) { onDeleteDoctor(doctorToDelete.id); setDoctorToDelete(null); } }} 
                title="Remove Doctor Profile?" 
                message={`Are you sure you want to remove Dr. ${doctorToDelete?.name}? All their queue data for this clinic will be lost.`} 
                confirmLabel="Remove Doctor" 
                variant="danger" 
            />
        </div>
    );
};
