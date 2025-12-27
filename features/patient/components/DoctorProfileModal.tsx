
import React, { useState } from 'react';
import { Doctor, ClinicOperationMode, Review, Clinic } from '../../../types';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Clock, GraduationCap, Languages, Calendar, User, MessageSquare, Zap, ShieldCheck } from 'lucide-react';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  operationMode?: ClinicOperationMode;
  clinic?: Clinic;
  onBook: () => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({ isOpen, onClose, doctor, operationMode, clinic, onBook }) => {
  if (!doctor) return null;

  const canQueue = operationMode && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(operationMode);
  const canBookAppointments = operationMode && [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(operationMode);

  // Check if clinic is open and doctor shift is active
  const isClinicOpen = clinic ? (() => {
    if (!clinic.operatingHours) return false;
    if (clinic.operatingHours.toLowerCase() === '24 hours') return true;
    try {
      const now = new Date();
      const clinicTime = new Date(now.toLocaleString("en-US", {timeZone: clinic.timezone}));
      const currentMins = clinicTime.getHours() * 60 + clinicTime.getMinutes();
      const [startStr, endStr] = clinic.operatingHours.split('-').map(s => s.trim());
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
  })() : true;

  const isDoctorShiftActive = clinic && doctor ? (() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const clinicTime = new Date(now.toLocaleString("en-US", {timeZone: clinic.timezone}));
    const dayName = days[clinicTime.getDay()];
    const schedule = doctor.weeklySchedule.find(s => s.day === dayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    const currentMins = clinicTime.getHours() * 60 + clinicTime.getMinutes();

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
  })() : true;

  const hasAvailableSlotsTomorrow = clinic && doctor ? (() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrow = new Date();
    const clinicTime = new Date(tomorrow.toLocaleString("en-US", {timeZone: clinic.timezone}));
    clinicTime.setDate(clinicTime.getDate() + 1);
    const tomorrowDayName = days[clinicTime.getDay()];
    const schedule = doctor.weeklySchedule.find(s => s.day === tomorrowDayName);
    
    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    return schedule.slots.some(shift => shift.active !== false);
  })() : true;

  const canGetToken = canQueue && isClinicOpen && isDoctorShiftActive;
  const canBookForTomorrow = canBookAppointments && hasAvailableSlotsTomorrow;

  // Safely access arrays with fallbacks
  const education = doctor.education || [];
  const languages = doctor.languages || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Doctor Profile" maxWidth="max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <img 
            src={doctor.avatarUrl} 
            alt={doctor.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" 
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
             <h2 className="text-2xl font-bold text-slate-900">{doctor.name}</h2>
             <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary-100 uppercase tracking-wide">Verified</span>
          </div>
          <p className="text-lg text-slate-600 mb-2">{doctor.specialty}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
              <Clock className="h-4 w-4" /> {doctor.experience || 5}+ Years Exp.
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">
              <ShieldCheck className="h-4 w-4" /> Registration Verified
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <div className="pb-3 text-sm font-bold text-primary-600 border-b-2 border-primary-600 px-4">
          About & Credentials
        </div>
      </div>

      <div className="min-h-[200px]">
        <div className="space-y-6 animate-in fade-in">
          {doctor.bio && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-primary-600" /> Biography
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary-600" /> Education
              </h4>
              <ul className="space-y-2">
                {education.map((edu, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                    {edu}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary-600" /> Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button 
          onClick={(canGetToken || canBookForTomorrow) ? onBook : undefined} 
          disabled={!(canGetToken || canBookForTomorrow)}
          className={`shadow-lg shadow-primary-200 px-8 whitespace-nowrap ${!(canGetToken || canBookForTomorrow) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {(canGetToken || canBookForTomorrow) ? <Zap className="h-4 w-4 mr-2 fill-current" /> : <Calendar className="h-4 w-4 mr-2" />}
          {canGetToken ? (canQueue ? "Get Token / Join Queue" : "Book Appointment") : canBookForTomorrow ? "Book Tomorrow" : "Unavailable"}
        </Button>
      </div>
    </Modal>
  );
};
