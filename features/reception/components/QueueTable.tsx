
import React, { useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Badge } from '../../../components/Badge';
import { PlayCircle, CheckSquare, Edit2, UserCheck, Activity, AlertTriangle, ArrowUp, Calendar, User, CheckCircle, GripVertical, Clock, ChevronRight, Timer, Stethoscope, PauseCircle, Play, Phone, Zap, PhoneCall, UserX, Thermometer, Droplet, Weight, ArrowRightCircle, Wind, Sparkles, Ruler, Hourglass } from 'lucide-react';
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
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 animate-in fade-in zoom-in-95">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-100">
                <UserCheck className="h-10 w-10 text-slate-200" />
            </div>
            <p className="font-black text-lg tracking-tight text-slate-300 uppercase">No Patients Found</p>
            <p className="text-sm mt-1">Try changing filters or adding a new patient.</p>
        </div>
      );
  }

  const handleConfirmNoShow = () => {
    if (patientForNoShow) {
      onNoShowPatient(patientForNoShow.id);
      setPatientForNoShow(null);
    }
  };

  const formatBookedTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDoctorServingToken = (doctorId: string) => {
      const serving = patients.find(p => p.doctorId === doctorId && p.status === PatientStatus.WITH_DOCTOR);
      return serving ? serving.tokenNumber : null;
  };

  const VitalsSummary: React.FC<{ vitals?: any }> = ({ vitals }) => {
    if (!vitals) return null;
    const items = [];
    if (vitals.bp) items.push(<span key="bp" className="flex items-center gap-0.5"><Droplet className="h-2.5 w-2.5 text-rose-400" /> {vitals.bp}</span>);
    if (vitals.temp) items.push(<span key="temp" className="flex items-center gap-0.5"><Thermometer className="h-2.5 w-2.5 text-orange-400" /> {vitals.temp}°F</span>);
    if (vitals.pulse) items.push(<span key="pulse" className="flex items-center gap-0.5"><Activity className="h-2.5 w-2.5 text-emerald-400" /> {vitals.pulse} bpm</span>);
    if (vitals.spo2) items.push(<span key="spo2" className="flex items-center gap-0.5"><Wind className="h-2.5 w-2.5 text-blue-400" /> {vitals.spo2}%</span>);
    if (vitals.sugar) items.push(<span key="sugar" className="flex items-center gap-0.5"><Sparkles className="h-2.5 w-2.5 text-red-400" /> {vitals.sugar} mg/dL</span>);
    if (vitals.weight) items.push(<span key="weight" className="flex items-center gap-0.5"><Weight className="h-2.5 w-2.5 text-slate-400" /> {vitals.weight}kg</span>);
    if (vitals.height) items.push(<span key="height" className="flex items-center gap-0.5"><Ruler className="h-2.5 w-2.5 text-slate-400" /> {vitals.height}</span>);
    
    if (items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">
            {items}
        </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 pb-24 sm:pb-0 h-full scroll-smooth">
      {/* MOBILE CARD VIEW (< 768px) */}
      <div className="block md:hidden p-2 space-y-2">
          {patients.map(patient => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const estTimeMs = estimatedTimes[patient.id];
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isWaiting = patient.status === PatientStatus.WAITING;
              const isOnHold = patient.status === PatientStatus.ON_HOLD;
              const isCheckedIn = patient.isCheckedIn;
              const isNextUp = nextUpPatientIds ? nextUpPatientIds.has(patient.id) : false;
              const currentlyServingToken = getDoctorServingToken(patient.doctorId);
              
              let cardClass = "bg-white border-slate-200 shadow-sm";
              if (isServing) cardClass = "bg-blue-50/40 border-blue-600 shadow-md ring-2 ring-blue-500/10 z-10 transition-transform";
              else if (isNextUp) cardClass = "border-indigo-500 shadow-sm ring-1 ring-indigo-500/5";
              else if (patient.isEmergency) cardClass = "border-red-300 bg-red-50/20";
              else if (isOnHold) cardClass = "border-orange-200 bg-orange-50/10 grayscale-[0.2]";

              return (
                  <div key={patient.id} className={`rounded-xl p-3 border relative overflow-hidden transition-all duration-200 ${cardClass}`}>
                      <div className="absolute top-0 right-0 flex items-start">
                          {isServing && <div className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm z-10 animate-pulse uppercase"><Activity className="h-2 w-2" /> Consulting</div>}
                          {isNextUp && !isServing && <div className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm z-10 uppercase tracking-widest">Next</div>}
                      </div>
                      
                      <div className="flex items-start gap-3">
                          <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 transition-all ${isServing ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-600 shadow-md' : isNextUp ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'shadow-sm'}`}>
                              <span className="text-xl font-black tracking-tighter">{patient.tokenNumber}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                  <h3 className="font-black text-slate-900 truncate pr-14 tracking-tight text-sm">{patient.name}</h3>
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold mt-0.5 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1 flex-wrap">
                                      <span className="text-primary-600 truncate max-w-[90px]">{doc?.name.split(' ').pop()}</span>
                                      {!isServing && <span className="text-slate-300">•</span>}
                                      {!isServing && <span className={waitMins > 30 ? 'text-rose-500 font-black' : 'font-black text-slate-700'}>~{waitMins}m Wait</span>}
                                  </div>
                                  <VitalsSummary vitals={patient.vitals} />
                              </div>
                          </div>
                      </div>

                      {/* REDESIGNED MOBILE ACTION BAR - COMPACT */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <div className="flex-1 flex gap-2">
                            {isServing ? (
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.COMPLETED); }} className="flex-1 bg-green-600 text-white h-9 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                                        <CheckCircle className="h-3.5 w-3.5" /> Done
                                    </button>
                            ) : (
                                (isWaiting && !isOnHold) ? (isCheckedIn ? (
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR); }} className="flex-1 bg-primary-600 text-white h-9 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                                        <PlayCircle className="h-3.5 w-3.5" /> Start
                                    </button>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onManualCheckIn(patient.id); }} className="flex-1 bg-emerald-600 text-white h-9 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                                        <UserCheck className="h-3.5 w-3.5" /> Check-In
                                    </button>
                                )) : (
                                    isOnHold && (
                                        <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.WAITING); }} className="flex-1 bg-orange-500 text-white h-9 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                                            <Play className="h-3.5 w-3.5 fill-current" /> Resume
                                        </button>
                                    )
                                )
                            )}
                          </div>

                          <div className="flex gap-1 shrink-0">
                                {isWaiting && !isOnHold && (
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.ON_HOLD); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-orange-100 text-orange-500 bg-orange-50 active:scale-95" title="Hold">
                                        <PauseCircle className="h-4 w-4" />
                                    </button>
                                )}

                                <button onClick={(e) => { e.stopPropagation(); onVitalsClick(patient); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-100 text-slate-400 bg-white active:scale-95" title="Vitals">
                                    <Activity className="h-4 w-4" />
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); onToggleEmergency(patient.id); }} className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all active:scale-95 border ${patient.isEmergency ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-300 border-slate-100'}`} title="Emergency">
                                    <Zap className={`h-4 w-4 ${patient.isEmergency ? 'fill-current' : ''}`} />
                                </button>

                                {(isWaiting || isOnHold) && (
                                    <button onClick={(e) => { e.stopPropagation(); setPatientForNoShow(patient); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-rose-100 text-rose-400 bg-rose-50/50 active:scale-95" title="No Show">
                                        <UserX className="h-4 w-4" />
                                    </button>
                                )}
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) - Reduced height spacing */}
      <div className="hidden md:block min-w-[1200px] px-6 py-2">
        <table className="w-full text-sm text-left border-separate border-spacing-y-1">
          <thead className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] sticky top-0 z-20">
            <tr>
              <th className="px-5 pb-2 w-20 text-center">Token</th>
              <th className="px-5 pb-2">Patient Details</th>
              <th className="px-5 pb-2">Reason & Vitals</th>
              <th className="px-5 pb-2">Doctor</th>
              <th className="px-5 pb-2 w-24 text-center">Booked</th>
              <th className="px-5 pb-2 w-24 text-center">Est. Turn</th>
              <th className="px-5 pb-2">Status</th>
              <th className="px-5 pb-2">Type</th>
              <th className="px-5 pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="align-middle">
            {patients.map((patient) => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const isWaiting = patient.status === PatientStatus.WAITING;
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isOnHold = patient.status === PatientStatus.ON_HOLD;
              const isCompleted = patient.status === PatientStatus.COMPLETED;
              const isNextUp = nextUpPatientIds ? nextUpPatientIds.has(patient.id) : false;
              const currentlyServingToken = getDoctorServingToken(patient.doctorId);
              const estTimeMs = estimatedTimes[patient.id];
              
              let rowStateClass = "bg-white border-slate-100 hover:border-primary-200 hover:shadow-md shadow-sm";
              if (isServing) rowStateClass = "bg-blue-50/20 border-blue-500 shadow-md ring-2 ring-blue-500/10 z-10 relative";
              else if (isNextUp) rowStateClass = "bg-indigo-50/10 border-indigo-300 shadow-sm ring-2 ring-indigo-500/5";
              else if (isOnHold) rowStateClass = "bg-orange-50/10 border-orange-200 grayscale-[0.2]";

              return (
                <tr 
                  key={patient.id} 
                  draggable={isWaiting && !isFiltered} 
                  onDragStart={(e) => { if (!isWaiting || isFiltered) { e.preventDefault(); return; } setDraggedId(patient.id); }}
                  onDragOver={(e) => { if (draggedId && draggedId !== patient.id && isWaiting && !isFiltered) { e.preventDefault(); } }}
                  onDrop={(e) => { e.preventDefault(); if (draggedId && draggedId !== patient.id && !isFiltered) { onDragDrop(draggedId, patient.id); setDraggedId(null); } }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`transition-all duration-300 rounded-xl border ${rowStateClass} group relative`}
                >
                  <td className="px-4 py-1.5 text-center rounded-l-xl">
                    <div className="flex flex-col items-center justify-center">
                      <div className={`
                        inline-flex items-center justify-center h-9 w-9 rounded-lg font-black text-sm shadow-sm border transition-all
                        ${patient.isEmergency ? 'bg-rose-500 text-white border-rose-600 shadow-rose-200' : 
                          isServing ? 'bg-blue-600 text-white border-blue-700 shadow-blue-200' : 
                          isNextUp ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200' : 
                          'bg-white text-slate-700 border-slate-100'}
                      `}>
                        {patient.tokenNumber}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-5 py-1.5">
                    <div className="flex flex-col">
                      <div className="font-black text-xs text-slate-900 group-hover:text-primary-700 transition-colors truncate max-w-[150px]">
                          {patient.name}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase mt-0.5 leading-none">
                        <span>{patient.age}Y</span><span className="opacity-30">•</span><span>{patient.gender}</span><span className="opacity-30">•</span><span className="font-mono text-slate-500">{patient.phone}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-1.5">
                      <div className="flex flex-col">
                          <div className="text-[10px] text-slate-500 font-bold max-w-[160px] truncate leading-tight italic" title={patient.symptoms}>
                              {patient.symptoms || <span className="text-slate-300 font-normal">No reason</span>}
                          </div>
                          <VitalsSummary vitals={patient.vitals} />
                      </div>
                  </td>

                  <td className="px-5 py-1.5">
                    <div className="text-slate-900 font-black text-[11px] leading-none">Dr. {doc?.name.split(' ').pop()}</div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-1 leading-none">{doc?.specialty}</div>
                  </td>

                  <td className="px-5 py-1.5 text-center">
                      <div className="inline-flex items-center gap-1 text-[9px] text-slate-500 font-black bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-inner">
                          {formatBookedTime(patient.timeAdded)}
                      </div>
                  </td>

                  <td className="px-5 py-1.5 text-center">
                      {isServing ? (
                          <div className="text-[9px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                              Now
                          </div>
                      ) : (isWaiting || isOnHold) && estTimeMs ? (
                          <div className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border shadow-sm ${estTimeMs - Date.now() > 3600000 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-primary-50 text-primary-700 border-primary-100'}`}>
                              {formatBookedTime(estTimeMs)}
                          </div>
                      ) : (
                          <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest">--</div>
                      )}
                  </td>
                  
                  <td className="px-5 py-1.5">
                      {isServing ? (
                          <div className="flex items-center gap-1 text-white bg-blue-600 px-2 py-1 rounded-full shadow-md w-fit ring-1 ring-blue-500/20">
                              <Activity className="h-2.5 w-2.5 animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Active</span>
                          </div>
                      ) : isNextUp && isWaiting ? (
                        <div className="flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full shadow-sm w-fit">
                            <ArrowRightCircle className="h-2.5 w-2.5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Next</span>
                        </div>
                      ) : <Badge status={patient.status} />}
                  </td>

                  <td className="px-5 py-1.5">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md border font-black uppercase tracking-tighter ${patient.visitType === 'APPOINTMENT' ? 'text-purple-700 bg-purple-50 border-purple-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                        {patient.visitType}
                      </span>
                  </td>

                  <td className="px-5 py-1.5 text-right rounded-r-xl">
                    <div className="flex justify-end gap-1.5 items-center">
                      {(isWaiting || isOnHold) && (
                          <button onClick={() => onToggleEmergency(patient.id)} className={`p-1.5 rounded-lg transition-all ${patient.isEmergency ? 'bg-red-50 text-red-600 border border-red-200 shadow-inner' : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-transparent'}`} title="Urgent"><Zap className="h-3.5 w-3.5" /></button>
                      )}
                      
                      {isWaiting && !isOnHold && (patient.isCheckedIn ? 
                        <button 
                            onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} 
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${isNextUp ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                        >
                            <PlayCircle className="h-3.5 w-3.5" /> Start
                        </button> : 
                        <button onClick={() => onManualCheckIn(patient.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95">In</button>
                      )}
                      
                      {isServing && (
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" /> Done
                        </button>
                      )}

                      {isWaiting && !isOnHold && (
                          <button 
                            onClick={() => onUpdateStatus(patient.id, PatientStatus.ON_HOLD)} 
                            className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 rounded-lg" 
                            title="Hold"
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                          </button>
                      )}

                      {isOnHold && (
                          <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md">Resume</button>
                      )}

                      <button onClick={(e) => { e.stopPropagation(); onVitalsClick(patient); }} className="p-1.5 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-lg" title="Vitals"><Activity className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setPatientForNoShow(patient)} className="p-1.5 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 border border-slate-100 rounded-lg" title="No Show"><UserX className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={!!patientForNoShow}
        onClose={() => setPatientForNoShow(null)}
        onConfirm={handleConfirmNoShow}
        title="Mark as No Show?"
        message={`Are you sure you want to mark ${patientForNoShow?.name} as a No Show? This will move them to the skipped list.`}
        confirmLabel="Confirm No Show"
        variant="primary"
      />
    </div>
  );
};
