import React, { useState, useMemo } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus, PainPoint } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { generatePatientSummary } from '../services/geminiService';
import { Check, Clock, FileText, Sparkles, User, SkipForward, CalendarClock, AlertCircle, Coffee, Clock12, PlayCircle, Zap, Activity, Thermometer, Weight, Heart, Plus, Calendar } from 'lucide-react';

interface DoctorProps {
  doctor: Doctor;
  queue: Patient[];
  onNextPatient: () => void;
  onCompletePatient: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: DoctorStatus, delay: number) => void;
  onUpdatePatientDetails: (id: string, updates: Partial<Patient>) => void;
}

const COMMON_DIAGNOSES = [
    "Viral Fever", "Common Cold", "Migraine", "Hypertension", "Diabetes T2", "Gastritis", "Allergy", "Back Pain"
];

export const DoctorDashboard: React.FC<DoctorProps> = ({ doctor, queue, onNextPatient, onCompletePatient, onUpdateStatus, onUpdatePatientDetails }) => {
  const [notes, setNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Vitals State (Local to current patient session)
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', pulse: '' });
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);

  // ------------------------------------------------------------
  // SMART HYBRID QUEUE LOGIC
  // ------------------------------------------------------------
  const { currentPatient, sortedQueue, dueAppointments } = useMemo(() => {
    const current = queue.find(p => p.status === PatientStatus.WITH_DOCTOR);
    
    // Get all waiting patients
    const waiting = queue.filter(p => p.status === PatientStatus.WAITING);

    // Get current time
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    // Time helper
    const timeToMins = (t?: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const LATE_THRESHOLD_MINS = 15;

    const classifyPatient = (p: Patient) => {
        if (p.isEmergency) return 1; // Highest Priority

        if (p.visitType === 'APPOINTMENT' && p.appointmentTime) {
            const apptMins = timeToMins(p.appointmentTime);
            
            // Check if Future
            if (apptMins > currentMins) return 4; // Future

            // Check if Late (>15 mins past appt time)
            if (currentMins > apptMins + LATE_THRESHOLD_MINS) return 3; // Treat as Walk-in (Late)

            // Must be On Time / Due
            return 2;
        }

        // Walk-in
        return 3;
    };

    const sorted = waiting.sort((a, b) => {
        const priorityA = classifyPatient(a);
        const priorityB = classifyPatient(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB; // Lower number = higher priority
        }

        // Tie-breakers
        
        // If both are Appointments in the same priority bracket (e.g. both Due), sort by Appt Time
        if (a.visitType === 'APPOINTMENT' && b.visitType === 'APPOINTMENT' && a.appointmentTime && b.appointmentTime) {
             return timeToMins(a.appointmentTime) - timeToMins(b.appointmentTime);
        }

        // Default: FIFO based on Token Number (Arrival order - handles manual reorder timestamps)
        return a.timeAdded - b.timeAdded;
    });

    // Identify strict "Due" appointments for the UI Badge
    const due = waiting.filter(p => {
        if (p.visitType !== 'APPOINTMENT' || !p.appointmentTime) return false;
        const t = timeToMins(p.appointmentTime);
        return t <= currentMins && currentMins <= t + LATE_THRESHOLD_MINS;
    });

    return { 
        currentPatient: current, 
        sortedQueue: sorted,
        dueAppointments: due
    };
  }, [queue]); // Re-run every time queue changes

  // Reset local state when patient changes
  React.useEffect(() => {
      if (currentPatient) {
          setNotes(currentPatient.notes || '');
          setVitals({
              bp: currentPatient.vitals?.bp || '',
              temp: currentPatient.vitals?.temp || '',
              weight: currentPatient.vitals?.weight || '',
              pulse: currentPatient.vitals?.pulse || ''
          });
          setPainPoints(currentPatient.painPoints || []);
      } else {
          setNotes('');
          setVitals({ bp: '', temp: '', weight: '', pulse: '' });
          setPainPoints([]);
      }
  }, [currentPatient?.id]);

  const handleAiAssist = async () => {
    if (!currentPatient || !notes) return;
    setIsAiLoading(true);
    const summary = await generatePatientSummary(notes, currentPatient.name);
    setNotes(summary);
    setIsAiLoading(false);
  };

  const handleComplete = () => {
    if (currentPatient) {
      // Save vitals/pain points one last time before completing
      onUpdatePatientDetails(currentPatient.id, { vitals, painPoints });
      onCompletePatient(currentPatient.id, notes);
      setNotes('');
    }
  };

  const toggleBreak = () => {
    const newStatus = doctor.status === DoctorStatus.ON_BREAK ? DoctorStatus.AVAILABLE : DoctorStatus.ON_BREAK;
    onUpdateStatus(doctor.id, newStatus, doctor.delayMinutes);
  };

  const toggleDelay = () => {
      // Toggle between 0 and 15 mins delay for MVP simplicity
      const newDelay = doctor.delayMinutes === 0 ? 15 : 0;
      onUpdateStatus(doctor.id, doctor.status, newDelay);
  };

  const addTemplateNote = (text: string) => {
      setNotes(prev => prev ? `${prev}\n- Diagnosis: ${text}` : `- Diagnosis: ${text}`);
  };

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentPatient) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPainPoints([...painPoints, { x, y }]);
  };

  const addFollowUp = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setNotes(prev => prev ? `${prev}\n[System]: Follow up in ${days} days (${date.toLocaleDateString()})` : `[System]: Follow up in ${days} days (${date.toLocaleDateString()})`);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={doctor.avatarUrl} alt={doctor.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {doctor.name}
                {doctor.status === DoctorStatus.ON_BREAK && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">ON BREAK</span>}
                {doctor.delayMinutes > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">DELAYED {doctor.delayMinutes}m</span>}
            </h1>
            <p className="text-slate-500">{doctor.specialty} • Room {doctor.roomNumber}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
             <div className="flex gap-2 mr-4 border-r border-slate-200 pr-4">
                 <Button 
                    size="sm" 
                    variant={doctor.status === DoctorStatus.ON_BREAK ? 'primary' : 'secondary'}
                    onClick={toggleBreak}
                    className={doctor.status === DoctorStatus.ON_BREAK ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                    <Coffee className="h-4 w-4 mr-2" />
                    {doctor.status === DoctorStatus.ON_BREAK ? 'Resume Work' : 'Take Break'}
                 </Button>
                 <Button 
                    size="sm" 
                    variant={doctor.delayMinutes > 0 ? 'primary' : 'secondary'}
                    onClick={toggleDelay}
                    className={doctor.delayMinutes > 0 ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                    <Clock12 className="h-4 w-4 mr-2" />
                    {doctor.delayMinutes > 0 ? 'Clear Delay' : 'Report 15m Delay'}
                 </Button>
             </div>

             {dueAppointments.length > 0 && (
                <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg border border-purple-200 text-sm font-bold flex items-center animate-pulse">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {dueAppointments.length} Appt Due
                </div>
             )}
            <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
             Total Waiting: {sortedQueue.length}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
        {/* Main Consultation Area */}
        <div className="lg:col-span-2 space-y-6">
          {doctor.status === DoctorStatus.ON_BREAK ? (
              <div className="h-full flex flex-col items-center justify-center bg-orange-50 rounded-xl border border-dashed border-orange-200 text-orange-800">
                  <Coffee className="h-20 w-20 mb-6 opacity-20" />
                  <h2 className="text-3xl font-bold mb-2">You are on break</h2>
                  <p className="text-orange-600 mb-8">The queue is paused. Click 'Resume Work' when you are ready.</p>
                  <Button onClick={toggleBreak} className="bg-orange-600 hover:bg-orange-700 text-white">
                      Resume Work
                  </Button>
              </div>
          ) : currentPatient ? (
            <Card className="p-0 overflow-hidden h-full flex flex-col">
              <div className={`px-6 py-4 flex justify-between items-center text-white ${currentPatient.isEmergency ? 'bg-orange-500' : currentPatient.visitType === 'APPOINTMENT' ? 'bg-purple-600' : 'bg-primary-600'}`}>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      {currentPatient.name}
                      {currentPatient.isEmergency && <span className="text-xs bg-white text-orange-600 px-2 py-0.5 rounded font-bold uppercase">Emergency</span>}
                  </h2>
                  <div className="flex items-center gap-2 text-white/90 text-sm mt-1">
                     <span>Token #{currentPatient.tokenNumber}</span>
                     <span>•</span>
                     <span className="uppercase font-semibold tracking-wide">{currentPatient.visitType}</span>
                     {currentPatient.appointmentTime && <span>({currentPatient.appointmentTime})</span>}
                  </div>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-md text-sm backdrop-blur-sm">
                  In Consultation
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                {/* Vitals Input Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Activity className="h-3 w-3" /> BP
                        </label>
                        <input 
                            className="w-full text-sm font-medium border-b border-slate-300 bg-transparent focus:outline-none focus:border-primary-500" 
                            placeholder="120/80" 
                            value={vitals.bp}
                            onChange={(e) => setVitals({...vitals, bp: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Thermometer className="h-3 w-3" /> Temp (F)
                        </label>
                        <input 
                            className="w-full text-sm font-medium border-b border-slate-300 bg-transparent focus:outline-none focus:border-primary-500" 
                            placeholder="98.6"
                            value={vitals.temp}
                            onChange={(e) => setVitals({...vitals, temp: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Weight className="h-3 w-3" /> Weight (kg)
                        </label>
                        <input 
                            className="w-full text-sm font-medium border-b border-slate-300 bg-transparent focus:outline-none focus:border-primary-500" 
                            placeholder="70"
                            value={vitals.weight}
                            onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Heart className="h-3 w-3" /> Pulse
                        </label>
                        <input 
                            className="w-full text-sm font-medium border-b border-slate-300 bg-transparent focus:outline-none focus:border-primary-500" 
                            placeholder="72"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({...vitals, pulse: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-1">
                    {/* Notes Section */}
                    <div className="md:col-span-2 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                             <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <FileText className="h-4 w-4" />
                                Consultation Notes
                             </label>
                             <Button size="sm" variant="ghost" onClick={handleAiAssist} disabled={!notes || isAiLoading} className="text-purple-600 h-6 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {isAiLoading ? 'Thinking...' : 'AI Summary'}
                             </Button>
                        </div>
                        <textarea 
                            className="flex-1 w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm leading-relaxed mb-3"
                            placeholder="Type raw notes here (e.g., 'fever 3 days, cough, lungs clear')..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        
                        {/* Quick Templates */}
                        <div className="flex flex-wrap gap-2">
                            {COMMON_DIAGNOSES.map(d => (
                                <button 
                                    key={d}
                                    onClick={() => addTemplateNote(d)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 transition-colors"
                                >
                                    + {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body Map Canvas */}
                    <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-center relative select-none">
                        <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Pain Points</span>
                        <div 
                            className="relative h-64 w-32 cursor-crosshair"
                            onClick={handleBodyClick}
                        >
                            {/* Simple Body SVG Silhouette */}
                            <svg viewBox="0 0 100 200" className="h-full w-full opacity-20 hover:opacity-40 transition-opacity">
                                <path d="M50,10 C60,10 65,15 65,25 C65,35 60,40 50,40 C40,40 35,35 35,25 C35,15 40,10 50,10 Z M50,40 C70,45 80,50 85,80 L80,110 L70,105 L75,80 C70,60 65,60 65,100 L70,180 L55,180 L50,130 L45,180 L30,180 L35,100 C35,60 30,60 25,80 L20,105 L10,110 L15,80 C20,50 30,45 50,40 Z" fill="currentColor" />
                            </svg>
                            {/* Render Points */}
                            {painPoints.map((p, i) => (
                                <div 
                                    key={i} 
                                    className="absolute w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                ></div>
                            ))}
                        </div>
                        <button 
                            className="mt-2 text-xs text-slate-400 hover:text-red-500 underline"
                            onClick={() => setPainPoints([])}
                        >
                            Clear Map
                        </button>
                    </div>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 items-center">
                  <div className="flex gap-2">
                       <Button size="sm" variant="secondary" onClick={() => addFollowUp(3)} className="text-xs">
                           <Calendar className="h-3 w-3 mr-1" /> +3 Days
                       </Button>
                       <Button size="sm" variant="secondary" onClick={() => addFollowUp(7)} className="text-xs">
                           <Calendar className="h-3 w-3 mr-1" /> +1 Week
                       </Button>
                  </div>
                  <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => {/* Skip logic */}}>
                        Wait / Hold
                      </Button>
                      <Button variant="primary" onClick={handleComplete}>
                        <Check className="h-4 w-4 mr-2" />
                        Complete Consultation
                      </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
              <User className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ready for Next Patient</h3>
              <p className="mb-6">The queue is optimized based on priority, appointment times, and walk-ins.</p>
              {sortedQueue.length > 0 ? (
                <div className="text-center">
                    <p className="text-sm text-slate-500 mb-3">
                        Up Next: <span className="font-bold text-slate-800">{sortedQueue[0].name}</span> 
                        {sortedQueue[0].isEmergency && <span className="text-orange-600 font-bold ml-1">(EMERGENCY)</span>}
                        {!sortedQueue[0].isEmergency && sortedQueue[0].visitType === 'APPOINTMENT' && <span className="text-purple-600 font-bold ml-1">(Appt)</span>}
                    </p>
                    <Button onClick={onNextPatient} size="lg" className={`shadow-lg ${sortedQueue[0].isEmergency ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'shadow-primary-100'}`}>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Call Next Patient (#{sortedQueue[0].tokenNumber})
                    </Button>
                </div>
              ) : (
                <p className="text-sm">Waiting for patients...</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Queue */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Smart Queue</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">Auto-Sorted</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sortedQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                    Queue is empty.
                </div>
            ) : (
                sortedQueue.map((p, idx) => {
                    const isAppt = p.visitType === 'APPOINTMENT';
                    
                    // Re-calc specific status for list item view
                    const now = new Date();
                    const currentMins = now.getHours() * 60 + now.getMinutes();
                    const apptMins = p.appointmentTime ? parseInt(p.appointmentTime.split(':')[0]) * 60 + parseInt(p.appointmentTime.split(':')[1]) : 0;
                    
                    const isDue = isAppt && apptMins <= currentMins && currentMins <= apptMins + 15;
                    const isLate = isAppt && currentMins > apptMins + 15;

                    return (
                        <div key={p.id} className={`p-3 rounded-lg border transition-colors flex justify-between items-center group ${idx === 0 ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${p.isEmergency ? 'bg-orange-100 text-orange-700' : isAppt ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {p.isEmergency ? <Zap className="h-4 w-4 fill-current"/> : p.tokenNumber}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                                        {p.isEmergency && <span className="text-[10px] bg-orange-500 text-white font-bold px-1 py-0.5 rounded">URGENT</span>}
                                        {isDue && !p.isEmergency && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">DUE</span>}
                                        {isLate && !p.isEmergency && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">LATE</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        {isAppt ? (
                                            <><CalendarClock className="h-3 w-3" /> {p.appointmentTime}</>
                                        ) : (
                                            <><User className="h-3 w-3" /> Walk-in</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {idx === 0 && !currentPatient && doctor.status === DoctorStatus.AVAILABLE && (
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={onNextPatient}>
                                <SkipForward className="h-4 w-4" />
                            </Button>
                            )}
                        </div>
                    );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};