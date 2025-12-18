import React from 'react';
import { Doctor, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Plus, Edit2, Trash2, User, Stethoscope, DoorOpen, Coffee, LogOut, CheckCircle2, ChevronDown } from 'lucide-react';

interface DoctorManagerProps {
  doctors: Doctor[];
  onAddDoctor: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (id: string) => void;
  onAddPresetSlot: (doctorId: string, day: string) => void;
  onStatusChange: (id: string, status: DoctorStatus) => void;
}

export const DoctorManager: React.FC<DoctorManagerProps> = ({
  doctors, onAddDoctor, onEditDoctor, onDeleteDoctor, onStatusChange
}) => {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="font-bold text-lg text-slate-800">Medical Staff</h3>
            <p className="text-sm text-slate-500">Manage doctor profiles and live availability status.</p>
        </div>
        <Button onClick={onAddDoctor} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto pb-4 custom-scrollbar">
        {doctors.length > 0 ? (
          doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4 hover:shadow-md transition-shadow group relative">
                <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                        <img src={doc.avatarUrl} className="h-16 w-16 rounded-2xl object-cover bg-slate-100 border border-slate-100" />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900 truncate leading-tight mb-1">{doc.name}</h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditDoctor(doc)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-primary-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => onDeleteDoctor(doc.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-primary-600 font-bold uppercase tracking-tight mb-2">
                            <Stethoscope className="h-3 w-3" />
                            <span className="truncate">{doc.specialty}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                <DoorOpen className="h-3 w-3" /> Room {doc.roomNumber}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400">
                                Exp: {doc.experience || 5} Yrs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Updater for Receptionist */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Status</span>
                        <div className="relative group/status">
                            <select 
                                value={doc.status}
                                onChange={(e) => onStatusChange(doc.id, e.target.value as DoctorStatus)}
                                className={`
                                    appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border outline-none transition-all cursor-pointer
                                    ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-50 border-green-200 text-green-700' : 
                                      doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                                      'bg-slate-50 border-slate-200 text-slate-600'}
                                `}
                            >
                                <option value={DoctorStatus.AVAILABLE}>Online / Available</option>
                                <option value={DoctorStatus.ON_BREAK}>On Break</option>
                                <option value={DoctorStatus.OFF_DUTY}>Offline / Off Duty</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
                        </div>
                    </div>
                    
                    {/* Visual indicators */}
                    <div className="flex items-center gap-1.5">
                        {doc.status === DoctorStatus.AVAILABLE ? (
                            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Active
                            </div>
                        ) : doc.status === DoctorStatus.ON_BREAK ? (
                            <div className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase">
                                <Coffee className="h-3 w-3" /> Break
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                                <LogOut className="h-3 w-3" /> Off
                            </div>
                        )}
                    </div>
                </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <User className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">No doctors registered in this clinic.</p>
              <button onClick={onAddDoctor} className="text-primary-600 font-bold hover:underline mt-2">Add your first doctor</button>
          </div>
        )}
      </div>
    </div>
  );
};