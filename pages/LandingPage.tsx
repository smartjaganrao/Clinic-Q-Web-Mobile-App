
import React, { useState, useEffect } from 'react';
import { Clinic } from '../types';
import { 
  Search, MapPin, Calendar, Clock, 
  Stethoscope, Smile, Heart, 
  Activity, Monitor, ArrowRight, Bell, Star,
  Users, LayoutGrid,
  AlertTriangle, Zap, Smartphone, CheckCircle2, ShieldCheck,
  Building2, ChevronDown, QrCode, Home, Check, CheckSquare
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onPatientEnter: (mode?: 'DOCTOR' | 'CLINIC') => void;
  onClinicMarketing: () => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onClinicMarketing, onStaffLogin, clinics }) => {
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
                <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Why Us</button>
                <button onClick={() => { const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">How it Works</button>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={onClinicMarketing} className="text-sm font-bold text-slate-500 hover:text-slate-800 hidden sm:block mr-2">For Clinics & Doctors</button>
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
                          Find Clinics. <br/>
                          Skip Waiting Rooms. <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Feel in Control.</span>
                      </h1>
                      
                      <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                          SmartQFlow helps you book appointments or join the live queue at your nearby clinic — so you wait at home, not in a crowded waiting hall.
                      </p>

                      {/* --- SEARCH WIDGET --- */}
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

      {/* --- WHY PATIENTS LOVE US (7 Points) --- */}
      <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">Why Patients Love SmartQFlow</h2>
                  <p className="text-slate-500 mt-4 max-w-2xl mx-auto">We've reimagined the clinic experience to put you back in control of your time.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[
                      { title: "Zero Waiting Room Stress", desc: "Join the queue from home or your office. Arrive only when your turn is near.", icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
                      { title: "Live Queue Tracking", desc: "See exactly how many patients are ahead of you, your live ETA, and doctor’s status.", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { title: "Book Appointments Instantly", desc: "Find clinics nearby, check availability, and book a confirmed time slot in seconds.", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
                      { title: "Smart Walk-in Tokens", desc: "Doctor available now? Join the walk-in queue instantly without physically standing in line.", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                      { title: "Family Profiles", desc: "Add kids, parents, or spouse. Book and manage all family health visits under one account.", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                      { title: "Alerts & Notifications", desc: "If the queue moves fast or doctor is delayed, you get instant updates.", icon: Bell, color: "text-rose-600", bg: "bg-rose-50" },
                      { title: "QR Check-in", desc: "Simply scan the clinic QR to mark your arrival — no manual registration.", icon: QrCode, color: "text-slate-600", bg: "bg-slate-100" },
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

      {/* --- HOW IT WORKS (4 Steps) --- */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-16">How It Works</h2>
              
              <div className="grid md:grid-cols-4 gap-8 relative">
                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-1/12 right-1/12 h-0.5 bg-slate-200 -z-10"></div>

                  {[
                      { step: "01", title: "Search Clinics & Doctors", desc: "Find care by clinic name, doctor name, city, or symptoms.", icon: Search },
                      { step: "02", title: "Choose Appointment or Walk-in", desc: "Select a time slot OR join the live queue.", icon: CheckCircle2 },
                      { step: "03", title: "Track Your Turn Live", desc: "See your position, ETA, and doctor status (On Time / Break).", icon: Activity },
                      { step: "04", title: "Get Called When It's Your Turn", desc: "Arrive exactly on time. No waiting room frustration.", icon: MapPin },
                  ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center relative bg-slate-50 p-4">
                          <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-slate-100 flex items-center justify-center mb-6 z-10 text-teal-600 font-black text-2xl relative">
                              <s.icon className="h-10 w-10 z-10" />
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full text-xs flex items-center justify-center border-4 border-slate-50">{s.step}</div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                          <p className="text-slate-500 text-sm max-w-[200px] mx-auto">{s.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- COMPARISON TABLE --- */}
      <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900">Why SmartQFlow Is Better</h2>
                  <p className="text-slate-500 mt-2">Compare the experience.</p>
              </div>

              <div className="rounded-3xl shadow-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="grid grid-cols-2 text-center bg-slate-50 border-b border-slate-200">
                      <div className="py-6 font-bold text-slate-500 text-lg">Traditional Visit</div>
                      <div className="py-6 font-bold text-teal-700 bg-teal-50/50 text-lg">SmartQFlow Visit</div>
                  </div>
                  
                  {[
                      ["Sit for 1–3 hours in noisy waiting rooms", "Wait at home comfortably"],
                      ["No idea how long it will take", "Live ETA & position"],
                      ["Reception confusion", "Automated queue"],
                      ["Miss your appointment if late", "Smart late-arrival logic"],
                      ["No digital history", "Centralized online visit records"],
                  ].map((row, i) => (
                      <div key={i} className="grid grid-cols-2 border-b border-slate-100 last:border-none hover:bg-slate-50/50 transition-colors">
                          <div className="p-6 text-slate-600 flex items-center justify-center text-center border-r border-slate-100">{row[0]}</div>
                          <div className="p-6 font-bold text-slate-900 bg-teal-50/10 flex items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-teal-50 opacity-0 hover:opacity-100 transition-opacity"></div>
                              <span className="relative z-10 flex items-center gap-2"><Check className="h-4 w-4 text-teal-600" /> {row[1]}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32"></div>
           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
               <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready for stress-free clinic visits?</h2>
               <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                   Search clinics now and skip waiting rooms forever.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Button size="lg" className="bg-white hover:bg-slate-100 text-slate-900 h-14 px-10 rounded-full text-lg font-bold shadow-2xl" onClick={() => onPatientEnter('CLINIC')}>
                       Find Clinics Near Me
                   </Button>
                   <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 h-14 px-10 rounded-full text-lg" onClick={() => onPatientEnter('DOCTOR')}>
                       Find Doctors
                   </Button>
               </div>
               
               <div className="mt-16 pt-8 border-t border-slate-800/50">
                   <p className="text-sm text-slate-500 mb-4">Are you a Doctor or Clinic Owner?</p>
                   <button onClick={onClinicMarketing} className="text-teal-400 hover:text-teal-300 font-bold hover:underline">
                       See how SmartQFlow can transform your practice &rarr;
                   </button>
               </div>
           </div>
      </section>

    </div>
  );
};
