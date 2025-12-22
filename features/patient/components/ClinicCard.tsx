
import React from 'react';
import { Clinic, Doctor, ClinicOperationMode } from '../../../types';
import { Building2, MapPin, Clock, Calendar, Zap, Navigation, ShieldCheck, Star, CheckCircle2, Info } from 'lucide-react';
import { Tooltip } from '../../../components/Tooltip';

function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m 6 13 8.5 10" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

interface ClinicCardProps {
  clinic: Clinic;
  waitInfo: { 
      label: string; 
      bgColor: string; 
      textColor: string; 
      borderColor: string; 
      raw: string; 
      mapColor: string;
      peopleCount: string;
      dotColor: string;
  };
  feeRange: string;
  distLabel: string;
  gmapsLink: string;
  relevantDoctors: Doctor[];
  isHighlighted: boolean;
  isOpen: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onBook: () => void;
  onQueue: () => void;
  onViewDoctor: (doctor: Doctor) => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic, waitInfo, feeRange, distLabel, gmapsLink, relevantDoctors, isHighlighted, isOpen, cardRef, onSelect, onBook, onQueue, onViewDoctor
}) => {
  const canBook = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const isDirectWalkInOnly = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;

  const avgRating = React.useMemo(() => {
    if (!clinic.doctors.length) return 0;
    const total = clinic.doctors.reduce((acc, doc) => acc + doc.rating, 0);
    return (total / clinic.doctors.length).toFixed(1);
  }, [clinic.doctors]);

  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-[1.5rem] border p-0 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative overflow-visible mb-2 sm:mb-4
            ${isHighlighted ? 'border-primary-500 ring-4 ring-primary-500/10 scale-[1.02] z-20' : 'border-slate-200'}`}
    >
        <div className="p-4 flex flex-col cursor-pointer" onClick={onSelect}>
            {/* Status Badges Row */}
            <div className="flex flex-wrap gap-1.5 mb-3.5">
                {isOpen ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm">Open</span>
                ) : (
                    <span className="bg-slate-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm">Closed</span>
                )}
                
                {isDirectWalkInOnly && (
                    <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                        At Clinic Only
                    </span>
                )}
                {canQueueOnline && (
                    <span className="bg-primary-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                        Live Token
                    </span>
                )}
                
                {clinic.subscriptionStatus === 'ACTIVE' && (
                    <span className="bg-primary-50 text-primary-600 border border-primary-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5 ml-auto">
                        <ShieldCheck className="h-3 w-3 fill-current" /> Verified
                    </span>
                )}
            </div>

            <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all border border-slate-100">
                    {clinic.imageUrl ? (
                        <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="h-10 w-10 text-slate-300" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-primary-600 transition-colors mb-1 truncate">
                        {clinic.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mb-2">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{clinic.address}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[11px] font-black">{avgRating}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-lg uppercase tracking-tight border border-slate-200">
                            {clinic.type?.replace('_', ' ') || 'General'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Doctors:</span>
                    {relevantDoctors.slice(0, 2).map(d => (
                        <span key={d.id} className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 truncate max-w-[90px]">Dr. {d.name.split(' ').pop()}</span>
                    ))}
                    {relevantDoctors.length > 2 && <span className="text-primary-600 text-[10px] font-black">+{relevantDoctors.length - 2}</span>}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${waitInfo.bgColor} ${waitInfo.borderColor} shadow-sm`}>
                        <div className={`w-2 h-2 rounded-full ${waitInfo.dotColor} animate-pulse flex-shrink-0`} />
                        <span className={`text-[11px] font-black uppercase tracking-tight ${waitInfo.textColor}`}>
                            {isDirectWalkInOnly ? 'Reception Queue' : `${waitInfo.raw}m Wait`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        <IndianRupeeIcon className="h-3 w-3 text-slate-400" />
                        <span className="text-[11px] font-black text-slate-700">{feeRange}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Actions Footer */}
        <div className="bg-slate-50 p-3 flex flex-col sm:flex-row items-stretch gap-2 mt-auto border-t border-slate-100 rounded-b-[1.5rem] overflow-visible">
            {canBook && (
                <div className="flex-1 overflow-visible">
                    <Tooltip text={canQueueOnline ? "Schedule a specific date and time for your consultation" : "Book your appointment slot"}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onBook(); }} 
                            className="w-full bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[12px] font-black h-12 px-2 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Calendar className="h-4 w-4" />
                            {canQueueOnline ? 'Book Slot' : 'Appt'}
                        </button>
                    </Tooltip>
                </div>
            )}
            
            {canQueueOnline ? (
                <div className="flex-[1.5] flex flex-col overflow-visible">
                    <Tooltip text="Join the live walk-in queue remotely from your home">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onQueue(); }} 
                            className="w-full bg-primary-600 text-white hover:bg-primary-700 text-[12px] font-black h-12 px-2 rounded-2xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Zap className="h-4 w-4 fill-current" />
                            Get Token
                        </button>
                    </Tooltip>
                </div>
            ) : isDirectWalkInOnly ? (
                <div className="flex-[1.5] flex flex-col overflow-visible">
                    <Tooltip text="Please visit the clinic reception in person to get a token">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(); }} 
                            className="w-full bg-orange-600 text-white hover:bg-orange-700 text-[12px] font-black h-12 px-2 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <MapPin className="h-4 w-4" />
                            Visit Clinic
                        </button>
                    </Tooltip>
                </div>
            ) : (
                <div className="flex-1 overflow-visible">
                    <Tooltip text="View detailed information about services and medical staff">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(); }} 
                            className="w-full bg-slate-900 text-white hover:bg-slate-800 text-[12px] font-black h-12 px-2 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            View Details
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    </div>
  );
};
