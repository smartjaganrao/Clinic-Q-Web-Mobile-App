
import React, { useState, useEffect } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { History, Edit2, Trash2, CalendarDays, Phone, User, CheckSquare, Square, X, PauseCircle, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

interface PatientDatabaseTableProps {
  patients: Patient[];
  doctors: Doctor[];
  onHistoryClick: (patient: Patient) => void;
  onEditClick: (patient: Patient) => void;
  onDeleteClick: (patient: Patient) => void;
  onBulkDelete?: (patients: Patient[]) => void;
  onBulkStatusChange?: (patients: Patient[], status: PatientStatus) => void;
}

export const PatientDatabaseTable: React.FC<PatientDatabaseTableProps> = ({
  patients, doctors, onHistoryClick, onEditClick, onDeleteClick, onBulkDelete, onBulkStatusChange
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Clear selection if data changes significantly or on unmount
  useEffect(() => {
      setSelectedIds(new Set());
  }, [patients.length]); 

  const toggleSelectAll = () => {
      if (selectedIds.size === patients.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(patients.map(p => p.id)));
      }
  };

  const toggleSelectRow = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const getSelectedPatients = () => {
      return patients.filter(p => selectedIds.has(p.id));
  };

  const handleBulkDeleteInitiate = () => {
      if (selectedIds.size > 0) {
          setIsDeleteModalOpen(true);
      }
  };

  const handleConfirmBulkDelete = () => {
      if (onBulkDelete) {
          onBulkDelete(getSelectedPatients());
          setSelectedIds(new Set());
      }
      setIsDeleteModalOpen(false);
  };

  const handleBulkStatusChange = (status: PatientStatus) => {
      if (onBulkStatusChange && selectedIds.size > 0) {
          onBulkStatusChange(getSelectedPatients(), status);
          setSelectedIds(new Set());
      }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-2 sm:p-4 relative">
      
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="absolute top-2 left-4 right-4 z-20 bg-slate-900 text-white p-3 rounded-xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs font-bold">{selectedIds.size} Selected</span>
                  <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
                      <X className="h-4 w-4" />
                  </button>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                      onClick={() => handleBulkStatusChange(PatientStatus.SKIPPED)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                      <PauseCircle className="h-3.5 w-3.5" /> Mark Skipped
                  </button>
                  <button 
                      onClick={handleBulkDeleteInitiate}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Records
                  </button>
              </div>
          </div>
      )}

      <div className="min-w-[900px] overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-sm text-left border-separate border-spacing-y-0">
          <thead className="text-slate-500 font-bold text-xs uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-4 border-b border-slate-200 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary-600 transition-colors">
                      {patients.length > 0 && selectedIds.size === patients.length ? <CheckSquare className="h-4 w-4 text-primary-600" /> : <Square className="h-4 w-4" />}
                  </button>
              </th>
              <th className="px-6 py-4 border-b border-slate-200">Patient Profile</th>
              <th className="px-6 py-4 border-b border-slate-200">Contact Info</th>
              <th className="px-6 py-4 border-b border-slate-200">Last Visit</th>
              <th className="px-6 py-4 border-b border-slate-200">Rating</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => {
                const isSelected = selectedIds.has(patient.id);
                return (
                    <tr key={`${patient.phone}_${patient.id}`} className={`transition-colors group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-4 py-4 text-center">
                          <button onClick={() => toggleSelectRow(patient.id)} className="text-slate-400 hover:text-primary-600 transition-colors">
                              {isSelected ? <CheckSquare className="h-4 w-4 text-primary-600" /> : <Square className="h-4 w-4" />}
                          </button>
                      </td>
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
                      <td className="px-6 py-4">
                          {patient.rating ? (
                              <div className="flex items-center gap-2">
                                  <div className="flex text-yellow-400">
                                      {Array.from({length: 5}).map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < (patient.rating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                                      ))}
                                  </div>
                                  {patient.feedback && (
                                      <div className="text-slate-400" title={patient.feedback}>
                                          <MessageSquare className="h-4 w-4" />
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <span className="text-xs text-slate-300 italic">No rating</span>
                          )}
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
                );
            })}
            {patients.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                        No patients found in database.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Records?"
        message={`Are you sure you want to permanently delete records and medical history for ${selectedIds.size} patients? This action cannot be undone.`}
        confirmLabel="Delete Everything"
        variant="danger"
      />
    </div>
  );
};
