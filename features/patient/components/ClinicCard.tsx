import React from 'react';
import { Clinic, Doctor, ClinicOperationMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, MapPin, Clock, Calendar, Zap, Navigation, ShieldCheck } from 'lucide-react';

function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      {/* Fix: Changed 'm' attribute to 'd' attribute for valid SVG path data */}
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
  cardRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onBook: () => void;
  onQueue: () => void;
  onViewDoctor: (doctor: Doctor) => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic, waitInfo, feeRange, distLabel, gmapsLink, relevantDoctors, isHighlighted, cardRef, onSelect, onBook, onQueue, onViewDoctor
}) => {
  const canBook = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const canQueue = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const isDirectWalkIn = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;

  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-2xl border p-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden break-inside-avoid-column mb-4
            ${isHighlighted ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50 scale-[1.01] z-10' : 'border-slate-200'}`}
    >
        <div className="p-3 md:p-3.5 flex gap-3 cursor-pointer" onClick={onSelect}>
            {/* Image Section */}
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                {clinic.imageUrl ? (
                    <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                ) : (
                    <Building2 className="h-8 w-8 text-slate-300" />
                )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Header: Title + Map */}
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base truncate leading-tight group-hover:text-primary-600 transition-colors">
                        {clinic.name}
                    </h3>
                    <a 
                        href={gmapsLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0 ml-1" 
                        title="Get Directions" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Navigation className="h-3.5 w-3.5" />
                    </a>
                </div>

                {/* Location Line */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mb-1.5">
                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{clinic.city}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-primary-600 font-bold">{distLabel}</span>
                </div>
                
                {/* Doctors Section (Dense) */}
                <div className="mb-2">
                    {relevantDoctors.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">Docs:</span>
                            {relevantDoctors.slice(0, 1).map(d => (
                                <span key={d.id} className="text-[10px] font-bold text-slate-700 truncate">Dr. {d.name.split(' ').pop()}</span>
                            ))}
                            {relevantDoctors.length > 1 && <span className="text-primary-600 text-[10px] font-bold">+{relevantDoctors.length - 1} more</span>}
                        </div>
                    ) : (
                        <div className="text-[9px] text-slate-400 italic">No matching doctors</div>
                    )}
                </div>

                {/* Combined Info Row: Wait + Fee */}
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${waitInfo.bgColor} ${waitInfo.borderColor} shadow-sm shadow-black/5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${waitInfo.dotColor} animate-pulse flex-shrink-0`} />
                        <span className={`text-[9px] font-black uppercase tracking-tight ${waitInfo.textColor}`}>
                            {waitInfo.raw}m Wait
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <IndianRupeeIcon className="h-2.5 w-2.5" /> {feeRange}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Actions Footer */}
        <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex items-center gap-2 mt-auto">
            {canBook && (
                <Button onClick={(e) => { e.stopPropagation(); onBook(); }} variant="ghost" size="sm" className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-primary-700 hover:border-primary-200 text-[10px] font-bold h-8 px-2 rounded-lg shadow-sm">
                    Book
                </Button>
            )}
            
            {canQueue ? (
                <Button onClick={(e) => { e.stopPropagation(); onQueue(); }} size="sm" className="flex-1 text-[10px] font-bold bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all h-8 px-2 rounded-lg">
                    Join Queue
                </Button>
            ) : isDirectWalkIn ? (
                <Button onClick={(e) => { e.stopPropagation(); onSelect(); }} size="sm" className="flex-1 text-[10px] font-bold bg-white text-green-700 border border-green-200 hover:bg-green-50 shadow-sm h-8 px-2 rounded-lg">
                    Walk-In Only
                </Button>
            ) : null}
        </div>
    </div>
  );
};