
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, DaySchedule } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { 
  UserPlus, Clock, X, Settings, MessageCircle, 
  Save, Stethoscope, Plus, CalendarClock, User, Play, 
  CheckSquare, Activity, BarChart3, PieChart, Calendar as CalendarIcon, 
  Download, History, UserCheck, Users, Search, FileText, ChevronRight, Edit2, Trash2, List, Copy, Zap, ChevronLeft, CalendarDays, AlertTriangle, TrendingUp, IndianRupee, ArrowUpRight, ArrowUp, ArrowDown, UserMinus, RotateCcw
} from 'lucide-react';

interface ReceptionProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  onAddPatient: (name: string, phone: string, doctorId: string, date?: string, time?: string) => void;
  onEditPatient: (id: string, updates: Partial<Patient>) => void;
  onDeletePatient: (id: string) => void;
  onAddDoctor: (name: string, specialty: string, room: string, schedule: DaySchedule[]) => void;
  onEditDoctor: (id: string, updates: Partial<Doctor>) => void;
  onDeleteDoctor: (id: string) => void;
  onUpdateStatus: (patientId: string, status: PatientStatus) => void;
  onCancelPatient: (patientId: string) => void;
  onUpdateClinicName: (name: string) => void;
  onToggleEmergency: (patientId: string) => void;
  onManualReorder: (patientId: string, direction: 'UP' | 'DOWN') => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to get local date string YYYY-MM-DD
const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const ReceptionDashboard: React.FC<ReceptionProps> = ({ 
  doctors, 
  patients, 
  clinicName,
  onAddPatient, 
  onEditPatient,
  onDeletePatient,
  onAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onUpdateStatus,
  onCancelPatient,
  onUpdateClinicName,
  onToggleEmergency,
  onManualReorder,
  addToast
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DATABASE' | 'DOCTORS'>('QUEUE');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null); // Phone number of patient to show history for
  
  // -- Edit Patient Modal State --
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // -- Doctor Modal State (Add/Edit) --
  const [doctorModal, setDoctorModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; doctorId?: string }>({ isOpen: false, mode: 'ADD' });
  
  // -- Doctor View Mode (List vs Calendar) --
  const [doctorViewMode, setDoctorViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  // Report State
  const [reportRange, setReportRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState(getLocalYYYYMMDD(new Date()));
  const [customEndDate, setCustomEndDate] = useState(getLocalYYYYMMDD(new Date()));
  
  // Add Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id || '');
  const [isAppointment, setIsAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(getLocalYYYYMMDD(new Date()));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookingMonth, setBookingMonth] = useState(new Date()); // For admin calendar navigation
  
  // Settings State
  const [tempClinicName, setTempClinicName] = useState(clinicName);

  // Doctor Form State
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
  
  // Filter State
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

      // Empty slots for days before start of month
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border border-slate-100"></div>);
      }

      // Actual days
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dateObj = new Date(year, month, day);
          const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          
          // 1. Count active doctors for THIS specific day of week based on their schedule
          const activeDocs = doctors.filter(d => {
             const scheduleForDay = d.weeklySchedule.find(s => s.day === dayOfWeekName);
             return scheduleForDay && !scheduleForDay.isOff;
          });

          // 2. Count Appointments Booked for THIS specific Date
          const dayAppointments = patients.filter(p => 
              p.visitType === 'APPOINTMENT' && 
              p.appointmentDate === dateStr &&
              p.status !== PatientStatus.CANCELLED
          );

          // 3. Determine Visual Status
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
                  
                  {/* Status Indicators */}
                  <div className="space-y-1.5 mt-2">
                     {isClosed ? (
                         <div className="flex items-center justify-center h-12">
                             <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded">Closed</span>
                         </div>
                     ) : (
                         <>
                            {/* Doctor Availability */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/60 p-1 rounded backdrop-blur-sm border border-slate-100/50">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span className="font-medium">{activeDocs.length}</span>
                                <span className="text-[10px] text-slate-400">Doctors</span>
                            </div>

                            {/* Booked Appointments */}
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

                  {/* Hover Add Button */}
                  {!isClosed && (
                      <button 
                        onClick={() => {
                            setAppointmentDate(dateStr);
                            setIsAppointment(true);
                            setShowAddModal(true);
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

  // ------------------------------------------------------------
  // ADMIN BOOKING CALENDAR & SLOT LOGIC
  // ------------------------------------------------------------
  
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
      
      // Get existing bookings
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


  // ------------------------------------------------------------
  // PATIENT DATABASE LOGIC
  // ------------------------------------------------------------
  const uniquePatients = useMemo(() => {
    const map = new Map<string, { name: string, phone: string, lastVisit: number, totalVisits: number, visits: Patient[] }>();
    
    // Sort patients by date descending to get latest name/visit first
    const sortedHistory = [...patients].sort((a, b) => b.timeAdded - a.timeAdded);

    sortedHistory.forEach(p => {
        if (!map.has(p.phone)) {
            map.set(p.phone, {
                name: p.name,
                phone: p.phone,
                lastVisit: p.timeAdded,
                totalVisits: 0,
                visits: []
            });
        }
        const entry = map.get(p.phone)!;
        entry.totalVisits += 1;
        entry.visits.push(p);
    });
    return Array.from(map.values());
  }, [patients]);

  const filteredDatabase = uniquePatients.filter(p => 
      p.name.toLowerCase().includes(databaseSearch.toLowerCase()) || 
      p.phone.includes(databaseSearch)
  );

  const selectedPatientHistory = showHistoryModal ? uniquePatients.find(p => p.phone === showHistoryModal) : null;

  // ------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatientName && newPatientPhone && selectedDoctor) {
      // DUPLICATE NAME CHECK
      const isDuplicate = patients.some(p => 
        p.name.trim().toLowerCase() === newPatientName.trim().toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
      );

      if (isDuplicate) {
        addToast("A patient with this exact name is already active. Please add an initial.", "error");
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
          isAppointment ? appointmentTime : undefined
      );
      
      setNewPatientName('');
      setNewPatientPhone('');
      setIsAppointment(false);
      setAppointmentTime('');
      setShowAddModal(false);
    }
  };

  const handleEditPatientSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPatient) {
          onEditPatient(editingPatient.id, { name: editingPatient.name, phone: editingPatient.phone });
          setEditingPatient(null);
      }
  };

  const handleDeletePatientClick = (patient: Patient) => {
      if (window.confirm(`Are you sure you want to delete patient ${patient.name}? This cannot be undone.`)) {
          onDeletePatient(patient.id);
      }
  };

  const handleStartVisit = (patient: Patient) => {
      // Validation: Check if doctor already has a patient in consultation
      const activePatient = patients.find(p => p.doctorId === patient.doctorId && p.status === PatientStatus.WITH_DOCTOR);
      
      if (activePatient) {
          const docName = doctors.find(d => d.id === patient.doctorId)?.name || 'The doctor';
          addToast(`${docName} is currently seeing ${activePatient.name}. Complete that visit first.`, 'error');
          return;
      }
      
      onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR);
  };

  const handleQuickBook = (name: string, phone: string) => {
      setNewPatientName(name);
      setNewPatientPhone(phone);
      setShowAddModal(true);
  };

  const openDoctorModal = (mode: 'ADD' | 'EDIT', doctor?: Doctor) => {
      if (mode === 'EDIT' && doctor) {
          setDocForm({
              name: doctor.name,
              specialty: doctor.specialty,
              room: doctor.roomNumber,
              schedule: JSON.parse(JSON.stringify(doctor.weeklySchedule)) // Deep copy
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

  const filteredPatients = patients
    .filter(p => 
        p.status !== PatientStatus.COMPLETED && 
        p.status !== PatientStatus.CANCELLED &&
        (filterDoc === 'all' || p.doctorId === filterDoc)
    )
    .sort((a, b) => {
        // Simple sort for display: With Doctor First, then by timeAdded (if not reordered manually logic is in App.tsx)
        // Actually, we should rely on App.tsx order which handles manual reorder timestamps
        if (a.status === PatientStatus.WITH_DOCTOR) return -1;
        if (b.status === PatientStatus.WITH_DOCTOR) return 1;
        return a.timeAdded - b.timeAdded;
    });

  // ------------------------------------------------------------
  // REPORTING LOGIC
  // ------------------------------------------------------------
  
  const getFilteredReportData = () => {
    const now = new Date();
    // Start of today (00:00:00)
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
        endTime = new Date(ey, em - 1, ed, 23, 59, 59).getTime(); // End of the day
    }
    
    return patients.filter(p => p.timeAdded >= startTime && p.timeAdded <= endTime).sort((a, b) => b.timeAdded - a.timeAdded);
  };

  // Helper to identify if a patient is returning or new
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
  const cancelledVisits = reportPatients.filter(p => p.status === PatientStatus.CANCELLED).length;
  const returningCount = reportPatients.filter(p => getPatientType(p) === 'Returning').length;
  const newPatientsCount = totalVisits - returningCount;

  // -- Owner Insights --
  // 1. Peak Hours Calculation
  const peakHours = useMemo(() => {
      const hours = new Array(24).fill(0);
      reportPatients.forEach(p => {
          const h = new Date(p.timeAdded).getHours();
          hours[h]++;
      });
      // Filter for standard operating hours (8 AM - 8 PM) to keep chart clean
      return hours.map((count, hour) => ({ hour, count })).filter(d => d.hour >= 8 && d.hour <= 20);
  }, [reportPatients]);

  // 2. Avg Turnaround Time (Total Time spent in clinic: Added -> Completed)
  // Note: Since we only have timeAdded and timeCompleted, this acts as "Door-to-Door" time
  const avgTurnaroundTime = useMemo(() => {
      const completed = reportPatients.filter(p => p.status === PatientStatus.COMPLETED && p.timeCompleted);
      if (completed.length === 0) return 0;
      
      const totalMinutes = completed.reduce((acc, p) => {
          const duration = (p.timeCompleted! - p.timeAdded) / (1000 * 60);
          return acc + duration;
      }, 0);
      
      return Math.round(totalMinutes / completed.length);
  }, [reportPatients]);

  // 3. Estimated Revenue (Mock: ₹500 per visit)
  const estimatedRevenue = completedVisits * 500;


  // ------------------------------------------------------------
  // SMART QUEUE HELPERS (Visual only)
  // ------------------------------------------------------------
  const isLateAppointment = (patient: Patient) => {
      if (patient.visitType !== 'APPOINTMENT' || !patient.appointmentTime) return false;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [h, m] = patient.appointmentTime.split(':').map(Number);
      const apptMins = h * 60 + m;
      return currentMins > apptMins + 15;
  };

  const isDueAppointment = (patient: Patient) => {
      if (patient.visitType !== 'APPOINTMENT' || !patient.appointmentTime) return false;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [h, m] = patient.appointmentTime.split(':').map(Number);
      const apptMins = h * 60 + m;
      return apptMins <= currentMins && currentMins <= apptMins + 15;
  };

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
            <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="h-5 w-5 mr-2" />
                New Patient
            </Button>
        </div>
      </div>

      {/* Stats Cards (Live) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div>
            <p className="text-sm font-medium text-slate-500">Waiting</p>
            <p className="text-3xl font-bold text-blue-700">{patients.filter(p => p.status === PatientStatus.WAITING).length}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
        </Card>
        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-green-50 to-white border-green-100">
          <div>
            <p className="text-sm font-medium text-slate-500">In Consultation</p>
            <p className="text-3xl font-bold text-green-700">{patients.filter(p => p.status === PatientStatus.WITH_DOCTOR).length}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <Activity className="h-6 w-6" />
          </div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Doctors Active</p>
            <p className="text-3xl font-bold text-slate-900">{doctors.filter(d => d.isAvailable).length}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <User className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'QUEUE' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('QUEUE')}
            >
                <Activity className="h-4 w-4" /> Live Queue
            </button>
            <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DATABASE' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('DATABASE')}
            >
                <Users className="h-4 w-4" /> Patient Database
            </button>
            <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DOCTORS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('DOCTORS')}
            >
                <Stethoscope className="h-4 w-4" /> Doctors & Schedules
            </button>
        </div>

        {/* -------------------- LIVE QUEUE VIEW -------------------- */}
        {activeTab === 'QUEUE' && (
            <>
                <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Live Queue</h2>
                <div className="flex gap-2">
                    <select 
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filterDoc}
                    onChange={(e) => setFilterDoc(e.target.value)}
                    >
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
                        <th className="px-6 py-4 font-semibold text-slate-700">Patient Name</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Doctor</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                        <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No patients in the waiting queue.
                        </td>
                        </tr>
                    ) : (
                        filteredPatients.map((patient) => {
                            const isLate = isLateAppointment(patient);
                            const isDue = isDueAppointment(patient);
                            const isSkipped = patient.status === PatientStatus.SKIPPED;
                            
                            return (
                        <tr key={patient.id} className={`hover:bg-slate-50 transition-colors group ${isSkipped ? 'bg-slate-50 opacity-60' : ''}`}>
                             <td className="px-6 py-4">
                                {patient.status === PatientStatus.WAITING && (
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onManualReorder(patient.id, 'UP')} className="p-1 hover:bg-slate-200 rounded"><ArrowUp className="h-3 w-3" /></button>
                                        <button onClick={() => onManualReorder(patient.id, 'DOWN')} className="p-1 hover:bg-slate-200 rounded"><ArrowDown className="h-3 w-3" /></button>
                                    </div>
                                )}
                             </td>
                            <td className="px-6 py-4 font-bold text-primary-700">
                                #{patient.tokenNumber}
                                {patient.isEmergency && <Zap className="h-4 w-4 text-orange-500 inline ml-1 fill-current" />}
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                {patient.name}
                                {patient.isEmergency && <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded">URGENT</span>}
                            </div>
                            <div className="text-xs text-slate-500">{patient.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                            {doctors.find(d => d.id === patient.doctorId)?.name}
                            </td>
                            <td className="px-6 py-4">
                            {patient.visitType === 'APPOINTMENT' ? (
                                <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                                        <CalendarClock className="h-3 w-3" />
                                        {patient.appointmentTime} Appt
                                    </span>
                                    {isLate && <span className="text-[10px] text-red-600 font-bold">LATE (Wait)</span>}
                                    {isDue && <span className="text-[10px] text-green-600 font-bold">ON TIME</span>}
                                </div>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                    <User className="h-3 w-3" />
                                    Walk-in
                                </span>
                            )}
                            </td>
                            <td className="px-6 py-4">
                                {isSkipped ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                                        Absent (Skipped)
                                    </span>
                                ) : (
                                    <Badge status={patient.status} />
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                
                                {isSkipped ? (
                                    <button
                                        onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Re-queue (Add to bottom)"
                                    >
                                        <RotateCcw className="h-5 w-5" />
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => onToggleEmergency(patient.id)}
                                            className={`p-2 rounded-lg transition-colors ${patient.isEmergency ? 'text-orange-600 bg-orange-100' : 'text-slate-400 hover:bg-slate-100'}`}
                                            title={patient.isEmergency ? "Remove Emergency Status" : "Mark as Emergency (Fast Track)"}
                                        >
                                            <Zap className={`h-5 w-5 ${patient.isEmergency ? 'fill-current' : ''}`} />
                                        </button>

                                        <button 
                                            onClick={() => setEditingPatient(patient)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg"
                                            title="Edit Details"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>

                                        <button 
                                            onClick={() => sendWhatsApp(patient)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                            title="Send WhatsApp Reminder"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </button>
                                        
                                        {/* Start Visit - Shows when Waiting */}
                                        {patient.status === PatientStatus.WAITING && (
                                            <>
                                                <button 
                                                    onClick={() => handleStartVisit(patient)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Send Patient In (Start Visit)"
                                                >
                                                    <Play className="h-5 w-5" />
                                                </button>
                                                
                                                <button
                                                    onClick={() => onUpdateStatus(patient.id, PatientStatus.SKIPPED)}
                                                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg"
                                                    title="Mark Absent (Skip)"
                                                >
                                                    <UserMinus className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Complete Visit - Shows when With Doctor (Reception can complete if doc is busy) */}
                                        {patient.status === PatientStatus.WITH_DOCTOR && (
                                            <button 
                                                onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                title="Mark Completed"
                                            >
                                                <CheckSquare className="h-5 w-5" />
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => onCancelPatient(patient.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Cancel"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <button 
                                            onClick={() => handleDeletePatientClick(patient)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Record"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
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

        {/* -------------------- PATIENT DATABASE VIEW -------------------- */}
        {activeTab === 'DATABASE' && (
            <div className="animate-in fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search by Name or Phone Number..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={databaseSearch}
                            onChange={(e) => setDatabaseSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Patient</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Phone</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Last Visit</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Total Visits</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDatabase.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No patients found in database.
                                    </td>
                                </tr>
                            ) : (
                                filteredDatabase.map((patient) => (
                                    <tr key={patient.phone} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900">{patient.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{patient.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(patient.lastVisit).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">
                                                {patient.totalVisits} visits
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setShowHistoryModal(patient.phone)}>
                                                    <History className="h-4 w-4 mr-1" /> History
                                                </Button>
                                                <Button size="sm" onClick={() => handleQuickBook(patient.name, patient.phone)}>
                                                    Book Again
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* -------------------- DOCTORS VIEW -------------------- */}
        {activeTab === 'DOCTORS' && (
             <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-900">Medical Staff & Schedules</h2>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setDoctorViewMode('LIST')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${doctorViewMode === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List className="h-3 w-3" /> List
                            </button>
                            <button 
                                onClick={() => setDoctorViewMode('CALENDAR')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${doctorViewMode === 'CALENDAR' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <CalendarIcon className="h-3 w-3" /> Calendar
                            </button>
                        </div>
                    </div>
                    <Button onClick={() => openDoctorModal('ADD')}>
                        <Plus className="h-4 w-4 mr-2" /> Add New Doctor
                    </Button>
                </div>
                
                {doctorViewMode === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(d => {
                            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                            const todaySchedule = d.weeklySchedule.find(s => s.day === today);
                            return (
                            <Card key={d.id} className="p-5 flex flex-col gap-4 group relative">
                                {/* Doctor Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openDoctorModal('EDIT', d)} className="p-1.5 bg-white border border-slate-200 rounded-md hover:text-primary-600 hover:border-primary-500 shadow-sm">
                                        <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => handleDeleteDoctorClick(d)} className="p-1.5 bg-white border border-slate-200 rounded-md hover:text-red-600 hover:border-red-500 shadow-sm">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={d.avatarUrl} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                                        <div>
                                            <h3 className="font-bold text-slate-900">{d.name}</h3>
                                            <p className="text-sm text-slate-500">{d.specialty}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${d.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {d.isAvailable ? 'Active' : 'Offline'}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2 bg-slate-50 p-3 rounded-lg">
                                    <div>
                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Room</span>
                                        <span className="font-medium">{d.roomNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Today ({today.substring(0,3)})</span>
                                        {todaySchedule?.isOff ? (
                                            <span className="font-medium text-slate-400">Off Duty</span>
                                        ) : (
                                            <span className="font-medium text-blue-600">{todaySchedule?.startTime} - {todaySchedule?.endTime}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${d.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : d.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                        {d.status === DoctorStatus.AVAILABLE ? 'Available' : d.status === DoctorStatus.ON_BREAK ? 'On Break' : 'Off Duty'}
                                    </div>
                                    {d.delayMinutes > 0 && (
                                        <span className="text-red-600 font-bold flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> +{d.delayMinutes}m delay
                                        </span>
                                    )}
                                </div>
                            </Card>
                        )})}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                                 <CalendarDays className="h-5 w-5 text-primary-600" />
                                 <h3 className="font-bold text-lg">{calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-4 w-4"/></button>
                                 <Button size="sm" variant="secondary" onClick={() => setCalDate(new Date())}>Today</Button>
                                 <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-4 w-4"/></button>
                             </div>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-500 uppercase">
                                    {d}
                                </div>
                            ))}
                            {renderCalendarDays()}
                        </div>
                        <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-end">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-200 rounded-full"></span> Low Load</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-200 rounded-full"></span> Moderate</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-200 rounded-full"></span> High Load</div>
                        </div>
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Reports Modal */}
      {showReportsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-6xl p-8 animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">Clinic Analytics</h3>
                        <p className="text-slate-500">Business Intelligence & Patient Logs</p>
                    </div>
                    <button onClick={() => setShowReportsModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2">
                        {['TODAY', 'WEEK', 'MONTH'].map((range) => (
                            <button 
                                key={range}
                                onClick={() => setReportRange(range as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${reportRange === range ? 'bg-white text-primary-700 shadow ring-1 ring-primary-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {range === 'TODAY' ? 'Today' : range === 'WEEK' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                        <button 
                             onClick={() => setReportRange('CUSTOM')}
                             className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${reportRange === 'CUSTOM' ? 'bg-white text-primary-700 shadow ring-1 ring-primary-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <CalendarDays className="h-4 w-4" /> Custom
                        </button>
                    </div>

                    {reportRange === 'CUSTOM' && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                             <input 
                                type="date" 
                                value={customStartDate} 
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="text-sm outline-none text-slate-600" 
                             />
                             <span className="text-slate-400">-</span>
                             <input 
                                type="date" 
                                value={customEndDate} 
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="text-sm outline-none text-slate-600" 
                             />
                        </div>
                    )}

                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                </div>

                {/* KEY BUSINESS METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                     {/* Revenue Card */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <IndianRupee className="h-16 w-16 text-green-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Est. Revenue</div>
                         <div className="text-3xl font-black text-slate-900 flex items-baseline">
                             ₹{estimatedRevenue.toLocaleString()}
                             <span className="text-xs font-normal text-slate-400 ml-2">@ ₹500/visit</span>
                         </div>
                         <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
                             <TrendingUp className="h-3 w-3 mr-1" /> Based on {completedVisits} visits
                         </div>
                     </div>

                     {/* Total Visits Card */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Users className="h-16 w-16 text-blue-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Patients</div>
                         <div className="text-3xl font-black text-slate-900">{totalVisits}</div>
                         <div className="mt-2 flex gap-2">
                             <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{returningCount} Returning</span>
                             <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded font-medium">{newPatientsCount} New</span>
                         </div>
                     </div>

                     {/* Efficiency Card */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Clock className="h-16 w-16 text-purple-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Avg Turnaround</div>
                         <div className="text-3xl font-black text-slate-900 flex items-baseline">
                             {avgTurnaroundTime}
                             <span className="text-sm font-normal text-slate-400 ml-1">mins</span>
                         </div>
                         <p className="mt-2 text-xs text-slate-400">Door-to-Door time per patient</p>
                     </div>

                     {/* Cancellation Card */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <AlertTriangle className="h-16 w-16 text-red-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Cancellations</div>
                         <div className="text-3xl font-black text-slate-900">{cancelledVisits}</div>
                         <div className="mt-2 text-xs text-red-600 font-medium">
                             {totalVisits > 0 ? ((cancelledVisits / totalVisits) * 100).toFixed(1) : 0}% Rate
                         </div>
                     </div>
                </div>

                {/* CHARTS & GRAPHS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Peak Hours Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
                        <h4 className="font-bold text-slate-800 mb-6 flex items-center">
                            <Activity className="h-5 w-5 mr-2 text-primary-500" />
                            Peak Hours Heatmap
                        </h4>
                        <div className="h-48 flex items-end justify-between gap-2">
                             {peakHours.length > 0 ? peakHours.map(data => (
                                 <div key={data.hour} className="flex-1 flex flex-col items-center group relative">
                                     <div 
                                        className="w-full bg-blue-100 rounded-t-md hover:bg-blue-300 transition-all relative"
                                        style={{ height: `${(data.count / Math.max(...peakHours.map(p => p.count))) * 100}%` }}
                                     >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                            {data.count} visits
                                        </div>
                                     </div>
                                     <span className="text-[10px] text-slate-400 mt-2 font-medium">
                                         {data.hour > 12 ? `${data.hour-12}PM` : `${data.hour}AM`}
                                     </span>
                                 </div>
                             )) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                     Not enough data for peak analysis.
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Doctor Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h4 className="font-bold text-slate-800 mb-6 flex items-center">
                            <PieChart className="h-5 w-5 mr-2 text-purple-500" />
                            Visits by Doctor
                        </h4>
                        <div className="space-y-5">
                            {doctors.map(d => {
                                const count = reportPatients.filter(p => p.doctorId === d.id).length;
                                const percent = totalVisits > 0 ? (count / totalVisits) * 100 : 0;
                                return (
                                    <div key={d.id}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="font-medium text-slate-700">{d.name}</span>
                                            <span className="text-slate-900 font-bold">{count}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${percent}%`}}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* DETAILED LOG */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                         <h4 className="font-bold text-slate-700">Detailed Patient Log</h4>
                         <span className="text-xs text-slate-500">{reportPatients.length} records found</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date/Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {reportPatients.length > 0 ? (
                                    reportPatients.map(p => {
                                        const patientType = getPatientType(p);
                                        return (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                <div className="font-medium text-slate-900">{new Date(p.timeAdded).toLocaleDateString()}</div>
                                                <div className="text-[10px]">{new Date(p.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                {p.name}
                                                <div className="text-xs text-slate-400">{p.phone}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${patientType === 'Returning' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {patientType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {doctors.find(d => d.id === p.doctorId)?.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge status={p.status} />
                                            </td>
                                        </tr>
                                    )})
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400 italic">
                                            No records found for the selected date range.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
          </div>
      )}

      {/* Patient History Modal */}
      {showHistoryModal && selectedPatientHistory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                             <User className="h-6 w-6 text-primary-500" />
                             {selectedPatientHistory.name}
                        </h3>
                        <p className="text-slate-500 flex items-center gap-1 mt-1">
                            <span className="font-mono">{selectedPatientHistory.phone}</span>
                            <span className="mx-2">•</span>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{selectedPatientHistory.totalVisits} total visits</span>
                        </p>
                    </div>
                    <button onClick={() => setShowHistoryModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {selectedPatientHistory.visits.sort((a,b) => b.timeAdded - a.timeAdded).map((visit, idx) => (
                        <div key={visit.id} className="border border-slate-200 rounded-xl p-4 relative hover:border-primary-200 transition-colors bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        {new Date(visit.timeAdded).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Latest</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <Badge status={visit.status} />
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3 bg-slate-50 p-2 rounded-lg">
                                <div className="bg-white p-1.5 rounded-full shadow-sm">
                                    <Stethoscope className="h-4 w-4 text-primary-600" />
                                </div>
                                <div className="text-sm">
                                    <span className="text-slate-500">Doctor: </span>
                                    <span className="font-medium text-slate-900">{doctors.find(d => d.id === visit.doctorId)?.name}</span>
                                </div>
                            </div>

                            {visit.notes ? (
                                <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-slate-700">
                                    <div className="flex items-center gap-1 text-yellow-700 font-bold text-xs mb-1 uppercase tracking-wide">
                                        <FileText className="h-3 w-3" /> Consultation Notes
                                    </div>
                                    {visit.notes}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic">No notes recorded for this visit.</div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <Button onClick={() => { 
                        handleQuickBook(selectedPatientHistory.name, selectedPatientHistory.phone);
                        setShowHistoryModal(null);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Book New Appointment
                    </Button>
                </div>
            </Card>
          </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className={`w-full ${isAppointment ? 'max-w-2xl' : 'max-w-md'} p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                  {isAppointment ? 'Book Appointment' : 'Add Walk-in Patient'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
                 <button 
                    onClick={() => setIsAppointment(false)} 
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${!isAppointment ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200 text-slate-500'}`}
                 >
                     Walk-in
                 </button>
                 <button 
                    onClick={() => setIsAppointment(true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${isAppointment ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200 text-slate-500'}`}
                 >
                     Appointment
                 </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Patient Name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                  <Input 
                    label="Phone Number"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="10 digit number"
                    required
                  />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                <select 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedDoctor}
                  onChange={(e) => { setSelectedDoctor(e.target.value); setAppointmentTime(''); }}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {isAppointment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-100">
                      {/* Left: Calendar */}
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-800 text-sm">{bookingMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => setBookingMonth(new Date(bookingMonth.getFullYear(), bookingMonth.getMonth() - 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="h-4 w-4" /></button>
                                        <button type="button" onClick={() => setBookingMonth(new Date(bookingMonth.getFullYear(), bookingMonth.getMonth() + 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronRight className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {renderBookingCalendar()}
                                </div>
                          </div>
                      </div>

                      {/* Right: Slots */}
                      <div>
                          <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-slate-700">Available Slots</label>
                                {bookingSlots.workingHours && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{bookingSlots.workingHours}</span>}
                          </div>
                          
                          {bookingSlots.isOff ? (
                              <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                                  <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
                                  <p className="text-sm">Doctor is Off Duty</p>
                              </div>
                          ) : (
                              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                                  {bookingSlots.slots.length > 0 ? bookingSlots.slots.map((slot) => (
                                      <button
                                          key={slot.time}
                                          type="button"
                                          disabled={slot.isBooked}
                                          onClick={() => setAppointmentTime(slot.time)}
                                          className={`px-2 py-2 text-xs font-medium rounded border transition-all
                                              ${slot.isBooked 
                                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-60' 
                                                  : appointmentTime === slot.time 
                                                      ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                                                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                              }
                                          `}
                                      >
                                          {slot.time}
                                      </button>
                                  )) : (
                                      <div className="col-span-3 text-center py-8 text-slate-400 text-sm">
                                          Select a date to view slots.
                                      </div>
                                  )}
                              </div>
                          )}
                          
                          {appointmentTime && (
                              <div className="mt-4 p-3 bg-purple-50 text-purple-700 rounded-lg text-sm text-center">
                                  Booking for <strong>{appointmentDate}</strong> at <strong>{appointmentTime}</strong>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isAppointment && !appointmentTime}>
                  {isAppointment ? 'Confirm Appointment' : 'Add to Queue'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Edit Patient Details</h3>
                      <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-6 w-6" />
                      </button>
                  </div>
                  <form onSubmit={handleEditPatientSubmit} className="space-y-4">
                      <Input 
                          label="Full Name"
                          value={editingPatient.name}
                          onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})}
                          required
                      />
                      <Input 
                          label="Phone Number"
                          value={editingPatient.phone}
                          onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})}
                          required
                      />
                      <div className="flex justify-end gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setEditingPatient(null)} type="button">Cancel</Button>
                          <Button type="submit">Save Changes</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

      {/* Doctor Add/Edit Modal */}
      {doctorModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">
                        {doctorModal.mode === 'ADD' ? 'Add New Doctor' : 'Edit Doctor Schedule'}
                    </h3>
                    <button onClick={() => setDoctorModal({ ...doctorModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleDoctorSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input 
                            label="Doctor Name" 
                            placeholder="e.g. Dr. Smith"
                            value={docForm.name}
                            onChange={(e) => setDocForm({...docForm, name: e.target.value})}
                            required
                        />
                        <Input 
                            label="Specialty" 
                            placeholder="e.g. Cardiologist"
                            value={docForm.specialty}
                            onChange={(e) => setDocForm({...docForm, specialty: e.target.value})}
                            required
                        />
                        <Input 
                            label="Room Number" 
                            placeholder="e.g. 101"
                            value={docForm.room}
                            onChange={(e) => setDocForm({...docForm, room: e.target.value})}
                            required
                        />
                    </div>

                    {/* Weekly Schedule Grid */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-700">Weekly Schedule</h4>
                            <button 
                                type="button" 
                                onClick={copyMondayToAll}
                                className="text-xs text-primary-600 font-medium hover:underline flex items-center"
                            >
                                <Copy className="h-3 w-3 mr-1" /> Copy Monday to All
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {docForm.schedule.map((day, idx) => (
                                <div key={day.day} className={`flex items-center gap-3 p-2 rounded-lg ${day.isOff ? 'bg-slate-100 opacity-60' : 'bg-white shadow-sm'}`}>
                                    <div className="w-24 font-medium text-sm text-slate-700">{day.day}</div>
                                    
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={!day.isOff}
                                            onChange={(e) => updateScheduleDay(idx, 'isOff', !e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 relative"></div>
                                        <span className="ml-2 text-xs font-medium text-slate-500">{day.isOff ? 'OFF' : 'ON'}</span>
                                    </label>

                                    {!day.isOff && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input 
                                                type="time" 
                                                className="border border-slate-300 rounded px-2 py-1 text-sm w-24"
                                                value={day.startTime}
                                                onChange={(e) => updateScheduleDay(idx, 'startTime', e.target.value)}
                                            />
                                            <span className="text-slate-400">-</span>
                                            <input 
                                                type="time" 
                                                className="border border-slate-300 rounded px-2 py-1 text-sm w-24"
                                                value={day.endTime}
                                                onChange={(e) => updateScheduleDay(idx, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setDoctorModal({ ...doctorModal, isOpen: false })} type="button">
                            Cancel
                        </Button>
                        <Button type="submit">
                            {doctorModal.mode === 'ADD' ? 'Create Staff Profile' : 'Update Schedule'}
                        </Button>
                    </div>
                </form>
            </Card>
          </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Clinic Settings</h3>
            
            <div className="space-y-4">
              <Input 
                label="Clinic Name" 
                value={tempClinicName} 
                onChange={(e) => setTempClinicName(e.target.value)}
              />
              
              <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subscription</p>
                  <div className="bg-primary-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                          <p className="font-bold text-primary-800">Small Hospital Plan</p>
                          <p className="text-xs text-primary-600">Active until Dec 2024</p>
                      </div>
                      <Button size="sm" variant="secondary">Manage</Button>
                  </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
