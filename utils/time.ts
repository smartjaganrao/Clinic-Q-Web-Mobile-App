
import { Doctor, Clinic, TimeSlot, SessionMode, Patient, PatientStatus } from "../types";

// Get current time in clinic's timezone
export const getClinicCurrentTime = (timezone?: string) => {
    const now = new Date();
    // For now, handle common timezones. In production, use a proper timezone library
    let offsetHours = 0;
    if (timezone === 'Asia/Kolkata') {
        offsetHours = 5.5; // IST is UTC+5:30
    } else if (timezone === 'Asia/Dubai') {
        offsetHours = 4; // GST is UTC+4
    } else if (timezone === 'Europe/London') {
        offsetHours = 0; // GMT/BST
    } else if (timezone === 'America/New_York') {
        offsetHours = -5; // EST, simplified
    } else if (timezone === 'Asia/Shanghai') {
        offsetHours = 8; // CST
    } else {
        // Default to client's local time if timezone not recognized
        return now;
    }

    // Calculate the time in clinic timezone
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (offsetHours * 3600000));
};

export const parseTimeMins = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let [_, h, m, p] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);

    if (p) {
        const isPm = p.toUpperCase() === 'PM';
        if (isPm && hours !== 12) hours += 12;
        if (!isPm && hours === 12) hours = 0;
    }
    
    return hours * 60 + minutes;
};

export const isClinicOpen = (hours?: string, timezone?: string) => {
    if (!hours) return false;
    if (hours.toLowerCase() === '24 hours') return true;
    try {
        const now = getClinicCurrentTime(timezone);
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startStr, endStr] = hours.split('-').map(s => s.trim());
        if (!startStr || !endStr) return false;
        
        const startMins = parseTimeMins(startStr);
        const endMins = parseTimeMins(endStr);
        if (startMins === null || endMins === null) return false;

        // Handle overnight shifts
        if (endMins <= startMins) {
            return currentMins >= startMins || currentMins <= endMins;
        }

        return currentMins >= startMins && currentMins <= endMins;
    } catch (e) {
        return false;
    }
};

export const formatTime12h = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr);
    const m = mStr.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${m} ${ampm}`;
};

// --- HELPERS ---
export const getLocalToday = (timezone?: string) => {
    const d = getClinicCurrentTime(timezone);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDoctorTodayShift = (doc: Doctor) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === today);
    if (!schedule || schedule.isOff || !schedule.slots?.length) return 'Off Today';
    return schedule.slots
        .filter(s => s.active !== false)
        .map(s => {
            const modeLabel = s.mode === SessionMode.APPOINTMENT ? '(Appt Only)' : s.mode === SessionMode.WALK_IN ? '(Walk-in)' : '';
            return `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)} ${modeLabel}`;
        })
        .join(', ');
};

export const isDoctorShiftActive = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
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

export const hasAvailableSlotsTomorrow = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrow = new Date(getClinicCurrentTime(clinic.timezone));
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayName = days[tomorrow.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === tomorrowDayName);

    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    // Check if there are any slots that allow appointments (HYBRID or APPOINTMENT)
    return schedule.slots.some(shift => shift.active !== false && (shift.mode === SessionMode.HYBRID || shift.mode === SessionMode.APPOINTMENT || !shift.mode));
};

export const hasShiftsToday = (doc: Doctor, clinic: Clinic) => {
    if (!clinic) return false;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date(getClinicCurrentTime(clinic.timezone));
    const todayDayName = days[today.getDay()];
    const schedule = doc.weeklySchedule.find(s => s.day === todayDayName);

    if (!schedule || schedule.isOff || !schedule.slots?.length) return false;

    return schedule.slots.some(shift => shift.active !== false);
};

export const getActiveSession = (doctor: Doctor, clinic: Clinic): TimeSlot | null => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = getClinicCurrentTime(clinic.timezone);
    const dayName = days[now.getDay()];
    const schedule = doctor.weeklySchedule.find(s => s.day === dayName);
    
    if (!schedule || schedule.isOff || !schedule.slots) return null;

    const currentMins = now.getHours() * 60 + now.getMinutes();

    return schedule.slots.find(shift => {
        if (shift.active === false) return false;
        const [sh, sm] = shift.startTime.split(':').map(Number);
        const [eh, em] = shift.endTime.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        let endTotal = eh * 60 + em;
        if (endTotal <= startTotal) endTotal += 1440;
        return currentMins >= startTotal && currentMins < endTotal;
    }) || null;
};

export const getQueueSorter = (mode: SessionMode) => {
    const timeToMins = (t?: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    return (a: Patient, b: Patient) => {
        // Priority 1: Emergency (Always Top)
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
        if (a.isEmergency && b.isEmergency) return a.timeAdded - b.timeAdded;

        // Manual Override
        if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
             const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
             const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
             if (orderA !== orderB) return orderA - orderB;
        }

        // Session Specific Sorting
        if (mode === SessionMode.APPOINTMENT) {
             const timeA = a.appointmentTime ? timeToMins(a.appointmentTime) : Number.MAX_SAFE_INTEGER;
             const timeB = b.appointmentTime ? timeToMins(b.appointmentTime) : Number.MAX_SAFE_INTEGER;
             if (timeA !== timeB) return timeA - timeB;
        } 
        
        else if (mode === SessionMode.HYBRID) {
             const isApptA = a.visitType === 'APPOINTMENT';
             const isApptB = b.visitType === 'APPOINTMENT';

             if (isApptA && isApptB) {
                  return timeToMins(a.appointmentTime) - timeToMins(b.appointmentTime);
             }
             if (isApptA && !isApptB) return -1; // Appt before Walk-in
             if (!isApptA && isApptB) return 1;  // Walk-in after Appt
             
             return a.timeAdded - b.timeAdded;
        }

        return a.timeAdded - b.timeAdded;
    };
};

// --- VALIDATION HELPERS ---

export const validateShiftWithinClinicHours = (shiftStart: string, shiftEnd: string, clinicHours: string): boolean => {
    if (!clinicHours || clinicHours.toLowerCase() === '24 hours') return true;
    
    // Assuming clinicHours format "09:00 AM - 09:00 PM" (multiple shifts comma separated not handled fully here for simplicity, taking first block or assuming simple range)
    // If clinic allows multiple shifts, we need to check if the doctor shift falls within ANY of the clinic shifts.
    
    const clinicShifts = clinicHours.split(',').map(s => {
        const [start, end] = s.split('-').map(t => t.trim());
        return { start: parseTimeMins(start), end: parseTimeMins(end) };
    });

    const docStart = parseTimeMins(shiftStart);
    const docEnd = parseTimeMins(shiftEnd);

    if (docStart === null || docEnd === null) return false;
    
    let docEndAdjusted = docEnd;
    if (docEnd <= docStart) docEndAdjusted += 1440; // Overnight

    // Check if the doctor shift is fully contained within at least one clinic shift
    return clinicShifts.some(clinicShift => {
        if (clinicShift.start === null || clinicShift.end === null) return false;
        let clinicEndAdjusted = clinicShift.end;
        if (clinicEndAdjusted <= clinicShift.start) clinicEndAdjusted += 1440;

        // Simple containment check
        // NOTE: This logic assumes day-aligned shifts. Complex overnight logic might need more robust Date handling.
        return docStart >= clinicShift.start && docEndAdjusted <= clinicEndAdjusted;
    });
};

export const hasSlotOverlap = (slots: TimeSlot[]): boolean => {
    if (!slots || slots.length < 2) return false;
    
    const sorted = [...slots].sort((a, b) => {
        const sa = parseTimeMins(a.startTime) || 0;
        const sb = parseTimeMins(b.startTime) || 0;
        return sa - sb;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i+1];
        
        if (!current.active || !next.active) continue;

        const startA = parseTimeMins(current.startTime) || 0;
        let endA = parseTimeMins(current.endTime) || 0;
        if (endA <= startA) endA += 1440;

        const startB = parseTimeMins(next.startTime) || 0;
        
        if (startB < endA) return true; // Overlap detected
    }
    return false;
};
