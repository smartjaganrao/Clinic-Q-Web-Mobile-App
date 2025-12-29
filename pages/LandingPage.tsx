
import React, { useEffect, useMemo, useState } from 'react';
import { Clinic, ClinicType } from '../types';
import {
  Search,
  MapPin,
  Stethoscope,
  Building2,
  Calendar,
  QrCode,
  Bell,
  Star,
  ChevronRight,
  Users,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Home,
  PhoneCall,
  FlaskConical,
  Pill,
  UserSearch,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

interface LandingPageProps {
  onPatientEnter: (mode?: 'DOCTOR' | 'CLINIC', query?: string, location?: string) => void;
  onClinicMarketing: () => void;
  onStaffLogin: () => void;
  onSimulateQRScan: (clinicId: string) => void;
  clinics: Clinic[];
}

const SPECIALTIES: { label: string; query: string; icon: React.ElementType }[] = [
  { label: 'General Physician', query: 'General Physician', icon: Stethoscope },
  { label: 'Pediatrician', query: 'Pediatric', icon: Users },
  { label: 'Dentist', query: 'Dental', icon: ShieldCheck },
  { label: 'Orthopedic', query: 'Ortho', icon: Activity },
  { label: 'Dermatologist', query: 'Dermatology', icon: ShieldCheck },
  { label: 'Cardiologist', query: 'Cardiology', icon: HeartIconFallback },
];

function HeartIconFallback(props: any) {
  return <svg viewBox="0 0 24 24" width={20} height={20} {...props}><path fill="currentColor" d="M12 21s-6.716-4.58-9.536-7.4C-0.356 11.2-.289 6.57 3.05 4.05 5.26 2.3 8.28 3.02 10 5c1.72-1.98 4.74-2.7 6.95-.95 3.34 2.52 3.41 7.15.586 9.55C18.716 16.42 12 21 12 21z"/></svg>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onPatientEnter,
  onClinicMarketing,
  onStaffLogin,
  onSimulateQRScan,
  clinics,
}) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const [mockQueue, setMockQueue] = useState(8);
  const [mockEta, setMockEta] = useState(22);
  useEffect(() => {
    const t = setInterval(() => {
      setMockQueue((p) => (p > 5 ? p - 1 : 9));
      setMockEta((p) => (p > 15 ? p - 3 : 24));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const topClinics = useMemo(() => {
    return [...clinics]
      .map((c) => {
        const ratings = c.doctors.map((d) => d.rating || 0);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.5;
        return { clinic: c, avg };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
      .map((x) => x.clinic);
  }, [clinics]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Smart<span className="text-teal-600">QFlow</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Book & Track Visits</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors" onClick={() => document.getElementById('specialities')?.scrollIntoView({ behavior: 'smooth' })}>
                Specialities
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                How it works
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button onClick={onClinicMarketing} variant="ghost" className="text-sm font-bold text-slate-500 hover:text-slate-900">
                Clinic Owners
              </Button>
              <Button onClick={() => onPatientEnter('DOCTOR')} className="rounded-full px-5 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100 font-bold hidden sm:flex text-sm">
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-10 pb-12 sm:pt-16 sm:pb-20 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-center gap-10">
            {/* Left copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-teal-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide uppercase">Live queue & instant booking</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-4">
                Skip the Clinic Waiting Room
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience a hassle-free visit. Join live queues remotely and arrive just in time for your consultation.
              </p>

              {/* ACTION CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto lg:mx-0 mb-10">
                <HeroActionCard 
                  title="FIND CLINICS"
                  description="Search hospitals nearby and see live wait times before you leave."
                  icon={Building2}
                  onClick={() => onPatientEnter('CLINIC')}
                  variant="primary"
                />
                <HeroActionCard 
                  title="FIND DOCTORS"
                  description="Book specialists based on experience, rating, and fees."
                  icon={UserSearch}
                  onClick={() => onPatientEnter('DOCTOR')}
                  variant="secondary"
                />
              </div>

              {/* Social Proof */}
              <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider">
                Trusted by 500+ Clinics • 4.9/5 Patient Rating
              </p>
            </div>

            {/* Right: explainer card showing the queue concept */}
            <div className="hidden md:block relative max-w-md w-full mx-auto lg:ml-auto">
              <div className="absolute -top-6 -right-6 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow z-20">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dr. delayed by 10m</p>
                  <p className="text-[10px] text-slate-500">Auto-update sent</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-900 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">City Clinic</h3>
                      <p className="text-slate-400 text-sm">Gen. Physician • Dr. Meera</p>
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

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <p className="text-xs text-amber-700 font-medium">Queue adjusts automatically if the doctor is late.</p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => onPatientEnter('CLINIC')} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2">
                      <QrCode className="h-4 w-4" /> Join Walk-in Queue
                    </button>
                    <button onClick={() => onPatientEnter('DOCTOR')} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" /> Book Appointment
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

      {/* QUICK ACTIONS */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <QuickAction
              title="Live Queue Status"
              subtitle="Track your place in line"
              icon={Activity}
              onClick={() => onPatientEnter('CLINIC', undefined, location)}
              color="bg-emerald-50 text-emerald-700"
            />
            <QuickAction
              title="Smart Notifications"
              subtitle="Get alerts when your turn is near"
              icon={Bell}
              onClick={() => onPatientEnter('DOCTOR', undefined, location)}
              color="bg-blue-50 text-blue-700"
            />
            <QuickAction
              title="Doctor Profiles"
              subtitle="Detailed info about doctors"
              icon={Users}
              onClick={() => onPatientEnter('DOCTOR', undefined, location)}
              color="bg-purple-50 text-purple-700"
            />
            <QuickAction
              title="Clinic Locations"
              subtitle="Find clinics on a map"
              icon={MapPin}
              onClick={() => onPatientEnter('CLINIC', undefined, location)}
              color="bg-orange-50 text-orange-700"
            />
          </div>
        </div>
      </section>

      {/* TOP SPECIALITIES */}
      <section id="specialities" className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Top specialities</h2>
              <p className="text-slate-500 text-sm">Popular choices for quick booking</p>
            </div>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-sm" onClick={() => onPatientEnter('DOCTOR', undefined, location)}>
              See all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {SPECIALTIES.map((s) => (
              <button
                key={s.label}
                onClick={() => onPatientEnter('DOCTOR', s.query, location)}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{s.label}</div>
                <div className="text-[11px] text-slate-500">Book now</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR CLINICS NEARBY */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Popular clinics</h2>
              <p className="text-slate-500 text-sm">Highly rated clinics around you</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topClinics.map((c) => (
              <ClinicCard key={c.id} clinic={c} onClick={() => onPatientEnter('CLINIC', c.name, c.city)} />
            ))}
            {topClinics.length === 0 && (
              <div className="col-span-full text-slate-500 text-sm">No clinics found in your data. Try importing mock data.</div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">A Stress-Free Clinic Visit in 4 Easy Steps</h2>
          <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
            With SmartQFlow, you're always in control. Here's how simple it is to save time and avoid waiting rooms.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: 'Find Your Doctor', desc: 'Search for doctors or clinics in your city and choose the one that’s right for you.', icon: Search },
              { title: 'Book Your Spot', desc: 'Choose to book a specific time slot or join a live walk-in queue from the comfort of your home.', icon: CheckCircle2 },
              { title: 'Track Your Turn', desc: 'Get real-time updates on your queue position and estimated wait time on your phone.', icon: Activity },
              { title: 'Arrive Just in Time', desc: 'Head to the clinic when it’s almost your turn. No more long, uncertain waits!', icon: MapPin },
            ].map((s, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
                  <s.icon className="h-8 w-8 text-teal-700" />
                </div>
                <div className="font-bold text-slate-900 mb-1">{s.title}</div>
                <div className="text-slate-600 text-sm max-w-[220px]">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY + BENEFITS STRIP */}
      <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-3 gap-4">
      <Benefit icon={ShieldCheck} title="Verified Professionals" subtitle="Every doctor and clinic is verified by our team." />
      <Benefit icon={Clock} title="See Live Wait Times" subtitle="Know the queue length before you even leave home." />
      <Benefit icon={Home} title="Wait From Anywhere" subtitle="Join the queue remotely and relax until it's your turn." />
      </div>
      </div>
      </section>
      
      {/* CTA FOOTER */}
      <footer className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Your time matters. Take control of it.</h2>
          <p className="text-slate-300 mb-8">Ready to get started? Find a doctor or clinic near you and experience a new, stress-free way to manage your health.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white h-12 sm:h-14 px-8 sm:px-12 rounded-full text-base sm:text-lg font-black shadow-xl shadow-teal-900/40 uppercase tracking-widest transition-all transform active:scale-95" onClick={() => onPatientEnter('CLINIC', undefined, location)}>
              Find clinics near me
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 h-12 sm:h-14 px-8 sm:px-12 rounded-full text-base sm:text-lg font-bold transition-all transform active:scale-95" onClick={() => onPatientEnter('DOCTOR', undefined, location)}>
              Find doctors
            </Button>
          </div>
          <div className="mt-10 text-sm text-slate-400">
            Are you a clinic owner?{' '}
            <button onClick={onClinicMarketing} className="text-teal-300 hover:text-teal-200 font-semibold underline">
              See how SmartQFlow helps you →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

function HeroActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}) {
  const colorClasses = variant === 'primary' 
    ? 'text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-teal-200 shadow-teal-50' 
    : 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200 shadow-indigo-50';
  
  const accentTextClass = variant === 'primary' ? 'text-teal-600 group-hover:text-teal-800' : 'text-indigo-600 group-hover:text-indigo-800';

  return (
    <button
      onClick={onClick}
      className={`group relative bg-white border border-slate-200 p-6 sm:p-8 rounded-[2.5rem] text-left transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden h-full flex flex-col`}
    >
      {/* Background Hover Glow */}
      <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl ${variant === 'primary' ? 'bg-teal-100/50' : 'bg-indigo-100/50'}`}></div>
      
      <div className="relative z-10 flex flex-col flex-1">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 shadow-xl ${colorClasses}`}>
          <Icon className="h-7 w-7" />
        </div>
        
        <h3 className="font-black text-slate-900 text-xl leading-tight mb-3 tracking-tight">
          {title}
        </h3>
        
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          {description}
        </p>
        
        <div className={`mt-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors duration-300 ${accentTextClass}`}>
          Go to search <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

function QuickAction({
  title,
  subtitle,
  icon: Icon,
  onClick,
  color,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-left hover:shadow-lg transition-all hover:-translate-y-0.5`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-bold text-slate-900 text-sm">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </button>
  );
}

function Benefit({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 text-teal-700 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold text-slate-900 text-sm">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

const ClinicCard: React.FC<{ clinic: Clinic; onClick: () => void }> = ({ clinic, onClick }) => {
  const avgRating = useMemo(() => {
    const rs = clinic.doctors.map((d) => d.rating || 0);
    return rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10 : 4.5;
  }, [clinic]);

  const typeLabel = clinic.type ? formatClinicType(clinic.type) : 'Clinic';

  return (
    <button onClick={onClick} className="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 transition-all">
      <div className="flex items-start gap-3">
        {clinic.imageUrl ? (
          <img src={clinic.imageUrl} alt={clinic.name} className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold">{clinic.name.substring(0, 2).toUpperCase()}</div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-slate-900">{clinic.name}</div>
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <Star className="h-4 w-4 fill-amber-400" /> {avgRating}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{typeLabel} • {clinic.city}</div>
          {clinic.operatingHours && (
            <div className="text-[11px] text-slate-500 mt-1">Hours: {clinic.operatingHours}</div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-500">{clinic.doctors.length} doctors • Live queue supported</div>
            <div className="text-xs font-semibold text-teal-700 flex items-center gap-1">
              Book now <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function formatClinicType(type: ClinicType) {
  switch (type) {
    case ClinicType.GENERAL:
      return 'General Clinic';
    case ClinicType.PEDIATRIC:
      return 'Pediatric Clinic';
    case ClinicType.GYNECOLOGY:
      return 'Gynecology Clinic';
    case ClinicType.ORTHOPEDIC:
      return 'Orthopedic Clinic';
    case ClinicType.DENTAL:
      return 'Dental Clinic';
    case ClinicType.CARDIOLOGY:
      return 'Cardiology Clinic';
    case ClinicType.DERMATOLOGY:
      return 'Dermatology Clinic';
    case ClinicType.EMERGENCY:
      return 'Emergency Care';
    default:
      return 'Clinic';
  }
}
