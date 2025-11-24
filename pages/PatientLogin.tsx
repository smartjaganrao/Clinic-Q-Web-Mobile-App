import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ArrowLeft, Smartphone, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface PatientLoginProps {
  onLogin: (phone: string, name: string) => void;
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onBack, addToast }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'NAME'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user exists in local storage when phone changes
  const checkExistingUser = (phoneNumber: string) => {
    const data = localStorage.getItem(`clinicq_patient_${phoneNumber}`);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.name || '';
    }
    return '';
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
        addToast("Please enter a valid mobile number", "error");
        return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        setStep('OTP');
        // Pre-fill OTP for demo convenience
        setOtp('1234'); 
        addToast("OTP Sent: 1234", "info");
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        if (otp === '1234') {
            const existingName = checkExistingUser(phone);
            if (existingName) {
                // User exists, log them in
                onLogin(phone, existingName);
            } else {
                // New user, ask for name
                setStep('NAME');
            }
        } else {
            addToast("Invalid OTP. Try 1234.", "error");
        }
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name) return;
      // Save initial empty profile to establish user
      localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify({
          name,
          phone,
          familyMembers: []
      }));
      onLogin(phone, name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-8 text-slate-500" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>

        <div className="text-center mb-8">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                <Smartphone className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Patient Login</h1>
            <p className="text-slate-500">Access your appointments and family records.</p>
        </div>

        <Card className="p-8 shadow-xl border-0">
            {step === 'PHONE' && (
                <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Input 
                        label="Mobile Number" 
                        placeholder="9876543210" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        type="tel"
                        autoFocus
                    />
                    <Button type="submit" className="w-full" isLoading={loading} disabled={phone.length < 10}>
                        Send OTP <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <p className="text-xs text-center text-slate-400">
                        By continuing, you agree to our Terms & Privacy Policy.
                    </p>
                </form>
            )}

            {step === 'OTP' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-4">
                        <p className="text-sm text-slate-500">Enter OTP sent to +91 {phone}</p>
                        <button type="button" onClick={() => setStep('PHONE')} className="text-xs text-primary-600 font-medium hover:underline mt-1">Change Number</button>
                    </div>
                    <div className="flex justify-center">
                        <input 
                            type="text" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="text-center text-2xl font-bold tracking-widest w-32 border-b-2 border-slate-300 focus:border-primary-500 focus:outline-none py-2"
                            placeholder="••••"
                            maxLength={4}
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full" isLoading={loading}>
                        Verify & Login <ShieldCheck className="h-4 w-4 ml-2" />
                    </Button>
                    <div className="text-center">
                        <button type="button" className="text-xs text-slate-400 hover:text-slate-600">Resend OTP in 30s</button>
                    </div>
                </form>
            )}

            {step === 'NAME' && (
                <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-2">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 mb-4">
                            <ShieldCheck className="h-3 w-3" /> Verified
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">What's your name?</h2>
                        <p className="text-sm text-slate-500">Let's set up your profile.</p>
                    </div>
                    
                    <Input 
                        label="Full Name" 
                        placeholder="e.g. Rahul Verma" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    
                    <Button type="submit" className="w-full" disabled={!name.trim()}>
                        Complete Setup <User className="h-4 w-4 ml-2" />
                    </Button>
                </form>
            )}
        </Card>
      </div>
    </div>
  );
};