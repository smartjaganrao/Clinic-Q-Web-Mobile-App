import React, { useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Badge } from '../../../components/Badge';
import { PlayCircle, CheckSquare, Edit2, UserCheck, Activity, AlertTriangle, ArrowUp, Calendar, User, CheckCircle, GripVertical, Clock, ChevronRight, Timer, Stethoscope, PauseCircle, Play, Phone, Zap, PhoneCall, UserX, MoreHorizontal, Thermometer, Weight, Heart } from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

interface QueueTableProps {
  patients: Patient[];
  doctors: Doctor[];
  estimatedTimes: Record<string, number>;
  isFiltered: boolean;
  nextUpPatientIds?: Set<string>;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onManualReorder: (id: string, direction: 'UP' | 'DOWN') => void;
  onDragDrop: (draggedId: string, targetId: string) => void;
  onManualCheckIn: (id: string) => void;
  onEditPatient: (patient: Patient) => void;
  onVitalsClick: (patient: Patient) => void;
  onToggleEmergency: (id: string) => void;
  onNoShowPatient: (id: string) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  patients, doctors, estimatedTimes, isFiltered, nextUpPatientIds, onUpdateStatus, onManualReorder, onDragDrop, onManualCheckIn, onEditPatient, onVitalsClick, onToggleEmergency, onNoShowPatient
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [patientForNoShow, setPatientForNoShow] = useState<Patient | null>(null);

  if (patients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <UserCheck className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-medium text-sm">No patients in current view.</p>
        </div>
      );
  }

  const formatBookedTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasVitals = (p: Patient) => {
      return p.vitals && (p.vitals.bp || p.vitals.temp || p.vitals.pulse);
  };

  return (
    <div className="flex-1 overflow-auto bg-white sm:pb-0 h-full scroll-smooth custom-scrollbar">
      {/* MOBILE CARD VIEW - High Density */}
      <div className="block md:hidden p-2 space-y-2 bg-slate-50 min-h-full pb-20">
          {patients.map(patient => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const estTimeMs = estimatedTimes[patient.id];
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isWaiting = patient.status === PatientStatus.WAITING;
              const isOnHold = patient.status === PatientStatus.ON_HOLD;
              const isCheckedIn = patient.isCheckedIn;
              const isNextUp = nextUpPatientIds ? nextUpPatientIds.has(patient.id) : false;
              
              let cardClass = "bg-white border-slate-200";
              if (isServing) cardClass = "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-lg scale-[1.01] z-10";
              else if (isNextUp) cardClass = "border-indigo-300 shadow-indigo-50 bg-indigo-50/10";

              return (
                  <div key={patient.id} className={`rounded-2xl p-4 shadow-sm border relative transition-all ${cardClass}`}>
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-11 h-11 rounded-xl font-black text-lg shadow-sm border transition-all flex-shrink-0 ${patient.isEmergency ? 'bg-red-500 text-white border-red-600' : isServing ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                  {patient.tokenNumber}
                              </div>
                              <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                      <h3 className="font-black text-slate-900 truncate text-[15px] leading-tight">{patient.name}</h3>
                                      {patient.isEmergency && <Zap className="h-3 w-3 text-red-500 fill-current" />}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">{patient.age}Y • {patient.gender}</span>
                                      {isWaiting && !isServing && (
                                          <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${waitMins > 30 ? 'text-red-500' : 'text-primary-600'}`}>
                                              <Timer className="h-3 w-3" /> ~{waitMins}m Wait
                                          </span>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                               <Badge status={patient.status} />
                               {patient.visitType === 'APPOINTMENT' && (
                                   <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-widest">APPT</span>
                               )}
                          </div>
                      </div>

                      {/* Vitals Summary Row (Mobile) */}
                      {hasVitals(patient) && (
                          <div className="flex gap-4 mb-3 p-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                              {patient.vitals?.bp && <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase"><Activity className="h-2.5 w-2.5 text-blue-500" /> {patient.vitals.bp}</div>}
                              {patient.vitals?.temp && <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase"><Thermometer className="h-2.5 w-2.5 text-orange-500" /> {patient.vitals.temp}°F</div>}
                              {patient.vitals?.pulse && <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase"><Heart className="h-2.5 w-2.5 text-red-500" /> {patient.vitals.pulse} bpm</div>}
                              {patient.vitals?.weight && <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase"><Weight className="h-2.5 w-2.5 text-slate-400" /> {patient.vitals.weight}kg</div>}
                          </div>
                      )}

                      <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                              <img src={doc?.avatarUrl} className="w-5 h-5 rounded-full border border-white shadow-sm" />
                              <div className="min-w-0">
                                  <div className="text-[10px] font-bold text-slate-700 truncate">Dr. {doc?.name.split(' ').pop()}</div>
                                  <div className="text-[8px] text-slate-400 font-black uppercase tracking-tighter truncate">{doc?.specialty}</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Checked In</div>
                              <div className="flex items-center justify-end gap-1.5">
                                  {isCheckedIn ? (
                                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                                  )}
                                  <span className={`text-[10px] font-bold ${isCheckedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {isCheckedIn ? 'At Clinic' : 'Waiting Arrival'}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-2">
                          {isServing ? (
                                <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="flex-1 bg-green-600 text-white h-11 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-green-100 min-w-0">
                                    <CheckSquare className="h-4 w-4 flex-shrink-0" /> <span className="truncate">Finish Consultation</span>
                                </button>
                          ) : (
                              (isWaiting && !isOnHold) ? (isCheckedIn ? (
                                  <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} className="flex-1 bg-blue-600 text-white h-11 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-100 min-w-0">
                                      <PlayCircle className="h-4 w-4 flex-shrink-0" /> <span className="truncate">Call Patient Now</span>
                                  </button>
                              ) : (
                                  <button onClick={() => onManualCheckIn(patient.id)} className="flex-1 bg-emerald-600 text-white h-11 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-100 min-w-0">
                                      <UserCheck className="h-4 w-4 flex-shrink-0" /> <span className="truncate">Mark Arrival</span>
                                  </button>
                              )) : (
                                  isOnHold && (
                                    <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} className="flex-1 bg-orange-500 text-white h-11 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 min-w-0">
                                      <PlayCircle className="h-4 w-4 flex-shrink-0" /> <span className="truncate">Resume Queue</span>
                                    </button>
                                  )
                              )
                          )}
                          <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => onVitalsClick(patient)} className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors ${hasVitals(patient) ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-400'} active:scale-95`} title="Vitals"><Activity className="h-4 w-4" /></button>
                              <button onClick={() => onEditPatient(patient)} className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 bg-white active:scale-95"><Edit2 className="h-4 w-4" /></button>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* DESKTOP TABLE VIEW - Optimized for density & serving visibility */}
      <div className="hidden md:block min-w-[1200px] h-full overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="text-slate-400 font-black text-[9px] uppercase tracking-widest sticky top-0 z-20 bg-white border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 w-16 text-center border-b border-slate-100">Tkn</th>
              <th className="px-4 py-3 border-b border-slate-100">Patient Profile</th>
              <th className="px-4 py-3 border-b border-slate-100">Vitals</th>
              <th className="px-4 py-3 border-b border-slate-100">Consultant</th>
              <th className="px-4 py-3 w-28 border-b border-slate-100">Wait/Time</th>
              <th className="px-4 py-3 w-32 border-b border-slate-100">Status</th>
              <th className="px-4 py-3 w-20 border-b border-slate-100">Type</th>
              <th className="px-4 py-3 text-right pr-6 border-b border-slate-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {patients.map((patient) => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isNextUp = nextUpPatientIds ? nextUpPatientIds.has(patient.id) : false;
              const estTimeMs = estimatedTimes[patient.id];
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              
              let rowClass = "bg-white";
              if (isServing) rowClass = "bg-blue-50/60 ring-2 ring-inset ring-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)] z-10 relative";
              else if (isNextUp) rowClass = "bg-indigo-50/10";

              return (
                <tr key={patient.id} className={`transition-all h-14 ${rowClass} group`}>
                  <td className={`px-4 py-1 text-center ${isServing ? 'border-y border-l border-blue-500 rounded-l-xl' : ''}`}>
                      <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg font-black text-xs shadow-sm border transition-transform ${patient.isEmergency ? 'bg-red-500 text-white border-red-600' : isServing ? 'bg-blue-600 text-white border-blue-700' : isNextUp ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-800 border-slate-200'} ${isServing ? 'scale-110 shadow-md' : ''}`}>
                        {patient.tokenNumber}
                      </div>
                  </td>
                  
                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                    <div className="flex flex-col min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                        {patient.name}
                        {patient.isEmergency && <Zap className="h-3 w-3 text-red-500 fill-current" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <span>{patient.age}Y • {patient.gender}</span>
                        <span className="text-slate-200">|</span>
                        <span className="font-mono">{patient.phone}</span>
                      </div>
                    </div>
                  </td>

                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                      {hasVitals(patient) ? (
                          <div className="flex flex-wrap gap-2">
                              {patient.vitals?.bp && <span className="bg-slate-50 text-[9px] font-black text-slate-500 px-1.5 py-0.5 rounded border border-slate-200" title="Blood Pressure">{patient.vitals.bp}</span>}
                              {patient.vitals?.temp && <span className="bg-orange-50 text-[9px] font-black text-orange-600 px-1.5 py-0.5 rounded border border-orange-100" title="Temperature">{patient.vitals.temp}°F</span>}
                              {patient.vitals?.pulse && <span className="bg-red-50 text-[9px] font-black text-red-600 px-1.5 py-0.5 rounded border border-red-100" title="Pulse Rate">{patient.vitals.pulse} bpm</span>}
                          </div>
                      ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase italic">Pending Entry</span>
                      )}
                  </td>

                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                    <div className="text-slate-700 font-bold text-[11px] leading-tight truncate">Dr. {doc?.name || 'Unknown'}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter truncate">{doc?.specialty}</div>
                  </td>

                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-600 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatBookedTime(patient.timeAdded)}</span>
                          {!isServing && <span className={`text-[9px] font-black uppercase mt-0.5 ${waitMins > 30 ? 'text-red-500' : 'text-primary-600'}`}>~{waitMins}m Wait</span>}
                      </div>
                  </td>
                  
                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                      {isServing ? (
                          <div className="flex items-center gap-1.5 text-blue-800 bg-blue-200/50 px-2 py-1 rounded-lg border border-blue-300 w-fit shadow-sm">
                              <Activity className="h-3 w-3 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Consulting</span>
                          </div>
                      ) : <Badge status={patient.status} />}
                  </td>

                  <td className={`px-4 py-1 ${isServing ? 'border-y border-blue-500' : ''}`}>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${patient.visitType === 'APPOINTMENT' ? 'text-purple-700 bg-purple-50 border-purple-100' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                        {patient.visitType}
                      </span>
                  </td>

                  <td className={`px-4 py-1 text-right pr-6 ${isServing ? 'border-y border-r border-blue-500 rounded-r-xl' : ''}`}>
                    <div className="flex justify-end gap-2 items-center">
                      {!isServing && (patient.status === PatientStatus.WAITING || patient.status === PatientStatus.ON_HOLD) && (
                          <button onClick={() => onToggleEmergency(patient.id)} className={`p-1.5 rounded-lg transition-all ${patient.isEmergency ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500'}`} title="Emergency"><Zap className="h-4 w-4" /></button>
                      )}
                      
                      <button onClick={() => onVitalsClick(patient)} className={`p-1.5 rounded-lg transition-all ${hasVitals(patient) ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-slate-50 text-slate-300 hover:bg-primary-50 hover:text-primary-500'}`} title="Update Vitals"><Activity className="h-4 w-4" /></button>

                      {patient.status === PatientStatus.WAITING && (
                        patient.isCheckedIn ? 
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-100 active:scale-95 transition-all">Call Patient</button> : 
                        <button onClick={() => onManualCheckIn(patient.id)} className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-100 active:scale-95 transition-all">Mark Arrival</button>
                      )}
                      
                      {isServing && (
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="h-9 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-100 active:scale-95 transition-all">Finish Visit</button>
                      )}
                      
                      {patient.status === PatientStatus.ON_HOLD && (
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} className="h-9 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all">Resume Queue</button>
                      )}

                      <div className="w-px h-6 bg-slate-100 mx-1"></div>
                      <button onClick={() => onEditPatient(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors active:scale-95"><Edit2 className="h-4 w-4" /></button>
                      
                      {/* Only show 'Mark Absent' if patient is NOT already in SKIPPED status */}
                      {patient.status !== PatientStatus.SKIPPED && (
                        <button onClick={() => setPatientForNoShow(patient)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"><UserX className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={!!patientForNoShow} onClose={() => setPatientForNoShow(null)} onConfirm={() => { if(patientForNoShow) { onNoShowPatient(patientForNoShow.id); setPatientForNoShow(null); } }}
        title="Mark as Absent?" message={`Confirm that ${patientForNoShow?.name} is not present at the clinic. They will be moved to the absent list.`} confirmLabel="Patient Absent" variant="primary"
      />
    </div>
  );
};
