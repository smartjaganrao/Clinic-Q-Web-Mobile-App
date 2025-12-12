
import React, { useState } from 'react';
import { Staff } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { User, Phone, CheckCircle, XCircle, Trash2, Plus, ShieldAlert } from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicName: string;
  staff: Staff[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (id: string, updates: Partial<Staff>) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen, onClose, clinicName, staff = [], onAddStaff, onUpdateStaff, onDeleteStaff
}) => {
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'RECEPTIONIST' | 'NURSE' | 'MANAGER'>('RECEPTIONIST');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName && newStaffPhone) {
      const newStaff: Staff = {
        id: `staff_${Date.now()}`,
        name: newStaffName,
        phone: newStaffPhone,
        role: newStaffRole,
        isActive: true,
        joinedDate: Date.now()
      };
      onAddStaff(newStaff);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffRole('RECEPTIONIST');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Staff - ${clinicName}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        
        {/* Staff List */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Current Staff ({staff.length})</h4>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                {staff.length > 0 ? (
                    staff.map(s => (
                        <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        {s.name}
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 font-bold">{s.role}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">{s.phone}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => onUpdateStaff(s.id, { isActive: !s.isActive })}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${s.isActive ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}
                                >
                                    {s.isActive ? (
                                        <><CheckCircle className="h-3 w-3" /> Active</>
                                    ) : (
                                        <><XCircle className="h-3 w-3" /> Disabled</>
                                    )}
                                </button>
                                <button 
                                    onClick={() => { if(window.confirm('Remove staff access?')) onDeleteStaff(s.id) }} 
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Staff"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-400 italic">No staff members added yet.</div>
                )}
            </div>
        </div>

        {/* Add Staff Form */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Plus className="h-4 w-4" /> Add New Staff
            </h4>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <Input 
                        placeholder="Staff Name" 
                        value={newStaffName} 
                        onChange={e => setNewStaffName(e.target.value)} 
                        className="bg-slate-50 text-sm h-10"
                        required
                    />
                </div>
                <div className="flex-1 w-full">
                    <Input 
                        placeholder="Phone Number" 
                        value={newStaffPhone} 
                        onChange={e => setNewStaffPhone(e.target.value)} 
                        className="bg-slate-50 text-sm h-10"
                        required
                    />
                </div>
                <div className="w-full sm:w-32">
                    <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                    >
                        <option value="RECEPTIONIST">Reception</option>
                        <option value="NURSE">Nurse</option>
                        <option value="MANAGER">Manager</option>
                    </select>
                </div>
                <Button type="submit" className="h-10 w-full sm:w-auto shadow-none">Add</Button>
            </form>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-700">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Disabling a staff member will immediately revoke their access to the clinic dashboard. Ensure you have at least one active staff member.</p>
        </div>

      </div>
    </Modal>
  );
};
