import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { 
    Clock, List, Database, Stethoscope, BarChart3, Search, Filter, UserPlus, XCircle, Activity, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { QueueTable } from '../features/reception/components/QueueTable';
import { PatientDatabaseTable } from '../features/reception/components/PatientDatabaseTable';
import { DoctorManager } from '../features/reception/components/DoctorManager';
import { ReceptionStats } from '../features/reception/components/ReceptionStats';
import { AddPatientModal } from '../features/reception/components/AddPatientModal';
import { DoctorFormModal } from '../features/reception/components/DoctorFormModal';

interface ReceptionDashboardProps {
    doctors: Doctor[];
    patients: Patient[];
    clinicName: string;
    clinicType?: ClinicType;
    onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => void;
    onEditPatient: (id: string, updates: Partial<Patient>) => void;
    onDeletePatient: (id: string) => void;
    onDeleteMultiplePatients: (ids: string[]) => void;
    onAddDoctor: (name: string, specialty: string, room: string, schedule: any[], mobile?: string, regNo?: string, masterId?: string, avatarUrl?: string, fee?: number, time?: number) => void;
    onCheckMasterDoctor: (mobile: string) => Doctor | null;
    onEditDoctor: (id: string, updates: Partial<Doctor>) => void;
    onDeleteDoctor: (id: string) => void;
    onUpdateStatus: (id: string, status: PatientStatus) => void;
    onCancelPatient: (id: string) => void;
    onUpdateClinicName: (name: string) => void;
    onToggleEmergency: (id: string) => void;
    onManualReorder: (id: string, direction: 'UP' | 'DOWN') => void;
    onDragDrop: (draggedId: string, targetId: string) => void;
    onManualCheckIn: (id: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, clinicName, onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onCancelPatient, onUpdateClinicName, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, addToast
}) => {
    const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'REPORTS'>('QUEUE');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // 'ACTIVE', 'ALL', 'WAITING', 'WITH_DOCTOR'
    const [filterType, setFilterType] = useState<string>('ALL');

    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    
    // Doctor Modal State
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

    // Edit Patient Modal
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

    // Deck State
    const [isDeckExpanded, setIsDeckExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        let stats = [...doctorQueueStats];
        // If filtering by a doctor, bring them to front
        if (filterDoctorId !== 'ALL') {
            const selected = stats.find(s => s.doc.id === filterDoctorId);
            const others = stats.filter(s => s.doc.id !== filterDoctorId);
            if (selected) stats = [selected, ...others];
        }
        return stats;
    }, [doctorQueueStats, filterDoctorId]);

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
                phone: editingPatient.phone
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

    const getPatientHistoryData = (patient: Patient) => {
        return patients.filter(p => p.phone === patient.phone).sort((a, b) => b.timeAdded - a.timeAdded);
    };

    const isFiltered = searchQuery !== '' || filterDoctorId !== 'ALL' || filterStatus !== 'ACTIVE' || filterType !== 'ALL';

    return (
        <div className="h-full flex flex-col bg-slate-50 w-full max-w-[100vw] overflow-hidden">
            {/* HEADER & TABS */}
            <div className="flex flex-col flex-shrink-0 bg-white shadow-sm z-30 w-full">
                <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{clinicName}</h1>
                        <div className="hidden sm:flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg Wait: 15m</span>
                            <span>•</span>
                            <span>{patients.filter(p => p.status === PatientStatus.WAITING).length} Waiting</span>
                        </div>
                    </div>
                    {/* DESKTOP TABS */}
                    <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-lg flex-shrink-0">
                        <button onClick={() => setActiveTab('QUEUE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'QUEUE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><List className="h-3 w-3" /> Queue</button>
                        <button onClick={() => setActiveTab('DATABASE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DATABASE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Database className="h-3 w-3" /> Patients</button>
                        <button onClick={() => setActiveTab('DOCTORS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DOCTORS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Stethoscope className="h-3 w-3" /> Staff</button>
                        <button onClick={() => setActiveTab('REPORTS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'REPORTS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><BarChart3 className="h-3 w-3" /> Reports</button>
                    </div>
                </div>

                {/* DOCTOR STATUS DECK (COMPACT COLLAPSIBLE GRID) */}
                {activeTab === 'QUEUE' && (
                    <div className="bg-white border-b border-slate-200 w-full overflow-hidden transition-all duration-300">
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

            {/* TOOLBAR (MERGED) */}
            {(activeTab === 'QUEUE' || activeTab === 'DATABASE') && (
                <div className="px-2 py-2 sm:px-4 sm:py-3 border-b border-slate-200 bg-white flex items-center gap-2 sticky top-0 z-20 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" 
                            placeholder={activeTab === 'QUEUE' ? "Search patient..." : "Search database..."} 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>

                    {/* Filters Group */}
                    {activeTab === 'QUEUE' && (
                        <div className="hidden sm:flex gap-2">
                            <select className="h-10 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-2 max-w-[120px] focus:ring-primary-500 focus:border-primary-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="ACTIVE">Active</option>
                                <option value="ALL">All</option>
                                <option value={PatientStatus.WAITING}>Waiting</option>
                                <option value={PatientStatus.WITH_DOCTOR}>Serving</option>
                            </select>
                        </div>
                    )}

                    {/* Mobile Filter Icon (Simplified) */}
                    <button className="sm:hidden h-10 w-10 flex items-center justify-center border border-slate-300 rounded-lg text-slate-600 active:bg-slate-100">
                        <Filter className="h-4 w-4" />
                    </button>

                    <Button className="h-10 px-4 whitespace-nowrap shadow-sm bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsPatientModalOpen(true)}>
                        <UserPlus className="h-4 w-4 sm:mr-2" /> 
                        <span className="hidden sm:inline">Add Patient</span>
                    </Button>

                    {isFiltered && (
                        <button onClick={clearFilters} className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors">
                            <XCircle className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )}

            {/* MAIN CONTENT AREA - Added bottom padding for mobile nav */}
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
                    <span className="text-[10px] font-bold">Staff</span>
                </button>
                <button onClick={() => setActiveTab('REPORTS')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${activeTab === 'REPORTS' ? 'text-primary-700' : 'text-slate-400'}`}>
                    <div className={`p-1 rounded-full ${activeTab === 'REPORTS' ? 'bg-primary-50' : ''}`}>
                        <BarChart3 className={`h-5 w-5 ${activeTab === 'REPORTS' ? 'stroke-primary-600' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold">Reports</span>
                </button>
            </nav>

            {/* MODALS */}
            <AddPatientModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onAdd={onAddPatient} doctors={doctors} patients={patients} addToast={addToast} />
            <DoctorFormModal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} mode={doctorModalMode} initialData={editingDoctorData} onSave={handleSaveDoctor} onCheckMasterDoctor={onCheckMasterDoctor} addToast={addToast} />
            
            <Modal isOpen={!!editingPatient} onClose={() => setEditingPatient(null)} title="Edit Patient Profile" maxWidth="max-w-md">
                {editingPatient && (
                    <form onSubmit={handleSaveEditedPatient} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2 border border-blue-100 flex gap-2"><Activity className="h-5 w-5 flex-shrink-0" /><p>Changes apply to <strong>all visits</strong>.</p></div>
                        <Input label="Name" value={editingPatient.name} onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Age" value={editingPatient.age || ''} onChange={(e) => setEditingPatient({...editingPatient, age: e.target.value})} />
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editingPatient.gender} onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                        </div>
                        <Input label="Phone" value={editingPatient.phone} onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})} required />
                        <div className="pt-2 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setEditingPatient(null)}>Cancel</Button><Button type="submit">Save</Button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!vitalsPatient} onClose={() => setVitalsPatient(null)} title="Record Vitals" maxWidth="max-w-2xl">
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