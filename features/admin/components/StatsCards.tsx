
import React from 'react';
import { Card } from '../../../components/Card';
import { TrendingUp, Building, Users, Activity } from 'lucide-react';
import { Clinic, PlanType } from '../../../types';

interface StatsCardsProps {
  clinics: Clinic[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ clinics }) => {
    const totalRevenue = clinics.reduce((acc, c) => {
        const price = c.plan === PlanType.PREMIUM ? 4499 : c.plan === PlanType.SMALL ? 2499 : 999;
        return acc + price;
    }, 0);
    const totalPatients = clinics.reduce((acc, c) => acc + c.patients.length, 0);
    const activeClinics = clinics.filter(c => c.subscriptionStatus !== 'SUSPENDED').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-5 flex items-center justify-between border-blue-100 bg-blue-50/50"><div><p className="text-sm font-medium text-blue-600">Total Revenue (MRR)</p><p className="text-3xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</p></div><div className="p-3 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="h-6 w-6" /></div></Card>
            <Card className="p-5 flex items-center justify-between border-green-100 bg-green-50/50"><div><p className="text-sm font-medium text-green-600">Active Clinics</p><p className="text-3xl font-bold text-slate-900">{activeClinics} <span className="text-sm font-normal text-slate-400">/ {clinics.length}</span></p></div><div className="p-3 bg-green-100 rounded-lg text-green-600"><Building className="h-6 w-6" /></div></Card>
            <Card className="p-5 flex items-center justify-between border-purple-100 bg-purple-50/50"><div><p className="text-sm font-medium text-purple-600">Total Patients</p><p className="text-3xl font-bold text-slate-900">{totalPatients.toLocaleString()}</p></div><div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Users className="h-6 w-6" /></div></Card>
            <Card className="p-5 flex items-center justify-between border-orange-100 bg-orange-50/50"><div><p className="text-sm font-medium text-orange-600">System Health</p><p className="text-3xl font-bold text-slate-900">100%</p></div><div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Activity className="h-6 w-6" /></div></Card>
        </div>
    );
};
