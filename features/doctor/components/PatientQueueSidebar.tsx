
import React from 'react';
import { Patient, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { List, PauseCircle, Play, ChevronRight, Clock, Coffee, X, UserPlus } from 'lucide-react';

interface PatientQueueSidebarProps {
  queue: Patient[];
  heldPatients: Patient[];
  currentPatient: Patient | undefined;
  doctorStatus: DoctorStatus;
  showMobileQueue: boolean;
  onCloseMobileQueue: () => void;
  onNextPatient: () => void;
  onResumePatient: (id: string) => void;
}

export const PatientQueueSidebar: React.FC<PatientQueueSidebarProps> = ({
  queue, heldPatients, currentPatient, doctorStatus, showMobileQueue, onCloseMobileQueue, onNextPatient, onResumePatient
}) => {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity ${showMobileQueue ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onCloseMobileQueue}></div>
      <div className={`fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl transition-transform transform lg:static lg:transform-none lg:shadow-none lg:z-auto ${showMobileQueue ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><List className="h-4 w-4" /> Patient Queue <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">{queue.length}</span></h3><button onClick={onCloseMobileQueue} className="lg:hidden p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {heldPatients.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                      <h4 className="text-[10px] font-bold text-orange-700 uppercase mb-2 flex items-center gap-1"><PauseCircle className="h-3 w-3" /> On Hold ({heldPatients.length})</h4>
                      <div className="space-y-2">{heldPatients.map(p => (<div key={p.id} className="bg-white p-2 rounded-lg border border-orange-200 shadow-sm flex justify-between items-center"><div><div className="font-bold text-sm text-slate-800">{p.name}</div><div className="text-[10px] text-slate-500">#{p.tokenNumber} • {p.symptoms || 'No reason'}</div></div><button onClick={() => { onResumePatient(p.id); onCloseMobileQueue(); }} disabled={!!currentPatient} className={`p-1.5 rounded-md transition-colors ${currentPatient ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}><Play className="h-4 w-4" /></button></div>))}</div>
                  </div>
              )}
              {queue.map((p, i) => (
                  <div key={p.id} className={`p-3 rounded-xl border relative transition-all group ${i === 0 ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                      {i === 0 && (
                          <div className="absolute -top-2.5 -right-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                              <span className="uppercase tracking-wider">Next</span>
                              <span className="opacity-60">|</span>
                              {p.visitType === 'APPOINTMENT' && p.appointmentTime ? (
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.appointmentTime}</span>
                              ) : (
                                  <span>WALK-IN</span>
                              )}
                          </div>
                      )}
                      <div className="flex justify-between items-start mb-1 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${p.isEmergency ? 'bg-red-100 text-red-600' : p.visitType === 'APPOINTMENT' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                              {p.isEmergency ? 'Urgent' : p.visitType === 'APPOINTMENT' ? 'Appt' : 'Walk-In'}
                          </span>
                          <span className="font-mono text-sm font-bold text-slate-400">#{p.tokenNumber}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                      {p.symptoms && <div className="text-xs text-slate-500 truncate italic">{p.symptoms}</div>}
                      
                      {/* Detailed Appointment Info for non-first items or just extra context */}
                      {p.visitType === 'APPOINTMENT' && i > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 p-1 rounded w-fit">
                              <Clock className="h-3 w-3" /> {p.appointmentTime} 
                              {p.isCheckedIn ? <span className="text-green-600 ml-1 font-bold">✓ Arrived</span> : <span className="text-red-400 ml-1">Not Here</span>}
                          </div>
                      )}

                      {/* Explicit Call-In Button for Next Patient */}
                      {i === 0 && !currentPatient && doctorStatus === DoctorStatus.AVAILABLE && (
                          <Button size="sm" className="w-full mt-3 h-8 text-xs font-bold shadow-sm" onClick={() => { onNextPatient(); onCloseMobileQueue(); }}>
                              Call In <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                      )}
                  </div>
              ))}
              
              {/* Empty State */}
              {queue.length === 0 && heldPatients.length === 0 && (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                          <UserPlus className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">Queue is Empty</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Ready for next patient</p>
                      <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block font-bold">
                          Accepting Walk-ins
                      </div>
                  </div>
              )}
          </div>
      </div>
    </>
  );
};
