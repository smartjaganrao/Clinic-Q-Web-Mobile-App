
import React, { useState, useEffect } from 'react';
import { Clinic } from '../types';
import { 
  Search, MapPin, Calendar, Clock, 
  Stethoscope, Smile, Heart, 
  Activity, Monitor, ArrowRight, Bell, Star,
  Users, LayoutGrid,
  AlertTriangle, Zap, Smartphone, CheckCircle2, ShieldCheck,
  Building2, ChevronDown
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onPatientEnter: (mode?: 'DOCTOR' | 'CLINIC') => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onStaffLogin, clinics }) => {
  const [activeRole, setActiveRole] = useState<'PATIENT' | 'DOCTOR' | 'RECEPTION' | 'CLINIC'>('PATIENT');
  
  // --- LIVE QUEUE SIMULATION STATE ---
  const [mockQueue, setMockQueue] = useState(8);
  const [mockEta, setMockEta] = useState(22);
  
  // --- SEARCH WIDGET STATE ---
  const [searchMode, setSearchMode] = useState<'DOCTOR' | 'CLINIC'>('CLINIC');
  const [location, setLocation] = useState('Chennai');

  // Simulate a living system
  useEffect(() => {
    const interval = setInterval(() => {
        setMockQueue(prev => prev > 5 ? prev - 1 : 8);
        setMockEta(prev => prev > 15 ? prev - 3 : 22);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-9 w-9" />
              <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Smart<span className="text-teal-600">QFlow</span></span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Live Queue System</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
                <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Features</button>
                <button onClick={() => { const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">How it Works</button>
                <button onClick={() => { const el = document.getElementById('for-clinics'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">For Clinics</button>
            </div>

            <div className="flex items-center gap-3">
               <Button variant="ghost" onClick={onStaffLogin} className="text-slate-600 font-medium hidden sm:flex">Partner Login</Button>
               <Button onClick={() => onPatientEnter('CLINIC')} className="rounded-full px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100 font-bold">Find Care</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-slate-50">
          {/* Abstract Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-20 -mt-20"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  
                  {/* Left: Headline & Copy */}
                  <div className="text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 bg-white border border-teal-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Live Queue Updates</span>
                      </div>
                      
                      <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
                          Book. Join Queue. <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Track Live.</span>
                      </h1>
                      
                      <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                          Your clinic visit just became smarter. Real-time queue tracking, hybrid appointments, and instant walk-ins — all in one place.
                      </p>

                      {/* --- SEARCH WIDGET (REPLACED BUTTONS) --- */}
                      <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 max-w-lg mx-auto lg:mx-0 transform transition-all hover:scale-[1.01]">
                          {/* Tabs */}
                          <div className="flex p-1 bg-slate-100 rounded-2xl mb-2">
                              <button 
                                  onClick={() => setSearchMode('CLINIC')}
                                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'CLINIC' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  <Building2 className="h-4 w-4" /> Clinics
                              </button>
                              <button 
                                  onClick={() => setSearchMode('DOCTOR')}
                                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'DOCTOR' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  <Stethoscope className="h-4 w-4" /> Doctors
                              </button>
                          </div>

                          {/* Inputs Row */}
                          <div className="flex flex-col sm:flex-row gap-2">
                              <div className="relative flex-1 group">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                  <input 
                                      type="text" 
                                      value={location}
                                      onChange={(e) => setLocation(e.target.value)}
                                      className="w-full pl-12 pr-4 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none font-medium text-slate-900 transition-all placeholder:text-slate-400"
                                      placeholder="City or Area"
                                  />
                              </div>
                              <Button 
                                  onClick={() => onPatientEnter(searchMode)} 
                                  className="h-14 rounded-2xl px-8 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200 text-lg font-bold flex items-center justify-center gap-2 shrink-0"
                              >
                                  <Search className="h-5 w-5" /> Search
                              </Button>
                          </div>
                          
                          {/* Quick Tags */}
                          <div className="mt-3 px-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Popular:</span>
                              {['General', 'Dentist', 'Pediatric', 'Skin'].map(tag => (
                                  <button 
                                      key={tag}
                                      onClick={() => onPatientEnter(searchMode)}
                                      className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-100 transition-colors whitespace-nowrap"
                                  >
                                      {tag}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <p className="mt-6 text-sm text-slate-400 font-medium">Used by 500+ Clinics • 4.9/5 Patient Rating</p>
                  </div>

                  {/* Right: Live Queue Simulator Widget */}
                  <div className="relative mx-auto lg:ml-auto w-full max-w-md mt-10 lg:mt-0 hidden md:block">
                      {/* Floating Elements */}
                      <div className="absolute -top-6 -right-6 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow z-20">
                           <div className="bg-red-100 p-2 rounded-lg"><Bell className="h-5 w-5 text-red-500" /></div>
                           <div><p className="text-xs font-bold text-slate-900">Dr. delayed by 10m</p><p className="text-[10px] text-slate-500">Auto-update sent</p></div>
                      </div>

                      {/* Main Card */}
                      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                          {/* Card Header */}
                          <div className="bg-slate-900 p-6 text-white">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className="font-bold text-lg">Apollo Clinic</h3>
                                      <p className="text-slate-400 text-sm">Gen. Physician • Dr. Ravi</p>
                                  </div>
                                  <div className="bg-green-500/20 border border-green-500/50 px-2 py-1 rounded text-xs font-bold text-green-400 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> LIVE
                                  </div>
                              </div>
                              <div className="flex gap-4">
                                  <div className="bg-white/10 rounded-lg p-3 flex-1 text-center">
                                      <div className="text-2xl font-black">{mockQueue}</div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Waiting</div>
                                  </div>
                                  <div className="bg-white/10 rounded-lg p-3 flex-1 text-center">
                                      <div className="text-2xl font-black">{mockEta}m</div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Est. Wait</div>
                                  </div>
                              </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6 space-y-4">
                              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                  <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
                                  <p className="text-xs text-red-700 font-medium">Doctor is running slightly late. Queue times adjusted automatically.</p>
                              </div>
                              
                              <div className="space-y-3">
                                  <button onClick={() => onPatientEnter('CLINIC')} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2">
                                      <Zap className="h-4 w-4 fill-current" /> Join Walk-in Queue Now
                                  </button>
                                  <button onClick={() => onPatientEnter('DOCTOR')} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                      <Calendar className="h-4 w-4" /> Book Appointment Slot
                                  </button>
                              </div>
                              
                              <div className="text-center">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Powered by SmartQFlow</p>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      </section>

      {/* --- WHY SMARTQFLOW (USP) --- */}
      <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">Why We Are Different</h2>
                  <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Most apps just list doctors. We manage the entire flow of the clinic in real-time.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                      { title: "Live Queue Tracking", desc: "See your token number move in real-time. No more guessing.", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                      { title: "Remote Walk-in", desc: "Join the 'Walk-in' queue from your home. Arrive just in time.", icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
                      { title: "Delay Auto-Sync", desc: "If the doctor takes a break or is late, your ETA updates instantly.", icon: Clock, color: "text-red-600", bg: "bg-red-50" },
                      { title: "Fair Hybrid System", desc: "Our algorithm merges appointments and walk-ins fairly.", icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-50" },
                      { title: "QR Check-in", desc: "Scan a QR code at reception to confirm arrival instantly.", icon: Monitor, color: "text-orange-600", bg: "bg-orange-50" },
                      { title: "Emergency Priority", desc: "Emergency cases get bumped to the top automatically.", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
                      { title: "Family Booking", desc: "Book for yourself, your kids, or parents from one account.", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                      { title: "TV Display Ready", desc: "Clinics get a beautiful TV interface for the waiting room.", icon: LayoutGrid, color: "text-slate-600", bg: "bg-slate-100" },
                  ].map((feat, i) => (
                      <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                          <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                              <feat.icon className={`h-6 w-6 ${feat.color}`} />
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 mb-2">{feat.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-16">Smart Healthcare in 3 Steps</h2>
              
              <div className="grid md:grid-cols-3 gap-12 relative">
                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-200 -z-10"></div>

                  {[
                      { step: "01", title: "Find & Select", desc: "Choose a doctor or clinic based on live wait times.", icon: Search },
                      { step: "02", title: "Join or Book", desc: "Grab a walk-in token instantly or schedule a slot.", icon: CheckCircle2 },
                      { step: "03", title: "Track & Arrive", desc: "Watch your queue position move and arrive efficiently.", icon: MapPin },
                  ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center relative bg-slate-50 p-4">
                          <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-slate-100 flex items-center justify-center mb-6 z-10">
                              <s.icon className="h-10 w-10 text-teal-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                          <p className="text-slate-500 max-w-xs mx-auto">{s.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- BENEFITS BY ROLE (TABS) --- */}
      <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900">Built for Everyone in Healthcare</h2>
              </div>

              <div className="flex justify-center mb-12">
                  <div className="inline-flex bg-slate-100 p-1.5 rounded-xl">
                      {['PATIENT', 'DOCTOR', 'RECEPTION', 'CLINIC'].map((role) => (
                          <button
                              key={role}
                              onClick={() => setActiveRole(role as any)}
                              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeRole === role ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              {role.charAt(0) + role.slice(1).toLowerCase()}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                          <h3 className="text-3xl font-bold text-slate-900">
                              {activeRole === 'PATIENT' && "Stop wasting life in waiting rooms."}
                              {activeRole === 'DOCTOR' && "Focus on care, not crowd control."}
                              {activeRole === 'RECEPTION' && "Manage patients without the chaos."}
                              {activeRole === 'CLINIC' && "Operational efficiency meets patient delight."}
                          </h3>
                          <ul className="space-y-4">
                              {(activeRole === 'PATIENT' ? [
                                  "Track your token number live from home",
                                  "Get notified when the doctor is delayed",
                                  "Book appointments for family members",
                                  "Store digital prescriptions automatically"
                              ] : activeRole === 'DOCTOR' ? [
                                  "View your queue on a simple dashboard",
                                  "One-click 'Call Next' patient",
                                  "Mark yourself 'On Break' or 'Delayed' easily",
                                  "Digital notes and quick prescriptions"
                              ] : activeRole === 'RECEPTION' ? [
                                  "Add walk-in patients in seconds",
                                  "Drag-and-drop to reorder emergency cases",
                                  "No more answering 'When is my turn?'",
                                  "Print tokens or send SMS instantly"
                              ] : [
                                  "Analytics on patient footfall and wait times",
                                  "Reduce no-shows with smart reminders",
                                  "TV Kiosk mode included for waiting areas",
                                  "Boost patient retention with better experience"
                              ]).map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                      <div className="bg-teal-100 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-teal-700" /></div>
                                      {item}
                                  </li>
                              ))}
                          </ul>
                          <div className="pt-4">
                              <Button onClick={activeRole === 'PATIENT' ? () => onPatientEnter() : onStaffLogin} size="lg" className="rounded-full px-8 shadow-lg">
                                  {activeRole === 'PATIENT' ? 'Try It Now' : 'See Dashboard Demo'}
                              </Button>
                          </div>
                      </div>
                      
                      <div className="relative h-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center animate-in zoom-in-95">
                           {/* Abstract visual based on role */}
                           {activeRole === 'PATIENT' ? <Monitor className="h-32 w-32 text-slate-200" /> : 
                            activeRole === 'DOCTOR' ? <Stethoscope className="h-32 w-32 text-slate-200" /> :
                            activeRole === 'RECEPTION' ? <LayoutGrid className="h-32 w-32 text-slate-200" /> :
                            <Activity className="h-32 w-32 text-slate-200" />}
                           <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-transparent"></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOR CLINICS CTA --- */}
      <section id="for-clinics" className="py-24 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32"></div>
           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
               <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Transform Your Clinic Today</h2>
               <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                   Join 500+ forward-thinking clinics using SmartQFlow to reduce waiting times, improve staff efficiency, and deliver a modern patient experience.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white h-14 px-10 rounded-full text-lg font-bold shadow-2xl shadow-teal-900/50" onClick={onStaffLogin}>
                       Book a Demo
                   </Button>
                   <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 h-14 px-10 rounded-full text-lg" onClick={onStaffLogin}>
                       View Pricing
                   </Button>
               </div>
               <p className="mt-8 text-sm text-slate-500">Free 14-day trial • No credit card required</p>
           </div>
      </section>

    </div>
  );
};
