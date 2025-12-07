
import React, { useState } from 'react';
import { Clinic, PlanType } from '../../../types';
import { Search, Edit2, Trash2, Power, AlertCircle, CheckCircle, CreditCard, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';

interface ClinicsTableProps {
  clinics: Clinic[];
  onUpdatePlan: (clinicId: string, plan: PlanType) => void;
  onToggleStatus: (clinicId: string) => void;
  onDeleteClinic: (clinicId: string) => void;
  onEditClinic: (clinicId: string, updates: Partial<Clinic>) => void;
}

export const ClinicsTable: React.FC<ClinicsTableProps> = ({
  clinics, onUpdatePlan, onToggleStatus, onDeleteClinic, onEditClinic
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editModal, setEditModal] = useState<{ isOpen: boolean; clinic: Clinic | null }>({ isOpen: false, clinic: null });
    const [planModal, setPlanModal] = useState<{ isOpen: boolean; clinic: Clinic | null }>({ isOpen: false, clinic: null });

    const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editModal.clinic) {
            const { id, name, city, address } = editModal.clinic;
            onEditClinic(id, { name, city, address });
            setEditModal({ isOpen: false, clinic: null });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Registered Clinics</h2>
                <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search clinics..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500"><tr><th className="px-6 py-3 font-semibold">Clinic Name</th><th className="px-6 py-3 font-semibold">Plan</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold">Doctors / Patients</th><th className="px-6 py-3 font-semibold">Location</th><th className="px-6 py-3 font-semibold text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredClinics.map(clinic => (
                        <tr key={clinic.id} className="hover:bg-slate-50 group">
                            <td className="px-6 py-4"><div className="font-bold text-slate-900">{clinic.name}</div><div className="text-xs text-slate-500">ID: {clinic.id}</div></td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold border ${clinic.plan === PlanType.PREMIUM ? 'bg-purple-50 text-purple-700 border-purple-200' : clinic.plan === PlanType.SMALL ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{clinic.plan}</span></td>
                            <td className="px-6 py-4"><span className={`flex items-center gap-1 text-xs font-bold ${clinic.subscriptionStatus === 'SUSPENDED' ? 'text-red-600' : 'text-green-600'}`}>{clinic.subscriptionStatus === 'SUSPENDED' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}{clinic.subscriptionStatus || 'ACTIVE'}</span></td>
                            <td className="px-6 py-4 text-slate-600">{clinic.doctors.length} Docs • {clinic.patients.length} Pts</td>
                            <td className="px-6 py-4 text-slate-600">{clinic.city}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditModal({isOpen: true, clinic})} className="p-2 hover:bg-slate-100 rounded text-slate-500" title="Edit Details"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => setPlanModal({isOpen: true, clinic})} className="p-2 hover:bg-blue-50 rounded text-blue-600" title="Manage Plan"><CreditCard className="h-4 w-4" /></button>
                                    <button onClick={() => onToggleStatus(clinic.id)} className={`p-2 hover:bg-slate-100 rounded ${clinic.subscriptionStatus === 'SUSPENDED' ? 'text-green-600' : 'text-orange-600'}`} title={clinic.subscriptionStatus === 'SUSPENDED' ? 'Activate' : 'Suspend'}><Power className="h-4 w-4" /></button>
                                    <button onClick={() => { if(window.confirm('Delete Clinic permanently?')) onDeleteClinic(clinic.id) }} className="p-2 hover:bg-red-50 rounded text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({isOpen: false, clinic: null})} title="Edit Clinic Details">
                {editModal.clinic && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <Input label="Clinic Name" value={editModal.clinic.name} onChange={e => setEditModal({...editModal, clinic: {...editModal.clinic!, name: e.target.value}})} />
                        <Input label="City" value={editModal.clinic.city} onChange={e => setEditModal({...editModal, clinic: {...editModal.clinic!, city: e.target.value}})} />
                        <Input label="Address" value={editModal.clinic.address} onChange={e => setEditModal({...editModal, clinic: {...editModal.clinic!, address: e.target.value}})} />
                        <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                )}
            </Modal>
            <Modal isOpen={planModal.isOpen} onClose={() => setPlanModal({isOpen: false, clinic: null})} title="Manage Subscription">
                {planModal.clinic && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 mb-4">Change plan for <strong>{planModal.clinic.name}</strong></p>
                        {[PlanType.SOLO, PlanType.SMALL, PlanType.PREMIUM].map(plan => (
                            <button key={plan} onClick={() => { onUpdatePlan(planModal.clinic!.id, plan); setPlanModal({isOpen: false, clinic: null}); }} className={`w-full p-4 rounded-lg border text-left flex justify-between items-center hover:border-primary-500 transition-colors ${planModal.clinic?.plan === plan ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}><span className="font-medium">{plan}</span>{planModal.clinic?.plan === plan && <CheckCircle className="h-5 w-5 text-primary-600" />}</button>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};
