
import React from 'react';
import { ShieldCheck, Zap, Calendar, Star, ArrowRight } from 'lucide-react';

interface GuestLoginCardProps {
    onLoginClick?: () => void;
}

const Feature = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
        <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
            {icon}
        </div>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
);

export const GuestLoginCard: React.FC<GuestLoginCardProps> = ({ onLoginClick }) => (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck className="h-10 w-10 text-primary-600" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Sign in to continue
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-[260px]">
            Create a free account or log in to track visits, view history, and manage your profile.
        </p>

        {/* Feature pills */}
        <div className="w-full space-y-2 mb-8">
            <Feature icon={<Zap className="h-4 w-4" />} label="Join live queues remotely" />
            <Feature icon={<Calendar className="h-4 w-4" />} label="Book & manage appointments" />
            <Feature icon={<Star className="h-4 w-4" />} label="Rate doctors & track history" />
        </div>

        <button
            onClick={onLoginClick}
            className="w-full flex items-center justify-center gap-2 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base tracking-tight shadow-xl shadow-slate-200/80 active:scale-95 transition-all"
        >
            Login / Register
            <ArrowRight className="h-5 w-5" />
        </button>

        <p className="text-xs text-slate-400 mt-4 font-medium">
            Free · Secure · No spam
        </p>
    </div>
);
