
import React from 'react';
import { Button } from '../../../components/Button';
import { PatientStatus, DoctorStatus } from '../../../types';
import {
    Calendar, MapPin, User, Coffee, AlertTriangle, Timer, QrCode,
    Clock, ChevronRight, Zap, CheckCircle2, Navigation, XCircle, ClipboardList,
} from 'lucide-react';
import { formatTime12h, getClinicCurrentTime, getLocalToday } from '../../../utils/time';
import { calculateDistance } from '../../../utils/geolocation';
import { Tooltip } from '../../../components/Tooltip';

const QueueDots = ({ total, ahead }: { total: number; ahead: number }) => {
    const MAX_DOTS = 8;
    const display = Math.min(total, MAX_DOTS);
    const position = display - Math.min(ahead, display); // filled = passed
    return (
        <div className="flex items-center gap-1 justify-center flex-wrap my-1">
            {Array.from({ length: display }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 ${
                        i < position
                            ? 'w-4 bg-primary-400'
                            : i === position
                            ? 'w-4 bg-white ring-2 ring-primary-400 animate-pulse'
                            : 'w-2 bg-white/20'
                    }`}
                />
            ))}
            {total > MAX_DOTS && (
                <span className="text-[10px] text-white/50 font-bold ml-1">+{total - MAX_DOTS}</span>
            )}
        </div>
    );
};

export const ActiveVisitsView = ({
    activeVisits,
    getSmartQueueDetails,
    setCancelModal,
    setShowQRScanner,
    handleTabSwitch,
    userLocation,
    clinics,
}: {
    activeVisits: any[];
    getSmartQueueDetails: (visit: any) => any;
    setCancelModal: (modal: any) => void;
    setShowQRScanner: (show: boolean) => void;
    handleTabSwitch: (tab: string) => void;
    userLocation: { lat: number; lng: number } | null;
    clinics: any[];
}) => {
    return (
        <div className="w-full h-full px-4 md:px-6 py-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">

            {activeVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeVisits.map(visit => {
                        const clinic = clinics.find(c => c.id === visit.clinicId);
                        if (!clinic || !clinic.doctors) return null;

                        const queueStats = getSmartQueueDetails(visit);
                        const doctor = clinic.doctors.find((d: any) => d.id === visit.doctorId);
                        if (!doctor || !doctor.weeklySchedule) return null;

                        const isAppointment = visit.visitType === 'APPOINTMENT';

                        const scheduledDate =
                            isAppointment && visit.appointmentDate
                                ? new Date(visit.appointmentDate).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                  })
                                : new Date(visit.timeAdded).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                  });

                        const scheduledTime =
                            isAppointment && visit.appointmentTime
                                ? formatTime12h(visit.appointmentTime)
                                : new Date(visit.timeAdded).toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                  });

                        const bookedDate = new Date(visit.timeAdded).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                        });
                        const bookedTime = new Date(visit.timeAdded).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        });

                        const today = getLocalToday(clinic.timezone);
                        const isApptForToday = isAppointment && visit.appointmentDate === today;
                        const shouldShowTravel = !isAppointment || isApptForToday;

                        const now = getClinicCurrentTime(clinic.timezone);
                        const currentMins = now.getHours() * 60 + now.getMinutes();
                        const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                        const schedule = doctor.weeklySchedule.find((s: any) => s.day === dayName);

                        const visitTime =
                            isAppointment
                                ? visit.appointmentTime
                                : new Date(visit.timeAdded).toTimeString().slice(0, 5);

                        const visitShift = schedule?.slots.find((slot: any) => {
                            const [sh, sm] = slot.startTime.split(':').map(Number);
                            const [eh, em] = slot.endTime.split(':').map(Number);
                            const startTotal = sh * 60 + sm;
                            let endTotal = eh * 60 + em;
                            if (endTotal <= startTotal) endTotal += 1440;
                            const [vh, vm] = visitTime.split(':').map(Number);
                            const vTotal = vh * 60 + vm;
                            return vTotal >= startTotal && vTotal < endTotal;
                        });

                        const isShiftStarted = visitShift
                            ? currentMins >=
                              visitShift.startTime.split(':').map(Number)[0] * 60 +
                                  visitShift.startTime.split(':').map(Number)[1]
                            : false;

                        const distance =
                            userLocation && clinic?.geoLocation
                                ? calculateDistance(
                                      userLocation.lat,
                                      userLocation.lng,
                                      clinic.geoLocation.lat,
                                      clinic.geoLocation.lng
                                  )
                                : null;

                        // Queue urgency
                        const peopleAhead = queueStats.peopleAhead ?? 0;
                        const isUrgent = peopleAhead <= 2 && visit.status === PatientStatus.WAITING;
                        const isWithDoctor = visit.status === PatientStatus.WITH_DOCTOR;
                        const totalInQueue = peopleAhead + 1;

                        // Card accent
                        const accentGradient = isWithDoctor
                            ? 'from-primary-700 to-primary-900'
                            : isUrgent
                            ? 'from-rose-700 to-rose-900'
                            : 'from-slate-700 to-slate-900';

                        return (
                            <div
                                key={visit.id}
                                className="bg-white rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col ring-1 ring-slate-100"
                            >
                                {/* ── Card Header: Visit meta ────────── */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight truncate leading-tight">
                                                {visit.clinicName}
                                            </h3>
                                            <p className="text-[12px] text-primary-600 font-bold mt-0.5">
                                                Dr. {visit.doctorName}
                                                <span className="text-slate-300 mx-1.5">·</span>
                                                <span className="text-slate-500 font-semibold">{doctor.specialty}</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                            <span
                                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide ${
                                                    isAppointment
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        : 'bg-teal-50 text-teal-700 border-teal-100'
                                                }`}
                                            >
                                                {isAppointment ? '📅 Appointment' : '⚡ Walk-in'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Scheduled info bar */}
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className={`h-3.5 w-3.5 ${isAppointment ? 'text-indigo-500' : 'text-teal-500'}`} />
                                            {scheduledDate} · {scheduledTime}
                                        </div>
                                        <div className="h-3 w-px bg-slate-200" />
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-rose-400" />
                                            Room {visit.room}
                                        </div>
                                        <div className="h-3 w-px bg-slate-200" />
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 text-slate-400" />
                                            {visit.name.split(' ')[0]}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Live Queue Dashboard ───────────── */}
                                <div className="mx-4 mb-3 rounded-[1.5rem] overflow-hidden">
                                    <div
                                        className={`bg-gradient-to-br ${accentGradient} p-5 relative overflow-hidden`}
                                    >
                                        {/* Decorative */}
                                        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 blur-xl" />
                                        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 blur-xl" />

                                        {/* Token numbers row */}
                                        <div className="relative z-10 grid grid-cols-3 gap-2 items-center mb-3">
                                            {/* Your token */}
                                            <div className="text-center">
                                                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">
                                                    Your Token
                                                </p>
                                                <div className="text-4xl font-black text-white tracking-tighter leading-none">
                                                    #{visit.tokenNumber}
                                                </div>
                                            </div>

                                            {/* Serving now */}
                                            <div className="text-center border-x border-white/10 px-2">
                                                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">
                                                    Serving
                                                </p>
                                                <div
                                                    className={`text-4xl font-black tracking-tighter leading-none ${
                                                        isWithDoctor ? 'text-primary-300 animate-pulse' : 'text-white'
                                                    }`}
                                                >
                                                    {isWithDoctor ? `#${visit.tokenNumber}` : queueStats.currentToken}
                                                </div>
                                            </div>

                                            {/* Ahead */}
                                            <div className="text-center">
                                                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">
                                                    Ahead
                                                </p>
                                                <div
                                                    className={`text-4xl font-black tracking-tighter leading-none ${
                                                        isUrgent ? 'text-rose-300 animate-bounce' : 'text-white'
                                                    }`}
                                                >
                                                    {peopleAhead}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Queue dots progress */}
                                        <div className="relative z-10">
                                            <QueueDots total={totalInQueue} ahead={peopleAhead} />
                                        </div>

                                        {/* Est time */}
                                        <div className="relative z-10 flex items-center justify-center gap-2 mt-2">
                                            <Timer className="h-3.5 w-3.5 text-white/60" />
                                            <span className="text-[11px] font-bold text-white/80">
                                                Est. wait:{' '}
                                                <span className="font-black text-white">{queueStats.expectedTime}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Travel CTA (when shift started) ── */}
                                {isShiftStarted && !visit.isCheckedIn && shouldShowTravel && (
                                    <div className="mx-4 mb-3 flex items-center justify-between gap-3 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="flex items-center gap-2 text-blue-700 text-[11px] font-bold">
                                            <Navigation className="h-4 w-4" />
                                            {distance ? `${distance.toFixed(1)} km away` : 'Getting distance...'}
                                        </div>
                                        <button
                                            onClick={() =>
                                                window.open(
                                                    `https://www.google.com/maps/dir/?api=1&destination=${clinic?.geoLocation?.lat},${clinic?.geoLocation?.lng}`,
                                                    '_blank'
                                                )
                                            }
                                            disabled={!clinic?.geoLocation}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Zap className="h-3 w-3" /> Navigate
                                        </button>
                                    </div>
                                )}

                                {/* ── Status Message ─────────────────── */}
                                <div className="px-4 pb-3">
                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                            queueStats.color?.includes('text-red')
                                                ? 'bg-red-50 border-red-100'
                                                : queueStats.color?.includes('text-green')
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : queueStats.color?.includes('text-blue')
                                                ? 'bg-blue-50 border-blue-100'
                                                : 'bg-slate-50 border-slate-100'
                                        }`}
                                    >
                                        <div
                                            className={`p-2 rounded-xl shrink-0 ${
                                                queueStats.color?.includes('text-red')
                                                    ? 'bg-red-500'
                                                    : queueStats.color?.includes('text-green')
                                                    ? 'bg-emerald-500'
                                                    : queueStats.color?.includes('text-blue')
                                                    ? 'bg-blue-500'
                                                    : 'bg-slate-500'
                                            } text-white shadow-lg`}
                                        >
                                            {queueStats.doctorStatus === DoctorStatus.ON_BREAK ? (
                                                <Coffee className="h-4 w-4 animate-pulse" />
                                            ) : isUrgent && !visit.isCheckedIn ? (
                                                <AlertTriangle className="h-4 w-4" />
                                            ) : isWithDoctor ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <Timer className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black leading-tight ${queueStats.color}`}>
                                                {queueStats.message}
                                            </p>
                                            {visit.isCheckedIn && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide border border-emerald-200">
                                                    <CheckCircle2 className="h-2.5 w-2.5" /> Arrived
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Actions ────────────────────────── */}
                                <div className="px-4 pb-4 flex gap-2">
                                    {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (
                                        <Tooltip text="Scan QR code at the clinic to confirm arrival" className="flex-[2]">
                                            <button
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black uppercase tracking-wider text-[11px] shadow-xl shadow-slate-200/60 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                onClick={() => setShowQRScanner(true)}
                                            >
                                                <QrCode className="h-5 w-5" />
                                                QR Check-In
                                            </button>
                                        </Tooltip>
                                    )}

                                    <Tooltip
                                        text={
                                            visit.status === PatientStatus.WITH_DOCTOR
                                                ? 'Cannot cancel while with doctor'
                                                : 'Cancel this visit'
                                        }
                                        className="flex-1"
                                    >
                                        <button
                                            className={`w-full h-12 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all border active:scale-95 flex items-center justify-center gap-1.5 ${
                                                visit.status === PatientStatus.WITH_DOCTOR
                                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                    : 'text-rose-500 border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300'
                                            }`}
                                            onClick={() => setCancelModal({ isOpen: true, visit })}
                                            disabled={visit.status === PatientStatus.WITH_DOCTOR}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </Tooltip>
                                </div>

                                {/* ── Footer timestamp ───────────────── */}
                                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-300 font-bold uppercase tracking-widest pb-3">
                                    <Clock className="h-2.5 w-2.5" />
                                    Booked {bookedDate} at {bookedTime}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Empty State ──────────────────────────────────── */
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in zoom-in-95 duration-500">
                    <div className="w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-slate-200">
                        <ClipboardList className="h-12 w-12 text-slate-300" />
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                        No Active Visits
                    </h3>

                    <p className="text-slate-500 mb-10 max-w-xs font-medium leading-relaxed text-base">
                        Join a live queue or book an appointment — your real-time status will appear here.
                    </p>

                    <Button
                        onClick={() => handleTabSwitch('BOOK')}
                        size="lg"
                        className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary-200 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Find a Doctor
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
};
