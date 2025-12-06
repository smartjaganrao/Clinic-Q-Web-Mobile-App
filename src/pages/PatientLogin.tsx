import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ArrowLeft, Smartphone, ShieldCheck, User, FlaskConical, AlertCircle, KeyRound, Timer, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PatientLoginProps {
  onLogin: (phone: string, name: string) => void;
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  pendingActionMessage?: string;
  // New prop to receive guest booking info
  pendingBookingDetails?: {
      name: string;
      age: string;
      gender: string;
  };
}

type LoginStep = 'PHONE' | 'OTP' | 'REGISTER';

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onBack, addToast, pendingActionMessage, pendingBookingDetails }) => {
  const [step, setStep] = useState<LoginStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration Form (Auto-filled if pendingBookingDetails exists)
  const [name, setName] = useState(pendingBookingDetails?.name || '');
  const [age, setAge] = useState(pendingBookingDetails?.age || '');
  const [gender, setGender] = useState(pendingBookingDetails?.gender || 'Male');

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

  // Update local state if props change (e.g. navigating back and forth)
  useEffect(() => {
      if (pendingBookingDetails) {
          setName(pendingBookingDetails.name);
          setAge(pendingBookingDetails.age);
          setGender(pendingBookingDetails.gender);
      }
  }, [pendingBookingDetails]);

  const checkExistingUser = (phoneNumber: string) => {
    try {
        const data = localStorage.getItem(`clinicq_patient_${phoneNumber}`);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed;
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
    // Simulate API Call
    setTimeout(() => {
        setLoading(false);
        setStep('OTP');
        setTimer(30);
        setCanResend(false);
        addToast(`OTP Sent to ${phone}`, "success");
    }, 800);
  };

  const autoRegisterUser = () => {
      // Use state values which might be populated from props or user input
      const newProfile = {
          name: name || pendingBookingDetails?.name || 'Guest',
          phone,
          age: age || pendingBookingDetails?.age,
          gender: gender || pendingBookingDetails?.gender || 'Male',
          familyMembers: []
      };
      
      localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify(newProfile));
      
      // Trigger login which will execute the pending booking in App.tsx
      onLogin(phone, newProfile.name); 
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
                  // User ALREADY exists.
                  // We prioritize the existing profile and DO NOT overwrite it with guest details.
                  addToast(`Welcome back, ${existingProfile.name}!`, "success");
                  onLogin(phone, existingProfile.name);
              } else {
                  // New User - Safe to register
                  if (pendingBookingDetails && pendingBookingDetails.name) {
                      autoRegisterUser();
                  } else {
                      setStep('REGISTER');
                  }
              }
          } else {
              addToast("Invalid OTP. Try 1234.", "error");
          }
      }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      
      const newProfile = {
          name,
          phone,
          age,
          gender,
          familyMembers: []
      };

      // Save to storage
      localStorage.setItem(`clinicq_patient_${phone}`, JSON.stringify(newProfile));
      
      addToast("Profile Created Successfully!", "success");
      onLogin(phone, name);
  };

  const handleAutoFill = () => {
      setPhone('9876543210');
      // If we are in OTP step, autofill OTP too
      if (step === 'OTP') {
          setOtp('1234');
      }
  };

  const handleResend = () => {
      setTimer(30);
      setCanResend(false);
      addToast("OTP Resent!", "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-8 text-slate-500" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>

        <div className="text-center mb-8">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4 relative">
                <Smartphone className="h-8 w-8 text-primary-600" />
                {step === 'OTP' && <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white"><ShieldCheck className="h-3 w-3 text-white" /></div>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Patient Login</h1>
            <p className="text-slate-500">
                {step === 'PHONE' && "Enter mobile to verify and book"}
                {step === 'OTP' && `Verify +91 ${phone}`}
                {step === 'REGISTER' && "Complete your profile"}
            </p>
        </div>

        {/* Pending Action Banner */}
        {pendingActionMessage && step === 'PHONE' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong>Note:</strong> {pendingActionMessage}
                </div>
            </div>
        )}

        <Card className="p-8 shadow-xl border-0 relative overflow-hidden">
            {/* STEP 1: PHONE */}
            {step === 'PHONE' && (
                <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
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
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading} disabled={phone.length < 10}>
                        Get OTP <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>

                    <div className="mt-4 text-center">
                        <button type="button" onClick={handleAutoFill} className="text-xs text-slate-400 hover:text-primary-600 underline">
                            Use Test Number
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 2: OTP */}
            {step === 'OTP' && (
                <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="text-center mb-2">
                        <p className="text-sm text-slate-500 mb-4">Enter the 4-digit code sent to your mobile.</p>
                        <div className="flex justify-center gap-4">
                            <input 
                                className="w-full text-center text-3xl font-bold tracking-[1em] py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                placeholder="••••" 
                                maxLength={4}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                type="text"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <button type="button" onClick={() => setStep('PHONE')} className="text-slate-400 hover:text-slate-600">Change Number</button>
                        {canResend ? (
                            <button type="button" onClick={handleResend} className="text-primary-600 font-bold hover:underline">Resend OTP</button>
                        ) : (
                            <span className="text-slate-400 flex items-center gap-1"><Timer className="h-3 w-3" /> 00:{timer.toString().padStart(2, '0')}</span>
                        )}
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading} disabled={otp.length < 4}>
                        Verify & {pendingBookingDetails ? 'Confirm Booking' : 'Login'}
                    </Button>

                    <div className="mt-2 text-center">
                        <button type="button" onClick={() => setOtp('1234')} className="text-xs text-slate-400 hover:text-primary-600 underline">
                            Auto-fill OTP (1234)
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 3: REGISTER (Skipped if auto-register) */}
            {step === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold mb-2">
                            <CheckCircle2 className="h-3 w-3" /> Number Verified
                        </div>
                        <h2 className="font-bold text-slate-800">One last step!</h2>
                    </div>
                    
                    <Input 
                        label="Full Name" 
                        placeholder="e.g. Rahul Verma" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Age" 
                            type="number"
                            placeholder="28" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                            <select 
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-primary-500 focus:border-primary-500"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <Button type="submit" className="w-full h-12 text-lg mt-2" disabled={!name.trim() || !age}>
                        Complete Registration
                    </Button>
                </form>
            )}
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
            By logging in, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
};