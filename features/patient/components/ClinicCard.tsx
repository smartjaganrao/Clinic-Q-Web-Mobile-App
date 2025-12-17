import React from 'react';
import { Clinic, Doctor, ClinicOperationMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, MapPin, Clock, Calendar, Zap, Navigation, ShieldCheck, Star, CheckCircle2 } from 'lucide-react';

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
  const canQueue = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const isDirectWalkIn = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;

  const avgRating = React.useMemo(() => {
    if (!clinic.doctors.length) return 0;
    const total = clinic.doctors.reduce((acc, doc) => acc + doc.rating, 0);
    return (total / clinic.doctors.length).toFixed(1);
  }, [clinic.doctors]);

  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-2xl border p-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden break-inside-avoid-column mb-4
            ${isHighlighted ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50 scale-[1.01] z-10' : 'border-slate-200'}`}
    >
        {/* Status Badges Overlay */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 pointer-events-none">
            {isOpen ? (
                <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Open</span>
            ) : (
                <span className="bg-slate-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Closed</span>
            )}
            {clinic.subscriptionStatus === 'ACTIVE' && (
                <span className="bg-white/90 backdrop-blur-sm text-primary-600 border border-primary-100 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                    <ShieldCheck className="h-2 w-2 fill-current" /> Verified
                </span>
            )}
        </div>

        <div className="p-3 md:p-3.5 flex flex-col cursor-pointer" onClick={onSelect}>
            <div className="flex gap-3 mb-3">
                {/* Image Section */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                    {clinic.imageUrl ? (
                        <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="h-8 w-8 text-slate-300" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header: Title + Map */}
                    <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base truncate leading-tight group-hover:text-primary-600 transition-colors pr-1">
                            {clinic.name}
                        </h3>
                        <a 
                            href={gmapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0" 
                            title="Get Directions" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Navigation className="h-3.5 w-3.5" />
                        </a>
                    </div>

                    {/* Location Line */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-1">
                        <MapPin className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{clinic.city}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-primary-600 font-bold">{distLabel}</span>
                    </div>

                    {/* Rating & Type */}
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
            
            {/* Detailed Info Section */}
            <div className="space-y-2">
                {/* Doctors Section */}
                <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">Doctors:</span>
                    {relevantDoctors.slice(0, 2).map(d => (
                        <span key={d.id} className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-[80px]">Dr. {d.name.split(' ').pop()}</span>
                    ))}
                    {relevantDoctors.length > 2 && <span className="text-primary-600 text-[10px] font-bold">+{relevantDoctors.length - 2}</span>}
                </div>

                {/* Key Amenities */}
                {clinic.amenities && clinic.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {clinic.amenities.slice(0, 3).map(a => (
                            <span key={a} className="text-[8px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="h-2 w-2 text-primary-400" /> {a}
                            </span>
                        ))}
                    </div>
                )}

                {/* Combined Info Row: Wait + Fee */}
                <div className="flex items-center justify-between pt-1">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${waitInfo.bgColor} ${waitInfo.borderColor} shadow-sm shadow-black/5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${waitInfo.dotColor} animate-pulse flex-shrink-0`} />
                        <span className={`text-[9px] font-black uppercase tracking-tight ${waitInfo.textColor}`}>
                            {waitInfo.raw}m Wait
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded flex items-center gap-0.5 border border-slate-200">
                        <IndianRupeeIcon className="h-2.5 w-2.5" /> {feeRange}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Actions Footer */}
        <div className="bg-slate-50/80 border-t border-slate-100 p-2 flex items-center gap-2 mt-auto">
            {canBook && (
                <Button onClick={(e) => { e.stopPropagation(); onBook(); }} variant="ghost" size="sm" className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-primary-700 hover:border-primary-200 text-[10px] font-bold h-9 px-2 rounded-xl shadow-sm">
                    Book
                </Button>
            )}
            
            {canQueue ? (
                <Button onClick={(e) => { e.stopPropagation(); onQueue(); }} size="sm" className="flex-1 text-[10px] font-bold bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all h-9 px-2 rounded-xl">
                    Join Queue
                </Button>
            ) : isDirectWalkIn ? (
                <Button onClick={(e) => { e.stopPropagation(); onSelect(); }} size="sm" className="flex-1 text-[10px] font-bold bg-white text-green-700 border border-green-200 hover:bg-green-50 shadow-sm h-9 px-2 rounded-xl">
                    Walk-In Only
                </Button>
            ) : null}
        </div>
    </div>
  );
};