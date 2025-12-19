import React from 'react';
import { Clinic, Doctor, ClinicOperationMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, MapPin, Clock, Calendar, Zap, Navigation, ShieldCheck, Star, CheckCircle2, Info, Footprints, Shuffle, LayoutGrid } from 'lucide-react';

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

const MODE_CONFIG = {
    [ClinicOperationMode.DIRECT_WALK_IN]: {
        label: 'Walk-In Only',
        styles: 'bg-orange-500 text-white border-orange-600',
        icon: Footprints
    },
    [ClinicOperationMode.ONLINE_WALK_IN]: {
        label: 'Online Token',
        styles: 'bg-blue-600 text-white border-blue-700',
        icon: Zap
    },
    [ClinicOperationMode.BOTH_WALK_IN]: {
        label: 'Token & Walk-In',
        styles: 'bg-emerald-600 text-white border-emerald-700',
        icon: Shuffle
    },
    [ClinicOperationMode.HYBRID_DIRECT_APPT]: {
        label: 'Walk-In & Appt',
        styles: 'bg-indigo-600 text-white border-indigo-700',
        icon: Calendar
    },
    [ClinicOperationMode.HYBRID_FULL]: {
        label: 'Token & Appt',
        styles: 'bg-primary-600 text-white border-primary-700',
        icon: LayoutGrid
    }
};

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

  const mode = MODE_CONFIG[clinic.operationMode] || { label: 'General', styles: 'bg-slate-500 text-white', icon: Info };
  const ModeIcon = mode.icon;

  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-2xl border p-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden break-inside-avoid-column mb-4
            ${isHighlighted ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50 scale-[1.01] z-10' : 'border-slate-200'}`}
    >
        <div className="p-3 md:p-3.5 flex flex-col cursor-pointer" onClick={onSelect}>
            {/* Status Badges Row - Clean and distinct */}
            <div className="flex flex-wrap gap-1 mb-3">
                {isOpen ? (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Open Now</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Closed</span>
                )}
                
                {/* EXPLICIT OPERATION MODE DISPLAY */}
                <span className={`inline-flex items-center gap-1 ${mode.styles} text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm border`}>
                    <ModeIcon className="h-2 w-2" />
                    {mode.label}
                </span>
                
                {clinic.subscriptionStatus === 'ACTIVE' && (
                    <span className="bg-primary-50 text-primary-600 border border-primary-100 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 ml-auto">
                        <ShieldCheck className="h-2.5 w-2.5 fill-current" /> Verified
                    </span>
                )}
            </div>

            <div className="flex gap-3 mb-3">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                    {clinic.imageUrl ? (
                        <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="h-8 w-8 text-slate-300" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight group-hover:text-primary-600 transition-colors pr-1 break-words flex-1">
                            {clinic.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-medium mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{clinic.city}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-primary-600 font-bold">{distLabel}</span>
                        </div>
                        <a 
                            href={gmapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-lg transition-all flex-shrink-0 shadow-sm" 
                            title="Get Directions" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Navigation className="h-3 w-3" />
                        </a>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span className="text-[10px] font-black">{avgRating}</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter border border-slate-200 truncate">
                            {clinic.type?.replace('_', ' ') || 'General'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">Doctors:</span>
                    {relevantDoctors.slice(0, 2).map(d => (
                        <span key={d.id} className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-[80px]">Dr. {d.name.split(' ').pop()}</span>
                    ))}
                    {relevantDoctors.length > 2 && <span className="text-primary-600 text-[10px] font-bold">+{relevantDoctors.length - 2}</span>}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${waitInfo.bgColor} ${waitInfo.borderColor} shadow-sm shadow-black/5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${waitInfo.dotColor} animate-pulse flex-shrink-0`} />
                        <span className={`text-[9px] font-black uppercase tracking-tight ${waitInfo.textColor}`}>
                            {isDirectWalkInOnly ? 'Reception Queue' : `${waitInfo.raw}m Wait`}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded flex items-center gap-0.5 border border-slate-200">
                        <IndianRupeeIcon className="h-2.5 w-2.5" /> {feeRange}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Actions Footer - High Visibility Button Styles */}
        <div className="bg-slate-50 p-2.5 flex items-center gap-2 mt-auto border-t border-slate-100">
            {canBook && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBook(); }} 
                    className="flex-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-black h-10 px-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                    <Calendar className="h-3.5 w-3.5" />
                    {canQueueOnline ? 'Book Slot' : 'Appt'}
                </button>
            )}
            
            {canQueueOnline ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); onQueue(); }} 
                    className="flex-[1.2] bg-primary-600 text-white hover:bg-primary-700 text-[11px] font-black h-10 px-2 rounded-xl shadow-md shadow-primary-100 transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Get Token
                </button>
            ) : isDirectWalkInOnly ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }} 
                    className="flex-1 bg-orange-600 text-white hover:bg-orange-700 text-[11px] font-black h-10 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                    <MapPin className="h-3.5 w-3.5" />
                    Visit Clinic
                </button>
            ) : (
                <button 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }} 
                    className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-black h-10 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                    View Details
                </button>
            )}
        </div>
    </div>
  );
};