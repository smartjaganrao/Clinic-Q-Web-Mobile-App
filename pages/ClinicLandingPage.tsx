
import React from 'react';
import { 
  Monitor, Stethoscope, Smartphone, LayoutGrid, Zap, 
  CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, Users,
  BarChart3, Clock, Lock, Activity, CalendarDays, Building2, 
  UserCheck, Shield, Heart, XCircle, Info, Sparkles, Phone, 
  Star, Languages, MessageCircle, Tv, ZapOff, HandMetal, Coffee, 
  UserPlus, BellRing
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-9 w-9" />
              <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Smart<span className="text-primary-600">QFlow</span></span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Clinic SaaS Platform</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">How it Works</button>
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">Features</button>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">Pricing</button>
            </div>

            <div className="flex items-center gap-4">
                <Button onClick={onBackToPatient} variant="ghost" className="text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest hidden sm:flex">
                    Patient App
                </Button>
               <div className="flex items-center gap-2">
                   <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-primary-600 px-3">Login</button>
                   <Button onClick={onStartFreeTrial} className="rounded-xl px-5 bg-slate-900 hover:bg-slate-800 text-white shadow-lg text-sm font-bold">Try Free Trial</Button>
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-slate-50 -z-10"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100/40 rounded-full blur-[120px] -z-10 -mr-64 -mt-64"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center lg:text-left grid lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 bg-white border border-primary-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[11px] font-black text-slate-700 tracking-[0.2em] uppercase">Built for Bharat 🇮🇳</span>
                    </span>
                    
                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.05]">
                        Turn OPD Chaos into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Pure Flow.</span>
                    </h1>
                    
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                        A smart hybrid queue system that manages walk-ins, appointments, and TV announcements automatically. 
                        <strong> Save 2 hours of staff time every single day.</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={onStartFreeTrial} size="lg" className="h-16 px-10 rounded-2xl text-lg font-black shadow-2xl shadow-primary-200 uppercase tracking-widest">
                            Start 30-Day Free Trial
                        </Button>
                        <button onClick={onLogin} className="h-16 px-10 rounded-2xl text-lg font-bold text-slate-700 bg-white border-2 border-slate-100 hover:border-primary-400 transition-all flex items-center justify-center gap-2">
                            Explore Demo <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-6 text-slate-400">
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-xs font-bold uppercase tracking-wider">No Credit Card Required</span></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-xs font-bold uppercase tracking-wider">Cancel Anytime</span></div>
                    </div>
                  </div>

                  <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-indigo-400 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 relative overflow-hidden transform hover:-rotate-1 transition-transform duration-500">
                          {/* Mock UI elements */}
                          <div className="flex justify-between items-center mb-6 px-4 pt-2">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><LayoutGrid className="h-5 w-5" /></div>
                                  <div className="text-sm font-black uppercase tracking-tight">Clinic Dashboard</div>
                              </div>
                              <div className="flex gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div>
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"><Activity className="h-4 w-4" /></div>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Revenue</p>
                                  <p className="text-2xl font-black text-slate-900 tracking-tight">₹12,450</p>
                              </div>
                              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Live Queue</p>
                                  <p className="text-2xl font-black text-primary-700 tracking-tight">18 Patients</p>
                              </div>
                          </div>

                          <div className="space-y-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-inner">
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black">#04</div>
                                      <div className="text-xs font-bold">Ravi Chandran</div>
                                  </div>
                                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded">WITH DOCTOR</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-xs font-black">#05</div>
                                      <div className="text-xs font-bold">Anita Peters</div>
                                  </div>
                                  <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded">WAITING</span>
                              </div>
                          </div>
                      </div>

                      {/* Floating Notification */}
                      <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-in slide-in-from-left-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Languages className="h-5 w-5" /></div>
                          <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Voice Announcement</p>
                              <p className="text-[10px] text-slate-500">"Token #04, Room 1-க்கு வரவும்"</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- THE PROBLEM --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-950 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px]"></div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 leading-tight">
                            OPDs are broken.<br/> We're fixing them.
                        </h2>
                        <div className="space-y-6">
                            <ProblemRow icon={Users} text="Overcrowded waiting rooms leading to patient frustration." />
                            <ProblemRow icon={Phone} text="Reception staff wasting 60% of their time answering 'How much longer?'" />
                            <ProblemRow icon={HandMetal} text="No-shows and late arrivals disrupting doctor schedules." />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <ROIStat label="Patient Wait Reduction" value="45%" color="text-primary-400" />
                        <ROIStat label="Reception Efficiency" value="2.5x" color="text-indigo-400" />
                        <ROIStat label="Daily Patient Growth" value="20%" color="text-emerald-400" />
                        <ROIStat label="No-Show Rate" value="-60%" color="text-rose-400" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- THREE PILLARS --- */}
      <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">One App. Three Workflows.</h2>
                  <p className="text-slate-500 mt-4 text-lg">SmartQFlow syncs your entire clinic ecosystem in real-time.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-10">
                  <WorkflowCard 
                    title="Reception Powerhouse"
                    description="Issue paperless tokens, manage phone appointments, and monitor entire clinic traffic from one screen."
                    icon={UserPlus}
                    color="bg-primary-50 text-primary-600 border-primary-100"
                    features={["Quick Walk-in Entry", "Shift-wise Queue", "Vitals Pre-entry"]}
                  />
                  <WorkflowCard 
                    title="Doctor Console"
                    description="Professional workspace to call next patients, view digital vitals, and write prescriptions with AI help."
                    icon={Stethoscope}
                    color="bg-indigo-50 text-indigo-600 border-indigo-100"
                    features={["AI Consultation Summaries", "Body Pain Map", "Instant Rx History"]}
                  />
                  <WorkflowCard 
                    title="Smart Display (Kiosk)"
                    description="Turn any TV into an automated calling system with local language voice announcements."
                    icon={Tv}
                    color="bg-purple-50 text-purple-600 border-purple-100"
                    features={["Tamil/Telugu Voice Support", "Live Token Display", "Zero Staff Intervention"]}
                  />
              </div>
          </div>
      </section>

      {/* --- REGIONAL MAGIC --- */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 transform -rotate-2">
                             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4"><Languages className="h-6 w-6" /></div>
                             <h4 className="font-bold mb-2">Tamil & Telugu</h4>
                             <p className="text-xs text-slate-500 leading-relaxed">Full voice support for neighborhood clinics. Patients understand their turn without reading.</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 transform rotate-2 mt-8">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4"><MessageCircle className="h-6 w-6" /></div>
                             <h4 className="font-bold mb-2">WhatsApp Tokens</h4>
                             <p className="text-xs text-slate-500 leading-relaxed">Tokens sent directly to patient's WhatsApp. No more lost paper chits.</p>
                        </div>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full mb-6">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Special Local Features</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">Localized for the Indian Patient.</h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        We understand Indian clinic dynamics. From handling multi-family bookings on one mobile number to announcing tokens in the local mother tongue—we've built for the ground up.
                    </p>
                    <ul className="space-y-4">
                        <CheckItem text="Automated token announcements (No staff required)" />
                        <CheckItem text="Works perfectly on low-speed internet/3G" />
                        <CheckItem text="QR Code based touchless check-in for modern branding" />
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* --- HARDWARE --- */}
      <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Zero Hardware Costs.</h2>
              <p className="text-slate-500 mb-12">Don't buy expensive servers or tablets. SmartQFlow works on what you already have.</p>
              
              <div className="grid sm:grid-cols-3 gap-8">
                  <HardwareCard icon={Smartphone} title="Smartphones" desc="Staff & Doctors can use their own Android/iOS devices." />
                  <HardwareCard icon={Monitor} title="PC / Laptop" desc="Receptionist can use any web browser on existing PCs." />
                  <HardwareCard icon={Tv} title="Existing TVs" desc="Use any Android TV or FireStick for the live calling display." />
              </div>
          </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-slate-950 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Flexible SaaS Pricing</h2>
                  <p className="text-slate-400">Scale as you grow. No hidden setups or long-term contracts.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {PRICING_PLANS.map((plan, idx) => (
                      <div key={plan.name} className={`relative p-8 rounded-3xl border flex flex-col transition-all hover:scale-[1.02] ${plan.recommended ? 'bg-primary-600 border-primary-500 shadow-[0_20px_50px_rgba(20,184,166,0.3)] z-10' : 'bg-slate-900 border-slate-800'}`}>
                          {plan.recommended && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-primary-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
                                  Highly Recommended
                              </div>
                          )}
                          <h3 className="text-xl font-black mb-1 uppercase tracking-tight">{plan.name}</h3>
                          <p className="text-xs opacity-60 mb-8">{idx === 0 ? 'Best for clinics starting out' : idx === 1 ? 'For busy multi-doctor practices' : 'For hospital chains'}</p>
                          
                          <div className="flex items-baseline gap-2 mb-10">
                              <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                              <span className="text-sm opacity-50 font-bold uppercase tracking-widest">/month</span>
                          </div>
                          
                          <ul className="space-y-4 mb-10 flex-1">
                              {plan.features.map(f => (
                                  <li key={f} className="flex items-start gap-3 text-sm">
                                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                                      <span className="opacity-90 font-medium">{f}</span>
                                  </li>
                              ))}
                          </ul>
                          
                          <Button 
                            onClick={onStartFreeTrial} 
                            variant={plan.recommended ? 'secondary' : 'primary'}
                            className={`w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest transition-all ${
                                plan.recommended 
                                ? 'text-primary-700 hover:bg-white/90 shadow-xl border-none' 
                                : 'bg-slate-800 text-white hover:bg-slate-700 border-none'
                            }`}
                          >
                              Choose {plan.name}
                          </Button>
                      </div>
                  ))}
              </div>

              <div className="mt-20 text-center">
                  <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-slate-400 text-sm">
                      <ShieldCheck className="h-6 w-6 text-primary-400" />
                      <span>Are you a registered NGO or Government Hospital? <button className="text-primary-400 font-bold hover:underline">Apply for Free License</button></span>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-black text-center text-slate-900 mb-16 uppercase tracking-tight">Onboarding Questions</h2>
              <div className="space-y-8 text-left">
                  <FAQItem q="How do I display tokens on my TV?" a="Simple! If you have a Smart TV, just open the TV browser. If not, plug in a cheap Amazon FireStick or Mi Box and open our Kiosk link." />
                  <FAQItem q="Do patients need to download the app?" a="No. While our app offers a better experience, patients can also join your queue by simply scanning a QR code at your reception." />
                  <FAQItem q="What happens if my internet goes down?" a="We've built local offline caching. The receptionist can still see the queue, and once the connection returns, it syncs back to our cloud instantly." />
                  <FAQItem q="Is my patient data secure?" a="Yes. We use banking-grade 256-bit encryption. Your clinical notes are private and comply with Indian Digital Health standards." />
              </div>
          </div>
      </section>
      
      {/* --- FOOTER CTA --- */}
      <footer className="py-24 bg-slate-50 border-t border-slate-200 text-center">
          <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl font-black mb-6 tracking-tight">Start your 14-day free trial today.</h2>
              <p className="text-slate-500 mb-12 text-lg">No commitment. Join the future of healthcare clinics.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Button size="lg" className="h-16 px-12 rounded-2xl text-xl font-black shadow-2xl uppercase tracking-widest" onClick={onStartFreeTrial}>
                       Get Started Now
                   </Button>
                   <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl text-xl font-black border-slate-300 hover:bg-white uppercase tracking-widest" onClick={onLogin}>
                       Request Demo
                   </Button>
              </div>
              
              <div className="mt-20 pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-3">
                      <Logo className="h-8 w-8 grayscale opacity-50" />
                      <span className="text-sm font-black text-slate-400 uppercase tracking-widest">SmartQFlow Platform</span>
                  </div>
                  <div className="flex gap-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
                      <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
                      <a href="#" className="hover:text-primary-600 transition-colors">Contact Sales</a>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">© 2025 SmartQFlow Technologies Pvt Ltd.</p>
              </div>
          </div>
      </footer>

    </div>
  );
};

function ProblemRow({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
            <div className="p-3 bg-white/10 text-primary-400 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all"><Icon className="h-5 w-5" /></div>
            <p className="text-slate-300 font-medium leading-relaxed">{text}</p>
        </div>
    );
}

function ROIStat({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center group hover:bg-white/10 transition-all">
            <p className={`${color} text-4xl md:text-5xl font-black mb-2 tracking-tighter`}>{value}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        </div>
    );
}

function WorkflowCard({ title, description, icon: Icon, color, features }: { title: string, description: string, icon: any, color: string, features: string[] }) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className={`p-4 rounded-2xl w-fit mb-8 shadow-sm ${color}`}>
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none uppercase">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">{description}</p>
            <div className="space-y-3 pt-6 border-t border-slate-50">
                {features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{f}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CheckItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3">
            <div className="mt-1 bg-green-100 p-0.5 rounded-full"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div>
            <span className="text-slate-700 font-bold text-sm">{text}</span>
        </li>
    );
}

function HardwareCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary-200 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all text-slate-400">
                <Icon className="h-6 w-6" />
            </div>
            <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-sm">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-all">
            <h4 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-wide flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-primary-600"></div> {q}
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed pl-4 font-medium">{a}</p>
        </div>
    );
}
