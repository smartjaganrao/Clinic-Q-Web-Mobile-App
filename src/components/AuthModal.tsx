
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { ShieldCheck, Timer, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, name: string) => void;
  initialName?: string;
  initialAge?: string;
  initialGender?: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type Step = 'PHONE' | 'OTP' | 'REGISTER';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, onClose, onSuccess, initialName, initialAge, initialGender, addToast 
}) => {
  const [step, setStep] = useState<Step>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  
  // Registration Data
  const [name, setName] = useState(initialName || '');
  const [age, setAge] = useState(initialAge || '');
  const [gender, setGender] = useState(initialGender || 'Male');

  useEffect(() => {
    if (isOpen) {
        setStep('PHONE');
        setPhone('');
        setOtp('');
        setName(initialName || '');
        setAge(initialAge || '');
        setGender(initialGender || 'Male');
    }
  }, [isOpen, initialName, initialAge, initialGender]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
        addToast("Enter valid 10-digit mobile", "error");
        return;
    }
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        setStep('OTP');
        setTimer(30);
        addToast(`OTP sent to ${phone}`, "success");
    }, 800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        if (otp === '1234' || otp === '9999') {
            // Check existing
            try {
                const existing = localStorage.getItem(`clinicq_patient_${phone}`);
                if (existing) {
                    const profile = JSON.parse(existing);
                    // Login existing user
                    onSuccess(phone, profile.name); 
                } else {
                    // New user -> Register using provided details
                    if (name && age) {
                        saveAndLogin();
                    } else {
                        setStep('REGISTER'); // Ask details if missing
                    }
                }
            } catch {
                setStep('REGISTER');
            }
        } else {
            addToast("Invalid OTP (Use 1234)", "error");
        }
    }, 800);
  };

  const saveAndLogin = () => {
      const profile = { name, phone, age, gender, familyMembers: [] };
      localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify(profile));
      onSuccess(phone, name);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">
                {step === 'PHONE' ? 'Login or Register' : step === 'OTP' ? 'Verify Mobile' : 'Complete Profile'}
            </h3>
            <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-6">
            {step === 'PHONE' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">Enter your mobile number to confirm your booking securely.</p>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium border-r border-slate-300 pr-2">+91</span>
                        <input 
                            className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-medium text-lg tracking-wide"
                            placeholder="98765 43210" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            type="tel"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading} disabled={phone.length < 10}>
                        Get OTP <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <div className="text-center">
                        <button type="button" onClick={() => setPhone('9876543210')} className="text-xs text-primary-600 hover:underline">Use Test Number</button>
                    </div>
                </form>
            )}

            {step === 'OTP' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="text-center mb-2">
                        <p className="text-sm text-slate-500 mb-4">Code sent to +91 {phone}</p>
                        <input 
                            className="w-full text-center text-3xl font-bold tracking-[1em] py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="••••" 
                            maxLength={4}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <button type="button" onClick={() => setStep('PHONE')} className="text-slate-400 hover:text-slate-600">Change Number</button>
                        <span className="text-slate-400 flex items-center gap-1"><Timer className="h-3 w-3" /> 00:{timer.toString().padStart(2, '0')}</span>
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading} disabled={otp.length < 4}>Verify & Confirm</Button>
                    <div className="text-center">
                        <button type="button" onClick={() => setOtp('1234')} className="text-xs text-primary-600 hover:underline">Auto-fill 1234</button>
                    </div>
                </form>
            )}

            {step === 'REGISTER' && (
                <form onSubmit={(e) => { e.preventDefault(); saveAndLogin(); }} className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold mb-2">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                        </div>
                    </div>
                    <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg mt-2" disabled={!name || !age}>Complete Booking</Button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
