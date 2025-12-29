import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../../../components/Button';

interface GuestLoginCardProps {
    onLoginClick?: () => void;
}

export const GuestLoginCard: React.FC<GuestLoginCardProps> = ({ onLoginClick }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
            <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Login Required</h3>
        <p className="text-slate-500 mb-8 max-w-xs">
            Please login to access your appointments and medical history.
        </p>
        <Button onClick={onLoginClick} size="lg" className="shadow-lg px-10">
            Login / Register
        </Button>
    </div>
);