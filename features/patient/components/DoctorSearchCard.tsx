import React from 'react';
import { Doctor, Clinic } from '../../../types';
import { Button } from '../../../components/Button';
import { Star, Clock, Timer, Calendar, Zap, Building2, Stethoscope, Globe } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-4 flex gap-4">
        {/* Avatar Section */}
        <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-inner">
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
            {doctor.rating && (
                <div className="absolute -bottom-2 -right-2 bg-white shadow-sm border border-slate-100 px-1.5 py-0.5 rounded-md flex items-center text-[10px] font-bold text-slate-700">
                    <Star className="h-3 w-3 text-yellow-500 fill-current mr-0.5" /> {doctor.rating}
                </div>
            )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-primary-600 transition-colors">{doctor.name}</h3>
                    <p className="text-sm text-primary-600 font-medium flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> {doctor.specialty}
                    </p>
                </div>
                <div className="text-right">
                    <span className="block font-bold text-slate-900">₹{doctor.consultationFee}</span>
                    <span className="text-[10px] text-slate-500">Consultation</span>
                </div>
            </div>

            <div className="mt-2 text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" /> 
                    <span className="font-semibold text-slate-700">{clinic.name}</span>
                    <span className="text-slate-300">•</span>
                    <span>{distLabel}</span>
                </p>
                
                {/* Live Status Row */}
                {isWalkInAllowed ? (
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 font-bold text-[10px]">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live Queue
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {doctor.experience || 5} Yrs Exp
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {doctor.experience || 5} Yrs Exp</span>
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {doctor.languages?.slice(0,2).join(', ')}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center gap-2">
          <div className="flex-1">
              <div className={`text-xs font-bold flex items-center gap-1 ${isWalkInAllowed ? 'text-green-600' : 'text-slate-500'}`}>
                  {isWalkInAllowed ? <Zap className="h-3 w-3 fill-current" /> : <Calendar className="h-3 w-3" />}
                  {nextSlotLabel}
              </div>
          </div>
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onViewProfile(); }} className="h-9 text-xs px-3 font-bold bg-white border-slate-200">
              Profile
          </Button>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onBook(); }} className="h-9 text-xs px-4 font-bold shadow-md">
              Book Visit
          </Button>
      </div>
    </div>
  );
};