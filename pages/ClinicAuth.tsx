
import React, { useState } from 'react';
import { Clinic, PlanType, UserRole, ClinicOperationMode, ClinicType, Staff } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Building2, Plus, LogIn, CheckCircle, Footprints, CalendarClock, Shuffle, Stethoscope, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { Logo } from '../components/Logo';
import { storage } from '../services/storage';

interface ClinicAuthProps {
  clinics: Clinic[];
  onSelectClinic: (clinicId: string) => void;
  onRegister?: (clinicId: string, userId: string) => void;
  onBack: () => void;
  role?: UserRole | null;
}

const CLINIC_TYPES = [
    { id: ClinicType.GENERAL, label: 'General Practice / Polyclinic' },
    { id: ClinicType.DENTAL, label: 'Dental Clinic' },
    { id: ClinicType.PEDIATRIC, label: 'Pediatric / Child Care' },
    { id: ClinicType.GYNECOLOGY, label: 'Maternity / Gynecology' },
    { id: ClinicType.ORTHOPEDIC, label: 'Orthopedic / Bone & Joint' },
    { id: ClinicType.CARDIOLOGY, label: 'Cardiology / Heart Center' },
    { id: ClinicType.DERMATOLOGY, label: 'Skin & Dermatology' },
    { id: ClinicType.EMERGENCY, label: 'Emergency / Trauma Center' },
    { id: ClinicType.OTHER, label: 'Specialist / Other' },
];

const OPERATION_MODES = [
    { id: ClinicOperationMode.DIRECT_WALK_IN, label: 'Direct Walk-in Only', desc: 'Patients visit reception to get a token. No online booking.' },
    { id: ClinicOperationMode.ONLINE_WALK_IN, label: 'Online Walk-in Only', desc: 'Patients join the queue via the app. No physical reception queue.' },
    { id: ClinicOperationMode.BOTH_WALK_IN, label: 'Direct Walk-in & Online Token', desc: 'Patients can join the queue at reception or online.' },
    { id: ClinicOperationMode.HYBRID_DIRECT_APPT, label: 'Hybrid: Direct Walk-in & Appointment', desc: 'Walk-ins at reception + Future online appointments.' },
    { id: ClinicOperationMode.HYBRID_FULL, label: 'Hybrid: Direct, Online Token & Appointment', desc: 'Full flexibility: Physical queue, Online queue, and Future slots.' },
];

export const ClinicAuth: React.FC<ClinicAuthProps> = ({ clinics, onSelectClinic, onRegister, onBack, role }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  
  // Registration State
  const [newClinicName, setNewClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAbout, setClinicAbout] = useState('');
  const [clinicType, setClinicType] = useState<ClinicType>(ClinicType.GENERAL);
  
  // Admin User State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.SOLO);
  const [operationMode, setOperationMode] = useState<ClinicOperationMode>(ClinicOperationMode.HYBRID_FULL);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClinicName && address && city && pincode && clinicPhone && adminEmail && adminPassword) {
      
      const adminId = `staff_admin_${Date.now()}`;
      
      const newClinic: Clinic = {
          id: `clinic_${Date.now()}`,
          name: newClinicName,
          slug: newClinicName.toLowerCase().replace(/\s+/g, '-'),
          plan: selectedPlan,
          type: clinicType,
          operationMode: operationMode,
          doctors: [],
          patients: [],
          staff: [{
              id: adminId,
              name: 'Admin',
              role: 'MANAGER',
              phone: clinicPhone,
              email: adminEmail,
              password: adminPassword,
              isActive: true,
              joinedDate: Date.now()
          }],
          city: city,
          address: address,
          pincode: pincode,
          contactPhone: clinicPhone,
          about: clinicAbout,
          amenities: selectedServices
      };

      await storage.createClinic(newClinic);
      
      if (onRegister) {
          onRegister(newClinic.id, adminId);
      } else {
          onSelectClinic(newClinic.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-8">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Logo className="h-16 w-16 mx-auto mb-4 shadow-xl shadow-primary-200 rounded-2xl" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to SmartQFlow</h1>
        <p className="text-slate-500">SaaS Platform for Hospitals & Clinics</p>
      </div>

      <Card className="w-full max-w-2xl p-8 shadow-xl border-0">
        <div className="flex mb-6 bg-slate-100 p-1 rounded-lg">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('REGISTER')}
          >
            Register New Clinic
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('LOGIN')}
          >
            Demo / Login
          </button>
        </div>

        {mode === 'LOGIN' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Partner Access</h2>
              <p className="text-sm text-slate-500">Choose an option below</p>
            </div>
            
            <Button onClick={onBack} className="w-full h-12 text-lg justify-center shadow-lg" variant="primary">
                <LogIn className="h-5 w-5 mr-2" /> Login to Account
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">OR DEMO MODE</span></div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {clinics.map(clinic => (
                <button
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic.id)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{clinic.name}</div>
                    <div className="text-[10px] text-slate-500">{clinic.city} • {clinic.doctors.length} Docs</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in duration-300 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
             <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Setup Your Hospital</h2>
              <p className="text-sm text-slate-500">30-Day Free Trial • No Credit Card</p>
            </div>

            {/* Admin Credentials */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Admin Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Email (Username)</label>
                        <input className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="admin@hospital.com" type="email" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                        <input className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required placeholder="••••••" />
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input 
                          label="Clinic / Hospital Name" 
                          placeholder="e.g. Sunshine Health Care"
                          value={newClinicName}
                          onChange={(e) => setNewClinicName(e.target.value)}
                          required
                        />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Type</label>
                        <div className="relative">
                            <select 
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:ring-primary-500 appearance-none bg-white text-sm"
                                value={clinicType}
                                onChange={(e) => setClinicType(e.target.value as ClinicType)}
                            >
                                {CLINIC_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <Stethoscope className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <Input 
                          label="Contact Phone" 
                          placeholder="98765 43210"
                          value={clinicPhone}
                          onChange={(e) => setClinicPhone(e.target.value)}
                          required
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input 
                          label="Address Line 1" 
                          placeholder="Street, Area, Building"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                    </div>
                    <Input 
                      label="City" 
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                    <Input 
                      label="Pincode" 
                      placeholder="400001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                    />
                </div>
            </div>

            {/* Operation Mode */}
            <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-800">Clinic Operation Mode</label>
                <div className="grid grid-cols-1 gap-3">
                    {OPERATION_MODES.map(op => (
                        <div 
                            key={op.id}
                            onClick={() => setOperationMode(op.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${operationMode === op.id ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className={`p-2 rounded-full flex-shrink-0 ${operationMode === op.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                {operationMode === op.id ? <Check className="h-5 w-5" /> : <div className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${operationMode === op.id ? 'text-indigo-900' : 'text-slate-800'}`}>{op.label}</div>
                                <div className="text-xs text-slate-500">{op.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Create & Login
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Button variant="ghost" className="w-full text-slate-500" onClick={onBack}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};
