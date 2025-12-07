
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, PainPoint, Clinic } from '../types';
import { Button } from '../components/Button';
import { 
    Clock12, Coffee, List, X, Building, PlayCircle, User
} from 'lucide-react';
import { PatientQueueSidebar } from '../features/doctor/components/PatientQueueSidebar';
import { ConsultationWorkspace } from '../features/doctor/components/ConsultationWorkspace';

interface DoctorProps {
  doctor: Doctor;
  queue: Patient[];
  linkedClinics?: Clinic[];
  currentClinicId?: string;
  onSwitchClinic?: (id: string) => void;
  onNextPatient: () => void;
  onCompletePatient: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: DoctorStatus, delay: number) => void;
  onUpdatePatientDetails: (id: string, updates: Partial<Patient>) => void;
  onHoldPatient: (id: string) => void;
  onResumePatient: (id: string) => void;
}

export const DoctorDashboard: React.FC<DoctorProps> = ({ 
    doctor, queue, linkedClinics, currentClinicId, onSwitchClinic,
    onNextPatient, onCompletePatient, onUpdateStatus, onUpdatePatientDetails, onHoldPatient, onResumePatient 
}) => {
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
  const { currentPatient, sortedQueue, heldPatients } = useMemo(() => {
    const current = queue.find(p => p.status === PatientStatus.WITH_DOCTOR);
    const waiting = queue.filter(p => p.status === PatientStatus.WAITING);
    const held = queue.filter(p => p.status === PatientStatus.ON_HOLD).sort((a, b) => a.timeAdded - b.timeAdded);
    
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
            if (minsUntilAppt <= UPCOMING_THRESHOLD_MINS) {
                return 2; 
            }
            return 4;
        }
        return 3;
    };

    const sorted = waiting.sort((a, b) => {
        const priorityA = classifyPatient(a);
        const priorityB = classifyPatient(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (a.visitType === 'APPOINTMENT' && b.visitType === 'APPOINTMENT' && a.appointmentTime && b.appointmentTime) {
             return timeToMins(a.appointmentTime) - timeToMins(b.appointmentTime);
        }
        return a.timeAdded - b.timeAdded;
    });

    return { 
        currentPatient: current, 
        sortedQueue: sorted,
        heldPatients: held
    };
  }, [queue, currentTime]);

  // Check for Delay Expiry
  useEffect(() => {
      if (doctor.delayMinutes > 0 && doctor.delayStartTime) {
          const elapsed = Date.now() - doctor.delayStartTime;
          const delayMs = doctor.delayMinutes * 60 * 1000;
          if (elapsed >= delayMs) {
              onUpdateStatus(doctor.id, doctor.status, 0);
          }
      }
  }, [currentTime, doctor.delayMinutes, doctor.delayStartTime]);

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
    const newStatus = doctor.status === DoctorStatus.ON_BREAK ? DoctorStatus.AVAILABLE : DoctorStatus.ON_BREAK;
    onUpdateStatus(doctor.id, newStatus, doctor.delayMinutes);
  };

  const toggleDelay = () => {
      const newDelay = doctor.delayMinutes > 0 ? 0 : 15;
      onUpdateStatus(doctor.id, doctor.status, newDelay);
  };

  const breakDuration = doctor.status === DoctorStatus.ON_BREAK && doctor.statusUpdateTime 
      ? currentTime - doctor.statusUpdateTime 
      : 0;
  
  const delayRemaining = doctor.delayMinutes > 0 && doctor.delayStartTime
      ? (doctor.delayMinutes * 60 * 1000) - (currentTime - doctor.delayStartTime)
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
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
      
      {/* 1. STATUS & CONTROLS BAR */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between flex-shrink-0 z-20 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                  <img src={doctor.avatarUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-100 object-cover" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white rounded-full ${doctor.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doctor.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
              </div>
              <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-none flex items-center gap-2">
                      {doctor.name}
                      {isOffShift && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full uppercase font-bold border border-slate-200">Off Shift</span>}
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
              {/* Break Button */}
              <button 
                  onClick={toggleBreak}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all ${doctor.status === DoctorStatus.ON_BREAK ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="text-left leading-none">
                      <div className="text-[10px] sm:text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctor.status === DoctorStatus.ON_BREAK ? 'On Break' : 'Break'}
                      </div>
                      {doctor.status === DoctorStatus.ON_BREAK && (
                          <div className="font-mono text-sm sm:text-lg font-bold">{formatTime(breakDuration)}</div>
                      )}
                  </div>
              </button>

              {/* Delay Button */}
              <button 
                  onClick={toggleDelay}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all ${doctor.delayMinutes > 0 ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Clock12 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="text-left leading-none">
                      <div className="text-[10px] sm:text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctor.delayMinutes > 0 ? 'Delayed' : 'Delay'}
                      </div>
                      {doctor.delayMinutes > 0 ? (
                          <div className="font-mono text-sm sm:text-lg font-bold">{formatTime(delayRemaining)}</div>
                      ) : (
                          <div className="text-xs sm:text-sm font-bold mt-0.5">15m</div>
                      )}
                  </div>
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
                      {sortedQueue.length > 0 && doctor.status === DoctorStatus.AVAILABLE && (
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
              doctorStatus={doctor.status}
              showMobileQueue={showMobileQueue}
              onCloseMobileQueue={() => setShowMobileQueue(false)}
              onNextPatient={onNextPatient}
              onResumePatient={onResumePatient}
          />
      </div>
    </div>
  );
};
