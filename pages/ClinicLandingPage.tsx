import React from 'react';
import { 
  Monitor, Stethoscope, Smartphone, LayoutGrid, Zap, 
  CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, Users,
  BarChart3, Clock, Lock, CreditCard, Activity, CalendarDays, Mic, Search, Video, FileText, Pill, AlertTriangle, Building2, UserCheck, Shield, Heart, XCircle, Info, Sparkles, Phone, AlertCircle, Star, Languages, MessageCircle
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
                <button onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Comparison</button>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</button>
            </div>

            <div className="flex items-center gap-4">
                {/* Mode Toggle */}
               <div className="bg-slate-100 p-1 rounded-full flex items-center">
                  <button onClick={onBackToPatient} className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition-all">
                      Patient
                  </button>
                  <button className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-sm transition-all cursor-default">
                      Clinic
                  </button>
               </div>

               <div className="flex items-center gap-2 hidden sm:flex">
                   <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-primary-600 px-3">Login</button>
                   <Button onClick={onStartFreeTrial} className="rounded-full px-5 bg-slate-900 hover:bg-slate-800 text-white shadow-lg text-sm">Start Free Trial</Button>
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-28 overflow-hidden bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                  <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">Made for Indian Clinics 🇮🇳</span>
              </span>
              
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1] max-w-5xl mx-auto">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Smart Queue System</span> <br/>
                  Doctors Love.
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Manage walk-ins and appointments seamlessly. Reduce crowd chaos with our <strong>Tamil-speaking TV Token System.</strong>
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={onStartFreeTrial} size="lg" className="h-14 px-8 rounded-full text-lg font-bold shadow-xl shadow-primary-200">
                      Get Started Free
                  </Button>
                  <Button onClick={onLogin} size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-slate-300 hover:bg-white">
                      View Demo
                  </Button>
              </div>

              {/* LOCATIONS TICKER */}
              <div className="mt-12 pt-8 border-t border-slate-200 max-w-4xl mx-auto">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted by 500+ Clinics in</p>
                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-slate-600 font-bold opacity-70">
                      <span>Chennai</span>
                      <span className="text-slate-300">•</span>
                      <span>Coimbatore</span>
                      <span className="text-slate-300">•</span>
                      <span>Madurai</span>
                      <span className="text-slate-300">•</span>
                      <span>Salem</span>
                      <span className="text-slate-300">•</span>
                      <span>Trichy</span>
                  </div>
              </div>

              {/* Dashboard Preview Image */}
              <div className="mt-16 relative mx-auto max-w-5xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10"></div>
                  <div className="rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white">
                      <div className="bg-slate-100 h-8 border-b border-slate-200 flex items-center px-4 gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="p-2 grid grid-cols-4 gap-2 bg-slate-50">
                          <div className="hidden md:block col-span-1 bg-white h-64 rounded-lg border border-slate-200 p-4 space-y-2">
                              <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                              <div className="h-8 w-full bg-primary-50 rounded"></div>
                              <div className="h-8 w-full bg-white border border-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-white border border-slate-100 rounded"></div>
                          </div>
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

      {/* --- BENEFITS COMPARISON --- */}
      <section id="benefits" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900">Why Clinics Choose SmartQFlow</h2>
                  <p className="text-slate-500 mt-2">The difference is clear.</p>
              </div>

              <div className="rounded-3xl shadow-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="grid grid-cols-2 text-center bg-slate-50 border-b border-slate-200">
                      <div className="py-6 font-bold text-slate-500 text-lg">Without SmartQFlow</div>
                      <div className="py-6 font-bold text-primary-700 bg-primary-50/50 text-lg">With SmartQFlow</div>
                  </div>
                  
                  {[
                      ["Chaotic waiting rooms", "Organized, quiet workflow"],
                      ["Patients complain about wait time", "Real-time transparency"],
                      ["Reception overloaded with questions", "Automated display + app"],
                      ["Manual register/Excel", "Digital queue + appointments"],
                      ["No-shows & walk-in confusion", "Smart late arrival logic"],
                      ["Doctor distracted by crowd", "Doctor focuses only on patients"],
                  ].map((row, i) => (
                      <div key={i} className="grid grid-cols-2 border-b border-slate-100 last:border-none hover:bg-slate-50/50 transition-colors">
                          <div className="p-6 text-slate-600 flex items-center justify-center text-center border-r border-slate-100">{row[0]}</div>
                          <div className="p-6 font-bold text-slate-900 bg-primary-50/10 flex items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-primary-50 opacity-0 hover:opacity-100 transition-opacity"></div>
                              <span className="relative z-10 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-600" /> {row[1]}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- COMPETITOR COMPARISON --- */}
      <section id="comparison" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">Market Analysis</span>
                  <h2 className="text-3xl font-bold text-slate-900 mt-2">SmartQFlow vs Competitors</h2>
                  <p className="text-slate-500 mt-4 max-w-2xl mx-auto">See why we are the top choice for modern OPDs in India.</p>
              </div>

              <div className="overflow-x-auto pb-6">
                  <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                      <thead>
                          <tr className="bg-slate-900 text-white">
                              <th className="p-4 rounded-tl-xl w-1/4">Features</th>
                              <th className="p-4 bg-primary-600 font-bold text-lg border-b-4 border-primary-800">SmartQFlow</th>
                              <th className="p-4 text-slate-300">Practo Ray</th>
                              <th className="p-4 text-slate-300">QueueOne</th>
                              <th className="p-4 text-slate-300">QDoc</th>
                              <th className="p-4 text-slate-300 rounded-tr-xl">Basic Token Apps</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                          {[
                              ["Walk-in queue management", true, true, true, true, true],
                              ["Appointment scheduling", true, true, false, true, false],
                              ["Hybrid queue (walk-in + appt)", "STAR", false, false, false, false],
                              ["Live ETA for patients", true, true, true, false, false],
                              ["Regional Kiosk Voice (Tamil/Telugu)", "STAR", false, false, false, false],
                              ["Family booking", true, true, false, false, false],
                              ["Multi-clinic doctor identity", "STAR", false, false, false, false],
                              ["Smart late-arrival penalty", "STAR", false, false, false, false],
                              ["Emergency bump", true, false, false, true, false],
                              ["WhatsApp Integration", true, true, false, true, false],
                              ["Digital notes", true, true, false, true, false],
                              ["Quick Rx", true, true, false, true, false],
                              ["AI summary", true, false, false, false, false],
                              ["Telemedicine", true, true, false, false, false],
                              ["Patient mobile app with Live Queue", true, true, false, false, false],
                              ["Price per doctor", "₹1,250", "₹2,200–₹6,000", "₹800–₹1,500", "₹1,500", "₹300–₹800"],
                              ["Complete queue automation", "STAR", false, false, false, false],
                          ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-4 font-medium text-slate-900">{row[0]}</td>
                                  <td className="p-4 bg-primary-50 font-bold text-primary-700 text-center border-x border-primary-100">
                                      {row[1] === "STAR" ? <span className="flex items-center justify-center gap-1"><Star className="h-4 w-4 fill-current text-yellow-500" /> Yes</span> : row[1] === true ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /> : row[1]}
                                  </td>
                                  <td className="p-4 text-center text-slate-500">{row[2] === true ? <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto" /> : row[2] === false ? <XCircle className="h-5 w-5 text-slate-300 mx-auto" /> : row[2]}</td>
                                  <td className="p-4 text-center text-slate-500">{row[3] === true ? <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto" /> : row[3] === false ? <XCircle className="h-5 w-5 text-slate-300 mx-auto" /> : row[3]}</td>
                                  <td className="p-4 text-center text-slate-500">{row[4] === true ? <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto" /> : row[4] === false ? <XCircle className="h-5 w-5 text-slate-300 mx-auto" /> : row[4]}</td>
                                  <td className="p-4 text-center text-slate-500">{row[5] === true ? <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto" /> : row[5] === false ? <XCircle className="h-5 w-5 text-slate-300 mx-auto" /> : row[5]}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </section>

      {/* --- WHY SMARTQFLOW WINS --- */}
      <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                      <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Competitive Advantage</span>
                      </div>
                      <h2 className="text-4xl font-bold text-slate-900 mb-6">Why SmartQFlow Wins</h2>
                      <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                          SmartQFlow is the <strong className="text-slate-900">ONLY</strong> app that provides Uber-like transparency to patients while handling complex medical workflows.
                      </p>
                      <ul className="space-y-4">
                          {[
                              "Shows true live ETA & position",
                              "Merges walk-ins + appointments intelligently",
                              "TV Voice Announcements in Tamil/Telugu",
                              "Supports late-arrival rules & penalties",
                              "Avoids duplicate doctor profiles across clinics",
                              "Lets doctors work across multiple clinics cleanly"
                          ].map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                  <div className="mt-1 bg-green-100 p-1 rounded-full">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </div>
                                  <span className="text-slate-700 font-medium">{item}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                      <h3 className="font-bold text-xl text-slate-900 mb-6">Pricing Differentiation</h3>
                      <div className="space-y-4">
                          {[
                              { label: "Low Cost", desc: "40–60% cheaper than Practo" },
                              { label: "Hybrid Queue", desc: "Unique feature; no competitor has this" },
                              { label: "Local Language", desc: "Tamil Voice Announcements for Kiosk" },
                              { label: "True Live ETA", desc: "Better accuracy than token apps" },
                              { label: "WhatsApp Ready", desc: "Send tokens via WhatsApp API" },
                              { label: "AI Tools", desc: "No competitor offers AI summaries" }
                          ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="font-bold text-slate-700">{item.label}</span>
                                  <span className="text-sm text-slate-500">{item.desc}</span>
                              </div>
                          ))}
                      </div>
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

              <div className="grid md:grid-cols-4 gap-6">
                  {PRICING_PLANS.map((plan, idx) => (
                      <div key={plan.name} className={`relative p-6 rounded-2xl border flex flex-col ${plan.recommended ? 'bg-indigo-600 border-indigo-500 shadow-2xl scale-105 z-10' : 'bg-slate-800 border-slate-700'}`}>
                          {plan.recommended && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  Best Value
                              </div>
                          )}
                          <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1 mb-6">
                              <span className="text-3xl font-black">{plan.price}</span>
                              <span className="text-xs opacity-60">{plan.name === 'Pay-Per-Booking' ? '/booking' : '/month'}</span>
                          </div>
                          <ul className="space-y-3 mb-8 flex-1">
                              {plan.features.map(f => (
                                  <li key={f} className="flex items-start gap-2 text-xs">
                                      <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                                      <span className="opacity-90">{f}</span>
                                  </li>
                              ))}
                          </ul>
                          <Button onClick={onStartFreeTrial} className={`w-full text-sm h-10 ${plan.recommended ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-primary-600 text-white hover:bg-primary-500'}`}>
                              Choose {plan.name}
                          </Button>
                      </div>
                  ))}
              </div>

              {/* Patient Pricing Note */}
              <div className="mt-16 max-w-3xl mx-auto bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary-400" /> Patient Pricing</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                      <div>
                          <p className="text-lg font-bold text-white mb-2">Free for Patients</p>
                          <p className="text-sm text-slate-400">Patients can search, book, and track queues for free. No subscription required.</p>
                      </div>
                      <div className="text-sm text-slate-400">
                          <p className="font-bold text-white mb-2">Optional Charges:</p>
                          <ul className="space-y-1">
                              <li className="flex justify-between"><span>Teleconsultation fee</span> <span className="text-white">Clinic decides</span></li>
                              <li className="flex justify-between"><span>Appt convenience fee</span> <span className="text-white">₹5–₹10</span></li>
                              <li className="flex justify-between"><span>Priority visit (optional)</span> <span className="text-white">₹10–₹20</span></li>
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SEGMENTS (For Clinics of All Sizes) --- */}
      <section id="segments" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">For Clinics of All Sizes</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                          <UserCheck className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Solo Clinics</h3>
                      <p className="text-slate-600 text-sm">Clean queue system, professional patient experience.</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                          <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Specialty Hospitals</h3>
                      <p className="text-slate-600 text-sm">Multiple doctors, multiple counters, unified management.</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                          <LayoutGrid className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Chains & Corporate</h3>
                      <p className="text-slate-600 text-sm">Central dashboard, analytics, subscription & usage tracking.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- LOCAL FEATURES HIGHLIGHT --- */}
      <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full mb-8">
                  <Languages className="h-5 w-5 text-slate-600" />
                  <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">Built for India</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-slate-600 font-medium">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Tamil & Telugu Kiosk Voice</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> WhatsApp Token Alerts</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Works on Low Bandwidth</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> SMS Integration (DLT Ready)</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> UPI Payment Integration</span>
              </div>
          </div>
      </section>

      {/* --- TRUST / CTA --- */}
      <section className="py-24 bg-slate-900 text-white border-t border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 opacity-50"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Modernize your clinic today.</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">Join the best clinics in Tamil Nadu.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                   <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white h-14 px-10 rounded-full text-lg font-bold shadow-xl" onClick={onStartFreeTrial}>
                       Start Free Trial
                   </Button>
                   <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 h-14 px-10 rounded-full text-lg" onClick={onLogin}>
                       Request a Demo
                   </Button>
              </div>
              <p className="mt-6 text-slate-400 text-sm">Or talk to sales: <span className="text-white font-bold hover:underline cursor-pointer">+91 98765 43210</span></p>
          </div>
      </section>

    </div>
  );
};