
import React from 'react';
import { Clinic, ClinicOperationMode, Doctor } from '../../../types';
import { MapPin, Calendar, Zap, Star, Clock, ShieldCheck, Building2, Navigation } from 'lucide-react';
import { IndianRupeeIcon } from '../../../components/icons';
import { Tooltip } from '../../../components/Tooltip';

interface ClinicCardProps {
    clinic: Clinic;
    waitInfo: any;
    feeRange: string;
    distLabel?: string;
    travelTime?: string;
    gmapsLink: string;
    relevantDoctors: Doctor[];
    isHighlighted: boolean;
    isOpen: boolean;
    cardRef: React.Ref<HTMLDivElement>;
    onSelect: () => void;
    onBook: () => void;
    onQueue: () => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
    clinic, waitInfo, feeRange, distLabel, travelTime, gmapsLink,
    relevantDoctors, isHighlighted, isOpen, cardRef, onSelect, onBook, onQueue
}) => {
    const isDirectWalkInOnly = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;
    const canQueueOnline = [
        ClinicOperationMode.ONLINE_WALK_IN,
        ClinicOperationMode.BOTH_WALK_IN,
        ClinicOperationMode.HYBRID_FULL,
    ].includes(clinic.operationMode);
    const canBook = [
        ClinicOperationMode.HYBRID_DIRECT_APPT,
        ClinicOperationMode.HYBRID_FULL,
    ].includes(clinic.operationMode);
    const isQueueDisabled =
        !relevantDoctors ||
        relevantDoctors.length === 0 ||
        relevantDoctors.every(doc => !doc.isAvailable);

    const totalReviews = clinic.doctors.reduce((acc, doc) => acc + (doc.reviewCount || 0), 0);
    const avgRating =
        clinic.doctors.length > 0
            ? (clinic.doctors.reduce((a, b) => a + (b.rating || 0), 0) / clinic.doctors.length).toFixed(1)
            : '—';

    const waitMins = typeof waitInfo?.raw === 'number'
        ? waitInfo.raw
        : parseInt(String(waitInfo?.raw ?? '999')) || 0;

    // Wait time colour
    const waitColor =
        isDirectWalkInOnly ? 'text-orange-600'
        : waitMins < 15    ? 'text-emerald-600'
        : waitMins < 30    ? 'text-amber-600'
        :                    'text-rose-600';
    const waitBg =
        isDirectWalkInOnly ? 'bg-orange-50 border-orange-100'
        : waitMins < 15    ? 'bg-emerald-50 border-emerald-100'
        : waitMins < 30    ? 'bg-amber-50 border-amber-100'
        :                    'bg-rose-50 border-rose-100';

    const availableDoctors = relevantDoctors.filter(d => d.isAvailable);

    return (
        <div
            ref={cardRef}
            className={`bg-white rounded-2xl shadow-sm hover:shadow-xl border transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer relative ${
                isHighlighted
                    ? 'border-primary-400 ring-2 ring-primary-100 shadow-md'
                    : 'border-slate-100 hover:border-slate-200'
            }`}
            onClick={onSelect}
        >
            {/* ─── Top Badge Row ─────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {isOpen ? (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Open Now
                        </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-slate-200 tracking-wide">
                            Closed
                        </span>
                    )}
                    {canQueueOnline && (
                        <span className="flex items-center gap-1 bg-primary-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                            <Zap className="h-2.5 w-2.5 fill-current" />
                            Live Queue
                        </span>
                    )}
                    {isDirectWalkInOnly && (
                        <span className="bg-orange-100 text-orange-700 border border-orange-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wide">
                            At Clinic Only
                        </span>
                    )}
                </div>
                {clinic.subscriptionStatus === 'ACTIVE' && (
                    <span className="flex items-center gap-1 text-primary-600 text-[9px] font-black uppercase tracking-wide shrink-0">
                        <ShieldCheck className="h-3 w-3 fill-current" />
                        Verified
                    </span>
                )}
            </div>

            {/* ─── Clinic Identity ───────────────────────────── */}
            <div className="px-5 pb-4">
                <div className="flex items-start gap-4 mb-4">
                    {/* Logo / Image */}
                    <div className="w-[60px] h-[60px] rounded-xl bg-slate-100 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                        {clinic.imageUrl ? (
                            <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="h-7 w-7 text-slate-300" />
                        )}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-primary-600 transition-colors line-clamp-2 mb-1.5">
                            {clinic.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 mb-2">
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-slate-300" />
                            {clinic.address}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Rating chip */}
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5">
                                <Star className="h-2.5 w-2.5 text-amber-400 fill-current" />
                                <span className="text-[10px] font-black text-amber-700">{avgRating}</span>
                                <span className="text-[9px] text-amber-500 opacity-80">({totalReviews})</span>
                            </div>
                            {/* Distance chip */}
                            {distLabel && (
                                <div className="flex items-center gap-1 text-blue-600 text-[9px] font-bold bg-blue-50 border border-blue-100 rounded-md px-1.5 py-0.5">
                                    <Navigation className="h-2.5 w-2.5" />
                                    {distLabel}
                                    {travelTime && (
                                        <span className="text-slate-400 font-normal ml-0.5">· {travelTime}</span>
                                    )}
                                </div>
                            )}
                            {/* Hours */}
                            {clinic.operatingHours && (
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                                    <Clock className="h-2.5 w-2.5" />
                                    {clinic.operatingHours}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Stats Row: Wait · Doctors · Fee ────────── */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Wait time */}
                    <div className={`flex flex-col items-center justify-center py-3 rounded-xl border ${waitBg}`}>
                        <div className={`text-2xl font-black leading-none ${waitColor}`}>
                            {isDirectWalkInOnly ? '—' : String(waitInfo?.raw ?? '0')}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                            {isDirectWalkInOnly ? 'at clinic' : 'min wait'}
                        </div>
                    </div>

                    {/* Doctor count */}
                    <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-2xl font-black text-slate-700 leading-none">
                            {clinic.doctors.length}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                            doctors
                        </div>
                    </div>

                    {/* Consult fee */}
                    <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] font-black text-slate-700 leading-none flex items-center gap-0.5">
                            <IndianRupeeIcon className="h-2.5 w-2.5" />
                            {feeRange}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                            consult fee
                        </div>
                    </div>
                </div>

                {/* ─── Doctor Avatars ───────────────────────────── */}
                {relevantDoctors.length > 0 && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        {/* Stacked avatars */}
                        <div className="flex items-center">
                            {relevantDoctors.slice(0, 3).map((doc, idx) => (
                                <div
                                    key={doc.id}
                                    className="relative rounded-full border-2 border-white shadow-sm -ml-2 first:ml-0"
                                    style={{ zIndex: 3 - idx }}
                                >
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                                        {doc.avatarUrl ? (
                                            <img
                                                src={doc.avatarUrl}
                                                alt={doc.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-500">
                                                {doc.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    {doc.isAvailable && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Names + availability status */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-700 truncate leading-tight">
                                {relevantDoctors
                                    .slice(0, 2)
                                    .map(d => `Dr. ${d.name.split(' ').pop()}`)
                                    .join(', ')}
                                {relevantDoctors.length > 2 && ` +${relevantDoctors.length - 2}`}
                            </p>
                            <p
                                className={`text-[9px] font-bold mt-0.5 ${
                                    availableDoctors.length > 0 ? 'text-emerald-600' : 'text-slate-400'
                                }`}
                            >
                                {availableDoctors.length > 0
                                    ? `${availableDoctors.length} available now`
                                    : 'No doctors available now'}
                            </p>
                        </div>

                        {/* GMaps link */}
                        <Tooltip text="View on Google Maps">
                            <a
                                href={gmapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="w-7 h-7 bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                            </a>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* ─── CTA Footer ────────────────────────────────── */}
            <div
                className={`mt-auto border-t border-slate-50 p-4 grid gap-3 ${
                    canQueueOnline && canBook ? 'grid-cols-2' : 'grid-cols-1'
                }`}
            >
                {canQueueOnline && (
                    <Tooltip
                        text={
                            isQueueDisabled
                                ? 'No doctors available for live token'
                                : 'Join the live walk-in queue remotely'
                        }
                    >
                        <button
                            className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                                isQueueDisabled
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-100'
                            }`}
                            onClick={e => {
                                e.stopPropagation();
                                if (!isQueueDisabled) onQueue();
                            }}
                            disabled={isQueueDisabled}
                        >
                            <Zap className="h-3.5 w-3.5 fill-current" />
                            Get Token
                        </button>
                    </Tooltip>
                )}

                {canBook && (
                    <Tooltip text="Schedule a confirmed appointment slot">
                        <button
                            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-sm shadow-indigo-100"
                            onClick={e => {
                                e.stopPropagation();
                                onBook();
                            }}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            Book Appt
                        </button>
                    </Tooltip>
                )}

                {isDirectWalkInOnly && !canBook && !canQueueOnline && (
                    <button
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-sm shadow-orange-100"
                        onClick={e => {
                            e.stopPropagation();
                            onSelect();
                        }}
                    >
                        <MapPin className="h-3.5 w-3.5" />
                        Visit Clinic
                    </button>
                )}

                {/* Details fallback when only one CTA is visible */}
                {!(canQueueOnline && canBook) && (canQueueOnline || canBook || isDirectWalkInOnly) && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className="flex items-center justify-center px-4 py-3 rounded-xl font-bold text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 transition-all uppercase tracking-wide"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};
