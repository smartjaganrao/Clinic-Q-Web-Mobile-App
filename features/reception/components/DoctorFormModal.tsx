
import React, { useState, useEffect } from 'react';
import { Doctor, DaySchedule } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, Copy, Link as LinkIcon, Clock, Calendar, CheckSquare, Coffee, Sun, Moon, ArrowRight, Zap } from 'lucide-react';

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
      name: '', specialty: '', room: '', fee: '500', consultationTime: '15', mobile: '', regNo: '', masterId: '', avatarUrl: '',
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
                mobile: initialData.mobile || '', regNo: initialData.registrationNumber || '', 
                masterId: initialData.masterId, avatarUrl: initialData.avatarUrl || '', 
                schedule: normalized
            });
        } else {
            const defaultSchedule = DAYS_OF_WEEK.map(d => ({
                day: d, slots: d === 'Sunday' ? [] : [{ startTime: '09:00', endTime: '17:00', active: true }], isOff: d === 'Sunday'
            }));
            setForm({ name: '', specialty: '', room: '', fee: '500', consultationTime: '15', mobile: '', regNo: '', masterId: '', avatarUrl: '', schedule: defaultSchedule });
            setLinkedProfile(null);
        }
        setActiveTab('INFO');
    }
  }, [isOpen, initialData, mode]);

  const handleMobileBlur = () => { if (form.mobile.length >= 10 && mode === 'ADD') { const existing = onCheckMasterDoctor(form.mobile); setLinkedProfile(existing || null); } };
  const applyLinkedProfile = () => { if (linkedProfile) { setForm({ ...form, name: linkedProfile.name, specialty: linkedProfile.specialty, regNo: linkedProfile.registrationNumber || '', masterId: linkedProfile.masterId, avatarUrl: linkedProfile.avatarUrl || '' }); setLinkedProfile(null); addToast('Doctor profile linked!', 'success'); } };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); onClose(); };
  
  // Schedule Helpers
  const toggleDayOff = (dayIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const isOff = !cur.isOff; 
      // If turning ON and no slots, add default
      newSchedule[dayIndex] = { ...cur, isOff, slots: isOff ? [] : (cur.slots?.length ? cur.slots : [{ startTime: '09:00', endTime: '17:00', active: true }]) }; 
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
      newSchedule[dayIndex] = { ...cur, slots: [...existing, { startTime: defaultStart, endTime: defaultEnd, active: true }], isOff: false }; 
      setForm({ ...form, schedule: newSchedule }); 
  };
  
  const removeSlot = (dayIndex: number, slotIndex: number) => { 
      const newSchedule = [...form.schedule]; 
      const cur = newSchedule[dayIndex]; 
      const slots = [...(cur.slots || [])]; 
      slots.splice(slotIndex, 1); 
      newSchedule[dayIndex] = { ...cur, slots, isOff: slots.length === 0 }; 
      setForm({ ...form, schedule: newSchedule }); 
  };
  
  const updateSlot = (dayIndex: number, slotIndex: number, field: string, value: string) => { 
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
          // Check if break is within range
          if (qsBreakStart > qsStart && qsBreakEnd < qsEnd) {
              newSlots.push({ startTime: qsStart, endTime: qsBreakStart, active: true });
              newSlots.push({ startTime: qsBreakEnd, endTime: qsEnd, active: true });
          } else {
              // Fallback if break invalid
              newSlots.push({ startTime: qsStart, endTime: qsEnd, active: true });
          }
      } else {
          newSlots.push({ startTime: qsStart, endTime: qsEnd, active: true });
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
      day.slots.forEach(s => {
          if (!s.active) return;
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60;
          totalMins += diff;
      });
      const hours = (totalMins / 60).toFixed(1);
      const slots = Math.floor(totalMins / (parseInt(form.consultationTime) || 15));
      return { hours, slots };
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

                    <div className="grid grid-cols-3 gap-6">
                        <Input label="Room No." placeholder="101" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required />
                        <Input label="Consultation Fee (₹)" type="number" placeholder="500" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} />
                        <Input label="Avg. Consultation Time (mins)" type="number" placeholder="15" value={form.consultationTime} onChange={e => setForm({...form, consultationTime: e.target.value})} />
                    </div>
                </div>
            )}

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
                    <div className="space-y-3">
                        {form.schedule.map((daySchedule, idx) => {
                            const stats = getDayStats(daySchedule);
                            return (
                                <div key={daySchedule.day} className={`rounded-xl border transition-all ${daySchedule.isOff ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-300 shadow-sm'}`}>
                                    {/* Row Header */}
                                    <div className="flex items-center justify-between p-3 border-b border-slate-100/50 bg-slate-50/50 rounded-t-xl">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => toggleDayOff(idx)} 
                                                className={`w-20 py-1 rounded text-xs font-bold border transition-colors text-center ${daySchedule.isOff ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-green-500 text-white border-green-600 shadow-sm'}`}
                                            >
                                                {daySchedule.isOff ? 'OFF' : 'WORK'}
                                            </button>
                                            <h4 className={`font-bold ${daySchedule.isOff ? 'text-slate-400' : 'text-slate-800'}`}>{daySchedule.day}</h4>
                                        </div>
                                        {!daySchedule.isOff && stats && (
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">{stats.hours} Hrs Shift</span>
                                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-medium">~{stats.slots} Slots</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Row Content */}
                                    {!daySchedule.isOff && (
                                        <div className="p-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {(daySchedule.slots && daySchedule.slots.length > 0) ? (
                                                    daySchedule.slots.map((slot, sIdx) => (
                                                        <div key={sIdx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-sm group">
                                                            <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                                                <input type="time" className="text-xs font-medium text-slate-700 bg-transparent outline-none w-[4.5rem] text-center" value={slot.startTime} onChange={(e) => updateSlot(idx, sIdx, 'startTime', e.target.value)} />
                                                            </div>
                                                            <ArrowRight className="h-3 w-3 text-slate-300" />
                                                            <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                                                <input type="time" className="text-xs font-medium text-slate-700 bg-transparent outline-none w-[4.5rem] text-center" value={slot.endTime} onChange={(e) => updateSlot(idx, sIdx, 'endTime', e.target.value)} />
                                                            </div>
                                                            <button type="button" onClick={() => removeSlot(idx, sIdx)} className="ml-1 text-slate-300 hover:text-red-500 transition-colors p-0.5 rounded"><XIcon className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    ))
                                                ) : <span className="text-xs text-slate-400 italic px-2">No active slots. Add one below.</span>}
                                                
                                                <button type="button" onClick={() => addSlot(idx)} className="h-9 w-9 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-all" title="Add Slot"><Plus className="h-4 w-4" /></button>
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
