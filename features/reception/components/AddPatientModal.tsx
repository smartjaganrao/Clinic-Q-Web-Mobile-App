
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { User, Calendar, Clock, ChevronRight, Check } from 'lucide-react';

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

// Helper to generate next 14 days
const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            fullDay: d.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return days;
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
  const [symptoms, setSymptoms] = useState('');
  const [existingProfiles, setExistingProfiles] = useState<Patient[]>([]);

  // Appointment Logic
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string, isBooked: boolean, isPast: boolean }[]>([]);

  const bookingDays = useMemo(() => getNextDays(14), []);

  // Generate Slots Effect
  useEffect(() => {
      if (type === 'WALK_IN' || !doctorId || !selectedDate) {
          setAvailableSlots([]);
          return;
      }

      const doctor = doctors.find(d => d.id === doctorId);
      if (!doctor) return;

      // 1. Find Schedule for selected Day
      const dateObj = new Date(selectedDate);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = doctor.weeklySchedule.find(s => s.day === dayName);

      if (!daySchedule || daySchedule.isOff) {
          setAvailableSlots([]);
          return;
      }

      // 2. Identify Existing Bookings
      const existingBookings = patients.filter(p => 
          p.doctorId === doctorId && 
          p.appointmentDate === selectedDate &&
          p.status !== PatientStatus.CANCELLED &&
          p.status !== PatientStatus.COMPLETED
      ).map(p => p.appointmentTime);

      // 3. Generate Time Chunks based on Shifts
      const slots: { time: string, isBooked: boolean, isPast: boolean }[] = [];
      const now = new Date();
      const isToday = selectedDate === getLocalToday();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      daySchedule.slots.forEach(shift => {
          if (!shift.active) return;
          
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          
          let slotMins = startH * 60 + startM;
          let endMins = endH * 60 + endM;
          
          // Handle overnight wrap-around (simplified for single day view: cap at 24h)
          if (endMins < slotMins) endMins = 24 * 60 - 1; 

          // Increment by consultation time or default 15 mins
          const interval = doctor.consultationTime || 15;

          while (slotMins + interval <= endMins) {
              const h = Math.floor(slotMins / 60);
              const m = slotMins % 60;
              const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              
              const isBooked = existingBookings.includes(timeStr);
              const isPast = isToday && slotMins < currentMins;

              slots.push({ time: timeStr, isBooked, isPast });
              slotMins += interval;
          }
      });

      setAvailableSlots(slots);
      
      // Reset selected slot if it's no longer valid/available when switching days
      if (selectedSlot && !slots.find(s => s.time === selectedSlot && !s.isBooked && !s.isPast)) {
          setSelectedSlot('');
      }

  }, [doctorId, selectedDate, type, doctors, patients]);


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
      
      if (type === 'APPOINTMENT' && !selectedSlot) {
          addToast('Please select a time slot', 'error');
          return;
      }

      const isDuplicate = patients.some(p => 
          p.phone === phone && 
          p.name.toLowerCase() === name.toLowerCase() && 
          (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR || 
          (p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedDate && p.appointmentTime === selectedSlot))
      );

      if (isDuplicate) { addToast(`${name} already has an active visit or booking!`, 'error'); return; }
      
      onAdd(name, phone, doctorId, type === 'APPOINTMENT' ? selectedDate : undefined, type === 'APPOINTMENT' ? selectedSlot : undefined, age, gender, symptoms);
      onClose();
      
      // Reset Form
      setName(''); setPhone(''); setDoctorId(''); setAge(''); setSymptoms(''); setType('WALK_IN'); setSelectedSlot('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'APPOINTMENT' ? 'Schedule Appointment' : 'Check-in Walk-in'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Step 1: Search */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Lookup</label>
                    <User className="h-4 w-4 text-slate-400" />
                </div>
                <Input placeholder="Enter 10-digit mobile number" value={phone} onChange={handlePhoneChange} autoFocus required className="bg-white" />
                {existingProfiles.length > 0 && (
                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex flex-wrap gap-2">
                            {existingProfiles.map(p => (
                                <button key={p.id} type="button" onClick={() => selectExistingProfile(p)} className="flex items-center gap-2 bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm text-blue-700">
                                    <span className="font-bold">{p.name}</span>
                                    <span className="opacity-60">| {p.age}Y</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Patient Name" value={name} onChange={e => setName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Age" value={age} onChange={e => setAge(e.target.value)} />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" value={gender} onChange={e => setGender(e.target.value)}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Step 3: Doctor & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" value={doctorId} onChange={e => { setDoctorId(e.target.value); setSelectedSlot(''); }} required>
                        <option value="">Select Doctor...</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Visit Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setType('WALK_IN')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'WALK_IN' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>Walk-In</button>
                        <button type="button" onClick={() => setType('APPOINTMENT')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'APPOINTMENT' ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>Appointment</button>
                    </div>
                </div>
            </div>

            {/* Step 4: Appointment Grid (Conditional) */}
            {type === 'APPOINTMENT' && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in fade-in">
                    {/* Date Selector */}
                    <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
                        {bookingDays.map((d) => (
                            <button
                                key={d.dateStr}
                                type="button"
                                onClick={() => { setSelectedDate(d.dateStr); setSelectedSlot(''); }}
                                className={`flex-shrink-0 w-16 py-3 flex flex-col items-center justify-center border-b-2 transition-colors ${selectedDate === d.dateStr ? 'border-primary-500 bg-primary-50/50' : 'border-transparent hover:bg-slate-50'}`}
                            >
                                <span className={`text-[10px] font-bold uppercase ${selectedDate === d.dateStr ? 'text-primary-600' : 'text-slate-400'}`}>{d.dayName}</span>
                                <span className={`text-lg font-bold leading-none mt-1 ${selectedDate === d.dateStr ? 'text-slate-900' : 'text-slate-600'}`}>{d.dayNum}</span>
                            </button>
                        ))}
                    </div>

                    {/* Slot Grid */}
                    <div className="p-4">
                        {!doctorId ? (
                            <div className="text-center text-slate-400 text-sm py-4">Please select a doctor to view schedule.</div>
                        ) : availableSlots.length > 0 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        disabled={slot.isBooked || slot.isPast}
                                        onClick={() => setSelectedSlot(slot.time)}
                                        className={`
                                            relative py-2 px-1 rounded-lg text-xs font-bold border transition-all
                                            ${slot.isBooked || slot.isPast 
                                                ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed decoration-slice' 
                                                : selectedSlot === slot.time 
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105' 
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        {slot.time}
                                        {selectedSlot === slot.time && <div className="absolute -top-1.5 -right-1.5 bg-white text-primary-600 rounded-full p-0.5 shadow-sm"><Check className="h-2.5 w-2.5" /></div>}
                                        {slot.isBooked && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-full h-px bg-slate-300 rotate-12"></div></div>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 font-medium">No available slots for this date.</p>
                                <p className="text-xs text-slate-400">Doctor might be off or fully booked.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Input label="Symptoms (Optional)" placeholder="e.g. Fever, Cough" value={symptoms} onChange={e => setSymptoms(e.target.value)} />

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={type === 'APPOINTMENT' && !selectedSlot}>
                    {type === 'APPOINTMENT' ? `Book ${selectedSlot}` : 'Check-in Now'}
                </Button>
            </div>
        </form>
    </Modal>
  );
};
