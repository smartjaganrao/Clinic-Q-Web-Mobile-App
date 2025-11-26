
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, DaySchedule, Vitals, ClinicType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { 
  UserPlus, Clock, X, Settings, MessageCircle, 
  Save, Stethoscope, Plus, CalendarClock, User, Play, 
  CheckSquare, Activity, BarChart3, PieChart, Calendar as CalendarIcon, 
  Download, History, UserCheck, Users, Search, FileText, ChevronRight, Edit2, Trash2, List, Copy, Zap, ChevronLeft, CalendarDays, AlertTriangle, TrendingUp, IndianRupee, ArrowUpRight, ArrowUp, ArrowDown, UserMinus, RotateCcw, CheckCircle, AlertCircle, GripVertical, Smartphone, Unlock, Receipt, Printer, HeartPulse
} from 'lucide-react';

interface ReceptionProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => void;
  onEditPatient: (id: string, updates: Partial<Patient>) => void;
  onDeletePatient: (id: string) => void;
  onDeleteMultiplePatients: (ids: string[]) => void; // New prop for bulk delete
  onAddDoctor: (name: string, specialty: string, room: string, schedule: DaySchedule[]) => void;
  onEditDoctor: (id: string, updates: Partial<Doctor>) => void;
  onDeleteDoctor: (id: string) => void;
  onUpdateStatus: (patientId: string, status: PatientStatus) => void;
  onCancelPatient: (patientId: string) => void;
  onUpdateClinicName: (name: string) => void;
  onToggleEmergency: (patientId: string) => void;
  onManualReorder: (patientId: string, direction: 'UP' | 'DOWN') => void;
  onDragDrop: (draggedId: string, targetId: string) => void; 
  onManualCheckIn: (patientId: string) => void; // New Prop
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clinicType?: ClinicType;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface PatientEntry {
    name: string;
    phone: string;
    age: string;
    gender: string;
    lastVisit: number;
    totalVisits: number;
    visits: Patient[];
}

export const ReceptionDashboard: React.FC<ReceptionProps> = ({ 
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
  addToast,
  clinicType
}) => {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS'>('QUEUE');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<PatientEntry | null>(null);
  
  // -- Vitals Modal State --
  const [vitalsModal, setVitalsModal] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });
  const [vitalsForm, setVitalsForm] = useState<Vitals>({ bp: '', temp: '', weight: '', pulse: '', spo2: '', height: '', sugar: '' });

  // -- Billing Modal State --
  const [billingPatient, setBillingPatient] = useState<Patient | null>(null);
  const [billItems, setBillItems] = useState<{desc: string, amount: number}[]>([]);

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; entry: any } | null>(null);

  const [doctorModal, setDoctorModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; doctorId?: string }>({ isOpen: false, mode: 'ADD' });
  const [doctorViewMode, setDoctorViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  const [reportRange, setReportRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState(getLocalYYYYMMDD(new Date()));
  const [customEndDate, setCustomEndDate] = useState(getLocalYYYYMMDD(new Date()));
  
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id || '');
  const [isAppointment, setIsAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(getLocalYYYYMMDD(new Date()));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookingMonth, setBookingMonth] = useState(new Date());
  
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientSymptoms, setNewPatientSymptoms] = useState('');
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [tempClinicName, setTempClinicName] = useState(clinicName);

  const [draggedPatientId, setDraggedPatientId] = useState<string | null>(null);
  const [dragOverPatientId, setDragOverPatientId] = useState<string | null>(null);

  const getDefaultSchedule = (): DaySchedule[] => DAYS.map(day => ({
      day, startTime: '09:00', endTime: '17:00', isOff: day === 'Sunday'
  }));

  const [docForm, setDocForm] = useState<{
      name: string;
      specialty: string;
      room: string;
      schedule: DaySchedule[];
  }>({
      name: '',
      specialty: '',
      room: '',
      schedule: getDefaultSchedule()
  });
  
  const [filterDoc, setFilterDoc] = useState<string>('all');
  const [databaseSearch, setDatabaseSearch] = useState('');

  // ------------------------------------------------------------
  // CALENDAR LOGIC (DOCTOR VIEW)
  // ------------------------------------------------------------
  const [calDate, setCalDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
      const year = calDate.getFullYear();
      const month = calDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const days = [];

      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border border-slate-100"></div>);
      }

      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dateObj = new Date(year, month, day);
          const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          
          const activeDocs = doctors.filter(d => {
             const scheduleForDay = d.weeklySchedule.find(s => s.day === dayOfWeekName);
             return scheduleForDay && !scheduleForDay.isOff;
          });

          const dayAppointments = patients.filter(p => 
              p.visitType === 'APPOINTMENT' && 
              p.appointmentDate === dateStr &&
              p.status !== PatientStatus.CANCELLED
          );

          const isClosed = activeDocs.length === 0;
          let cellBg = 'bg-white';
          let borderColor = 'border-slate-100';
          
          if (isToday) {
             cellBg = 'bg-blue-50';
             borderColor = 'border-blue-200 ring-1 ring-blue-300 inset';
          } else if (isClosed) {
             cellBg = 'bg-slate-50';
             borderColor = 'border-slate-100';
          } else if (dayAppointments.length > 8) {
             cellBg = 'bg-red-50';
             borderColor = 'border-red-200';
          } else if (dayAppointments.length > 3) {
             cellBg = 'bg-orange-50';
             borderColor = 'border-orange-200';
          } else if (dayAppointments.length > 0) {
             cellBg = 'bg-green-50';
             borderColor = 'border-green-200';
          }

          days.push(
              <div key={day} className={`h-32 border p-2 relative group transition-colors flex flex-col justify-between ${borderColor} ${cellBg}`}>
                  <div className="flex justify-between items-start">
                      <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-primary-600 text-white shadow-md' : isClosed ? 'text-slate-400' : 'text-slate-700'}`}>
                          {day}
                      </span>
                      {isToday && <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wide">Today</span>}
                  </div>
                  
                  <div className="space-y-1.5 mt-2">
                     {isClosed ? (
                         <div className="flex items-center justify-center h-12">
                             <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded">Closed</span>
                         </div>
                     ) : (
                         <>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/60 p-1 rounded backdrop-blur-sm border border-slate-100/50">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span className="font-medium">{activeDocs.length}</span>
                                <span className="text-[10px] text-slate-400">Doctors</span>
                            </div>

                            {dayAppointments.length > 0 ? (
                                <div className={`flex items-center gap-1.5 text-xs p-1 rounded backdrop-blur-sm border ${dayAppointments.length > 8 ? 'bg-red-100/50 text-red-700 border-red-200' : 'bg-green-100/50 text-green-700 border-green-200'}`}>
                                    <CalendarClock className="h-3 w-3" />
                                    <span className="font-bold">{dayAppointments.length}</span>
                                    <span className="text-[10px] opacity-80">Booked</span>
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 pl-1">No Appts</div>
                            )}
                         </>
                     )}
                  </div>

                  {!isClosed && (
                      <button 
                        onClick={() => {
                            setAppointmentDate(dateStr);
                            openAddModal('APPOINTMENT');
                        }}
                        className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                          <span className="bg-white text-primary-600 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Book
                          </span>
                      </button>
                  )}
              </div>
          );
      }
      return days;
  };

  const renderBookingCalendar = () => {
      const year = bookingMonth.getFullYear();
      const month = bookingMonth.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const days = [];
      const todayStr = getLocalYYYYMMDD(new Date());

      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-8"></div>);
      }

      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === appointmentDate;
          const isPast = dateStr < todayStr;
          
          days.push(
              <button
                  key={day}
                  type="button"
                  onClick={() => { setAppointmentDate(dateStr); setAppointmentTime(''); }}
                  disabled={isPast}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all mx-auto
                      ${isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-primary-100'}
                      ${isSelected ? 'bg-primary-600 text-white shadow-md' : 'text-slate-700'}
                  `}
              >
                  {day}
              </button>
          );
      }
      return days;
  };

  const bookingSlots = useMemo(() => {
      if (!selectedDoctor || !appointmentDate) return { slots: [], isOff: false, workingHours: '' };
      
      const doc = doctors.find(d => d.id === selectedDoctor);
      if (!doc) return { slots: [], isOff: false, workingHours: '' };

      const [y, m, d] = appointmentDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = doc.weeklySchedule.find(s => s.day === dayName);

      if (!schedule || schedule.isOff) return { slots: [], isOff: true, workingHours: '' };

      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      
      const bookedTimes = new Set(patients
          .filter(p => p.doctorId === selectedDoctor && p.appointmentDate === appointmentDate && p.status !== PatientStatus.CANCELLED)
          .map(p => p.appointmentTime)
      );

      const slots = [];
      let currentH = startH;
      let currentM = startM;

      while (currentH < endH || (currentH === endH && currentM < endM)) {
          const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
          slots.push({
              time: timeStr,
              isBooked: bookedTimes.has(timeStr)
          });
          currentM += 20;
          if (currentM >= 60) {
              currentH++;
              currentM -= 60;
          }
      }

      return { slots, isOff: false, workingHours: `${schedule.startTime} - ${schedule.endTime}` };
  }, [selectedDoctor, appointmentDate, doctors, patients]);

  const uniquePatients = useMemo(() => {
    // Key is now Name + Phone to separate family members
    const map = new Map<string, PatientEntry>();
    const sortedHistory = [...patients].sort((a, b) => b.timeAdded - a.timeAdded);

    sortedHistory.forEach(p => {
        const key = `${p.phone}_${p.name.trim().toLowerCase()}`;
        
        if (!map.has(key)) {
            map.set(key, {
                name: p.name,
                phone: p.phone,
                age: p.age || '',
                gender: p.gender || '',
                lastVisit: p.timeAdded,
                totalVisits: 0,
                visits: []
            });
        }
        const entry = map.get(key)!;
        entry.totalVisits += 1;
        entry.visits.push(p);
    });
    return Array.from(map.values());
  }, [patients]);

  const filteredDatabase = uniquePatients.filter(p => 
      p.name.toLowerCase().includes(databaseSearch.toLowerCase()) || 
      p.phone.includes(databaseSearch)
  );

  // HANDLERS
  const handlePhoneLookup = (phone: string) => {
      const cleaned = phone.replace(/\D/g, '').slice(0, 10);
      setNewPatientPhone(cleaned);
      
      if (cleaned.length === 10) {
        // Find most recent patient with this phone number
        const existingEntries = uniquePatients.filter(p => p.phone === cleaned);
        if (existingEntries.length > 0) {
            // Pick the one with the latest visit
            existingEntries.sort((a,b) => b.lastVisit - a.lastVisit);
            const latest = existingEntries[0];
            
            setNewPatientName(latest.name);
            setNewPatientAge(latest.age || '');
            setNewPatientGender(latest.gender as any || 'Male');
            setIsExistingPatient(true);
            setIsEditingExisting(false);
        } else {
            if (isExistingPatient) {
                setNewPatientName('');
                setNewPatientAge('');
                setNewPatientGender('Male');
                setIsExistingPatient(false);
                setIsEditingExisting(true);
            }
        }
      } else {
          if (isExistingPatient) {
            setNewPatientName('');
            setNewPatientAge('');
            setNewPatientGender('Male');
            setIsExistingPatient(false);
            setIsEditingExisting(true);
          }
      }
  };
  
  const resetAddForm = () => {
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientAge('');
    setNewPatientSymptoms('');
    setIsAppointment(false);
    setAppointmentTime('');
    setIsExistingPatient(false);
    setIsEditingExisting(false);
    setShowAddModal(false);
  };

  const handleNewFamilyMember = () => {
      // Clear personal details but keep the phone number
      setNewPatientName('');
      setNewPatientAge('');
      setNewPatientGender('Male');
      setNewPatientSymptoms('');
      // Unlock the form
      setIsExistingPatient(false);
      setIsEditingExisting(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatientName && newPatientPhone && selectedDoctor) {
      if (newPatientPhone.length !== 10) {
          addToast("Invalid Phone: Must be 10 digits to sync with Patient App.", "error");
          return;
      }
      const isDuplicate = patients.some(p => 
        p.phone === newPatientPhone &&
        p.name.trim().toLowerCase() === newPatientName.trim().toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
      );

      if (isDuplicate) {
        addToast("Duplicate: This patient (Name + Phone) is already in the active queue.", "error");
        return;
      }

      if (isAppointment && (!appointmentDate || !appointmentTime)) {
          addToast("Please select date and time for appointment", "error");
          return;
      }
      onAddPatient(
          newPatientName, 
          newPatientPhone, 
          selectedDoctor, 
          isAppointment ? appointmentDate : undefined,
          isAppointment ? appointmentTime : undefined,
          newPatientAge,
          newPatientGender,
          newPatientSymptoms
      );
      
      resetAddForm();
    }
  };
  
  const openAddModal = (mode: 'WALK_IN' | 'APPOINTMENT') => {
      resetAddForm();
      setIsAppointment(mode === 'APPOINTMENT');
      setShowAddModal(true);
  };

  const handleEditPatientSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPatient) {
          onEditPatient(editingPatient.id, { 
              name: editingPatient.name, 
              phone: editingPatient.phone,
              age: editingPatient.age,
              gender: editingPatient.gender,
              symptoms: editingPatient.symptoms 
            });
          setEditingPatient(null);
      }
  };

  const handleDeletePatientClick = (patient: Patient) => {
      if (window.confirm(`Are you sure you want to delete patient ${patient.name}? This cannot be undone.`)) {
          onDeletePatient(patient.id);
      }
  };

  const handleStartVisit = (patient: Patient) => {
      const activePatient = patients.find(p => p.doctorId === patient.doctorId && p.status === PatientStatus.WITH_DOCTOR);
      
      if (activePatient) {
          const docName = doctors.find(d => d.id === patient.doctorId)?.name || 'The doctor';
          addToast(`${docName} is currently seeing ${activePatient.name}. Complete that visit first.`, 'error');
          return;
      }
      onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR);
  };

  const handleQuickBook = (patient: Patient) => {
      setNewPatientName(patient.name);
      setNewPatientPhone(patient.phone);
      setNewPatientAge(patient.age || '');
      setNewPatientGender(patient.gender || 'Male');
      setNewPatientSymptoms('');
      setIsAppointment(false);
      setIsExistingPatient(true);
      setShowAddModal(true);
  };

  const handleEditDatabasePatient = (entry: { visits: Patient[] }) => {
      if (entry.visits.length > 0) {
          setEditingPatient(entry.visits[0]);
      }
  };

  const handleDeleteDatabasePatientClick = (entry: { name: string, totalVisits: number, visits: Patient[] }) => {
      setDeleteModal({ isOpen: true, entry });
  };

  const confirmDeleteDatabasePatient = () => {
      if (deleteModal && deleteModal.entry) {
          const ids = deleteModal.entry.visits.map((v: Patient) => v.id);
          onDeleteMultiplePatients(ids);
          setDeleteModal(null);
      }
  };

  const openDoctorModal = (mode: 'ADD' | 'EDIT', doctor?: Doctor) => {
      if (mode === 'EDIT' && doctor) {
          setDocForm({
              name: doctor.name,
              specialty: doctor.specialty,
              room: doctor.roomNumber,
              schedule: JSON.parse(JSON.stringify(doctor.weeklySchedule))
          });
          setDoctorModal({ isOpen: true, mode: 'EDIT', doctorId: doctor.id });
      } else {
          setDocForm({ name: '', specialty: '', room: '', schedule: getDefaultSchedule() });
          setDoctorModal({ isOpen: true, mode: 'ADD' });
      }
  };

  const updateScheduleDay = (index: number, field: keyof DaySchedule, value: any) => {
      const newSchedule = [...docForm.schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      setDocForm({ ...docForm, schedule: newSchedule });
  };

  const copyMondayToAll = () => {
      const monday = docForm.schedule[0];
      const newSchedule = docForm.schedule.map(d => ({
          ...d,
          startTime: monday.startTime,
          endTime: monday.endTime,
          isOff: monday.isOff
      }));
      setDocForm({ ...docForm, schedule: newSchedule });
      addToast("Schedule copied to all days", "info");
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (doctorModal.mode === 'ADD') {
          onAddDoctor(docForm.name, docForm.specialty, docForm.room, docForm.schedule);
      } else if (doctorModal.mode === 'EDIT' && doctorModal.doctorId) {
          onEditDoctor(doctorModal.doctorId, {
              name: docForm.name,
              specialty: docForm.specialty,
              roomNumber: docForm.room,
              weeklySchedule: docForm.schedule
          });
      }
      setDoctorModal({ ...doctorModal, isOpen: false });
  };

  const handleDeleteDoctorClick = (doctor: Doctor) => {
      const activePatients = patients.filter(p => p.doctorId === doctor.id && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED).length;
      if (activePatients > 0) {
          addToast(`Cannot delete ${doctor.name} while they have ${activePatients} active patients.`, 'error');
          return;
      }
      if (window.confirm(`Are you sure you want to remove ${doctor.name}?`)) {
          onDeleteDoctor(doctor.id);
      }
  };

  const handleSaveSettings = () => {
      onUpdateClinicName(tempClinicName);
      setShowSettingsModal(false);
  };

  const sendWhatsApp = (patient: Patient) => {
      addToast(`WhatsApp Sent to ${patient.name}: "It is your turn soon!"`, 'success');
  };

  // BILLING HANDLERS
  const openBillingModal = (patient: Patient) => {
      const doc = doctors.find(d => d.id === patient.doctorId);
      setBillingPatient(patient);
      setBillItems([
          { desc: 'Consultation Fee', amount: doc?.consultationFee || 500 }
      ]);
  };

  const printBill = () => {
      if (!billingPatient) return;
      addToast(`Bill Generated for ₹${billItems.reduce((acc, i) => acc + i.amount, 0)}`, "success");
      setBillingPatient(null);
      // In real app: window.print() or generate PDF
  };

  // VITALS HANDLERS
  const openVitalsModal = (patient: Patient) => {
      setVitalsModal({ isOpen: true, patient });
      setVitalsForm({
          bp: patient.vitals?.bp || '',
          temp: patient.vitals?.temp || '',
          weight: patient.vitals?.weight || '',
          pulse: patient.vitals?.pulse || '',
          spo2: patient.vitals?.spo2 || '',
          height: patient.vitals?.height || '',
          sugar: patient.vitals?.sugar || ''
      });
  };

  const handleVitalsSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (vitalsModal.patient) {
          onEditPatient(vitalsModal.patient.id, { vitals: vitalsForm });
          addToast("Vitals recorded successfully", "success");
          setVitalsModal({ isOpen: false, patient: null });
      }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, patientId: string) => {
    setDraggedPatientId(patientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, patientId: string) => {
    e.preventDefault();
    if (draggedPatientId === patientId) return;
    setDragOverPatientId(patientId);
  };

  const handleDragLeave = () => {
    // Optional
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    setDragOverPatientId(null);
    if (draggedPatientId && draggedPatientId !== targetId) {
        onDragDrop(draggedPatientId, targetId);
    }
    setDraggedPatientId(null);
  };

  const handleDragEnd = () => {
      setDraggedPatientId(null);
      setDragOverPatientId(null);
  };

  // SMART QUEUE LOGIC
  const getPriority = (p: Patient) => {
      if (p.status === PatientStatus.WITH_DOCTOR) return 0;
      if (p.isEmergency) return 1;

      if (p.visitType === 'APPOINTMENT' && p.appointmentTime) {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const [h, m] = p.appointmentTime.split(':').map(Number);
          const apptMins = h * 60 + m;
          const minsUntilAppt = apptMins - currentMins;

          if (p.isCheckedIn) return 2;
          if (minsUntilAppt <= 15) return 4;
          return 5;
      }
      return 3;
  };

  const filteredPatients = patients
    .filter(p => 
        p.status !== PatientStatus.COMPLETED && 
        p.status !== PatientStatus.CANCELLED &&
        (filterDoc === 'all' || p.doctorId === filterDoc)
    );

  const smartSortedPatients = [...filteredPatients].sort((a, b) => {
      const pA = getPriority(a);
      const pB = getPriority(b);
      
      if (pA !== pB) return pA - pB;
      
      if (a.visitType === 'APPOINTMENT' && b.visitType === 'APPOINTMENT' && a.appointmentTime && b.appointmentTime) {
          return a.appointmentTime.localeCompare(b.appointmentTime);
      }
      return a.timeAdded - b.timeAdded;
  });

  const getFilteredReportData = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let startTime = todayStart;
    let endTime = Date.now();
    
    if (reportRange === 'WEEK') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startTime = weekStart.getTime();
    } else if (reportRange === 'MONTH') {
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        startTime = monthStart.getTime();
    } else if (reportRange === 'CUSTOM') {
        const [sy, sm, sd] = customStartDate.split('-').map(Number);
        const [ey, em, ed] = customEndDate.split('-').map(Number);
        startTime = new Date(sy, sm - 1, sd).getTime();
        endTime = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
    }
    
    return patients.filter(p => p.timeAdded >= startTime && p.timeAdded <= endTime).sort((a, b) => b.timeAdded - a.timeAdded);
  };

  const getPatientType = (patient: Patient) => {
      const previousVisits = patients.filter(p => 
          p.phone === patient.phone && 
          p.timeAdded < patient.timeAdded
      );
      return previousVisits.length > 0 ? 'Returning' : 'New';
  };

  const reportPatients = getFilteredReportData();
  const totalVisits = reportPatients.length;
  const completedVisits = reportPatients.filter(p => p.status === PatientStatus.COMPLETED).length;
  const estimatedRevenue = completedVisits * 500;

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{clinicName}</h1>
          <p className="text-slate-500">Reception Dashboard</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setShowReportsModal(true)}>
                <BarChart3 className="h-5 w-5 mr-2" />
                Reports
            </Button>
            <Button variant="secondary" onClick={() => setShowSettingsModal(true)}>
                <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={() => openAddModal('WALK_IN')} className="shadow-lg shadow-primary-200 bg-primary-600 hover:bg-primary-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Add Patient
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div><p className="text-sm font-medium text-slate-500">Waiting</p><p className="text-3xl font-bold text-blue-700">{patients.filter(p => p.status === PatientStatus.WAITING).length}</p></div>
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Clock className="h-6 w-6" /></div>
        </Card>
        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-green-50 to-white border-green-100">
          <div><p className="text-sm font-medium text-slate-500">In Consultation</p><p className="text-3xl font-bold text-green-700">{patients.filter(p => p.status === PatientStatus.WITH_DOCTOR).length}</p></div>
          <div className="p-3 bg-green-100 rounded-lg text-green-600"><Activity className="h-6 w-6" /></div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div><p className="text-sm font-medium text-slate-500">Doctors Active</p><p className="text-3xl font-bold text-slate-900">{doctors.filter(d => d.isAvailable).length}</p></div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><User className="h-6 w-6" /></div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex border-b border-slate-200">
            <button className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'QUEUE' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('QUEUE')}><Activity className="h-4 w-4" /> Live Queue</button>
            <button className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DATABASE' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('DATABASE')}><Users className="h-4 w-4" /> Patient Database</button>
            <button className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DOCTORS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('DOCTORS')}><Stethoscope className="h-4 w-4" /> Doctors & Schedules</button>
        </div>

        {activeTab === 'QUEUE' && (
            <>
                <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Live Queue <span className="text-xs font-normal text-slate-500 ml-2">(Auto-Sorted by Priority)</span></h2>
                <div className="flex gap-2">
                    <select className="px-3 py-2 rounded-lg border border-slate-300 text-sm" value={filterDoc} onChange={(e) => setFilterDoc(e.target.value)}>
                    <option value="all">All Doctors</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 w-16">Ord</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Token</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Patient</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Doctor</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {smartSortedPatients.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No patients in the waiting queue.</td></tr>
                    ) : (
                        smartSortedPatients.map((patient) => {
                            const isReorderable = patient.status === PatientStatus.WAITING;
                            const isDragging = draggedPatientId === patient.id;
                            const isDragOver = dragOverPatientId === patient.id;
                            const hasVitals = patient.vitals && (patient.vitals.bp || patient.vitals.pulse);

                            return (
                        <tr 
                            key={patient.id} 
                            draggable={isReorderable}
                            onDragStart={(e) => isReorderable && handleDragStart(e, patient.id)}
                            onDragOver={(e) => isReorderable && handleDragOver(e, patient.id)}
                            onDragLeave={handleDragLeave}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => isReorderable && handleDrop(e, patient.id)}
                            className={`transition-colors group ${patient.status === PatientStatus.SKIPPED ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'} ${isDragging ? 'opacity-50 bg-slate-100' : ''} ${isDragOver ? 'border-y-2 border-blue-500 bg-blue-50' : ''}`}
                        >
                             <td className="px-6 py-4">
                                {isReorderable ? (
                                    <div className="cursor-move text-slate-300 hover:text-slate-600 flex items-center justify-center p-2 rounded hover:bg-slate-100"><GripVertical className="h-5 w-5" /></div>
                                ) : <span className="text-slate-300 block w-5 text-center">-</span>}
                             </td>
                            <td className="px-6 py-4 font-bold text-primary-700">#{patient.tokenNumber} {patient.isEmergency && <Zap className="h-4 w-4 text-orange-500 inline ml-1 fill-current" />}</td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                {patient.name} 
                                {patient.isCheckedIn && <CheckCircle className="h-4 w-4 text-green-500 fill-green-100" title="Checked In" />}
                                {(patient.age || patient.gender) && <span className="text-xs text-slate-500 font-normal">({patient.age || '?'}, {patient.gender?.[0] || '?'})</span>}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2"><span>{patient.phone}</span></div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{doctors.find(d => d.id === patient.doctorId)?.name}</td>
                            <td className="px-6 py-4">{patient.visitType === 'APPOINTMENT' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit"><CalendarClock className="h-3 w-3" /> {patient.appointmentTime} Appt</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"><User className="h-3 w-3" /> Walk-in</span>}</td>
                            <td className="px-6 py-4"><Badge status={patient.status} /></td>
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingPatient(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg" title="Edit Details"><Edit2 className="h-4 w-4" /></button>
                                    
                                    {/* Manual Check-In Button */}
                                    {patient.visitType === 'APPOINTMENT' && !patient.isCheckedIn && patient.status === PatientStatus.WAITING && (
                                        <button onClick={() => onManualCheckIn(patient.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Confirm Arrival / Check-in">
                                            <UserCheck className="h-5 w-5" />
                                        </button>
                                    )}

                                    {patient.status === PatientStatus.WAITING && (
                                        <button 
                                            onClick={() => openVitalsModal(patient)} 
                                            className={`p-2 rounded-lg transition-colors ${hasVitals ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`} 
                                            title="Record Vitals"
                                        >
                                            <HeartPulse className="h-5 w-5" />
                                        </button>
                                    )}

                                    <button onClick={() => sendWhatsApp(patient)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Send WhatsApp Reminder"><MessageCircle className="h-5 w-5" /></button>
                                        
                                        {patient.status === PatientStatus.WAITING && (
                                            <>
                                                <button onClick={() => handleStartVisit(patient)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Send Patient In"><Play className="h-5 w-5" /></button>
                                                <button onClick={() => onUpdateStatus(patient.id, PatientStatus.SKIPPED)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg" title="Mark Absent"><UserMinus className="h-5 w-5" /></button>
                                            </>
                                        )}
                                        {patient.status === PatientStatus.WITH_DOCTOR && (
                                            <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Mark Completed"><CheckSquare className="h-5 w-5" /></button>
                                        )}
                                        <button onClick={() => onCancelPatient(patient.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><X className="h-5 w-5" /></button>
                            </div>
                            </td>
                        </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
                </div>
            </>
        )}

        {/* DATABASE VIEW */}
        {activeTab === 'DATABASE' && (
            <div className="animate-in fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search by Name or Phone Number..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300" value={databaseSearch} onChange={(e) => setDatabaseSearch(e.target.value)}/>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Patient</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Phone</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Age / Gender</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Last Visit</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Visits</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                                {filteredDatabase.map((patientEntry) => {
                                    const lastVisit = patientEntry.visits[0];
                                    // Unique key for the row
                                    const key = `${patientEntry.phone}_${patientEntry.name}`;
                                    return (
                                    <tr key={key} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900">{patientEntry.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{patientEntry.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{patientEntry.age} / {patientEntry.gender}</td>
                                        <td className="px-6 py-4 text-slate-600">{new Date(patientEntry.lastVisit).toLocaleDateString()}</td>
                                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">{patientEntry.totalVisits}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                <button onClick={() => handleEditDatabasePatient(patientEntry)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Profile">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteDatabasePatientClick(patientEntry)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-2" title="Delete All Records">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                
                                                <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                                {/* Only show Generate Bill if the LAST visit was completed */}
                                                {lastVisit.status === PatientStatus.COMPLETED && (
                                                    <Button size="sm" variant="secondary" onClick={() => openBillingModal(lastVisit)} title="Generate Bill"><Receipt className="h-4 w-4 text-green-600" /></Button>
                                                )}
                                                {/* Update: Pass the patientEntry object directly to state */}
                                                <Button size="sm" variant="outline" onClick={() => setShowHistoryModal(patientEntry)}><History className="h-4 w-4 mr-1" /> History</Button>
                                                <Button size="sm" onClick={() => handleQuickBook(lastVisit)}>Book Again</Button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* DOCTORS VIEW */}
        {activeTab === 'DOCTORS' && (
             <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-900">Medical Staff & Schedules</h2>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setDoctorViewMode('LIST')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 ${doctorViewMode === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><List className="h-3 w-3" /> List</button>
                            <button onClick={() => setDoctorViewMode('CALENDAR')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 ${doctorViewMode === 'CALENDAR' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><CalendarIcon className="h-3 w-3" /> Calendar</button>
                        </div>
                    </div>
                    <Button onClick={() => openDoctorModal('ADD')}><Plus className="h-4 w-4 mr-2" /> Add New Doctor</Button>
                </div>
                
                {doctorViewMode === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(d => (
                            <Card key={d.id} className="p-5 flex flex-col gap-4 group relative">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openDoctorModal('EDIT', d)} className="p-1.5 bg-white border border-slate-200 rounded-md hover:text-primary-600"><Edit2 className="h-3 w-3" /></button>
                                    <button onClick={() => handleDeleteDoctorClick(d)} className="p-1.5 bg-white border border-slate-200 rounded-md hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                </div>
                                <div className="flex items-center gap-4"><img src={d.avatarUrl} className="w-14 h-14 rounded-full object-cover" /><div><h3 className="font-bold text-slate-900">{d.name}</h3><p className="text-sm text-slate-500">{d.specialty}</p></div></div>
                                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${d.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : 'bg-red-500'}`}></span> {d.status === DoctorStatus.AVAILABLE ? 'Available' : 'Offline'}</div>
                                    <div>{d.weeklySchedule.find(s => s.day === new Date().toLocaleDateString('en-US', {weekday:'long'}))?.isOff ? 'OFF TODAY' : 'On Duty'}</div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary-600" /><h3 className="font-bold text-lg">{calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3></div>
                             <div className="flex gap-2"><button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-4 w-4"/></button><button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-4 w-4"/></button></div>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>)}
                            {renderCalendarDays()}
                        </div>
                    </div>
                )}
             </div>
        )}

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Patient Records?</h3>
                      <p className="text-slate-500 text-sm">
                          Are you sure you want to delete <span className="font-bold text-slate-900">{deleteModal.entry.name}</span>?
                          <br/>
                          <span className="text-red-600 font-bold mt-2 block">Warning: This will remove all {deleteModal.entry.totalVisits} visit records.</span>
                      </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                          Cancel
                      </Button>
                      <Button 
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600" 
                          onClick={confirmDeleteDatabasePatient}
                      >
                          Yes, Delete All
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* BILLING MODAL */}
      {billingPatient && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-green-600"/> Generate Bill</h3>
                      <button onClick={() => setBillingPatient(null)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg mb-6">
                      <div className="flex justify-between mb-2">
                          <span className="text-slate-600 text-sm">Patient Name</span>
                          <span className="font-bold text-slate-900">{billingPatient.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                          <span className="text-slate-600 text-sm">Doctor</span>
                          <span className="font-medium text-slate-900">{doctors.find(d => d.id === billingPatient.doctorId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-slate-600 text-sm">Date</span>
                          <span className="font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
                      </div>
                  </div>

                  <div className="space-y-3 mb-6">
                      {billItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-sm font-medium text-slate-700">{item.desc}</span>
                              <span className="font-mono text-slate-900">₹{item.amount}</span>
                          </div>
                      ))}
                      <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-lg text-slate-900">Total</span>
                          <span className="font-bold text-xl text-primary-600">₹{billItems.reduce((acc, i) => acc + i.amount, 0)}</span>
                      </div>
                  </div>

                  <Button onClick={printBill} className="w-full bg-green-600 hover:bg-green-700">
                      <Printer className="h-4 w-4 mr-2" /> Print Receipt
                  </Button>
              </div>
          </div>
      )}
      
      {/* VITALS MODAL (Nurse/Staff View) */}
      {vitalsModal.isOpen && vitalsModal.patient && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                          <div className="bg-red-100 p-2 rounded-lg">
                              <HeartPulse className="h-6 w-6 text-red-600"/>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Record Vitals</h3>
                            <p className="text-xs text-slate-500">Pre-check for {vitalsModal.patient.name}</p>
                          </div>
                      </div>
                      <button onClick={() => setVitalsModal({isOpen: false, patient: null})} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  </div>
                  
                  <form onSubmit={handleVitalsSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <Input 
                              label="BP (mmHg)" 
                              placeholder="120/80" 
                              value={vitalsForm.bp} 
                              onChange={(e) => setVitalsForm({...vitalsForm, bp: e.target.value})} 
                          />
                          <Input 
                              label="Pulse (bpm)" 
                              placeholder="72" 
                              value={vitalsForm.pulse} 
                              onChange={(e) => setVitalsForm({...vitalsForm, pulse: e.target.value})} 
                          />
                          <Input 
                              label="Temp (°F)" 
                              placeholder="98.6" 
                              value={vitalsForm.temp} 
                              onChange={(e) => setVitalsForm({...vitalsForm, temp: e.target.value})} 
                          />
                          <Input 
                              label="SpO2 (%)" 
                              placeholder="98" 
                              value={vitalsForm.spo2} 
                              onChange={(e) => setVitalsForm({...vitalsForm, spo2: e.target.value})} 
                          />
                          <Input 
                              label="Weight (kg)" 
                              placeholder="70" 
                              value={vitalsForm.weight} 
                              onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})} 
                          />
                          <Input 
                              label="Height (cm)" 
                              placeholder="175" 
                              value={vitalsForm.height} 
                              onChange={(e) => setVitalsForm({...vitalsForm, height: e.target.value})} 
                          />
                          <Input 
                              label="Sugar (mg/dL)" 
                              placeholder="RBS / FBS" 
                              value={vitalsForm.sugar} 
                              onChange={(e) => setVitalsForm({...vitalsForm, sugar: e.target.value})} 
                          />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 flex items-center gap-2 mt-2">
                          <Activity className="h-4 w-4" />
                          <span>These details will be visible to the doctor immediately.</span>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setVitalsModal({isOpen: false, patient: null})}>Cancel</Button>
                          <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white">Save Vitals</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* DOCTOR ADD/EDIT MODAL */}
      {doctorModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">
                  <button onClick={() => setDoctorModal({...doctorModal, isOpen: false})} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">{doctorModal.mode === 'ADD' ? 'Add New Doctor' : 'Edit Doctor Profile'}</h2>
                  
                  <form onSubmit={handleDoctorSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Doctor Name" placeholder="Dr. Name" value={docForm.name} onChange={(e) => setDocForm({...docForm, name: e.target.value})} required />
                          <Input label="Specialty" placeholder="e.g. Cardiologist" value={docForm.specialty} onChange={(e) => setDocForm({...docForm, specialty: e.target.value})} required />
                          <Input label="Room Number" placeholder="e.g. 101" value={docForm.room} onChange={(e) => setDocForm({...docForm, room: e.target.value})} required />
                      </div>

                      <div>
                          <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-slate-700">Weekly Schedule</label>
                              <Button type="button" size="sm" variant="secondary" onClick={copyMondayToAll} className="text-xs"><Copy className="h-3 w-3 mr-1"/> Copy Monday to All</Button>
                          </div>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-left">
                                      <tr>
                                          <th className="px-4 py-2 font-medium text-slate-600">Day</th>
                                          <th className="px-4 py-2 font-medium text-slate-600">Start</th>
                                          <th className="px-4 py-2 font-medium text-slate-600">End</th>
                                          <th className="px-4 py-2 font-medium text-slate-600 text-center">Off</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {docForm.schedule.map((day, idx) => (
                                          <tr key={day.day} className={day.isOff ? 'bg-slate-50 text-slate-400' : 'bg-white'}>
                                              <td className="px-4 py-2 font-medium">{day.day}</td>
                                              <td className="px-4 py-2"><input type="time" disabled={day.isOff} value={day.startTime} onChange={(e) => updateScheduleDay(idx, 'startTime', e.target.value)} className="border rounded px-2 py-1 disabled:opacity-50" /></td>
                                              <td className="px-4 py-2"><input type="time" disabled={day.isOff} value={day.endTime} onChange={(e) => updateScheduleDay(idx, 'endTime', e.target.value)} className="border rounded px-2 py-1 disabled:opacity-50" /></td>
                                              <td className="px-4 py-2 text-center"><input type="checkbox" checked={day.isOff} onChange={(e) => updateScheduleDay(idx, 'isOff', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" /></td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setDoctorModal({...doctorModal, isOpen: false})}>Cancel</Button>
                          <Button type="submit" className="flex-1">Save Doctor</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Clinic Settings</h3>
                      <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  </div>
                  <div className="space-y-4">
                      <Input label="Clinic Name" value={tempClinicName} onChange={(e) => setTempClinicName(e.target.value)} />
                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                          <p><strong>Plan:</strong> Solo Clinic (Free Tier)</p>
                          <p className="mt-1">Upgrade to unlock SMS integration and advanced analytics.</p>
                      </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                      <Button className="flex-1" onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
              </div>
          </div>
      )}

      {/* REPORTS MODAL */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto relative">
              <button onClick={() => setShowReportsModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Clinic Analytics</h2>

              <div className="flex flex-wrap gap-2 mb-6">
                  <button onClick={() => setReportRange('TODAY')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportRange === 'TODAY' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Today</button>
                  <button onClick={() => setReportRange('WEEK')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportRange === 'WEEK' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>This Week</button>
                  <button onClick={() => setReportRange('MONTH')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportRange === 'MONTH' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>This Month</button>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 ml-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Custom:</span>
                      <input type="date" value={customStartDate} onChange={(e) => { setReportRange('CUSTOM'); setCustomStartDate(e.target.value); }} className="bg-transparent text-sm py-1 focus:outline-none" />
                      <span className="text-slate-400">-</span>
                      <input type="date" value={customEndDate} onChange={(e) => { setReportRange('CUSTOM'); setCustomEndDate(e.target.value); }} className="bg-transparent text-sm py-1 focus:outline-none" />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">Total Visits</p>
                      <p className="text-3xl font-bold text-slate-900">{totalVisits}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-xs font-bold text-green-800 uppercase mb-1">Completed</p>
                      <p className="text-3xl font-bold text-slate-900">{completedVisits}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <p className="text-xs font-bold text-purple-800 uppercase mb-1">Est. Revenue</p>
                      <p className="text-3xl font-bold text-slate-900">₹{estimatedRevenue}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <p className="text-xs font-bold text-orange-800 uppercase mb-1">Returning Patients</p>
                      <p className="text-3xl font-bold text-slate-900">{reportPatients.filter(p => getPatientType(p) === 'Returning').length}</p>
                  </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                              <th className="px-4 py-3 font-semibold text-slate-600">Patient</th>
                              <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                              <th className="px-4 py-3 font-semibold text-slate-600">Doctor</th>
                              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {reportPatients.length === 0 ? (
                              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No data found for this period.</td></tr>
                          ) : (
                              reportPatients.map(p => (
                                  <tr key={p.id}>
                                      <td className="px-4 py-3 text-slate-500">{new Date(p.timeAdded).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                      <td className="px-4 py-3 font-medium text-slate-900">
                                          {p.name}
                                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${getPatientType(p) === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{getPatientType(p)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">{p.visitType}</td>
                                      <td className="px-4 py-3 text-slate-600">{doctors.find(d => d.id === p.doctorId)?.name}</td>
                                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>
      )}
      
      {/* HISTORY MODAL - MODIFIED TO USE OBJECT STATE */}
      {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">
                  <button onClick={() => setShowHistoryModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="bg-primary-100 h-12 w-12 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">{showHistoryModal.name[0]}</div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900">{showHistoryModal.name}</h2>
                          <p className="text-slate-500 font-mono">{showHistoryModal.phone}</p>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                      {showHistoryModal.visits.map((visit, idx) => (
                          <div key={visit.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-start bg-slate-50">
                              <div className="flex-1">
                                  <div className="font-bold text-slate-900 mb-1">{new Date(visit.timeAdded).toLocaleDateString()} <span className="text-xs font-normal text-slate-500 ml-2">{new Date(visit.timeAdded).toLocaleTimeString()}</span></div>
                                  <div className="text-sm text-slate-700 mb-2">Dr. {doctors.find(d => d.id === visit.doctorId)?.name || 'Unknown'}</div>
                                  
                                  {/* Clinical Snapshot */}
                                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                      {visit.symptoms && <div><span className="font-bold text-slate-500">Symptoms:</span> {visit.symptoms}</div>}
                                      {visit.vitals?.bp && <div><span className="font-bold text-slate-500">BP:</span> {visit.vitals.bp}</div>}
                                      {visit.vitals?.temp && <div><span className="font-bold text-slate-500">Temp:</span> {visit.vitals.temp}°F</div>}
                                      {visit.vitals?.weight && <div><span className="font-bold text-slate-500">Weight:</span> {visit.vitals.weight}kg</div>}
                                  </div>

                                  {/* Diagnosis & Notes */}
                                  {visit.notes ? (
                                      <div className="bg-white border border-slate-200 p-3 rounded-lg text-xs space-y-2">
                                          {/* Check if notes contain a prescription section */}
                                          {visit.notes.includes("--- PRESCRIPTION ---") ? (
                                              <>
                                                 <div className="text-slate-700 italic">{visit.notes.split("--- PRESCRIPTION ---")[0]}</div>
                                                 <div className="border-t border-slate-100 pt-2 mt-2">
                                                     <div className="font-bold text-slate-500 text-[10px] uppercase mb-1">Prescription</div>
                                                     <div className="font-mono text-slate-800 whitespace-pre-wrap">{visit.notes.split("--- PRESCRIPTION ---")[1]}</div>
                                                 </div>
                                              </>
                                          ) : (
                                              <div className="text-slate-700 italic">"{visit.notes}"</div>
                                          )}
                                      </div>
                                  ) : <span className="text-xs text-slate-400 italic">No notes recorded</span>}
                              </div>
                              <div className="text-right ml-4">
                                  <Badge status={visit.status} />
                                  <div className="mt-2 text-xs text-slate-500">{visit.visitType}</div>
                              </div>
                          </div>
                      ))}
                  </div>
               </div>
          </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative">
            <button onClick={resetAddForm} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            <div className="mb-4">
                <div className="flex gap-2 mb-4 justify-center">
                    <button type="button" onClick={() => setIsAppointment(false)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${!isAppointment ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><UserPlus className="h-4 w-4" /> Walk-In</button>
                    <button type="button" onClick={() => setIsAppointment(true)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${isAppointment ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><CalendarClock className="h-4 w-4" /> Appointment</button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-slate-400 uppercase">Mobile Number</label><span className="text-[10px] text-primary-600 font-medium flex items-center gap-1"><Smartphone className="h-3 w-3" /> Lookup</span></div>
                   <Input placeholder="10-digit Mobile..." value={newPatientPhone} onChange={(e) => handlePhoneLookup(e.target.value)} autoFocus className="font-mono text-lg tracking-wide bg-white" required type="tel" maxLength={10}/>
                   {newPatientPhone.length === 10 && (
                       <div className="mt-3 animate-in fade-in">
                           {isExistingPatient ? (
                               <div className="bg-white p-3 rounded-lg border-l-4 border-green-500 shadow-sm">
                                   <div className="flex justify-between items-center mb-2">
                                       <div>
                                           <div className="flex items-center gap-1 text-xs font-bold text-green-700 mb-0.5"><CheckCircle className="h-3 w-3" /> PRIMARY PATIENT</div>
                                           <div className="font-bold text-slate-900">{newPatientName}</div>
                                           <div className="text-xs text-slate-500">{newPatientAge || '?'} yrs • {newPatientGender}</div>
                                       </div>
                                       {!isEditingExisting && <Button size="sm" variant="ghost" type="button" onClick={() => setIsEditingExisting(true)} className="text-xs h-7"><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>}
                                   </div>
                                   <div className="pt-2 border-t border-slate-100">
                                       <button type="button" onClick={handleNewFamilyMember} className="w-full text-xs font-bold text-primary-600 hover:bg-primary-50 py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
                                           <UserPlus className="h-3 w-3" /> Different Person / Family Member
                                       </button>
                                   </div>
                               </div>
                           ) : <div className="flex items-center gap-2 text-slate-500 bg-white p-2 rounded-lg border border-dashed border-slate-300"><UserPlus className="h-4 w-4" /><span className="text-xs font-medium">New Number. Please fill details below.</span></div>}
                       </div>
                   )}
               </div>
               <div className={`space-y-3 transition-opacity duration-300 ${newPatientPhone.length === 10 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                   <Input label="Full Name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Patient Name" required disabled={isExistingPatient && !isEditingExisting} className={isExistingPatient && !isEditingExisting ? 'bg-slate-100 text-slate-500' : ''}/>
                   <div className="grid grid-cols-2 gap-4">
                        <Input label="Age" type="number" placeholder="25" value={newPatientAge} onChange={e => setNewPatientAge(e.target.value)} disabled={isExistingPatient && !isEditingExisting} className={isExistingPatient && !isEditingExisting ? 'bg-slate-100 text-slate-500' : ''}/>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 ${isExistingPatient && !isEditingExisting ? 'bg-slate-100 text-slate-500' : ''}`} value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value as any)} disabled={isExistingPatient && !isEditingExisting}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                   </div>
                   <Input label="Reason / Symptoms" placeholder="e.g. Fever, Headache" value={newPatientSymptoms} onChange={e => setNewPatientSymptoms(e.target.value)} />
                   <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label><select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>{doctors.map(d => (<option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>))}</select></div>
               </div>
               {isAppointment && (
                   <div className="space-y-4 border-t border-slate-100 pt-4 mt-2">
                       <div className="flex items-center justify-between"><h4 className="font-bold text-sm text-slate-700">Select Date & Time</h4><div className="flex gap-1"><button type="button" onClick={() => setBookingMonth(new Date(bookingMonth.getFullYear(), bookingMonth.getMonth()-1, 1))}><ChevronLeft className="h-4 w-4"/></button><span className="text-xs font-bold">{bookingMonth.toLocaleString('default', {month:'short', year:'2-digit'})}</span><button type="button" onClick={() => setBookingMonth(new Date(bookingMonth.getFullYear(), bookingMonth.getMonth()+1, 1))}><ChevronRight className="h-4 w-4"/></button></div></div>
                       <div className="grid grid-cols-7 gap-1 text-center">{['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>)}{renderBookingCalendar()}</div>
                       <div><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Available Slots</span><span className="text-xs text-slate-400">{appointmentDate}</span></div>{bookingSlots.isOff ? <div className="p-3 bg-red-50 text-red-600 text-xs rounded text-center">Doctor is OFF on this day</div> : bookingSlots.slots.length === 0 ? <div className="p-3 bg-slate-100 text-slate-500 text-xs rounded text-center">No slots available</div> : <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">{bookingSlots.slots.map(slot => (<button key={slot.time} type="button" disabled={slot.isBooked} onClick={() => setAppointmentTime(slot.time)} className={`px-1 py-1.5 text-xs rounded border ${slot.isBooked ? 'bg-slate-100 text-slate-400 line-through' : appointmentTime === slot.time ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-slate-200 hover:border-primary-400'}`}>{slot.time}</button>))}</div>}</div>
                   </div>
               )}
               <div className="pt-4 flex gap-3"><Button variant="secondary" type="button" className="flex-1" onClick={resetAddForm}>Cancel</Button><Button type="submit" className={`flex-1 ${isAppointment ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary-600'}`} disabled={newPatientPhone.length !== 10}>{isAppointment ? 'Confirm Booking' : 'Generate Token'}</Button></div>
            </form>
          </div>
        </div>
      )}
      
      {/* EDIT PATIENT MODAL */}
      {editingPatient && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Edit Patient Details</h3>
                      <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
                  </div>
                  <form onSubmit={handleEditPatientSubmit} className="space-y-4">
                      <Input label="Name" value={editingPatient.name} onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})} />
                      <Input label="Phone" value={editingPatient.phone} onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                           <Input label="Age" value={editingPatient.age || ''} onChange={(e) => setEditingPatient({...editingPatient, age: e.target.value})} />
                           <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={editingPatient.gender} onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value as any})}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                           </div>
                      </div>
                      <Input label="Symptoms" value={editingPatient.symptoms || ''} onChange={(e) => setEditingPatient({...editingPatient, symptoms: e.target.value})} />
                      <div className="flex gap-3 mt-6">
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingPatient(null)}>Cancel</Button>
                          <Button type="submit" className="flex-1">Save Changes</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};