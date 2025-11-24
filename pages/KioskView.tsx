import React, { useEffect, useRef } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus } from '../types';
import { Coffee, Clock } from 'lucide-react';

interface KioskProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
}

export const KioskView: React.FC<KioskProps> = ({ doctors, patients, clinicName }) => {
  // Track previous serving tokens to trigger TTS only on change
  const lastServingRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Check for changes
    doctors.forEach(doc => {
      const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
      if (currentPatient) {
        const lastToken = lastServingRef.current[doc.id];
        if (lastToken !== currentPatient.tokenNumber) {
          // Speak
          const utterance = new SpeechSynthesisUtterance(`Now serving token number ${currentPatient.tokenNumber} for ${doc.name}`);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          
          // Update ref
          lastServingRef.current[doc.id] = currentPatient.tokenNumber;
        }
      } else {
          // If no patient, reset tracking so if they recall the same token it might speak again (optional)
          // or just keep it to avoid spam.
      }
    });
  }, [patients, doctors]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {doctors.map(doc => {
          const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
          const nextPatients = patients
            .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
            .sort((a, b) => a.tokenNumber - b.tokenNumber)
            .slice(0, 3);

          return (
            <div key={doc.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col shadow-2xl relative overflow-hidden">
              
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

              <div className="flex-1 flex flex-col justify-center items-center mb-8 bg-black/20 rounded-xl py-10 relative">
                <span className="text-slate-400 text-lg uppercase tracking-widest font-bold mb-2">Now Serving</span>
                {currentPatient ? (
                  <div className="text-center animate-pulse">
                    <span className="block text-9xl font-bold text-primary-400 leading-none">
                      {currentPatient.tokenNumber}
                    </span>
                    <span className="text-2xl text-white mt-4 block">{currentPatient.name}</span>
                  </div>
                ) : (
                  <span className="text-4xl text-slate-500 font-medium">--</span>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-400 text-sm uppercase font-bold tracking-wider">Up Next</h3>
                <div className="grid grid-cols-3 gap-4">
                  {nextPatients.map(p => (
                    <div key={p.id} className="bg-slate-700 p-4 rounded-lg text-center">
                      <span className="block text-2xl font-bold text-white">{p.tokenNumber}</span>
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
      
      <div className="mt-8 text-center text-slate-500 text-lg">
        Scan QR at reception to track on your mobile
      </div>
    </div>
  );
};