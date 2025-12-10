
import React, { useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Badge } from '../../../components/Badge';
import { PlayCircle, CheckSquare, Edit2, UserCheck, Activity, AlertTriangle, XCircle, ArrowUp, Calendar, User, CheckCircle, GripVertical, Clock, ChevronRight, Timer, Stethoscope, PauseCircle, Play, Phone, Zap } from 'lucide-react';

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
  onCancelPatient: (id: string) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  patients, doctors, estimatedTimes, isFiltered, nextUpPatientIds, onUpdateStatus, onManualReorder, onDragDrop, onManualCheckIn, onEditPatient, onVitalsClick, onToggleEmergency, onCancelPatient
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (patients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <UserCheck className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-medium">No patients found.</p>
        </div>
      );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 pb-20 sm:pb-0 h-full">
      {/* MOBILE CARD VIEW (< 768px) */}
      <div className="block md:hidden p-3 space-y-3">
          {patients.map(patient => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const estTimeMs = estimatedTimes[patient.id];
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isWaiting = patient.status === PatientStatus.WAITING;
              const isOnHold = patient.status === PatientStatus.ON_HOLD;
              const isCheckedIn = patient.isCheckedIn;
              
              let cardClass = "bg-white border-slate-200";
              if (isServing) cardClass = "border-blue-500 shadow-blue-100 ring-1 ring-blue-500";
              else if (patient.isEmergency) cardClass = "border-red-200 bg-red-50/30";
              else if (isOnHold) cardClass = "border-orange-200 bg-orange-50/30 opacity-90";

              return (
                  <div key={patient.id} className={`rounded-xl p-4 shadow-sm border relative overflow-hidden ${cardClass}`}>
                      {isServing && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                      {isOnHold && <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>}
                      {patient.isEmergency && <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> URGENT</div>}
                      {isOnHold && !patient.isEmergency && <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1"><PauseCircle className="h-3 w-3" /> ON HOLD</div>}
                      
                      <div className="flex items-start gap-4">
                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 ${isServing ? 'bg-blue-600 text-white border-blue-600' : ''}`}>
                              <span className="text-xl font-black">{patient.tokenNumber}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-slate-900 truncate pr-6">{patient.name}</h3>
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                  <span>{doc?.name}</span>
                                  <span>•</span>
                                  <span className={waitMins > 30 ? 'text-red-500 font-bold' : ''}>~{waitMins}m Wait</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${patient.visitType === 'APPOINTMENT' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {patient.visitType === 'APPOINTMENT' ? `Appt ${patient.appointmentTime}` : 'Walk-in'}
                                  </span>
                                  {!isCheckedIn && <span className="text-[10px] px-1.5 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-100">Not Here</span>}
                              </div>
                          </div>
                      </div>

                      {/* Mobile Actions Toolbar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                          {isServing ? (
                              <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="flex-1 bg-green-600 text-white h-10 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-w-[100px]">
                                  <CheckSquare className="h-4 w-4" /> Finish
                              </button>
                          ) : (
                              (isWaiting && !isOnHold) ? (isCheckedIn ? (
                                  <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} className="flex-1 bg-blue-600 text-white h-10 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-w-[100px]">
                                      <PlayCircle className="h-4 w-4" /> Call
                                  </button>
                              ) : (
                                  <button onClick={() => onManualCheckIn(patient.id)} className="flex-1 bg-emerald-600 text-white h-10 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-w-[100px]">
                                      <UserCheck className="h-4 w-4" /> Arrive
                                  </button>
                              )) : (
                                  isOnHold && (
                                    <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} className="flex-1 bg-orange-500 text-white h-10 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-w-[100px]">
                                      <PlayCircle className="h-4 w-4" /> Resume
                                    </button>
                                  )
                              )
                          )}

                          {/* Quick Actions: Zap & Hold */}
                          {(isWaiting || isOnHold) && (
                            <>
                                <button onClick={() => onToggleEmergency(patient.id)} className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border ${patient.isEmergency ? 'bg-red-100 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    <Zap className={`h-4 w-4 ${patient.isEmergency ? 'fill-current' : ''}`} />
                                </button>
                                {isWaiting && (
                                    <button onClick={() => onUpdateStatus(patient.id, PatientStatus.ON_HOLD)} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 bg-white hover:text-orange-500">
                                        <PauseCircle className="h-4 w-4" />
                                    </button>
                                )}
                            </>
                          )}

                          <button onClick={() => onEditPatient(patient)} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 bg-white hover:bg-slate-50">
                              <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => onCancelPatient(patient.id)} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100">
                              <XCircle className="h-4 w-4" />
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block min-w-[1000px] px-4 py-2">
        <table className="w-full text-sm text-left border-separate border-spacing-y-1">
          <thead className="text-slate-400 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-20">
            <tr>
              <th className="px-3 pb-2 w-20 text-center">Token</th>
              <th className="px-3 pb-2">Patient Details</th>
              <th className="px-3 pb-2">Doctor</th>
              <th className="px-3 pb-2">Status & Wait</th>
              <th className="px-3 pb-2">Type</th>
              <th className="px-3 pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="align-middle">
            {patients.map((patient) => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const hasVitals = patient.vitals && Object.values(patient.vitals).some(v => v !== '');
              const isWaiting = patient.status === PatientStatus.WAITING;
              const isServing = patient.status === PatientStatus.WITH_DOCTOR;
              const isOnHold = patient.status === PatientStatus.ON_HOLD;
              const isNextUp = nextUpPatientIds ? nextUpPatientIds.has(patient.id) : false;
              const estTimeMs = estimatedTimes[patient.id];
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              
              let rowStateClass = "bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm";
              if (isServing) rowStateClass = "bg-white border-l-4 border-l-blue-500 border-y-blue-100 border-r-blue-100 shadow-md scale-[1.01] z-10 relative";
              else if (isNextUp) rowStateClass = "bg-white border-l-4 border-l-indigo-500 border-y-indigo-50 border-r-indigo-50 shadow-sm";
              else if (patient.isEmergency) rowStateClass = "bg-red-50/30 border-l-4 border-l-red-500 border-red-100";
              else if (isOnHold) rowStateClass = "bg-orange-50/30 border-l-4 border-l-orange-400 border-orange-100 opacity-80";
              else if (draggedId === patient.id) rowStateClass = "opacity-40 border-2 border-dashed border-primary-500";

              return (
                <tr 
                  key={patient.id} 
                  draggable={isWaiting && !isFiltered} 
                  onDragStart={(e) => { if (!isWaiting || isFiltered) { e.preventDefault(); return; } setDraggedId(patient.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { if (draggedId && draggedId !== patient.id && isWaiting && !isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } }}
                  onDrop={(e) => { e.preventDefault(); if (draggedId && draggedId !== patient.id && !isFiltered) { onDragDrop(draggedId, patient.id); setDraggedId(null); } }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`transition-all duration-200 rounded-lg border ${rowStateClass} group`}
                >
                  <td className="px-2 py-1.5 text-center rounded-l-lg">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {isWaiting && !isFiltered && <GripVertical className="h-3 w-3 text-slate-300 cursor-move hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg font-black text-sm shadow-sm border ${patient.isEmergency ? 'bg-red-500 text-white border-red-600' : isServing ? 'bg-blue-600 text-white border-blue-700 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {patient.tokenNumber}
                        </div>
                        {patient.isEmergency && <div className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-600 p-0.5 rounded-full border border-red-200 shadow-sm z-10"><Zap className="h-2.5 w-2.5 fill-current" /></div>}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-1.5">
                    <div className="flex flex-col">
                      <div className={`font-bold text-sm truncate max-w-[180px] ${isServing ? 'text-blue-900' : 'text-slate-900'}`}>{patient.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                        <span>{patient.age}Y</span><span className="text-slate-300">•</span><span>{patient.gender}</span><span className="text-slate-300">•</span><span className="font-mono">{patient.phone}</span>
                      </div>
                      {patient.symptoms && <div className="mt-0.5 text-[9px] text-slate-600 bg-slate-50 px-1 py-0.5 rounded w-fit max-w-[180px] truncate border border-slate-100">{patient.symptoms}</div>}
                    </div>
                  </td>

                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                        {doc?.avatarUrl ? <img src={doc.avatarUrl} className="w-6 h-6 rounded-full bg-slate-200 border border-white shadow-sm object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">{doc?.name?.charAt(0)}</div>}
                        <div className="min-w-0"><div className="text-slate-900 font-bold text-xs truncate max-w-[120px]">{doc?.name || 'Unknown'}</div><div className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold truncate max-w-[100px]">{doc?.specialty}</div></div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-1.5">
                      {isServing ? (
                          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit"><Activity className="h-3 w-3 animate-pulse" /><span className="text-[10px] font-bold">In Consult</span></div>
                      ) : (isWaiting || isOnHold) ? (
                          <div className="flex flex-col gap-0.5">
                              {isOnHold ? (
                                  <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit font-bold text-[10px]"><PauseCircle className="h-3 w-3" /> ON HOLD</div>
                              ) : (
                                  <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-slate-400" /><span className="text-xs font-bold text-slate-700">~{waitMins}m</span></div>
                              )}
                              {patient.isCheckedIn ? <span className="text-[9px] font-bold text-green-600 flex items-center gap-0.5"><CheckCircle className="h-2.5 w-2.5 fill-current" /> Arrived</span> : <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-slate-300"></div> Not Here</span>}
                          </div>
                      ) : <Badge status={patient.status} />}
                  </td>

                  <td className="px-3 py-1.5">
                      {patient.visitType === 'APPOINTMENT' ? <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 font-bold flex w-fit items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {patient.appointmentTime}</span> : <span className="text-[9px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-bold flex w-fit items-center gap-1"><User className="h-2.5 w-2.5" /> Walk-in</span>}
                  </td>

                  <td className="px-3 py-1.5 text-right rounded-r-lg">
                    <div className="flex justify-end gap-1 items-center">
                      {/* Emergency Toggle */}
                      {(isWaiting || isOnHold) && (
                          <button onClick={() => onToggleEmergency(patient.id)} className={`p-1 rounded transition-colors ${patient.isEmergency ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-400 hover:bg-yellow-50 hover:text-yellow-600'}`} title="Toggle Emergency">
                              <Zap className={`h-3.5 w-3.5 ${patient.isEmergency ? 'fill-current' : ''}`} />
                          </button>
                      )}

                      {/* Hold Toggle */}
                      {isWaiting && (
                          <button onClick={() => onUpdateStatus(patient.id, PatientStatus.ON_HOLD)} className="p-1 bg-slate-100 text-slate-400 hover:bg-orange-50 hover:text-orange-600 rounded transition-colors" title="Put On Hold">
                              <PauseCircle className="h-3.5 w-3.5" />
                          </button>
                      )}
                      {isOnHold && (
                          <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} className="p-1 bg-orange-50 text-orange-600 hover:bg-green-50 hover:text-green-600 rounded transition-colors border border-orange-100" title="Resume">
                              <PlayCircle className="h-3.5 w-3.5" />
                          </button>
                      )}

                      {/* Primary Actions */}
                      {isWaiting && !isOnHold && (patient.isCheckedIn ? 
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-all active:scale-95 text-[10px] font-bold"><PlayCircle className="h-3 w-3" /> Call</button> : 
                        <button onClick={() => onManualCheckIn(patient.id)} className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm transition-all active:scale-95 text-[10px] font-bold"><UserCheck className="h-3 w-3" /> Arrive</button>
                      )}
                      
                      {isServing && <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded shadow-sm transition-all active:scale-95 text-[10px] font-bold"><CheckSquare className="h-3 w-3" /> Done</button>}
                      
                      {(isWaiting || isOnHold) && (
                        <>
                            <button onClick={() => onVitalsClick(patient)} className={`p-1 rounded transition-colors ${patient.vitals ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-slate-100 text-slate-400 hover:bg-pink-50 hover:text-pink-500'}`} title="Vitals"><Activity className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onEditPatient(patient)} className="p-1 bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if(window.confirm('Cancel visit?')) onCancelPatient(patient.id); }} className="p-1 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Cancel"><XCircle className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
