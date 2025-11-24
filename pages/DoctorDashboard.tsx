import React, { useState, useMemo } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { generatePatientSummary } from '../services/geminiService';
import { Check, Clock, FileText, Sparkles, User, SkipForward, CalendarClock, AlertCircle, Coffee, Clock12, PlayCircle } from 'lucide-react';

interface DoctorProps {
  doctor: Doctor;
  queue: Patient[];
  onNextPatient: () => void;
  onCompletePatient: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: DoctorStatus, delay: number) => void;
}

export const DoctorDashboard: React.FC<DoctorProps> = ({ doctor, queue, onNextPatient, onCompletePatient, onUpdateStatus }) => {
  const [notes, setNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ------------------------------------------------------------
  // SMART QUEUE LOGIC (The "Zipper" Method)
  // ------------------------------------------------------------
  const { currentPatient, sortedQueue, dueAppointments } = useMemo(() => {
    const current = queue.find(p => p.status === PatientStatus.WITH_DOCTOR);
    
    // Get all waiting patients
    const waiting = queue.filter(p => p.status === PatientStatus.WAITING);

    // Get current time (In a real app, use Date.now())
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Helper to convert "09:20" to minutes for comparison
    const timeToMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const currentMins = timeToMins(currentTimeStr);

    // Sort Logic:
    // 1. Appointments that are DUE (time <= now) go to top.
    // 2. Then regular walk-ins sorted by token.
    // 3. Future appointments sit at the bottom or are interleaved based on flow.
    
    const sorted = waiting.sort((a, b) => {
        const isADue = a.visitType === 'APPOINTMENT' && a.appointmentTime && timeToMins(a.appointmentTime) <= currentMins;
        const isBDue = b.visitType === 'APPOINTMENT' && b.appointmentTime && timeToMins(b.appointmentTime) <= currentMins;

        if (isADue && !isBDue) return -1; // A comes first
        if (!isADue && isBDue) return 1;  // B comes first
        
        // If both are due or both are not due, sort by Token ID (First Come First Serve)
        return a.tokenNumber - b.tokenNumber;
    });

    const due = waiting.filter(p => p.visitType === 'APPOINTMENT' && p.appointmentTime && timeToMins(p.appointmentTime) <= currentMins);

    return { 
        currentPatient: current, 
        sortedQueue: sorted,
        dueAppointments: due
    };
  }, [queue]); // Re-run every time queue changes

  const handleAiAssist = async () => {
    if (!currentPatient || !notes) return;
    setIsAiLoading(true);
    const summary = await generatePatientSummary(notes, currentPatient.name);
    setNotes(summary);
    setIsAiLoading(false);
  };

  const handleComplete = () => {
    if (currentPatient) {
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
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm font-bold flex items-center animate-pulse">
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
              <div className={`px-6 py-4 flex justify-between items-center text-white ${currentPatient.visitType === 'APPOINTMENT' ? 'bg-purple-600' : 'bg-primary-600'}`}>
                <div>
                  <h2 className="text-xl font-bold">{currentPatient.name}</h2>
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
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FileText className="h-4 w-4" />
                    Consultation Notes
                  </label>
                  <textarea 
                    className="w-full h-48 lg:h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm leading-relaxed"
                    placeholder="Type raw notes here (e.g., 'fever 3 days, cough, lungs clear')..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-slate-400">Pro tip: Use AI to format your notes.</p>
                    <Button size="sm" variant="secondary" onClick={handleAiAssist} disabled={!notes || isAiLoading}>
                      <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                      {isAiLoading ? 'Improving...' : 'AI Format'}
                    </Button>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <Button variant="secondary" onClick={() => {/* Skip logic */}}>
                    Wait / Hold
                  </Button>
                  <Button variant="primary" onClick={handleComplete}>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Consultation
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
              <User className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ready for Next Patient</h3>
              <p className="mb-6">The queue is optimized based on appointment times and walk-ins.</p>
              {sortedQueue.length > 0 ? (
                <div className="text-center">
                    <p className="text-sm text-slate-500 mb-3">
                        Up Next: <span className="font-bold text-slate-800">{sortedQueue[0].name}</span> 
                        {sortedQueue[0].visitType === 'APPOINTMENT' && <span className="text-purple-600 font-bold ml-1">(Appt Due)</span>}
                    </p>
                    <Button onClick={onNextPatient} size="lg" className="shadow-lg shadow-primary-100">
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
                    // Check if strictly due
                    const now = new Date();
                    const currentMins = now.getHours() * 60 + now.getMinutes();
                    const apptMins = p.appointmentTime ? parseInt(p.appointmentTime.split(':')[0]) * 60 + parseInt(p.appointmentTime.split(':')[1]) : 0;
                    const isDue = isAppt && apptMins <= currentMins;

                    return (
                        <div key={p.id} className={`p-3 rounded-lg border transition-colors flex justify-between items-center group ${idx === 0 ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isAppt ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {p.tokenNumber}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                                        {isDue && (
                                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">DUE</span>
                                        )}
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