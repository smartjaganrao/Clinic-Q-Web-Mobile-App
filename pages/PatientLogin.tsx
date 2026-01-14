
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { authService } from '../services/authService';
import { UserRole } from '../types';

interface PatientLoginProps {
  onLogin: (phone: string, name: string) => void;
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  pendingActionMessage?: string;
}

type View = 'LOGIN' | 'REGISTER' | 'VERIFY';

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onBack, addToast, pendingActionMessage }) => {
  const [view, setView] = useState<View>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        const result = await authService.login({ email, password });
        if (result.success && result.user) {
          addToast(`Welcome back, ${result.user.name}!`, "success");
          // Use phone from user profile, fallback to email if no phone
          const userPhone = result.user.phone || email;
          onLogin(userPhone, result.user.name);
          return;
        }
        addToast(result.error || "Login failed", "error");
      } catch (error) {
        addToast("Login error: " + (error instanceof Error ? error.message : "Unknown error"), "error");
      } finally {
        setIsLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (password !== confirmPassword) {
          addToast("Passwords do not match", "error");
          return;
      }

      setIsLoading(true);
      try {
        const result = await authService.signup({
          email,
          password,
          name,
          phone,
          role: UserRole.PATIENT
        });

        if (result.success && result.user) {
          addToast(`Welcome, ${result.user.name}!`, "success");
          // Use phone from user profile, fallback to email if no phone
          const userPhone = result.user.phone || email;
          onLogin(userPhone, result.user.name);
          return;
        } else if (result.success && result.requiresConfirmation) {
          setView('VERIFY');
          addToast("Account created! Check your email.", "success");
          return;
        }
        addToast(result.error || "Registration failed", "error");
      } catch (error) {
        addToast("Registration error: " + (error instanceof Error ? error.message : "Unknown error"), "error");
      } finally {
        setIsLoading(false);
      }
  };

  const handleVerify = async () => {
      setIsLoading(true);
      try {
        // Email verification happens via Supabase link (check email)
        addToast("Check your email for verification link", "info");
        // After user clicks link, they can login
        setTimeout(() => setView('LOGIN'), 3000);
      } finally {
        setIsLoading(false);
      }
  };

  const fillDemoPatient = () => {
      setEmail('demo@patient.com');
      setPassword('Demo@123456');
      addToast("Demo credentials filled (signup or use existing)", "info");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left Panel (Marketing) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-primary-900 to-blue-900 blur-3xl opacity-40"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-purple-900 to-slate-800 blur-3xl opacity-40"></div>
         
         <div className="relative z-10">
             <div className="flex items-center gap-3 mb-12">
                 <Logo className="h-10 w-10" />
                 <span className="text-2xl font-bold tracking-tight">Smart<span className="text-primary-400">QFlow</span></span>
             </div>
             <h1 className="text-5xl font-extrabold leading-tight mb-6">
                 Your Health Journey,<br/>
                 <span className="text-primary-400">Simplified.</span>
             </h1>
             <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                 Securely manage appointments, track live queues, and keep your family's health records in one place.
             </p>
         </div>
      </div>

      {/* Right Panel (Forms) */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2 bg-white relative">
         <button onClick={onBack} className="absolute top-6 left-6 lg:top-10 lg:left-10 p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-50">
            <ArrowLeft className="h-6 w-6" />
         </button>

         <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {view === 'LOGIN' ? 'Welcome Back' : view === 'REGISTER' ? 'Create Account' : 'Verify Email'}
                </h2>
                <p className="text-slate-500 text-sm">
                    {view === 'LOGIN' ? "Enter your credentials to access your account." : view === 'REGISTER' ? "Join thousands of patients today." : "We've sent a link to your inbox."}
                </p>
            </div>

            {pendingActionMessage && view === 'LOGIN' && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{pendingActionMessage}</p>
                </div>
            )}

            {view === 'LOGIN' && (
                <div className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input 
                                    type="email" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-bold text-primary-600 hover:underline">Forgot?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input 
                                    type="password" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary-200">
                            {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <div className="text-center text-sm text-slate-500 mt-4">
                            Don't have an account? <button type="button" onClick={() => setView('REGISTER')} className="text-primary-600 font-bold hover:underline">Sign Up</button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-slate-100">
                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Testing Access</p>
                        <div className="flex justify-center">
                            <button 
                                onClick={fillDemoPatient}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all group"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-primary-500 group-hover:animate-pulse" />
                                Demo: demo@patient.com
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Mobile Number</label>
                        <input type="tel" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                        <input type="email" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
                            <input type="password" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase">Confirm</label>
                            <input type="password" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold rounded-xl mt-2">
                      {isLoading ? 'Creating...' : 'Create Account'}
                    </Button>
                    <div className="text-center text-sm text-slate-500">
                        Already have an account? <button type="button" onClick={() => setView('LOGIN')} className="text-primary-600 font-bold hover:underline">Sign In</button>
                    </div>
                </form>
            )}

            {view === 'VERIFY' && (
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Verify your email</h3>
                        <p className="text-slate-500 mt-2 text-sm">
                            We've sent a verification link to <br/>
                            <span className="font-bold text-slate-800">{email.replace(/[<>"'&]/g, '')}</span>
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <Button onClick={handleVerify} disabled={isLoading} className="w-full">
                            <CheckCircle2 className="mr-2 h-5 w-5" /> {isLoading ? 'Sending...' : 'Check Email & Click Link'}
                        </Button>
                        <button className="text-sm text-slate-400 hover:text-primary-600 font-medium">Resend Email</button>
                    </div>
                    
                    <button onClick={() => setView('LOGIN')} className="text-sm text-slate-400 hover:text-slate-600">Back to Login</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};