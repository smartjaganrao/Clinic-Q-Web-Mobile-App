
import React, { useEffect, useRef, useState } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus } from '../types';
import { Coffee, Clock, Zap, AlertTriangle, PlayCircle, LogOut } from 'lucide-react';

interface KioskProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  onExit: () => void;
}

export const KioskView: React.FC<KioskProps> = ({ doctors, patients, clinicName, onExit }) => {
  // Browser Audio Policy State
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Track previous serving tokens to trigger TTS only on change
  const lastServingRef = useRef<Record<string, number>>({});
  
  // Emergency Flash State
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: Patient, doctorName: string } | null>(null);

  // Carousel / Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const DOCTORS_PER_PAGE = 4;
  const totalPages = Math.ceil(doctors.length / DOCTORS_PER_PAGE);

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

  // Carousel Interval
  useEffect(() => {
      if (totalPages <= 1) return;
      const interval = setInterval(() => {
          setCurrentPage(prev => (prev + 1) % totalPages);
      }, 12000); // 12 seconds per page

      return () => clearInterval(interval);
  }, [totalPages]);

  // Safety check if doctors are removed
  useEffect(() => {
      if (currentPage >= totalPages && totalPages > 0) {
          setCurrentPage(0);
      }
  }, [totalPages, currentPage]);

  const visibleDoctors = doctors.slice(currentPage * DOCTORS_PER_PAGE, (currentPage + 1) * DOCTORS_PER_PAGE);

  if (!audioEnabled) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-8">
              <button 
                  onClick={onExit} 
                  className="absolute top-6 left-6 p-2 text-slate-500 hover:text-white transition-colors flex items-center gap-2"
              >
                  <LogOut className="h-6 w-6" /> <span className="text-sm font-bold">EXIT</span>
              </button>
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

      <header className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={onExit} 
                className="p-3 bg-slate-800 rounded-xl hover:bg-red-600 transition-colors group"
                title="Exit Kiosk Mode"
            >
                <LogOut className="h-6 w-6 text-slate-400 group-hover:text-white" />
            </button>
            <h1 className="text-4xl font-bold tracking-tight">{clinicName} <span className="text-primary-500">| Live Queue</span></h1>
        </div>
        <div className="text-right">
            <div className="text-2xl font-mono" id="clock">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-slate-400 text-sm">
                {new Date().toLocaleDateString()}
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 h-full content-start">
            {visibleDoctors.map(doc => {
            const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
            const nextPatients = patients
                .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                .sort((a, b) => {
                    // Simple sort for display: Emergency > Token (Assuming older tokens are smaller)
                    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
                    return a.tokenNumber - b.tokenNumber;
                })
                .slice(0, 3);

            return (
                <div key={doc.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col shadow-2xl relative overflow-hidden h-[420px] transition-all duration-500">
                
                {/* Doctor Status Overlay */}
                {doc.status === DoctorStatus.ON_BREAK && (
                    <div className="absolute inset-0 bg-slate-900/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
                        <Coffee className="h-20 w-20 text-orange-500 mb-4" />
                        <h3 className="text-3xl font-bold text-white">On Break</h3>
                        <p className="text-slate-400 mt-2">Will resume shortly</p>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-slate-700 border-2 border-primary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={doc.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                    <h2 className="text-2xl font-bold flex items-center gap-2 truncate">
                        {doc.name}
                        {doc.delayMinutes > 0 && (
                            <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded-full flex items-center animate-pulse flex-shrink-0">
                                <Clock className="h-3 w-3 mr-1" /> Delayed {doc.delayMinutes}m
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-400 text-lg truncate">{doc.specialty} - Room {doc.roomNumber}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center mb-6 bg-black/20 rounded-xl py-4 relative">
                    <span className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">Now Serving</span>
                    {currentPatient ? (
                    <div className="text-center animate-pulse w-full px-4">
                        <span className={`block text-8xl font-bold leading-none ${currentPatient.isEmergency ? 'text-orange-500' : currentPatient.visitType === 'APPOINTMENT' ? 'text-purple-400' : 'text-primary-400'}`}>
                        {currentPatient.tokenNumber}
                        </span>
                        <span className="text-2xl text-white mt-2 block truncate">{currentPatient.name}</span>
                        {currentPatient.visitType === 'APPOINTMENT' && <span className="text-xs text-purple-300 font-bold uppercase tracking-wide mt-1 block">Appointment</span>}
                        {currentPatient.isEmergency && <span className="text-xs text-orange-500 font-bold uppercase tracking-wide mt-1 block">Priority</span>}
                    </div>
                    ) : (
                    <span className="text-4xl text-slate-500 font-medium">--</span>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Up Next</h3>
                    <div className="grid grid-cols-3 gap-3">
                    {nextPatients.map(p => (
                        <div key={p.id} className={`p-3 rounded-lg text-center border ${p.visitType === 'APPOINTMENT' ? 'bg-purple-900/30 border-purple-500/30' : 'bg-slate-700 border-slate-600'}`}>
                        <span className={`block text-xl font-bold ${p.visitType === 'APPOINTMENT' ? 'text-purple-300' : 'text-white'}`}>{p.tokenNumber}</span>
                        <span className="text-[10px] text-slate-300 truncate block w-full">{p.name}</span>
                        </div>
                    ))}
                    {[...Array(3 - nextPatients.length)].map((_, i) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 min-h-[60px]"></div>
                    ))}
                    </div>
                </div>
                </div>
            );
            })}
        </div>
      </div>
      
      {/* Pagination Indicators */}
      {totalPages > 1 && (
          <div className="flex justify-center gap-3 py-4 flex-shrink-0">
              {Array.from({ length: totalPages }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-primary-500 scale-125' : 'bg-slate-700'}`} 
                  />
              ))}
          </div>
      )}
      
      <div className="mt-2 text-center text-slate-500 text-lg flex-shrink-0">
        Scan QR at reception to track on your mobile
      </div>
    </div>
  );
};
