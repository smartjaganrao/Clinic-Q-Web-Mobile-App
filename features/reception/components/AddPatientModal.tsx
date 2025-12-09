import React, { useState } from 'react';
import { Doctor, Patient, PatientStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { User } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: any, symptoms?: string) => void;
  doctors: Doctor[];
  patients: Patient[];
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ 
    isOpen, onClose, onAdd, doctors, patients, addToast 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [type, setType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [date, setDate] = useState(getLocalToday());
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [existingProfiles, setExistingProfiles] = useState<Patient[]>([]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setPhone(val);
      if (val.length >= 4) {
          const profiles = patients.filter(p => p.phone === val);
          const uniqueProfiles = new Map();
          profiles.forEach(p => uniqueProfiles.set(p.name.toLowerCase(), p));
          setExistingProfiles(Array.from(uniqueProfiles.values()));
      } else {
          setExistingProfiles([]);
      }
  };

  const selectExistingProfile = (p: Patient) => {
      setName(p.name);
      setAge(p.age || '');
      setGender(p.gender || 'Male');
      setExistingProfiles([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !phone || !doctorId) { addToast('Please fill required fields', 'error'); return; }
      const isDuplicate = patients.some(p => p.phone === phone && p.name.toLowerCase() === name.toLowerCase() && (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR));
      if (isDuplicate) { addToast(`${name} is already in the queue!`, 'error'); return; }
      onAdd(name, phone, doctorId, type === 'APPOINTMENT' ? date : undefined, type === 'APPOINTMENT' ? time : undefined, age, gender, symptoms);
      onClose();
      setName(''); setPhone(''); setDoctorId(''); setAge(''); setSymptoms(''); setType('WALK_IN');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'APPOINTMENT' ? 'Schedule Appointment' : 'Check-in Walk-in'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Step 1: Mobile Lookup</label>
                <Input placeholder="Enter 10-digit mobile" value={phone} onChange={handlePhoneChange} autoFocus required />
                {existingProfiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                        <p className="text-xs text-slate-500 font-medium">Found existing profiles:</p>
                        <div className="flex flex-wrap gap-2">{existingProfiles.map(p => (<button key={p.id} type="button" onClick={() => selectExistingProfile(p)} className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-full text-xs hover:border-primary-500 hover:text-primary-700 transition-colors shadow-sm"><User className="h-3 w-3" /><span className="font-bold">{p.name}</span></button>))}</div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Age" value={age} onChange={e => setAge(e.target.value)} />
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={gender} onChange={e => setGender(e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
            </div>
            <Input label="Symptoms / Reason" placeholder="e.g. Fever, Cough" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={doctorId} onChange={e => setDoctorId(e.target.value)} required><option value="">Select Doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}</select>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"><input type="checkbox" checked={type === 'APPOINTMENT'} onChange={e => setType(e.target.checked ? 'APPOINTMENT' : 'WALK_IN')} /> Schedule Appointment?</label>
                {type === 'APPOINTMENT' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                        <Input type="date" label="Date" value={date} onChange={e => setDate(e.target.value)} required />
                        <Input type="time" label="Time" value={time} onChange={e => setTime(e.target.value)} required />
                    </div>
                )}
            </div>
            <div className="pt-2 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">{type === 'APPOINTMENT' ? 'Confirm Appointment' : 'Check-in Now'}</Button></div>
        </form>
    </Modal>
  );
};