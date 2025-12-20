
import React from 'react';
import { Doctor, Clinic, ClinicOperationMode, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Clock, Calendar, Zap, Building2, Stethoscope, ShieldCheck, MapPin, ChevronRight, Star } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col h-auto break-inside-avoid-column mb-4 hover:border-primary-300">
      {/* DOCTOR HEADER */}
      <div className="p-4 flex gap-4 border-b border-slate-50 bg-white">
        <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 shadow-inner">
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white shadow-md border border-slate-100 p-1 rounded-lg flex items-center text-[8px] font-black text-primary-600 uppercase px-1.5">
                <ShieldCheck className="h-2.5 w-2.5 fill-current mr-0.5" /> Verified
            </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-slate-900 text-base md:text-lg truncate group-hover:text-primary-600 transition-colors leading-tight">{doctor.name}</h3>
                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100 flex-shrink-0">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-black">{doctor.rating.toFixed(1)}</span>
                </div>
            </div>
            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                <Stethoscope className="h-3 w-3" /> {doctor.specialty}
            </p>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" /> {doctor.experience || 5}+ YRS
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                    BIO <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </div>
      </div>

      {/* LOCATIONS LIST */}
      <div className="flex-1 bg-white">
          <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" /> {locations.length} Clinic{locations.length > 1 ? 's' : ''}
              </span>
          </div>
          
          <div className="divide-y divide-slate-100">
              {locations.map(({ clinic, docInstance, distance }) => {
                  const shift = getTodayShift(docInstance);
                  const isAvailable = docInstance.status === DoctorStatus.AVAILABLE && shift !== 'Off Today';
                  const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                  
                  return (
                      <div key={clinic.id} className="p-4 hover:bg-slate-50/20 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">{clinic.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                          <span className="truncate">{clinic.city}</span>
                                      </div>
                                      {distance !== null && (
                                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-lg border border-indigo-100 flex items-center gap-0.5">
                                              {distance.toFixed(1)}KM
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                  <span className="text-sm font-black text-slate-900">
                                      ₹{docInstance.consultationFee}
                                  </span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">FEE</span>
                              </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-4">
                              <div className="flex flex-col min-w-0">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Operating Shift</span>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                                      <Clock className="h-3 w-3 text-primary-500 flex-shrink-0" />
                                      <span className="truncate">{shift}</span>
                                  </div>
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); onBook(clinic, docInstance); }} 
                                className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-1.5 active:scale-95 transform hover:scale-105 ${isAvailable && canQueueOnline ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                              >
                                  {isAvailable && canQueueOnline ? <Zap className="h-3.5 w-3.5 fill-current" /> : <Calendar className="h-3.5 w-3.5" />}
                                  {isAvailable && canQueueOnline ? 'Get Token' : 'Book Slot'}
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      <div className="bg-slate-50 p-2 text-center border-t border-slate-100 mt-auto">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
              SmartQFlow Cloud Profile
          </p>
      </div>
    </div>
  );
};
