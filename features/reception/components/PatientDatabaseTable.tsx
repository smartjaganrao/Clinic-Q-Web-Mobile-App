
import React from 'react';
import { Patient, Doctor } from '../../../types';
import { History, Edit2, Trash2, CalendarDays, Phone, User } from 'lucide-react';

interface PatientDatabaseTableProps {
  patients: Patient[];
  doctors: Doctor[];
  onHistoryClick: (patient: Patient) => void;
  onEditClick: (patient: Patient) => void;
  onDeleteClick: (patient: Patient) => void;
}

export const PatientDatabaseTable: React.FC<PatientDatabaseTableProps> = ({
  patients, doctors, onHistoryClick, onEditClick, onDeleteClick
}) => {
  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-2 sm:p-4">
      <div className="min-w-[800px] overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-sm text-left border-separate border-spacing-y-0">
          <thead className="text-slate-500 font-bold text-xs uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 border-b border-slate-200">Patient Profile</th>
              <th className="px-6 py-4 border-b border-slate-200">Contact Info</th>
              <th className="px-6 py-4 border-b border-slate-200">Last Visit</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
                <tr key={`${patient.phone}_${patient.name}`} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 text-base">{patient.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3" /> {patient.age ? `${patient.age} Yrs` : 'Age --'} • {patient.gender || '--'}
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-mono text-sm">
                          <Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.phone}
                      </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {new Date(patient.timeAdded).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pl-6">
                          Last seen by Dr. {doctors.find(d => d.id === patient.doctorId)?.name || 'Unknown'}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onHistoryClick(patient)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                          <History className="h-3.5 w-3.5" /> History
                      </button>
                      <button onClick={() => onEditClick(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Profile">
                          <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDeleteClick(patient)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Records">
                          <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            {patients.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400 italic">
                        No patients found in database.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
