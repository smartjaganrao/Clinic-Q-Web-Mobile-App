
import React from 'react';
import { Doctor, Clinic, ClinicOperationMode, DoctorStatus } from '../../../types';
import { Button } from '../../../components/Button';
import { Clock, Building2, Stethoscope, ShieldCheck, ChevronRight, Star, Languages, GraduationCap } from 'lucide-react';

// Helper functions for clinic and shift availability
const getClinicCurrentTime = (timezone?: string) => {
    const now = new Date();
    let offsetHours = 0;
    if (timezone === 'Asia/Kolkata') {
        offsetHours = 5.5;
    } else if (timezone === 'Asia/Dubai') {
        offsetHours = 4;
    } else if (timezone === 'Europe/London') {
        offsetHours = 0;
    } else if (timezone === 'America/New_York') {
        offsetHours = -5;
    } else if (timezone === 'Asia/Shanghai') {
        offsetHours = 8;
    }
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (offsetHours * 3600000));
};

const isClinicOpen = (hours?: string, timezone?: string) => {
    if (!hours) return false;
    if (hours.toLowerCase() === '24 hours') return true;
    try {
        const now = getClinicCurrentTime(timezone);
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startStr, endStr] = hours.split('-').map(s => s.trim());
        if (!startStr || !endStr) return false;
        const parseToMins = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return null;
            let [_, h, m, p] = match;
            let hour = parseInt(h);
            const min = parseInt(m);
            const isPm = p.toUpperCase() === 'PM';
            if (isPm && hour !== 12) hour += 12;
            if (!isPm && hour === 12) hour = 0;
            return hour * 60 + min;
        };
        const startMins = parseToMins(startStr);
        const endMins = parseToMins(endStr);
        if (startMins === null || endMins === null) return false;
        return currentMins >= startMins && currentMins <= endMins;
    } catch (e) {
        return false;
    }
};

const isDoctorShiftActive = (doc: Doctor, clinic: Clinic) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = getClinicCurrentTime(clinic.timezone);
    const dayName = days[now.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === dayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    const currentMins = now.getHours() * 60 + now.getMinutes();

    return schedule.slots.some(shift => {
        if (shift.active === false) return false;
        const [sh, sm] = shift.startTime.split(':').map(Number);
        const [eh, em] = shift.endTime.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        let endTotal = eh * 60 + em;
        if (endTotal <= startTotal) endTotal += 1440;

        const isStarted = currentMins >= startTotal;
        const isEnded = currentMins >= endTotal;
        return isStarted && !isEnded;
    });
};

const hasAvailableSlotsTomorrow = (doc: Doctor, clinic: Clinic) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrow = new Date(getClinicCurrentTime(clinic.timezone));
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayName = days[tomorrow.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === tomorrowDayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    return schedule.slots.some(shift => shift.active !== false);
};

interface DoctorLocation {
    clinic: Clinic;
    docInstance: Doctor;
    distance: number | null;
}

interface DoctorSearchCardProps {
  doctor: Doctor;
  locations: DoctorLocation[];
  onBook: (clinic: Clinic, doctor: Doctor) => void;
  onClick?: () => void;
}

export const DoctorSearchCard: React.FC<DoctorSearchCardProps> = ({
  doctor, locations, onBook, onClick
}) => {

  // Get summary info for the doctor
  const getDoctorSummary = () => {
    const totalClinics = locations.length;
    const availableClinics = locations.filter(({ clinic, docInstance }) => {
      const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
      const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
      const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
      const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
      const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
      return (canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow) || (canBookAppointments && hasSlotsTomorrow);
    }).length;

    const minFee = Math.min(...locations.map(({ docInstance }) => docInstance.consultationFee));
    const maxFee = Math.max(...locations.map(({ docInstance }) => docInstance.consultationFee));

    return { totalClinics, availableClinics, minFee, maxFee };
  };

  const summary = getDoctorSummary();

  return (
    <div className={`bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer mb-2 sm:mb-4 ${onClick ? 'hover:border-primary-300' : ''}`} onClick={onClick}>
      {/* TOP SECTION - DOCTOR HEADER WITH PERFECT ALIGNMENT */}
      <div className="p-2 pb-2">
        {/* TOP ROW: AVATAR + NAME + RATING */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 relative">
              <div className="w-14 h-16 rounded-lg bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white shadow-lg border border-slate-100 p-0.5 rounded-full flex items-center">
                <ShieldCheck className="h-2.5 w-2.5 text-primary-600 fill-current" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900 text-sm leading-tight truncate group-hover:text-primary-600 transition-colors">
                    {doctor.name}
                  </h3>
                  <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <Stethoscope className="h-3 w-3" />
                    {doctor.specialty}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-[9px] font-black">{doctor.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* EXPERIENCE & QUALIFICATIONS - Moved below specialty */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-slate-400" />
                  {doctor.experience || 5}+ Years
                </span>
                {doctor.languages && doctor.languages.length > 0 && (
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                    <Languages className="h-2.5 w-2.5 text-slate-400" />
                    {doctor.languages.slice(0, 2).join(', ')}
                  </span>
                )}
                {doctor.education && doctor.education.length > 0 && (
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                    <GraduationCap className="h-2.5 w-2.5 text-slate-400" />
                    {doctor.education[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CLINIC LOCATIONS - More prominent */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Available at {summary.totalClinics} Clinic{summary.totalClinics > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-0.5">
            {locations.slice(0, 2).map(({ clinic, distance }) => (
              <div key={clinic.id} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full ${isClinicOpen(clinic.operatingHours, clinic.timezone) ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <span className="text-[9px] font-bold text-slate-700 truncate">{clinic.name}</span>
                </div>
                {distance !== null && (
                  <span className="text-[8px] font-bold text-blue-600 flex-shrink-0 ml-2">
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>
            ))}
            {locations.length > 2 && (
              <div className="text-[8px] font-bold text-slate-500 text-center">
                +{locations.length - 2} more clinics
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: PRICING + AVAILABILITY + CTA */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              ₹{summary.minFee}{summary.minFee !== summary.maxFee ? ` - ₹${summary.maxFee}` : ''}
            </div>
            {summary.availableClinics > 0 ? (
              <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                {summary.availableClinics} Available Now
              </span>
            ) : (
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">
                Book Tomorrow
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-primary-600 group-hover:text-primary-700 transition-colors">
            <span className="text-[10px] font-bold">View Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
