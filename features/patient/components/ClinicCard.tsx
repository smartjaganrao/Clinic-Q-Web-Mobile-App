
import React from 'react';
import { Clinic, ClinicOperationMode, Doctor } from '../../../types';
import { MapPin, Calendar, Zap, Star, Clock, ShieldCheck, ChevronRight, Building2, MapPinIcon, HelpCircle, Car } from 'lucide-react';
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

const ActionButton = ({ label, subLabel, icon: Icon, variant, onClick, className = '', tooltip }: any) => {
    // If tooltip is present, the wrapper takes flex-1, and button takes w-full.
    // If no tooltip, button takes flex-1 directly (via base class if not overridden).
    const base = "flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all active:scale-95 shadow-sm";
    const variants: Record<string, string> = {
        accent: "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-teal-100",
        outline: "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        primary: "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
        orange: "bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-orange-100"
    };

    const buttonClass = `${base} ${variants[variant] || variants.outline} ${className} ${!tooltip ? 'flex-1' : 'w-full'}`;

    const button = (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={buttonClass}>
            <div className={`flex items-center gap-1.5 ${subLabel ? 'mb-0.5' : ''}`}>
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {subLabel && <span className="text-[9px] opacity-90 font-medium leading-none">{subLabel}</span>}
        </button>
    );

    if (tooltip) {
        return (
            <Tooltip text={tooltip} className="flex-1">
                {button}
            </Tooltip>
        );
    }

    return button;
};

export const ClinicCard: React.FC<ClinicCardProps> = ({ 
    clinic, waitInfo, feeRange, distLabel, travelTime, gmapsLink, relevantDoctors, isHighlighted, isOpen, cardRef, onSelect, onBook, onQueue 
}) => {
    const isDirectWalkInOnly = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;
    const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
    const canBook = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);

    return (
        <div ref={cardRef} className={`bg-white rounded-[1.5rem] border p-0 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative overflow-visible mb-2 sm:mb-4 ${isHighlighted ? 'border-primary-500 ring-4 ring-primary-500/10 scale-[1.02] z-20' : 'border-slate-200'}`} onClick={onSelect}>
             
             <div className="absolute top-3 right-3 z-10">
                <Tooltip text="View on Google Maps">
                    <a href={gmapsLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-white text-blue-600 border border-slate-100 hover:border-blue-200 rounded-lg shadow-sm transition-all flex items-center justify-center active:scale-95">
                        <MapPin className="h-4 w-4" />
                    </a>
                </Tooltip>
            </div>

            <div className="p-3 flex flex-col cursor-pointer">
                 <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
                    {isOpen ? 
                        <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm">Open</span> : 
                        <span className="bg-slate-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm">Closed</span>
                    }
                    {isDirectWalkInOnly && (
                         <Tooltip text="Walk in and get token at clinic desk">
                             <span className="bg-orange-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-1 cursor-help">
                                At Clinic Only <HelpCircle className="h-2 w-2 opacity-50" />
                             </span>
                         </Tooltip>
                    )}
                    {canQueueOnline && <span className="bg-primary-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> Live Token</span>}
                    {clinic.subscriptionStatus === "ACTIVE" && (
                         <span className="bg-primary-50 text-primary-600 border border-primary-100 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5 ml-auto">
                             <ShieldCheck className="h-2.5 w-2.5 fill-current" /> Verified
                         </span>
                     )}
                 </div>

                 <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all border border-slate-100">
                        {clinic.imageUrl ? <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" /> : <Building2 className="h-8 w-8 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-black text-slate-900 text-sm leading-tight group-hover:text-primary-600 transition-colors mb-1">{clinic.name}</h3>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold min-w-0 pt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{clinic.address}</span>
                            </div>
                            
                            {distLabel && (
                                <div className="text-right shrink-0 flex flex-col items-end">
                                    <span className="text-blue-600 font-black flex items-center justify-end gap-1 text-[10px] leading-none">
                                        <MapPin className="h-3 w-3" />{distLabel}
                                    </span>
                                    {travelTime && (
                                        <span className="text-[9px] text-slate-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                                            <Car className="h-3 w-3 text-slate-400" />{travelTime.replace('~', '')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                         <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1 py-0.5 rounded-md border border-amber-100">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                <span className="text-[9px] font-black">{clinic.doctors.length ? (clinic.doctors.reduce((a, b) => a + b.rating, 0) / clinic.doctors.length).toFixed(1) : 0}</span>
                            </div>
                            <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight border border-slate-200">
                                {clinic.type?.replace('_', ' ') || 'General'}
                            </span>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Doctors:</span>
                        {relevantDoctors.slice(0, 2).map(doc => (
                             <span key={doc.id} className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 truncate max-w-[120px] flex items-center gap-1">
                                Dr. {doc.name.split(' ').pop()}
                                <span className="text-[8px] text-primary-600 font-black bg-primary-50 px-1 rounded">({doc.experience}y)</span>
                             </span>
                        ))}
                        {relevantDoctors.length > 2 && <span className="text-primary-600 text-[9px] font-black">+{relevantDoctors.length - 2}</span>}
                    </div>

                    <div className="flex items-center justify-between">
                         <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${waitInfo.bgColor} ${waitInfo.borderColor} shadow-sm`}>
                            {isDirectWalkInOnly ? (
                                <MapPinIcon className={`h-3.5 w-3.5 ${waitInfo.textColor}`} />
                            ) : (
                                <Clock className={`h-3.5 w-3.5 ${waitInfo.textColor}`} />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-tight ${waitInfo.textColor}`}>
                                {isDirectWalkInOnly ? 'Token at Reception' : `${waitInfo.raw} min wait`}
                            </span>
                         </div>
                         <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                             <IndianRupeeIcon className="h-2.5 w-2.5 text-slate-400" />
                             <span className="text-[10px] font-black text-slate-700">{feeRange}</span>
                         </div>
                    </div>
                 </div>
            </div>

            <div className="bg-slate-50 p-3 flex flex-col sm:flex-row gap-2 mt-auto border-t border-slate-100 rounded-b-[1.5rem]">
                {canQueueOnline ? (
                    <>
                        <ActionButton label="Get Token" subLabel="Join live walk-in queue" icon={Zap} variant="accent" onClick={onQueue} tooltip="Join the live queue remotely" />
                        {canBook && <ActionButton label="Book Appointment" icon={Calendar} variant="primary" onClick={onBook} tooltip="Schedule a confirmed slot for later" />}
                    </>
                ) : isDirectWalkInOnly ? (
                    <ActionButton 
                        label="Visit Clinic" 
                        subLabel="Token at reception" 
                        icon={MapPin} 
                        variant="orange"
                        onClick={onSelect}
                        tooltip="This clinic only accepts walk-ins at reception" 
                    />
                ) : (
                     <ActionButton label="Book Appointment" icon={Calendar} variant="primary" onClick={onBook} tooltip="Schedule a confirmed slot for later" />
                )}
                
                {!(canQueueOnline && canBook) && (
                    <Tooltip text="View details about doctors and facilities" className="flex-1">
                        <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="w-full h-full px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors rounded-2xl hover:bg-slate-100">
                            View Details
                        </button>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};
