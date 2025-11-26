import React, { useEffect, useRef, useState } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus } from '../types';
import { Coffee, Clock, Zap, AlertTriangle, PlayCircle } from 'lucide-react';

interface KioskProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
}

export const KioskView: React.FC<KioskProps> = ({ doctors, patients, clinicName }) => {
  // Browser Audio Policy State
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Track previous serving tokens to trigger TTS only on change
  const lastServingRef = useRef<Record<string, number>>({});
  
  // Emergency Flash State
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: Patient, doctorName: string } | null>(null);

  // Auto-Scroll State for Multi-Doctor
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for changes and Emergency
    if (!audioEnabled) return;

    let foundEmergency = false;

    doctors.forEach(doc => {
      const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
      
      if (currentPatient) {
        // Emergency Check
        if (currentPatient.isEmergency && !emergencyAlert) {
            setEmergencyAlert({ patient: currentPatient, doctorName: doc.name });
            foundEmergency = true;
            // Speak Emergency
            const utterance = new SpeechSynthesisUtterance(`Emergency Alert. Priority patient ${currentPatient.name} to Room ${doc.roomNumber}`);
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        }

        // Regular Announcement
        const lastToken = lastServingRef.current[doc.id];
        if (lastToken !== currentPatient.tokenNumber) {
          if (!currentPatient.isEmergency) {
              const utterance = new SpeechSynthesisUtterance(`Now serving token number ${currentPatient.tokenNumber} for ${doc.name}`);
              utterance.rate = 0.9;
              window.speechSynthesis.speak(utterance);
          }
          lastServingRef.current[doc.id] = currentPatient.tokenNumber;
        }
      }
    });

    if (!foundEmergency && emergencyAlert) {
        setEmergencyAlert(null); // Clear alert if no longer active
    }

  }, [patients, doctors, emergencyAlert, audioEnabled]);

  // Auto-Scroll Logic
  useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      let scrollAmount = 0;
      const step = 1; // Speed
      const interval = setInterval(() => {
          if (doctors.length <= 4) return; // Don't scroll if few doctors

          if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight) {
               scrollAmount = 0;
               scrollContainer.scrollTop = 0; // Reset to top
          } else {
              scrollContainer.scrollTop += step;
              scrollAmount += step;
          }
      }, 50); // Frame rate

      return () => clearInterval(interval);
  }, [doctors.length]);

  if (!audioEnabled) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-8">
              <div className="text-center max-w-lg">
                  <PlayCircle className="h-24 w-24 mx-auto mb-6 text-primary-500 animate-pulse" />
                  <h1 className="text-4xl font-bold mb-4">Start Kiosk Display</h1>
                  <p className="text-slate-400 mb-8 text-lg">
                      Browser security requires you to click once to enable voice announcements (Text-to-Speech).
                  </p>
                  <button 
                    onClick={() => setAudioEnabled(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transition-all transform hover:scale-105"
                  >
                      Activate Audio & Display
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col relative overflow-hidden">
      
      {/* EMERGENCY OVERLAY */}
      {emergencyAlert && (
          <div className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center animate-pulse">
               <AlertTriangle className="h-48 w-48 text-white mb-8" />
               <h1 className="text-8xl font-black text-white uppercase tracking-tighter mb-4">Emergency</h1>
               <div className="bg-white text-red-600 px-12 py-6 rounded-3xl">
                   <h2 className="text-4xl font-bold">{emergencyAlert.patient.name}</h2>
                   <p className="text-2xl mt-2 text-center">Proceed to {emergencyAlert.doctorName}</p>
               </div>
          </div>
      )}

      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold tracking-tight">{clinicName} <span className="text-primary-500">| Live Queue</span></h1>
        <div className="text-right">
            <div className="text-2xl font-mono" id="clock">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-slate-400 text-sm">
                {new Date().toLocaleDateString()}
            </div>
        </div>
      </header>

      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto no-scrollbar pb-8"
      >
        {doctors.map(doc => {
          const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
          const nextPatients = patients
            .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
            .sort((a, b) => a.tokenNumber - b.tokenNumber) // Simplified sort for display
            .slice(0, 3);

          return (
            <div key={doc.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col shadow-2xl relative overflow-hidden h-[400px]">
              
              {/* Doctor Status Overlay */}
              {doc.status === DoctorStatus.ON_BREAK && (
                  <div className="absolute inset-0 bg-slate-900/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
                      <Coffee className="h-20 w-20 text-orange-500 mb-4" />
                      <h3 className="text-3xl font-bold text-white">On Break</h3>
                      <p className="text-slate-400 mt-2">Will resume shortly</p>
                  </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-slate-700 border-2 border-primary-500 flex items-center justify-center overflow-hidden">
                    <img src={doc.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      {doc.name}
                      {doc.delayMinutes > 0 && (
                          <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded-full flex items-center animate-pulse">
                              <Clock className="h-3 w-3 mr-1" /> Delayed {doc.delayMinutes}m
                          </span>
                      )}
                  </h2>
                  <p className="text-slate-400 text-lg">{doc.specialty} - Room {doc.roomNumber}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center mb-8 bg-black/20 rounded-xl py-6 relative">
                <span className="text-slate-400 text-lg uppercase tracking-widest font-bold mb-2">Now Serving</span>
                {currentPatient ? (
                  <div className="text-center animate-pulse">
                    <span className={`block text-9xl font-bold leading-none ${currentPatient.isEmergency ? 'text-orange-500' : currentPatient.visitType === 'APPOINTMENT' ? 'text-purple-400' : 'text-primary-400'}`}>
                      {currentPatient.tokenNumber}
                    </span>
                    <span className="text-2xl text-white mt-4 block">{currentPatient.name}</span>
                    {currentPatient.visitType === 'APPOINTMENT' && <span className="text-sm text-purple-300 font-bold uppercase tracking-wide mt-1 block">Appointment</span>}
                    {currentPatient.isEmergency && <span className="text-sm text-orange-500 font-bold uppercase tracking-wide mt-1 block">Priority</span>}
                  </div>
                ) : (
                  <span className="text-4xl text-slate-500 font-medium">--</span>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-400 text-sm uppercase font-bold tracking-wider">Up Next</h3>
                <div className="grid grid-cols-3 gap-4">
                  {nextPatients.map(p => (
                    <div key={p.id} className={`p-4 rounded-lg text-center border ${p.visitType === 'APPOINTMENT' ? 'bg-purple-900/30 border-purple-500/30' : 'bg-slate-700 border-slate-600'}`}>
                      <span className={`block text-2xl font-bold ${p.visitType === 'APPOINTMENT' ? 'text-purple-300' : 'text-white'}`}>{p.tokenNumber}</span>
                      <span className="text-xs text-slate-300 truncate block w-full">{p.name}</span>
                    </div>
                  ))}
                  {[...Array(3 - nextPatients.length)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50"></div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center text-slate-500 text-lg flex-shrink-0">
        Scan QR at reception to track on your mobile
      </div>
    </div>
  );
};