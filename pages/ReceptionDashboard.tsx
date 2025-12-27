
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, Staff, ClinicOperationMode, Clinic, AppointmentConfig } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp, Users, MapPin, Settings, Footprints, CalendarClock, Shuffle, Building2, ImageIcon, Plus, X, Globe, Crosshair, Trash2, Info, LayoutGrid, Zap, Mail, Shield, Save, Calendar, UserX, CheckCircle2, PauseCircle, LogOut, Upload, Image as LucideImage, Map as LucideMap, Navigation, ArrowRight, Target, LocateFixed, MapPinIcon, Layout, MessageSquare, Sparkles, CalendarDays,
    Edit2, ChevronLeft, LayoutPanelTop, Monitor, Smartphone, Bell, LifeBuoy
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
    onLogout?: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
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
                if (!isNaN(center[0]) && !isNaN(center[1])) {
                    map.setView(center, map.getZoom());
                }
            }, 100);
        }
    }, [isTabActive, center, map]);
    return null;
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, staff = [], clinicName, clinicType, operationMode = ClinicOperationMode.HYBRID_FULL, clinicData,
    onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onCancelPatient, onUpdateClinicSettings, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, onBulkUpdateStatus, 
    onAddStaff, onUpdateStaff, onDeleteStaff, onLogout, addToast
}) => {
    type DashboardTab = 'QUEUE' | 'DATABASE' | 'DOCTORS' | 'REPORTS' | 'APPOINTMENTS';
    const [activeTab, setActiveTab] = useState<DashboardTab>('QUEUE');
    const [queueSubTab, setQueueSubTab] = useState<'LIVE' | 'HOLD' | 'DONE' | 'ABSENT'>('LIVE');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
    const [filterDate, setFilterDate] = useState<string>(() => getLocalToday(clinicData?.timezone));

    // Modals
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
    
    // Settings Modal States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsSubTab, setSettingsSubTab] = useState<'GENERAL' | 'PROFILE' | 'LOCATION'>('GENERAL');
    const [settingsForm, setSettingsForm] = useState<Partial<Clinic>>({});
    const [amenityInput, setAmenityInput] = useState('');
    const [operatingShifts, setOperatingShifts] = useState([{ start: '09:00', end: '21:00' }]);
    const [isLocating, setIsLocating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentTime, setCurrentTime] = useState(() => getClinicCurrentTime(clinicData?.timezone));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getClinicCurrentTime(clinicData?.timezone)), 1000);
        return () => clearInterval(timer);
    }, [clinicData?.timezone]);

    // Populate settings form when opened
    useEffect(() => {
        if (isSettingsOpen && clinicData) {
            setSettingsForm({
                ...clinicData,
                amenities: [...(clinicData.amenities || [])],
                geoLocation: clinicData.geoLocation || { lat: 13.085, lng: 80.21 }
            });
            
            if (clinicData.operatingHours) {
                const shifts = clinicData.operatingHours.split(',').map(s => {
                    const parts = s.trim().split('-').map(p => p.trim());
                    return parts.length === 2 ? { start: parseTimeTo24h(parts[0]), end: parseTimeTo24h(parts[1]) } : { start: '09:00', end: '21:00' };
                });
                setOperatingShifts(shifts);
            }
        }
    }, [isSettingsOpen, clinicData]);

    const estimatedTimesMap = useMemo(() => {
        const times: Record<string, number> = {};
        doctors.forEach(doc => {
            const docQueue = patients.filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                                    .sort((a, b) => a.timeAdded - b.timeAdded);
            let nextAvailable = Date.now();
            if (doc.delayMinutes > 0) nextAvailable += doc.delayMinutes * 60000;
            docQueue.forEach((p, idx) => {
                times[p.id] = nextAvailable + (idx * (doc.consultationTime || 15) * 60000);
            });
        });
        return times;
    }, [doctors, patients]);

    const stats = useMemo(() => {
        const today = getLocalToday(clinicData?.timezone);
        const todayPatients = patients.filter(p => {
            const pDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
            return pDate === today;
        });
        return {
            total: todayPatients.length,
            waiting: todayPatients.filter(p => p.status === PatientStatus.WAITING).length,
            done: todayPatients.filter(p => p.status === PatientStatus.COMPLETED).length,
            revenue: todayPatients.filter(p => p.status === PatientStatus.COMPLETED).reduce((acc, p) => {
                const doc = doctors.find(d => d.id === p.doctorId);
                return acc + (doc?.consultationFee || 0);
            }, 0)
        };
    }, [patients, doctors, clinicData]);

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

    const sidebarItems = [
        { id: 'QUEUE', label: 'Control Tower', icon: Monitor },
        { id: 'DATABASE', label: 'Patient CRM', icon: Users },
        { id: 'DOCTORS', label: 'Medical Staff', icon: Stethoscope },
        { id: 'REPORTS', label: 'Business Stats', icon: BarChart3 },
    ];

    const navigateDate = (direction: 'PREV' | 'NEXT') => {
        const d = new Date(filterDate);
        d.setDate(d.getDate() + (direction === 'NEXT' ? 1 : -1));
        setFilterDate(d.toISOString().split('T')[0]);
    };

    const handleSettingsSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedHours = operatingShifts.map(s => `${format12h(s.start)} - ${format12h(s.end)}`).join(', ');
        onUpdateClinicSettings({
            ...settingsForm,
            operatingHours: formattedHours
        });
        setIsSettingsOpen(false);
        addToast("Clinic settings updated!", "success");
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
        // Optimistically update markers
        setSettingsForm(prev => ({ 
            ...prev, 
            geoLocation: { lat: latlng.lat, lng: latlng.lng } 
        }));
        
        // Fetch full address details
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
                
                // Set coordinates
                setSettingsForm(prev => ({ ...prev, geoLocation: { lat, lng } }));
                
                // Fetch Address
                try {
                    const { address, city, pincode } = await reverseGeocode(lat, lng);
                    setSettingsForm(prev => ({ 
                        ...prev, 
                        address: address || prev.address,
                        city: city || prev.city,
                        pincode: pincode || prev.pincode
                    }));
                    addToast("Location and address synced!", "success");
                } catch (e) {
                    addToast("Location synced, but address lookup failed.", "warning");
                }
                
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                addToast("Could not access your location.", "error");
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

    return (
        <div className="h-screen flex bg-slate-100 overflow-hidden">
            {/* SaaS Vertical Sidebar */}
            <aside className={`bg-slate-900 flex flex-col transition-all duration-300 relative z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`p-6 flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <Logo className="h-8 w-8 shrink-0" />
                    {!isSidebarCollapsed && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className="text-white font-black text-lg tracking-tight leading-none">Smart<span className="text-teal-400">QFlow</span></h1>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OPD System</span>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-24 bg-teal-500 text-slate-900 p-1 rounded-full shadow-lg hover:bg-teal-400 transition-all z-[60]"
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as DashboardTab)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-teal-500 text-slate-900 shadow-xl shadow-teal-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                            title={isSidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`h-5 w-5 shrink-0 ${activeTab === item.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-teal-400'}`} />
                            {!isSidebarCollapsed && <span className="font-black text-xs uppercase tracking-widest truncate animate-in fade-in slide-in-from-left-2">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-3 mt-auto border-t border-white/5">
                    <button 
                        onClick={() => setIsSettingsOpen(true)} 
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center' : ''} ${isSettingsOpen ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        title={isSidebarCollapsed ? 'Clinic Setup' : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        {!isSidebarCollapsed && <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2">Clinic Setup</span>}
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

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
                    <div className="flex items-center gap-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeTab === 'QUEUE' ? 'Live Mission Control' : activeTab.replace('_', ' ')}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{clinicName}</span>
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

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-2xl h-11 px-4 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all mr-2">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input 
                                type="text" 
                                placeholder="Patient Name / Phone..." 
                                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-48 placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block text-right mr-3">
                                <p className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight">{clinicName}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{clinicData?.city || 'Chennai'}</p>
                            </div>
                            <Button 
                                onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                                className="bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-500/10 rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-widest"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Check-in
                            </Button>
                            <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl border border-transparent hover:border-red-100" title="Log out">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {activeTab === 'QUEUE' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Doctor Select Ribbon */}
                            <div className="bg-white border-b border-slate-100 px-6 py-3 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                                <button 
                                    onClick={() => setFilterDoctorId('ALL')} 
                                    className={`px-6 py-3 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border flex flex-col items-center justify-center min-w-[120px] ${filterDoctorId === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    ALL QUEUES
                                </button>
                                {doctors.map(doc => {
                                    const serving = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
                                    const nextInQueue = patients
                                        .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                                        .sort((a, b) => a.timeAdded - b.timeAdded)[0];
                                    
                                    const isActive = filterDoctorId === doc.id;

                                    return (
                                        <button 
                                            key={doc.id} 
                                            onClick={() => setFilterDoctorId(doc.id)} 
                                            className={`px-4 py-2.5 h-16 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap border flex flex-col items-start gap-1 min-w-[140px] shadow-sm ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200 ring-2 ring-primary-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></div>
                                                <span className={`text-[11px] ${isActive ? 'text-white' : 'text-slate-900'}`}>Dr. {doc.name.split(' ').pop()}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[9px] mt-1">
                                                <span className={`flex items-center gap-1 font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                                    NOW: 
                                                    <span className={`font-black ${isActive ? 'text-white' : 'text-primary-600'}`}>
                                                        {serving ? `#${serving.tokenNumber}` : '--'}
                                                    </span>
                                                </span>
                                                <span className={`flex items-center gap-1 font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                                    NEXT: 
                                                    <span className={`font-black ${isActive ? 'text-white' : 'text-indigo-500'}`}>
                                                        {nextInQueue ? `#${nextInQueue.tokenNumber}` : '--'}
                                                    </span>
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="px-8 py-4 flex items-center justify-between shrink-0">
                                <div className="flex gap-2 p-1.5 bg-slate-200/40 rounded-2xl border border-slate-200/50">
                                    {(['LIVE', 'HOLD', 'DONE', 'ABSENT'] as const).map(t => {
                                        const isActive = queueSubTab === t;
                                        const colorSet = queueTabColors[t];
                                        return (
                                            <button 
                                                key={t}
                                                onClick={() => setQueueSubTab(t)}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isActive ? `${colorSet.active} border-transparent shadow-md` : `${colorSet.inactive} border-transparent hover:border-slate-100`}`}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3">
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
                                                value={filterDate} 
                                                onChange={e => setFilterDate(e.target.value)} 
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

                            <div className="flex-1 min-h-0 px-8 pb-8">
                                <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                                    <QueueTable 
                                        patients={filteredPatients} 
                                        doctors={doctors} 
                                        estimatedTimes={estimatedTimesMap} 
                                        isFiltered={true}
                                        onUpdateStatus={onUpdateStatus} 
                                        onManualReorder={onManualReorder} 
                                        onDragDrop={onDragDrop} 
                                        onManualCheckIn={onManualCheckIn}
                                        onEditPatient={(p) => setEditingPatient(p)} 
                                        onVitalsClick={(p) => setVitalsPatient(p)} 
                                        onToggleEmergency={onToggleEmergency}
                                        onNoShowPatient={(id) => onUpdateStatus(id, PatientStatus.SKIPPED)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'DATABASE' && <div className="p-8 h-full overflow-hidden"><div className="h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden"><PatientDatabaseTable patients={patients} doctors={doctors} onHistoryClick={(p) => setHistoryPatient(p)} onEditClick={(p) => setEditingPatient(p)} onDeleteClick={(p) => onDeletePatient(p.id)} /></div></div>}
                    {activeTab === 'DOCTORS' && (
                        <DoctorManager 
                            doctors={doctors} 
                            onAddDoctor={() => { setEditingDoctor(null); setIsDoctorModalOpen(true); }} 
                            onEditDoctor={(doc) => { setEditingDoctor(doc); setIsDoctorModalOpen(true); }} 
                            onDeleteDoctor={(id) => { const d = doctors.find(doc => doc.id === id); if(d) setDoctorToDelete(d); }} 
                            onAddPresetSlot={() => {}} 
                            onStatusChange={(id, status) => onEditDoctor(id, { status })} 
                        />
                    )}
                    {activeTab === 'REPORTS' && <ReceptionStats patients={patients} doctors={doctors} />}
                </div>
            </main>

            {/* Modals Container */}
            <AddPatientModal isOpen={isPatientModalOpen || !!editingPatient} onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} mode={editingPatient ? 'EDIT' : 'ADD'} initialData={editingPatient} onAdd={onAddPatient} onEdit={onEditPatient} doctors={doctors} patients={patients} addToast={addToast} />
            <PatientHistoryModal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} patient={historyPatient} allClinicsPatients={patients} doctors={doctors} />
            <VitalsModal isOpen={!!vitalsPatient} onClose={() => setVitalsPatient(null)} patient={vitalsPatient} onSave={(pid, vitals) => onEditPatient(pid, { vitals })} />
            
            <DoctorFormModal 
                isOpen={isDoctorModalOpen || !!editingDoctor} 
                onClose={() => { setIsDoctorModalOpen(false); setEditingDoctor(null); }} 
                mode={editingDoctor ? 'EDIT' : 'ADD'} 
                initialData={editingDoctor || undefined} 
                onCheckMasterDoctor={onCheckMasterDoctor}
                addToast={addToast}
                onSave={(data) => {
                    if (editingDoctor) {
                        onEditDoctor(editingDoctor.id, {
                            name: data.name,
                            specialty: data.specialty,
                            roomNumber: data.room,
                            weeklySchedule: data.schedule,
                            mobile: data.mobile,
                            registrationNumber: data.regNo,
                            masterId: data.masterId,
                            avatarUrl: data.avatarUrl,
                            consultationFee: data.fee,
                            consultationTime: data.consultationTime
                        });
                    } else {
                        onAddDoctor(data.name, data.specialty, data.room, data.schedule, data.mobile, data.regNo, data.masterId, data.avatarUrl, data.fee, data.consultationTime);
                    }
                }}
            />

            {/* Clinic Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Clinic Configuration" maxWidth="max-w-5xl">
                <div className="flex flex-col h-[70vh] overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6 self-start shadow-inner border border-slate-200">
                        {(['GENERAL', 'PROFILE', 'LOCATION'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setSettingsSubTab(tab)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab === 'GENERAL' && <Layout className="h-4 w-4" />}
                                {tab === 'PROFILE' && <ImageIcon className="h-4 w-4" />}
                                {tab === 'LOCATION' && <MapPin className="h-4 w-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSettingsSave} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
                            {settingsSubTab === 'GENERAL' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                                    <div className="space-y-6">
                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Identity</span></div>
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
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Operating Shifts</span>
                                            <button type="button" onClick={() => setOperatingShifts([...operatingShifts, { start: '09:00', end: '21:00' }])} className="text-primary-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1"><Plus className="h-3 w-3" /> Add Shift</button>
                                        </div>
                                        <div className="space-y-3">
                                            {operatingShifts.map((shift, idx) => (
                                                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                    <div className="flex-1"><input type="time" value={shift.start} onChange={e => { const newShifts = [...operatingShifts]; newShifts[idx].start = e.target.value; setOperatingShifts(newShifts); }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold" /></div>
                                                    <div className="text-slate-300">to</div>
                                                    <div className="flex-1"><input type="time" value={shift.end} onChange={e => { const newShifts = [...operatingShifts]; newShifts[idx].end = e.target.value; setOperatingShifts(newShifts); }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold" /></div>
                                                    {operatingShifts.length > 1 && <button type="button" onClick={() => setOperatingShifts(operatingShifts.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsSubTab === 'PROFILE' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                                    <div className="space-y-6">
                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branding</span></div>
                                        <div className="relative aspect-video bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center hover:border-primary-400 transition-all group">
                                            {settingsForm.imageUrl ? (
                                                <>
                                                    <img src={settingsForm.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-xl text-slate-900"><Upload className="h-5 w-5" /></button>
                                                        <button type="button" onClick={() => setSettingsForm({ ...settingsForm, imageUrl: '' })} className="p-3 bg-white rounded-xl text-red-600"><Trash2 className="h-5 w-5" /></button>
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
                                            onChange={e => setSettingsForm({ ...settingsForm, about: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="border-b border-slate-100 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenities</span></div>
                                        <div className="flex gap-2">
                                            <input type="text" className="flex-1 h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold" placeholder="Add amenity..." value={amenityInput} onChange={e => setAmenityInput(e.target.value)} />
                                            <Button type="button" onClick={() => { if(amenityInput.trim()){ setSettingsForm({ ...settingsForm, amenities: [...(settingsForm.amenities || []), amenityInput.trim()] }); setAmenityInput(''); } }}>ADD</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {settingsForm.amenities?.map((a, i) => (
                                                <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-900 text-[10px] font-black border border-primary-100 rounded-xl">
                                                    {a} <button type="button" onClick={() => setSettingsForm({ ...settingsForm, amenities: settingsForm.amenities?.filter((_, idx) => idx !== i) })}><X className="h-3 w-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsSubTab === 'LOCATION' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in h-full">
                                    <div className="col-span-1 space-y-6">
                                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4">
                                            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-400" /> GPS Pinning</h4>
                                            <div className="space-y-3">
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center"><span className="text-[9px] font-black text-white/50 uppercase">LAT</span><span className="font-mono text-xs font-bold">{settingsForm.geoLocation?.lat.toFixed(6)}</span></div>
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center"><span className="text-[9px] font-black text-white/50 uppercase">LNG</span><span className="font-mono text-xs font-bold">{settingsForm.geoLocation?.lng.toFixed(6)}</span></div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={handleLocateMe}
                                                className="w-full h-11 bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Sync My GPS
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <Input label="Mailing Address" value={settingsForm.address || ''} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="City" value={settingsForm.city || ''} onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })} />
                                                <Input label="Pincode" value={settingsForm.pincode || ''} onChange={e => setSettingsForm({ ...settingsForm, pincode: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative min-h-[350px]">
                                        <MapContainer center={[settingsForm.geoLocation?.lat || 13.085, settingsForm.geoLocation?.lng || 80.21]} zoom={15} className="h-full w-full">
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapInvalidator center={[settingsForm.geoLocation?.lat || 13.085, settingsForm.geoLocation?.lng || 80.21]} isTabActive={settingsSubTab === 'LOCATION'} />
                                            <LocationPicker onSelect={handleLocationSelected} />
                                            {settingsForm.geoLocation && <Marker position={[settingsForm.geoLocation.lat, settingsForm.geoLocation.lng]} />}
                                        </MapContainer>
                                        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 shadow-lg">Tap Map to Move Pin</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="secondary" type="button" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                            <Button type="submit" className="px-12 shadow-xl shadow-teal-500/20"><Save className="h-5 w-5 mr-2" /> Apply Settings</Button>
                        </div>
                    </form>
                </div>
            </Modal>

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

function Loader2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} className={props.className + " animate-spin"}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
