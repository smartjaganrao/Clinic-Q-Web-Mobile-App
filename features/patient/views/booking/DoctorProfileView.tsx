
import React from 'react';
import {
    Star,
    Stethoscope,
    Award,
    Languages,
    GraduationCap,
    FileText,
    Clock,
    MapPin,
    Navigation,
} from 'lucide-react';
import { IndianRupeeIcon } from '../../../../components/icons';
import { ClinicOperationMode, DoctorStatus } from '../../../../types';
import { isClinicOpen, isDoctorShiftActive, hasAvailableSlotsTomorrow, getDoctorTodayShift } from '../../../../utils/time';

export const DoctorProfileView = ({ selectedProfileDoctor, clinics, navigateToView }) => {
    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 py-4">
            {/* Left: Doctor Details */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-fit p-8 relative">
                <div className="h-48 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl relative mb-8">
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0">
                        <div className="p-2 bg-white rounded-2xl shadow-2xl ring-4 ring-primary-100">
                            <img
                                src={selectedProfileDoctor.avatarUrl}
                                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover bg-slate-100 border-2 border-white shadow-lg"
                                alt={selectedProfileDoctor.name}
                            />
                        </div>
                    </div>
                </div>
                <div className="pt-16 px-2 pb-2 flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedProfileDoctor.name}</h2>
                        <div className="bg-amber-50 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100 flex-shrink-0">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xs font-black">{selectedProfileDoctor.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <p className="text-primary-600 font-bold uppercase tracking-widest flex items-center gap-2 text-[15px] mb-5">
                        <Stethoscope className="h-5 w-5" /> {selectedProfileDoctor.specialty}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.experience || 5}+ Years
                        </span>
                        {selectedProfileDoctor.languages && selectedProfileDoctor.languages.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                <Languages className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.languages.join(', ')}
                            </span>
                        )}
                        {selectedProfileDoctor.education && selectedProfileDoctor.education.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> {selectedProfileDoctor.education[0]}
                            </span>
                        )}
                    </div>
                    {selectedProfileDoctor.bio && (
                        <>
                            <div className="w-full border-t border-slate-100 my-4"></div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-primary-500" /> About Doctor
                            </h3>
                            <p className="text-slate-600 text-base leading-relaxed text-center md:text-left">{selectedProfileDoctor.bio}</p>
                        </>
                    )}
                </div>
            </div>
            {/* Right: Clinics List with Booking */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-fit p-6">
                <div className="pb-4 border-b border-slate-100 mb-4">
                    <h3 className="text-2xl font-bold text-slate-900">Available at Clinics</h3>
                    <p className="text-base text-slate-600 mt-1">Book an appointment at any of these locations</p>
                </div>
                <div className="flex flex-col gap-4">
                    {clinics.filter(clinic => clinic.doctors.some(d => d.masterId === selectedProfileDoctor.masterId)).map(clinic => {
                        const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId)!;
                        const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                        const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                        const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
                        const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
                        const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
                        const canGetToken = canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow;
                        const canBookForTomorrow = canBookAppointments && hasSlotsTomorrow;
                        const todayShift = getDoctorTodayShift(docInstance);
                        return (
                            <div key={clinic.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 flex flex-col gap-3 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 text-lg truncate mb-1">{clinic.name}</h4>
                                        <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            {clinic.address}, {clinic.city}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                                                <Clock className="h-4 w-4 text-primary-500" />
                                                Today: <span className="font-black">{todayShift}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-xs font-bold text-blue-700">
                                                <IndianRupeeIcon className="h-4 w-4 text-blue-400" />
                                                Fee: <span className="font-black">₹{docInstance.consultationFee}</span>
                                            </span>
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${isDoctorShiftActiveNow ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {isDoctorShiftActiveNow ? 'Shift Active' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!(canGetToken || canBookForTomorrow)}
                                        onClick={() => navigateToView(null, clinic, docInstance)}
                                        className={`h-12 px-10 rounded-2xl font-extrabold shadow-lg transition-all text-xs uppercase tracking-widest whitespace-nowrap active:scale-95 ${(canGetToken || canBookForTomorrow)
                                                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700 shadow-primary-200'
                                                : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-200'
                                            }`}
                                    >
                                        {canGetToken ? 'Get Token' : canBookForTomorrow ? 'Book Tomorrow' : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
};
