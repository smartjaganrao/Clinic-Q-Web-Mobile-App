import React from 'react';
import { PatientStatus } from '../../../types';
/* Added missing History import from lucide-react to avoid name collision with browser global History */
import { CheckCircle2, X, Calendar, Star, ThumbsUp, History } from 'lucide-react';
import { Button } from '../../../components/Button';

export const HistoryVisitsView = ({ historyVisits, setFeedbackModal }) => {
    return (
        <div className="w-full h-full px-4 md:px-8 py-0 max-w-[1920px] mx-auto">
            {historyVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {historyVisits.map(visit => (
                        <div
                            key={visit.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 h-full hover:border-primary-200 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                    <div
                                        className={`p-3 rounded-lg flex-shrink-0 ${visit.status === PatientStatus.COMPLETED
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                            }`}
                                    >
                                        {visit.status === PatientStatus.COMPLETED ? (
                                            <CheckCircle2 className="h-6 w-6" />
                                        ) : (
                                            <X className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-slate-900 truncate text-base">
                                            {visit.clinicName}
                                        </h3>
                                        <p className="text-sm text-slate-500 truncate">
                                            Dr. {visit.doctorName}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(visit.timeAdded).toLocaleDateString()}
                                            &nbsp;at&nbsp;
                                            {new Date(visit.timeAdded).toLocaleTimeString([], {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {visit.rating ? (
                                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star
                                                        key={s}
                                                        className={`h-3 w-3 ${s <= visit.rating
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-slate-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-amber-700">
                                                You rated this visit
                                            </span>
                                        </div>
                                    ) : (
                                        visit.status === PatientStatus.COMPLETED && (
                                            <button
                                                onClick={() =>
                                                    setFeedbackModal({
                                                        isOpen: true,
                                                        visit,
                                                        rating: 0,
                                                        text: ''
                                                    })
                                                }
                                                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100 transition-all uppercase tracking-wider"
                                            >
                                                Rate Doctor
                                            </button>
                                        )
                                    )}
                                    {visit.diagnosis && (
                                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                                                Diagnosis
                                            </p>
                                            <p className="text-sm text-slate-700">{visit.diagnosis}</p>
                                        </div>
                                    )}
                                    {visit.notes && (
                                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                                                Notes
                                            </p>
                                            <p className="text-sm text-slate-700 line-clamp-3">
                                                {visit.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 italic">
                                Visit records are private and secure.
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] opacity-60">
                    <div className="bg-slate-200 p-6 rounded-full mb-4">
                        <History className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">
                        No past visits
                    </h3>
                    <p className="text-slate-500 mb-6 text-center">
                        Your completed appointment history will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};