
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, PainPoint, Clinic, SessionMode } from '../types';
import { Button } from '../components/Button';
import { 
    Clock12, Coffee, List, X, Building, PlayCircle, User, LogOut
} from 'lucide-react';
import { PatientQueueSidebar } from '../features/doctor/components/PatientQueueSidebar';
import { ConsultationWorkspace } from '../features/doctor/components/ConsultationWorkspace';
import { Logo } from '../components/Logo';
import { getActiveSession, getQueueSorter } from '../utils/time';
import { patientService } from '../services/patientService';
import { useRealtimeQueue } from '../hooks/useRealtimeQueue';
import { useDoctorStatusSync } from '../hooks/useDoctorStatusSync';

interface DoctorProps {
  doctor: Doctor;
  queue: Patient[];
  linkedClinics?: Clinic[];
  currentClinicId?: string;
  clinicName?: string;
  clinicCity?: string;
  onSwitchClinic?: (id: string) => void;
  onNextPatient: () => void;
  onCompletePatient: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: DoctorStatus, delay: number) => void;
  onUpdatePatientDetails: (id: string, updates: Partial<Patient>) => void;
  onHoldPatient: (id: string) => void;
  onResumePatient: (id: string) => void;
  onLogout?: () => void;
}

export const DoctorDashboard: React.FC<DoctorProps> = ({ 
    doctor, queue, linkedClinics, currentClinicId, clinicName, clinicCity, onSwitchClinic,
    onNextPatient, onCompletePatient, onUpdateStatus, onUpdatePatientDetails, onHoldPatient, onResumePatient, onLogout
}) => {
  // Real-time queue subscription for live updates
  const { patients: realtimeQueue, isConnected } = useRealtimeQueue(currentClinicId || '', queue);
  
  // Real-time doctor status synchronization
  const { status: realtimeStatus, delayMinutes: realtimeDelayMinutes, updateStatus } = useDoctorStatusSync(doctor.id, doctor.status);
  
  // Use real-time data if connected, fallback to props
  const activeQueue = isConnected ? realtimeQueue : queue;
  const doctorStatus = realtimeStatus;
  const doctorDelayMinutes = realtimeDelayMinutes;
  
  const [showMobileQueue, setShowMobileQueue] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  // SMART HYBRID QUEUE LOGIC
  const { currentPatient, sortedQueue, heldPatients, currentSessionMode } = useMemo(() => {
    const current = activeQueue.find(p => p.status === PatientStatus.WITH_DOCTOR);
    const waiting = activeQueue.filter(p => p.status === PatientStatus.WAITING);
    const held = activeQueue.filter(p => p.status === PatientStatus.ON_HOLD).sort((a, b) => a.timeAdded - b.timeAdded);
    
    // Determine active session mode
    const mockClinic = { timezone: 'Asia/Kolkata' } as Clinic;
    const activeSession = getActiveSession(doctor, mockClinic);
    const mode = activeSession?.mode || SessionMode.HYBRID;

    // Use standardized sorting for consistency
    const sorted = waiting.sort(patientService.standardQueueSort);

    return { 
        currentPatient: current, 
        sortedQueue: sorted,
        heldPatients: held,
        currentSessionMode: mode
    };
  }, [activeQueue, currentTime, doctor]);

  // Check for Delay Expiry
  useEffect(() => {
      if (doctorDelayMinutes > 0 && doctor.delayStartTime) {
          const elapsed = Date.now() - doctor.delayStartTime;
          const delayMs = doctorDelayMinutes * 60 * 1000;
          if (elapsed >= delayMs) {
              updateStatus(doctorStatus, 0);
              onUpdateStatus(doctor.id, doctorStatus, 0);
          }
      }
  }, [currentTime, doctorDelayMinutes, doctor.delayStartTime]);

  const handleConsultationComplete = (notes: string, prescriptions: any[], vitals: any, painPoints: PainPoint[]) => {
    if (currentPatient) {
      let finalNote = notes;
      if (prescriptions.length > 0) {
          finalNote += `\n\n--- PRESCRIPTION ---\n` + prescriptions.map(rx => `• ${rx.name} (${rx.dosage}) for ${rx.duration}`).join('\n');
      }
      onUpdatePatientDetails(currentPatient.id, { vitals, painPoints });
      onCompletePatient(currentPatient.id, finalNote);
    }
  };

  const toggleBreak = () => {
    const newStatus = doctorStatus === DoctorStatus.ON_BREAK ? DoctorStatus.AVAILABLE : DoctorStatus.ON_BREAK;
    updateStatus(newStatus, doctorDelayMinutes);
    onUpdateStatus(doctor.id, newStatus, doctorDelayMinutes);
  };

  const toggleDelay = () => {
      const newDelay = doctorDelayMinutes > 0 ? 0 : 15;
      updateStatus(doctorStatus, newDelay);
      onUpdateStatus(doctor.id, doctorStatus, newDelay);
  };

  const breakDuration = doctorStatus === DoctorStatus.ON_BREAK && doctor.statusUpdateTime 
      ? currentTime - doctor.statusUpdateTime 
      : 0;
  
  const delayRemaining = doctorDelayMinutes > 0 && doctor.delayStartTime
      ? (doctorDelayMinutes * 60 * 1000) - (currentTime - doctor.delayStartTime)
      : 0;

  // Check if doctor is technically "OFF SHIFT"
  const isOffShift = useMemo(() => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = new Date();
      const today = days[now.getDay()];
      const schedule = doctor.weeklySchedule.find(s => s.day === today);
      
      if (!schedule || schedule.isOff) return true;
      
      const currentMins = now.getHours() * 60 + now.getMinutes();
      return !schedule.slots.some(slot => {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          return currentMins >= (sh*60 + sm) && currentMins < (eh*60 + em);
      });
  }, [doctor, currentTime]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      
      {/* 1. STATUS & CONTROLS BAR (Updated with SaaS Integration) */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between flex-shrink-0 z-20 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 mr-4 border-r border-slate-100 pr-4">
                  <Logo className="h-8 w-8 shrink-0" />
                  <div className="hidden lg:block">
                      <h1 className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">Smart<span className="text-primary-600">QFlow</span></h1>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Medical Console</span>
                  </div>
              </div>

              <div className="relative">
                  <img src={doctor.avatarUrl} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-100 object-cover" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white rounded-full ${doctorStatus === DoctorStatus.AVAILABLE ? 'bg-green-500' : doctorStatus === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
              </div>
              <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-none flex items-center gap-2">
                      {doctor.name}
                      {isOffShift ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full uppercase font-bold border border-slate-200">Off Shift</span>
                      ) : (
                          <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold border ${currentSessionMode === SessionMode.APPOINTMENT ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : currentSessionMode === SessionMode.WALK_IN ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {currentSessionMode} Session
                          </span>
                      )}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">{doctor.specialty} • Room {doctor.roomNumber}</p>
                      {/* Clinic Switcher */}
                      {linkedClinics && linkedClinics.length > 1 && (
                          <div className="relative group ml-2">
                              <button className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-200">
                                  <Building className="h-3 w-3" /> Switch
                              </button>
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 p-1 w-48 hidden group-hover:block z-50">
                                  {linkedClinics.map(c => (
                                      <button 
                                          key={c.id}
                                          onClick={() => onSwitchClinic && onSwitchClinic(c.id)}
                                          disabled={c.id === currentClinicId}
                                          className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium ${c.id === currentClinicId ? 'bg-slate-100 text-slate-400 cursor-default' : 'text-slate-700 hover:bg-primary-50 hover:text-primary-600'}`}
                                      >
                                          {c.name}
                                          {c.id === currentClinicId && <span className="ml-1 text-[10px] font-bold uppercase">(Current)</span>}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden xl:block text-right mr-4">
                  <p className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight">{clinicName}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{clinicCity || 'Chennai'}</p>
              </div>

              {/* Break Button */}
              <button 
                  onClick={toggleBreak}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all ${doctorStatus === DoctorStatus.ON_BREAK ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="text-left leading-none">
                      <div className="text-[10px] sm:text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctorStatus === DoctorStatus.ON_BREAK ? 'On Break' : 'Break'}
                      </div>
                      {doctorStatus === DoctorStatus.ON_BREAK && (
                          <div className="font-mono text-sm sm:text-lg font-bold">{formatTime(breakDuration)}</div>
                      )}
                  </div>
              </button>

              {/* Delay Button */}
              <button 
                  onClick={toggleDelay}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all ${doctorDelayMinutes > 0 ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Clock12 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="text-left leading-none">
                      <div className="text-[10px] sm:text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctorDelayMinutes > 0 ? 'Delayed' : 'Delay'}
                      </div>
                      {doctorDelayMinutes > 0 ? (
                          <div className="font-mono text-sm sm:text-lg font-bold">{formatTime(delayRemaining)}</div>
                      ) : (
                          <div className="text-xs sm:text-sm font-bold mt-0.5">15m</div>
                      )}
                  </div>
              </button>

              <button 
                  onClick={onLogout}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl border border-transparent hover:border-red-100"
                  title="Log out"
              >
                  <LogOut className="h-5 w-5" />
              </button>

              {/* Mobile Queue Toggle */}
              <button 
                  onClick={() => setShowMobileQueue(!showMobileQueue)}
                  className="lg:hidden p-2.5 bg-slate-900 text-white rounded-xl shadow-lg"
              >
                  {showMobileQueue ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
              </button>
          </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT: PATIENT CONSULTATION */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col w-full lg:w-auto">
              {currentPatient ? (
                  <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                      <ConsultationWorkspace 
                          currentPatient={currentPatient}
                          onComplete={handleConsultationComplete}
                          onHold={() => onHoldPatient(currentPatient.id)}
                      />
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-100 p-6 rounded-full mb-4">
                          <User className="h-12 w-12 opacity-50" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-600">No Active Consultation</h3>
                      <p className="text-sm text-center px-6">Select a patient from the queue to start.</p>
                      {sortedQueue.length > 0 && doctorStatus === DoctorStatus.AVAILABLE && (
                          <Button onClick={onNextPatient} className="mt-6 shadow-xl w-full sm:w-auto justify-center" size="lg">
                              <PlayCircle className="h-5 w-5 mr-2" /> Call Next Patient
                          </Button>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: QUEUE SIDEBAR */}
          <PatientQueueSidebar 
              queue={sortedQueue}
              heldPatients={heldPatients}
              currentPatient={currentPatient}
              doctorStatus={doctorStatus}
              showMobileQueue={showMobileQueue}
              onCloseMobileQueue={() => setShowMobileQueue(false)}
              onNextPatient={onNextPatient}
              onResumePatient={onResumePatient}
          />
      </div>
    </div>
  );
};
