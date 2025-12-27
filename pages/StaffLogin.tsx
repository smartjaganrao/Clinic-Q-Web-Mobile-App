
import React, { useState } from 'react';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Stethoscope, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { storage } from '../services/storage';
import { useNavigate } from 'react-router-dom';

interface StaffLoginProps {
  onLoginSuccess: (role: UserRole, clinicId: string, userId: string) => void;
  onBack: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLoginSuccess, onBack }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          const result = await storage.authenticatePartner(email, password);
          
          if (result) {
              onLoginSuccess(result.role, result.clinicId, result.userId);
          } else {
              setError("Invalid email or password.");
          }
      } catch (err) {
          setError("An error occurred. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const handleFillDemo = (role: 'ADMIN' | 'RECEPTION' | 'DOCTOR' | 'KIOSK') => {
      if (role === 'ADMIN') { setEmail('arjun@smartqflow.com'); setPassword('password'); }
      if (role === 'RECEPTION') { setEmail('admin@demo.com'); setPassword('password'); }
      if (role === 'DOCTOR') { setEmail('ravi@demo.com'); setPassword('password'); }
      if (role === 'KIOSK') { setEmail('kiosk@demo.com'); setPassword('password'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-8">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="h-8 w-8 text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Partner Login</h1>
                <p className="text-slate-500 text-sm mt-1">Access for Doctors, Staff & Admins</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="user@clinic.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}

                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" isLoading={loading}>
                    Login <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <div className="text-center pt-2">
                    <button type="button" onClick={() => navigate('/setup')} className="text-sm text-primary-600 font-bold hover:underline">
                        Register New Clinic
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Demo Accounts</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => handleFillDemo('RECEPTION')} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-medium">Reception</button>
                    <button onClick={() => handleFillDemo('DOCTOR')} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-medium">Doctor</button>
                    <button onClick={() => handleFillDemo('ADMIN')} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-medium">Super Admin</button>
                    <button onClick={() => handleFillDemo('KIOSK')} className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">Kiosk Display</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
