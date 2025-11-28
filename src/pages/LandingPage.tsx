
import React, { useState } from 'react';
import { PRICING_PLANS } from '../../constants';
import { Clinic } from '../../types';
import { 
  Check, Activity, Users, Monitor, 
  Smartphone, Star, LayoutDashboard, Stethoscope, 
  ArrowRight, Menu, X, Zap, BarChart3, Lock, ShieldCheck, Globe,
  Baby, Heart, Syringe, UserPlus, MessageCircle, Clock, Smile, AlertTriangle, Tv, Laptop, Wifi, MapPin, QrCode, TrendingUp, ArrowDown, XCircle, CheckCircle, PlayCircle, Brain, Sparkles, FileText, Bell, Workflow
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onPatientEnter: () => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onStaffLogin, onSimulateQRScan, clinics }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-10 w-10 shadow-lg shadow-primary-200 rounded-xl" />
              <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Smart<span className="text-primary-600">QFlow</span></span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Clinic OS</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('reality')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">The Problem</button>
              <button onClick={() => scrollToSection('solution')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Before vs After</button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">How it Works</button>
              <button onClick={() => scrollToSection('powerful-features')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="outline"
                onClick={onPatientEnter} 
                className="rounded-full px-6 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              >
                Patient Portal
              </Button>
              <Button 
                onClick={onStaffLogin} 
                className="rounded-full px-6 shadow-md shadow-primary-200"
              >
                Clinic Login
              </Button>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full">
            <button onClick={() => scrollToSection('reality')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">The Problem</button>
            <button onClick={() => scrollToSection('solution')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Before vs After</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">How it Works</button>
            <button onClick={() => scrollToSection('powerful-features')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Pricing</button>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-center" onClick={onPatientEnter}>Patient Portal</Button>
              <Button className="w-full justify-center" onClick={onStaffLogin}>Clinic Partner Login</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-200 blur-3xl"></div>
            <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-blue-200 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Solved: Walk-in vs Appointment Clashes</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 leading-tight">
                    Transform Your Clinic from <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Chaos</span> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">Calm.</span>
                </h1>
                
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
                    Stop answering "When is my turn?" 100 times a day. 
                    <br/>Our Smart Hybrid Queue manages appointments, walk-ins, and emergencies automatically.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <Button 
                        onClick={onStaffLogin} 
                        className="h-14 text-lg shadow-xl shadow-primary-200 bg-primary-600 hover:bg-primary-700"
                    >
                        Start My Clinic (Free) <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={onPatientEnter}
                        className="h-14 text-lg border-2 hover:bg-slate-50"
                    >
                        Patient Demo <Smartphone className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Try the Magic</p>
                     <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => onSimulateQRScan(clinics[0]?.id || 'clinic_1')}
                        className="border-dashed border-slate-300 text-slate-500 hover:text-primary-600 hover:border-primary-400"
                     >
                        <QrCode className="h-4 w-4 mr-2" />
                        Simulate Patient Scanning QR Code
                     </Button>
                </div>
            </div>
        </div>
      </section>

      {/* THE REALITY CHECK - PROBLEM SECTION */}
      <section id="reality" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Is this your daily reality?</h2>
                <p className="text-lg text-slate-600 mt-2">These problems are costing you patients and peace of mind.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border-l-4 border-red-500 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="h-6 w-6 text-red-500" /> The Crowd
                    </h3>
                    <p className="text-slate-600 mb-4">"How long still?"</p>
                    <p className="text-sm text-slate-500">
                        Patients crowd the reception. Arguments happen. Infections spread. 
                        <span className="block mt-2 font-bold text-red-600">Result: Patients leave.</span>
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border-l-4 border-orange-500 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-orange-500" /> The Stress
                    </h3>
                    <p className="text-slate-600 mb-4">"When is my turn?"</p>
                    <p className="text-sm text-slate-500">
                        Your receptionist answers the same question 50 times/hr instead of working.
                        <span className="block mt-2 font-bold text-orange-600">Result: Staff burnout.</span>
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border-l-4 border-slate-500 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-slate-500" /> The Delay
                    </h3>
                    <p className="text-slate-600 mb-4">"Doctor is late."</p>
                    <p className="text-sm text-slate-500">
                        Doctor takes a break or emergency occurs. No one knows. Patients feel cheated.
                        <span className="block mt-2 font-bold text-slate-700">Result: Bad Google Reviews.</span>
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* THE SOLUTION - BEFORE VS AFTER */}
      <section id="solution" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-4">The SmartQFlow Difference</h2>
                <p className="text-xl text-slate-600">See how we fix the workflow instantly.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="grid md:grid-cols-2">
                    {/* BEFORE */}
                    <div className="p-10 bg-red-50/50 border-r border-slate-200">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-red-100 p-2 rounded-lg"><XCircle className="h-6 w-6 text-red-600" /></div>
                            <h3 className="text-2xl font-bold text-red-900">The Old Way</h3>
                        </div>
                        <ul className="space-y-6">
                            <li className="flex gap-4 items-start">
                                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Blind Waiting</h4>
                                    <p className="text-slate-600 text-sm">Patient waits 1-2 hours in clinic not knowing when they will be called.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Staff Overload</h4>
                                    <p className="text-slate-600 text-sm">Receptionist spends 40% of time managing the crowd and shouting names.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Queue Clashes</h4>
                                    <p className="text-slate-600 text-sm">Walk-in patient fights with Appointment patient over who goes first.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* AFTER */}
                    <div className="p-10 bg-green-50/50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-green-100 p-2 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                            <h3 className="text-2xl font-bold text-green-900">The SmartQFlow Way</h3>
                        </div>
                        <ul className="space-y-6">
                            <li className="flex gap-4 items-start">
                                <Smartphone className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Live Tracking</h4>
                                    <p className="text-slate-600 text-sm">Patient waits at home. Enters clinic only when "Your turn is next" pops up.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <Zap className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Silent Reception</h4>
                                    <p className="text-slate-600 text-sm">QR Code & TV Display handle the questions. Staff works on billing/care.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <Brain className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Smart Hybrid Logic</h4>
                                    <p className="text-slate-600 text-sm">System automatically sorts Emergencies Appointments Walk-ins fairly.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ROI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <Card className="p-6 text-center border-primary-100 bg-primary-50/30">
                    <TrendingUp className="h-10 w-10 text-primary-600 mx-auto mb-3" />
                    <div className="text-4xl font-black text-slate-900 mb-1">+20%</div>
                    <div className="text-sm font-bold text-primary-700 uppercase tracking-wide">Doctor Productivity</div>
                </Card>
                <Card className="p-6 text-center border-green-100 bg-green-50/30">
                    <Smile className="h-10 w-10 text-green-600 mx-auto mb-3" />
                    <div className="text-4xl font-black text-slate-900 mb-1">100%</div>
                    <div className="text-sm font-bold text-green-700 uppercase tracking-wide">Patient Satisfaction</div>
                </Card>
                <Card className="p-6 text-center border-blue-100 bg-blue-50/30">
                    <Clock className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <div className="text-4xl font-black text-slate-900 mb-1">-85%</div>
                    <div className="text-sm font-bold text-blue-700 uppercase tracking-wide">Waiting Room Noise</div>
                </Card>
            </div>
        </div>
      </section>

      {/* WORKFLOW STEPS */}
      <section id="features" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-primary-400 font-bold tracking-widest uppercase text-sm">Simple Workflow</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-3">How it works in real life</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-700 z-0"></div>

                {[
                    { icon: QrCode, title: "1. Scan or Book", desc: "Patient scans QR at door or books from home." },
                    { icon: Brain, title: "2. Smart Sort", desc: "AI places them in queue based on priority." },
                    { icon: Tv, title: "3. Live Status", desc: "TV & Phone shows '3 people ahead'. No asking." },
                    { icon: Stethoscope, title: "4. Consultation", desc: "Doctor clicks 'Next'. Patient enters room." }
                ].map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center mb-6 shadow-xl">
                            <step.icon className="h-10 w-10 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* NEW: POWERFUL FEATURES SECTION */}
      <section id="powerful-features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run a modern clinic</h2>
                <p className="text-lg text-slate-600">Packed with powerful features to streamline operations and delight patients.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { icon: Zap, title: 'Smart Hybrid Queue', desc: 'Automatically prioritizes Emergencies and Appointments over Walk-ins based on real-time logic.', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { icon: Monitor, title: 'TV Kiosk Display', desc: 'Turn any Smart TV into a live token board with voice announcements. No expensive hardware needed.', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: Smartphone, title: 'Patient App', desc: 'Patients can book, track live status, and view history from their phone without calling you.', color: 'text-green-600', bg: 'bg-green-50' },
                    { icon: FileText, title: 'Digital Rx & Vitals', desc: 'Doctors can write prescriptions and record vitals (BP, Weight) digitally in seconds.', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { icon: Bell, title: 'WhatsApp Alerts', desc: 'Auto-send "Your turn is next" and "Doctor is late" alerts to reduce anxiety.', color: 'text-green-600', bg: 'bg-green-50' },
                    { icon: BarChart3, title: 'Analytics & Reports', desc: 'Track daily revenue, patient footfall, and doctor performance with one click.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { icon: Users, title: 'Staff Roles', desc: 'Dedicated logins for Reception, Doctors, and Admins with secure access controls.', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { icon: ShieldCheck, title: 'Secure & Cloud-Based', desc: 'Access your clinic data from anywhere. Safe, encrypted, and always available.', color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                            <feature.icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* TARGET AUDIENCE / SPECIALTIES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Perfect for High-Volume Clinics</h2>
                <p className="text-slate-500 mt-2">If you have a crowd, you need SmartQFlow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* PEDIATRIC */}
                <div className="flex gap-4 p-6 rounded-2xl bg-pink-50 border border-pink-100 hover:shadow-lg transition-shadow">
                    <div className="bg-pink-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Baby className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Pediatric Clinics</h4>
                        <p className="text-slate-600 text-sm mt-1">Parents with crying kids can wait in the car or at home until their turn.</p>
                    </div>
                </div>

                {/* GENERAL PHYSICIAN */}
                <div className="flex gap-4 p-6 rounded-2xl bg-blue-50 border border-blue-100 hover:shadow-lg transition-shadow">
                    <div className="bg-blue-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">General Physician (GP)</h4>
                        <p className="text-slate-600 text-sm mt-1">Reduce the morning & evening crowd chaos. Manage walk-ins efficiently.</p>
                    </div>
                </div>

                {/* GYNAE */}
                <div className="flex gap-4 p-6 rounded-2xl bg-rose-50 border border-rose-100 hover:shadow-lg transition-shadow">
                    <div className="bg-rose-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Gynecology</h4>
                        <p className="text-slate-600 text-sm mt-1">Pregnant women shouldn't wait for hours. Give them exact timing.</p>
                    </div>
                </div>

                {/* DENTAL */}
                <div className="flex gap-4 p-6 rounded-2xl bg-yellow-50 border border-yellow-100 hover:shadow-lg transition-shadow">
                    <div className="bg-yellow-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smile className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Dental Clinics</h4>
                        <p className="text-slate-600 text-sm mt-1">Procedures vary from 15m to 1hr. Live updates keep waiting patients calm.</p>
                    </div>
                </div>

                {/* ORTHOPEDIC */}
                <div className="flex gap-4 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 hover:shadow-lg transition-shadow">
                    <div className="bg-indigo-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Orthopedic</h4>
                        <p className="text-slate-600 text-sm mt-1">Elderly patients struggle to sit. Reduce physical waiting time in the lobby.</p>
                    </div>
                </div>

                {/* DERMATOLOGY */}
                <div className="flex gap-4 p-6 rounded-2xl bg-purple-50 border border-purple-100 hover:shadow-lg transition-shadow">
                    <div className="bg-purple-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Dermatology</h4>
                        <p className="text-slate-600 text-sm mt-1">Cosmetic sessions can run late. Auto-adjust the queue so no one waits needlessly.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple Pricing. High ROI.</h2>
            <p className="text-lg text-slate-600">The cost of one consultation pays for the whole month.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-300 ${plan.recommended ? 'border-primary-500 shadow-2xl scale-105 z-10 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide">
                    Best Value
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 ml-2">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-slate-600 text-sm">
                      <Check className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.recommended ? 'primary' : 'secondary'} 
                  className="w-full justify-center py-3 font-semibold"
                  onClick={onStaffLogin}
                >
                  {plan.recommended ? 'Start Free Trial' : 'Choose Plan'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>© 2024 SmartQFlow Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-600">Privacy</a>
              <a href="#" className="hover:text-slate-600">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
