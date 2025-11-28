import React from 'react';
import { UserRole } from '../../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Stethoscope, LayoutDashboard, Monitor, ShieldCheck, ArrowRight } from 'lucide-react';

interface StaffLoginProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSelectRole, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Clinic Partner Login</h1>
          <p className="text-slate-500 text-lg">Select your workspace to access your dashboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Reception / Admin */}
            <div 
              onClick={() => onSelectRole(UserRole.RECEPTIONIST)}
              className="group bg-white hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="h-14 w-14 bg-blue-50 group-hover:bg-white/10 rounded-xl flex items-center justify-center text-blue-600 group-hover:text-white mb-6 transition-colors">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-white">Admin & Front Desk</h3>
              <p className="text-slate-500 text-sm group-hover:text-slate-400">
                Manage patients, appointments, and billing.
              </p>
              <div className="mt-6 flex items-center text-blue-600 group-hover:text-white font-medium text-sm">
                Login <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>

            {/* Doctor */}
            <div 
              onClick={() => onSelectRole(UserRole.DOCTOR)}
              className="group bg-white hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="h-14 w-14 bg-green-50 group-hover:bg-white/10 rounded-xl flex items-center justify-center text-green-600 group-hover:text-white mb-6 transition-colors">
                <Stethoscope className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-white">Doctor Console</h3>
              <p className="text-slate-500 text-sm group-hover:text-slate-400">
                View patient history and consultation tools.
              </p>
              <div className="mt-6 flex items-center text-green-600 group-hover:text-white font-medium text-sm">
                Login <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>

            {/* Kiosk */}
            <div 
              onClick={() => onSelectRole(UserRole.KIOSK)}
              className="group bg-white hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="h-14 w-14 bg-orange-50 group-hover:bg-white/10 rounded-xl flex items-center justify-center text-orange-600 group-hover:text-white mb-6 transition-colors">
                <Monitor className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-white">TV Display Mode</h3>
              <p className="text-slate-500 text-sm group-hover:text-slate-400">
                Launch big screen token display for waiting rooms.
              </p>
              <div className="mt-6 flex items-center text-orange-600 group-hover:text-white font-medium text-sm">
                Launch <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>

            {/* Super Admin (Hidden/Optional) */}
            <div 
              onClick={() => onSelectRole(UserRole.ADMIN)}
              className="group bg-white hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="h-14 w-14 bg-slate-50 group-hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-white mb-6 transition-colors">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-white">System Admin</h3>
              <p className="text-slate-500 text-sm group-hover:text-slate-400">
                Manage clinic subscription and settings.
              </p>
              <div className="mt-6 flex items-center text-slate-600 group-hover:text-white font-medium text-sm">
                Login <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">
                Need help logging in? <a href="#" className="text-primary-600 hover:underline">Contact Support</a>
            </p>
        </div>
      </div>
    </div>
  );
};