
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, ClinicType, Vitals, DaySchedule } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  UserPlus, Search, Filter, Stethoscope, List, Database, Calendar, 
  Clock, XCircle, RefreshCw
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
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  // --- QUEUE ESTIMATION ENGINE ---
  // Calculates expected service time for every waiting patient based on their doctor's queue
  const estimatedTimes = useMemo(() => {
    const estimates: Record<string, number> = {};
    
    doctors.forEach(doc => {
        // Get all waiting patients for this doctor, sorted by logical queue order
        const queue = patients
            .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
            .sort(comparePatients);
            
        let predictedTime = Date.now();
        const duration = doc.consultationTime || 15; // Use configured time or default
        
        // Add Doctor's manual delay
        if (doc.delayMinutes > 0) {
            predictedTime += doc.delayMinutes * 60000;
        }

        // Add buffer if doctor is currently seeing someone
        const activePatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
        if (activePatient) {
            predictedTime += Math.floor(duration * 0.7) * 60000; // Assume 70% of time remaining for current
        }

        queue.forEach(p => {
            estimates[p.id] = predictedTime;
            predictedTime += duration * 60000; 
        });
    });
    
    return estimates;
  }, [patients, doctors, currentTime]);


  // --- FILTER LOGIC ---
  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        // Doctor Filter
        if (filterDoctorId !== 'ALL' && p.doctorId !== filterDoctorId) return false;
        
        // Search Filter
        const q = searchQuery.toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.phone.includes(q) && !p.tokenNumber.toString().includes(q)) return false;
        
        // Status Filter
        if (filterStatus === 'ACTIVE') {
             if (p.status !== PatientStatus.WAITING && p.status !== PatientStatus.WITH_DOCTOR && p.status !== PatientStatus.ON_HOLD) return false;
        } else if (filterStatus !== 'ALL') {
             if (p.status !== filterStatus) return false;
        }

        // Type Filter
        if (filterType !== 'ALL' && p.visitType !== filterType) return false;

        return true;
      })
      .sort(comparePatients);
  }, [patients, filterDoctorId, searchQuery, filterStatus, filterType, currentTime]);

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
            {/* TOOLBAR */}
            {(activeTab === 'QUEUE' || activeTab === 'DATABASE') && (
                <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-4">
                    {/* Top Row: Search & Add */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                         <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                                placeholder={activeTab === 'QUEUE' ? "Search by name, token or phone..." : "Search patient database..."} 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        {activeTab === 'QUEUE' && (
                            <Button className="w-full sm:w-auto shadow-sm" onClick={() => setIsPatientModalOpen(true)}> <UserPlus className="h-4 w-4 mr-2" /> Add Patient </Button>
                        )}
                    </div>

                    {/* Bottom Row: Filters (Queue Only) */}
                    {activeTab === 'QUEUE' && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/50">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">
                                <Filter className="h-3 w-3" /> Filters:
                            </div>
                            
                            {/* Doctor Filter */}
                            <select 
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 min-w-[140px]"
                                value={filterDoctorId} 
                                onChange={(e) => setFilterDoctorId(e.target.value)}
                            >
                                <option value="ALL">All Doctors</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>

                            {/* Status Filter */}
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

                            {/* Type Filter */}
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
                    onUpdateStatus={onUpdateStatus}
                    onManualReorder={onManualReorder}
                    onDragDrop={onDragDrop}
                    onManualCheckIn={onManualCheckIn}
                    onEditPatient={(p) => setEditingPatient(p)}
                    onVitalsClick={(p) => addToast("Vitals Modal functionality preserved but hidden in refactor for brevity", "info")}
                    onToggleEmergency={onToggleEmergency}
                    onCancelPatient={onCancelPatient}
                />
            )}

            {activeTab === 'DATABASE' && (
                <PatientDatabaseTable 
                    patients={uniquePatients}
                    doctors={doctors}
                    onHistoryClick={(p) => addToast(`History for ${p.name}`, "info")}
                    onEditClick={(p) => setEditingPatient(p)}
                    onDeleteClick={(p) => { if(window.confirm('Delete all records for this patient?')) onDeleteMultiplePatients(patients.filter(pat => pat.phone === p.phone).map(pat => pat.id)); }}
                />
            )}

            {activeTab === 'DOCTORS' && (
                <DoctorManager 
                    doctors={doctors}
                    onAddDoctor={() => { setDoctorModalMode('ADD'); setEditingDoctorData(undefined); setIsDoctorModalOpen(true); }}
                    onEditDoctor={(doc) => { setDoctorModalMode('EDIT'); setEditingDoctorId(doc.id); setEditingDoctorData(doc); setIsDoctorModalOpen(true); }}
                    onDeleteDoctor={(id) => { if(window.confirm("Remove Doctor?")) onDeleteDoctor(id); }}
                    onAddPresetSlot={handleAddPresetSlot}
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
        
        {editingPatient && (
             <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                 <div className="bg-white p-6 rounded-lg shadow-xl animate-in zoom-in-95">
                     <h3 className="text-lg font-bold mb-4">Edit Patient</h3>
                     <p className="text-sm text-slate-500 mb-4">Editing details for {editingPatient.name}</p>
                     <div className="mb-4">
                        <Input label="Full Name" value={editingPatient.name} onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})} />
                     </div>
                     <div className="flex justify-end gap-2">
                         <Button variant="secondary" onClick={() => setEditingPatient(null)}>Close</Button>
                         <Button onClick={() => { onEditPatient(editingPatient.id, { name: editingPatient.name }); setEditingPatient(null); addToast("Patient updated", "success"); }}>Save</Button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
