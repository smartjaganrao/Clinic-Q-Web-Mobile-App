import React, { useState } from 'react';
import { Staff } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { User, Phone, CheckCircle, XCircle, Trash2, Plus, ShieldAlert, Mail, Lock } from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

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
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'RECEPTIONIST' | 'NURSE' | 'MANAGER'>('RECEPTIONIST');
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName && newStaffEmail && newStaffPassword) {
      const newStaff: Staff = {
        id: `staff_${Date.now()}`,
        name: newStaffName,
        phone: newStaffPhone,
        email: newStaffEmail,
        password: newStaffPassword,
        role: newStaffRole,
        isActive: true,
        joinedDate: Date.now()
      };
      onAddStaff(newStaff);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffRole('RECEPTIONIST');
    }
  };

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      onDeleteStaff(staffToDelete.id);
      setStaffToDelete(null);
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
                                    <div className="text-xs text-slate-500 font-mono">{s.email}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => onUpdateStaff(s.id, { isActive: !s.isActive })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${s.isActive ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}
                                >
                                    {s.isActive ? (
                                        <><CheckCircle className="h-3 w-3" /> Active</>
                                    ) : (
                                        <><XCircle className="h-3 w-3" /> Disabled</>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setStaffToDelete(s)} 
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
            <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Full Name"
                        placeholder="e.g. Sarah Jones" 
                        value={newStaffName} 
                        onChange={e => setNewStaffName(e.target.value)} 
                        required
                    />
                    <Input 
                        label="Phone"
                        placeholder="e.g. 9876543210" 
                        value={newStaffPhone} 
                        onChange={e => setNewStaffPhone(e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm" type="email" placeholder="staff@clinic.com" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm" type="password" placeholder="••••••" value={newStaffPassword} onChange={e => setNewStaffPassword(e.target.value)} required />
                        </div>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                    >
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="NURSE">Nurse</option>
                        <option value="MANAGER">Manager</option>
                    </select>
                </div>
                
                <div className="flex justify-end pt-2">
                    <Button type="submit">Add Staff</Button>
                </div>
            </form>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Staff Member?"
        message={`Are you sure you want to remove ${staffToDelete?.name} from ${clinicName}? They will no longer be able to log in.`}
        confirmLabel="Remove Staff"
        variant="danger"
      />
    </Modal>
  );
};