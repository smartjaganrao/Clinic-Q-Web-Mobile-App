import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, PainPoint } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { generatePatientSummary } from '../services/geminiService';
import { 
    Check, Clock, FileText, Sparkles, User, SkipForward, 
    CalendarClock, AlertCircle, Coffee, Clock12, PlayCircle, 
    Zap, Activity, Thermometer, Weight, Heart, Plus, Calendar, 
    Pill, Trash2, Droplets, Ruler, PauseCircle, Play, Timer,
    MoreHorizontal, ChevronRight, ClipboardList, List
} from 'lucide-react';

interface DoctorProps {
  doctor: Doctor;
  queue: Patient[];
  onNextPatient: () => void;
  onCompletePatient: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: DoctorStatus, delay: number) => void;
  onUpdatePatientDetails: (id: string, updates: Partial<Patient>) => void;
  onHoldPatient: (id: string) => void;
  onResumePatient: (id: string) => void;
}

interface PrescriptionItem {
    name: string;
    dosage: string;
    duration: string;
}

const COMMON_DIAGNOSES = [
    "Viral Fever", "Common Cold", "Migraine", "Hypertension", "Diabetes T2", "Gastritis", "Allergy", "Back Pain"
];

export const DoctorDashboard: React.FC<DoctorProps> = ({ doctor, queue, onNextPatient, onCompletePatient, onUpdateStatus, onUpdatePatientDetails, onHoldPatient, onResumePatient }) => {
  const [notes, setNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'VITALS' | 'RX' | 'BODY'>('NOTES');
  
  // Timers State
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Vitals State
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', pulse: '', spo2: '', height: '', sugar: '' });
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);

  // Prescription State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [rxForm, setRxForm] = useState({ name: '', dosage: '1-0-1', duration: '3 days' });

  // Update timer every second for UI
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);

  // Format Seconds to MM:SS
  const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  // SMART HYBRID QUEUE LOGIC
  const { currentPatient, sortedQueue, dueAppointments, heldPatients } = useMemo(() => {
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

    const LATE_THRESHOLD_MINS = 15;

    const classifyPatient = (p: Patient) => {
        if (p.isEmergency) return 1; 
        if (p.visitType === 'APPOINTMENT' && p.appointmentTime) {
            const apptMins = timeToMins(p.appointmentTime);
            const minsUntilAppt = apptMins - currentMins;
            if (minsUntilAppt > LATE_THRESHOLD_MINS) return 5;
            if (p.isCheckedIn) return 2;
            if (minsUntilAppt <= LATE_THRESHOLD_MINS) return 4; 
            return 2; 
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

    const due = waiting.filter(p => {
        if (p.visitType !== 'APPOINTMENT' || !p.appointmentTime) return false;
        const t = timeToMins(p.appointmentTime);
        return t <= currentMins && currentMins <= t + LATE_THRESHOLD_MINS;
    });

    return { 
        currentPatient: current, 
        sortedQueue: sorted,
        dueAppointments: due,
        heldPatients: held
    };
  }, [queue]);

  useEffect(() => {
      if (currentPatient) {
          setNotes(currentPatient.notes || '');
          setVitals({
              bp: currentPatient.vitals?.bp || '',
              temp: currentPatient.vitals?.temp || '',
              weight: currentPatient.vitals?.weight || '',
              pulse: currentPatient.vitals?.pulse || '',
              spo2: currentPatient.vitals?.spo2 || '',
              height: currentPatient.vitals?.height || '',
              sugar: currentPatient.vitals?.sugar || ''
          });
          setPainPoints(currentPatient.painPoints || []);
          setPrescriptions([]); // Clear Rx for new patient
      }
  }, [currentPatient?.id]);

  // Check for Delay Expiry
  useEffect(() => {
      if (doctor.delayMinutes > 0 && doctor.delayStartTime) {
          const elapsed = Date.now() - doctor.delayStartTime;
          const delayMs = doctor.delayMinutes * 60 * 1000;
          if (elapsed >= delayMs) {
              // Timer finished, clear delay automatically
              onUpdateStatus(doctor.id, doctor.status, 0);
          }
      }
  }, [currentTime, doctor.delayMinutes, doctor.delayStartTime]);

  const handleAiAssist = async () => {
    if (!currentPatient || !notes) return;
    setIsAiLoading(true);
    const summary = await generatePatientSummary(notes, currentPatient.name);
    setNotes(summary);
    setIsAiLoading(false);
  };

  const handleComplete = () => {
    if (currentPatient) {
      let finalNote = notes;
      if (prescriptions.length > 0) {
          finalNote += `\n\n--- PRESCRIPTION ---\n` + prescriptions.map(rx => `• ${rx.name} (${rx.dosage}) for ${rx.duration}`).join('\n');
      }
      onUpdatePatientDetails(currentPatient.id, { vitals, painPoints });
      onCompletePatient(currentPatient.id, finalNote);
      setNotes('');
    }
  };

  const toggleBreak = () => {
    const newStatus = doctor.status === DoctorStatus.ON_BREAK ? DoctorStatus.AVAILABLE : DoctorStatus.ON_BREAK;
    onUpdateStatus(doctor.id, newStatus, doctor.delayMinutes);
  };

  const toggleDelay = () => {
      // Toggle between 15m delay and 0
      const newDelay = doctor.delayMinutes > 0 ? 0 : 15;
      onUpdateStatus(doctor.id, doctor.status, newDelay);
  };

  const addTemplateNote = (text: string) => {
      setNotes(prev => prev ? `${prev}\n- Diagnosis: ${text}` : `- Diagnosis: ${text}`);
  };

  const addPrescription = () => {
      if (rxForm.name) {
          setPrescriptions([...prescriptions, { ...rxForm }]);
          setRxForm({ name: '', dosage: '1-0-1', duration: '3 days' });
      }
  };

  // Timer Calculation
  const breakDuration = doctor.status === DoctorStatus.ON_BREAK && doctor.statusUpdateTime 
      ? currentTime - doctor.statusUpdateTime 
      : 0;
  
  const delayRemaining = doctor.delayMinutes > 0 && doctor.delayStartTime
      ? (doctor.delayMinutes * 60 * 1000) - (currentTime - doctor.delayStartTime)
      : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* 1. STATUS & CONTROLS BAR */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
              <div className="relative">
                  <img src={doctor.avatarUrl} className="w-12 h-12 rounded-full border border-slate-100 object-cover" />
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${doctor.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doctor.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
              </div>
              <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-none">{doctor.name}</h1>
                  <p className="text-xs text-slate-500 mt-1">{doctor.specialty} • Room {doctor.roomNumber}</p>
              </div>
          </div>

          <div className="flex items-center gap-3">
              {/* Break Button with Count UP Timer */}
              <button 
                  onClick={toggleBreak}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${doctor.status === DoctorStatus.ON_BREAK ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Coffee className="h-5 w-5" />
                  <div className="text-left leading-none">
                      <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctor.status === DoctorStatus.ON_BREAK ? 'On Break' : 'Take Break'}
                      </div>
                      {doctor.status === DoctorStatus.ON_BREAK && (
                          <div className="font-mono text-lg font-bold">{formatTime(breakDuration)}</div>
                      )}
                  </div>
              </button>

              {/* Delay Button with Count DOWN Timer */}
              <button 
                  onClick={toggleDelay}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${doctor.delayMinutes > 0 ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                  <Clock12 className="h-5 w-5" />
                  <div className="text-left leading-none">
                      <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">
                          {doctor.delayMinutes > 0 ? 'Delayed' : 'Report Delay'}
                      </div>
                      {doctor.delayMinutes > 0 ? (
                          <div className="font-mono text-lg font-bold">{formatTime(delayRemaining)}</div>
                      ) : (
                          <div className="text-sm font-bold mt-0.5">15 mins</div>
                      )}
                  </div>
              </button>
          </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: PATIENT CONSULTATION */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
              {currentPatient ? (
                  <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                      {/* Patient Header Card */}
                      <div className={`rounded-2xl p-6 text-white shadow-lg mb-6 flex justify-between items-start transition-colors ${currentPatient.isEmergency ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
                          <div>
                              <div className="flex items-center gap-3 mb-1">
                                  <h2 className="text-3xl font-bold">{currentPatient.name}</h2>
                                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">#{currentPatient.tokenNumber}</span>
                                  {currentPatient.isEmergency && <span className="bg-white text-orange-600 px-3 py-1 rounded-lg text-sm font-bold uppercase">Emergency</span>}
                              </div>
                              <div className="text-white/80 flex gap-4 text-sm">
                                  <span>{currentPatient.age || '--'} Yrs, {currentPatient.gender || '--'}</span>
                                  {currentPatient.visitType === 'APPOINTMENT' && <span>• Appointment {currentPatient.appointmentTime}</span>}
                              </div>
                              {currentPatient.symptoms && (
                                  <div className="mt-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm inline-block text-sm">
                                      <span className="opacity-70">Chief Complaint:</span> <span className="font-bold">{currentPatient.symptoms}</span>
                                  </div>
                              )}
                          </div>
                          <div className="text-right">
                              <div className="text-4xl font-mono opacity-20"><Timer /></div>
                          </div>
                      </div>

                      {/* Work Tabs */}
                      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                          {[
                              { id: 'NOTES', icon: FileText, label: 'Notes & Diagnosis' },
                              { id: 'VITALS', icon: Activity, label: 'Vitals Check' },
                              { id: 'RX', icon: Pill, label: 'Prescription' },
                              { id: 'BODY', icon: User, label: 'Body Map' },
                          ].map(tab => (
                              <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id as any)}
                                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${activeTab === tab.id ? 'bg-white border-primary-500 text-primary-600 shadow-sm ring-1 ring-primary-100' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'}`}
                              >
                                  <tab.icon className="h-4 w-4" /> {tab.label}
                              </button>
                          ))}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
                          {/* TAB CONTENT */}
                          <div className="flex-1 overflow-y-auto p-6">
                              
                              {/* 1. NOTES */}
                              {activeTab === 'NOTES' && (
                                  <div className="h-full flex flex-col">
                                      <div className="mb-4">
                                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quick Diagnosis</label>
                                          <div className="flex flex-wrap gap-2">
                                              {COMMON_DIAGNOSES.map(d => (
                                                  <button key={d} onClick={() => addTemplateNote(d)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors">
                                                      + {d}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                      <textarea 
                                          className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-medium text-slate-700 leading-relaxed"
                                          placeholder="Type clinical observations here..."
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                      />
                                      <div className="flex justify-end mt-2">
                                          <Button size="sm" variant="ghost" onClick={handleAiAssist} disabled={isAiLoading || !notes} className="text-purple-600">
                                              <Sparkles className="h-4 w-4 mr-2" /> AI Summarize
                                          </Button>
                                      </div>
                                  </div>
                              )}

                              {/* 2. VITALS */}
                              {activeTab === 'VITALS' && (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                      {Object.entries({
                                          bp: { label: 'Blood Pressure', unit: 'mmHg', icon: Activity },
                                          temp: { label: 'Temperature', unit: '°F', icon: Thermometer },
                                          pulse: { label: 'Pulse Rate', unit: 'bpm', icon: Heart },
                                          weight: { label: 'Weight', unit: 'kg', icon: Weight },
                                          spo2: { label: 'SpO2', unit: '%', icon: Zap },
                                          sugar: { label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets },
                                      }).map(([key, config]) => (
                                          <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                              <div className="flex items-center gap-2 text-slate-500 mb-2">
                                                  <config.icon className="h-4 w-4" />
                                                  <span className="text-xs font-bold uppercase">{config.label}</span>
                                              </div>
                                              <div className="flex items-baseline gap-2">
                                                  <input 
                                                      className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-primary-500 outline-none text-xl font-bold text-slate-900 pb-1"
                                                      placeholder="--"
                                                      value={(vitals as any)[key]}
                                                      onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                                  />
                                                  <span className="text-xs text-slate-400 font-medium">{config.unit}</span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* 3. PRESCRIPTION */}
                              {activeTab === 'RX' && (
                                  <div>
                                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                          <div className="grid grid-cols-12 gap-3 items-end">
                                              <div className="col-span-5">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine</label>
                                                  <input placeholder="e.g. Dolo 650" className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.name} onChange={e => setRxForm({...rxForm, name: e.target.value})} />
                                              </div>
                                              <div className="col-span-3">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label>
                                                  <select className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})}><option>1-0-1</option><option>1-0-0</option><option>0-0-1</option><option>1-1-1</option><option>SOS</option></select>
                                              </div>
                                              <div className="col-span-3">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                                                  <select className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.duration} onChange={e => setRxForm({...rxForm, duration: e.target.value})}><option>3 days</option><option>5 days</option><option>7 days</option><option>15 days</option><option>1 month</option></select>
                                              </div>
                                              <div className="col-span-1">
                                                  <Button onClick={addPrescription} className="w-full justify-center"><Plus className="h-5 w-5" /></Button>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                          {prescriptions.map((rx, idx) => (
                                              <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                  <div className="flex items-center gap-3">
                                                      <div className="bg-green-100 p-2 rounded-full text-green-600"><Pill className="h-4 w-4" /></div>
                                                      <div>
                                                          <div className="font-bold text-slate-900">{rx.name}</div>
                                                          <div className="text-xs text-slate-500">{rx.dosage} for {rx.duration}</div>
                                                      </div>
                                                  </div>
                                                  <button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                              </div>
                                          ))}
                                          {prescriptions.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No medicines added yet.</div>}
                                      </div>
                                  </div>
                              )}

                              {/* 4. BODY MAP */}
                              {activeTab === 'BODY' && (
                                  <div className="h-full flex flex-col items-center justify-center">
                                      <p className="text-sm text-slate-500 mb-4">Click to mark pain areas</p>
                                      <div className="relative h-96 w-48 bg-slate-100 rounded-full border-2 border-slate-200 cursor-crosshair shadow-inner" onClick={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                                          setPainPoints([...painPoints, { x, y }]);
                                      }}>
                                          {/* Simple Abstract Body Shape */}
                                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-slate-300"></div>
                                          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-32 rounded-3xl border-2 border-slate-300"></div>
                                          <div className="absolute top-52 left-1/2 -translate-x-1/2 w-24 h-40 rounded-b-3xl border-2 border-slate-300"></div>
                                          
                                          {painPoints.map((p, i) => (
                                              <div key={i} className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in" style={{ left: `${p.x}%`, top: `${p.y}%` }}></div>
                                          ))}
                                      </div>
                                      <button className="mt-4 text-xs text-red-500 hover:underline" onClick={() => setPainPoints([])}>Clear All Points</button>
                                  </div>
                              )}
                          </div>

                          {/* FOOTER ACTIONS */}
                          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                              <Button variant="secondary" onClick={() => onHoldPatient(currentPatient.id)}>
                                  <PauseCircle className="h-4 w-4 mr-2" /> Hold Patient
                              </Button>
                              <Button onClick={handleComplete} className="px-8 shadow-lg shadow-primary-200">
                                  <Check className="h-5 w-5 mr-2" /> Complete Visit
                              </Button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-100 p-6 rounded-full mb-4">
                          <User className="h-12 w-12 opacity-50" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-600">No Active Consultation</h3>
                      <p className="text-sm">Select a patient from the queue to start.</p>
                      {sortedQueue.length > 0 && doctor.status === DoctorStatus.AVAILABLE && (
                          <Button onClick={onNextPatient} className="mt-6 shadow-xl" size="lg">
                              <PlayCircle className="h-5 w-5 mr-2" /> Call Next Patient
                          </Button>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: QUEUE SIDEBAR */}
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <List className="h-4 w-4" /> Patient Queue
                      <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">{sortedQueue.length}</span>
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* HELD PATIENTS SECTION */}
                  {heldPatients.length > 0 && (
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                          <h4 className="text-[10px] font-bold text-orange-700 uppercase mb-2 flex items-center gap-1">
                              <PauseCircle className="h-3 w-3" /> On Hold ({heldPatients.length})
                          </h4>
                          <div className="space-y-2">
                              {heldPatients.map(p => (
                                  <div key={p.id} className="bg-white p-2 rounded-lg border border-orange-200 shadow-sm flex justify-between items-center">
                                      <div>
                                          <div className="font-bold text-sm text-slate-800">{p.name}</div>
                                          <div className="text-[10px] text-slate-500">#{p.tokenNumber} • {p.symptoms || 'No reason'}</div>
                                      </div>
                                      <button 
                                          onClick={() => onResumePatient(p.id)}
                                          disabled={!!currentPatient}
                                          className={`p-1.5 rounded-md transition-colors ${currentPatient ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                      >
                                          <Play className="h-4 w-4" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* ACTIVE QUEUE */}
                  {sortedQueue.map((p, i) => (
                      <div key={p.id} className={`p-3 rounded-xl border relative transition-all group ${i === 0 ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          {i === 0 && <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">NEXT</div>}
                          
                          <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${p.isEmergency ? 'bg-red-100 text-red-600' : p.visitType === 'APPOINTMENT' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {p.isEmergency ? 'URGENT' : p.visitType === 'APPOINTMENT' ? 'APPT' : 'WALK-IN'}
                              </span>
                              <span className="font-mono text-sm font-bold text-slate-400">#{p.tokenNumber}</span>
                          </div>
                          
                          <div className="font-bold text-slate-900 mb-0.5">{p.name}</div>
                          {p.symptoms && <div className="text-xs text-slate-500 truncate italic">{p.symptoms}</div>}
                          
                          {p.visitType === 'APPOINTMENT' && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 p-1 rounded w-fit">
                                  <Clock className="h-3 w-3" /> {p.appointmentTime}
                                  {p.isCheckedIn ? <span className="text-green-600 ml-1 font-bold">✓ Arrived</span> : <span className="text-red-400 ml-1">Not Here</span>}
                              </div>
                          )}

                          {i === 0 && !currentPatient && doctor.status === DoctorStatus.AVAILABLE && (
                              <Button size="sm" className="w-full mt-3 h-8 text-xs" onClick={onNextPatient}>
                                  Call In <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                          )}
                      </div>
                  ))}
                  
                  {sortedQueue.length === 0 && heldPatients.length === 0 && (
                      <div className="text-center py-10 opacity-50">
                          <Coffee className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm text-slate-500">Queue is empty</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};