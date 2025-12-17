
import React, { useState } from 'react';
import { Staff } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, CheckCircle, XCircle, User, ShieldAlert, Phone, Briefcase, Mail, Lock, ShieldCheck } from 'lucide-react';

interface StaffManagerProps {
  staff: Staff[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (id: string, updates: Partial<Staff>) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({ staff, onAddStaff, onUpdateStaff, onDeleteStaff }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'RECEPTIONIST' | 'NURSE' | 'MANAGER'>('RECEPTIONIST');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName && newStaffPhone && newStaffEmail && newStaffPassword) {
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
      
      // Reset
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffRole('RECEPTIONIST');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h3 className="font-bold text-lg text-slate-800">Clinic Staff Management</h3>
            <p className="text-sm text-slate-500">Create accounts for receptionists and nurses to access this dashboard.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add New Staff
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {staff.length > 0 ? (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Name & Role</th>
                            <th className="px-6 py-4">Credentials</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staff.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{s.name}</div>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide mt-0.5 ${s.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {s.role}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <Mail className="h-3.5 w-3.5 text-slate-400" /> {s.email || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                            <Lock className="h-3 w-3" /> ••••••••
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600">
                                    {s.phone}
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => onUpdateStaff(s.id, { isActive: !s.isActive })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${s.isActive ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                                    >
                                        {s.isActive ? (
                                            <><CheckCircle className="h-3.5 w-3.5" /> Active</>
                                        ) : (
                                            <><XCircle className="h-3.5 w-3.5" /> Disabled</>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => { if(window.confirm('Permanently remove this staff member?')) onDeleteStaff(s.id) }} 
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Staff"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <User className="h-12 w-12 mb-4 opacity-20" />
                    <p>No staff members added yet.</p>
                    <p className="text-sm">Add receptionists to help manage the queue.</p>
                </div>
            )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Staff Account" maxWidth="max-w-md">
        <form onSubmit={handleAdd} className="space-y-5">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-bold">Access Credentials</p>
                    <p className="opacity-80">These details will be used to log in to the Clinic Portal.</p>
                </div>
            </div>

            <div className="space-y-4">
                <Input 
                    label="Full Name"
                    placeholder="e.g. Sarah Jones" 
                    value={newStaffName} 
                    onChange={e => setNewStaffName(e.target.value)} 
                    required
                />
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Input 
                        label="Phone"
                        placeholder="9876543210" 
                        value={newStaffPhone} 
                        onChange={e => setNewStaffPhone(e.target.value)} 
                        required
                    />
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Login Details</label>
                    <div className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="email" 
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Email Address" 
                                value={newStaffEmail} 
                                onChange={e => setNewStaffEmail(e.target.value)} 
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="password" 
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Set Password" 
                                value={newStaffPassword} 
                                onChange={e => setNewStaffPassword(e.target.value)} 
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Account</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};
