
import React, { useState } from 'react';
import { Doctor, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Grid, CalendarDays, Plus, Edit2, Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DoctorManagerProps {
  doctors: Doctor[];
  onAddDoctor: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (id: string) => void;
  onAddPresetSlot: (doctorId: string, day: string) => void;
}

export const DoctorManager: React.FC<DoctorManagerProps> = ({
  doctors, onAddDoctor, onEditDoctor, onDeleteDoctor, onAddPresetSlot
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'CALENDAR'>('GRID');

  return (
    <div className="p-6 overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg text-slate-800">Medical Staff</h3>
          <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
            <button onClick={() => setViewMode('GRID')} className={`px-3 py-1.5 rounded-md flex items-center gap-1 ${viewMode === 'GRID' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}><Grid className="h-3 w-3" /> List</button>
            <button onClick={() => setViewMode('CALENDAR')} className={`px-3 py-1.5 rounded-md flex items-center gap-1 ${viewMode === 'CALENDAR' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDays className="h-3 w-3" /> Weekly Schedule</button>
          </div>
        </div>
        <Button onClick={onAddDoctor}><Plus className="h-4 w-4 mr-2" /> Add Doctor</Button>
      </div>

      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
              <img src={doc.avatarUrl} className="h-16 w-16 rounded-full object-cover bg-slate-100" />
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{doc.name}</h4>
                <p className="text-sm text-slate-500 mb-2">{doc.specialty}</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${doc.status === DoctorStatus.AVAILABLE ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                  <span className="text-xs font-medium text-slate-600">{doc.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => onEditDoctor(doc)} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-primary-600"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => onDeleteDoctor(doc.id)} className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[150px]">Doctor</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="px-4 py-3 text-left min-w-[140px]"><div className="flex items-center justify-between"><div className="font-semibold text-sm text-slate-700">{day.substring(0,3)}</div><div className="text-xs text-slate-400">Slots</div></div></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{doc.name}<div className="text-[10px] text-slate-400 font-normal">{doc.specialty}</div></td>
                    {DAYS_OF_WEEK.map(day => {
                      const schedule = doc.weeklySchedule.find(s => s.day === day);
                      return (
                        <td key={day} className="px-4 py-3">
                          {(!schedule || schedule.isOff) ? <span className="text-slate-300 font-medium">OFF</span> : (
                            <div className="flex flex-col gap-2 max-w-[220px]">
                              {(schedule?.slots || []).length > 0 ? (
                                schedule.slots.map((sl:any, i:number) => (
                                  <div key={i} className="inline-flex items-center justify-between gap-2 bg-white border border-slate-100 rounded-md px-2 py-1 text-[11px] text-slate-700 shadow-sm min-w-0">
                                    <div className="flex items-center gap-2 min-w-0"><div className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0" /><div className="font-semibold truncate max-w-[160px]">{sl.label ? sl.label : `${sl.startTime} - ${sl.endTime}`}</div></div>
                                  </div>
                                ))
                              ) : <div className="text-xs text-slate-400 italic">No slots</div>}
                              <div className="flex items-center gap-2 mt-1"><button onClick={() => onEditDoctor(doc)} className="text-xs px-2 py-1 rounded border border-dashed text-slate-500 hover:bg-slate-50">Edit</button><button onClick={() => onAddPresetSlot(doc.id, day)} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100">+ Morning</button></div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
