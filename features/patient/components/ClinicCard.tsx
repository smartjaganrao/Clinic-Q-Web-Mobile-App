import React from 'react';
import { Clinic, Doctor } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, Star, MapPin, Clock, Calendar, Zap, ExternalLink } from 'lucide-react';

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
  return (
    <div 
        id={`clinic-card-${clinic.id}`}
        ref={cardRef}
        className={`bg-white rounded-2xl border p-0 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative overflow-hidden
            ${isHighlighted ? 'border-primary-500 ring-4 ring-primary-100 bg-primary-50 scale-[1.02] z-10' : 'border-slate-200'}`}
    >
        <div className="p-4 md:p-5 flex gap-3 md:gap-4 cursor-pointer" onClick={onSelect}>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                {clinic.imageUrl ? (
                    <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                ) : (
                    <Building2 className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
                )}
                {/* Simplified Badge for Image Overlay */}
                <div className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-1 text-white uppercase tracking-wider ${waitInfo.mapColor}`}>
                    {waitInfo.raw}m
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-base md:text-lg truncate leading-tight group-hover:text-primary-600 transition-colors">{clinic.name}</h3>
                    <span className="flex items-center text-xs font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex-shrink-0"><Star className="h-3 w-3 mr-1 fill-current" /> {rating}</span>
                </div>
                
                {/* Doctor Avatars Row */}
                <div className="mb-3">
                    {relevantDoctors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {relevantDoctors.slice(0, 3).map(d => (
                                <button 
                                    key={d.id} 
                                    onClick={(e) => { e.stopPropagation(); onViewDoctor(d); }}
                                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 px-2 py-1 rounded-lg transition-colors group/doc"
                                >
                                    <img src={d.avatarUrl} className="w-4 h-4 rounded-full bg-slate-200" alt="" />
                                    <span className="text-xs font-bold text-slate-700 group-hover/doc:text-primary-700">Dr. {d.name.split(' ').pop()}</span>
                                </button>
                            ))}
                            {relevantDoctors.length > 3 && <span className="text-slate-400 text-xs self-center">+{relevantDoctors.length - 3} more</span>}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400 italic">No matching doctors</div>
                    )}
                </div>

                {/* Info Row: Distance & Fee */}
                <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {distLabel}</span>
                    <span className="flex items-center gap-1"><IndianRupeeIcon className="h-3 w-3" /> {feeRange}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {clinic.operatingHours || '09:00 - 21:00'}</span>
                </div>

                {/* NEW: LIVE QUEUE STATUS BAR */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${waitInfo.bgColor} ${waitInfo.borderColor} mt-2`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${waitInfo.dotColor} animate-pulse shadow-sm flex-shrink-0`} />
                    <div className="flex flex-col leading-none">
                        <span className={`text-[10px] font-black uppercase tracking-wide ${waitInfo.textColor}`}>
                            {waitInfo.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mt-0.5">
                            <span>~{waitInfo.raw} mins</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full mx-0.5" />
                            <span className="opacity-80">{waitInfo.peopleCount} people ahead</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center gap-2">
            <Button onClick={(e) => { e.stopPropagation(); onBook(); }} variant="secondary" size="sm" className="flex-1 bg-white border-slate-200 text-slate-700 hover:text-primary-700 hover:border-primary-200 text-xs font-bold h-9">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Book Appt
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); onQueue(); }} size="sm" className="flex-1 text-xs font-bold bg-slate-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all h-9">
                <Zap className="h-3.5 w-3.5 mr-1.5 fill-current" /> Join Queue
            </Button>
            <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors h-9 w-9 flex items-center justify-center" title="Get Directions" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-4 w-4" />
            </a>
        </div>
    </div>
  );
};