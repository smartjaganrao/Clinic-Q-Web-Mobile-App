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
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED', // For No-Shows / Absent
  ON_HOLD = 'ON_HOLD'  // New status for paused consultations
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

export enum ClinicType {
    GENERAL = 'GENERAL',
    PEDIATRIC = 'PEDIATRIC',
    GYNECOLOGY = 'GYNECOLOGY',
    ORTHOPEDIC = 'ORTHOPEDIC',
    DENTAL = 'DENTAL',
    CARDIOLOGY = 'CARDIOLOGY',
    DERMATOLOGY = 'DERMATOLOGY',
    EMERGENCY = 'EMERGENCY',
    OTHER = 'OTHER'
}

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  active?: boolean;  // allow marking slot active/inactive
  label?: string;    // optional human label for presets
}

export interface DaySchedule {
  day: string; // 'Monday', 'Tuesday', etc.
  // A list of time slots for the day. Empty array means OFF.
  slots: TimeSlot[];
  isOff?: boolean; // optional convenience flag (keeps backward compat where used)
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  roomNumber: string;
  isAvailable: boolean;
  status: DoctorStatus; // New field for detailed status
  statusUpdateTime?: number; // New: Timestamp when status changed (for timers)
  delayStartTime?: number; // New: Timestamp when delay started (separate from status)
  delayMinutes: number; // New field for delays
  avatarUrl?: string;
  weeklySchedule: DaySchedule[]; // New: 7-day specific schedule
  consultationFee: number; // New: Individual fee
  rating: number; // New: Individual rating
  reviewCount: number; // New: Individual review count
}

export interface PainPoint {
  x: number;
  y: number;
  label?: string;
}

export interface Vitals {
  bp?: string;
  temp?: string;
  weight?: string;
  pulse?: string;
  spo2?: string; // Oxygen Saturation
  height?: string; // cm or ft
  sugar?: string; // Blood Sugar mg/dL
  // Specialty Specific
  headCircumference?: string; // Pediatric
  fetalHeartRate?: string; // Gynecology
  lmp?: string; // Gynecology
  pregnancyWeek?: string; // Gynecology
  painScale?: string; // Ortho
  triageColor?: 'RED' | 'YELLOW' | 'GREEN'; // Emergency
  gcsScore?: string; // Emergency
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
  diagnosis?: string; // New: Short diagnosis
  visitType: 'WALK_IN' | 'APPOINTMENT';
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // e.g. "10:20"
  isEmergency?: boolean; // New: Priority flag
  isCheckedIn?: boolean; // New: QR Check-in status
  vitals?: Vitals; // New: Vitals
  painPoints?: PainPoint[]; // New: Body map coordinates
  rating?: number; // New: 1-5 stars
  feedback?: string; // New: Patient feedback
  // New Demographic Fields
  age?: string;
  gender?: 'Male' | 'Female' | 'Other';
  symptoms?: string; // Reason for visit
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
  type?: ClinicType; 
  doctors: Doctor[];
  patients: Patient[];
  // Location Data
  city: string; // New: City for filtering
  address: string;
  pincode: string;
  coordinates?: { x: number, y: number }; // Mock coordinates for map viz (0-100%)
  geoLocation?: { lat: number, lng: number }; // Real GPS coordinates for distance calc
  operatingHours?: string; // e.g. "09:00 AM - 09:00 PM"
  // Details
  about?: string; // New: Description
  amenities?: string[]; // New: List of facilities (Pharmacy, Parking, etc.)
  acceptedInsurances?: string[]; // New: List of accepted insurance providers
  // Admin Data
  subscriptionStatus?: 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE';
  joinedDate?: number;
}

// Pricing Types
export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}