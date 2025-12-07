
import React, { useState, useEffect } from 'react';
import { Doctor, DaySchedule } from '../../../types';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, Copy, Link as LinkIcon } from 'lucide-react';

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
  
  const [form, setForm] = useState({
      name: '', specialty: '', room: '', fee: '500', mobile: '', regNo: '', masterId: '', avatarUrl: '',
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
                fee: initialData.consultationFee.toString(), mobile: initialData.mobile || '', 
                regNo: initialData.registrationNumber || '', masterId: initialData.masterId, 
                avatarUrl: initialData.avatarUrl || '', schedule: normalized
            });
        } else {
            const defaultSchedule = DAYS_OF_WEEK.map(d => ({
                day: d, slots: d === 'Sunday' ? [] : [{ startTime: '09:00', endTime: '17:00', active: true }], isOff: d === 'Sunday'
            }));
            setForm({ name: '', specialty: '', room: '', fee: '500', mobile: '', regNo: '', masterId: '', avatarUrl: '', schedule: defaultSchedule });
            setLinkedProfile(null);
        }
        setActiveTab('INFO');
    }
  }, [isOpen, initialData, mode]);

  const handleMobileBlur = () => { if (form.mobile.length >= 10 && mode === 'ADD') { const existing = onCheckMasterDoctor(form.mobile); setLinkedProfile(existing || null); } };
  const applyLinkedProfile = () => { if (linkedProfile) { setForm({ ...form, name: linkedProfile.name, specialty: linkedProfile.specialty, regNo: linkedProfile.registrationNumber || '', masterId: linkedProfile.masterId, avatarUrl: linkedProfile.avatarUrl || '' }); setLinkedProfile(null); addToast('Doctor profile linked!', 'success'); } };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); onClose(); };
  const toggleDayOff = (dayIndex: number) => { const newSchedule = [...form.schedule]; const cur = newSchedule[dayIndex]; const isOff = !cur.isOff; newSchedule[dayIndex] = { ...cur, isOff, slots: isOff ? [] : (cur.slots?.length ? cur.slots : [{ startTime: '09:00', endTime: '17:00', active: true }]) }; setForm({ ...form, schedule: newSchedule }); };
  const addSlot = (dayIndex: number) => { const newSchedule = [...form.schedule]; const cur = newSchedule[dayIndex]; const existing = cur.slots ? [...cur.slots] : []; const last = existing.length ? existing[existing.length - 1] : null; let defaultStart = last ? last.endTime : '09:00'; const addHours = (t: string, h: number) => { const [hh, mm] = t.split(':').map(Number); const nextH = (hh + h) % 24; return `${nextH.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`; }; const defaultEnd = addHours(defaultStart, 4); newSchedule[dayIndex] = { ...cur, slots: [...existing, { startTime: defaultStart, endTime: defaultEnd, active: true }], isOff: false }; setForm({ ...form, schedule: newSchedule }); };
  const removeSlot = (dayIndex: number, slotIndex: number) => { const newSchedule = [...form.schedule]; const cur = newSchedule[dayIndex]; const slots = [...(cur.slots || [])]; slots.splice(slotIndex, 1); newSchedule[dayIndex] = { ...cur, slots, isOff: slots.length === 0 }; setForm({ ...form, schedule: newSchedule }); };
  const updateSlot = (dayIndex: number, slotIndex: number, field: string, value: string) => { const newSchedule = [...form.schedule]; const cur = newSchedule[dayIndex]; const slots = [...(cur.slots || [])]; slots[slotIndex] = { ...slots[slotIndex], [field]: value } as any; newSchedule[dayIndex] = { ...cur, slots }; setForm({ ...form, schedule: newSchedule }); };
  const copyScheduleToAll = (sourceDayIndex: number) => { const source = form.schedule[sourceDayIndex]; const newSchedule = form.schedule.map(d => ({ ...d, slots: source.slots ? JSON.parse(JSON.stringify(source.slots)) : [], isOff: source.isOff })); setForm({ ...form, schedule: newSchedule }); addToast('Schedule copied to all days', 'info'); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'ADD' ? 'Add Medical Staff' : 'Edit Doctor Details'} maxWidth="max-w-6xl">
        <div className="flex border-b border-slate-200 mb-6">
            <button className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'INFO' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`} onClick={() => setActiveTab('INFO')}>Basic Info</button>
            <button className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'SCHEDULE' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`} onClick={() => setActiveTab('SCHEDULE')}>Weekly Schedule</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'INFO' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><Input label="Doctor Name" placeholder="e.g. Dr. Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /><Input label="Specialty" placeholder="e.g. Cardiologist" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Input label="Mobile (Required for Link)" placeholder="9876543210" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} onBlur={handleMobileBlur} required readOnly={mode === 'EDIT' || !!linkedProfile} />
                            {linkedProfile && (<div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs flex items-center justify-between animate-in fade-in"><div className="flex items-center gap-2"><img src={linkedProfile.avatarUrl} className="w-6 h-6 rounded-full" /><span>Found: <strong>{linkedProfile.name}</strong></span></div><Button type="button" size="sm" onClick={applyLinkedProfile}><LinkIcon className="h-3 w-3 mr-1" /> Link Profile</Button></div>)}
                        </div>
                        <Input label="Registration No." placeholder="REG12345" value={form.regNo} onChange={e => setForm({...form, regNo: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4"><Input label="Room No." placeholder="101" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required /><Input label="Consultation Fee" type="number" placeholder="500" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} /></div>
                </div>
            )}
            {activeTab === 'SCHEDULE' && (
                <div className="space-y-4">
                    <div className="flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => copyScheduleToAll(0)} className="text-xs"><Copy className="h-3 w-3 mr-1" /> Copy Mon to All</Button></div>
                    {form.schedule.map((daySchedule, idx) => (
                        <div key={daySchedule.day} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between gap-3"><h4 className="font-bold text-slate-700 w-36">{daySchedule.day}</h4><div className="flex items-center gap-2"><button type="button" onClick={() => toggleDayOff(idx)} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${daySchedule.isOff ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}>{daySchedule.isOff ? 'OFF' : 'ON'}</button></div></div>
                            {!daySchedule.isOff && (
                                <div className="grid grid-cols-12 gap-2 items-center">
                                    {(daySchedule.slots && daySchedule.slots.length > 0) ? (
                                        daySchedule.slots.map((slot, sIdx) => (
                                            <React.Fragment key={`${daySchedule.day}_${sIdx}`}>
                                                <div className="col-span-3"></div><div className="col-span-2 text-xs text-slate-500 text-center">Slot #{sIdx + 1}</div><div className="col-span-3"><input type="time" className="w-full text-center bg-white border border-slate-300 rounded px-1 py-1 text-sm" value={slot.startTime} onChange={(e) => updateSlot(idx, sIdx, 'startTime', e.target.value)} /></div><div className="col-span-1 text-center text-slate-400">-</div><div className="col-span-2"><input type="time" className="w-full text-center bg-white border border-slate-300 rounded px-1 py-1 text-sm" value={slot.endTime} onChange={(e) => updateSlot(idx, sIdx, 'endTime', e.target.value)} /></div><div className="col-span-1 flex justify-end"><button type="button" onClick={() => removeSlot(idx, sIdx)} className="text-red-500 p-2 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
                                            </React.Fragment>
                                        ))
                                    ) : <div className="col-span-12 text-xs text-slate-400 italic px-8">No active slots</div>}
                                    <div className="col-span-12 flex justify-center mt-2"><button type="button" onClick={() => addSlot(idx)} className="px-3 py-1 text-xs rounded bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2"><Plus className="h-3 w-3" /> Add Slot</button></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">{mode === 'ADD' ? 'Add Doctor' : 'Save Changes'}</Button></div>
        </form>
    </Modal>
  );
};
