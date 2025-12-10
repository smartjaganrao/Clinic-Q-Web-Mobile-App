
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, ClinicType, Vitals, DaySchedule, DoctorStatus } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { 
  UserPlus, Search, Filter, Stethoscope, List, Database, Calendar, 
  Clock, XCircle, RefreshCw, History, User, Phone, Activity, PlayCircle, PauseCircle, ChevronRight, Thermometer, Heart, Weight, Zap, Droplets, Menu, BarChart3
} from 'lucide-react';
// Modular Features
import { QueueTable } from '../features/reception/components/QueueTable';
import { PatientDatabaseTable } from '../features/reception/components/PatientDatabaseTable';
import { DoctorManager } from '../features/reception/components/DoctorManager';
import { AddPatientModal } from '../features/reception/components/AddPatientModal';
import { DoctorFormModal } from '../features/reception/components/DoctorFormModal';
import { ReceptionStats } from '../features/reception/components/ReceptionStats';

interface ReceptionDashboardProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  clinicType?: ClinicType;
  onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => void;
  onEditPatient: (id: string, updates: Partial<Patient>) => void;
  onDeletePatient: (id: string) => void;
  onDeleteMultiplePatients: (ids: string[]) => void;
  onAddDoctor: (name: string, specialty: string, room: string, schedule: DaySchedule[], mobile?: string, regNo?: string, masterId?: string, avatarUrl?: string, fee?: number, time?: number) => void;
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

// --- SORTING HELPERS ---
const getSortTime = (p: Patient) => {
    if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
        return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
    }
    return p.timeAdded;
};

const comparePatients = (a: Patient, b: Patient) => {
    const statusScore = (s: PatientStatus) => {
        if (s === PatientStatus.WITH_DOCTOR) return 0;
        if (s === PatientStatus.WAITING) return 1;
        if (s === PatientStatus.ON_HOLD) return 2;
        return 3;
    };
    
    if (statusScore(a.status) !== statusScore(b.status)) {
        return statusScore(a.status) - statusScore(b.status);
    }
    
    if (a.status === PatientStatus.WAITING || a.status === PatientStatus.WITH_DOCTOR) {
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    }
    
    return getSortTime(a) - getSortTime(b);
};

const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
    doctors, patients, clinicName, onAddPatient, onEditPatient, onDeletePatient, onDeleteMultiplePatients, 
    onAddDoctor, onCheckMasterDoctor, onEditDoctor, onDeleteDoctor, onUpdateStatus, onCancelPatient, onUpdateClinicName, 
    onToggleEmergency, onManualReorder, onDragDrop, onManualCheckIn, addToast
}) => {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'REPORTS'>('QUEUE');
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); 
  const [filterType, setFilterType] = useState<string>('ALL');
  
  // Modal States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
  
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  // --- DOCTOR QUEUE STATS (The Deck Data) ---
  const doctorQueueStats = useMemo(() => {
      const todayStr = getLocalTodayStr();
      return doctors.map(doc => {
          const docPatients = patients.filter(p => {
              if (p.doctorId !== doc.id) return false;
              if (p.visitType === 'APPOINTMENT' && p.appointmentDate !== todayStr) return false;
              return p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR;
          }).sort(comparePatients);

          const current = docPatients.find(p => p.status === PatientStatus.WITH_DOCTOR);
          const waitingList = docPatients.filter(p => p.status === PatientStatus.WAITING);
          const next = waitingList.length > 0 ? waitingList[0] : undefined;
          const count = waitingList.length;

          return {
              doc,
              current,
              next,
              count
          };
      });
  }, [doctors, patients, currentTime]);

  // --- QUEUE ESTIMATION ENGINE ---
  const estimatedTimes = useMemo(() => {
    const estimates: Record<string, number> = {};
    const todayStr = getLocalTodayStr();
    
    doctors.forEach(doc => {
        const queue = patients
            .filter(p => {
                if (p.doctorId !== doc.id || p.status !== PatientStatus.WAITING) return false;
                if (p.visitType === 'APPOINTMENT' && p.appointmentDate !== todayStr) return false;
                return true;
            })
            .sort(comparePatients);
            
        let predictedTime = Date.now();
        const duration = doc.consultationTime || 15; 
        
        if (doc.delayMinutes > 0) {
            predictedTime += doc.delayMinutes * 60000;
        }

        const activePatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
        if (activePatient) {
            predictedTime += Math.floor(duration * 0.7) * 60000;
        }

        queue.forEach(p => {
            if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
                const apptTime = new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
                if (!isNaN(apptTime) && predictedTime < apptTime) {
                    predictedTime = apptTime;
                }
            }
            estimates[p.id] = predictedTime;
            predictedTime += duration * 60000; 
        });
    });
    
    return estimates;
  }, [patients, doctors, currentTime]);


  // --- FILTER LOGIC ---
  const filteredPatients = useMemo(() => {
    const todayStr = getLocalTodayStr();

    return patients
      .filter(p => {
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate !== todayStr) {
            return false;
        }
        if (filterDoctorId !== 'ALL' && p.doctorId !== filterDoctorId) return false;
        
        const q = searchQuery.toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.phone.includes(q) && !p.tokenNumber.toString().includes(q)) return false;
        
        if (filterStatus === 'ACTIVE') {
             if (p.status !== PatientStatus.WAITING && p.status !== PatientStatus.WITH_DOCTOR && p.status !== PatientStatus.ON_HOLD) return false;
        } else if (filterStatus !== 'ALL') {
             if (p.status !== filterStatus) return false;
        }

        if (filterType !== 'ALL' && p.visitType !== filterType) return false;

        return true;
      })
      .sort(comparePatients);
  }, [patients, filterDoctorId, searchQuery, filterStatus, filterType, currentTime]);

  const nextUpPatientIds = useMemo(() => {
      const ids = new Set<string>();
      doctorQueueStats.forEach(stat => {
          if (stat.next) ids.add(stat.next.id);
      });
      return ids;
  }, [doctorQueueStats]);

  const uniquePatients = useMemo(() => {
    const map = new Map<string, Patient>();
    const sorted = [...patients].sort((a, b) => b.timeAdded - a.timeAdded);
    sorted.forEach(p => {
        const key = `${p.phone.trim()}_${p.name.trim().toLowerCase()}`;
        if (!map.has(key)) map.set(key, p);
    });
    let result = Array.from(map.values());
    if (activeTab === 'DATABASE' && searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    }
    return result;
  }, [patients, activeTab, searchQuery]);

  const handleSaveDoctor = (data: any) => {
      if (doctorModalMode === 'ADD') {
          onAddDoctor(data.name, data.specialty, data.room, data.schedule, data.mobile, data.regNo, data.masterId, data.avatarUrl, parseInt(data.fee), parseInt(data.consultationTime));
          addToast('New doctor added', 'success');
      } else if (editingDoctorId) {
          onEditDoctor(editingDoctorId, {
              name: data.name, 
              specialty: data.specialty, 
              roomNumber: data.room, 
              consultationFee: parseInt(data.fee) || 0, 
              consultationTime: parseInt(data.consultationTime) || 15,
              weeklySchedule: data.schedule,
              mobile: data.mobile, 
              registrationNumber: data.regNo
          });
          addToast('Doctor details updated', 'success');
      }
      setIsDoctorModalOpen(false);
  };

  const handleAddPresetSlot = (doctorId: string, day: string) => {
      const doc = doctors.find(d => d.id === doctorId);
      if (!doc) return;
      const updatedSchedule = doc.weeklySchedule.map(s => {
          if (s.day === day) {
              const currentSlots = s.slots || [];
              const morningSlot = { startTime: '08:00', endTime: '13:00', label: 'Morning', active: true };
              const exists = currentSlots.some((sl: any) => sl.startTime === morningSlot.startTime && sl.endTime === morningSlot.endTime);
              if (!exists) return { ...s, isOff: false, slots: [...currentSlots, morningSlot] };
              addToast('Slot already exists', 'info');
          }
          return s;
      });
      onEditDoctor(doctorId, { weeklySchedule: updatedSchedule });
  };

  const handleSaveEditedPatient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPatient) return;
      const originalRecord = patients.find(p => p.id === editingPatient.id);
      if (!originalRecord) return;
      const originalPhone = originalRecord.phone;
      const matchingIds = patients.filter(p => p.phone === originalPhone).map(p => p.id);
      matchingIds.forEach(id => {
          onEditPatient(id, { name: editingPatient.name, age: editingPatient.age, gender: editingPatient.gender, phone: editingPatient.phone });
      });
      if (editingPatient.symptoms !== originalRecord.symptoms) {
          onEditPatient(editingPatient.id, { symptoms: editingPatient.symptoms });
      }
      setEditingPatient(null);
      addToast(`Updated profile and linked ${matchingIds.length} records`, "success");
  };

  const handleSaveVitals = (e: React.FormEvent) => {
      e.preventDefault();
      if (!vitalsPatient) return;
      onEditPatient(vitalsPatient.id, { vitals: vitalsPatient.vitals });
      setVitalsPatient(null);
      addToast('Vitals updated', 'success');
  };

  const getPatientHistory = (patient: Patient) => {
      return patients
          .filter(p => p.phone === patient.phone)
          .sort((a, b) => b.timeAdded - a.timeAdded);
  };

  const clearFilters = () => {
      setSearchQuery('');
      setFilterDoctorId('ALL');
      setFilterStatus('ACTIVE');
      setFilterType('ALL');
  };

  const isFiltered = searchQuery !== '' || filterDoctorId !== 'ALL' || filterStatus !== 'ACTIVE' || filterType !== 'ALL';

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50">
        {/* HEADER & TABS */}
        <div className="flex flex-col flex-shrink-0 bg-white shadow-sm z-30">
            <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{clinicName}</h1>
                    <div className="hidden sm:flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg Wait: 15m</span>
                        <span>•</span>
                        <span>{patients.filter(p => p.status === PatientStatus.WAITING).length} Waiting</span>
                    </div>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('QUEUE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'QUEUE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><List className="h-3 w-3" /> Queue</button>
                    <button onClick={() => setActiveTab('DATABASE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DATABASE' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Database className="h-3 w-3" /> Patients</button>
                    <button onClick={() => setActiveTab('DOCTORS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'DOCTORS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><Stethoscope className="h-3 w-3" /> Staff</button>
                    <button onClick={() => setActiveTab('REPORTS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'REPORTS' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}><BarChart3 className="h-3 w-3" /> Reports</button>
                </div>
            </div>

            {/* DOCTOR STATUS DECK (SCROLLABLE) */}
            {activeTab === 'QUEUE' && (
                <div className="bg-slate-50/50 border-b border-slate-200 py-2 px-2 sm:px-4">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar snap-x">
                        {/* "All" Card */}
                        <button 
                            onClick={() => setFilterDoctorId('ALL')} 
                            className={`snap-start flex-shrink-0 min-w-[140px] sm:w-64 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all text-left group ${filterDoctorId === 'ALL' ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-100' : 'bg-white border-slate-200 opacity-80 hover:opacity-100'}`}
                        >
                            <div className="flex justify-between items-start mb-1 sm:mb-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">All Doctors</span>
                                <span className="text-[10px] sm:text-xs bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-600">{patients.filter(p => p.status === PatientStatus.WAITING).length}</span>
                            </div>
                            <div className="hidden sm:flex -space-x-2 mb-2">
                                {doctors.slice(0,4).map(d => <img key={d.id} src={d.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">Total Active Queue</div>
                        </button>

                        {/* Individual Doctor Cards */}
                        {doctorQueueStats.map(({ doc, current, next, count }) => {
                            const isSelected = filterDoctorId === doc.id;
                            return (
                                <button 
                                    key={doc.id}
                                    onClick={() => setFilterDoctorId(isSelected ? 'ALL' : doc.id)}
                                    className={`snap-start flex-shrink-0 w-[160px] sm:w-72 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all text-left relative group ${isSelected ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                        <div className="relative">
                                            <img src={doc.avatarUrl} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 object-cover" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">{doc.name}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{doc.specialty}</div>
                                        </div>
                                        <div className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-bold ${count > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {count}W
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 sm:gap-2 text-center">
                                        <div className={`rounded p-1 border bg-slate-50 border-slate-100`}>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Serving</div>
                                            <div className={`text-sm sm:text-lg font-black leading-none ${current ? 'text-blue-600' : 'text-slate-300'}`}>{current ? `#${current.tokenNumber}` : '--'}</div>
                                        </div>
                                        <div className={`rounded p-1 border bg-slate-50 border-slate-100`}>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Next</div>
                                            <div className={`text-sm sm:text-lg font-bold leading-none ${next ? 'text-slate-700' : 'text-slate-300'}`}>{next ? `#${next.tokenNumber}` : '--'}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
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

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative bg-slate-100">
            {activeTab === 'QUEUE' && (
                <QueueTable 
                    patients={filteredPatients}
                    doctors={doctors}
                    estimatedTimes={estimatedTimes}
                    isFiltered={isFiltered}
                    nextUpPatientIds={nextUpPatientIds}
                    onUpdateStatus={onUpdateStatus}
                    onManualReorder={onManualReorder}
                    onDragDrop={onDragDrop}
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
                const history = getPatientHistory(historyPatient);
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
