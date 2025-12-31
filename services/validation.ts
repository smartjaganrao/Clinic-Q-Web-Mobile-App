import { ClinicDayConfig } from '../types';

/**
 * Converts "HH:mm" string to minutes from midnight.
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Validates if a Doctor's proposed schedule fits within Clinic Working Hours.
 * Returns { isValid: boolean, error?: string }
 */
export const validateDoctorSchedule = (
  clinicConfig: ClinicDayConfig | undefined,
  docStart: string,
  docEnd: string
): { isValid: boolean; error?: string } => {
  
  // 1. BACKWARD COMPATIBILITY: If no config exists, allow everything.
  if (!clinicConfig) {
    return { isValid: true };
  }

  // 2. Check if clinic is closed
  if (!clinicConfig.isOpen) {
    return { isValid: false, error: "Clinic is closed on this day." };
  }

  const docStartMin = timeToMinutes(docStart);
  const docEndMin = timeToMinutes(docEnd);

  // 3. Boundary Check (Inner Allocation Rule)
  let fitsInShift = false;
  if (clinicConfig.shifts) {
    for (const shift of clinicConfig.shifts) {
      const shiftStartMin = timeToMinutes(shift.start);
      const shiftEndMin = timeToMinutes(shift.end);

      // Strict Subset Check: ShiftStart <= DocStart AND DocEnd <= ShiftEnd
      if (docStartMin >= shiftStartMin && docEndMin <= shiftEndMin) {
        fitsInShift = true;
        break;
      }
    }
  }

  if (!fitsInShift) {
    return { isValid: false, error: "Schedule is outside clinic working hours." };
  }

  return { isValid: true };
};