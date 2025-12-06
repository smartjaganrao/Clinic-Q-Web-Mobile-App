
import React, { useState } from 'react';
import { Clinic, PlanType, UserRole } from '../../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Building2, Plus, LogIn, Activity, CheckCircle, MapPin, Stethoscope } from 'lucide-react';
import { Logo } from '../components/Logo';

interface ClinicAuthProps {
  clinics: Clinic[];
  onSelectClinic: (clinicId: string) => void;
  onCreateClinic: (name: string, plan: PlanType, address: string, city: string, pincode: string, services: string[]) => void;
  onBack: () => void;
  role: UserRole;
}

const COMMON_SERVICES = [
  'Pharmacy', 'Pathology Lab', 'X-Ray', 'Ultrasound', 
  'Parking', 'Wheelchair Access', 'Wifi', 'Cafeteria', 
  'Ambulance', '24x7 Emergency', 'ICU', 'Operation Theater'
];

export const ClinicAuth: React.FC<ClinicAuthProps> = ({ clinics, onSelectClinic, onCreateClinic, onBack, role }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Registration State
  const [newClinicName, setNewClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.SOLO);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClinicName && address && city && pincode) {
      onCreateClinic(newClinicName, selectedPlan, address, city, pincode, selectedServices);
    }
  };

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-8">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Logo className="h-16 w-16 mx-auto mb-4 shadow-xl shadow-primary-200 rounded-2xl" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to SmartQFlow</h1>
        <p className="text-slate-500">SaaS Platform for Hospitals & Clinics</p>
      </div>

      <Card className="w-full max-w-lg p-8 shadow-xl border-0">
        <div className="flex mb-6 bg-slate-100 p-1 rounded-lg">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('LOGIN')}
          >
            Existing Clinic
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('REGISTER')}
          >
            Register New
          </button>
        </div>

        {mode === 'LOGIN' ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Select Your Clinic</h2>
              <p className="text-sm text-slate-500">Logging in as {role}</p>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {clinics.map(clinic => (
                <button
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic.id)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">{clinic.name}</div>
                    <div className="text-xs text-slate-500">{clinic.city} • {clinic.doctors.length} Doctors</div>
                  </div>
                  <LogIn className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
            {clinics.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No clinics found. Please register a new one.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in duration-300 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
             <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Setup Your Hospital</h2>
              <p className="text-sm text-slate-500">30-Day Free Trial • No Credit Card</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <Input 
                  label="Clinic / Hospital Name" 
                  placeholder="e.g. Sunshine Health Care"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  required
                />
                
                <Input 
                  label="Address Line 1" 
                  placeholder="Street, Area, Building"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
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

            {/* Services */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Services & Amenities</label>
                <div className="flex flex-wrap gap-2">
                    {COMMON_SERVICES.map(service => (
                        <button
                            type="button"
                            key={service}
                            onClick={() => toggleService(service)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedServices.includes(service) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            {selectedServices.includes(service) && <CheckCircle className="inline-block h-3 w-3 mr-1" />}
                            {service}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subscription Plan</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: PlanType.SOLO, name: 'Solo Clinic', price: '₹999', desc: 'Single Doctor' },
                  { id: PlanType.SMALL, name: 'Small Hospital', price: '₹2,499', desc: 'Up to 5 Doctors' },
                ].map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer border rounded-lg p-3 flex justify-between items-center transition-all ${selectedPlan === plan.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div>
                        <div className="font-medium text-slate-900">{plan.name}</div>
                        <div className="text-xs text-slate-500">{plan.desc} • {plan.price} / month</div>
                    </div>
                    {selectedPlan === plan.id && <CheckCircle className="h-5 w-5 text-primary-600" />}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create & Login
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Button variant="ghost" className="w-full text-slate-500" onClick={onBack}>
            Back to Role Selection
          </Button>
        </div>
      </Card>
    </div>
  );
};
