
import React, { useState } from 'react';
import { Staff } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, CheckCircle, XCircle, User, ShieldAlert, Phone, Briefcase } from 'lucide-react';

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
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="font-bold text-lg text-slate-800">Support Staff</h3>
            <p className="text-sm text-slate-500">Manage access for receptionists, nurses, and managers.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {staff.length > 0 ? (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Role</th>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {s.name.charAt(0)}
                                        </div>
                                        <div className="font-bold text-slate-900">{s.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 uppercase tracking-wide">
                                        <Briefcase className="h-3 w-3" /> {s.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600">
                                    {s.phone}
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => onUpdateStaff(s.id, { isActive: !s.isActive })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${s.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
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
                </div>
            )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Staff Member" maxWidth="max-w-md">
        <form onSubmit={handleAdd} className="space-y-4">
            <Input 
                label="Full Name"
                placeholder="e.g. Sarah Jones" 
                value={newStaffName} 
                onChange={e => setNewStaffName(e.target.value)} 
                required
            />
            <Input 
                label="Phone Number"
                placeholder="e.g. 9876543210" 
                value={newStaffPhone} 
                onChange={e => setNewStaffPhone(e.target.value)} 
                required
            />
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
            
            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-700 mt-4">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>New staff will be able to log in using their phone number. Ensure it is correct.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Add Staff</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};
