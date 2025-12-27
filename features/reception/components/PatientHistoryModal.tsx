import React, { useMemo } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Modal } from '../../../components/Modal';
/* Added missing Button import */
import { Button } from '../../../components/Button';
import { Calendar, Stethoscope, FileText, CheckCircle2, XCircle, Clock, Tag } from 'lucide-react';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  allClinicsPatients: Patient[];
  doctors: Doctor[];
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen, onClose, patient, allClinicsPatients, doctors
}) => {
  const history = useMemo(() => {
    if (!patient) return [];
    return allClinicsPatients
      .filter(p => p.phone === patient.phone && (p.status === PatientStatus.COMPLETED || p.status === PatientStatus.CANCELLED))
      .sort((a, b) => b.timeAdded - a.timeAdded);
  }, [patient, allClinicsPatients]);

  if (!patient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Medical History: ${patient.name}`} maxWidth="max-w-3xl">
      <div className="space-y-6 py-2">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</span>
                <span className="font-bold text-slate-900">{patient.phone}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age/Gender</span>
                <span className="font-bold text-slate-900">{patient.age || '--'} Yrs • {patient.gender || '--'}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Visits</span>
                <span className="font-bold text-slate-900">{history.length} Records</span>
            </div>
        </div>

        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((record) => {
              const doc = doctors.find(d => d.id === record.doctorId);
              const date = new Date(record.timeAdded).toLocaleDateString(undefined, {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
              });
              const isCompleted = record.status === PatientStatus.COMPLETED;

              return (
                <div key={record.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-primary-200 transition-colors">
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${isCompleted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${isCompleted ? 'text-emerald-600' : 'text-rose-600'}`} />
                      <span className="font-bold text-slate-700 text-sm">{date}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {record.status}
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg"><Stethoscope className="h-4 w-4 text-blue-600" /></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Consultant</p>
                                <p className="font-bold text-slate-900 text-sm">Dr. {doc?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{doc?.specialty}</p>
                            </div>
                        </div>
                        {record.diagnosis && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg"><Tag className="h-4 w-4 text-amber-600" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Diagnosis</p>
                                    <p className="text-sm text-slate-700 font-bold">{record.diagnosis}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <FileText className="h-3 w-3" /> Clinical Notes
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                            {record.notes || "No specific consultation notes provided."}
                        </p>
                        {record.timeCompleted && (
                            <div className="mt-auto pt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <Clock className="h-3 w-3" /> 
                                Visit Duration: {Math.round((record.timeCompleted - record.timeAdded) / 60000)} mins
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 opacity-50" />
                <h4 className="font-bold text-slate-600 uppercase tracking-widest text-xs">No Historical Records Found</h4>
                <p className="text-sm text-slate-400 mt-2">This patient has no completed or cancelled visits.</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-end">
            <Button variant="secondary" onClick={onClose} className="px-8 rounded-xl font-bold uppercase text-xs tracking-widest">Close History</Button>
        </div>
      </div>
    </Modal>
  );
};