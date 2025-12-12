
import React from 'react';
import { Clinic, Doctor, PlanType, Staff } from '../types';
import { Button } from '../components/Button';
import { RotateCcw, Settings, Bell, ShieldCheck } from 'lucide-react';
import { StatsCards } from '../features/admin/components/StatsCards';
import { ClinicsTable } from '../features/admin/components/ClinicsTable';
import { SUPER_ADMIN_PROFILE } from '../constants';

interface AdminDashboardProps {
    clinics: Clinic[];
    onUpdatePlan: (clinicId: string, plan: PlanType) => void;
    onToggleStatus: (clinicId: string) => void;
    onDeleteClinic: (clinicId: string) => void;
    onEditClinic: (clinicId: string, updates: Partial<Clinic>) => void;
    onResetSystem: () => void;
    // Staff Props
    onAddStaff?: (clinicId: string, staff: Staff) => void;
    onUpdateStaff?: (clinicId: string, staffId: string, updates: Partial<Staff>) => void;
    onDeleteStaff?: (clinicId: string, staffId: string) => void;
    // Doctor Props
    onAddDoctor?: (clinicId: string, doctor: Doctor) => void;
    onEditDoctor?: (clinicId: string, doctorId: string, updates: Partial<Doctor>) => void;
    onDeleteDoctor?: (clinicId: string, doctorId: string) => void;
    onCheckMasterDoctor?: (mobile: string) => Doctor | null;
    addToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    clinics, 
    onUpdatePlan, 
    onToggleStatus, 
    onDeleteClinic,
    onEditClinic,
    onResetSystem,
    onAddStaff,
    onUpdateStaff,
    onDeleteStaff,
    onAddDoctor,
    onEditDoctor,
    onDeleteDoctor,
    onCheckMasterDoctor,
    addToast
}) => {
    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {SUPER_ADMIN_PROFILE.name.split(' ')[0]}</h1>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-300">Super Admin</span>
                    </div>
                    <p className="text-slate-500">Manage your SaaS platform, subscriptions, and clinic partners.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-xl border border-slate-200 shadow-sm">
                    <img src={SUPER_ADMIN_PROFILE.avatarUrl} alt="Admin" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                    <div>
                        <p className="text-sm font-bold text-slate-900">{SUPER_ADMIN_PROFILE.name}</p>
                        <p className="text-xs text-slate-500">{SUPER_ADMIN_PROFILE.email}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100 mx-2"></div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-3 mb-8">
                <Button 
                    variant="danger" 
                    onClick={() => { if(window.confirm('WARNING: This will wipe all data and reset the system to default state. This action cannot be undone. Continue?')) onResetSystem() }} 
                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-none text-xs"
                >
                    <RotateCcw className="h-3 w-3 mr-2" /> Reset Demo Data
                </Button>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <ShieldCheck className="h-3 w-3" /> Secure Access • Last Login: {SUPER_ADMIN_PROFILE.lastLogin}
                </div>
            </div>

            <StatsCards clinics={clinics} />

            <ClinicsTable 
                clinics={clinics}
                onUpdatePlan={onUpdatePlan}
                onToggleStatus={onToggleStatus}
                onDeleteClinic={onDeleteClinic}
                onEditClinic={onEditClinic}
                onAddStaff={onAddStaff}
                onUpdateStaff={onUpdateStaff}
                onDeleteStaff={onDeleteStaff}
                onAddDoctor={onAddDoctor}
                onEditDoctor={onEditDoctor}
                onDeleteDoctor={onDeleteDoctor}
                onCheckMasterDoctor={onCheckMasterDoctor}
                addToast={addToast}
            />
        </div>
    );
};
