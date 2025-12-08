
import React, { useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Badge } from '../../../components/Badge';
import { PlayCircle, CheckSquare, Edit2, UserCheck, Activity, AlertTriangle, XCircle, ArrowUp, Calendar, User, CheckCircle, GripVertical, Clock, Info } from 'lucide-react';

interface QueueTableProps {
  patients: Patient[];
  doctors: Doctor[];
  estimatedTimes: Record<string, number>;
  isFiltered: boolean;
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
  patients, doctors, estimatedTimes, isFiltered, onUpdateStatus, onManualReorder, onDragDrop, onManualCheckIn, onEditPatient, onVitalsClick, onToggleEmergency, onCancelPatient
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-auto bg-slate-50/30">
      <div className="min-w-[1200px]">
        {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Info className="h-10 w-10 mb-2 opacity-50" />
                <p>No patients found matching the current filters.</p>
            </div>
        ) : (
        <table className="w-full text-sm text-left border-separate border-spacing-y-1 p-2">
          <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-20 shadow-sm text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-28 text-center rounded-l-lg bg-slate-50">Token</th>
              <th className="px-4 py-3 bg-slate-50">Slot Time</th>
              <th className="px-4 py-3 bg-slate-50">Patient Details</th>
              <th className="px-4 py-3 bg-slate-50">Assigned To</th>
              <th className="px-4 py-3 bg-slate-50">Est. Service</th>
              <th className="px-4 py-3 bg-slate-50">Status</th>
              <th className="px-4 py-3 text-right rounded-r-lg bg-slate-50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => {
              const doc = doctors.find(d => d.id === patient.doctorId);
              const hasVitals = patient.vitals && Object.values(patient.vitals).some(v => v !== '');
              const isWaiting = patient.status === PatientStatus.WAITING;
              
              // Formatting Times
              const estTimeMs = estimatedTimes[patient.id];
              const estTimeStr = estTimeMs ? new Date(estTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
              const waitMins = estTimeMs ? Math.max(0, Math.ceil((estTimeMs - Date.now()) / 60000)) : 0;
              const isAppt = patient.visitType === 'APPOINTMENT';

              return (
                <tr 
                  key={patient.id} 
                  draggable={isWaiting && !isFiltered} // Disable drag if filtered
                  onDragStart={(e) => { if (!isWaiting || isFiltered) { e.preventDefault(); return; } setDraggedId(patient.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { if (draggedId && draggedId !== patient.id && isWaiting && !isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } }}
                  onDrop={(e) => { e.preventDefault(); if (draggedId && draggedId !== patient.id && !isFiltered) { onDragDrop(draggedId, patient.id); setDraggedId(null); } }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`group transition-all duration-200 border border-slate-200 rounded-lg overflow-hidden 
                    ${patient.status === PatientStatus.WITH_DOCTOR ? 'bg-blue-50 hover:bg-blue-100 shadow-md relative z-10 border-l-4 border-l-blue-500' : 
                      patient.isEmergency ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'bg-white hover:bg-slate-50'} 
                    ${draggedId === patient.id ? 'opacity-40 border-2 border-dashed border-primary-500' : ''}`}
                >
                  <td className="px-4 py-4 text-center rounded-l-lg">
                    <div className="flex items-center justify-center gap-3">
                      {isWaiting && !isFiltered && <GripVertical className="h-4 w-4 text-slate-300 cursor-move hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl font-black text-lg shadow-sm border ${patient.isEmergency ? 'bg-red-500 text-white border-red-600' : patient.status === PatientStatus.WITH_DOCTOR ? 'bg-blue-600 text-white border-blue-700 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {patient.tokenNumber}
                        </div>
                        {patient.isEmergency && <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-0.5 rounded-full border border-red-200 shadow-sm"><AlertTriangle className="h-3 w-3 fill-current" /></div>}
                      </div>
                    </div>
                  </td>
                  
                  {/* Slot Time Column */}
                  <td className="px-4 py-4">
                      {isAppt ? (
                          <div className="flex flex-col">
                              <span className="text-purple-700 font-bold flex items-center gap-1 text-sm bg-purple-50 px-2 py-0.5 rounded-md w-fit border border-purple-100">
                                  <Calendar className="h-3 w-3" />
                                  {patient.appointmentDate} {patient.appointmentTime}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Scheduled Appointment</span>
                          </div>
                      ) : (
                          <div className="flex flex-col">
                               <span className="text-slate-600 font-medium flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3 text-slate-400" /> Walk-in
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{new Date(patient.timeAdded).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                      )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className={`font-bold text-base mb-1 ${patient.status === PatientStatus.WITH_DOCTOR ? 'text-blue-900' : 'text-slate-900'}`}>{patient.name}</div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span>{patient.age ? `${patient.age}Y` : '--'} • {patient.gender || '--'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono">{patient.phone}</span>
                      </div>
                      {patient.symptoms && <div className="text-[11px] text-slate-500 italic mt-1 truncate max-w-[200px] bg-slate-100/50 px-1.5 py-0.5 rounded w-fit">"{patient.symptoms}"</div>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                        {doc?.avatarUrl ? <img src={doc.avatarUrl} className="w-6 h-6 rounded-full bg-slate-200" /> : <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{doc?.name?.charAt(0)}</div>}
                        <div>
                            <div className="text-slate-900 font-medium text-xs md:text-sm">{doc?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400">{doc?.specialty}</div>
                        </div>
                    </div>
                  </td>
                  
                  {/* Estimated Time Column */}
                  <td className="px-4 py-4">
                      {patient.status === PatientStatus.WITH_DOCTOR ? (
                          <span className="text-xs font-bold text-blue-600 animate-pulse">Serving Now</span>
                      ) : patient.status === PatientStatus.WAITING ? (
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" /> {estTimeStr}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">in ~{waitMins} mins</span>
                          </div>
                      ) : (
                          <span className="text-slate-400 text-xs">--</span>
                      )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-start">
                        <Badge status={patient.status} />
                        {patient.status !== PatientStatus.COMPLETED && patient.status !== PatientStatus.CANCELLED && (
                            patient.isCheckedIn ? (
                                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border border-green-100">
                                    <CheckCircle className="h-3 w-3"/> Arrived
                                </span>
                            ) : (
                                <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-medium border border-slate-100">
                                    Not Here
                                </span>
                            )
                        )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right rounded-r-lg">
                    <div className="flex justify-end gap-2 items-center">
                      {patient.status === PatientStatus.WAITING && (
                        <>
                          {patient.isCheckedIn ? (
                            <button onClick={() => onUpdateStatus(patient.id, PatientStatus.WITH_DOCTOR)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 shadow-sm transition-all" title="Send to Doctor">
                              <PlayCircle className="h-5 w-5" />
                            </button>
                          ) : (
                            <button disabled className="p-2 text-slate-300 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed">
                              <PlayCircle className="h-5 w-5" />
                            </button>
                          )}
                          {!isFiltered && (
                              <button onClick={() => onManualReorder(patient.id, 'UP')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUp className="h-4 w-4" />
                              </button>
                          )}
                        </>
                      )}
                      
                      {patient.status === PatientStatus.WITH_DOCTOR && (
                        <button onClick={() => onUpdateStatus(patient.id, PatientStatus.COMPLETED)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 shadow-sm transition-all" title="Mark Completed">
                          <CheckSquare className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button onClick={() => onEditPatient(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg" title="Edit Details">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      
                      {!patient.isCheckedIn && patient.status === PatientStatus.WAITING && (
                        <button onClick={() => onManualCheckIn(patient.id)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-xs font-bold transition-colors">
                          <UserCheck className="h-3.5 w-3.5" /> Check In
                        </button>
                      )}
                      
                      {patient.status === PatientStatus.WAITING && (
                        <button onClick={() => onVitalsClick(patient)} className={`p-2 rounded-lg transition-colors ${hasVitals ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`} title="Vitals">
                          <Activity className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button onClick={() => onToggleEmergency(patient.id)} className={`p-2 rounded-lg transition-colors ${patient.isEmergency ? 'text-red-600 bg-red-100 shadow-inner' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'}`} title="Toggle Emergency">
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                      
                      {patient.status === PatientStatus.WAITING && (
                        <button onClick={() => { if(window.confirm('Cancel visit?')) onCancelPatient(patient.id); }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel Visit">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
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
