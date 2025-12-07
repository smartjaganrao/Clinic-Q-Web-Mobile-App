
import React from 'react';
import { Patient, Doctor } from '../../../types';
import { History, Edit2, Trash2 } from 'lucide-react';

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
    <div className="flex-1 overflow-auto">
      <div className="min-w-[800px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Patient Profile</th>
              <th className="px-6 py-3">Phone Number</th>
              <th className="px-6 py-3">Total Visits</th>
              <th className="px-6 py-3">Last Visit</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
                <tr key={`${patient.phone}_${patient.name}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{patient.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {patient.age ? `${patient.age} Years` : 'Age N/A'} • {patient.gender || 'Gender N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{patient.phone}</td>
                  <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">View History</span></td>
                  <td className="px-6 py-4 text-slate-500">{new Date(patient.timeAdded).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onHistoryClick(patient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View History"><History className="h-4 w-4" /></button>
                      <button onClick={() => onEditClick(patient)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg" title="Edit Profile"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => onDeleteClick(patient)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Records"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
