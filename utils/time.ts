import { Doctor, Clinic } from "../types";

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

export const isClinicOpen = (hours?: string, timezone?: string) => {
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
            if (!isPm && hour === 12) hour = 0; // 12 AM is 00:00
            return hour * 60 + min;
        };
        const startMins = parseToMins(startStr);
        const endMins = parseToMins(endStr);
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
        .map(s => `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`)
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

    return schedule.slots.some(shift => shift.active !== false);
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