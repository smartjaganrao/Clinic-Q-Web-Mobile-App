import React from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { PatientStatus, DoctorStatus } from '../../../types';
import { Calendar, MapPin, User, Coffee, AlertTriangle, Timer, QrCode, ThumbsUp, Clock, ChevronRight, Zap, CheckCircle2, Navigation } from 'lucide-react';
import { formatTime12h, getClinicCurrentTime, getLocalToday } from '../../../utils/time';
import { calculateDistance } from '../../../utils/geolocation';
import { Tooltip } from '../../../components/Tooltip';

export const ActiveVisitsView = ({
    activeVisits,
    getSmartQueueDetails,
    setCancelModal,
    setShowQRScanner,
    handleTabSwitch,
    userLocation,
    clinics
}: {
    activeVisits: any[],
    getSmartQueueDetails: (visit: any) => any,
    setCancelModal: (modal: any) => void,
    setShowQRScanner: (show: boolean) => void,
    handleTabSwitch: (tab: string) => void,
    userLocation: { lat: number, lng: number } | null,
    clinics: any[]
}) => {
    return (
        <div className="w-full h-full px-4 md:px-8 py-6 max-w-[1920px] mx-auto animate-in fade-in duration-500">

            {/* Active Visits Grid */}
            {activeVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">

                    {activeVisits.map(visit => {
                        const clinic = clinics.find(c => c.id === visit.clinicId);
                        if (!clinic || !clinic.doctors) return null;

                        const queueStats = getSmartQueueDetails(visit);
                        const doctor = clinic.doctors.find(d => d.id === visit.doctorId);
                        if (!doctor || !doctor.weeklySchedule) return null;
                        
                        // 1. Scheduled Time (When the visit happens)
                        // Use appointmentDate/Time if available, regardless of visitType, as long as it's a scheduled visit
                        const hasScheduledDetails = visit.appointmentDate && visit.appointmentTime;

                        const scheduledDate = hasScheduledDetails ?
                            new Date(visit.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) :
                            new Date(visit.timeAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                        const scheduledTime = hasScheduledDetails ?
                            formatTime12h(visit.appointmentTime) :
                            new Date(visit.timeAdded).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

                        // 2. Booking Timestamp (When the action was taken)
                        const bookedTime = new Date(visit.timeAdded).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                        const bookedDate = new Date(visit.timeAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                        const isAppointment = visit.visitType === 'APPOINTMENT';

                        // Logic to show travel button only for today's visits
                        const today = getLocalToday(clinic.timezone);
                        const isAppointmentForToday = isAppointment && visit.appointmentDate === today;
                        const shouldShowTravelButton = !isAppointment || isAppointmentForToday;

                        // Shift start logic
                        const now = getClinicCurrentTime(clinic.timezone);
                        const currentMins = now.getHours() * 60 + now.getMinutes();
                        const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                        const schedule = doctor.weeklySchedule.find(s => s.day === dayName);
                        
                        const visitTime = visit.visitType === 'APPOINTMENT' ? visit.appointmentTime : new Date(visit.timeAdded).toTimeString().slice(0,5);

                        const visitShift = schedule?.slots.find(slot => {
                            const [sh, sm] = slot.startTime.split(':').map(Number);
                            const [eh, em] = slot.endTime.split(':').map(Number);
                            const startTotal = sh * 60 + sm;
                            let endTotal = eh * 60 + em;
                            if (endTotal <= startTotal) endTotal += 1440;

                            const [vh, vm] = visitTime.split(':').map(Number);
                            const visitTotalMins = vh * 60 + vm;

                            return visitTotalMins >= startTotal && visitTotalMins < endTotal;
                        });

                        const isShiftStarted = visitShift ? currentMins >= (visitShift.startTime.split(':').map(Number)[0] * 60 + visitShift.startTime.split(':').map(Number)[1]) : false;
                        
                        const distance = userLocation && clinic?.geoLocation && calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);

                        return (
                            <Card
                                key={visit.id}
                                className="p-0 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col group bg-white ring-1 ring-slate-100"
                            >
                                {/* Header Section */}
                                <div className="p-4 pb-2">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tight truncate leading-tight mb-1">
                                                {visit.clinicName}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-[11px] text-primary-600 font-black uppercase tracking-widest">
                                                    Dr. {visit.doctorName}
                                                </p>
                                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                                                    <User className="h-3 w-3" /> {visit.name.split(' ')[0]}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                                            <span
                                                className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${isAppointment
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        : 'bg-primary-50 text-primary-700 border-primary-100'
                                                    }`}
                                            >
                                                {isAppointment ? 'Appointment' : 'Walk-in'}
                                            </span>
                                            <Badge patientStatus={visit.status} />
                                        </div>
                                    </div>

                                    {/* Meta Context Bar (Scheduled Time) */}
                                    <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                                            <div className="flex items-center gap-1.5 uppercase tracking-tight">
                                                <Calendar className={`h-3.5 w-3.5 ${isAppointment ? 'text-indigo-500' : 'text-primary-500'}`} /> 
                                                <span>{scheduledDate}, {scheduledTime}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 uppercase tracking-tight">
                                                <MapPin className="h-3.5 w-3.5 text-rose-500" /> 
                                                <span>Room {visit.room}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Token Dashboard Panel - Fixed for Alignment and Responsiveness */}
                                <div className="px-4 pb-2">
                                    <div className="bg-[#1a2332] rounded-[1.5rem] p-4 grid grid-cols-3 items-center relative overflow-hidden group-hover:bg-[#111827] transition-colors duration-500 shadow-lg">
                                        {/* Background Decoration */}
                                        <Timer className="absolute -bottom-2 -right-2 h-16 w-16 text-white/5 rotate-12" />
                                        
                                        <div className="relative z-10 text-center border-r border-white/10 pr-2">
                                            <p className="text-[8px] font-black text-primary-400 uppercase tracking-widest mb-0.5">Your Token</p>
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                #{visit.tokenNumber}
                                            </div>
                                        </div>

                                        <div className="relative z-10 text-center px-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Serving</p>
                                            <div className={`text-3xl font-black truncate ${visit.status === PatientStatus.WITH_DOCTOR ? 'text-primary-400 animate-pulse' : 'text-white'}`}>
                                                {visit.status === PatientStatus.WITH_DOCTOR ? `#${visit.tokenNumber}` : queueStats.currentToken}
                                            </div>
                                        </div>

                                        <div className="relative z-10 text-center border-l border-white/10 pl-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ahead</p>
                                            <div className="text-3xl font-black text-white tracking-tighter">
                                                {queueStats.peopleAhead}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {isShiftStarted && !visit.isCheckedIn && shouldShowTravelButton && (
                                <div className="px-4 pt-3 flex justify-between items-center bg-slate-50 border-t border-slate-200">
                                    <Badge
                                        className="bg-blue-100 text-blue-700 border-blue-200"
                                    >
                                        <Navigation className="h-3 w-3 mr-1" />
                                        {distance ? `${distance.toFixed(1)} km away` : 'Calculating...'}
                                    </Badge>
                                    <Tooltip text="Get directions to the clinic">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${clinic?.geoLocation?.lat},${clinic?.geoLocation?.lng}`, '_blank')}
                                            disabled={!clinic?.geoLocation}
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Start Travelling
                                        </Button>
                                    </Tooltip>
                                </div>
                                )}


                                {/* Settled Status Message Block */}
                                <div className="p-4 pt-3 flex flex-col gap-3">
                                    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                        queueStats.color.includes('text-red') ? 'bg-red-50 border-red-100 shadow-sm' :
                                        queueStats.color.includes('text-green') ? 'bg-green-50 border-green-100 shadow-sm' :
                                        queueStats.color.includes('text-blue') ? 'bg-blue-50 border-blue-100 shadow-sm' :
                                        'bg-slate-50 border-slate-100'
                                    }`}>
                                        <div className={`p-2 rounded-xl ${queueStats.color.replace('text-', 'bg-')} text-white shadow-lg shrink-0`}>
                                            {queueStats.doctorStatus === DoctorStatus.ON_BREAK ? (
                                                <Coffee className="h-5 w-5 animate-pulse" />
                                            ) : queueStats.peopleAhead < 3 && !visit.isCheckedIn ? (
                                                <AlertTriangle className="h-5 w-5 animate-bounce-slow" />
                                            ) : (
                                                <Timer className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black leading-tight mb-1 ${queueStats.color}`}>{queueStats.message}</p>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {queueStats.scheduledTime ? (
                                                    <>
                                                        <span className="text-[10px] opacity-70 font-black uppercase tracking-widest flex items-center gap-1.5 text-slate-600">
                                                            <Clock className="h-3 w-3" /> {queueStats.scheduledTime}
                                                        </span>
                                                        {queueStats.estimatedArrivalTime && queueStats.estimatedArrivalTime !== queueStats.expectedTime && (
                                                            <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider flex items-center gap-1 text-amber-600">
                                                                EST: {queueStats.estimatedArrivalTime}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] opacity-70 font-black uppercase tracking-widest flex items-center gap-1.5 text-slate-600">
                                                        <Clock className="h-3 w-3" /> EST: {queueStats.expectedTime}
                                                    </span>
                                                )}
                                                {visit.isCheckedIn && (
                                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-200 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Arrived
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-1">
                                        {!visit.isCheckedIn && visit.status === PatientStatus.WAITING && (
                                            <Tooltip text="Scan QR code at the clinic to confirm arrival" className="flex-[2]">
                                                <button
                                                    className="w-full bg-[#1a2332] hover:bg-[#111827] text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    onClick={() => setShowQRScanner(true)}
                                                >
                                                    <QrCode className="h-5 w-5" />
                                                    Check-In
                                                </button>
                                            </Tooltip>
                                        )}

                                        <Tooltip text="Cancel this visit" className="flex-1">
                                            <button
                                                className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border active:scale-95 ${
                                                    visit.status === PatientStatus.WITH_DOCTOR 
                                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                                                    : 'text-rose-500 border-rose-200 bg-white hover:bg-rose-50'
                                                }`}
                                                onClick={() => setCancelModal({ isOpen: true, visit })}
                                                disabled={visit.status === PatientStatus.WITH_DOCTOR}
                                            >
                                                Cancel
                                            </button>
                                        </Tooltip>
                                    </div>
                                    
                                    {/* Transaction Record - Ultra Subtle */}
                                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-300 font-bold uppercase tracking-widest pt-1 opacity-50">
                                        <Clock className="h-2.5 w-2.5" /> Booked {bookedDate} at {bookedTime}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-slate-200">
                        <Calendar className="h-10 w-10 text-slate-300" />
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                        No Active Visits
                    </h3>

                    <p className="text-slate-500 mb-10 max-w-sm font-medium leading-relaxed">
                        Join a live queue or schedule an appointment to track your real-time status here.
                    </p>

                    <Button 
                        onClick={() => handleTabSwitch('BOOK')} 
                        size="lg" 
                        className="h-16 px-12 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-200 active:scale-95 transition-all flex items-center gap-4"
                    >
                        Find a Doctor <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    )
}
