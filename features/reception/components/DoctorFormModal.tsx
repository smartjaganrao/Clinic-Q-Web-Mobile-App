
import React, { useState, useEffect } from 'react';
import { Doctor, DaySchedule } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, Copy, Link as LinkIcon, Clock, Calendar, CheckSquare, Coffee, Sun, Moon, ArrowRight, Zap, CloudSun, ToggleLeft, ToggleRight, MoonStar, Mail, Lock } from 'lucide-react';

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ADD' | 'EDIT';
  initialData?: Doctor;
  onSave: (data: any) => void;
  onCheckMasterDoctor: (mobile: string) => Doctor | null;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
  isOpen, onClose, mode, initialData, onSave, onCheckMasterDoctor, addToast
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'SCHEDULE'>('INFO');
  const [linkedProfile, setLinkedProfile] = useState<Doctor | null>(null);
  
  // Quick Schedule State
  const [qsStart, setQsStart] = useState('09:00');
  const [qsEnd, setQsEnd] = useState('17:00');
  const [qsHasBreak, setQsHasBreak] = useState(false);
  const [qsBreakStart, setQsBreakStart] = useState('13:00');
  const [qsBreakEnd, setQsBreakEnd] = useState('14:00');
  const [qsDays, setQsDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

  const [form, setForm] = useState({
      name: '', specialty: '', room: '', fee: '500', consultationTime: '15', mobile: '', email: '', password: '', regNo: '', masterId: '', avatarUrl: '',
      schedule: [] as DaySchedule[]
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData && mode === 'EDIT') {
            const normalized = initialData.weeklySchedule.map((d: any) => {
                if (d.slots && Array.isArray(d.slots)) return { ...d, isOff: !!d.isOff };
                return { day: d.day, slots: [], isOff: !!d.isOff };
            });
            setForm({
                name: initialData.name, specialty: initialData.specialty, room: initialData.roomNumber, 
                fee: initialData.consultationFee.toString(), consultationTime: (initialData.consultationTime || 15).toString(),
                mobile: initialData.mobile || '', email: initialData.email || '', password: initialData.password || '', regNo: initialData.registrationNumber || '', 
                masterId: initialData.masterId, avatarUrl: initialData.avatarUrl || '', 
                schedule: normalized
            });
        } else {
            const defaultSchedule = DAYS_OF_WEEK.map(d => ({
                day: d, slots: d === 'Sunday' ? [] : [{ startTime: '09:00', endTime: '17:00', active: true, label: 'Regular' }], isOff: d === 'Sunday'
            }));
            setForm({ name: '', specialty: '', room: '', fee: '500', consultationTime: '15', mobile: '', email: '', password: '', regNo: '', masterId: '', avatarUrl: '', schedule: defaultSchedule });
            setLinkedProfile(null);
        }
        setActiveTab('INFO');
    }
  }, [isOpen, initialData, mode]);

  const handleMobileBlur = () => { if (form.mobile.length >= 10 && mode === 'ADD') { const existing = onCheckMasterDoctor(form.mobile); setLinkedProfile(existing || null); } };
  const applyLinkedProfile = () => { if (linkedProfile) { setForm({ ...form, name: linkedProfile.name, specialty: linkedProfile.specialty, regNo: linkedProfile.registrationNumber || '', masterId: linkedProfile.masterId, avatarUrl: linkedProfile.avatarUrl || '', email: linkedProfile.email || '', password: linkedProfile.password || '' }); setLinkedProfile(null); addToast('Doctor profile linked!', 'success'); } };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); onClose(); };
  
  // Schedule Helpers
  const toggleDayOff = (dayIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const isOff = !cur.isOff; 
      // If turning ON and no slots, add default
      newSchedule[dayIndex] = { ...cur, isOff, slots: isOff ? [] : (cur.slots?.length ? cur.slots : [{ startTime: '09:00', endTime: '17:00', active: true, label: 'Regular' }]) }; 
      setForm({ ...form, schedule: newSchedule }); 
  };
  
  const addSlot = (dayIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const existing = cur.slots ? [...cur.slots] : []; 
      const last = existing.length ? existing[existing.length - 1] : null; 
      let defaultStart = last ? last.endTime : '09:00'; 
      // Simple logic to add 4 hours
      const addHours = (t: string, h: number) => { const [hh, mm] = t.split(':').map(Number); const nextH = (hh + h) % 24; return `${nextH.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`; }; 
      const defaultEnd = addHours(defaultStart, 4); 
      newSchedule[dayIndex] = { ...cur, slots: [...existing, { startTime: defaultStart, endTime: defaultEnd, active: true, label: 'Shift' }], isOff: false }; 
      setForm({ ...form, schedule: newSchedule }); 
  };

  const addCommonSlot = (dayIndex: number, type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT') => {
      const newSchedule = [...form.schedule];
      const cur = newSchedule[dayIndex]; 
      const existing = cur.slots ? [...cur.slots] : [];
      
      let newSlot = { startTime: '09:00', endTime: '13:00', active: true, label: 'Morning' };
      if (type === 'AFTERNOON') newSlot = { startTime: '14:00', endTime: '17:00', active: true, label: 'Afternoon' };
      if (type === 'EVENING') newSlot = { startTime: '18:00', endTime: '21:00', active: true, label: 'Evening' };
      if (type === 'NIGHT') newSlot = { startTime: '22:00', endTime: '06:00', active: true, label: 'Night' };
      
      newSchedule[dayIndex] = { ...cur, isOff: false, slots: [...existing, newSlot] };
      setForm({ ...form, schedule: newSchedule });
      addToast(`Added ${newSlot.label} slot`, 'success');
  };
  
  const removeSlot = (dayIndex: number, slotIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const slots = [...(cur.slots || [])]; 
      slots.splice(slotIndex, 1); 
      newSchedule[dayIndex] = { ...cur, slots, isOff: slots.length === 0 }; 
      setForm({ ...form, schedule: newSchedule }); 
  };
  
  const updateSlot = (dayIndex: number, slotIndex: number, field: string, value: string | boolean) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const slots = [...(cur.slots || [])]; 
      slots[slotIndex] = { ...slots[slotIndex], [field]: value } as any; 
      newSchedule[dayIndex] = { ...cur, slots }; 
      setForm({ ...form, schedule: newSchedule }); 
  };

  const generateQuickSchedule = () => {
      const newSlots = [];
      if (qsHasBreak) {
          if (qsBreakStart > qsStart && qsBreakEnd < qsEnd) {
              newSlots.push({ startTime: qsStart, endTime: qsBreakStart, active: true, label: 'Morning' });
              newSlots.push({ startTime: qsBreakEnd, endTime: qsEnd, active: true, label: 'Afternoon' });
          } else {
              newSlots.push({ startTime: qsStart, endTime: qsEnd, active: true, label: 'Regular' });
          }
      } else {
          newSlots.push({ startTime: qsStart, endTime: qsEnd, active: true, label: 'Regular' });
      }

      const newSchedule = form.schedule.map(d => {
          if (qsDays.includes(d.day)) {
              return { ...d, isOff: false, slots: JSON.parse(JSON.stringify(newSlots)) };
          }
          return d;
      });
      setForm({ ...form, schedule: newSchedule });
      addToast("Schedule applied successfully", "success");
  };

  const getDayStats = (day: DaySchedule) => {
      if (day.isOff) return null;
      let totalMins = 0;
      let activeSlots = 0;
      day.slots.forEach(s => {
          if (!s.active) return;
          activeSlots++;
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60;
          totalMins += diff;
      });
      const hours = (totalMins / 60).toFixed(1);
      const slots = Math.floor(totalMins / (parseInt(form.consultationTime) || 15));
      return { hours, slots, activeSlots };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'ADD' ? 'Add Medical Staff' : 'Edit Doctor Details'} maxWidth="max-w-6xl">
        <div className="flex border-b border-slate-200 mb-6 sticky top-0 bg-white z-10 pt-2">
            <button className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'INFO' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab('INFO')}>Basic Info</button>
            <button className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'SCHEDULE' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab('SCHEDULE')}>Weekly Schedule</button>
        </div>
        
        <form onSubmit={handleSubmit} className="pb-4">
            {activeTab === 'INFO' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-6">
                        <Input label="Doctor Name" placeholder="e.g. Dr. Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                        <Input label="Specialty" placeholder="e.g. Cardiologist" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <Input label="Mobile (Required for Link)" placeholder="9876543210" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} onBlur={handleMobileBlur} required readOnly={mode === 'EDIT' || !!linkedProfile} />
                            {linkedProfile && (<div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex items-center justify-between animate-in fade-in border border-blue-100"><div className="flex items-center gap-2"><img src={linkedProfile.avatarUrl} className="w-6 h-6 rounded-full" /><span>Found: <strong>{linkedProfile.name}</strong></span></div><Button type="button" size="sm" onClick={applyLinkedProfile}><LinkIcon className="h-3 w-3 mr-1" /> Link Profile</Button></div>)}
                        </div>
                        <Input label="Registration No." placeholder="REG12345" value={form.regNo} onChange={e => setForm({...form, regNo: e.target.value})} />
                    </div>

                    {/* Auth Credentials */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Lock className="h-3 w-3" /> Login Credentials
                        </div>
                        <Input label="Email" placeholder="doctor@clinic.com" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                        <Input label="Password" type="password" placeholder="••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <Input label="Room No." placeholder="101" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required />
                        <Input label="Consultation Fee (₹)" type="number" placeholder="500" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} />
                        <Input label="Avg. Consultation Time (mins)" type="number" placeholder="15" value={form.consultationTime} onChange={e => setForm({...form, consultationTime: e.target.value})} />
                    </div>
                </div>
            )}

            {/* Schedule Tab Content omitted for brevity as it remains mostly unchanged, keeping structure */}
            {activeTab === 'SCHEDULE' && (
                <div className="space-y-8 animate-in fade-in">
                    
                    {/* QUICK SETUP TOOL */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-amber-500 fill-current" />
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Quick Schedule Generator</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                            {/* Shift */}
                            <div className="lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-2">Shift Hours</label>
                                <div className="flex items-center gap-2">
                                    <input type="time" className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm" value={qsStart} onChange={e => setQsStart(e.target.value)} />
                                    <span className="text-slate-400 text-xs">to</span>
                                    <input type="time" className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm" value={qsEnd} onChange={e => setQsEnd(e.target.value)} />
                                </div>
                            </div>

                            {/* Break */}
                            <div className="lg:col-span-4">
                                <div className="flex items-center justify-between mb-2">
                                     <label className="block text-xs font-bold text-slate-500">Break (Optional)</label>
                                     <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                        <input type="checkbox" checked={qsHasBreak} onChange={e => setQsHasBreak(e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                        <span className={qsHasBreak ? 'text-slate-700 font-bold' : 'text-slate-400'}>Enable</span>
                                     </label>
                                </div>
                                <div className={`flex items-center gap-2 transition-opacity ${qsHasBreak ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                    <input type="time" className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm" value={qsBreakStart} onChange={e => setQsBreakStart(e.target.value)} />
                                    <span className="text-slate-400 text-xs">to</span>
                                    <input type="time" className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm" value={qsBreakEnd} onChange={e => setQsBreakEnd(e.target.value)} />
                                </div>
                            </div>

                            {/* Apply To */}
                            <div className="lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-2">Apply Days</label>
                                <div className="flex flex-wrap gap-1">
                                    {DAYS_OF_WEEK.map(d => (
                                        <button 
                                            key={d} type="button"
                                            onClick={() => setQsDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                                            className={`w-7 h-7 rounded text-[10px] font-bold border transition-colors ${qsDays.includes(d) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {d.charAt(0)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <Button type="button" onClick={generateQuickSchedule} size="sm" className="w-full h-[38px] text-xs font-bold">Generate</Button>
                            </div>
                        </div>
                    </div>

                    {/* DAILY ROWS */}
                    <div className="space-y-4">
                        {form.schedule.map((daySchedule, idx) => {
                            const stats = getDayStats(daySchedule);
                            return (
                                <div key={daySchedule.day} className={`rounded-xl border transition-all overflow-hidden ${daySchedule.isOff ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-300 shadow-sm'}`}>
                                    {/* Row Header */}
                                    <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => toggleDayOff(idx)} 
                                                className={`w-20 py-1.5 rounded-lg text-xs font-bold border transition-colors text-center ${daySchedule.isOff ? 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300' : 'bg-green-500 text-white border-green-600 shadow-sm hover:bg-green-600'}`}
                                            >
                                                {daySchedule.isOff ? 'OFF' : 'WORKING'}
                                            </button>
                                            <h4 className={`font-bold text-sm ${daySchedule.isOff ? 'text-slate-400' : 'text-slate-800'}`}>{daySchedule.day}</h4>
                                        </div>
                                        {!daySchedule.isOff && stats && (
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="text-slate-500 font-medium">{stats.activeSlots} Active Slots</span>
                                                <div className="h-4 w-px bg-slate-200"></div>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold">{stats.hours}h Total</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Row Content */}
                                    {!daySchedule.isOff && (
                                        <div className="p-3 bg-white">
                                            <div className="flex flex-col gap-3">
                                                
                                                {/* Slots List */}
                                                {(daySchedule.slots && daySchedule.slots.length > 0) ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {daySchedule.slots.map((slot, sIdx) => (
                                                        <div key={sIdx} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${slot.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                                                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded px-2 py-1">
                                                                <input type="time" className="text-xs font-bold text-slate-700 bg-transparent outline-none w-[4.5rem] text-center" value={slot.startTime} onChange={(e) => updateSlot(idx, sIdx, 'startTime', e.target.value)} />
                                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                                <input type="time" className="text-xs font-bold text-slate-700 bg-transparent outline-none w-[4.5rem] text-center" value={slot.endTime} onChange={(e) => updateSlot(idx, sIdx, 'endTime', e.target.value)} />
                                                            </div>
                                                            
                                                            <div className="flex-1">
                                                                <Input 
                                                                    className="h-8 text-xs py-1" 
                                                                    placeholder="Label (e.g. Morning)" 
                                                                    value={slot.label || ''} 
                                                                    onChange={(e) => updateSlot(idx, sIdx, 'label', e.target.value)} 
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => updateSlot(idx, sIdx, 'active', !slot.active)} 
                                                                    className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                                                                    title={slot.active ? "Deactivate Slot" : "Activate Slot"}
                                                                >
                                                                    {slot.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                                                                </button>
                                                                
                                                                <button type="button" onClick={() => removeSlot(idx, sIdx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove Slot">
                                                                    <XIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    </div>
                                                ) : <div className="text-xs text-slate-400 italic py-2 text-center border-2 border-dashed border-slate-100 rounded-lg">No active slots. Add one using buttons below.</div>}
                                                
                                                {/* Action Bar */}
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Quick Add:</span>
                                                    <button type="button" onClick={() => addCommonSlot(idx, 'MORNING')} className="px-2 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold flex items-center gap-1.5 hover:bg-orange-100 transition-colors"><Sun className="h-3 w-3" /> Morning</button>
                                                    <button type="button" onClick={() => addCommonSlot(idx, 'AFTERNOON')} className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"><CloudSun className="h-3 w-3" /> Afternoon</button>
                                                    <button type="button" onClick={() => addCommonSlot(idx, 'EVENING')} className="px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"><Moon className="h-3 w-3" /> Evening</button>
                                                    <button type="button" onClick={() => addCommonSlot(idx, 'NIGHT')} className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 transition-colors"><MoonStar className="h-3 w-3" /> Night</button>
                                                    
                                                    <div className="flex-1"></div>
                                                    <button type="button" onClick={() => addSlot(idx)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 text-xs font-bold flex items-center gap-1.5 transition-colors"><Plus className="h-3 w-3" /> Custom Slot</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit">{mode === 'ADD' ? 'Add Doctor' : 'Save Changes'}</Button>
            </div>
        </form>
    </Modal>
  );
};

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    )
}
