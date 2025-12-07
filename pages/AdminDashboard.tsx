
import React from 'react';
import { Clinic, PlanType } from '../types';
import { Button } from '../components/Button';
import { RotateCcw } from 'lucide-react';
import { StatsCards } from '../features/admin/components/StatsCards';
import { ClinicsTable } from '../features/admin/components/ClinicsTable';

interface AdminDashboardProps {
    clinics: Clinic[];
    onUpdatePlan: (clinicId: string, plan: PlanType) => void;
    onToggleStatus: (clinicId: string) => void;
    onDeleteClinic: (clinicId: string) => void;
    onEditClinic: (clinicId: string, updates: Partial<Clinic>) => void;
    onResetSystem: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    clinics, 
    onUpdatePlan, 
    onToggleStatus, 
    onDeleteClinic,
    onEditClinic,
    onResetSystem
}) => {
    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
                    <p className="text-slate-500">Manage clinics, subscriptions, and global settings.</p>
                </div>
                <Button 
                    variant="danger" 
                    onClick={() => { if(window.confirm('WARNING: This will wipe all data and reset the system to default state. This action cannot be undone. Continue?')) onResetSystem() }} 
                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                >
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset System
                </Button>
            </div>

            <StatsCards clinics={clinics} />

            <ClinicsTable 
                clinics={clinics}
                onUpdatePlan={onUpdatePlan}
                onToggleStatus={onToggleStatus}
                onDeleteClinic={onDeleteClinic}
                onEditClinic={onEditClinic}
            />
        </div>
    );
};
