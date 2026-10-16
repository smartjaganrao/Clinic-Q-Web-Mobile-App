
import React from 'react';
import { PatientStatus } from '../../../types';
import {
    CheckCircle2,
    XCircle,
    Calendar,
    Star,
    History,
    Stethoscope,
    FileText,
    MessageSquare,
} from 'lucide-react';

const StarRow = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star
                key={s}
                className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            />
        ))}
    </div>
);

export const HistoryVisitsView = ({
    historyVisits,
    setFeedbackModal,
}: {
    historyVisits: any[];
    setFeedbackModal: (modal: any) => void;
}) => {
    return (
        <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 animate-in fade-in duration-500">
            {historyVisits.length > 0 ? (
                <div className="relative">
                    {/* Timeline spine */}
                    <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-slate-100" />

                    <div className="space-y-4">
                        {historyVisits.map((visit, idx) => {
                            const isCompleted = visit.status === PatientStatus.COMPLETED;
                            const visitDate = new Date(visit.timeAdded);
                            const formattedDate = visitDate.toLocaleDateString(undefined, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            });
                            const formattedTime = visitDate.toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            });

                            return (
                                <div key={visit.id} className="flex gap-4 relative">
                                    {/* ── Timeline dot ──── */}
                                    <div
                                        className={`relative z-10 flex-shrink-0 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-md ${
                                            isCompleted
                                                ? 'bg-emerald-500'
                                                : 'bg-rose-500'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-6 w-6 text-white" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-white" />
                                        )}
                                    </div>

                                    {/* ── Visit Card ──────── */}
                                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        {/* Card header */}
                                        <div
                                            className={`px-4 pt-3.5 pb-3 border-b ${
                                                isCompleted ? 'border-slate-50' : 'border-rose-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                                                        {visit.clinicName}
                                                    </h3>
                                                    <p className="text-[12px] text-primary-600 font-bold mt-0.5 flex items-center gap-1">
                                                        <Stethoscope className="h-3 w-3" />
                                                        Dr. {visit.doctorName}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                                    <span
                                                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wide ${
                                                            isCompleted
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        }`}
                                                    >
                                                        {isCompleted ? '✓ Completed' : '✗ Cancelled'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        {visit.visitType === 'APPOINTMENT'
                                                            ? '📅 Appointment'
                                                            : '⚡ Walk-in'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="px-4 py-3 space-y-2.5">
                                            {/* Date row */}
                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                                                {formattedDate} at {formattedTime}
                                            </div>

                                            {/* Rating or Rate button */}
                                            {visit.rating ? (
                                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                    <StarRow rating={visit.rating} />
                                                    <span className="text-[10px] font-bold text-amber-700">
                                                        Your rating: {visit.rating}/5
                                                    </span>
                                                </div>
                                            ) : (
                                                isCompleted && (
                                                    <button
                                                        onClick={() =>
                                                            setFeedbackModal({
                                                                isOpen: true,
                                                                visit,
                                                                rating: 0,
                                                                text: '',
                                                            })
                                                        }
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-xl border border-indigo-100 transition-all uppercase tracking-wider active:scale-95"
                                                    >
                                                        <Star className="h-3.5 w-3.5 fill-indigo-400" />
                                                        Rate Your Visit
                                                    </button>
                                                )
                                            )}

                                            {/* Diagnosis */}
                                            {visit.diagnosis && (
                                                <div className="flex items-start gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                                                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">
                                                            Diagnosis
                                                        </p>
                                                        <p className="text-sm text-slate-700 font-medium">{visit.diagnosis}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {visit.notes && (
                                                <div className="flex items-start gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                                                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">
                                                            Notes
                                                        </p>
                                                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                                            {visit.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Privacy footer */}
                                        <div className="px-4 pb-3 text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center">
                                            Records are private & secure
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ── Empty State ── */
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-slate-200">
                        <History className="h-11 w-11 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                        No Visit History
                    </h3>
                    <p className="text-slate-500 max-w-xs font-medium leading-relaxed">
                        Your completed and cancelled appointments will show up here as a timeline.
                    </p>
                </div>
            )}
        </div>
    );
};
