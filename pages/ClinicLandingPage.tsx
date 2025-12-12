
import React from 'react';
import { 
  Monitor, Stethoscope, Smartphone, LayoutGrid, Zap, 
  CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, Users,
  BarChart3, Clock, Lock
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { PRICING_PLANS } from '../constants';

interface ClinicLandingPageProps {
  onStartFreeTrial: () => void;
  onLogin: () => void;
  onBackToPatient: () => void;
}

export const ClinicLandingPage: React.FC<ClinicLandingPageProps> = ({ onStartFreeTrial, onLogin, onBackToPatient }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-9 w-9" />
              <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Smart<span className="text-primary-600">QFlow</span></span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">For Clinics</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</button>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</button>
                <button onClick={onBackToPatient} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">For Patients</button>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-primary-600 px-4 py-2 hidden sm:block">Login</button>
               <Button onClick={onStartFreeTrial} className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">Start Free Trial</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-28 lg:pt-32 lg:pb-40 overflow-hidden bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                  <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">New: Kiosk Mode Included</span>
              </span>
              
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1] max-w-4xl mx-auto">
                  The Operating System for <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Modern Medical Practices.</span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Streamline your reception, manage hybrid queues, and delight patients with live tracking. All in one simple dashboard.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={onStartFreeTrial} size="lg" className="h-14 px-8 rounded-full text-lg font-bold shadow-xl shadow-primary-200">
                      Get Started Free
                  </Button>
                  <Button onClick={onLogin} size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-slate-300 hover:bg-white">
                      View Demo
                  </Button>
              </div>

              {/* Dashboard Preview Image */}
              <div className="mt-20 relative mx-auto max-w-5xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10"></div>
                  <div className="rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white">
                      {/* Abstract representation of the dashboard */}
                      <div className="bg-slate-100 h-8 border-b border-slate-200 flex items-center px-4 gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="p-2 grid grid-cols-4 gap-2 bg-slate-50">
                          {/* Sidebar */}
                          <div className="hidden md:block col-span-1 bg-white h-64 rounded-lg border border-slate-200 p-4 space-y-2">
                              <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                              <div className="h-8 w-full bg-primary-50 rounded"></div>
                              <div className="h-8 w-full bg-white border border-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-white border border-slate-100 rounded"></div>
                          </div>
                          {/* Main Content */}
                          <div className="col-span-4 md:col-span-3 grid grid-cols-2 gap-4">
                              <div className="col-span-2 flex gap-4">
                                  <div className="flex-1 h-24 bg-white rounded-lg border border-slate-200 p-4">
                                      <div className="h-4 w-8 bg-blue-100 rounded mb-2"></div>
                                      <div className="h-8 w-16 bg-slate-900 rounded"></div>
                                  </div>
                                  <div className="flex-1 h-24 bg-white rounded-lg border border-slate-200 p-4">
                                      <div className="h-4 w-8 bg-green-100 rounded mb-2"></div>
                                      <div className="h-8 w-16 bg-slate-900 rounded"></div>
                                  </div>
                                  <div className="flex-1 h-24 bg-white rounded-lg border border-slate-200 p-4">
                                      <div className="h-4 w-8 bg-orange-100 rounded mb-2"></div>
                                      <div className="h-8 w-16 bg-slate-900 rounded"></div>
                                  </div>
                              </div>
                              <div className="col-span-2 bg-white h-48 rounded-lg border border-slate-200 p-4 space-y-3">
                                  <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                                  {[1,2,3].map(i => (
                                      <div key={i} className="h-10 w-full bg-slate-50 rounded flex items-center px-4 justify-between">
                                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">Tools for the Entire Clinic</h2>
                  <p className="text-slate-500 mt-4 max-w-2xl mx-auto">We connect your reception, doctors, and patients in a seamless loop.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {/* Reception */}
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                          <LayoutGrid className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Front Desk Command Center</h3>
                      <ul className="space-y-3 text-slate-600 text-sm">
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Add Walk-in patients in 5 seconds</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Manage appointments & emergency cases</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Collect payments & print tokens</li>
                      </ul>
                  </div>

                  {/* Doctor */}
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all">
                      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                          <Stethoscope className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Doctor Console</h3>
                      <ul className="space-y-3 text-slate-600 text-sm">
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Call next patient with one click</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> AI-assisted clinical notes summaries</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Digital prescriptions & history</li>
                      </ul>
                  </div>

                  {/* Patient Experience */}
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all">
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                          <Smartphone className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Premium Patient Experience</h3>
                      <ul className="space-y-3 text-slate-600 text-sm">
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Live queue tracking from home</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-purple-500" /> TV Kiosk Mode for waiting room</li>
                          <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Automatic delay notifications</li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
                  <p className="text-slate-400">Start with a 14-day free trial. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {PRICING_PLANS.map((plan, idx) => (
                      <div key={plan.name} className={`relative p-8 rounded-3xl border flex flex-col ${plan.recommended ? 'bg-indigo-600 border-indigo-500 shadow-2xl scale-105 z-10' : 'bg-slate-800 border-slate-700'}`}>
                          {plan.recommended && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                  Most Popular
                              </div>
                          )}
                          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1 mb-6">
                              <span className="text-4xl font-black">{plan.price}</span>
                              <span className="text-sm opacity-60">/month</span>
                          </div>
                          <ul className="space-y-4 mb-8 flex-1">
                              {plan.features.map(f => (
                                  <li key={f} className="flex items-start gap-3 text-sm">
                                      <CheckCircle2 className="h-5 w-5 shrink-0 opacity-80" />
                                      <span className="opacity-90">{f}</span>
                                  </li>
                              ))}
                          </ul>
                          <Button onClick={onStartFreeTrial} className={`w-full ${plan.recommended ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-primary-600 text-white hover:bg-primary-500'}`}>
                              Choose {plan.name}
                          </Button>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- TRUST / CTA --- */}
      <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="flex justify-center items-center gap-8 mb-12 opacity-50 grayscale">
                  {/* Mock Logos */}
                  <div className="font-black text-2xl text-slate-400">APOLLO</div>
                  <div className="font-black text-2xl text-slate-400">FORTIS</div>
                  <div className="font-black text-2xl text-slate-400">MANIPAL</div>
              </div>
              
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to upgrade your clinic?</h2>
              <p className="text-lg text-slate-500 mb-8">Join thousands of doctors who have reclaimed their time.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white h-14 px-10 rounded-full text-lg font-bold shadow-xl" onClick={onStartFreeTrial}>
                       Get Started Now
                   </Button>
              </div>
              
              <div className="mt-8 flex justify-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> HIPAA Compliant</span>
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> 256-bit Encryption</span>
              </div>
          </div>
      </section>

    </div>
  );
};
