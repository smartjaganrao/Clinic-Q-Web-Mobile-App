
import React, { useState, useMemo, useEffect } from 'react';
import { Doctor, Patient, PatientStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { User, Calendar, Check, Phone, MapPin, Clock, Timer, Users, Sun, CloudSun, Moon, MoonStar, CalendarClock, Zap, Edit2 } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'ADD' | 'EDIT';
  initialData?: Patient | null;
  // Fix: Strictly typed gender in onAdd prop
  onAdd: (name: string, phone: string, doctorId: string, date?: string, time?: string, age?: string, gender?: 'Male' | 'Female' | 'Other', symptoms?: string, nextOfKin?: {name: string, phone: string}, address?: string, city?: string, country?: string, location?: {lat: number, lng: number}) => void;
  onEdit?: (id: string, updates: Partial<Patient>) => void;
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

const format12h = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr);
    const m = mStr.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${m} ${ampm}`;
};

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
    isOpen, onClose, mode = 'ADD', initialData, onAdd, onEdit, doctors, patients, addToast 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [age, setAge] = useState('');
  // Fix: Strictly typing the gender state to match Patient type requirements
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [type, setType] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [symptoms, setSymptoms] = useState('');
  const [existingProfiles, setExistingProfiles] = useState<Patient[]>([]);
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  
  const [nokName, setNokName] = useState('');
  const [nokPhone, setNokPhone] = useState('');

  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedWalkInShiftId, setSelectedWalkInShiftId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string, isBooked: boolean, isPast: boolean, shiftName: string, shiftRange: string }[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (mode === 'EDIT' && initialData) {
            setName(initialData.name);
            setPhone(initialData.phone);
            setDoctorId(initialData.doctorId);
            setAge(initialData.age || '');
            setGender(initialData.gender || 'Male');
            setType(initialData.visitType);
            setSymptoms(initialData.symptoms || '');
            setAddress(initialData.address || '');
            setCity(initialData.city || '');
            setCountry(initialData.country || 'India');
            setNokName(initialData.nextOfKin?.name || '');
            setNokPhone(initialData.nextOfKin?.phone || '');
            
            if (initialData.visitType === 'APPOINTMENT') {
                setSelectedDate(initialData.appointmentDate || getLocalToday());
                setSelectedSlot(initialData.appointmentTime || '');
            } else {
                setSelectedWalkInShiftId(null); // Reset for manual selection or re-calc
            }
        } else {
            // Reset for ADD mode
            setName(''); setPhone(''); setDoctorId(''); setAge(''); setSymptoms(''); 
            setType('WALK_IN'); setSelectedSlot(''); setNokName(''); setNokPhone('');
            setAddress(''); setCity(''); setCountry('India'); setSelectedWalkInShiftId(null);
            setSelectedDate(getLocalToday());
        }
    }
  }, [isOpen, mode, initialData]);

  const bookingDays = useMemo(() => getNextDays(14), []);
  const selectedDoctor = useMemo(() => doctors.find(d => d.id === doctorId), [doctors, doctorId]);

  const getShiftIcon = (label?: string) => {
      const l = label?.toLowerCase() || '';
      if (l.includes('morn')) return Sun;
      if (l.includes('aft')) return CloudSun;
      if (l.includes('even')) return Moon;
      if (l.includes('night')) return MoonStar;
      return Clock;
  };

  const walkInShiftsToday = useMemo(() => {
      if (!selectedDoctor) return [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = new Date();
      const todayName = days[now.getDay()];
      const todayStr = now.toISOString().split('T')[0];
      const schedule = selectedDoctor.weeklySchedule.find(s => s.day === todayName);
      
      if (!schedule || schedule.isOff) return [];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      return schedule.slots.filter(s => s.active !== false).map(shift => {
          const [sh, sm] = shift.startTime.split(':').map(Number);
          const [eh, em] = shift.endTime.split(':').map(Number);
          // Fixed: using sh and sm instead of non-existent startH and startM
          const startTotal = sh * 60 + sm;
          let endTotal = eh * 60 + em;
          if (endTotal <= startTotal) endTotal += 1440;

          const shiftPatients = patients.filter(p => {
              if (p.doctorId !== selectedDoctor.id || p.status === PatientStatus.CANCELLED) return false;
              const pDate = p.visitType === 'APPOINTMENT' ? p.appointmentDate : new Date(p.timeAdded).toISOString().split('T')[0];
              if (pDate !== todayStr) return false;

              const pTimeStr = p.visitType === 'APPOINTMENT' ? p.appointmentTime : new Date(p.timeAdded).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              if (!pTimeStr) return false;
              const [ph, pm] = pTimeStr.split(':').map(Number);
              const pMins = ph * 60 + pm;
              return pMins >= startTotal && pMins < endTotal;
          });

          const isStarted = currentMins >= startTotal;
          const isEnded = currentMins >= endTotal;
          const isActive = isStarted && !isEnded;
          const capacity = Math.floor((endTotal - startTotal) / (selectedDoctor.consultationTime || 15));
          const isFull = shiftPatients.length >= capacity;

          let statusLabel = '';
          let statusColor = 'text-slate-500';
          if (isEnded) { statusLabel = 'Ended'; statusColor = 'text-slate-400'; }
          else if (isActive) { statusLabel = 'Live Now'; statusColor = 'text-green-600'; }
          else { statusLabel = `Starts ${format12h(shift.startTime)}`; statusColor = 'text-blue-600'; }
          if (isFull) { statusLabel = 'At Capacity'; statusColor = 'text-red-600'; }

          return {
              shift,
              isEnded,
              isActive,
              isFull,
              statusLabel,
              statusColor,
              load: shiftPatients.length,
              totalWaitMins: shiftPatients.length * (selectedDoctor.consultationTime || 15) + (isActive ? selectedDoctor.delayMinutes : 0)
          };
      });
  }, [selectedDoctor, patients]);

  useEffect(() => {
      if (walkInShiftsToday.length > 0 && !selectedWalkInShiftId && type === 'WALK_IN' && mode === 'ADD') {
          const active = walkInShiftsToday.find(s => s.isActive && !s.isFull);
          const firstFuture = walkInShiftsToday.find(s => !s.isActive && !s.isEnded && !s.isFull);
          setSelectedWalkInShiftId(active?.shift.id || active?.shift.startTime || firstFuture?.shift.id || firstFuture?.shift.startTime || walkInShiftsToday[0].shift.startTime);
      }
  }, [walkInShiftsToday, type, mode]);

  const walkInEstimation = useMemo(() => {
    if (type !== 'WALK_IN' || !selectedWalkInShiftId || !selectedDoctor) return null;
    const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
    if (!selectedShift) return null;

    const mins = selectedShift.totalWaitMins;
    const now = new Date();
    const estDate = new Date(now.getTime() + mins * 60000);
    const estClockTime = estDate.getHours().toString().padStart(2, '0') + ':' + estDate.getMinutes().toString().padStart(2, '0');

    return {
        count: selectedShift.load,
        mins,
        label: mins === 0 ? 'Immediate' : `~${mins} mins`,
        estClockTime: format12h(estClockTime)
    };
  }, [type, selectedWalkInShiftId, selectedDoctor, walkInShiftsToday]);

  useEffect(() => {
      if (type === 'WALK_IN' || !doctorId || !selectedDate) {
          setAvailableSlots([]);
          return;
      }
      const doctor = doctors.find(d => d.id === doctorId);
      if (!doctor) return;
      const dateObj = new Date(selectedDate);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = doctor.weeklySchedule.find(s => s.day === dayName);
      if (!daySchedule || daySchedule.isOff) { setAvailableSlots([]); return; }

      const existingBookings = patients.filter(p => 
          p.doctorId === doctorId && p.appointmentDate === selectedDate &&
          p.status !== PatientStatus.CANCELLED && p.status !== PatientStatus.COMPLETED
      ).map(p => p.appointmentTime);

      const slots: any[] = [];
      const now = new Date();
      const isToday = selectedDate === getLocalToday();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      daySchedule.slots.forEach((shift, sIdx) => {
          if (!shift.active) return;
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          let slotMins = startH * 60 + startM;
          let endMins = endH * 60 + endM;
          if (endMins < slotMins) endMins = 24 * 60 - 1; 
          const interval = doctor.consultationTime || 15;

          while (slotMins + interval <= endMins) {
              const h = Math.floor(slotMins / 60);
              const m = slotMins % 60;
              const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              slots.push({ time: timeStr, isBooked: existingBookings.includes(timeStr), isPast: isToday && slotMins < currentMins, shiftName: shift.label, shiftRange: `${format12h(shift.startTime)}-${format12h(shift.endTime)}` });
              slotMins += interval;
          }
      });
      setAvailableSlots(slots);
  }, [doctorId, selectedDate, type, doctors, patients]);

  const groupedByPeriod = useMemo(() => {
    const groups: Record<string, { slots: typeof availableSlots, icon: any }> = {
        'Morning': { slots: [], icon: Sun },
        'Afternoon': { slots: [], icon: CloudSun },
        'Evening': { slots: [], icon: Moon },
        'Night': { slots: [], icon: MoonStar }
    };
    availableSlots.forEach(slot => {
        const [h] = slot.time.split(':').map(Number);
        let key = 'Night';
        if (h >= 5 && h < 12) key = 'Morning';
        else if (h >= 12 && h < 17) key = 'Afternoon';
        else if (h >= 17 && h < 21) key = 'Evening';
        groups[key].slots.push(slot);
    });
    return Object.fromEntries(Object.entries(groups).filter(([_, g]) => g.slots.length > 0));
  }, [availableSlots]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setPhone(val);
      if (val.length >= 4 && mode === 'ADD') {
          const profiles = patients.filter(p => p.phone === val);
          const uniqueProfiles = new Map();
          profiles.forEach(p => uniqueProfiles.set(p.name.toLowerCase(), p));
          setExistingProfiles(Array.from(uniqueProfiles.values()));
      } else { setExistingProfiles([]); }
  };

  const selectExistingProfile = (p: Patient) => {
      setName(p.name); setAge(p.age || ''); setGender(p.gender || 'Male');
      if (p.nextOfKin) { setNokName(p.nextOfKin.name); setNokPhone(p.nextOfKin.phone); }
      if (p.address) setAddress(p.address);
      if (p.city) setCity(p.city);
      if (p.country) setCountry(p.country);
      setExistingProfiles([]);
  };

  const executeSave = () => {
    const nok = (nokName && nokPhone) ? { name: nokName, phone: nokPhone } : undefined;
    const timeToPass = type === 'APPOINTMENT' ? selectedSlot : (selectedWalkInShiftId || undefined);
    
    if (mode === 'EDIT' && initialData && onEdit) {
        onEdit(initialData.id, {
            name, phone, doctorId,
            age, gender, symptoms,
            nextOfKin: nok, address, city, country,
            visitType: type,
            appointmentDate: type === 'APPOINTMENT' ? selectedDate : undefined,
            appointmentTime: timeToPass
        });
        addToast('Patient details updated!', 'success');
    } else {
        onAdd(name, phone, doctorId, type === 'APPOINTMENT' ? selectedDate : undefined, timeToPass, age, gender, symptoms, nok, address, city, country, undefined);
        addToast('Patient checked in!', 'success');
    }
    
    onClose();
    setShowConfirmModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !phone || !doctorId) { addToast('Please fill required fields', 'error'); return; }
      if (type === 'APPOINTMENT' && !selectedSlot) { addToast('Please select a time slot', 'error'); return; }
      if (type === 'WALK_IN' && !selectedWalkInShiftId && mode === 'ADD') { addToast('Please select a walk-in shift', 'error'); return; }

      if (mode === 'ADD') {
          const isDuplicate = patients.some(p => 
              p.phone === phone && p.name.toLowerCase() === name.toLowerCase() && 
              (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR || 
              (p.visitType === 'APPOINTMENT' && p.appointmentDate === selectedDate && p.appointmentTime === selectedSlot))
          );
          if (isDuplicate) { addToast(`${name} already has an active visit!`, 'error'); return; }
      }

      if (type === 'APPOINTMENT' && mode === 'ADD') { setShowConfirmModal(true); } else { executeSave(); }
  };

  return (
    <>
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={mode === 'EDIT' ? 'Edit Patient Details' : (type === 'APPOINTMENT' ? 'Schedule Appointment' : 'Check-in Walk-in')} 
            maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Lookup</label>
                                <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <Input placeholder="Enter 10-digit mobile number" value={phone} onChange={handlePhoneChange} autoFocus required className="bg-white" readOnly={mode === 'EDIT'} />
                            {existingProfiles.length > 0 && mode === 'ADD' && (
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Patient Name" value={name} onChange={e => setName(e.target.value)} required />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Age" value={age} onChange={e => setAge(e.target.value)} />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-primary-500" value={gender} onChange={e => setGender(e.target.value as 'Male' | 'Female' | 'Other')}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><MapPin className="h-3 w-3" /> Address</h4>
                            <div className="space-y-3">
                                <Input label="Street Address" placeholder="e.g. 12/A, Gandhi Road" value={address} onChange={e => setAddress(e.target.value)} />
                                <div className="grid grid-cols-2 gap-3"><Input label="City" placeholder="City" value={city} onChange={e => setCity(e.target.value)} /><Input label="Country" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} /></div>
                            </div>
                        </div>

                        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                            <label className="block text-xs font-bold text-orange-800 uppercase tracking-wide mb-2">Emergency Contact</label>
                            <div className="grid grid-cols-2 gap-3"><Input placeholder="Contact Name" value={nokName} onChange={e => setNokName(e.target.value)} className="bg-white text-xs h-9" /><Input placeholder="Contact Phone" value={nokPhone} onChange={e => setNokPhone(e.target.value)} className="bg-white text-xs h-9" /></div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
                                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-primary-500" value={doctorId} onChange={e => { setDoctorId(e.target.value); setSelectedSlot(''); }} required>
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

                        {type === 'WALK_IN' && doctorId && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Available Walk-In Shifts</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {walkInShiftsToday.map(({ shift, statusLabel, statusColor, load, totalWaitMins, isActive, isEnded, isFull }) => {
                                            const Icon = getShiftIcon(shift.label);
                                            const shiftId = shift.id || shift.startTime;
                                            const isSelected = selectedWalkInShiftId === shiftId;
                                            const isDisabled = isEnded;

                                            return (
                                                <div 
                                                    key={shiftId}
                                                    onClick={() => !isDisabled && setSelectedWalkInShiftId(shiftId)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${isSelected ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-100 shadow-md' : isDisabled ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed grayscale' : 'bg-white border-slate-200 hover:border-primary-300'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-primary-500'}`}><Icon className="h-4 w-4" /></div>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                                                    </div>
                                                    <h4 className={`font-bold text-sm ${isSelected ? 'text-primary-900' : 'text-slate-800'}`}>{shift.label || 'Regular'}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold mb-3">{format12h(shift.startTime)} - {format12h(shift.endTime)}</p>
                                                    {!isDisabled && (
                                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                                            <div className="flex items-center gap-1.5"><Users className="h-3 w-3 text-slate-400" /><span className="text-[10px] font-bold text-slate-600">{load} waiting</span></div>
                                                            <div className="flex items-center gap-1.5"><Timer className="h-3 w-3 text-slate-400" /><span className={`text-[10px] font-black ${totalWaitMins > 45 ? 'text-red-600' : 'text-green-600'}`}>~{totalWaitMins}m</span></div>
                                                        </div>
                                                    )}
                                                    {isSelected && <div className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white rounded-full p-0.5 shadow-sm ring-2 ring-white"><Check className="h-3 w-3" /></div>}
                                                </div>
                                            );
                                        })}
                                        {walkInShiftsToday.length === 0 && (
                                            <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                                <Calendar className="h-6 w-6 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No shifts scheduled for today</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {walkInEstimation && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 animate-in fade-in zoom-in-95 shadow-sm">
                                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><Timer className="h-6 w-6 animate-pulse" /></div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-blue-900 leading-tight">Live Wait Estimation</h4>
                                            <p className="text-xs text-blue-700 font-bold mt-0.5">{walkInEstimation.label} wait • {walkInEstimation.count} ahead</p>
                                            <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-wider flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Expected Turn: {walkInEstimation.estClockTime}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {type === 'APPOINTMENT' && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in fade-in shadow-inner">
                                <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
                                    {bookingDays.map((d) => (
                                        <button key={d.dateStr} type="button" onClick={() => { setSelectedDate(d.dateStr); setSelectedSlot(''); }} className={`flex-shrink-0 w-16 py-3 flex flex-col items-center justify-center border-b-2 transition-colors ${selectedDate === d.dateStr ? 'border-primary-500 bg-primary-50/50' : 'border-transparent hover:bg-slate-50'}`}>
                                            <span className={`text-[10px] font-bold uppercase ${selectedDate === d.dateStr ? 'text-primary-600' : 'text-slate-400'}`}>{d.dayName}</span>
                                            <span className={`text-lg font-bold leading-none mt-1 ${selectedDate === d.dateStr ? 'text-slate-900' : 'text-slate-600'}`}>{d.dayNum}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {!doctorId ? (
                                        <div className="text-center text-slate-400 text-sm py-4">Please select a doctor to view schedule.</div>
                                    ) : Object.keys(groupedByPeriod).length > 0 ? (
                                        <div className="space-y-8">
                                            {(Object.keys(groupedByPeriod)).map(periodKey => {
                                                const group = groupedByPeriod[periodKey];
                                                const Icon = group.icon;
                                                return (
                                                    <div key={periodKey}>
                                                        <div className="flex flex-col mb-4 border-l-2 border-primary-100 pl-3">
                                                            <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary-500" /><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{periodKey}</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                                            {group.slots.map(slot => (
                                                                <button key={slot.time} type="button" disabled={slot.isBooked || slot.isPast} onClick={() => setSelectedSlot(slot.time)} className={`relative py-2.5 px-1 rounded-xl text-xs font-black border transition-all ${slot.isBooked || slot.isPast ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed grayscale' : selectedSlot === slot.time ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105 z-10' : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'}`}>{format12h(slot.time)}{selectedSlot === slot.time && <div className="absolute -top-1.5 -right-1.5 bg-white text-primary-600 rounded-full p-0.5 shadow-sm border border-primary-100"><Check className="h-2.5 w-2.5" /></div>}{slot.isBooked && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><div className="w-full h-px bg-slate-400 rotate-12"></div></div>}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CalendarClock className="h-10 w-10 text-slate-300 mx-auto mb-3 opacity-50" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Doctor is off-duty on this date</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Please select another date or doctor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <Input label="Symptoms (Optional)" placeholder="e.g. Fever, Cough" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                    </div>
                </div>
                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={(type === 'APPOINTMENT' && !selectedSlot) || (type === 'WALK_IN' && !selectedWalkInShiftId && mode === 'ADD')} className="px-10">
                        {mode === 'EDIT' ? 'Update Details' : (type === 'APPOINTMENT' ? (selectedSlot ? `Book ${format12h(selectedSlot)}` : 'Pick a Slot') : 'Check-in Now')}
                    </Button>
                </div>
            </form>
        </Modal>
        <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={executeSave} title="Confirm Appointment" message={`Are you sure you want to book an appointment for ${name} with ${selectedDoctor?.name} on ${new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at ${format12h(selectedSlot)}?`} confirmLabel="Confirm Booking" variant="primary" />
    </>
  );
};
