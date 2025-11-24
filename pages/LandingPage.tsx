import React, { useState } from 'react';
import { PRICING_PLANS } from '../constants';
import { 
  Check, Activity, Users, Monitor, 
  Smartphone, Star, LayoutDashboard, Stethoscope, 
  ArrowRight, Menu, X, Zap, BarChart3, Lock, Play, ShieldCheck, Globe
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
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
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
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</button>
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
            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-4 py-2 text-slate-600 font-medium">Pricing</button>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-center" onClick={onPatientEnter}>Patient Portal</Button>
              <Button className="w-full justify-center" onClick={onStaffLogin}>Clinic Partner Login</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live in 500+ Hospitals</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 leading-tight">
                    The Modern Standard for <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">Smart Healthcare.</span>
                </h1>
                
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
                    ClinicQ connects patients and providers with a unified, real-time operating system. 
                    Queue management, appointments, and analytics in one place.
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
                        <h3 className="text-lg font-bold text-slate-900 mb-1">For Patients</h3>
                        <p className="text-slate-500 text-sm">Book appointments, track live tokens, and find nearby clinics.</p>
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
                        <h3 className="text-lg font-bold text-white mb-1">For Providers</h3>
                        <p className="text-slate-400 text-sm">Manage queues, patient records, and staff schedules.</p>
                        <div className="mt-4 text-primary-400 font-bold text-sm flex items-center gap-1">
                            Staff Login &rarr;
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything needed to run a smart clinic</h2>
            <p className="text-lg text-slate-600">Replaced complex hospital software with a simple, fast, and intuitive SaaS.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                color: 'bg-blue-100 text-blue-600', 
                title: "Smart Queuing", 
                desc: "Algorithms that predict wait times and manage walk-ins vs appointments seamlessly." 
              },
              { 
                icon: Smartphone, 
                color: 'bg-green-100 text-green-600', 
                title: "WhatsApp Alerts", 
                desc: "Patients get automatic updates: 'You are next' or 'Delayed by 15 mins'." 
              },
              { 
                icon: BarChart3, 
                color: 'bg-purple-100 text-purple-600', 
                title: "Clinic Analytics", 
                desc: "Know your busiest hours, average consult time, and patient flow patterns." 
              },
              { 
                icon: Monitor, 
                color: 'bg-orange-100 text-orange-600', 
                title: "Kiosk Mode", 
                desc: "Turn any Smart TV into a professional digital signage board for your waiting area." 
              },
              { 
                icon: Stethoscope, 
                color: 'bg-red-100 text-red-600', 
                title: "Doctor's AI Assist", 
                desc: "Summarize patient notes and generate prescriptions faster with built-in AI." 
              },
              { 
                icon: Lock, 
                color: 'bg-teal-100 text-teal-600', 
                title: "Data Privacy", 
                desc: "Enterprise-grade security. Your patient data is encrypted and backed up daily." 
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-8 border-none shadow-sm hover:shadow-xl transition-shadow duration-300 bg-slate-50">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">No hidden setup fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-300 ${plan.recommended ? 'border-primary-500 shadow-2xl scale-105 z-10 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide">
                    Most Popular
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

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex gap-1 text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-current" />)}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                "It transformed our clinic in one week."
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                "Before ClinicQ, our reception was a war zone. Patients were angry about wait times. Now, it's silent. Everyone tracks their token from home and arrives just in time. It's magic."
              </p>
              <div>
                <div className="font-bold text-lg">Dr. Anjali Verma</div>
                <div className="text-primary-400">Director, Sunrise Poly Clinic</div>
              </div>
            </div>
            
            <div className="grid gap-6">
              {[
                { text: "Revenue up by 30% because we can handle more walk-ins efficiently.", author: "Dr. Rajesh K.", role: "Dentist" },
                { text: "My staff leaves on time now. No more manual token counting.", author: "Dr. Sameer", role: "Pediatrician" },
                { text: "The WhatsApp alerts feature is a game changer for patients.", author: "Dr. Priya", role: "General Physician" }
              ].map((t, i) => (
                <div key={i} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-300 mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.author}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Making healthcare accessible and organized for everyone. Built with ❤️ in India.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                <li><a href="#" className="hover:text-primary-600">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-600">Kiosk Mode</a></li>
                <li><a href="#" className="hover:text-primary-600">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary-600">About</a></li>
                <li><a href="#" className="hover:text-primary-600">Blog</a></li>
                <li><a href="#" className="hover:text-primary-600">Careers</a></li>
                <li><a href="#" className="hover:text-primary-600">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>© 2024 ClinicQ SaaS Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-600">Privacy</a>
              <a href="#" className="hover:text-slate-600">Terms</a>
              <a href="#" className="hover:text-slate-600">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};