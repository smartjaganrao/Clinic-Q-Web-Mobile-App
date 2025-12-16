
import React from 'react';
import { Doctor, Clinic, ClinicOperationMode } from '../../../types';
import { Button } from '../../../components/Button';
import { Star, Clock, Timer, Calendar, Zap, Building2, Stethoscope, Globe, Footprints } from 'lucide-react';

interface DoctorSearchCardProps {
  doctor: Doctor;
  clinic: Clinic;
  distLabel: string;
  nextSlotLabel: string;
  isWalkInAllowed: boolean;
  onBook: () => void;
  onViewProfile: () => void;
}

export const DoctorSearchCard: React.FC<DoctorSearchCardProps> = ({
  doctor, clinic, distLabel, nextSlotLabel, isWalkInAllowed, onBook, onViewProfile
}) => {
  const canQueue = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const canBook = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
  const isDirectWalkIn = clinic.operationMode === ClinicOperationMode.DIRECT_WALK_IN;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full flex flex-col">
      <div className="p-3 md:p-4 flex gap-3 flex-1">
        {/* Avatar Section */}
        <div className="flex-shrink-0 relative">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 shadow-inner">
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
            {doctor.rating && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-white shadow-sm border border-slate-100 px-1 py-0.5 rounded flex items-center text-[9px] font-bold text-slate-700">
                    <Star className="h-2.5 w-2.5 text-yellow-500 fill-current mr-0.5" /> {doctor.rating}
                </div>
            )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-900 text-sm md:text-base truncate group-hover:text-primary-600 transition-colors leading-tight">{doctor.name}</h3>
                    <p className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-0.5">
                        <Stethoscope className="h-3 w-3" /> {doctor.specialty}
                    </p>
                </div>
                <div className="text-right leading-none">
                    <span className="block font-bold text-slate-900 text-xs md:text-sm">₹{doctor.consultationFee}</span>
                </div>
            </div>

            <div className="mt-2 text-[10px] md:text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1">
                    <Building2 className="h-2.5 w-2.5 text-slate-400" /> 
                    <span className="font-semibold text-slate-700 truncate max-w-[100px]">{clinic.name}</span>
                    <span className="text-slate-300">•</span>
                    <span>{distLabel}</span>
                </p>
                
                {/* Live Status Row */}
                {isWalkInAllowed && canQueue ? (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 font-bold text-[9px]">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live Queue
                        </span>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {doctor.experience || 5} Yrs Exp
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {doctor.experience || 5} Yrs</span>
                        <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> {doctor.languages?.slice(0,1).join(', ')}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex items-center gap-2 mt-auto">
          <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold flex items-center gap-1 truncate ${canQueue || isDirectWalkIn ? 'text-green-600' : 'text-slate-500'}`}>
                  {isDirectWalkIn ? <Footprints className="h-3 w-3" /> : (canQueue && isWalkInAllowed ? <Zap className="h-3 w-3 fill-current" /> : <Calendar className="h-3 w-3" />)}
                  {isDirectWalkIn ? 'Walk-in Only' : nextSlotLabel}
              </div>
          </div>
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onViewProfile(); }} className="h-8 text-[10px] px-2 font-bold bg-white border-slate-200">
              Profile
          </Button>
          {canBook ? (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onBook(); }} className="h-8 text-[10px] px-3 font-bold shadow-sm">
                  Book
              </Button>
          ) : (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onBook(); }} className="h-8 text-[10px] px-3 font-bold shadow-sm bg-white text-green-700 border border-green-200 hover:bg-green-50">
                  Details
              </Button>
          )}
      </div>
    </div>
  );
};
