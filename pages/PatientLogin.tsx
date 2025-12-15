
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Smartphone, ShieldCheck, Timer, ArrowRight, CheckCircle2, Heart, Activity, Calendar, User } from 'lucide-react';
import { Logo } from '../components/Logo';

interface PatientLoginProps {
  onLogin: (phone: string, name: string) => void;
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  pendingActionMessage?: string;
}

type LoginStep = 'PHONE' | 'OTP' | 'REGISTER';

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onBack, addToast, pendingActionMessage }) => {
  const [step, setStep] = useState<LoginStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration Form
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // Timer State
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const checkExistingUser = (phoneNumber: string) => {
    try {
        const data = localStorage.getItem(`clinicq_patient_${phoneNumber}`);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading profile", e);
    }
    return null;
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
        addToast("Please enter a valid 10-digit number", "error");
        return;
    }
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        setStep('OTP');
        setTimer(30);
        setCanResend(false);
        addToast(`OTP Sent to ${phone}`, "success");
    }, 800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
      e.preventDefault();
      if (otp.length !== 4) {
          addToast("Please enter 4-digit OTP", "error");
          return;
      }

      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          if (otp === '1234' || otp === '9999') {
              const existingProfile = checkExistingUser(phone);
              if (existingProfile) {
                  addToast(`Welcome back, ${existingProfile.name}!`, "success");
                  onLogin(phone, existingProfile.name);
              } else {
                  setStep('REGISTER');
              }
          } else {
              addToast("Invalid OTP. Try 1234.", "error");
          }
      }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      
      const newProfile = { name, phone, age, gender, familyMembers: [] };
      localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify(newProfile));
      addToast("Profile Created Successfully!", "success");
      onLogin(phone, name);
  };

  const handleAutoFill = () => {
      setPhone('9876543210');
      if (step === 'OTP') setOtp('1234');
  };

  const handleResend = () => {
      setTimer(30);
      setCanResend(false);
      addToast("OTP Resent!", "info");
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* --- LEFT PANEL (Desktop/Large Tablet) --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
         {/* Background Decor */}
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-primary-900 to-blue-900 blur-3xl opacity-40"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-purple-900 to-slate-800 blur-3xl opacity-40"></div>
         
         <div className="relative z-10">
             <div className="flex items-center gap-3 mb-12">
                 <Logo className="h-10 w-10" />
                 <span className="text-2xl font-bold tracking-tight">Smart<span className="text-primary-400">QFlow</span></span>
             </div>
             
             <h1 className="text-5xl font-extrabold leading-tight mb-6">
                 Skip the waiting room.<br/>
                 <span className="text-primary-400">Heal faster.</span>
             </h1>
             <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                 Join thousands of patients who book appointments, track live queues, and manage family health records in one place.
             </p>
         </div>

         {/* Feature Grid */}
         <div className="relative z-10 grid grid-cols-2 gap-6">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <Activity className="h-6 w-6 text-primary-400 mb-3" />
                 <h3 className="font-bold text-sm mb-1">Live Tracking</h3>
                 <p className="text-xs text-slate-400">Know exactly when your turn is.</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <Calendar className="h-6 w-6 text-purple-400 mb-3" />
                 <h3 className="font-bold text-sm mb-1">Instant Booking</h3>
                 <p className="text-xs text-slate-400">Book visits in under 30 seconds.</p>
             </div>
         </div>
      </div>

      {/* --- RIGHT PANEL (Form Area) --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2 bg-white relative">
         <button 
            onClick={onBack} 
            className="absolute top-6 left-6 lg:top-10 lg:left-10 p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-50"
         >
            <ArrowLeft className="h-6 w-6" />
         </button>

         <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center lg:text-left mb-10">
                <div className="inline-flex lg:hidden items-center gap-2 mb-6">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-slate-900">Smart<span className="text-primary-600">QFlow</span></span>
                </div>
                
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    {step === 'PHONE' ? 'Welcome' : step === 'OTP' ? 'Verify Mobile' : 'Setup Profile'}
                </h2>
                <p className="text-slate-500">
                    {step === 'PHONE' && "Enter your mobile number to get started."}
                    {step === 'OTP' && `We sent a code to +91 ${phone}`}
                    {step === 'REGISTER' && "Tell us a bit about yourself."}
                </p>
            </div>

            {/* Pending Action Banner */}
            {pendingActionMessage && step === 'PHONE' && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-blue-100 p-1.5 rounded-full"><Activity className="h-4 w-4 text-blue-600" /></div>
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-0.5">Almost there!</p>
                        {pendingActionMessage}
                    </div>
                </div>
            )}

            {/* STEP 1: PHONE */}
            {step === 'PHONE' && (
                <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 pr-3">+91</span>
                            <input 
                                className="w-full pl-16 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-bold text-xl tracking-wide transition-all text-slate-900 placeholder-slate-300"
                                placeholder="98765 43210" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                type="tel"
                                autoFocus
                            />
                            <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-0.5 transition-all" isLoading={loading} disabled={phone.length < 10}>
                        Get OTP <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>

                    <div className="text-center pt-4">
                        <button type="button" onClick={handleAutoFill} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-colors">
                            Tap to use demo number
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 2: OTP */}
            {step === 'OTP' && (
                <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-center gap-3 sm:gap-4">
                        <input 
                            className="w-full text-center text-4xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-slate-900"
                            placeholder="••••" 
                            maxLength={4}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            type="tel"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium">
                        <button type="button" onClick={() => setStep('PHONE')} className="text-slate-500 hover:text-slate-800 transition-colors">Wrong number?</button>
                        {canResend ? (
                            <button type="button" onClick={handleResend} className="text-primary-600 hover:text-primary-700">Resend Code</button>
                        ) : (
                            <span className="text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Timer className="h-3 w-3" /> {timer}s</span>
                        )}
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary-200" isLoading={loading} disabled={otp.length < 4}>
                        Verify & Continue
                    </Button>
                    
                    <div className="text-center">
                        <button type="button" onClick={() => setOtp('1234')} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-colors">
                            Auto-fill Demo Code
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 3: REGISTER */}
            {step === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-2 text-green-700 text-sm font-bold mb-6">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Mobile Number Verified</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                            <Input 
                                className="h-12 text-lg"
                                placeholder="e.g. Rahul Verma" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                                <Input 
                                    className="h-12 text-lg"
                                    type="number"
                                    placeholder="28" 
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Gender</label>
                                <div className="relative">
                                    <select 
                                        className="w-full h-12 rounded-xl border border-slate-300 px-3 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white font-medium"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary-200 mt-4" disabled={!name.trim() || !age}>
                        Complete Profile
                    </Button>
                </form>
            )}
         </div>
      </div>
    </div>
  );
};
