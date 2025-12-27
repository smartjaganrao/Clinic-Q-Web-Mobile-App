import React, { useState, useEffect } from 'react';
import { Patient, Vitals } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Activity, Thermometer, Weight, Heart, Wind, Ruler, Droplets, Save } from 'lucide-react';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSave: (patientId: string, vitals: Vitals) => void;
}

interface VitalInputProps {
  label: string;
  icon: any;
  value?: string;
  placeholder: string;
  unit: string;
  field: keyof Vitals;
  onChange: (field: keyof Vitals, value: string) => void;
}

const VitalInput: React.FC<VitalInputProps> = ({ label, icon: Icon, value, placeholder, unit, field, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
      <Icon className="h-3 w-3" /> {label}
    </label>
    <div className="relative">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all pr-12"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
        {unit}
      </span>
    </div>
  </div>
);

export const VitalsModal: React.FC<VitalsModalProps> = ({ isOpen, onClose, patient, onSave }) => {
  const [vitals, setVitals] = useState<Vitals>({});

  useEffect(() => {
    if (patient && isOpen) {
      setVitals(patient.vitals || {});
    }
  }, [patient, isOpen]);

  if (!patient) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patient.id, vitals);
    onClose();
  };

  const updateField = (field: keyof Vitals, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Vitals" maxWidth="max-w-md">
      <div className="flex items-center gap-4 mb-6 p-4 bg-primary-50 rounded-2xl border border-primary-100">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold text-xl shadow-sm">
          {patient.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-black text-slate-900 leading-none">{patient.name}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tight">Token #{patient.tokenNumber} • {patient.age}Y • {patient.gender}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <VitalInput label="Blood Pressure" icon={Activity} value={vitals.bp} field="bp" placeholder="120/80" unit="MMHG" onChange={updateField} />
          <VitalInput label="Temperature" icon={Thermometer} value={vitals.temp} field="temp" placeholder="98.6" unit="°F" onChange={updateField} />
          <VitalInput label="Pulse Rate" icon={Heart} value={vitals.pulse} field="pulse" placeholder="72" unit="BPM" onChange={updateField} />
          <VitalInput label="Oxygen (SpO2)" icon={Wind} value={vitals.spo2} field="spo2" placeholder="98" unit="%" onChange={updateField} />
          <VitalInput label="Weight" icon={Weight} value={vitals.weight} field="weight" placeholder="65" unit="KG" onChange={updateField} />
          <VitalInput label="Height" icon={Ruler} value={vitals.height} field="height" placeholder="170" unit="CM" onChange={updateField} />
          <div className="col-span-2">
            <VitalInput label="Random Blood Sugar" icon={Droplets} value={vitals.sugar} field="sugar" placeholder="110" unit="MG/DL" onChange={updateField} />
          </div>
        </div>

        <div className="pt-4 flex gap-3 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1 rounded-xl font-bold uppercase text-xs tracking-widest">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary-200 bg-primary-600 hover:bg-primary-700">
            <Save className="h-4 w-4 mr-2" /> Save Vitals
          </Button>
        </div>
      </form>
    </Modal>
  );
};