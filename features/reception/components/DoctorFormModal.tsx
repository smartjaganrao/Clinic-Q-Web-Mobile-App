import React, { useState, useEffect } from 'react';
import { Doctor, DaySchedule, TimeSlot, SessionMode, ClinicDayConfig } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Plus, Trash2, AlertCircle, Clock, Copy, Sun, Moon, Sunset, Sunrise, User, Calendar, Shield, FileText, Image as ImageIcon, GraduationCap, Languages as LanguagesIcon, Briefcase, X, Mail, Lock, Phone, Stethoscope, Banknote, Timer, MapPin, UserCircle, Settings, CheckCircle2, RotateCcw } from 'lucide-react';

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'ADD' | 'EDIT';
    initialData?: Doctor;
    onCheckMasterDoctor: (mobile: string) => Doctor | null;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    clinicOperatingHours?: string;
    clinicWorkingHours?: ClinicDayConfig[];
    validateSlot?: (day: string, start: string, end: string) => { isValid: boolean; error?: string };
    onSave: (data: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper: Convert HH:mm to minutes for comparison
const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper: Check for overlap
const checkOverlap = (slots: TimeSlot[], start: string, end: string) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return slots.some(slot => {
        const slotS = timeToMinutes(slot.startTime);
        const slotE = timeToMinutes(slot.endTime);
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        return s < slotE && e > slotS;
    });
};

// Helper: Check if a specific slot overlaps with others in the same array
const isSlotOverlapping = (slotIndex: number, allSlots: TimeSlot[]) => {
    const currentSlot = allSlots[slotIndex];
    if (!currentSlot || !currentSlot.startTime || !currentSlot.endTime) return false;

    const s1 = timeToMinutes(currentSlot.startTime);
    const e1 = timeToMinutes(currentSlot.endTime);

    // A slot is invalid if its end time is not after its start time.
    if (s1 >= e1) return true;

    for (let i = 0; i < allSlots.length; i++) {
        if (i === slotIndex) continue; // Don't compare with itself
        const otherSlot = allSlots[i];
        if (!otherSlot || !otherSlot.startTime || !otherSlot.endTime) continue;
        
        const s2 = timeToMinutes(otherSlot.startTime);
        const e2 = timeToMinutes(otherSlot.endTime);

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (s1 < e2 && e1 > s2) {
            return true; // Found an overlap
        }
    }
    return false;
};

export const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
    isOpen, onClose, mode, initialData, onCheckMasterDoctor, addToast, validateSlot, onSave, clinicWorkingHours
}) => {
    // State for form fields
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [room, setRoom] = useState('');
    const [mobile, setMobile] = useState('');
    const [regNo, setRegNo] = useState('');
    const [fee, setFee] = useState<number>(500);
    const [consultationTime, setConsultationTime] = useState<number>(15);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'OPERATIONS' | 'SCHEDULE'>('PROFILE');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [experience, setExperience] = useState<number>(0);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [educationList, setEducationList] = useState<string[]>([]);
    const [languagesList, setLanguagesList] = useState<string[]>([]);
    const [eduInput, setEduInput] = useState('');
    const [langInput, setLangInput] = useState('');
    const [bio, setBio] = useState('');

    // Initialize state on open
    useEffect(() => {
        if (isOpen) {
            setActiveTab('PROFILE');
            if (initialData) {
                setName(initialData.name);
                setSpecialty(initialData.specialty);
                setRoom(initialData.roomNumber);
                setMobile(initialData.mobile);
                setRegNo(initialData.registrationNumber || '');
                setFee(initialData.consultationFee);
                setConsultationTime(initialData.consultationTime);
                setSchedule(initialData.weeklySchedule || generateEmptySchedule());
                setEmail(initialData.email || '');
                setPassword(initialData.password || '');
                setExperience(initialData.experience || 0);
                setAvatarUrl(initialData.avatarUrl || '');
                setEducationList(initialData.education || []);
                setLanguagesList(initialData.languages || []);
                setBio(initialData.bio || '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setName('');
        setSpecialty('');
        setRoom('');
        setMobile('');
        setRegNo('');
        setFee(500);
        setConsultationTime(15);
        setSchedule(generateEmptySchedule());
        setEmail('');
        setPassword('');
        setExperience(0);
        setAvatarUrl('');
        setEducationList([]);
        setLanguagesList([]);
        setBio('');
    };

    const generateEmptySchedule = (): DaySchedule[] => {
        return DAYS.map(day => ({
            day,
            isOff: day === 'Sunday',
            slots: day === 'Sunday' ? [] : [{
                id: Math.random().toString(36).substr(2, 9),
                startTime: '09:00',
                endTime: '17:00',
                label: 'Regular Shift',
                active: true,
                mode: SessionMode.HYBRID
            }]
        }));
    };

    const handleAddSlot = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].slots.push({
            id: Math.random().toString(36).substr(2, 9),
            startTime: '09:00',
            endTime: '13:00',
            label: 'Extra Shift',
            active: true,
            mode: SessionMode.HYBRID
        });
        newSchedule[dayIndex].isOff = false;
        newSchedule[dayIndex].slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        setSchedule(newSchedule);
    };

    const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].slots.splice(slotIndex, 1);
        if (newSchedule[dayIndex].slots.length === 0) {
            newSchedule[dayIndex].isOff = true;
        }
        setSchedule(newSchedule);
    };

    const handleQuickAdd = (dayIndex: number, preset: { label: string, start: string, end: string }) => {
        // 1. Prevent Overlap Booking
        if (checkOverlap(schedule[dayIndex].slots, preset.start, preset.end)) {
            addToast(`Cannot add ${preset.label}: Overlaps with existing slot`, "error");
            return;
        }

        const newSchedule = [...schedule];
        newSchedule[dayIndex].slots.push({
            id: Math.random().toString(36).substr(2, 9),
            startTime: preset.start,
            endTime: preset.end,
            label: preset.label,
            active: true,
            mode: SessionMode.HYBRID
        });
        newSchedule[dayIndex].isOff = false;
        newSchedule[dayIndex].slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        setSchedule(newSchedule);
    };

    const handleCopyToAll = (sourceDayIndex: number) => {
        const sourceDay = schedule[sourceDayIndex];
        let skippedCount = 0;

        const newSchedule = schedule.map((day, index) => {
            if (index === sourceDayIndex) return day;

            const dayShort = day.day.substring(0, 3).toUpperCase();
            const clinicDayConfig = clinicWorkingHours?.find(c => c.dayOfWeek === dayShort);
            const isClinicClosed = clinicWorkingHours ? !clinicDayConfig?.isOpen : false;

            if (isClinicClosed) {
                skippedCount++;
                return day; // Keep the existing schedule for closed days
            }

            return {
                ...day,
                isOff: sourceDay.isOff,
                slots: sourceDay.slots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }))
            };
        });
        setSchedule(newSchedule);
        addToast(`Copied schedule to all open days. ${skippedCount > 0 ? `(${skippedCount} closed day(s) skipped)` : ''}`, 'success');
    };

    const handleSlotChange = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].slots[slotIndex] = {
            ...newSchedule[dayIndex].slots[slotIndex],
            [field]: value
        };
        // Auto-sort slots by start time if start time is changed
        if (field === 'startTime') {
            newSchedule[dayIndex].slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        }
        setSchedule(newSchedule);
    };

    const handleDayToggle = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].isOff = !newSchedule[dayIndex].isOff;
        if (!newSchedule[dayIndex].isOff && newSchedule[dayIndex].slots.length === 0) {
             newSchedule[dayIndex].slots.push({
                id: Math.random().toString(36).substr(2, 9),
                startTime: '09:00',
                endTime: '17:00',
                label: 'Shift',
                active: true,
                mode: SessionMode.HYBRID
            });
        }
        setSchedule(newSchedule);
    };

    const handleResetDay = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].slots = [];
        setSchedule(newSchedule);
        addToast(`${schedule[dayIndex].day}'s schedule has been cleared.`, 'info');
    };

    const handleAddEducation = () => {
        if (eduInput.trim()) {
            setEducationList([...educationList, eduInput.trim()]);
            setEduInput('');
        }
    };

    const handleAddLanguage = () => {
        if (langInput.trim()) {
            setLanguagesList([...languagesList, langInput.trim()]);
            setLangInput('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize schedule: If clinic is closed, force day to be OFF for the doctor
        // This prevents validation errors for days that are closed but might have default slots in state
        const finalSchedule = schedule.map(daySchedule => {
            const dayShort = daySchedule.day.substring(0, 3).toUpperCase();
            const clinicDayConfig = clinicWorkingHours?.find(c => c.dayOfWeek === dayShort);
            const isClinicClosed = clinicWorkingHours ? !clinicDayConfig?.isOpen : false;

            if (isClinicClosed) {
                return { ...daySchedule, isOff: true, slots: [] };
            }
            return daySchedule;
        });

        // --- VALIDATION ---

        // 1. Clinic Working Hours Validation (from parent)
        if (validateSlot) {
            for (const daySchedule of finalSchedule) {
                if (daySchedule.isOff) continue;
                for (const slot of daySchedule.slots) {
                    const validation = validateSlot(daySchedule.day, slot.startTime, slot.endTime);
                    if (!validation.isValid) {
                        addToast(`${daySchedule.day}: ${validation.error}`, "error");
                        setActiveTab('SCHEDULE');
                        return; // Prevent submission
                    }
                }
            }
        }

        // Overlap validation before submitting
        for (const daySchedule of finalSchedule) {
            if (!daySchedule.isOff && daySchedule.slots.length > 1) {
                const sortedSlots = [...daySchedule.slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                for (let i = 0; i < sortedSlots.length - 1; i++) {
                    const currentSlotEnd = timeToMinutes(sortedSlots[i].endTime);
                    const nextSlotStart = timeToMinutes(sortedSlots[i+1].startTime);

                    if (currentSlotEnd > nextSlotStart) {
                        addToast(`Schedule conflict on ${daySchedule.day}. Please fix overlapping slots.`, "error");
                        setActiveTab('SCHEDULE'); // Switch to schedule tab to show the error
                        return; // Prevent submission
                    }
                }
            }
        }

        // --- END VALIDATION ---

        onSave({
            name, specialty, room, mobile, regNo, fee, consultationTime, 
            schedule: finalSchedule,
            email, password, experience,
            avatarUrl,
            education: educationList,
            languages: languagesList,
            bio
        });
        onClose();
    };

    const getAmPm = (time: string) => {
        if (!time) return '';
        const h = parseInt(time.split(':')[0]);
        return h >= 12 ? 'PM' : 'AM';
    };

    const formatTimeDisplay = (time: string) => {
        if (!time) return '';
        const [hStr, mStr] = time.split(':');
        let h = parseInt(hStr);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${mStr} ${ampm}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'ADD' ? 'Add New Doctor' : 'Edit Doctor Profile'} maxWidth="max-w-6xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
                <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl mb-6 shrink-0 border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('PROFILE')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROFILE' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
                    >
                        <UserCircle className="h-4 w-4" /> Public Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('OPERATIONS')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'OPERATIONS' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
                    >
                        <Settings className="h-4 w-4" /> Operations & Access
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('SCHEDULE')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SCHEDULE' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
                    >
                        <Calendar className="h-4 w-4" /> Weekly Schedule
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                    {activeTab === 'PROFILE' && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
                            {/* Top Section: Identity */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Avatar */}
                                <div className="w-full md:w-1/3 flex flex-col gap-4">
                                    <div className="aspect-square rounded-[2rem] bg-slate-50 border-4 border-white shadow-lg overflow-hidden relative group">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <Input label="Avatar URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="text-xs" />
                                </div>

                                {/* Key Info */}
                                <div className="w-full md:w-2/3 flex flex-col gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <UserCircle className="h-4 w-4" /> Identity
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <Input label="Doctor Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Dr. Smith" icon={<User className="h-4 w-4 text-slate-400" />} />
                                            <Input label="Specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="e.g. Cardiologist" icon={<Stethoscope className="h-4 w-4 text-slate-400" />} />
                                            <Input label="Experience (Years)" type="number" value={experience} onChange={e => setExperience(Number(e.target.value))} icon={<Briefcase className="h-4 w-4 text-slate-400" />} />
                                            <Input label="Registration No" value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="Medical Reg No" icon={<Shield className="h-4 w-4 text-slate-400" />} />
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary-500" /> Professional Bio
                                        </label>
                                        <textarea 
                                            className="flex-1 w-full p-4 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none leading-relaxed"
                                            placeholder="Describe expertise, background, and philosophy..."
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Qualifications */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-primary-500" /> Education
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input 
                                            className="flex-1 h-10 rounded-xl border border-slate-300 px-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                            placeholder="e.g. MBBS"
                                            value={eduInput}
                                            onChange={e => setEduInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddEducation())}
                                        />
                                        <Button type="button" size="sm" onClick={handleAddEducation} disabled={!eduInput.trim()}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {educationList.map((edu, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                {edu} <button type="button" onClick={() => setEducationList(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                        {educationList.length === 0 && <span className="text-xs text-slate-400 italic">No degrees added</span>}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                                        <LanguagesIcon className="h-4 w-4 text-primary-500" /> Languages
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input 
                                            className="flex-1 h-10 rounded-xl border border-slate-300 px-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                            placeholder="e.g. English"
                                            value={langInput}
                                            onChange={e => setLangInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                                        />
                                        <Button type="button" size="sm" onClick={handleAddLanguage} disabled={!langInput.trim()}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {languagesList.map((lang, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                {lang} <button type="button" onClick={() => setLanguagesList(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                        {languagesList.length === 0 && <span className="text-xs text-slate-400 italic">No languages added</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'OPERATIONS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Lock className="h-4 w-4" /> Access & Contact
                                    </h3>
                                    <div className="space-y-4">
                                        <Input label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="10-digit mobile" icon={<Phone className="h-4 w-4 text-slate-400" />} />
                                        <Input label="Email (Login)" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@clinic.com" icon={<Mail className="h-4 w-4 text-slate-400" />} />
                                        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set login password" icon={<Lock className="h-4 w-4 text-slate-400" />} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Banknote className="h-4 w-4" /> Consultation Details
                                    </h3>
                                    <div className="space-y-4">
                                        <Input label="Room Number" value={room} onChange={e => setRoom(e.target.value)} required placeholder="e.g. 101" icon={<MapPin className="h-4 w-4 text-slate-400" />} />
                                        <Input label="Consultation Fee (₹)" type="number" value={fee} onChange={e => setFee(Number(e.target.value))} required icon={<Banknote className="h-4 w-4 text-slate-400" />} />
                                        <Input label="Avg. Time per Patient (mins)" type="number" value={consultationTime} onChange={e => setConsultationTime(Number(e.target.value))} required icon={<Timer className="h-4 w-4 text-slate-400" />} />
                                        
                                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                                            <p className="text-xs text-blue-800 leading-relaxed">
                                                These settings affect queue estimation and billing. Ensure they are accurate.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SCHEDULE' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                            {schedule.map((daySchedule, dIdx) => {
                                const dayShort = daySchedule.day.substring(0, 3).toUpperCase();
                                const clinicDayConfig = clinicWorkingHours?.find(c => c.dayOfWeek === dayShort);
                                const isClinicClosed = clinicWorkingHours ? !clinicDayConfig?.isOpen : false;
                                
                                const clinicHoursText = clinicDayConfig?.isOpen && clinicDayConfig.shifts 
                                    ? clinicDayConfig.shifts.map(s => `${formatTimeDisplay(s.start)} - ${formatTimeDisplay(s.end)}`).join(', ')
                                    : 'Closed';

                                return (
                                <div key={daySchedule.day} className={`group flex flex-col gap-0 rounded-2xl border transition-all duration-300 overflow-hidden ${daySchedule.isOff || isClinicClosed ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200'}`}>
                                    
                                    {/* ROW 1: Header (Day Info & Actions) */}
                                    <div className={`flex items-center justify-between px-4 py-3 ${daySchedule.isOff || isClinicClosed ? 'bg-slate-100/50' : 'bg-slate-50/80 border-b border-slate-100'}`}>
                                        <div className="flex items-center gap-3">
                                            {isClinicClosed ? (
                                                <div className="flex items-center gap-3 opacity-60 cursor-not-allowed select-none">
                                                    <div className="w-9 h-5 bg-slate-200 rounded-full flex items-center justify-start p-0.5">
                                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                                    </div>
                                                    <span className="font-black text-xs uppercase tracking-widest text-slate-400 line-through decoration-slate-300">{daySchedule.day}</span>
                                                    <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 uppercase tracking-wider">Clinic Closed</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!daySchedule.isOff} 
                                                            onChange={() => handleDayToggle(dIdx)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                                    </label>
                                                    <span className={`font-black text-xs uppercase tracking-widest ${daySchedule.isOff ? 'text-slate-400' : 'text-slate-800'}`}>{daySchedule.day}</span>
                                                </>
                                            )}
                                            
                                            {/* Clinic Hours Display */}
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ml-2 ${isClinicClosed ? 'bg-red-50 text-red-400' : 'bg-slate-100 text-slate-500'}`}>
                                                Clinic: {clinicHoursText}
                                            </span>
                                        </div>

                                        {!daySchedule.isOff && !isClinicClosed && (
                                            <div className="flex items-center gap-3">
                                                {/* Quick Add Toolbar */}
                                                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleQuickAdd(dIdx, { label: 'Morning', start: '09:00', end: '13:00' })} 
                                                        disabled={checkOverlap(daySchedule.slots, '09:00', '13:00')}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Sunrise className="h-3.5 w-3.5" /> <span className="text-[10px] font-bold uppercase">Morning</span>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleQuickAdd(dIdx, { label: 'Afternoon', start: '13:00', end: '17:00' })} 
                                                        disabled={checkOverlap(daySchedule.slots, '13:00', '17:00')}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Sun className="h-3.5 w-3.5" /> <span className="text-[10px] font-bold uppercase">Afternoon</span>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleQuickAdd(dIdx, { label: 'Evening', start: '17:00', end: '21:00' })} 
                                                        disabled={checkOverlap(daySchedule.slots, '17:00', '21:00')}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Sunset className="h-3.5 w-3.5" /> <span className="text-[10px] font-bold uppercase">Evening</span>
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleQuickAdd(dIdx, { label: 'Night', start: '21:00', end: '23:59' })} 
                                                        disabled={checkOverlap(daySchedule.slots, '21:00', '23:59')}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Moon className="h-3.5 w-3.5" /> <span className="text-[10px] font-bold uppercase">Night</span>
                                                    </button>
                                                    <div className="w-px h-3 bg-slate-200 mx-1"></div>
                                                    <button type="button" onClick={() => handleAddSlot(dIdx)} title="Add Custom Slot" className="p-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-md transition-colors"><Plus className="h-4 w-4" /></button>
                                                </div>
                                                
                                                <div className="w-px h-4 bg-slate-200"></div>

                                                <button 
                                                    type="button" 
                                                    onClick={() => handleResetDay(dIdx)} 
                                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                    title="Clear all slots for this day"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reset</span>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleCopyToAll(dIdx)} 
                                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-primary-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                                                    title="Copy Schedule to All Days"
                                                >
                                                    <Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copy</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* ROW 2: Content (Slots) */}
                                    <div className="p-4">
                                        {isClinicClosed ? (
                                            <div className="flex items-center justify-center gap-3 py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                <div className="w-2 h-2 rounded-full bg-red-300"></div>
                                                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Clinic is closed on this day</span>
                                            </div>
                                        ) : !daySchedule.isOff ? (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                {daySchedule.slots.map((slot, sIdx) => {
                                                    const clinicHoursValidation = validateSlot ? validateSlot(daySchedule.day, slot.startTime, slot.endTime) : { isValid: true };
                                                    const hasInternalOverlap = isSlotOverlapping(sIdx, daySchedule.slots);
                                                    const isInvalid = !clinicHoursValidation.isValid || hasInternalOverlap;
                                                    return (
                                                        <div key={slot.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 px-3 py-3 rounded-xl border shadow-sm bg-white transition-all group/slot w-full ${isInvalid ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-primary-300 hover:shadow-md'}`}>
                                                            
                                                            {/* Time Range */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors">
                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                    <input 
                                                                        type="time" 
                                                                        value={slot.startTime} 
                                                                        onChange={e => handleSlotChange(dIdx, sIdx, 'startTime', e.target.value)}
                                                                        className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 w-[6rem] cursor-pointer"
                                                                    />
                                                                    <div className="h-px w-2 bg-slate-300"></div>
                                                                    <input 
                                                                        type="time" 
                                                                        value={slot.endTime} 
                                                                        onChange={e => handleSlotChange(dIdx, sIdx, 'endTime', e.target.value)}
                                                                        className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 w-[6rem] cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Label & Mode & Delete */}
                                                            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto min-w-0">
                                                                <div className="flex-1 min-w-0">
                                                                    <input 
                                                                        type="text" 
                                                                        value={slot.label || ''} 
                                                                        onChange={e => handleSlotChange(dIdx, sIdx, 'label', e.target.value)}
                                                                        placeholder="Shift Name"
                                                                        className="w-full bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none placeholder:text-slate-300 truncate"
                                                                    />
                                                                </div>

                                                                <div className="w-24 shrink-0">
                                                                    <select 
                                                                        value={slot.mode || SessionMode.HYBRID}
                                                                        onChange={e => handleSlotChange(dIdx, sIdx, 'mode', e.target.value)}
                                                                        className="w-full bg-slate-50 px-1 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none cursor-pointer"
                                                                    >
                                                                        <option value={SessionMode.WALK_IN}>Walk-in</option>
                                                                        <option value={SessionMode.APPOINTMENT}>Appt</option>
                                                                        <option value={SessionMode.HYBRID}>Hybrid</option>
                                                                    </select>
                                                                </div>

                                                                {isInvalid && (
                                                                    <div className="shrink-0" title={hasInternalOverlap ? "This slot overlaps with another or is invalid." : clinicHoursValidation.error}>
                                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                                    </div>
                                                                )}

                                                                <button type="button" onClick={() => handleRemoveSlot(dIdx, sIdx)} className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg shrink-0 transition-colors">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {daySchedule.slots.length === 0 && (
                                                    <div className="w-full py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                                        <p className="text-xs text-slate-400 font-medium">No active slots. Use Quick Add above.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3 py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                <span className="text-xs font-bold uppercase tracking-wide">Doctor is off-duty</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-5 border-t border-slate-200 mt-2 flex justify-end gap-3 bg-white/50 backdrop-blur-sm">
                    <Button variant="secondary" onClick={onClose} type="button" className="px-8">Cancel</Button>
                    <Button type="submit" className="px-10 shadow-xl shadow-primary-500/20">{mode === 'ADD' ? 'Create Profile' : 'Save Changes'}</Button>
                </div>
            </form>
        </Modal>
    );
};