import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ArrowLeft, Smartphone, Lock, ShieldCheck, User, FlaskConical } from 'lucide-react';

interface PatientLoginProps {
  onLogin: (phone: string, name: string) => void;
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onBack, addToast }) => {
  const [step, setStep] = useState<'LOGIN' | 'NAME'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  const handleAutoFill = () => {
    setPhone('9876543210');
    setPassword('test1234');
    addToast("Test credentials filled!", "info");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
        addToast("Please enter a valid mobile number", "error");
        return;
    }
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setLoading(false);
        
        const existingName = checkExistingUser(phone);
        
        if (existingName) {
            // User exists, log them in
            onLogin(phone, existingName);
        } else {
            // Special case for Test User - Auto Register
            if (phone === '9876543210') {
                const testName = "Rahul Verma";
                localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify({
                    name: testName,
                    phone,
                    familyMembers: []
                }));
                onLogin(phone, testName);
            } else {
                // New user, ask for name
                setStep('NAME');
            }
        }
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      
      // Save profile
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
            <p className="text-slate-500">Access appointments & records.</p>
        </div>

        <Card className="p-8 shadow-xl border-0">
            {step === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <Input 
                            label="Mobile Number" 
                            placeholder="9876543210" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            type="tel"
                            autoFocus
                        />
                        <Input 
                            label="Password" 
                            placeholder="••••••••" 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading} disabled={phone.length < 10}>
                        Login Securely
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">Testing?</span>
                        </div>
                    </div>

                    <Button 
                        type="button" 
                        variant="secondary" 
                        className="w-full border-dashed border-primary-300 text-primary-700 hover:bg-primary-50"
                        onClick={handleAutoFill}
                    >
                        <FlaskConical className="h-4 w-4 mr-2" /> Auto-fill Test User
                    </Button>
                </form>
            )}

            {step === 'NAME' && (
                <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-2">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 mb-4">
                            <ShieldCheck className="h-3 w-3" /> Mobile Verified
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">What's your name?</h2>
                        <p className="text-sm text-slate-500">Creating new profile for {phone}</p>
                    </div>
                    
                    <Input 
                        label="Full Name" 
                        placeholder="e.g. Rahul Verma" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    
                    <Button type="submit" className="w-full" disabled={!name.trim()}>
                        Create Profile <User className="h-4 w-4 ml-2" />
                    </Button>
                </form>
            )}
        </Card>
      </div>
    </div>
  );
};