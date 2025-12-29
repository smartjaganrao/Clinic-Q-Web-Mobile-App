
import React from 'react';
import {
    Building2,
    Clock,
    Phone,
    ShieldCheck,
    MapIcon,
    MapPin,
    MapPinIcon,
    Award,
    Languages,
    GraduationCap,
    Star,
    Zap,
    Calendar
} from 'lucide-react';
import { ClinicOperationMode, DoctorStatus } from '../../../../types';
import { getDoctorTodayShifts, hasAvailableSlotsTomorrow, hasShiftsToday } from '../../../../utils/time';
import { Tooltip } from '../../../../components/Tooltip';

export const ClinicDetailView = ({
    selectedClinic,
    setShowMap,
    showMap,
    navigateToView
}) => {
    const isClinicDirectWalkInOnly = selectedClinic?.operationMode === ClinicOperationMode.DIRECT_WALK_IN;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-48 bg-slate-200 relative">
                    {selectedClinic.imageUrl ? (
                        <img src={selectedClinic.imageUrl} className="w-full h-full object-cover" alt={selectedClinic.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <Building2 className="h-16 w-16" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`absolute top-4 right-4 p-2 rounded-xl border-2 transition-all flex items-center gap-2 z-10 ${showMap ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20'}`}
                        title="Locate on Map"
                    >
                        <MapIcon className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-tight hidden sm:inline">{showMap ? 'Info' : 'Map'}</span>
                    </button>
                    
                    <div className="absolute bottom-4 left-6 text-white w-[calc(100%-48px)]">
                        <div>
                            <h1 className="text-3xl font-black shadow-sm">{selectedClinic.name}</h1>
                            <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedClinic.address}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {isClinicDirectWalkInOnly && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0">
                                <MapPinIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-900 text-sm">Direct Walk-In Only</h4>
                                <p className="text-xs text-orange-700 leading-relaxed mt-0.5">Please visit the reception for a token.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-600">
                        {/* Display Operating Hours */}
                        {selectedClinic.operatingHours && (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <Clock className="h-4 w-4 text-primary-500" /> 
                                <span className="font-semibold text-slate-700">{selectedClinic.operatingHours}</span>
                            </div>
                        )}
                        {selectedClinic.contactPhone && (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <Phone className="h-4 w-4 text-slate-400" /> 
                                <span className="font-medium text-slate-700">{selectedClinic.contactPhone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-bold border border-primary-100 uppercase tracking-tight">
                            <ShieldCheck className="h-4 w-4" /> Verified
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-slate-900 mb-2 text-lg">About Clinic</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {selectedClinic.about || "A premier healthcare facility dedicated to providing comprehensive medical care."}
                        </p>
                    </div>

                    {selectedClinic.amenities && (
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Facilities</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedClinic.amenities.map(a => (
                                    <span key={a} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">{a}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-8">
                        <h3 className="font-bold text-slate-900 mb-4 text-xl">Available Doctors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedClinic.doctors.map(doc => {
                                const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
                                const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(selectedClinic.operationMode);
                                const { todayShift, activeShift, futureShift } = getDoctorTodayShifts(doc, selectedClinic);
                                const isAvailable = doc.status === DoctorStatus.AVAILABLE;
                                const hasSlotsTomorrow = hasAvailableSlotsTomorrow(doc, selectedClinic);
                                const hasDoctorShiftsToday = !!todayShift && todayShift !== 'Off Today';
                                const canGetLiveToken = canQueueOnline && hasDoctorShiftsToday && activeShift;
                                const canBookAdvanceToken = selectedClinic.enableAdvanceBooking && canQueueOnline && hasDoctorShiftsToday && !activeShift && futureShift;
                                const canGetToken = canGetLiveToken || canBookAdvanceToken;
                                const canBookForTomorrow = canBookAppointments && hasSlotsTomorrow;

                                const getTokenButtonText = () => {
                                    if (canGetLiveToken) return 'Get Live Token';
                                    if (canBookAdvanceToken) return 'Book Advance Token';
                                    return 'No Live Queue';
                                };

                                return (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-xl border border-slate-200 flex flex-col hover:border-primary-300 hover:shadow-md transition-all cursor-pointer bg-white group"
                                        onClick={() => navigateToView(null, selectedClinic, doc)}
                                    >
                                        {/* Top Section: Avatar & Details */}
                                        <div className="flex gap-4">
                                            {/* Left: Avatar & Status */}
                                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                <div className="relative">
                                                    <img src={doc.avatarUrl} className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shadow-sm" />
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${isAvailable ? 'bg-green-500' : doc.status === DoctorStatus.ON_BREAK ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500 bg-amber-50/50 px-1.5 py-0.5 rounded-lg border border-amber-100/50">
                                                    <Star className="h-2.5 w-2.5 fill-current" />
                                                    <span className="text-[10px] font-black">{doc.rating.toFixed(1)}</span>
                                                </div>
                                            </div>

                                            {/* Right: Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors truncate">{doc.name}</h4>
                                                        <p className="text-[10px] text-primary-600 font-black uppercase tracking-wider mb-2">{doc.specialty}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <span className="text-base font-black text-slate-900">₹{doc.consultationFee}</span>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">FEE</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 mt-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        <span className="text-[10px]">Today: <span className="font-bold text-slate-900">{todayShift}</span></span>
                                                    </div>
                                                    {doc.experience && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                            <Award className="h-3 w-3 text-slate-400" />
                                                            <span className="text-[10px]">{doc.experience}+ years experience</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle Section: Languages & Education */}
                                        <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-x-4 gap-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <Languages className="h-3 w-3 text-slate-400" />
                                                <div className="flex flex-wrap gap-1">
                                                    {doc.languages?.slice(0, 3).map(lang => (
                                                        <span key={lang} className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{lang}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {doc.education && doc.education.length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{doc.education[0]}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Section: Action Buttons */}
                                        <div className="flex gap-2 mt-4">
                                            {canBookAppointments && (
                                                <Tooltip text="Schedule a confirmed appointment for later" className="flex-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigateToView(null, selectedClinic, doc, 'APPOINTMENT'); }}
                                                        className="w-full flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all active:scale-95 shadow-sm bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Book Appointment</span>
                                                        </div>
                                                    </button>
                                                </Tooltip>
                                            )}
                                            <Tooltip text={canGetToken ? (canGetLiveToken ? "Join the live walk-in queue remotely" : "Book a token for a later shift today") : "Live queue not available"} className="flex-1">
                                                <button
                                                    disabled={!canGetToken}
                                                    onClick={(e) => { e.stopPropagation(); navigateToView(null, selectedClinic, doc, 'WALK_IN'); }}
                                                    className={`w-full flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all active:scale-95 shadow-sm ${
                                                        canGetToken
                                                            ? canGetLiveToken
                                                                ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-teal-100'
                                                                : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700 shadow-sky-100'
                                                            : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Zap className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{getTokenButtonText()}</span>
                                                    </div>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};
