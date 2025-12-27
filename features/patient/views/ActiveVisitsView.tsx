
import React from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { PatientStatus, DoctorStatus } from '../../../types';
import { Calendar, MapPin, User, Coffee, AlertTriangle, Timer, QrCode, ThumbsUp } from 'lucide-react';
import { formatTime12h } from '../../../utils/time';

export const ActiveVisitsView = ({
    activeVisits,
    getSmartQueueDetails,
    setCancelModal,
    setShowQRScanner,
    unratedCompletedVisit,
    setFeedbackModal,
    handleTabSwitch
}: {
    activeVisits: any[],
    getSmartQueueDetails: (visit: any) => any,
    setCancelModal: (modal: any) => void,
    setShowQRScanner: (show: boolean) => void,
    unratedCompletedVisit: any,
    setFeedbackModal: (modal: any) => void,
    handleTabSwitch: (tab: string) => void
}) => {
    return (
        <div className="w-full h-full px-4 md:px-8 py-0 max-w-[1920px] mx-auto">

            {/* Rating Prompt */}
            {unratedCompletedVisit && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                            <ThumbsUp className="h-7 w-7 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">
                                How was your visit with Dr. {unratedCompletedVisit.doctorName}?
                            </h3>
                            <p className="text-sm text-slate-600">
                                Your feedback helps others find the best care.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() =>
                            setFeedbackModal({
                                isOpen: true,
                                visit: unratedCompletedVisit,
                                rating: 0,
                                text: ''
                            })
                        }
                        className="bg-slate-900 text-white shadow-xl hover:bg-slate-800 px-8 py-3 rounded-2xl font-bold"
                    >
                        Rate Visit Now
                    </Button>
                </div>
            )}

            {/* Active Visits */}
            {activeVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">

                    {activeVisits.map(visit => {
                        const queueStats = getSmartQueueDetails(visit);

                        return (
                            <Card
                                key={visit.id}
                                className="p-0 border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                            >

                                <div className="p-5 pb-2">

                                    <div className="flex justify-between items-start mb-2">

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-lg text-slate-900 leading-tight truncate max-w-[180px]">
                                                    {visit.clinicName}
                                                </h3>
                                            </div>

                                            <p className="text-sm text-slate-500 font-bold">
                                                Dr. {visit.doctorName}
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {visit.name}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span
                                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${visit.visitType === 'APPOINTMENT'
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        : 'bg-primary-50 text-primary-700 border-primary-200'
                                                    }`}
                                            >
                                                {queueStats.typeLabel}
                                            </span>

                                            <Badge status={visit.status} />
                                        </div>

                                    </div>

                                    {/* Meta */}
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                        <span className="flex items-center gap-1 uppercase tracking-tighter">
                                            <Calendar className="h-3 w-3" /> Booked: {queueStats.bookedAt}
                                        </span>

                                        <span className="text-slate-300">|</span>

                                        <span className="flex items-center gap-1 uppercase tracking-tighter">
                                            <MapPin className="h-3 w-3" /> Room {visit.room}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="bg-white border-y border-slate-100 p-4 grid grid-cols-3 gap-2 text-center">

                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Your Token
                                        </div>
                                        <div className="text-4xl font-black text-slate-900">
                                            #{visit.tokenNumber}
                                        </div>
                                    </div>

                                    <div className="border-x border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Now Serving
                                        </div>

                                        <div
                                            className={`text-4xl font-black ${visit.status === PatientStatus.WITH_DOCTOR
                                                    ? 'text-blue-600 animate-pulse'
                                                    : 'text-slate-300'
                                                }`}
                                        >
                                            {visit.status === PatientStatus.WITH_DOCTOR
                                                ? `#${visit.tokenNumber}`
                                                : queueStats.currentToken}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            People Ahead
                                        </div>
                                        <div className="text-4xl font-black text-slate-900">
                                            {queueStats.peopleAhead}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className={`px-4 py-3 flex items-center gap-3 ${queueStats.bgColor} ${queueStats.color} text-sm font-bold border-b border-slate-100 transition-colors`}>

                                    {queueStats.doctorStatus === DoctorStatus.ON_BREAK ? (
                                        <Coffee className="h-5 w-5 animate-bounce" />
                                    ) : queueStats.peopleAhead < 3 && !visit.isCheckedIn ? (
                                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                                    ) : (
                                        <Timer className="h-5 w-5" />
                                    )}

                                    <div className="flex-1">
                                        <p className="leading-tight">{queueStats.message}</p>

                                        {visit.status === PatientStatus.WAITING && (
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] opacity-70 font-black uppercase tracking-wide">
                                                    EST. TIME: {queueStats.expectedTime}
                                                </span>

                                                {visit.visitType === 'APPOINTMENT' &&
                                                    visit.appointmentTime && (
                                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/50 px-1 rounded">
                                                            Slot: {formatTime12h(visit.appointmentTime)}
                                                        </span>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 flex gap-2 mt-auto bg-white">
                                    {!visit.isCheckedIn &&
                                        visit.status === PatientStatus.WAITING && (
                                            <Button
                                                className="flex-1 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-100"
                                                onClick={() => setShowQRScanner(true)}
                                            >
                                                <QrCode className="h-4 w-4 mr-2" />
                                                Check-In
                                            </Button>
                                        )}

                                    <Button
                                        variant="secondary"
                                        className={`flex-1 font-bold ${visit.isCheckedIn ? 'w-full' : ''
                                            } text-red-600 border-red-100 hover:bg-red-50`}
                                        onClick={() => setCancelModal({ isOpen: true, visit })}
                                        disabled={visit.status === PatientStatus.WITH_DOCTOR}
                                    >
                                        Cancel
                                    </Button>
                                </div>

                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] opacity-60">
                    <div className="bg-slate-200 p-6 rounded-full mb-4">
                        <Calendar className="h-12 w-12 text-slate-400" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-700">
                        No active visits
                    </h3>

                    <p className="text-slate-500 mb-6 text-center">
                        Book an appointment or scan a QR code at a clinic to see your live status here.
                    </p>

                    <Button onClick={() => handleTabSwitch('BOOK')} size="lg" className="shadow-lg">
                        Find a Doctor
                    </Button>
                </div>
            )}
        </div>
    )
}
