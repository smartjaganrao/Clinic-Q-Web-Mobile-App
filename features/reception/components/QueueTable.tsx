
import React, { useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Badge } from '../../../components/Badge';
import { PlayCircle, CheckSquare, Edit2, UserCheck, Activity, AlertTriangle, XCircle, ArrowUp, Calendar, User, CheckCircle, GripVertical, Clock, ChevronRight, Timer, Stethoscope, PauseCircle, Play } from 'lucide-react';

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

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 pb-20">
      <div className="min-w-[1000px] px-4 py-2">
        {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                    <UserCheck className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-medium">No patients found matching the current filters.</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or adding a new patient.</p>
            </div>
        ) : (
        <table className="w-full text-sm text-left border-separate border-spacing-y-3">
          <thead className="text-slate-400 font-bold text-[11px] uppercase tracking-wider sticky top-0 z-20">
            <tr>
              <th className="px-4 pb-2 w-28 text-center">Token</th>
              <th className="px-4 pb-2">Patient Details</th>
              <th className="px-4 pb-2">Doctor</th>
              <th className="px-4 pb-2">Timing & Status</th>
              <th className="px-4 pb-2">Type</th>
              <th className="px-4 pb-2 text-right">Actions</th>
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
              
              // Formatting Times
              const estTimeMs = estimatedTimes[patient.id];
              const estTimeStr = estTimeMs ? new Date(estTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              const isAppt = patient.visitType === 'APPOINTMENT';

              // Visual States
              const cardBaseClass = "transition-all duration-200 rounded-xl border";
              let rowStateClass = "bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm";
              
              if (isServing) {
                  rowStateClass = "bg-white border-l-4 border-l-blue-500 border-y-blue-100 border-r-blue-100 shadow-md shadow-blue-100/50 scale-[1.01] z-10 relative";
              } else if (isNextUp) {
                  rowStateClass = "bg-white border-l-4 border-l-indigo-500 border-y-indigo-50 border-r-indigo-50 shadow-sm";
              } else if (patient.isEmergency) {
                  rowStateClass = "bg-red-50/30 border-l-4 border-l-red-500 border-red-100";
              } else if (isOnHold) {
                  rowStateClass = "bg-orange-50/30 border-l-4 border-l-orange-400 border-orange-100 opacity-80";
              } else if (draggedId === patient.id) {
                  rowStateClass = "opacity-40 border-2 border-dashed border-primary-500";
              }

              return (
                <tr 
                  key={patient.id} 
                  draggable={isWaiting && !isFiltered} // Disable drag if filtered
                  onDragStart={(e) => { if (!isWaiting || isFiltered) { e.preventDefault(); return; } setDraggedId(patient.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { if (draggedId && draggedId !== patient.id && isWaiting && !isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } }}
                  onDrop={(e) => { e.preventDefault(); if (draggedId && draggedId !== patient.id && !isFiltered) { onDragDrop(draggedId, patient.id); setDraggedId(null); } }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`${cardBaseClass} ${rowStateClass} group`}
                >
                  {/* TOKEN COLUMN */}
                  <td className="px-2 py-4 text-center rounded-l-xl">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {isWaiting && !isFiltered && <GripVertical className="h-3 w-3 text-slate-300 cursor-move hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1" />}
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl font-black text-xl shadow-sm border ${patient.isEmergency ? 'bg-red-500 text-white border-red-600 shadow-red-200' : isServing ? 'bg-blue-600 text-white border-blue-700 shadow-blue-300 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {patient.tokenNumber}
                        </div>
                        {patient.isEmergency && <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full border border-red-200 shadow-sm z-10"><AlertTriangle className="h-3 w-3 fill-current" /></div>}
                      </div>
                      {isServing && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">Serving</span>}
                      {isNextUp && isWaiting && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded animate-bounce">Next</span>}
                      {isOnHold && <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded">On Hold</span>}
                    </div>
                  </td>
                  
                  {/* PATIENT INFO */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className={`font-bold text-base ${isServing ? 'text-blue-900' : 'text-slate-900'}`}>{patient.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>{patient.age ? `${patient.age}Y` : '--'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{patient.gender || '--'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-mono">{patient.phone}</span>
                      </div>
                      {patient.symptoms && (
                          <div className="mt-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block w-fit max-w-[200px] truncate border border-slate-100">
                              <span className="opacity-60 mr-1">Reason:</span>{patient.symptoms}
                          </div>
                      )}
                    </div>
                  </td>

                  {/* DOCTOR */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        {doc?.avatarUrl ? <img src={doc.avatarUrl} className="w-9 h-9 rounded-full bg-slate-200 border border-white shadow-sm object-cover" /> : <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{doc?.name?.charAt(0)}</div>}
                        <div>
                            <div className="text-slate-900 font-bold text-sm leading-tight">{doc?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-0.5">{doc?.specialty}</div>
                        </div>
                    </div>
                  </td>
                  
                  {/* TIMING & STATUS */}
                  <td className="px-4 py-4">
                      {isServing ? (
                          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-fit">
                              <Activity className="h-4 w-4 animate-pulse" />
                              <div className="flex flex-col">
                                  <span className="text-xs font-bold">In Consultation</span>
                                  <span className="text-[10px] opacity-80">Started just now</span>
                              </div>
                          </div>
                      ) : (isWaiting || isOnHold) ? (
                          <div className="flex flex-col gap-1">
                              {/* Timing */}
                              <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-sm font-bold text-slate-700">{estTimeStr}</span>
                                  {!isOnHold && <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 rounded">~{waitMins}m</span>}
                              </div>
                              {/* Arrival Status */}
                              <div className="flex items-center gap-1.5">
                                  {patient.isCheckedIn ? (
                                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3 fill-current" /> Arrived
                                      </span>
                                  ) : (
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full border border-slate-300"></div> Not Arrived
                                      </span>
                                  )}
                              </div>
                          </div>
                      ) : (
                          <Badge status={patient.status} />
                      )}
                  </td>

                  {/* TYPE */}
                  <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                          {isAppt ? (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100 font-bold flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" /> {patient.appointmentTime}
                              </span>
                          ) : (
                              <span className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 font-bold flex items-center gap-1.5">
                                  <User className="h-3 w-3" /> Walk-in
                              </span>
                          )}
                          {patient.isEmergency && (
                              <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-bold">
                                  Emergency
                              </span>
                          )}
                      </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2 items-center">
                      
                      {/* WAITING STATE ACTIONS */}
                      {isWaiting && (
                        <>
                          {/* Primary Action: Call (if checked in) or Check In (if not) */}
                          {patient.isCheckedIn ? (
                            <button 
                                onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} 
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-200 transition-all active:scale-95 text-xs font-bold" 
                                title="Call Patient to Room"
                            >
                              <PlayCircle className="h-4 w-4" /> Call
                            </button>
                          ) : (
                            <button 
                                onClick={() => onManualCheckIn(patient.id)} 
                                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-200 transition-all active:scale-95 text-xs font-bold" 
                                title="Mark as Arrived"
                            >
                              <UserCheck className="h-4 w-4" /> Arrived
                            </button>
                          )}
                        </>
                      )}

                      {/* ON HOLD ACTIONS */}
                      {isOnHold && (
                          <button 
                            onClick={() => onUpdateStatus(patient.id, PatientStatus.WAITING)} 
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm shadow-green-200 transition-all active:scale-95 text-xs font-bold" 
                            title="Resume to Queue"
                          >
                              <Play className="h-4 w-4" /> Resume
                          </button>
                      )}
                      
                      {/* SERVING ACTIONS */}
                      {isServing && (
                        <button 
                            onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} 
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm shadow-green-200 transition-all active:scale-95 text-xs font-bold" 
                            title="Finish Visit"
                        >
                          <CheckSquare className="h-4 w-4" /> Done
                        </button>
                      )}
                      
                      {/* Secondary Actions Group */}
                      <div className="flex items-center gap-1">
                          
                          {(isWaiting || isOnHold) && (
                            <>
                                {/* Vitals Button */}
                                <button 
                                    onClick={() => onVitalsClick(patient)} 
                                    className={`p-2 rounded-lg transition-colors ${hasVitals ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600 border border-slate-200 hover:border-pink-200'}`} 
                                    title="Record Vitals"
                                >
                                    <Activity className="h-4 w-4" />
                                </button>

                                {/* Hold Button - Only for Waiting */}
                                {isWaiting && (
                                    <button 
                                        onClick={() => onUpdateStatus(patient.id, PatientStatus.ON_HOLD)} 
                                        className="p-2 bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors border border-slate-200 hover:border-amber-200" 
                                        title="Put On Hold"
                                    >
                                        <PauseCircle className="h-4 w-4" />
                                    </button>
                                )}

                                {/* Edit Button */}
                                <button 
                                    onClick={() => onEditPatient(patient)} 
                                    className="p-2 bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-slate-200 hover:border-blue-200" 
                                    title="Edit Details"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>

                                {/* Emergency Toggle */}
                                <button 
                                    onClick={() => onToggleEmergency(patient.id)} 
                                    className={`p-2 rounded-lg transition-colors border ${patient.isEmergency ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 border-slate-200 hover:border-red-200'}`} 
                                    title="Toggle Emergency"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                </button>

                                {/* Cancel Button */}
                                <button 
                                    onClick={() => { if(window.confirm('Cancel visit?')) onCancelPatient(patient.id); }} 
                                    className="p-2 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-100" 
                                    title="Cancel Visit"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};
