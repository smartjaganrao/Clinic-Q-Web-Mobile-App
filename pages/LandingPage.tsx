
import React, { useState, useEffect } from 'react';
import { Clinic } from '../types';
import { PRICING_PLANS } from '../constants';
import { 
  Search, MapPin, Calendar, Clock, 
  ShieldCheck, Stethoscope, Baby, Smile, Heart, 
  Activity, Sparkles, Eye, Menu, X, 
  CheckCircle2, Building2, User, Smartphone, Zap,
  BarChart3, Monitor, ArrowRight, Bell, Play, Star,
  TrendingUp, Users, BrainCircuit, Ear, LayoutGrid,
  AlertTriangle, ArrowUpRight, Lock, HelpCircle, QrCode
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';

interface LandingPageProps {
  onPatientEnter: () => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onStaffLogin, onSimulateQRScan, clinics }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'PATIENT' | 'CLINIC'>('PATIENT');
  const [searchValue, setSearchValue] = useState('');
  
  // Animation state for the "Live Token" visualization
  const [demoToken, setDemoToken] = useState(12);
  const [demoStatus, setDemoStatus] = useState('Serving');

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
                      <Button onClick={onPatientEnter} className="rounded-full px-6 shadow-lg shadow-primary-200 bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 transition-all duration-300">Login / Sign Up</Button>
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
                <Button className="w-full justify-center py-3 text-lg" onClick={onPatientEnter}>Login / Sign Up</Button>
            ) : (
                <Button className="w-full justify-center bg-slate-900 text-white py-3 text-lg" onClick={onStaffLogin}>Clinic Login</Button>
            )}
          </div>
        )}
      </nav>

      {/* --- PATIENT VIEW CONTENT --- */}
      {viewMode === 'PATIENT' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HERO SECTION */}
            <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-primary-100 to-blue-50 blur-3xl opacity-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-purple-100 to-pink-50 blur-3xl opacity-40 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        
                        {/* Text Content */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-bounce-slow mx-auto lg:mx-0">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide uppercase">Live Queue Tracking</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                                Your AI Health Assistant. <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600">Smarter Bookings. Faster Care.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Find doctors, book appointments, or join the queue from home — get real-time updates just like Uber.
                            </p>
                            
                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary-200" onClick={onPatientEnter}>
                                    Find Doctors & Clinics
                                </Button>
                                <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg border-2" onClick={onPatientEnter}>
                                    Track My Booking
                                </Button>
                            </div>

                            {/* Search Bar */}
                            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto lg:mx-0">
                                <div className="flex-1 w-full relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="text" placeholder="City" className="w-full h-12 pl-12 pr-4 rounded-xl border-none focus:ring-0 text-slate-900 font-medium bg-transparent" defaultValue="Chennai" />
                                </div>
                                <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                <div className="flex-[2] w-full relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Doctor, clinic, or symptom..." 
                                        className="w-full h-12 pl-12 pr-4 rounded-xl border-none focus:ring-0 text-slate-900 font-medium bg-transparent"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && onPatientEnter()}
                                    />
                                </div>
                                <Button className="w-full sm:w-auto rounded-xl h-12 px-6" onClick={onPatientEnter}>
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Visual / Demo */}
                        <div className="flex-1 relative w-full max-w-md lg:max-w-full">
                             {/* Mobile Mockup */}
                             <div className="relative z-10 mx-auto bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden max-w-[300px]">
                                <div className="bg-slate-800 h-full w-full absolute inset-0"></div>
                                <div className="relative bg-slate-50 h-full overflow-hidden flex flex-col">
                                    {/* Mock App Header */}
                                    <div className="bg-white p-4 pt-8 border-b border-slate-100 flex justify-between items-center">
                                        <Menu className="h-5 w-5 text-slate-400" />
                                        <span className="font-bold text-slate-800">My Booking</span>
                                        <Bell className="h-5 w-5 text-slate-400" />
                                    </div>
                                    {/* Mock Content */}
                                    <div className="p-4 space-y-4">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Dr. Sarah Smith</h3>
                                                    <p className="text-xs text-slate-500">General Physician</p>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">CONFIRMED</span>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <div className="flex-1 bg-slate-50 rounded-xl p-2 text-center">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Your Token</div>
                                                    <div className="text-2xl font-black text-slate-900">#15</div>
                                                </div>
                                                <div className="flex-1 bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                                                    <div className="text-[10px] text-blue-400 uppercase font-bold">Serving</div>
                                                    <div className="text-2xl font-black text-blue-600 animate-pulse">#{demoToken}</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-xs font-medium text-slate-500 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Estimated Wait: <span className="text-slate-900 font-bold">~15 mins</span>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-3 items-start">
                                            <Zap className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-orange-800">Leave home in 5 mins</p>
                                                <p className="text-[10px] text-orange-600 leading-tight">Traffic is moderate. Reach clinic by 10:45 AM.</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bottom Nav */}
                                    <div className="mt-auto bg-white border-t border-slate-100 p-4 flex justify-between">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><User className="h-4 w-4" /></div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                    </div>
                                </div>
                             </div>
                             
                             {/* Floating Elements */}
                             <div className="absolute top-1/4 -right-4 lg:-right-12 bg-white p-3 rounded-xl shadow-lg border border-slate-100 animate-bounce-slow">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold">Status Update</p>
                                        <p className="text-sm font-bold text-slate-900">You are next!</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-20 bg-white border-y border-slate-100">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Healthcare simplified. Finally.</h2>
                        <p className="text-slate-600 mt-2 text-lg">Skip the chaos in 3 simple steps</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {[
                            { title: "1. Find Doctor", desc: "Search by specialty, symptoms, or nearest clinic. Compare fees & ratings.", icon: Search, color: "text-blue-600", bg: "bg-blue-50" },
                            { title: "2. Book or Join", desc: "Choose an appointment slot or join the Walk-in queue online.", icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
                            { title: "3. Track Live", desc: "Watch the queue move from home. Arrive exactly when it's your turn.", icon: Zap, color: "text-green-600", bg: "bg-green-50" }
                        ].map((step, idx) => (
                            <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className={`w-20 h-20 ${step.bg} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon className={`h-10 w-10 ${step.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SPECIALTIES */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Top Specialties</h2>
                            <p className="text-slate-600 mt-2">Consult expert doctors for any health concern</p>
                        </div>
                        <Button variant="ghost" onClick={onPatientEnter} className="hidden md:flex text-primary-600">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {patientSpecialties.map((spec, idx) => (
                            <button 
                                key={idx} 
                                onClick={onPatientEnter}
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

            {/* NEARBY CLINICS (Real Data) */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-slate-900">Clinics Near You</h2>
                        <p className="text-slate-600 mt-2">Book instantly with top-rated local clinics</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        {clinics.slice(0, 3).map(clinic => (
                            <div key={clinic.id} onClick={onPatientEnter} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full">
                                <div className="h-40 bg-slate-100 relative overflow-hidden">
                                     {/* Placeholder Image Gradient */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200 group-hover:scale-105 transition-transform duration-500"></div>
                                     <div className="absolute inset-0 flex items-center justify-center opacity-10"><Building2 className="h-20 w-20" /></div>
                                     <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                                         <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" /> 4.5
                                     </div>
                                     <div className="absolute bottom-3 left-3 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                                         <Clock className="h-3 w-3 mr-1" /> 15m Wait
                                     </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors mb-1">{clinic.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-4"><MapPin className="h-3 w-3" /> {clinic.address}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {clinic.doctors.slice(0,3).map(d => (
                                                <img key={d.id} src={d.avatarUrl} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-primary-600 group-hover:translate-x-1 transition-transform flex items-center">
                                            Book Now <ArrowRight className="h-4 w-4 ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <Button size="lg" variant="outline" onClick={onPatientEnter} className="rounded-full px-8">View All Clinics</Button>
                    </div>
                </div>
            </section>

            {/* WHY PATIENTS LOVE US */}
            <section className="py-20 bg-slate-50">
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
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-primary-600">
                                    <feat.icon className="h-8 w-8" />
                                </div>
                                <h3 className="font-bold text-slate-900">{feat.label}</h3>
                                <p className="text-sm text-slate-500">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Stories from Happy Patients</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { text: "I waited at home until my token was 3 numbers away. Walked in and saw the doctor in 5 minutes. Amazing!", user: "Priya R.", role: "Parent" },
                            { text: "No more crowded waiting rooms risking infection for my kids. This app is a lifesaver.", user: "Amit K.", role: "IT Professional" },
                            { text: "The live tracking is so accurate. I knew exactly when the doctor went on break.", user: "Sneha M.", role: "Student" },
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-3xl relative">
                                <div className="text-4xl text-primary-300 absolute top-4 left-6">"</div>
                                <p className="text-slate-700 italic relative z-10 mb-6">{t.text}</p>
                                <div>
                                    <p className="font-bold text-slate-900">{t.user}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
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

            {/* FEATURES */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Everything you need to run a smart clinic</h2>
                        <p className="text-slate-600 mt-4 text-lg">Powerful tools for every team member</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Smart TV Kiosk", desc: "Transform your waiting room TV into a live status board.", icon: Monitor, color: "text-blue-600", bg: "bg-blue-100" },
                            { title: "AI Clinical Assistant", desc: "Gemini AI summarizes patient notes and suggests prescriptions.", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-100" },
                            { title: "Hybrid Queue Algorithm", desc: "Auto-sorts Walk-ins, Appointments, and Emergencies.", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
                            { title: "Patient Retention", desc: "Automatic WhatsApp reminders keep patients coming back.", icon: Users, color: "text-rose-600", bg: "bg-rose-100" },
                            { title: "Revenue Analytics", desc: "Track daily footfall and peak hours to optimize.", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
                            { title: "Multi-Clinic Support", desc: "Manage multiple branches from a single profile.", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100" },
                        ].map((feat, i) => (
                            <div key={i} className="bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
                                <div className={`w-14 h-14 ${feat.bg} rounded-2xl flex items-center justify-center ${feat.color} mb-6`}>
                                    <feat.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             {/* FAQ */}
             <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Does it work if internet goes down?", a: "Yes, the core queue functions work offline and sync when connection is restored." },
                            { q: "Is training required for my staff?", a: "No. The interface is designed to be intuitive. Most receptionists learn it in 10 minutes." },
                            { q: "Can doctors manage multiple clinics?", a: "Absolutely. You can link a single doctor profile to multiple clinic locations and switch instantly." },
                            { q: "How does the TV Display work?", a: "Just open the Kiosk link on any Smart TV browser or connect a laptop via HDMI." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-3"><HelpCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {item.q}</h3>
                                <p className="text-slate-600 ml-8">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING CTA */}
            <section className="py-20 bg-slate-900 text-white text-center">
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
                    <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-emerald-500" /> 256-bit Encryption</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
