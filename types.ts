export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  KIOSK = 'KIOSK', // TV / Large Screen Display
  PATIENT = 'PATIENT', // Mobile Personal Tracker
  PUBLIC = 'PUBLIC' // Landing page
}

export enum PatientStatus {
  WAITING = 'WAITING',
  WITH_DOCTOR = 'WITH_DOCTOR',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DoctorStatus {
  AVAILABLE = 'AVAILABLE',
  ON_BREAK = 'ON_BREAK',
  OFF_DUTY = 'OFF_DUTY'
}

export enum PlanType {
  SOLO = 'Solo Clinic',
  SMALL = 'Small Hospital',
  PREMIUM = 'Premium'
}

export interface DaySchedule {
  day: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isOff: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  roomNumber: string;
  isAvailable: boolean;
  status: DoctorStatus; // New field for detailed status
  delayMinutes: number; // New field for delays
  avatarUrl?: string;
  weeklySchedule: DaySchedule[]; // New: 7-day specific schedule
}

export interface Patient {
  id: string;
  tokenNumber: number;
  name: string;
  phone: string;
  status: PatientStatus;
  doctorId: string; // Assigned doctor
  timeAdded: number; // Timestamp
  timeCompleted?: number;
  notes?: string;
  visitType: 'WALK_IN' | 'APPOINTMENT';
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // e.g. "10:20"
}

export interface ClinicStats {
  totalPatients: number;
  avgWaitTime: number; // in minutes
  completedToday: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  doctors: Doctor[];
  patients: Patient[];
  // Location Data
  address: string;
  pincode: string;
  coordinates?: { x: number, y: number }; // Mock coordinates for map viz (0-100%)
}

// Pricing Types
export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}