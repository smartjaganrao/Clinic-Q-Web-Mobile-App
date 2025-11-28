import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, ClinicType, Vitals, DaySchedule } from '../../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { 
  Plus, Search, Filter, Edit2, Trash2, 
  UserPlus, User, Clock, Calendar, CheckCircle, 
  AlertTriangle, XCircle, Stethoscope, ChevronRight, 
  UserCheck, Activity, Save, X, ArrowUp, ArrowDown,
  Database, History, MoreHorizontal, List, PlayCircle, CheckSquare, Grid, CalendarDays, Copy, ChevronLeft, MapPin, GripVertical, Zap
} from 'lucide-react';

interface ReceptionDashboardProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  clinicType?: ClinicType;
  onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => void;
  onEditPatient: (id: string, updates: Partial<Patient>) => void;
  onDeletePatient: (id: string) => void;
  onDeleteMultiplePatients: (ids: string[]) => void;
  onAddDoctor: (name: string, specialty: string, room: string, schedule: DaySchedule[]) => void;
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper for local date string
const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  doctors,
  patients,
  clinicName,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onDeleteMultiplePatients,
  onAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onUpdateStatus,
  onCancelPatient,
  onUpdateClinicName,
  onToggleEmergency,
  onManualReorder,
  onDragDrop,
  onManualCheckIn,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS' | 'SCHEDULE'>('QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
  const [doctorViewMode, setDoctorViewMode] = useState<'GRID' | 'CALENDAR'>('GRID');
  
  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Modal States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [vitalsModalPatient, setVitalsModalPatient] = useState<Patient | null>(null);
  const [historyModalPatient, setHistoryModalPatient] = useState<Patient | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean, patient: Patient | null, count: number }>({ isOpen: false, patient: null, count: 0 });
  
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorModalMode, setDoctorModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  // New Patient Form State
  const [newPName, setNewPName] = useState('');
  const [newPPhone, setNewPPhone] = useState('');
  const [newPDoctor, setNewPDoctor] = useState('');
  const [newPAge, setNewPAge] = useState('');
  const [newPGender, setNewPGender] = useState('Male');
  const [newPType, setNewPType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [newPDate, setNewPDate] = useState(getLocalToday()); // Default local today
  const [newPTime, setNewPTime] = useState('');
  const [newPSymptoms, setNewPSymptoms] = useState('');

  // Doctor Form State
  const [docForm, setDocForm] = useState({
      name: '',
      specialty: '',
      room: '',
      fee: '500',
      schedule: [] as DaySchedule[]
  });
  const [docFormTab, setDocFormTab] = useState<'INFO' | 'SCHEDULE'>('INFO');

  // Lookup State
  const [existingProfiles, setExistingProfiles] = useState<Patient[]>([]);

  // Vitals Form State
  const [vitalsForm, setVitalsForm] = useState<Vitals>({});

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Timer to force re-render for live queue updates every minute
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 60000); // Update minutely for sorting logic
      return () => clearInterval(interval);
  }, []);

  // Filter Logic for Queue
  const filteredPatients = useMemo(() => {
    
    // Sort logic synchronization with Doctor Dashboard
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const timeToMins = (t?: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const UPCOMING_THRESHOLD_MINS = 10;

    const classifyPatient = (p: Patient) => {
        if (p.isEmergency) return 1; 
        
        if (p.visitType === 'APPOINTMENT' && p.appointmentTime) {
            const apptMins = timeToMins(p.appointmentTime);
            const minsUntilAppt = apptMins - currentMins;
            // Late or Due Soon (within 10 mins) -> Priority 2
            if (minsUntilAppt <= UPCOMING_THRESHOLD_MINS) {
                return 2; 
            }
            // Future Appointment (> 10 mins away) -> Priority 4 (After Walk-ins)
            return 4;
        }
        // Walk-ins
        return 3;
    };

    return patients
      .filter(p => {
        const matchDoc = filterDoctorId === 'ALL' || p.doctorId === filterDoctorId;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.phone.includes(searchQuery) || 
                            p.tokenNumber.toString().includes(searchQuery);
        // Show only active patients in Queue tab (Waiting or With Doctor)
        const isActiveStatus = p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR;
        return matchDoc && matchSearch && isActiveStatus;
      })
      .sort((a, b) => {
          // Status Priority: With Doctor is ALWAYS top visually
          if (a.status === PatientStatus.WITH_DOCTOR && b.status !== PatientStatus.WITH_DOCTOR) return -1;
          if (a.status !== PatientStatus.WITH_DOCTOR && b.status === PatientStatus.WITH_DOCTOR) return 1;

          // Waiting Queue Logic
          const priorityA = classifyPatient(a);
          const priorityB = classifyPatient(b);
          
          if (priorityA !== priorityB) return priorityA - priorityB;
          
          if (a.visitType === 'APPOINTMENT' && b.visitType === 'APPOINTMENT' && a.appointmentTime && b.appointmentTime) {
               return timeToMins(a.appointmentTime) - timeToMins(b.appointmentTime);
          }
          return a.timeAdded - b.timeAdded;
      });
  }, [patients, filterDoctorId, searchQuery, currentTime]);

  // Unique Patients Logic for Database (Name + Phone Grouping)
  const uniquePatients = useMemo(() => {
    const map = new Map<string, Patient>();
    // Sort by latest first
    const sorted = [...patients].sort((a, b) => b.timeAdded - a.timeAdded);
    
    sorted.forEach(p => {
        const name = p.name.trim();
        const phone = p.phone.trim();
        const key = `${phone}_${name.toLowerCase()}`;
        
        // We only store the *latest* visit for this unique person
        if (!map.has(key)) {
            map.set(key, p);
        }
    });
    
    // Filter by search query if in Database tab
    let result = Array.from(map.values());
    if (activeTab === 'DATABASE' && searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    }
    
    return result;
  }, [patients, activeTab, searchQuery]);

  // Handle Phone Input to Lookup Existing Profiles
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setNewPPhone(val);
      
      if (val.length >= 4) {
          // Find all unique profiles with this phone
          const profiles = patients.filter(p => p.phone === val);
          // Deduplicate by name
          const uniqueProfiles = new Map();
          profiles.forEach(p => uniqueProfiles.set(p.name.toLowerCase(), p));
          setExistingProfiles(Array.from(uniqueProfiles.values()));
      } else {
          setExistingProfiles([]);
      }
  };

  const selectExistingProfile = (p: Patient) => {
      setNewPName(p.name);
      setNewPAge(p.age || '');
      setNewPGender(p.gender || 'Male');
      setExistingProfiles([]); // Clear lookup to show form
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPName || !newPPhone || !newPDoctor) {
        addToast('Please fill required fields', 'error');
        return;
    }
    
    // Check duplicates in Active Queue (Name + Phone)
    const isDuplicate = patients.some(p => 
        p.phone === newPPhone && 
        p.name.toLowerCase() === newPName.toLowerCase() &&
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
    );

    if (isDuplicate) {
        addToast(`${newPName} is already in the queue!`, 'error');
        return;
    }

    const date = newPType === 'APPOINTMENT' ? newPDate : getLocalToday();
    onAddPatient(newPName, newPPhone, newPDoctor, date, newPType === 'APPOINTMENT' ? newPTime : undefined, newPAge, newPGender, newPSymptoms);
    setIsPatientModalOpen(false);
    
    // Reset Form completely for next use
    setNewPName(''); 
    setNewPPhone(''); 
    setNewPDoctor(''); 
    setNewPAge(''); 
    setNewPTime(''); 
    setNewPSymptoms(''); 
    setExistingProfiles([]);
    setNewPType('WALK_IN'); // Reset to default
    setNewPDate(getLocalToday()); // Reset date
  };

  // DOCTOR FORM HANDLERS
  const openDoctorModal = (doctor?: Doctor) => {
      if (doctor) {
          setDoctorModalMode('EDIT');
          setEditingDoctorId(doctor.id);
          setDocForm({
              name: doctor.name,
              specialty: doctor.specialty,
              room: doctor.roomNumber,
              fee: doctor.consultationFee.toString(),
              schedule: doctor.weeklySchedule
          });
      } else {
          setDoctorModalMode('ADD');
          setEditingDoctorId(null);
          // Default Schedule
          const defaultSchedule = DAYS_OF_WEEK.map(d => ({
              day: d,
              startTime: '09:00',
              endTime: '17:00',
              isOff: d === 'Sunday'
          }));
          setDocForm({ name: '', specialty: '', room: '', fee: '500', schedule: defaultSchedule });
      }
      setDocFormTab('INFO');
      setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
      e.preventDefault();
      if (doctorModalMode === 'ADD') {
          onAddDoctor(docForm.name, docForm.specialty, docForm.room, docForm.schedule);
          addToast('New doctor added successfully', 'success');
      } else if (editingDoctorId) {
          onEditDoctor(editingDoctorId, {
              name: docForm.name,
              specialty: docForm.specialty,
              roomNumber: docForm.room,
              consultationFee: parseInt(docForm.fee) || 0,
              weeklySchedule: docForm.schedule
          });
          addToast('Doctor details updated', 'success');
      }
      setIsDoctorModalOpen(false);
  };

  const updateScheduleDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
      const newSchedule = [...docForm.schedule];
      newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
      setDocForm({ ...docForm, schedule: newSchedule });
  };

  const copyScheduleToAll = (sourceDayIndex: number) => {
      const source = docForm.schedule[sourceDayIndex];
      const newSchedule = docForm.schedule.map(d => ({
          ...d,
          startTime: source.startTime,
          endTime: source.endTime,
          isOff: source.isOff
      }));
      setDocForm({ ...docForm, schedule: newSchedule });
      addToast('Schedule copied to all days', 'info');
  };

  const handleEditPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    onEditPatient(editingPatient.id, { 
        name: editingPatient.name, 
        phone: editingPatient.phone, 
        age: editingPatient.age 
    });
    setEditingPatient(null);
  };

  const handleDeleteConfirm = () => {
      if (deleteConfirmModal.patient) {
          // Find ALL visits for this Name + Phone combination
          const p = deleteConfirmModal.patient;
          const allVisits = patients.filter(
              visit => visit.phone === p.phone && visit.name.toLowerCase() === p.name.toLowerCase()
          );
          const ids = allVisits.map(v => v.id);
          onDeleteMultiplePatients(ids);
          setDeleteConfirmModal({ isOpen: false, patient: null, count: 0 });
      }
  };

  const openDeleteModal = (patient: Patient) => {
      // Count total records for this profile
      const count = patients.filter(p => p.phone === patient.phone && p.name.toLowerCase() === patient.name.toLowerCase()).length;
      setDeleteConfirmModal({ isOpen: true, patient, count });
  };

  const openVitalsModal = (patient: Patient) => {
    setVitalsModalPatient(patient);
    setVitalsForm(patient.vitals || {});
  };

  const saveVitals = () => {
    if (vitalsModalPatient) {
        onEditPatient(vitalsModalPatient.id, { vitals: vitalsForm });
        setVitalsModalPatient(null);
        addToast('Vitals updated', 'success');
    }
  };

  const openHistoryModal = (patient: Patient) => {
      setHistoryModalPatient(patient);
  };

  // Helper to get visits for history modal
  const getPatientHistory = (patient: Patient | null) => {
      if (!patient) return [];
      return patients
        .filter(p => p.phone === patient.phone && p.name.toLowerCase() === patient.name.toLowerCase())
        .sort((a,b) => b.timeAdded - a.timeAdded);
  };

  // CALENDAR HELPERS
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Map 0(Sun) to 6, 1(Mon) to 0 for Monday start
    const startDayIndex = (firstDay + 6) % 7; 

    const days = [];
    // Padding
    for(let i=0; i<startDayIndex; i++) days.push(null);
    for(let i=1; i<=daysInMonth; i++) {
        const d = new Date(year, month, i);
        days.push(d);
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0 gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{clinicName}</h1>
                    <button onClick={() => { const n = prompt('Edit Clinic Name:', clinicName); if(n) onUpdateClinicName(n); }} className="text-slate-400 hover:text-primary-600"><Edit2 className="h-4 w-4" /></button>
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {patients.filter(p => p.status === PatientStatus.WAITING).length} Waiting</span>
                    <span className="flex items-center gap-1"><Stethoscope className="h-4 w-4" /> {doctors.filter(d => d.status === DoctorStatus.AVAILABLE).length} Active Doctors</span>
                </div>
            </div>
            
            {/* Scrollable Tabs for Mobile */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                <Button variant={activeTab === 'QUEUE' ? 'primary' : 'secondary'} onClick={() => setActiveTab('QUEUE')} className="flex-shrink-0">
                    <List className="h-4 w-4 mr-2" /> Queue
                </Button>
                <Button variant={activeTab === 'SCHEDULE' ? 'primary' : 'secondary'} onClick={() => setActiveTab('SCHEDULE')} className="flex-shrink-0">
                    <Calendar className="h-4 w-4 mr-2" /> Schedule
                </Button>
                <Button variant={activeTab === 'DATABASE' ? 'primary' : 'secondary'} onClick={() => setActiveTab('DATABASE')} className="flex-shrink-0">
                    <Database className="h-4 w-4 mr-2" /> Patients
                </Button>
                <Button variant={activeTab === 'DOCTORS' ? 'primary' : 'secondary'} onClick={() => setActiveTab('DOCTORS')} className="flex-shrink-0">
                    <Stethoscope className="h-4 w-4 mr-2" /> Doctors
                </Button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            
            {/* COMMON SEARCH BAR (Used for Queue and Database) */}
            {(activeTab === 'QUEUE' || activeTab === 'DATABASE') && (
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder={activeTab === 'QUEUE' ? "Search live queue..." : "Search patient records..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {activeTab === 'QUEUE' && (
                            <div className="relative w-full sm:w-48">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select 
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                                    value={filterDoctorId}
                                    onChange={(e) => setFilterDoctorId(e.target.value)}
                                >
                                    <option value="ALL">All Doctors</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <Button className="w-full sm:w-auto" onClick={() => { setNewPType('WALK_IN'); setNewPDate(getLocalToday()); setIsPatientModalOpen(true); }}>
                        <UserPlus className="h-4 w-4 mr-2" /> Add Patient
                    </Button>
                </div>
            )}

            {/* TAB: QUEUE */}
            {activeTab === 'QUEUE' && (
                <div className="flex-1 overflow-auto bg-slate-50/30">
                    {/* Add overflow-x-auto for responsive tables */}
                    <div className="min-w-[800px]"> 
                        <table className="w-full text-sm text-left border-separate border-spacing-y-1 p-2">
                            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-20 shadow-sm text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 w-24 text-center rounded-l-lg bg-slate-50">Token</th>
                                    <th className="px-4 py-3 bg-slate-50">Patient Details</th>
                                    <th className="px-4 py-3 bg-slate-50">Assigned To</th>
                                    <th className="px-4 py-3 bg-slate-50">Status</th>
                                    <th className="px-4 py-3 bg-slate-50">Wait Time</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg bg-slate-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length > 0 ? filteredPatients.map((patient) => {
                                    const doc = doctors.find(d => d.id === patient.doctorId);
                                    const hasVitals = patient.vitals && Object.values(patient.vitals).some(v => v !== '');
                                    const isWaiting = patient.status === PatientStatus.WAITING;
                                    return (
                                        <tr 
                                            key={patient.id} 
                                            draggable={isWaiting}
                                            onDragStart={(e) => {
                                                if (!isWaiting) { e.preventDefault(); return; }
                                                setDraggedId(patient.id);
                                                e.dataTransfer.effectAllowed = "move";
                                            }}
                                            onDragOver={(e) => {
                                                if (draggedId && draggedId !== patient.id && isWaiting) {
                                                    e.preventDefault(); 
                                                    e.dataTransfer.dropEffect = "move";
                                                }
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (draggedId && draggedId !== patient.id) {
                                                    onDragDrop(draggedId, patient.id);
                                                    setDraggedId(null);
                                                }
                                            }}
                                            onDragEnd={() => setDraggedId(null)}
                                            className={`group transition-all duration-200 border border-slate-200 rounded-lg overflow-hidden
                                                ${patient.status === PatientStatus.WITH_DOCTOR 
                                                    ? 'bg-blue-50 hover:bg-blue-100 shadow-md relative z-10 border-l-4 border-l-blue-500' 
                                                    : patient.isEmergency 
                                                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' 
                                                        : 'bg-white hover:bg-slate-50'
                                                }
                                                ${draggedId === patient.id ? 'opacity-40 border-2 border-dashed border-primary-500' : ''}
                                            `}
                                        >
                                            <td className="px-4 py-4 text-center rounded-l-lg">
                                                <div className="flex items-center justify-center gap-3">
                                                    {isWaiting && (
                                                        <GripVertical className="h-4 w-4 text-slate-300 cursor-move hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                    <div className="relative">
                                                        <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl font-black text-lg shadow-sm border-2
                                                            ${patient.isEmergency 
                                                                ? 'bg-red-500 text-white border-red-600' 
                                                                : patient.status === PatientStatus.WITH_DOCTOR
                                                                    ? 'bg-blue-600 text-white border-blue-700 animate-pulse'
                                                                    : 'bg-white text-slate-700 border-slate-100'
                                                            }`}>
                                                            {patient.tokenNumber}
                                                        </div>
                                                        {patient.isEmergency && (
                                                            <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full border border-red-200 shadow-sm" title="Emergency">
                                                                <Zap className="h-3 w-3 fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <div className={`font-bold text-base mb-1 ${patient.status === PatientStatus.WITH_DOCTOR ? 'text-blue-900' : 'text-slate-900'}`}>
                                                        {patient.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border flex items-center gap-1 uppercase tracking-wide
                                                            ${patient.visitType === 'APPOINTMENT' 
                                                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                            {patient.visitType === 'APPOINTMENT' ? <Calendar className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                                            {patient.visitType === 'APPOINTMENT' ? 'Appt' : 'Walk-in'}
                                                        </span>
                                                        {(patient.age || patient.gender) && (
                                                            <span className="text-xs text-slate-500 font-medium">{patient.age}Y • {patient.gender}</span>
                                                        )}
                                                    </div>
                                                    {patient.symptoms && (
                                                        <div className="text-[10px] text-slate-500 italic mt-1 truncate max-w-[200px]" title={patient.symptoms}>
                                                            "{patient.symptoms}"
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-slate-900 font-medium">{doc?.name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500">{doc?.specialty}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {patient.status === PatientStatus.WITH_DOCTOR ? (
                                                    <div className="flex items-center gap-2 text-blue-700 bg-blue-100/50 px-3 py-1.5 rounded-lg border border-blue-200 w-fit shadow-sm">
                                                        <div className="relative flex h-3 w-3">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                        </div>
                                                        <span className="font-bold text-xs uppercase tracking-wide">Consulting</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Badge status={patient.status} />
                                                        {patient.isCheckedIn && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Arrived</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 font-mono text-sm">
                                                {patient.status === PatientStatus.WAITING ? `${Math.floor((Date.now() - patient.timeAdded)/60000)}m` : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right rounded-r-lg">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {patient.status === PatientStatus.WAITING && (
                                                        <>
                                                            {/* Send to Doctor Button - Disabled if not Checked In */}
                                                            {patient.isCheckedIn ? (
                                                                <button 
                                                                    onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} 
                                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 shadow-sm transition-all" 
                                                                    title="Send to Doctor"
                                                                >
                                                                    <PlayCircle className="h-5 w-5" />
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    disabled
                                                                    className="p-2 text-slate-300 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed" 
                                                                    title="Patient must Check-in first"
                                                                >
                                                                    <PlayCircle className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                            
                                                            <button onClick={() => onManualReorder(patient.id, 'UP')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Move Up"><ArrowUp className="h-4 w-4" /></button>
                                                        </>
                                                    )}
                                                    
                                                    {patient.status === PatientStatus.WITH_DOCTOR && (
                                                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 shadow-sm transition-all" title="Mark Completed"><CheckSquare className="h-5 w-5" /></button>
                                                    )}

                                                    <button onClick={() => setEditingPatient(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg" title="Edit Details"><Edit2 className="h-4 w-4" /></button>
                                                    
                                                    {/* Check In Button - Available for ALL patients who are waiting and not checked in (Walk-in or Appt) */}
                                                    {!patient.isCheckedIn && patient.status === PatientStatus.WAITING && (
                                                        <button onClick={() => onManualCheckIn(patient.id)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-xs font-bold transition-colors" title="Mark as Arrived">
                                                            <UserCheck className="h-3.5 w-3.5" /> Check In
                                                        </button>
                                                    )}

                                                    {patient.status === PatientStatus.WAITING && (
                                                        <button 
                                                            onClick={() => openVitalsModal(patient)} 
                                                            className={`p-2 rounded-lg transition-colors ${hasVitals ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`} 
                                                            title="Record Vitals"
                                                        >
                                                            <Activity className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    
                                                    <button onClick={() => onToggleEmergency(patient.id)} className={`p-2 rounded-lg transition-colors ${patient.isEmergency ? 'text-red-600 bg-red-100 shadow-inner' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'}`} title="Toggle Emergency">
                                                        <AlertTriangle className="h-4 w-4" />
                                                    </button>

                                                    {patient.status === PatientStatus.WAITING && (
                                                         <button onClick={() => { if(window.confirm('Cancel visit?')) onCancelPatient(patient.id); }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel Visit"><XCircle className="h-4 w-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No patients found in active queue.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: DATABASE */}
            {activeTab === 'DATABASE' && (
                <div className="flex-1 overflow-auto">
                    <div className="min-w-[800px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Patient Profile</th>
                                    <th className="px-6 py-3">Phone Number</th>
                                    <th className="px-6 py-3">Total Visits</th>
                                    <th className="px-6 py-3">Last Visit</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {uniquePatients.length > 0 ? uniquePatients.map((patient) => {
                                    const totalVisits = patients.filter(p => p.phone === patient.phone && p.name.toLowerCase().trim() === patient.name.toLowerCase().trim()).length;
                                    return (
                                        <tr key={`${patient.phone}_${patient.name}`} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{patient.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    {patient.age ? `${patient.age} Years` : 'Age N/A'} • {patient.gender || 'Gender N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-600">
                                                {patient.phone}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {totalVisits} Visits
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(patient.timeAdded).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openHistoryModal(patient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View History"><History className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingPatient(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg" title="Edit Profile"><Edit2 className="h-4 w-4" /></button>
                                                    <button onClick={() => openDeleteModal(patient)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete All Records"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            No patient records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: SCHEDULE (NEW MONTHLY CALENDAR) */}
            {activeTab === 'SCHEDULE' && (
                <div className="h-full flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex bg-white rounded-lg border border-slate-300 shadow-sm">
                                <button 
                                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-slate-100 border-r border-slate-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button 
                                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-slate-100"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <Button onClick={() => { setNewPType('APPOINTMENT'); setNewPDate(getLocalToday()); setIsPatientModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" /> Book Appointment
                        </Button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Calendar Grid */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="grid grid-cols-7 gap-4 min-w-[600px]">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="text-center text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        {day}
                                    </div>
                                ))}
                                {getCalendarDays(calendarDate).map((date, i) => {
                                    if (!date) return <div key={`empty-${i}`} className="h-32 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"></div>;
                                    
                                    // Use local date construction to avoid UTC offsets
                                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                    const todayStr = getLocalToday();
                                    const isToday = dateStr === todayStr;
                                    const isPast = dateStr < todayStr;
                                    const isSelected = selectedCalendarDay === dateStr;

                                    // Count booked appointments
                                    const bookedCount = patients.filter(p => 
                                        p.visitType === 'APPOINTMENT' && 
                                        p.appointmentDate === dateStr &&
                                        p.status !== PatientStatus.CANCELLED
                                    ).length;

                                    return (
                                        <div 
                                            key={dateStr}
                                            onClick={() => setSelectedCalendarDay(dateStr)}
                                            className={`h-32 rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
                                                isSelected ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50' : 
                                                isToday ? 'bg-white border-blue-300 shadow-sm' : 
                                                isPast ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                                                    {date.getDate()}
                                                </span>
                                                {bookedCount > 0 && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bookedCount > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {bookedCount} Booked
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {bookedCount > 0 ? (
                                                <div className="space-y-1 mt-1 overflow-hidden">
                                                    {patients
                                                        .filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === dateStr && p.status !== PatientStatus.CANCELLED)
                                                        .slice(0, 3)
                                                        .map(p => (
                                                            <div key={p.id} className="text-[10px] bg-white/50 px-1 rounded truncate flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${p.status === PatientStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                                {p.appointmentTime} - {p.name}
                                                            </div>
                                                        ))
                                                    }
                                                    {bookedCount > 3 && <div className="text-[10px] text-slate-400 pl-3">+{bookedCount - 3} more</div>}
                                                </div>
                                            ) : (
                                                !isPast && <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-xs text-primary-600 font-medium">+ Add</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Side Panel for Selected Day */}
                        {selectedCalendarDay && (
                            <div className="w-80 border-l border-slate-200 bg-white flex flex-col animate-in slide-in-from-right duration-300 shadow-xl z-20 absolute right-0 inset-y-0">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Appointments</h3>
                                        <p className="text-xs text-slate-500">{new Date(selectedCalendarDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <button onClick={() => setSelectedCalendarDay(null)}><X className="h-4 w-4 text-slate-400" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {patients
                                        .filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedCalendarDay)
                                        .sort((a,b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''))
                                        .map(p => (
                                            <div key={p.id} className={`p-3 rounded-lg border ${p.status === PatientStatus.CANCELLED ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-bold text-sm text-slate-900">{p.appointmentTime}</div>
                                                    <Badge status={p.status} />
                                                </div>
                                                <div className="font-medium text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <Stethoscope className="h-3 w-3" /> Dr. {doctors.find(d => d.id === p.doctorId)?.name}
                                                </div>
                                                {p.symptoms && <div className="text-[10px] text-slate-400 mt-1 italic truncate">{p.symptoms}</div>}
                                            </div>
                                        ))
                                    }
                                    {patients.filter(p => p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedCalendarDay).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            No appointments for this date.
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100">
                                    <Button className="w-full" onClick={() => { setNewPDate(selectedCalendarDay); setNewPType('APPOINTMENT'); setIsPatientModalOpen(true); }}>
                                        <Plus className="h-4 w-4 mr-2" /> Book for this Day
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: DOCTORS */}
            {activeTab === 'DOCTORS' && (
                <div className="p-6 overflow-hidden flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                         <div className="flex items-center gap-4">
                             <h3 className="font-bold text-lg text-slate-800">Medical Staff</h3>
                             <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                                 <button onClick={() => setDoctorViewMode('GRID')} className={`px-3 py-1.5 rounded-md flex items-center gap-1 ${doctorViewMode === 'GRID' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                     <Grid className="h-3 w-3" /> List
                                 </button>
                                 <button onClick={() => setDoctorViewMode('CALENDAR')} className={`px-3 py-1.5 rounded-md flex items-center gap-1 ${doctorViewMode === 'CALENDAR' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                     <CalendarDays className="h-3 w-3" /> Weekly Schedule
                                 </button>
                             </div>
                         </div>
                         <Button onClick={() => openDoctorModal()}><Plus className="h-4 w-4 mr-2" /> Add Doctor</Button>
                    </div>
                    
                    {doctorViewMode === 'GRID' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
                            {doctors.map(doc => (
                                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
                                    <img src={doc.avatarUrl} className="h-16 w-16 rounded-full object-cover bg-slate-100" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                        <p className="text-sm text-slate-500 mb-2">{doc.specialty}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2.5 w-2.5 rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                                            <span className="text-xs font-medium text-slate-600">{doc.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => openDoctorModal(doc)} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-primary-600"><Edit2 className="h-4 w-4" /></button>
                                        <button onClick={() => onDeleteDoctor(doc.id)} className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-auto">
                            <div className="min-w-[800px]">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 min-w-[150px]">Doctor</th>
                                            {DAYS_OF_WEEK.map(day => (
                                                <th key={day} className="px-4 py-3">{day.substring(0,3)}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {doctors.map(doc => (
                                            <tr key={doc.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-slate-800">
                                                    {doc.name}
                                                    <div className="text-[10px] text-slate-400 font-normal">{doc.specialty}</div>
                                                </td>
                                                {DAYS_OF_WEEK.map(day => {
                                                    const schedule = doc.weeklySchedule.find(s => s.day === day);
                                                    const isOff = !schedule || schedule.isOff;
                                                    return (
                                                        <td key={day} className="px-4 py-3">
                                                            {isOff ? (
                                                                <span className="text-slate-300 font-medium">OFF</span>
                                                            ) : (
                                                                <div className="bg-green-50 text-green-700 px-2 py-1 rounded inline-block text-[10px] font-bold border border-green-100">
                                                                    {schedule?.startTime} - {schedule?.endTime}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* --- MODALS --- */}
        
        {/* ADD PATIENT MODAL */}
        {isPatientModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">{newPType === 'APPOINTMENT' ? 'Schedule Appointment' : 'Check-in Walk-in'}</h3>
                        <button onClick={() => setIsPatientModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
                    </div>
                    
                    <form onSubmit={handleAddPatientSubmit} className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Step 1: Mobile Lookup</label>
                            <Input 
                                placeholder="Enter 10-digit mobile" 
                                value={newPPhone} 
                                onChange={handlePhoneChange} 
                                autoFocus
                                required 
                            />
                            {existingProfiles.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-slate-500 font-medium">Found existing profiles:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {existingProfiles.map(p => (
                                            <button 
                                                key={p.id}
                                                type="button"
                                                onClick={() => selectExistingProfile(p)}
                                                className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-full text-xs hover:border-primary-500 hover:text-primary-700 transition-colors shadow-sm"
                                            >
                                                <User className="h-3 w-3" />
                                                <span className="font-bold">{p.name}</span>
                                            </button>
                                        ))}
                                        <button 
                                            type="button"
                                            onClick={() => setExistingProfiles([])}
                                            className="px-3 py-1.5 rounded-full text-xs border border-dashed border-slate-300 text-slate-500 hover:bg-white"
                                        >
                                            + New Family Member
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Name" value={newPName} onChange={e => setNewPName(e.target.value)} required />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Age" value={newPAge} onChange={e => setNewPAge(e.target.value)} />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={newPGender} onChange={e => setNewPGender(e.target.value)}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <Input label="Symptoms / Reason" placeholder="e.g. Fever, Cough" value={newPSymptoms} onChange={e => setNewPSymptoms(e.target.value)} />

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                             <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={newPDoctor} onChange={e => setNewPDoctor(e.target.value)} required>
                                 <option value="">Select Doctor...</option>
                                 {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                             </select>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                 <input type="checkbox" checked={newPType === 'APPOINTMENT'} onChange={e => setNewPType(e.target.checked ? 'APPOINTMENT' : 'WALK_IN')} />
                                 Schedule Appointment?
                             </label>
                             {newPType === 'APPOINTMENT' && (
                                 <div className="grid grid-cols-2 gap-4">
                                     <Input type="date" label="Date" value={newPDate} onChange={e => setNewPDate(e.target.value)} required />
                                     <Input type="time" label="Time" value={newPTime} onChange={e => setNewPTime(e.target.value)} required />
                                 </div>
                             )}
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</Button>
                            <Button type="submit">
                                {newPType === 'APPOINTMENT' ? 'Confirm Appointment' : 'Check-in Now'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ADD/EDIT DOCTOR MODAL */}
        {isDoctorModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">{doctorModalMode === 'ADD' ? 'Add Medical Staff' : 'Edit Doctor Details'}</h3>
                        <button onClick={() => setIsDoctorModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
                    </div>
                    
                    <div className="flex border-b border-slate-200 mb-6">
                        <button 
                            className={`flex-1 pb-3 text-sm font-bold ${docFormTab === 'INFO' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}
                            onClick={() => setDocFormTab('INFO')}
                        >
                            Basic Info
                        </button>
                        <button 
                            className={`flex-1 pb-3 text-sm font-bold ${docFormTab === 'SCHEDULE' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}
                            onClick={() => setDocFormTab('SCHEDULE')}
                        >
                            Weekly Schedule
                        </button>
                    </div>

                    <form onSubmit={handleSaveDoctor} className="space-y-6">
                        {docFormTab === 'INFO' && (
                            <div className="space-y-4">
                                <Input label="Doctor Name" placeholder="e.g. Dr. Smith" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} required />
                                <Input label="Specialty" placeholder="e.g. Cardiologist" value={docForm.specialty} onChange={e => setDocForm({...docForm, specialty: e.target.value})} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Room No." placeholder="101" value={docForm.room} onChange={e => setDocForm({...docForm, room: e.target.value})} required />
                                    <Input label="Consultation Fee" type="number" placeholder="500" value={docForm.fee} onChange={e => setDocForm({...docForm, fee: e.target.value})} />
                                </div>
                            </div>
                        )}

                        {docFormTab === 'SCHEDULE' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-slate-500">Configure availability for 7 days.</p>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => copyScheduleToAll(0)} className="text-xs">
                                        <Copy className="h-3 w-3 mr-1" /> Copy Mon to All
                                    </Button>
                                </div>
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 mb-1 px-2">
                                    <div className="col-span-3">Day</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-3 text-center">Start</div>
                                    <div className="col-span-3 text-center">End</div>
                                </div>
                                {docForm.schedule.map((daySchedule, idx) => (
                                    <div key={daySchedule.day} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="col-span-3 font-medium text-sm text-slate-700">{daySchedule.day}</div>
                                        <div className="col-span-2 flex justify-center">
                                            <button 
                                                type="button"
                                                onClick={() => updateScheduleDay(idx, 'isOff', !daySchedule.isOff)}
                                                className={`px-2 py-1 rounded text-xs font-bold w-16 transition-colors ${daySchedule.isOff ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}
                                            >
                                                {daySchedule.isOff ? 'OFF' : 'ON'}
                                            </button>
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="time" 
                                                className="w-full text-center bg-white border border-slate-300 rounded px-1 py-1 text-sm disabled:opacity-50"
                                                value={daySchedule.startTime}
                                                disabled={daySchedule.isOff}
                                                onChange={(e) => updateScheduleDay(idx, 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 text-center text-slate-400">-</div>
                                        <div className="col-span-3">
                                            <input 
                                                type="time" 
                                                className="w-full text-center bg-white border border-slate-300 rounded px-1 py-1 text-sm disabled:opacity-50"
                                                value={daySchedule.endTime}
                                                disabled={daySchedule.isOff}
                                                onChange={(e) => updateScheduleDay(idx, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                            <Button variant="secondary" onClick={() => setIsDoctorModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{doctorModalMode === 'ADD' ? 'Add Doctor' : 'Save Changes'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* EDIT PATIENT MODAL */}
        {editingPatient && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-md p-6">
                    <h3 className="text-xl font-bold mb-4">Edit Patient Profile</h3>
                    <form onSubmit={handleEditPatientSubmit} className="space-y-4">
                        <Input label="Name" value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} />
                        <Input label="Phone" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} />
                        <Input label="Age" value={editingPatient.age || ''} onChange={e => setEditingPatient({...editingPatient, age: e.target.value})} />
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setEditingPatient(null)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* VITALS MODAL */}
        {vitalsModalPatient && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-red-500" /> Record Vitals</h3>
                        <button onClick={() => setVitalsModalPatient(null)}><X className="h-5 w-5 text-slate-400" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="BP (mmHg)" placeholder="120/80" value={vitalsForm.bp || ''} onChange={e => setVitalsForm({...vitalsForm, bp: e.target.value})} />
                        <Input label="Temperature (°F)" placeholder="98.6" value={vitalsForm.temp || ''} onChange={e => setVitalsForm({...vitalsForm, temp: e.target.value})} />
                        <Input label="Weight (kg)" placeholder="70" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({...vitalsForm, weight: e.target.value})} />
                        <Input label="Pulse (bpm)" placeholder="72" value={vitalsForm.pulse || ''} onChange={e => setVitalsForm({...vitalsForm, pulse: e.target.value})} />
                        <Input label="SpO2 (%)" placeholder="98" value={vitalsForm.spo2 || ''} onChange={e => setVitalsForm({...vitalsForm, spo2: e.target.value})} />
                        <Input label="Sugar (mg/dL)" placeholder="100" value={vitalsForm.sugar || ''} onChange={e => setVitalsForm({...vitalsForm, sugar: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="secondary" onClick={() => setVitalsModalPatient(null)}>Cancel</Button>
                        <Button onClick={saveVitals}><Save className="h-4 w-4 mr-2" /> Save Vitals</Button>
                    </div>
                </div>
            </div>
        )}

        {/* HISTORY MODAL */}
        {historyModalPatient && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-2xl p-6 h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">Patient History</h3>
                            <p className="text-sm text-slate-500">{historyModalPatient.name} ({historyModalPatient.age}, {historyModalPatient.gender})</p>
                        </div>
                        <button onClick={() => setHistoryModalPatient(null)}><X className="h-5 w-5 text-slate-400" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {getPatientHistory(historyModalPatient).map((visit, idx) => (
                            <div key={visit.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-slate-900">
                                            {new Date(visit.timeAdded).toLocaleDateString()}
                                            <span className="text-xs font-normal text-slate-500 ml-2">Token #{visit.tokenNumber}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">Dr. {doctors.find(d => d.id === visit.doctorId)?.name}</div>
                                    </div>
                                    <Badge status={visit.status} />
                                </div>
                                {visit.symptoms && (
                                    <div className="text-xs text-slate-600 mb-2">
                                        <span className="font-bold">Symptoms:</span> {visit.symptoms}
                                    </div>
                                )}
                                {visit.notes && (
                                    <div className="bg-white p-3 rounded border border-slate-200 text-sm text-slate-700 italic">
                                        "{visit.notes}"
                                    </div>
                                )}
                                {visit.vitals && Object.keys(visit.vitals).length > 0 && (
                                    <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-slate-500">
                                        {visit.vitals.bp && <div>BP: {visit.vitals.bp}</div>}
                                        {visit.vitals.temp && <div>Temp: {visit.vitals.temp}</div>}
                                        {visit.vitals.weight && <div>Wt: {visit.vitals.weight}kg</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmModal.isOpen && deleteConfirmModal.patient && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-[95%] sm:max-w-sm p-6 text-center animate-in zoom-in-95">
                    <div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Patient Records?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        This will permanently delete <strong>{deleteConfirmModal.count} visit records</strong> for <span className="font-bold text-slate-900">{deleteConfirmModal.patient.name}</span>. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setDeleteConfirmModal({ isOpen: false, patient: null, count: 0 })}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 border-red-600" onClick={handleDeleteConfirm}>Yes, Delete All</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};