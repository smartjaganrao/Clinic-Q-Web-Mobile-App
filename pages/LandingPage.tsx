
import React, { useState } from 'react';
import { PRICING_PLANS } from '../constants';
import { 
  Check, Activity, Users, Monitor, 
  Smartphone, Star, LayoutDashboard, Stethoscope, 
  ArrowRight, Menu, X, Zap, BarChart3, Lock, Play, ShieldCheck, Globe,
  Baby, Heart, Eye, Syringe, UserPlus, MessageCircle, Clock, Smile, AlertTriangle, Tv, Laptop, Wifi, MapPin, QrCode, TrendingUp, BellRing
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface LandingPageProps {
  onPatientEnter: () => void;
  onStaffLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPatientEnter, onStaffLogin }) => {
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
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-200">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Clinic<span className="text-primary-600">Q</span></span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('problems')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Why ClinicQ?</button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('setup')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Setup</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</button>
            </div>

            {/* Login Actions */}
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

            {/* Mobile Toggle */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full">
            <button onClick={() => scrollToSection('problems')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Why ClinicQ?</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Features</button>
            <button onClick={() => scrollToSection('setup')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Setup</button>
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Bring Peace to Your Waiting Room</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 leading-tight">
                    Bring Discipline, Clarity, <br className="hidden md:block" />
                    and <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">Peace to Your Clinic.</span>
                </h1>
                
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
                    Any clinic where people take a token and wait can use this. 
                    Stop the chaos, reduce the noise, and let your doctors focus on healing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Patient CTA */}
                    <div 
                        onClick={onPatientEnter}
                        className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100 transition-all cursor-pointer text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">I am a Patient</h3>
                        <p className="text-slate-500 text-sm">Find a clinic, book token, track live queue.</p>
                        <div className="mt-4 text-purple-600 font-bold text-sm flex items-center gap-1">
                            Enter Portal &rarr;
                        </div>
                    </div>

                    {/* Doctor/Clinic CTA */}
                    <div 
                        onClick={onStaffLogin}
                        className="group bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-primary-500 hover:shadow-xl hover:shadow-primary-900/20 transition-all cursor-pointer text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-5 w-5 text-primary-400" />
                        </div>
                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">I run a Clinic</h3>
                        <p className="text-slate-400 text-sm">Manage queue, patients, and staff easily.</p>
                        <div className="mt-4 text-primary-400 font-bold text-sm flex items-center gap-1">
                            Staff Login &rarr;
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* The "Who is Affected" Problem Section */}
      <section id="problems" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Is your reception a war zone?</h2>
                <p className="text-lg text-slate-600 mt-2">If you recognize these problems, you need ClinicQ today.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Receptionist Pain */}
                <Card className="p-8 border-red-100 bg-red-50/30">
                    <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <Users className="h-7 w-7 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Exhausted Receptionist</h3>
                    <ul className="space-y-3 text-slate-700">
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-red-400 flex-shrink-0" /> Repeating answers to "When is my turn?"</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-red-400 flex-shrink-0" /> Dealing with angry patients shouting.</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-red-400 flex-shrink-0" /> Managing manual chits & duplicate tokens.</li>
                    </ul>
                </Card>

                {/* Patient Pain */}
                <Card className="p-8 border-orange-100 bg-orange-50/30">
                    <div className="bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <Clock className="h-7 w-7 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Frustrated Patients</h3>
                    <ul className="space-y-3 text-slate-700">
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-orange-400 flex-shrink-0" /> Wasting 1-3 hours in a crowded room.</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-orange-400 flex-shrink-0" /> Risk of infection spreading to kids/elderly.</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-orange-400 flex-shrink-0" /> Leaving bad reviews on Google.</li>
                    </ul>
                </Card>

                {/* Doctor Pain */}
                <Card className="p-8 border-slate-100 bg-white shadow-sm">
                    <div className="bg-slate-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <Stethoscope className="h-7 w-7 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Distracted Doctor</h3>
                    <ul className="space-y-3 text-slate-700">
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-slate-400 flex-shrink-0" /> Constant knocking: "Doctor, how many more?"</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-slate-400 flex-shrink-0" /> Unable to focus fully on the patient.</li>
                        <li className="flex items-start gap-2"><X className="h-5 w-5 text-slate-400 flex-shrink-0" /> Losing patients to clinics with better systems.</li>
                    </ul>
                </Card>
            </div>
        </div>
      </section>

      {/* Solution / Features - REDESIGNED */}
      <section id="features" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-primary-400 font-bold tracking-widest uppercase text-sm">The Complete Clinic OS</span>
                <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-6 leading-tight">
                    Everything you need to run <br/> a <span className="text-primary-400">modern, efficient clinic.</span>
                </h2>
                <p className="text-xl text-slate-400">
                    We've combined queue management, appointment booking, and patient engagement into one simple platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Feature 1: Hybrid Queue */}
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-primary-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-900/50 group">
                    <div className="h-14 w-14 bg-primary-500/20 rounded-2xl flex items-center justify-center text-primary-400 mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        <Zap className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Smart Hybrid Queue</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        The system automatically prioritizes emergencies, then scheduled appointments, then walk-ins.
                    </p>
                    <div className="flex items-center gap-2 text-primary-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: Zero Conflicts
                    </div>
                </div>

                {/* Feature 2: WhatsApp Alerts */}
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-900/50 group">
                    <div className="h-14 w-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <MessageCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">WhatsApp Alerts</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Patients receive updates like "Your token is #32. You are next." directly on WhatsApp.
                    </p>
                    <div className="flex items-center gap-2 text-green-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: Silent Reception
                    </div>
                </div>

                {/* Feature 3: Kiosk TV */}
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-orange-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/50 group">
                    <div className="h-14 w-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Tv className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Live TV Kiosk</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Transform any smart TV into a professional digital signage board showing live token status and voice alerts.
                    </p>
                    <div className="flex items-center gap-2 text-orange-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: Professional Look
                    </div>
                </div>

                 {/* Feature 4: Doctor Controls */}
                 <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/50 group">
                    <div className="h-14 w-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Clock className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Delay & Break Control</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Doctor running late? One click updates the estimated wait time for ALL patients instantly.
                    </p>
                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: Honesty & Trust
                    </div>
                </div>

                 {/* Feature 5: Reports */}
                 <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-purple-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/50 group">
                    <div className="h-14 w-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Business Intelligence</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        See peak hours, average turnaround time, and staff performance reports. Know your numbers.
                    </p>
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: More Revenue
                    </div>
                </div>

                 {/* Feature 6: Patient Discovery */}
                 <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-pink-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-900/50 group">
                    <div className="h-14 w-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                        <MapPin className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">GPS & QR Discovery</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Patients find you via "Near Me" search or simply scan a QR code at your door to book.
                    </p>
                    <div className="flex items-center gap-2 text-pink-300 text-xs font-bold uppercase tracking-wide bg-slate-900/50 p-2 rounded-lg w-fit">
                        <Check className="h-4 w-4" /> Advantage: New Patients
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* DEVICE REQUIREMENTS SECTION */}
      <section id="setup" className="py-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
                    <Zap className="h-3 w-3" /> 5-Minute Setup
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                    Zero Hardware Investment Required.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                    Forget expensive servers and IT teams. ClinicQ runs entirely on the cloud, turning your existing devices into a powerful hospital management system.
                </p>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 inline-block">
                    <p className="text-slate-800 font-medium italic text-lg">
                        "You only need 2 devices: One for reception, one for the TV display.<br/>Doctors can simply use their own phones."
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* 1. Reception */}
                <Card className="p-8 border-slate-200 hover:border-primary-500 transition-all duration-300 group bg-white shadow-sm hover:shadow-xl">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                        <Laptop className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. The Command Center</h3>
                    <p className="text-sm font-bold text-primary-600 mb-4 uppercase tracking-wide">For Receptionist</p>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Control the entire clinic flow. Add walk-ins, manage appointments, and handle billing from a single dashboard.
                    </p>
                    <div className="pt-6 border-t border-slate-100">
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Check className="h-4 w-4 text-green-500" /> Works on any Laptop/PC
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-2">
                            <Check className="h-4 w-4 text-green-500" /> Tablet Compatible
                         </div>
                    </div>
                </Card>

                {/* 2. Doctor */}
                <Card className="p-8 border-slate-200 hover:border-primary-500 transition-all duration-300 group bg-white shadow-sm hover:shadow-xl">
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                        <Stethoscope className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Provider Portal</h3>
                    <p className="text-sm font-bold text-primary-600 mb-4 uppercase tracking-wide">For Doctors</p>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Doctors view their live queue, call the next patient, and manage delays directly from their personal device.
                    </p>
                    <div className="pt-6 border-t border-slate-100">
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Check className="h-4 w-4 text-green-500" /> Personal Mobile Phone
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-2">
                            <Check className="h-4 w-4 text-green-500" /> iPad / Tablet (Recommended)
                         </div>
                    </div>
                </Card>

                {/* 3. Display */}
                <Card className="p-8 border-slate-200 hover:border-primary-500 transition-all duration-300 group bg-white shadow-sm hover:shadow-xl">
                    <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                        <Tv className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">3. Digital Signage</h3>
                    <p className="text-sm font-bold text-primary-600 mb-4 uppercase tracking-wide">For Patients</p>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Transform any smart TV into a professional digital token display. Just open the unique URL in the browser.
                    </p>
                    <div className="pt-6 border-t border-slate-100">
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Check className="h-4 w-4 text-green-500" /> Any Smart TV
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-2">
                            <Check className="h-4 w-4 text-green-500" /> FireStick / ChromeCast
                         </div>
                    </div>
                </Card>
            </div>
            
            <div className="mt-16 bg-slate-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                 <div className="text-white">
                     <h4 className="text-lg font-bold mb-2">Technical Reliability</h4>
                     <p className="text-slate-400 text-sm max-w-lg">
                         Built for stability in Tier 2/3 cities. Works smoothly on low-bandwidth 4G connections. 
                         Data is encrypted and backed up daily.
                     </p>
                 </div>
                 <div className="flex gap-4">
                     <div className="flex flex-col items-center gap-2">
                         <Wifi className="h-6 w-6 text-green-400" />
                         <span className="text-xs text-slate-400 font-medium">Low Data</span>
                     </div>
                     <div className="w-px bg-slate-700 h-10"></div>
                     <div className="flex flex-col items-center gap-2">
                         <ShieldCheck className="h-6 w-6 text-blue-400" />
                         <span className="text-xs text-slate-400 font-medium">Secure</span>
                     </div>
                     <div className="w-px bg-slate-700 h-10"></div>
                     <div className="flex flex-col items-center gap-2">
                         <Globe className="h-6 w-6 text-purple-400" />
                         <span className="text-xs text-slate-400 font-medium">Cloud</span>
                     </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Specialty Targeting */}
      <section id="specialties" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-primary-600 font-bold tracking-wide uppercase text-sm">Who is this for?</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Perfect for High-Volume Clinics</h2>
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

                {/* GYNAE */}
                <div className="flex gap-4 p-6 rounded-2xl bg-rose-50 border border-rose-100 hover:shadow-lg transition-shadow">
                    <div className="bg-rose-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Gynecology / Maternity</h4>
                        <p className="text-slate-600 text-sm mt-1">Pregnant women shouldn't wait for hours. Give them exact timing.</p>
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

                {/* DENTAL */}
                <div className="flex gap-4 p-6 rounded-2xl bg-yellow-50 border border-yellow-100 hover:shadow-lg transition-shadow">
                    <div className="bg-yellow-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smile className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Dental Clinics</h4>
                        <p className="text-slate-600 text-sm mt-1">Procedures take time. Let patients know exactly when the chair is free.</p>
                    </div>
                </div>

                 {/* CARDIOLOGY / DIABETES */}
                 <div className="flex gap-4 p-6 rounded-2xl bg-red-50 border border-red-100 hover:shadow-lg transition-shadow">
                    <div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Chronic Care</h4>
                        <p className="text-slate-600 text-sm mt-1">Elderly patients with recurring visits need a smooth, predictable flow.</p>
                    </div>
                </div>

                 {/* LABS */}
                 <div className="flex gap-4 p-6 rounded-2xl bg-purple-50 border border-purple-100 hover:shadow-lg transition-shadow">
                    <div className="bg-purple-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Syringe className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">Scans & Labs</h4>
                        <p className="text-slate-600 text-sm mt-1">Why stand in line for a blood test? Tokenize the process.</p>
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

      {/* Standard Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">ClinicQ</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs">
                Making healthcare accessible, organized, and peaceful for everyone. Built for Tier 2 & Tier 3 cities.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                <li><a href="#" className="hover:text-primary-600">For Doctors</a></li>
                <li><a href="#" className="hover:text-primary-600">Kiosk Mode</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary-600">About</a></li>
                <li><a href="#" className="hover:text-primary-600">Contact Sales</a></li>
                <li><a href="#" className="hover:text-primary-600">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>© 2024 ClinicQ SaaS Inc. All rights reserved.</p>
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
