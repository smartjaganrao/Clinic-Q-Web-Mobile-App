
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, ClinicType, Vitals, DaySchedule, DoctorStatus } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { 
  UserPlus, Search, Filter, Stethoscope, List, Database, Calendar, 
  Clock, XCircle, RefreshCw, History, User, Phone, Activity, PlayCircle, PauseCircle, ChevronRight
} from 'lucide-react';
// Modular Features
import { QueueTable } from '../features/reception/components/QueueTable';
import { PatientDatabaseTable } from '../features/reception/components/PatientDatabaseTable';
import { DoctorManager } from '../features/reception/components/DoctorManager';
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
    // For Appointments, effective queue time is their Scheduled Time.
    // For Walk-ins, effective queue time is their Arrival Time (timeAdded).
    if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
        return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
    }
    return p.timeAdded;
};

const comparePatients = (a: Patient, b: Patient) => {
    // 1. Status Priority: WITH_DOCTOR > WAITING > ON_HOLD > COMPLETED/CANCELLED
    const statusScore = (s: PatientStatus) => {
        if (s === PatientStatus.WITH_DOCTOR) return 0;
        if (s === PatientStatus.WAITING) return 1;
        if (s === PatientStatus.ON_HOLD) return 2;
        return 3;
    };
    
    if (statusScore(a.status) !== statusScore(b.status)) {
        return statusScore(a.status) - statusScore(b.status);
    }
    
    // 2. Emergency Priority (Only applies to active queue: WAITING or WITH_DOCTOR)
    // Emergency patients bump to the top of their status group.
    if (a.status === PatientStatus.WAITING || a.status === PatientStatus.WITH_DOCTOR) {
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    }
    
    // 3. Time-based Sorting (The Hybrid Queue)
    // Compares "Scheduled Time" vs "Arrival Time"
    // e.g., A Walk-in at 9:00 AM comes before an Appointment at 9:15 AM.
    // e.g., An Appointment at 9:00 AM (even if late) comes before a Walk-in at 9:05 AM.
    return getSortTime(a) - getSortTime(b);
};

// Helper to get local date string YYYY-MM-DD
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
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'SCHEDULE'>('QUEUE');
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // ACTIVE (Wait+WithDoc), ALL, COMPLETED...
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, WALK_IN, APPOINTMENT
  
  // Modal States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editingDoctorData, setEditingDoctorData] = useState<Doctor | undefined>(undefined);
  
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  // --- DOCTOR QUEUE STATS (The Deck Data) ---
  const doctorQueueStats = useMemo(() => {
      const todayStr = getLocalTodayStr();
      return doctors.map(doc => {
          // Get all active patients for this doctor today
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

  // Identify "Next" patient for highlighting in the table
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

  // Handlers
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
      
      // Bulk update demographics for all records of this patient
      const originalPhone = originalRecord.phone;
      const matchingIds = patients.filter(p => p.phone === originalPhone).map(p => p.id);
      
      matchingIds.forEach(id => {
          onEditPatient(id, {
              name: editingPatient.name,
              age: editingPatient.age,
              gender: editingPatient.gender,
              phone: editingPatient.phone // Propagate phone change if any
          });
      });

      // Update visit-specific details (symptoms) only for the specific record being edited
      if (editingPatient.symptoms !== originalRecord.symptoms) {
          onEditPatient(editingPatient.id, { symptoms: editingPatient.symptoms });
      }

      setEditingPatient(null);
      addToast(`Updated profile and linked ${matchingIds.length} records`, "success");
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
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0 gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{clinicName}</h1>
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg Wait: 15m</span>
                    <span>•</span>
                    <span>{patients.filter(p => p.status === PatientStatus.WAITING).length} Waiting</span>
                    <span>•</span>
                    <span>{doctors.filter(d => d.isAvailable).length} Active Doctors</span>
                </div>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                <Button variant={activeTab === 'QUEUE' ? 'primary' : 'secondary'} onClick={() => setActiveTab('QUEUE')} className="flex-shrink-0"> <List className="h-4 w-4 mr-2" /> Live Queue </Button>
                <Button variant={activeTab === 'DATABASE' ? 'primary' : 'secondary'} onClick={() => setActiveTab('DATABASE')} className="flex-shrink-0"> <Database className="h-4 w-4 mr-2" /> Patients </Button>
                <Button variant={activeTab === 'DOCTORS' ? 'primary' : 'secondary'} onClick={() => setActiveTab('DOCTORS')} className="flex-shrink-0"> <Stethoscope className="h-4 w-4 mr-2" /> Doctors </Button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* DOCTOR OPERATIONS DECK (QUEUE ONLY) */}
            {activeTab === 'QUEUE' && (
                <div className="bg-slate-50 border-b border-slate-200 pt-4 pb-0 px-4">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {/* "All" Card */}
                        <button 
                            onClick={() => setFilterDoctorId('ALL')} 
                            className={`flex-shrink-0 w-64 p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${filterDoctorId === 'ALL' ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-100' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-900 text-sm">All Doctors</span>
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">{patients.filter(p => p.status === PatientStatus.WAITING).length} Waiting</span>
                            </div>
                            <div className="flex -space-x-2 mb-2">
                                {doctors.slice(0,4).map(d => <img key={d.id} src={d.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                                {doctors.length > 4 && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">+{doctors.length - 4}</div>}
                            </div>
                            <div className="text-[10px] text-slate-400">View master list</div>
                        </button>

                        {/* Individual Doctor Cards */}
                        {doctorQueueStats.map(({ doc, current, next, count }) => {
                            const isSelected = filterDoctorId === doc.id;
                            const isActive = doc.status === DoctorStatus.AVAILABLE;
                            
                            return (
                                <button 
                                    key={doc.id}
                                    onClick={() => setFilterDoctorId(isSelected ? 'ALL' : doc.id)}
                                    className={`flex-shrink-0 w-72 p-3 rounded-xl border-2 transition-all text-left relative group ${isSelected ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-100' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative">
                                            <img src={doc.avatarUrl} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 text-sm truncate">{doc.name}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{doc.specialty}</div>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded font-bold ${count > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {count} Wait
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className={`rounded-lg p-1.5 border ${current ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Serving</div>
                                            <div className={`text-lg font-black leading-none ${current ? 'text-blue-600' : 'text-slate-300'}`}>{current ? `#${current.tokenNumber}` : '--'}</div>
                                        </div>
                                        <div className={`rounded-lg p-1.5 border ${next ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Next</div>
                                            <div className={`text-lg font-bold leading-none ${next ? 'text-slate-700' : 'text-slate-300'}`}>{next ? `#${next.tokenNumber}` : '--'}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Hover (Optional: Could add "Call Next" here) */}
                                    {isSelected && isActive && next && !current && (
                                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="font-bold text-primary-600 text-sm flex items-center gap-1">Click Call Next in Table <ChevronRight className="h-4 w-4" /></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TOOLBAR */}
            {(activeTab === 'QUEUE' || activeTab === 'DATABASE') && (
                <div className="p-4 border-b border-slate-200 bg-white space-y-4">
                    {/* Top Row: Search & Add */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                         <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                                placeholder={activeTab === 'QUEUE' ? "Search by name, token or phone..." : "Search patient database..."} 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {activeTab === 'QUEUE' && filterDoctorId !== 'ALL' && (
                                <Button variant="secondary" onClick={() => setFilterDoctorId('ALL')} className="flex-1 sm:flex-none">Show All</Button>
                            )}
                            <Button className="flex-1 sm:flex-none shadow-sm" onClick={() => setIsPatientModalOpen(true)}> <UserPlus className="h-4 w-4 mr-2" /> Add Patient </Button>
                        </div>
                    </div>

                    {/* Bottom Row: Filters (Queue Only) */}
                    {activeTab === 'QUEUE' && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">
                                <Filter className="h-3 w-3" /> Filters:
                            </div>
                            
                            {/* Doctor Filter (Dropdown syncs with Deck) */}
                            <select 
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 min-w-[140px]"
                                value={filterDoctorId} 
                                onChange={(e) => setFilterDoctorId(e.target.value)}
                            >
                                <option value="ALL">All Doctors</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>

                            <select 
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ACTIVE">Active (Wait + Consult)</option>
                                <option value="ALL">All Statuses</option>
                                <option value={PatientStatus.WAITING}>Waiting Only</option>
                                <option value={PatientStatus.WITH_DOCTOR}>Consulting</option>
                                <option value={PatientStatus.COMPLETED}>Completed</option>
                                <option value={PatientStatus.CANCELLED}>Cancelled</option>
                                <option value={PatientStatus.ON_HOLD}>On Hold</option>
                            </select>

                            <select 
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="ALL">All Types</option>
                                <option value="WALK_IN">Walk-in</option>
                                <option value="APPOINTMENT">Appointments</option>
                            </select>

                            {isFiltered && (
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 ml-auto sm:ml-2"
                                >
                                    <XCircle className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT */}
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
                    onVitalsClick={(p) => addToast("Vitals View", "info")}
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
                    onDeleteClick={(p) => { if(window.confirm(`WARNING: This will permanently delete all history for ${p.name}. Continue?`)) onDeleteMultiplePatients(patients.filter(pat => pat.phone === p.phone).map(pat => pat.id)); }}
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
        </div>

        {/* MODALS */}
        <AddPatientModal 
            isOpen={isPatientModalOpen}
            onClose={() => setIsPatientModalOpen(false)}
            onAdd={onAddPatient}
            doctors={doctors}
            patients={patients}
            addToast={addToast}
        />

        <DoctorFormModal 
            isOpen={isDoctorModalOpen}
            onClose={() => setIsDoctorModalOpen(false)}
            mode={doctorModalMode}
            initialData={editingDoctorData}
            onSave={handleSaveDoctor}
            onCheckMasterDoctor={onCheckMasterDoctor}
            addToast={addToast}
        />
        
        {/* EDIT PATIENT MODAL */}
        <Modal isOpen={!!editingPatient} onClose={() => setEditingPatient(null)} title="Edit Patient Profile" maxWidth="max-w-md">
             {editingPatient && (
                 <form onSubmit={handleSaveEditedPatient} className="space-y-4">
                     <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2 border border-blue-100 flex gap-2">
                         <Activity className="h-5 w-5 flex-shrink-0" />
                         <p>Changes to Name, Age, Gender, and Phone will apply to <strong>all past visits</strong> for this patient.</p>
                     </div>
                     <Input label="Full Name" value={editingPatient.name} onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})} required />
                     <div className="grid grid-cols-2 gap-4">
                         <Input label="Age" value={editingPatient.age || ''} onChange={(e) => setEditingPatient({...editingPatient, age: e.target.value})} />
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                             <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editingPatient.gender} onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select>
                         </div>
                     </div>
                     <Input label="Phone Number" value={editingPatient.phone} onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})} required />
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms (Current Visit)</label>
                         <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-20 resize-none" value={editingPatient.symptoms || ''} onChange={(e) => setEditingPatient({...editingPatient, symptoms: e.target.value})} placeholder="e.g. Fever, Cough" />
                     </div>
                     <div className="pt-2 flex justify-end gap-3">
                         <Button variant="secondary" type="button" onClick={() => setEditingPatient(null)}>Cancel</Button>
                         <Button type="submit">Save Changes</Button>
                     </div>
                 </form>
             )}
        </Modal>

        {/* HISTORY MODAL */}
        <Modal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} title="Patient History" maxWidth="max-w-2xl">
            {historyPatient && (() => {
                const history = getPatientHistory(historyPatient);
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{historyPatient.name.charAt(0)}</div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg">{historyPatient.name}</h4>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {historyPatient.age} Yrs • {historyPatient.gender}</span>
                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {historyPatient.phone}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            {history.map(visit => {
                                const doc = doctors.find(d => d.id === visit.doctorId);
                                return (
                                    <div key={visit.id} className="relative pl-10">
                                        <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-slate-400 ring-4 ring-white"></div>
                                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-primary-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">{new Date(visit.timeAdded).toLocaleDateString()}</span>
                                                    <h5 className="font-bold text-slate-900">Dr. {doc?.name || 'Unknown'}</h5>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${visit.status === PatientStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{visit.status}</span>
                                            </div>
                                            {visit.symptoms && <p className="text-sm text-slate-600 mb-2"><strong>Reason:</strong> {visit.symptoms}</p>}
                                            {visit.diagnosis && <p className="text-sm text-slate-600 mb-2"><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                                            {visit.notes && <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 italic border border-slate-100">{visit.notes}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {history.length === 0 && <p className="text-center text-slate-400 py-8">No history found.</p>}
                    </div>
                );
            })()}
        </Modal>
    </div>
  );
};
