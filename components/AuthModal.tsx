import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { ShieldCheck, Mail, Lock, User, ArrowRight, X, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, name: string, isExisting: boolean) => void;
  initialName?: string;
  initialAge?: string;
  initialGender?: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, onClose, onSuccess, initialName, initialAge, initialGender, addToast 
}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState(initialAge || '');
  const [gender, setGender] = useState(initialGender || 'Male');

  useEffect(() => {
    if (isOpen) {
        setMode('LOGIN');
        setEmail('');
        setPassword('');
        setName(initialName || '');
        setAge(initialAge || '');
        setGender(initialGender || 'Male');
    }
  }, [isOpen, initialName, initialAge, initialGender]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check local storage (Consistent with PatientLogin.tsx)
    setTimeout(() => {
        const storedUser = localStorage.getItem(`clinicq_patient_${email}`);
        if (!storedUser) {
            addToast("Account not found. Please register.", "error");
            setLoading(false);
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.password !== password) {
            addToast("Invalid password.", "error");
            setLoading(false);
            return;
        }

        addToast(`Welcome back, ${user.name}!`, "success");
        onSuccess(user.phone, user.name, true);
        setLoading(false);
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !age) {
        addToast("Please fill all required fields", "error");
        return;
    }

    setLoading(true);
    setTimeout(() => {
        if (localStorage.getItem(`clinicq_patient_${email}`)) {
            addToast("User already exists. Please sign in.", "error");
            setMode('LOGIN');
            setLoading(false);
            return;
        }

        const newUser = {
            name,
            email,
            phone,
            password,
            age,
            gender,
            isVerified: true, // Auto-verify for guest booking convenience in demo
            joined: Date.now()
        };

        localStorage.setItem(`clinicq_patient_${email}`, JSON.stringify(newUser));
        addToast("Account created successfully!", "success");
        onSuccess(newUser.phone, newUser.name, false);
        setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-slate-800">
                    Patient Authentication
                </h3>
            </div>
            <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-6">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                    onClick={() => setMode('LOGIN')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LogIn className="h-4 w-4" /> Sign In
                </button>
                <button 
                    onClick={() => setMode('REGISTER')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserPlus className="h-4 w-4" /> Register
                </button>
            </div>

            {mode === 'LOGIN' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">Please sign in to confirm your booking.</p>
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Email Address" 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Password" 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold" isLoading={loading}>
                        Continue Booking <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar pb-2">
                        <Input label="Full Name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Email" placeholder="john@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            <Input label="Mobile" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Age" type="number" value={age} onChange={e => setAge(e.target.value)} required />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-primary-500" value={gender} onChange={e => setGender(e.target.value)}>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                        </div>

                        <Input label="Set Password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" isLoading={loading}>
                        Register & Book
                    </Button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};