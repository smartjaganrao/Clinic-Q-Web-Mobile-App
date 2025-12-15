
import React from 'react';
import { Clinic, Doctor, ClinicOperationMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, Star, MapPin, Clock, Calendar, Zap, ExternalLink, Footprints } from 'lucide-react';

function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 10" />
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
  rating: string;
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
  clinic, waitInfo, feeRange, rating, distLabel, gmapsLink, relevantDoctors, isHighlighted, cardRef, onSelect, onBook, onQueue, onViewDoctor
}) => {
  const isWalkInOnly = clinic.operationMode === ClinicOperationMode.WALK_IN;
  const isApptOnly = clinic.operationMode === ClinicOperationMode.APPOINTMENT;

  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-xl border p-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden h-full
            ${isHighlighted ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50 scale-[1.01] z-10' : 'border-slate-200'}`}
    >
        <div className="p-3 md:p-4 flex gap-3 cursor-pointer flex-1" onClick={onSelect}>
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                {clinic.imageUrl ? (
                    <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                ) : (
                    <Building2 className="h-6 w-6 text-slate-300" />
                )}
                {/* Simplified Badge for Image Overlay */}
                <div className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5 text-white uppercase tracking-wider ${waitInfo.mapColor}`}>
                    {waitInfo.raw}m
                </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base truncate leading-tight group-hover:text-primary-600 transition-colors">{clinic.name}</h3>
                    <span className="flex items-center text-[10px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex-shrink-0 ml-2"><Star className="h-2.5 w-2.5 mr-0.5 fill-current" /> {rating}</span>
                </div>
                
                {/* Doctor Avatars Row - Compact */}
                <div className="mb-2 min-h-[20px]">
                    {relevantDoctors.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {relevantDoctors.slice(0, 2).map(d => (
                                <button 
                                    key={d.id} 
                                    onClick={(e) => { e.stopPropagation(); onViewDoctor(d); }}
                                    className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 px-1.5 py-0.5 rounded-md transition-colors group/doc"
                                >
                                    <span className="text-[10px] font-bold text-slate-700 group-hover/doc:text-primary-700 truncate max-w-[80px]">Dr. {d.name.split(' ').pop()}</span>
                                </button>
                            ))}
                            {relevantDoctors.length > 2 && <span className="text-slate-400 text-[9px] self-center">+{relevantDoctors.length - 2}</span>}
                        </div>
                    ) : (
                        <div className="text-[10px] text-slate-400 italic">No matching doctors</div>
                    )}
                </div>

                {/* Info Row: Distance & Fee */}
                <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-500 mb-2 mt-auto">
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {distLabel}</span>
                    <span className="flex items-center gap-0.5"><IndianRupeeIcon className="h-2.5 w-2.5" /> {feeRange}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {clinic.operatingHours || '9-9'}</span>
                </div>

                {/* NEW: LIVE QUEUE STATUS BAR - Compact */}
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${waitInfo.bgColor} ${waitInfo.borderColor}`}>
                    <div className={`w-2 h-2 rounded-full ${waitInfo.dotColor} animate-pulse shadow-sm flex-shrink-0`} />
                    <div className="flex items-center justify-between w-full leading-none">
                        <span className={`text-[9px] font-black uppercase tracking-wide ${waitInfo.textColor}`}>
                            {waitInfo.label}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                            <span>~{waitInfo.raw}m</span>
                            <span className="w-0.5 h-2 bg-slate-300 rounded-full mx-0.5" />
                            <span className="opacity-80">{waitInfo.peopleCount} ppl</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Action Footer */}
        <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex items-center gap-2 mt-auto">
            {!isWalkInOnly && (
                <Button onClick={(e) => { e.stopPropagation(); onBook(); }} variant="secondary" size="sm" className="flex-1 bg-white border-slate-200 text-slate-700 hover:text-primary-700 hover:border-primary-200 text-[10px] font-bold h-8 px-2">
                    <Calendar className="h-3 w-3 mr-1" /> Book
                </Button>
            )}
            
            {!isApptOnly && (
                isWalkInOnly ? (
                    <Button onClick={(e) => { e.stopPropagation(); onSelect(); }} size="sm" className="flex-1 text-[10px] font-bold bg-white text-green-700 border border-green-200 hover:bg-green-50 shadow-sm h-8 px-2">
                        <Footprints className="h-3 w-3 mr-1" /> Walk-In
                    </Button>
                ) : (
                    <Button onClick={(e) => { e.stopPropagation(); onQueue(); }} size="sm" className="flex-1 text-[10px] font-bold bg-slate-900 text-white shadow-sm hover:shadow hover:-translate-y-0.5 transition-all h-8 px-2">
                        <Zap className="h-3 w-3 mr-1 fill-current" /> Queue
                    </Button>
                )
            )}

            <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors h-8 w-8 flex items-center justify-center" title="Get Directions" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        </div>
    </div>
  );
};
