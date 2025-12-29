
import React, { useState, useEffect } from 'react';
import { Doctor, DaySchedule, SessionMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, Link as LinkIcon, Clock, Calendar, Zap, Lock, Languages, GraduationCap, FileText, X, Sun, CloudSun, Moon, MoonStar, Copy, CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';
import { hasSlotOverlap, validateShiftWithinClinicHours } from '../../../utils/time';

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ADD' | 'EDIT';
  initialData?: Doctor;
  onSave: (data: any) => void;
  onCheckMasterDoctor: (mobile: string) => Doctor | null;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clinicOperatingHours?: string; // New prop for validation
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS = [
    { label: 'Morning', start: '09:00', end: '13:00', icon: Sun, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { label: 'Afternoon', start: '13:00', end: '17:00', icon: CloudSun, color: 'text-orange-500 bg-orange-50 border-orange-200' },
    { label: 'Evening', start: '17:00', end: '21:00', icon: Moon, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { label: 'Night', start: '21:00', end: '23:59', icon: MoonStar, color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

export const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
  isOpen, onClose, mode, initialData, onSave, onCheckMasterDoctor, addToast, clinicOperatingHours
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'PROFILE' | 'SCHEDULE'>('INFO');
  const [linkedProfile, setLinkedProfile] = useState<Doctor | null>(null);
  
  const [form, setForm] = useState({
      name: '', specialty: '', room: '', fee: '500', consultationTime: '15', 
      mobile: '', email: '', password: '', regNo: '', masterId: '', avatarUrl: '',
      experience: '5', bio: '', education: [] as string[], languages: [] as string[],
      schedule: [] as DaySchedule[]
  });

  const [newEdu, setNewEdu] = useState('');
  const [newLang, setNewLang] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (initialData && mode === 'EDIT') {
            const normalized = initialData.weeklySchedule.map((d: any) => {
                if (d.slots && Array.isArray(d.slots)) {
                    // Ensure each slot has a mode, defaulting to HYBRID if missing
                    const slotsWithMode = d.slots.map((s: any) => ({...s, mode: s.mode || SessionMode.HYBRID}));
                    return { ...d, slots: slotsWithMode, isOff: !!d.isOff };
                }
                return { day: d.day, slots: [], isOff: !!d.isOff };
            });
            setForm({
                name: initialData.name, 
                specialty: initialData.specialty, 
                room: initialData.roomNumber, 
                fee: initialData.consultationFee.toString(), 
                consultationTime: (initialData.consultationTime || 15).toString(),
                mobile: initialData.mobile || '', 
                email: initialData.email || '', 
                password: initialData.password || '', 
                regNo: initialData.registrationNumber || '', 
                masterId: initialData.masterId, 
                avatarUrl: initialData.avatarUrl || '',
                experience: (initialData.experience || 5).toString(),
                bio: initialData.bio || '',
                education: initialData.education || [],
                languages: initialData.languages || [],
                schedule: normalized
            });
        } else {
            const defaultSchedule = DAYS_OF_WEEK.map(d => ({
                day: d, 
                slots: [{ startTime: '09:00', endTime: '17:00', active: true, label: 'Regular', mode: SessionMode.HYBRID }], 
                isOff: false
            }));
            setForm({ 
                name: '', specialty: '', room: '', fee: '500', consultationTime: '15', 
                mobile: '', email: '', password: '', regNo: '', masterId: '', avatarUrl: '', 
                experience: '5', bio: '', education: [], languages: [],
                schedule: defaultSchedule 
            });
            setLinkedProfile(null);
        }
        setActiveTab('INFO');
    }
  }, [isOpen, initialData, mode]);

  const handleMobileBlur = () => { 
      if (form.mobile.length >= 10 && mode === 'ADD') { 
          const existing = onCheckMasterDoctor(form.mobile); 
          setLinkedProfile(existing || null); 
      } 
  };

  const applyLinkedProfile = () => { 
      if (linkedProfile) { 
          setForm({ 
              ...form, 
              name: linkedProfile.name, 
              specialty: linkedProfile.specialty, 
              regNo: linkedProfile.registrationNumber || '', 
              masterId: linkedProfile.masterId, 
              avatarUrl: linkedProfile.avatarUrl || '', 
              email: linkedProfile.email || '', 
              password: linkedProfile.password || '',
              experience: (linkedProfile.experience || 5).toString(),
              bio: linkedProfile.bio || '',
              education: linkedProfile.education || [],
              languages: linkedProfile.languages || []
          }); 
          setLinkedProfile(null); 
          addToast('Doctor profile linked!', 'success'); 
      } 
  };

  const validateSchedule = () => {
    for (const daySchedule of form.schedule) {
        if (!daySchedule.isOff) {
            // Check overlaps
            if (hasSlotOverlap(daySchedule.slots)) {
                addToast(`Schedule overlap detected on ${daySchedule.day}`, 'error');
                return false;
            }
            // Check against clinic hours
            if (clinicOperatingHours) {
                for (const slot of daySchedule.slots) {
                    if (slot.active !== false && !validateShiftWithinClinicHours(slot.startTime, slot.endTime, clinicOperatingHours)) {
                        addToast(`Shift on ${daySchedule.day} (${slot.startTime}-${slot.endTime}) is outside clinic operating hours (${clinicOperatingHours})`, 'error');
                        return false;
                    }
                }
            }
        }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!validateSchedule()) {
          setActiveTab('SCHEDULE');
          return;
      }
      onSave({
          ...form,
          experience: parseInt(form.experience),
          fee: parseFloat(form.fee),
          consultationTime: parseInt(form.consultationTime)
      }); 
      onClose(); 
  };
  
  // List Helpers
  const addEdu = () => { if(newEdu.trim()) { setForm({...form, education: [...form.education, newEdu.trim()]}); setNewEdu(''); } };
  const removeEdu = (idx: number) => { setForm({...form, education: form.education.filter((_, i) => i !== idx)}); };
  const addLang = () => { if(newLang.trim()) { setForm({...form, languages: [...form.languages, newLang.trim()]}); setNewLang(''); } };
  const removeLang = (idx: number) => { setForm({...form, languages: form.languages.filter((_, i) => i !== idx)}); };

  // Schedule Helpers
  const toggleDayOff = (dayIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const isOff = !cur.isOff; 
      newSchedule[dayIndex] = { ...cur, isOff, slots: isOff ? [] : (cur.slots?.length ? cur.slots : [{ startTime: '09:00', endTime: '17:00', active: true, label: 'Regular', mode: SessionMode.HYBRID }]) }; 
      setForm({ ...form, schedule: newSchedule }); 
  };
  
  const addSlot = (dayIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const existing = cur.slots ? [...cur.slots] : []; 
      const last = existing.length ? existing[existing.length - 1] : null; 
      let defaultStart = last ? last.endTime : '09:00'; 
      const [hh, mm] = defaultStart.split(':').map(Number);
      const defaultEnd = `${((hh + 4) % 24).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
      newSchedule[dayIndex] = { ...cur, slots: [...existing, { startTime: defaultStart, endTime: defaultEnd, active: true, label: 'Shift', mode: SessionMode.HYBRID }], isOff: false }; 
      setForm({ ...form, schedule: newSchedule }); 
  };

  const applyPreset = (dayIndex: number, preset: typeof PRESETS[0]) => {
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const slots = [...(cur.slots || [])]; 
      
      // Prevent duplicates of the same shift label for the same day
      if (slots.some(s => s.label === preset.label)) {
          addToast(`${preset.label} shift already exists for this day`, 'warning');
          return;
      }

      newSchedule[dayIndex] = { 
          ...cur, 
          isOff: false, 
          slots: [...slots, { startTime: preset.start, endTime: preset.end, active: true, label: preset.label, mode: SessionMode.HYBRID }]
      };
      setForm({ ...form, schedule: newSchedule });
  };

  const copyToAllDays = (fromIdx: number) => {
    const source = form.schedule[fromIdx];
    const newSchedule = form.schedule.map((day, idx) => {
        if (idx === fromIdx) return day;
        return {
            ...day,
            isOff: source.isOff,
            // Deep copy slots to avoid reference sharing
            slots: (source.slots || []).map(s => ({ ...s }))
        };
    });
    setForm({ ...form, schedule: newSchedule });
    addToast(`Schedule copied from ${source.day} to all days`, 'success');
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: string, value: string | boolean) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const slots = [...(cur.slots || [])]; 
      slots[slotIndex] = { ...slots[slotIndex], [field]: value } as any; 
      newSchedule[dayIndex] = { ...cur, slots }; 
      setForm({ ...form, schedule: newSchedule }); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'ADD' ? 'Register Medical Staff' : 'Edit Doctor Profile'} maxWidth="max-w-5xl">
        <div className="flex border-b border-slate-200 mb-6 sticky top-0 bg-white z-10 pt-2">
            <button type="button" className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'INFO' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab('INFO')}>Credentials & Clinic</button>
            <button type="button" className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'PROFILE' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab('PROFILE')}>Professional Bio</button>
            <button type="button" className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'SCHEDULE' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab('SCHEDULE')}>Weekly Schedule</button>
        </div>
        
        <form onSubmit={handleSubmit} className="pb-4">
            {activeTab === 'INFO' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-6">
                        <Input label="Doctor Name" placeholder="e.g. Dr. Ravi Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                        <Input label="Specialty" placeholder="e.g. Cardiologist" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <Input label="Mobile (for Global Identity)" placeholder="9876543210" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} onBlur={handleMobileBlur} required readOnly={mode === 'EDIT'} />
                            {linkedProfile && (
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs flex items-center justify-between border border-blue-100 mt-2">
                                    <div className="flex items-center gap-2">
                                        <img src={linkedProfile.avatarUrl} className="w-8 h-8 rounded-full border border-white" />
                                        <span>Found Master Profile: <strong>{linkedProfile.name}</strong></span>
                                    </div>
                                    <Button type="button" size="sm" onClick={applyLinkedProfile}><Plus className="h-3 w-3 mr-1" /> Link Bio</Button>
                                </div>
                            )}
                        </div>
                        <Input label="Medical Registration No." placeholder="REG12345" value={form.regNo} onChange={e => setForm({...form, regNo: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Lock className="h-3 w-3" /> System Access
                        </div>
                        <Input label="Login Email" placeholder="doctor@smartqflow.com" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                        <Input label="Set Password" type="password" placeholder="••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <Input label="Cabin/Room No." placeholder="201" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required />
                        <Input label="Consultation Fee (₹)" type="number" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} />
                        <Input label="Slot Duration (mins)" type="number" value={form.consultationTime} onChange={e => setForm({...form, consultationTime: e.target.value})} />
                    </div>
                </div>
            )}

            {activeTab === 'PROFILE' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <Input label="Years of Experience" type="number" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} required />
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar URL</label>
                                <div className="flex flex-col gap-2">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
                                        {form.avatarUrl ? <img src={form.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Plus className="h-6 w-6" /></div>}
                                    </div>
                                    <input className="text-xs w-full p-1 border rounded" placeholder="Image URL" value={form.avatarUrl} onChange={e => setForm({...form, avatarUrl: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Professional Bio</label>
                            <textarea 
                                className="w-full h-40 p-4 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                placeholder="Describe doctor's expertise and background for patients..."
                                value={form.bio}
                                onChange={e => setForm({...form, bio: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary-600" /> Education / Degrees</h4>
                            <div className="flex gap-2 mb-3">
                                <input className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-1 focus:ring-primary-500" placeholder="e.g. MD - AIIMS Delhi" value={newEdu} onChange={e => setNewEdu(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEdu())} />
                                <Button type="button" size="sm" onClick={addEdu} variant="secondary">Add</Button>
                            </div>
                            <div className="space-y-2">
                                {form.education.map((edu, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                                        <span className="text-slate-700">{edu}</span>
                                        <button type="button" onClick={() => removeEdu(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><Languages className="h-4 w-4 text-primary-600" /> Languages</h4>
                            <div className="flex gap-2 mb-3">
                                <input className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-1 focus:ring-primary-500" placeholder="e.g. English, Tamil" value={newLang} onChange={e => setNewLang(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} />
                                <Button type="button" size="sm" onClick={addLang} variant="secondary">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.languages.map((lang, idx) => (
                                    <span key={idx} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100 flex items-center gap-1">
                                        {lang}
                                        <button type="button" onClick={() => removeLang(idx)}><Trash2 className="h-3 w-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SCHEDULE' && (
                <div className="space-y-4 animate-in fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {clinicOperatingHours && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-blue-800">Clinic Operating Hours: {clinicOperatingHours}</p>
                                <p className="text-[10px] text-blue-600">Ensure doctor shifts fall within these hours.</p>
                            </div>
                        </div>
                    )}
                    {form.schedule.map((daySchedule, idx) => (
                        <div key={daySchedule.day} className={`rounded-xl border p-4 transition-all ${daySchedule.isOff ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-300 shadow-sm'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => toggleDayOff(idx)} className={`w-20 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${daySchedule.isOff ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-green-500 text-white border-green-600'}`}>
                                        {daySchedule.isOff ? 'Off' : 'Working'}
                                    </button>
                                    <h4 className="font-bold text-slate-800">{daySchedule.day}</h4>
                                    
                                    {!daySchedule.isOff && (
                                        <button 
                                            type="button" 
                                            onClick={() => copyToAllDays(idx)}
                                            className="ml-2 flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition-all hover:scale-105 active:scale-95"
                                            title="Apply this day's schedule to the rest of the week"
                                        >
                                            <Copy className="h-3 w-3" /> Copy to All
                                        </button>
                                    )}
                                </div>
                                
                                {!daySchedule.isOff && (
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {PRESETS.map(preset => (
                                            <button 
                                                key={preset.label}
                                                type="button"
                                                onClick={() => applyPreset(idx, preset)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 whitespace-nowrap ${preset.color}`}
                                            >
                                                <preset.icon className="h-3 w-3" /> {preset.label}
                                            </button>
                                        ))}
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                        <button type="button" onClick={() => addSlot(idx)} className="text-primary-600 hover:text-primary-700 text-[10px] font-black uppercase flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100"><Plus className="h-3 w-3" /> Custom</button>
                                    </div>
                                )}
                            </div>
                            
                            {!daySchedule.isOff && (
                                <div className="space-y-2">
                                    {daySchedule.slots && daySchedule.slots.length > 0 ? (
                                        daySchedule.slots.map((slot, sIdx) => (
                                            <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <input type="time" className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500" value={slot.startTime} onChange={e => updateSlot(idx, sIdx, 'startTime', e.target.value)} />
                                                    <span className="text-slate-400 font-bold">to</span>
                                                    <input type="time" className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500" value={slot.endTime} onChange={e => updateSlot(idx, sIdx, 'endTime', e.target.value)} />
                                                </div>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input className="flex-1 bg-white border border-slate-200 rounded px-3 py-1 text-xs font-medium placeholder:text-slate-300" placeholder="Shift Name" value={slot.label || ''} onChange={e => updateSlot(idx, sIdx, 'label', e.target.value)} />
                                                    {/* Session Mode Selector */}
                                                    <div className="relative">
                                                         <select 
                                                            value={slot.mode || SessionMode.HYBRID} 
                                                            onChange={e => updateSlot(idx, sIdx, 'mode', e.target.value)}
                                                            className={`
                                                                appearance-none pl-2 pr-6 py-1 rounded-lg text-[10px] font-black uppercase border outline-none cursor-pointer
                                                                ${slot.mode === SessionMode.APPOINTMENT ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                                                  slot.mode === SessionMode.WALK_IN ? 'bg-green-50 text-green-700 border-green-200' : 
                                                                  'bg-blue-50 text-blue-700 border-blue-200'}
                                                            `}
                                                         >
                                                             <option value={SessionMode.HYBRID}>Hybrid</option>
                                                             <option value={SessionMode.WALK_IN}>Walk-In</option>
                                                             <option value={SessionMode.APPOINTMENT}>Appt Only</option>
                                                         </select>
                                                         <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        const slots = [...daySchedule.slots];
                                                        slots.splice(sIdx, 1);
                                                        const newSched = [...form.schedule];
                                                        newSched[idx] = { ...daySchedule, slots, isOff: slots.length === 0 };
                                                        setForm({...form, schedule: newSched});
                                                    }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 font-medium">Click a preset above to add working hours</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="px-8 shadow-lg shadow-primary-100">
                    {mode === 'ADD' ? 'Register Doctor' : 'Update Profile'}
                </Button>
            </div>
        </form>
    </Modal>
  );
};
