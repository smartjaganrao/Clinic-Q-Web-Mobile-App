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
  Download, History, UserCheck, Users, Search, FileText, ChevronRight, Edit2, Trash2, List, Copy
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
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  const [reportRange, setReportRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  
  // Add Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id || '');
  const [isAppointment, setIsAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('');
  
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
  // CALENDAR LOGIC
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
          days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100"></div>);
      }

      // Actual days
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dayOfWeekName = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long' });
          
          // Count active doctors for THIS specific day of week
          const activeDocs = doctors.filter(d => {
             const scheduleForDay = d.weeklySchedule.find(s => s.day === dayOfWeekName);
             return scheduleForDay && !scheduleForDay.isOff;
          }).length;

          days.push(
              <div key={day} className={`h-24 border border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-white'}`}>
                  <span className={`text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700'}`}>
                      {day}
                  </span>
                  
                  {/* Mock Shifts Indicator */}
                  <div className="mt-2 space-y-1">
                     <div className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate">
                         {activeDocs} Drs On Duty
                     </div>
                  </div>
              </div>
          );
      }
      return days;
  };

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

  const filteredPatients = patients.filter(p => 
    p.status !== PatientStatus.COMPLETED && 
    p.status !== PatientStatus.CANCELLED &&
    (filterDoc === 'all' || p.doctorId === filterDoc)
  );

  // ------------------------------------------------------------
  // REPORTING LOGIC
  // ------------------------------------------------------------
  
  const getFilteredReportData = () => {
    const now = new Date();
    // Start of today (00:00:00)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let startTime = todayStart;
    
    if (reportRange === 'WEEK') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startTime = weekStart.getTime();
    }
    
    if (reportRange === 'MONTH') {
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        startTime = monthStart.getTime();
    }
    
    return patients.filter(p => p.timeAdded >= startTime).sort((a, b) => b.timeAdded - a.timeAdded);
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
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            No patients in the waiting queue.
                        </td>
                        </tr>
                    ) : (
                        filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-primary-700">#{patient.tokenNumber}</td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{patient.name}</div>
                            <div className="text-xs text-slate-500">{patient.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                            {doctors.find(d => d.id === patient.doctorId)?.name}
                            </td>
                            <td className="px-6 py-4">
                            {patient.visitType === 'APPOINTMENT' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    <CalendarClock className="h-3 w-3" />
                                    {patient.appointmentTime} Appt
                                    {patient.appointmentDate && patient.appointmentDate !== new Date().toISOString().split('T')[0] && (
                                        <span className="ml-1 text-[10px] text-purple-600 border-l border-purple-300 pl-1">
                                            {new Date(patient.appointmentDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                    <User className="h-3 w-3" />
                                    Walk-in
                                </span>
                            )}
                            </td>
                            <td className="px-6 py-4">
                            <Badge status={patient.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
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
                                    <button 
                                        onClick={() => handleStartVisit(patient)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Send Patient In (Start Visit)"
                                    >
                                        <Play className="h-5 w-5" />
                                    </button>
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
                            </div>
                            </td>
                        </tr>
                        ))
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
                             <h3 className="font-bold text-lg">{calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                             <div className="flex gap-2">
                                 <Button size="sm" variant="secondary" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}>Prev</Button>
                                 <Button size="sm" variant="secondary" onClick={() => setCalDate(new Date())}>Today</Button>
                                 <Button size="sm" variant="secondary" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}>Next</Button>
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
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Reports Modal */}
      {showReportsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-5xl p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">Clinic Reports</h3>
                        <p className="text-slate-500">Performance & Patient Logs</p>
                    </div>
                    <button onClick={() => setShowReportsModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Time Range Selector */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="bg-slate-100 p-1 rounded-lg flex">
                        <button 
                            onClick={() => setReportRange('TODAY')}
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${reportRange === 'TODAY' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Today
                        </button>
                        <button 
                            onClick={() => setReportRange('WEEK')}
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${reportRange === 'WEEK' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            This Week
                        </button>
                        <button 
                            onClick={() => setReportRange('MONTH')}
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${reportRange === 'MONTH' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            This Month
                        </button>
                    </div>
                    
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Visits</div>
                         <div className="text-3xl font-bold text-slate-900">{totalVisits}</div>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</div>
                         <div className="text-3xl font-bold text-green-600">{completedVisits}</div>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Returning Patients</div>
                        <div className="text-3xl font-bold text-blue-600">{returningCount}</div>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cancelled</div>
                         <div className="text-3xl font-bold text-red-500">{cancelledVisits}</div>
                     </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Doctor Breakdown */}
                    <div className="lg:col-span-1">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                            <PieChart className="h-5 w-5 mr-2 text-slate-400" />
                            Visits by Doctor
                        </h4>
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {doctors.map(d => {
                                const count = reportPatients.filter(p => p.doctorId === d.id).length;
                                const percent = totalVisits > 0 ? (count / totalVisits) * 100 : 0;
                                return (
                                    <div key={d.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{d.name}</span>
                                            <span className="text-slate-500 font-mono">{count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${percent}%`}}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Detailed Patient Log */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-2 text-slate-400" />
                            Patient Log ({reportRange})
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="max-h-[300px] overflow-y-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {reportPatients.length > 0 ? (
                                            reportPatients.map(p => {
                                                const patientType = getPatientType(p);
                                                return (
                                                <tr key={p.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                        {new Date(p.timeAdded).toLocaleDateString()} <br/>
                                                        {new Date(p.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                        {p.name}
                                                        <div className="text-xs text-slate-400">{p.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${patientType === 'Returning' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                            {patientType === 'Returning' ? <History className="h-3 w-3 mr-1"/> : <UserCheck className="h-3 w-3 mr-1"/>}
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
                                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    No records found for this selected period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">New Patient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Quick Switch for Walk-in vs Appointment */}
               <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                  <button type="button" onClick={() => setIsAppointment(false)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isAppointment ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Walk-In</button>
                  <button type="button" onClick={() => setIsAppointment(true)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isAppointment ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Appointment</button>
               </div>

              <Input 
                label="Full Name" 
                placeholder="e.g. Amit Sharma"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                required
              />
              <Input 
                label="Mobile Number" 
                placeholder="9876543210"
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                <select 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {isAppointment && (
                  <div className="grid grid-cols-2 gap-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <div>
                          <label className="text-xs font-bold text-purple-700 mb-1 block">Date</label>
                          <input 
                            type="date" 
                            className="w-full text-sm rounded border border-purple-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-purple-700 mb-1 block">Time</label>
                          <input 
                            type="time" 
                            className="w-full text-sm rounded border border-purple-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                          />
                      </div>
                  </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="w-full">{isAppointment ? 'Book Appointment' : 'Generate Token'}</Button>
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
                onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                required
              />
              <Input 
                label="Mobile Number" 
                value={editingPatient.phone}
                onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                required
              />
              <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-100">
                  Note: Editing details here will update this specific visit record.
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="w-full" onClick={() => setEditingPatient(null)}>Cancel</Button>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Doctor Modal (Add/Edit) with Weekly Schedule */}
      {doctorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{doctorModal.mode === 'ADD' ? 'Add New Doctor' : 'Edit Doctor Details'}</h3>
              <button onClick={() => setDoctorModal({ ...doctorModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleDoctorSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                         <Input 
                            label="Doctor Name"
                            placeholder="e.g. Dr. Singh" 
                            value={docForm.name} 
                            onChange={e => setDocForm({...docForm, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="col-span-1">
                        <Input 
                            label="Specialty"
                            placeholder="e.g. Ortho" 
                            value={docForm.specialty} 
                            onChange={e => setDocForm({...docForm, specialty: e.target.value})}
                            required
                        />
                    </div>
                    <div className="col-span-1">
                        <Input 
                            label="Room No"
                            placeholder="101" 
                            value={docForm.room} 
                            onChange={e => setDocForm({...docForm, room: e.target.value})}
                            required
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" /> Weekly Schedule
                        </h4>
                        <Button type="button" size="sm" variant="secondary" onClick={copyMondayToAll} title="Copy Monday's schedule to Mon-Sat">
                            <Copy className="h-3 w-3 mr-1" /> Copy Mon to All
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-slate-500 uppercase px-2">
                        <div className="col-span-3">Day</div>
                        <div className="col-span-2 text-center">Work?</div>
                        <div className="col-span-3">Start</div>
                        <div className="col-span-3">End</div>
                    </div>

                    <div className="space-y-2">
                        {docForm.schedule.map((daySch, idx) => (
                            <div key={daySch.day} className={`grid grid-cols-12 gap-2 items-center px-2 py-1 rounded transition-colors ${daySch.isOff ? 'opacity-60 bg-slate-100' : 'bg-white'}`}>
                                <div className="col-span-3 font-medium text-sm text-slate-700">{daySch.day}</div>
                                <div className="col-span-2 flex justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={!daySch.isOff} 
                                        onChange={(e) => updateScheduleDay(idx, 'isOff', !e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="time" 
                                        value={daySch.startTime} 
                                        onChange={(e) => updateScheduleDay(idx, 'startTime', e.target.value)}
                                        disabled={daySch.isOff}
                                        className="w-full text-sm p-1 border rounded disabled:bg-slate-100"
                                    />
                                </div>
                                <div className="col-span-1 text-center text-slate-400 text-xs">to</div>
                                <div className="col-span-3">
                                    <input 
                                        type="time" 
                                        value={daySch.endTime} 
                                        onChange={(e) => updateScheduleDay(idx, 'endTime', e.target.value)}
                                        disabled={daySch.isOff}
                                        className="w-full text-sm p-1 border rounded disabled:bg-slate-100"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setDoctorModal({ ...doctorModal, isOpen: false })}>Cancel</Button>
                    <Button type="submit" className="w-full">
                        {doctorModal.mode === 'ADD' ? <><Plus className="h-4 w-4 mr-2" /> Add Doctor</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Clinic Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">SaaS Plan</p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-900">Small Hospital Plan</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                  </div>
              </div>
              <Input 
                label="Clinic / Hospital Name" 
                placeholder="Enter Clinic Name"
                value={tempClinicName}
                onChange={(e) => setTempClinicName(e.target.value)}
              />
              
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};