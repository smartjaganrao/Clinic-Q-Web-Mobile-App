import React from 'react';
import { Doctor, Clinic, ClinicOperationMode, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Clock, Calendar, Zap, Building2, Stethoscope, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';

interface DoctorLocation {
    clinic: Clinic;
    docInstance: Doctor;
    distance: number | null;
}

interface DoctorSearchCardProps {
  doctor: Doctor;
  locations: DoctorLocation[];
  onBook: (clinic: Clinic, doctor: Doctor) => void;
  onViewProfile: () => void;
}

export const DoctorSearchCard: React.FC<DoctorSearchCardProps> = ({
  doctor, locations, onBook, onViewProfile
}) => {
  
  const getTodayShift = (doc: Doctor) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const schedule = doc.weeklySchedule.find(s => s.day === today);
      if (!schedule || schedule.isOff || !schedule.slots?.length) return 'Off Today';
      return schedule.slots.filter(s => s.active !== false).map(s => `${s.startTime}-${s.endTime}`).join(', ');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col h-auto break-inside-avoid-column mb-4">
      {/* DOCTOR HEADER */}
      <div className="p-3 flex gap-3 border-b border-slate-50 bg-white">
        <div className="flex-shrink-0 relative">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-inner">
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white shadow-sm border border-slate-100 p-0.5 rounded flex items-center text-[7px] font-black text-primary-600 uppercase px-1">
                <ShieldCheck className="h-2 w-2 fill-current mr-0.5" /> Verified
            </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900 text-sm md:text-base truncate group-hover:text-primary-600 transition-colors leading-tight">{doctor.name}</h3>
            <p className="text-[11px] text-primary-600 font-bold flex items-center gap-1 mt-0.5">
                <Stethoscope className="h-3 w-3" /> {doctor.specialty}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {doctor.experience || 5}+ Yrs
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                    Bio <ChevronRight className="h-2.5 w-2.5" />
                </button>
            </div>
        </div>
      </div>

      {/* LOCATIONS LIST */}
      <div className="flex-1 bg-white">
          <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="h-2.5 w-2.5" /> {locations.length} Location{locations.length > 1 ? 's' : ''}
              </span>
          </div>
          
          <div className="divide-y divide-slate-100">
              {locations.map(({ clinic, docInstance, distance }) => {
                  const shift = getTodayShift(docInstance);
                  const isAvailable = docInstance.status === DoctorStatus.AVAILABLE && shift !== 'Off Today';
                  
                  return (
                      <div key={clinic.id} className="p-3 hover:bg-slate-50/10 transition-colors">
                          <div className="flex justify-between items-start mb-1.5">
                              <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-slate-800 text-xs truncate leading-tight">{clinic.name}</h4>
                                  <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{clinic.city}</span>
                                      {distance !== null && (
                                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded flex items-center gap-0.5 ml-1">
                                              <MapPin className="h-2 w-2" /> {distance.toFixed(1)}km
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                  <span className="text-[10px] font-bold text-slate-900">
                                      ₹{docInstance.consultationFee}
                                  </span>
                              </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2">
                              <div className="flex flex-col min-w-0">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Today</span>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 truncate">
                                      <Clock className="h-2.5 w-2.5 text-primary-500 flex-shrink-0" />
                                      <span className="truncate">{shift}</span>
                                  </div>
                              </div>
                              
                              <Button 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); onBook(clinic, docInstance); }} 
                                className={`h-7 text-[10px] px-2 font-bold shadow-sm transition-all flex-shrink-0 ${isAvailable ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                              >
                                  {isAvailable ? <Zap className="h-2.5 w-2.5 mr-0.5 fill-current" /> : <Calendar className="h-2.5 w-2.5 mr-0.5" />}
                                  {isAvailable ? 'Join' : 'Book'}
                              </Button>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      <div className="bg-slate-50 p-1.5 text-center border-t border-slate-100 mt-auto">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              SmartQFlow Master Profile
          </p>
      </div>
    </div>
  );
};