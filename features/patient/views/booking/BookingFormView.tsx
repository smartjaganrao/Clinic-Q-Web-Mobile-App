
import React from 'react';
import {
    Star,
    Stethoscope,
    Building2,
    MapPin,
    Phone,
    Clock,
    Medal,
    FileText,
    GraduationCap,
    Languages,
    User,
    Users,
    Plus,
    Zap,
    CalendarClock,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Info,
    Edit2,
    Navigation,
    MapPinIcon,
} from 'lucide-react';
import { IndianRupeeIcon } from '../../../../components/icons';
import { Button } from '../../../../components/Button';
import { Clinic, Doctor, UserProfile, GroupedSlots } from '../../../../types';
import { Input } from '../../../../components/Input';
import { Tooltip } from '../../../../components/Tooltip';

export const BookingFormView = ({
    selectedDoctor,
    selectedClinic,
    userProfile,
    bookingFor,
    setBookingFor,
    setShowAddMember,
    visitType,
    setVisitType,
    isClinicOnlineWalkInAllowed,
    isWalkInAllowed,
    isClinicApptAllowed,
    travelTime,
    setTravelTime,
    setShowTravelTimeWarning,
    walkInShiftsToday,
    selectedWalkInShiftId,
    setSelectedWalkInShiftId,
    getClinicCurrentTime,
    bookingDates,
    apptDate,
    setApptDate,
    setApptTime,
    groupedTimeSlots,
    apptTime,
    symptoms,
    setSymptoms,
    handleBookToken,
    walkInEstimation,
    isClinicDirectWalkInOnly,
    formatTime12h
}: {
    selectedDoctor: Doctor;
    selectedClinic: Clinic;
    userProfile: UserProfile | null;
    bookingFor: string;
    setBookingFor: (value: string) => void;
    setShowAddMember: (value: boolean) => void;
    visitType: 'WALK_IN' | 'APPOINTMENT';
    setVisitType: (value: 'WALK_IN' | 'APPOINTMENT') => void;
    isClinicOnlineWalkInAllowed: boolean;
    isWalkInAllowed: boolean;
    isClinicApptAllowed: boolean;
    travelTime: string;
    setTravelTime: (value: string) => void;
    setShowTravelTimeWarning: (value: boolean) => void;
    walkInShiftsToday: any[];
    selectedWalkInShiftId: string | null;
    setSelectedWalkInShiftId: (value: string | null) => void;
    getClinicCurrentTime: (timezone?: string) => Date;
    bookingDates: any[];
    apptDate: string;
    setApptDate: (value: string) => void;
    setApptTime: (value: string) => void;
    groupedTimeSlots: GroupedSlots;
    apptTime: string;
    symptoms: string;
    setSymptoms: (value: string) => void;
    handleBookToken: () => void;
    walkInEstimation: any;
    isClinicDirectWalkInOnly: boolean;
    formatTime12h: (time: string) => string;
}) => {
    return (
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 pb-16">

            {/* LEFT COLUMN: COMPACT DOCTOR PROFILE (4/12) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-3 h-fit">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                    {/* Enhanced Header Section with Clinic Details */}
                    <div className="h-24 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600 relative shrink-0">
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                            <div className="p-2 bg-white rounded-[1.5rem] shadow-2xl ring-4 ring-white/30 backdrop-blur-sm">
                                <img
                                    src={selectedDoctor.avatarUrl}
                                    className="w-24 h-24 rounded-[1.5rem] object-cover bg-slate-100 border-2 border-white shadow-lg"
                                    alt={selectedDoctor.name}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-5 pb-6 flex-1 flex flex-col">
                        {/* Doctor Info */}
                        <div className="text-center mb-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedDoctor.name}</h2>
                                <div className="bg-amber-50 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100 flex-shrink-0">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    <span className="text-[10px] font-black">{selectedDoctor.rating.toFixed(1)}</span>
                                </div>
                            </div>
                            <p className="text-primary-600 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 text-[11px] mb-6">
                                <Stethoscope className="h-4 w-4" /> {selectedDoctor.specialty}
                            </p>
                        </div>

                        {/* Clinic Details Card */}
                        {selectedClinic && (
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-primary-500" /> Clinic Details
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-800 leading-tight">{selectedClinic.name}</p>
                                            <p className="text-[9px] text-slate-600 leading-tight">{selectedClinic.address}, {selectedClinic.city}</p>
                                        </div>
                                    </div>
                                    {selectedClinic.contactPhone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-slate-700">{selectedClinic.contactPhone}</p>
                                        </div>
                                    )}
                                    {selectedClinic.operationMode && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-slate-700 capitalize">{selectedClinic.operationMode.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                <Medal className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                <p className="text-[10px] font-black text-slate-800 leading-none">{selectedDoctor.experience || 5}+ Y</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">EXP</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                <IndianRupeeIcon className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                <p className="text-[10px] font-black text-slate-800 leading-none">₹{selectedDoctor.consultationFee}</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">FEE</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                                <Clock className="h-4 w-4 mx-auto mb-1 text-primary-600" />
                                <p className="text-[10px] font-black text-slate-800 leading-none">{selectedDoctor.consultationTime || 15}m</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">TIME</p>
                            </div>
                        </div>

                        {/* Enhanced Profile Summary */}
                        <div className="flex-1 flex flex-col justify-end space-y-4">
                            {selectedDoctor.bio && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <FileText className="h-3 w-3 text-primary-500" /> About Doctor
                                    </h3>
                                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">{selectedDoctor.bio}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                                {selectedDoctor.education && (
                                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <GraduationCap className="h-3 w-3 text-primary-500" /> Qualifications
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedDoctor.education.slice(0, 3).map((edu, i) => (
                                                <span key={i} className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">{edu}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedDoctor.languages && (
                                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <Languages className="h-3 w-3 text-primary-500" /> Languages
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedDoctor.languages.slice(0, 4).map((lang, i) => (
                                                <span key={lang} className="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100">{lang}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: BOOKING FLOW (8/12) */}
            <div className="lg:col-span-7 xl:col-span-8">
                {!isClinicDirectWalkInOnly ? (
                    <div className="bg-white p-3 md:p-4 rounded-[2rem] shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Patient Profile Selection */}
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Who are you booking for?</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setBookingFor('MYSELF')} className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${bookingFor === 'MYSELF' ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}><User className="h-3.5 w-3.5" /> Myself</button>
                                {userProfile?.familyMembers?.map(m => (
                                    <button key={m.name} onClick={() => setBookingFor(m.name)} className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${bookingFor === m.name ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}><Users className="h-3.5 w-3.5" /> {m.name}</button>
                                ))}
                                <button onClick={() => setShowAddMember(true)} className="px-5 py-2.5 rounded-xl text-xs font-black border border-dashed border-slate-300 text-slate-500 hover:text-primary-600 transition-all flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> Family</button>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Select Visit Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div onClick={() => isClinicOnlineWalkInAllowed && isWalkInAllowed && setVisitType('WALK_IN')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${visitType === 'WALK_IN' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-500/20' : (isClinicOnlineWalkInAllowed && isWalkInAllowed) ? 'border-slate-100 hover:border-slate-200' : 'border-slate-50 opacity-40 grayscale pointer-events-none'}`}>
                                    <div className={`p-2 rounded-xl ${visitType === 'WALK_IN' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Zap className="h-5 w-5 fill-current" /></div>
                                    <div>
                                        <div className="flex items-center gap-2"><span className={`font-black uppercase tracking-widest text-[11px] ${visitType === 'WALK_IN' ? 'text-primary-900' : 'text-slate-700'}`}>Live Token</span>{visitType === 'WALK_IN' && <CheckCircle2 className="h-3.5 w-3.5 text-primary-600" />}</div>
                                        <p className="text-[9px] font-bold text-slate-500 mt-0.5">Join the live queue now.</p>
                                    </div>
                                </div>
                                <div onClick={() => isClinicApptAllowed && setVisitType('APPOINTMENT')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${visitType === 'APPOINTMENT' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500/20' : isClinicApptAllowed ? 'border-slate-100 hover:border-slate-200' : 'border-slate-50 opacity-40 grayscale pointer-events-none'}`}>
                                    <div className={`p-2 rounded-xl ${visitType === 'APPOINTMENT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><CalendarClock className="h-5 w-5" /></div>
                                    <div>
                                        <div className="flex items-center gap-2"><span className={`font-black uppercase tracking-widest text-[11px] ${visitType === 'APPOINTMENT' ? 'text-indigo-900' : 'text-slate-700'}`}>Appointment</span>{visitType === 'APPOINTMENT' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}</div>
                                        <p className="text-[9px] font-bold text-slate-500 mt-0.5">Pick a confirmed slot.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slot Selection View (Date/Time or Shifts) */}
                        <div className="bg-slate-50/50 p-3 rounded-[1.5rem] border border-slate-100">
                            {visitType === 'WALK_IN' ? (
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Availability (Today)</label>

                                    {/* Travel Time & Arrival Analysis - Side by Side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Travel Time Selector */}
                                        <div className={`bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col ${!isWalkInAllowed ? 'opacity-50 grayscale' : ''}`}>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Travel Time</label>
                                            <select
                                                value={travelTime}
                                                disabled={!isWalkInAllowed}
                                                onChange={(e) => {
                                                    setTravelTime(e.target.value);
                                                    setShowTravelTimeWarning(true);
                                                    // Auto-hide warning after 3 seconds
                                                    setTimeout(() => setShowTravelTimeWarning(false), 3000);
                                                }}
                                                className="w-full p-2 text-sm font-bold border border-slate-200 rounded-lg bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            >
                                                <option value="0">0 minutes (At Clinic)</option>
                                                <option value="5">5 minutes</option>
                                                <option value="10">10 minutes</option>
                                                <option value="15">15 minutes</option>
                                                <option value="20">20 minutes</option>
                                                <option value="30">30 minutes</option>
                                                <option value="45">45 minutes</option>
                                                <option value="60">1 hour</option>
                                            </select>
                                            <p className="text-[9px] text-slate-500 mt-1 flex-1">Estimated time to reach the clinic</p>

                                            {/* Travel Time Warning */}
                                            {setShowTravelTimeWarning && isWalkInAllowed && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                                        <p className="text-[9px] font-bold text-amber-800">Travel time updated! Check arrival analysis to ensure you arrive on time.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Live Arrival Comparison */}
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
                                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Arrival Analysis</h4>
                                            {selectedWalkInShiftId ? (() => {
                                                const selectedShift = walkInShiftsToday.find(s => (s.shift.id || s.shift.startTime) === selectedWalkInShiftId);
                                                if (!selectedShift) return (
                                                    <div className="flex-1 flex items-center justify-center">
                                                        <p className="text-[9px] text-slate-400 text-center">Select a shift to see arrival analysis</p>
                                                    </div>
                                                );

                                                const now = getClinicCurrentTime(selectedClinic?.timezone);
                                                const travelMins = parseInt(travelTime);
                                                const arrivalTime = new Date(now.getTime() + travelMins * 60000);
                                                const estimatedTurn = new Date(now.getTime() + selectedShift.stats.totalWaitMins * 60000);
                                                const isLateRisk = (travelMins + 10) > selectedShift.stats.totalWaitMins && travelMins > 0;

                                                return (
                                                    <div className="flex-1 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="text-center">
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Your Arrival</div>
                                                                <div className="text-sm font-black text-slate-900">{arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Est. Turn</div>
                                                                <div className="text-sm font-black text-slate-900">{estimatedTurn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                        {isLateRisk && (
                                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                                    <span className="text-[10px] font-bold text-orange-800">Late Arrival Warning</span>
                                                                </div>
                                                                <p className="text-[9px] text-orange-700 mt-0.5">Your travel time may exceed the estimated wait. You might lose your spot.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })() : (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <p className="text-[9px] text-slate-400 text-center">Select a shift to see arrival analysis</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {walkInShiftsToday.map(({ shift, statusLabel, statusColor, stats, isEnded, isFull, totalWaitMins, load }) => (
                                            <div key={shift.id || shift.startTime} onClick={() => !isEnded && !isFull && setSelectedWalkInShiftId(shift.id || shift.startTime)} className={`p-2 rounded-xl border-2 transition-all ${(!isEnded && !isFull) ? 'cursor-pointer' : 'cursor-not-allowed'} ${selectedWalkInShiftId === (shift.id || shift.startTime) ? 'border-primary-600 bg-white shadow-md' : (isEnded || isFull) ? 'bg-slate-100/50 border-transparent opacity-40 grayscale' : 'bg-white border-slate-200 hover:border-primary-300'}`}>
                                                <div className="flex justify-between items-start mb-1"><div className={`p-1.5 rounded-lg ${selectedWalkInShiftId === (shift.id || shift.startTime) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Clock className="h-3 w-3" /></div><span className={`text-[7px] font-black uppercase tracking-wider ${statusColor}`}>{statusLabel}</span></div>
                                                <h4 className="font-black text-slate-800 text-xs">{shift.label || 'Regular Shift'}</h4>
                                                <p className="text-[8px] text-slate-400 font-bold mb-1">{formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}</p>
                                                {!isEnded && <div className="border-t border-slate-50 pt-1 flex justify-between items-center"><span className="text-[8px] font-bold text-slate-500">{load} Waiting</span><span className={`text-[9px] font-black ${totalWaitMins > 30 ? 'text-orange-600' : 'text-emerald-600'}`}>~{totalWaitMins}m Wait</span></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {bookingDates.map(day => (
                                            <button key={day.dateStr} disabled={day.isOff} onClick={() => { setApptDate(day.dateStr); setApptTime(''); }} className={`flex-shrink-0 w-10 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${apptDate === day.dateStr ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : day.isOff ? 'bg-slate-100/50 text-slate-300 border-transparent' : 'bg-white border-slate-200 hover:border-indigo-400'}`}><span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{day.dayShort}</span><span className="text-sm font-black">{day.dayNum}</span></button>
                                        ))}
                                    </div>
                                    {apptDate && (
                                        <div className="space-y-2">
                                            {(Object.entries(groupedTimeSlots) as [string, any[]][]).map(([period, slots]) => slots.length > 0 && (
                                                <div key={period}>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">{period}</span>
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 flex-wrap">
                                                        {slots.map(slot => (
                                                            <button key={slot.time} disabled={slot.isBlocked || slot.isFull || slot.isBooked} onClick={() => setApptTime(slot.value)} className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${slot.isBlocked || slot.isFull || slot.isBooked ? 'bg-slate-100 text-slate-300 border-transparent grayscale' : apptTime === slot.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-md z-10' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}>{formatTime12h(slot.value)}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Symptoms Input and Confirm */}
                        <div className="space-y-2">
                            <Input label="Short Summary of Symptoms" placeholder="e.g. Fever since 2 days, Back pain" value={symptoms} onChange={e => setSymptoms(e.target.value)} />

                            <div className="flex flex-col gap-1">
                                <Tooltip text={visitType === 'APPOINTMENT' ? "Confirm your appointment booking" : "Join the live queue remotely"} className="w-full">
                                    <button
                                        className={`w-full h-12 text-lg font-black rounded-2xl shadow-xl transition-all text-white disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98] ${visitType === 'APPOINTMENT' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-100'}`}
                                        disabled={(visitType === 'APPOINTMENT' && (!apptDate || !apptTime)) || (visitType === 'WALK_IN' && (!selectedWalkInShiftId || !isWalkInAllowed))}
                                        onClick={handleBookToken}
                                    >
                                        {visitType === 'APPOINTMENT' ? 'Confirm Appointment' : 'Join Live Queue'}
                                    </button>
                                </Tooltip>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3" /> Secure & Instant Confirmation
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-orange-50/50 p-12 rounded-[2rem] border-2 border-dashed border-orange-200 text-center space-y-6">
                        <div className="p-4 bg-white rounded-full inline-block shadow-lg border border-orange-100"><MapPinIcon className="h-8 w-8 text-orange-600" /></div>
                        <div>
                            <h3 className="text-lg font-black text-orange-900 uppercase tracking-widest">Visit Clinic for Token</h3>
                            <p className="text-xs text-orange-700 mt-2 font-bold opacity-80">This clinic currently only supports in-person token collection.</p>
                        </div>
                        <Tooltip text="Get directions to the clinic">
                            <button className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-lg transition-all transform active:scale-95 flex items-center gap-2 mx-auto text-xs uppercase tracking-widest" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedClinic?.geoLocation?.lat},${selectedClinic?.geoLocation?.lng}`)}>
                                <Navigation className="h-4 w-4" /> Get Directions
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
}
