
import React, { useState, useEffect } from 'react';
import { Clinic } from '../types';
import { 
  Search, MapPin, Calendar, Clock, 
  Stethoscope, Baby, Smile, Heart, 
  Activity, Sparkles, Eye, Menu, X, 
  CheckCircle2, Building2, User, Smartphone, Zap,
  BarChart3, Monitor, ArrowRight, Bell, Star,
  TrendingUp, Users, BrainCircuit, Ear, LayoutGrid,
  AlertTriangle, HelpCircle, QrCode, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onPatientEnter: (mode?: 'DOCTOR' | 'CLINIC') => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onStaffLogin, onSimulateQRScan, clinics }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'PATIENT' | 'CLINIC'>('PATIENT');
  
  // Animation state for the "Live Token" visualization
  const [demoToken, setDemoToken] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
        setDemoToken(prev => {
            if (prev === 14) return 12;
            return prev + 1;
        });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const patientSpecialties = [
    { label: 'General', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kids', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Dental', icon: Smile, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Women', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Bone', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Skin', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Eye', icon: Eye, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'ENT', icon: Ear, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      
      {/* --- UNIFIED NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-9 w-9" />
              <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Smart<span className="text-primary-600">QFlow</span></span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                    {viewMode === 'PATIENT' ? 'For Patients' : 'For Clinics'}
                  </span>
              </div>
            </div>

            {/* Central Segment Toggle */}
            <div className="hidden md:flex bg-slate-100/80 p-1 rounded-full border border-slate-200 shadow-inner">
                <button 
                    onClick={() => setViewMode('PATIENT')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'PATIENT' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <User className="h-4 w-4" /> Patients
                </button>
                <button 
                    onClick={() => setViewMode('CLINIC')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'CLINIC' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Building2 className="h-4 w-4" /> Clinic Owners
                </button>
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {viewMode === 'PATIENT' ? (
                  <>
                      <Button variant="ghost" onClick={onStaffLogin} className="text-slate-500 hover:bg-slate-100">Are you a Doctor?</Button>
                      <Button onClick={() => onPatientEnter()} className="rounded-full px-6 shadow-lg shadow-primary-200 bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 transition-all duration-300">Login / Sign Up</Button>
                  </>
              ) : (
                  <>
                      <Button variant="ghost" onClick={onStaffLogin} className="text-slate-600">Login</Button>
                      <Button onClick={onStaffLogin} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 shadow-lg shadow-slate-300 hover:-translate-y-0.5 transition-all duration-300">Start Free Trial</Button>
                  </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full z-50 animate-in slide-in-from-top-4">
            <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                <button onClick={() => { setViewMode('PATIENT'); setIsMobileMenuOpen(false); }} className={`flex-1 py-3 rounded-md transition-all ${viewMode === 'PATIENT' ? 'bg-white shadow text-primary-700 font-bold' : 'text-slate-500'}`}>Patients</button>
                <button onClick={() => { setViewMode('CLINIC'); setIsMobileMenuOpen(false); }} className={`flex-1 py-3 rounded-md transition-all ${viewMode === 'CLINIC' ? 'bg-slate-800 shadow text-white font-bold' : 'text-slate-500'}`}>Clinics</button>
            </div>
            {viewMode === 'PATIENT' ? (
                <Button className="w-full justify-center py-3 text-lg" onClick={() => onPatientEnter()}>Login / Sign Up</Button>
            ) : (
                <Button className="w-full justify-center bg-slate-900 text-white py-3 text-lg" onClick={onStaffLogin}>Clinic Login</Button>
            )}
          </div>
        )}
      </nav>

      {/* --- PATIENT VIEW CONTENT --- */}
      {viewMode === 'PATIENT' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HERO SECTION REDESIGNED */}
            <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-primary-100 to-blue-50 blur-3xl opacity-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-purple-100 to-pink-50 blur-3xl opacity-40 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-bounce-slow mx-auto">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide uppercase">Live Queue Tracking Available</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1] max-w-4xl mx-auto">
                        Your health journey, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600">Simplified & Streamlined.</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Skip the waiting room. Find expert doctors or nearby clinics and join the live queue from the comfort of your home.
                    </p>
                    
                    {/* DUAL CARDS for Search Choice */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Find Doctors Card */}
                        <div 
                            onClick={() => onPatientEnter('DOCTOR')}
                            className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 hover:border-primary-200 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group text-left relative overflow-hidden h-64 md:h-80 flex flex-col"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white z-0"></div>
                            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600" className="absolute right-[-40px] bottom-[-40px] w-48 h-48 md:w-64 md:h-64 object-cover rounded-full opacity-20 group-hover:opacity-40 transition-opacity rotate-12" alt="Doctor" />
                            
                            <div className="relative z-10 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Stethoscope className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Find Doctors</h3>
                                    <p className="text-slate-500 font-medium">Search by specialist name, condition, or symptoms.</p>
                                </div>
                                <div className="mt-6 flex items-center text-blue-700 font-bold group-hover:gap-2 transition-all">
                                    Search Specialists <ArrowRight className="h-5 w-5 ml-2" />
                                </div>
                            </div>
                        </div>

                        {/* Find Clinics Card */}
                        <div 
                            onClick={() => onPatientEnter('CLINIC')}
                            className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group text-left relative overflow-hidden h-64 md:h-80 flex flex-col"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white z-0"></div>
                            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600" className="absolute right-[-40px] bottom-[-40px] w-48 h-48 md:w-64 md:h-64 object-cover rounded-full opacity-20 group-hover:opacity-40 transition-opacity -rotate-6" alt="Clinic" />
                            
                            <div className="relative z-10 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Find Clinics</h3>
                                    <p className="text-slate-500 font-medium">Locate hospitals, labs, and care centers near you.</p>
                                </div>
                                <div className="mt-6 flex items-center text-emerald-700 font-bold group-hover:gap-2 transition-all">
                                    Browse Locations <ArrowRight className="h-5 w-5 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* SPECIALTIES */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Top Specialties</h2>
                            <p className="text-slate-600 mt-2">Consult expert doctors for any health concern</p>
                        </div>
                        <Button variant="ghost" onClick={() => onPatientEnter('DOCTOR')} className="hidden md:flex text-primary-600">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {patientSpecialties.map((spec, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onPatientEnter('DOCTOR')}
                                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group text-center h-full"
                            >
                                <div className={`w-12 h-12 ${spec.bg} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}>
                                    <spec.icon className={`h-6 w-6 ${spec.color}`} />
                                </div>
                                <span className="font-bold text-sm text-slate-900 group-hover:text-primary-600">{spec.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY PATIENTS LOVE US */}
            <section className="py-20 bg-white">
                 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Why Patients Love SmartQFlow</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Clock, label: "No Waiting", desc: "Save hours of time" },
                            { icon: Smartphone, label: "Track Live", desc: "Like tracking a cab" },
                            { icon: Bell, label: "Get Alerts", desc: "Know when to leave" },
                            { icon: Users, label: "For Family", desc: "Book for anyone" },
                            { icon: Lock, label: "Secure", desc: "Private medical data" },
                            { icon: QrCode, label: "QR Check-in", desc: "Contactless arrival" },
                            { icon: TrendingUp, label: "Real-time", desc: "Updates every second" },
                            { icon: CheckCircle2, label: "Free", desc: "No cost for patients" },
                        ].map((feat, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-primary-600">
                                </div>
                                <h3 className="font-bold text-slate-900">{feat.label}</h3>
                                <p className="text-sm text-slate-500">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>
        </div>
      )}


      {/* --- CLINIC VIEW CONTENT --- */}
      {viewMode === 'CLINIC' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HERO */}
            <section className="relative pt-16 pb-28 bg-slate-50 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-8 shadow-sm">
                            <Star className="h-4 w-4 text-emerald-600 fill-current" />
                            <span className="text-sm font-bold text-emerald-800 tracking-wide uppercase">Trusted by 500+ Clinics</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
                            Eliminate Waiting Room Chaos. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Boost Clinic Efficiency.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                            Reduce waiting room chaos. Increase doctor productivity. Delight your patients with a modern digital experience.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                size="lg" 
                                className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 text-lg rounded-full shadow-2xl shadow-slate-300 font-bold"
                                onClick={onStaffLogin}
                            >
                                Book a Free Demo
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-14 px-8 text-lg bg-white rounded-full border-2 border-slate-200 hover:border-slate-900 font-bold"
                                onClick={onStaffLogin}
                            >
                                Start 30-Day Trial
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Mockup */}
                    <div className="relative group perspective-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
                            className="relative rounded-3xl border-4 border-white shadow-2xl transform rotate-y-12 group-hover:rotate-y-0 transition-transform duration-700"
                            alt="Doctor Dashboard" 
                        />
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                            <div className="bg-green-100 p-3 rounded-full"><Monitor className="h-6 w-6 text-green-600" /></div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">Kiosk Mode</p>
                                <p className="text-xs text-slate-500">For Waiting Room TV</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PAIN POINTS */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-16">Why Clinics Need SmartQFlow</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Crowded Waiting Rooms", desc: "Reduce infection risk and noise by letting patients wait from home.", icon: Users, color: "text-red-500" },
                            { title: "Constant Interruptions", desc: "Stop patients from knocking to ask 'When is my turn?'.", icon: AlertTriangle, color: "text-orange-500" },
                            { title: "Manual Token Chaos", desc: "Replace paper tokens and shouting names with automated TV announcements.", icon: LayoutGrid, color: "text-slate-500" },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all">
                                <div className="mb-6 inline-flex p-4 bg-white rounded-full shadow-sm"><item.icon className={`h-8 w-8 ${item.color}`} /></div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">A Workflow That Just Works.</h2>
                            <p className="text-slate-400 text-lg mb-10">We mapped the patient journey and automated every friction point.</p>
                            
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Reception Adds Patient", desc: "Walk-ins are added instantly. Appointments check-in via QR." },
                                    { step: "02", title: "Doctor Sees Queue", desc: "Doctor clicks 'Next'. No shouting needed." },
                                    { step: "03", title: "TV Display Announces", desc: "Waiting room TV announces token number & name loudly." },
                                    { step: "04", title: "Patients Track Live", desc: "Patients outside see real-time updates on their phone." },
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-6">
                                        <span className="text-2xl font-black text-emerald-500">{s.step}</span>
                                        <div>
                                            <h4 className="font-bold text-xl mb-1">{s.title}</h4>
                                            <p className="text-slate-400">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-full flex flex-col justify-center">
                             {/* Abstract Visualization of Flow */}
                             <div className="space-y-4">
                                 <div className="bg-slate-700 p-4 rounded-xl flex items-center justify-between opacity-50"><span className="text-sm">Patient 1</span><span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Completed</span></div>
                                 <div className="bg-emerald-600 p-4 rounded-xl flex items-center justify-between shadow-lg scale-105"><span className="font-bold">Patient 2 (Current)</span><span className="text-xs bg-white text-emerald-800 px-2 py-1 rounded font-bold">In Room</span></div>
                                 <div className="bg-slate-700 p-4 rounded-xl flex items-center justify-between"><span className="text-sm">Patient 3</span><span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Next</span></div>
                                 <div className="bg-slate-700 p-4 rounded-xl flex items-center justify-between"><span className="text-sm">Patient 4</span><span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Waiting</span></div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING CTA */}
            <section className="py-20 bg-slate-900 text-white text-center border-t border-slate-800">
                 <div className="max-w-4xl mx-auto px-4">
                     <h2 className="text-3xl font-bold mb-6">Ready to upgrade your clinic?</h2>
                     <p className="text-slate-400 mb-10 text-lg">Join 500+ forward-thinking clinics today.</p>
                     <div className="flex justify-center gap-4">
                        <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 h-14 text-lg" onClick={onStaffLogin}>See Pricing & Plans</Button>
                     </div>
                 </div>
            </section>
        </div>
      )}

      {/* --- SHARED FOOTER --- */}
      <footer className="bg-white pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold text-slate-900">Smart<span className="text-primary-600">QFlow</span></span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        Revolutionizing healthcare experiences in India with real-time queue management and AI-powered clinic tools.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-slate-600">
                        <li><button onClick={() => setViewMode('PATIENT')} className="hover:text-primary-600 transition-colors">For Patients</button></li>
                        <li><button onClick={() => setViewMode('CLINIC')} className="hover:text-primary-600 transition-colors">For Clinics</button></li>
                        <li><button onClick={onStaffLogin} className="hover:text-primary-600 transition-colors">Pricing</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-slate-600">
                        <li><a href="#" className="hover:text-primary-600 transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-primary-600 transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-primary-600 transition-colors">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
                    <ul className="space-y-4 text-sm text-slate-600">
                        <li><a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
                <p>© 2024 SmartQFlow Technologies Pvt Ltd. All rights reserved.</p>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> ISO 27001 Certified</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
