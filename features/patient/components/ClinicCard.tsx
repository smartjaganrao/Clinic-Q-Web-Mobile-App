
import React from 'react';
import { Clinic, Doctor } from '../../../types';
import { Button } from '../../../components/Button';
import { Building2, Star, MapPin, Clock, Timer, Calendar, Zap, ExternalLink } from 'lucide-react';

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
  waitInfo: { label: string; color: string; mapColor: string; raw: string; };
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
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic, waitInfo, feeRange, rating, distLabel, gmapsLink, relevantDoctors, isHighlighted, cardRef, onSelect, onBook, onQueue
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
                <div className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-1 text-white uppercase tracking-wider ${waitInfo.mapColor}`}>
                    {waitInfo.label}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-base md:text-lg truncate leading-tight group-hover:text-primary-600 transition-colors">{clinic.name}</h3>
                    <span className="flex items-center text-xs font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex-shrink-0"><Star className="h-3 w-3 mr-1 fill-current" /> {rating}</span>
                </div>
                <div className="mb-2">
                    {relevantDoctors.length > 0 ? (
                        <div className="text-sm font-medium text-slate-700 truncate">
                            <span className="text-slate-400 font-normal mr-1">Doctors:</span> 
                            {relevantDoctors.slice(0, 2).map(d => `Dr. ${d.name.split(' ').pop()}`).join(', ')}
                            {relevantDoctors.length > 2 && <span className="text-slate-400 text-xs ml-1">+{relevantDoctors.length - 2} more</span>}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400 italic">No matching doctors</div>
                    )}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {distLabel}</span>
                        <span className="flex items-center gap-1"><IndianRupeeIcon className="h-3 w-3" /> {feeRange}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {clinic.operatingHours || '09:00 - 21:00'}</span>
                            <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {waitInfo.raw}m Wait</span>
                    </div>
                </div>
            </div>
        </div>
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
