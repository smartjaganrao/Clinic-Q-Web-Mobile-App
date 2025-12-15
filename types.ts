
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

export enum ClinicOperationMode {
    WALK_IN = 'WALK_IN',       // Reception adds tokens, Patients view only
    APPOINTMENT = 'APPOINTMENT', // Pre-booked slots only
    HYBRID = 'HYBRID'          // Both allowed
}

export interface TimeSlot {
    id?: string;
    startTime: string; // "09:00"
    endTime: string;   // "13:00"
    label?: string;    // "Morning Shift"
    active?: boolean;  // allow marking slot active/inactive
}

export interface DaySchedule {
  day: string; // 'Monday', 'Tuesday', etc.
  slots: TimeSlot[]; // Flexible multiple slots
  isOff: boolean;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Doctor {
  id: string;
  masterId: string; // NEW: Unique ID linking same doctor across clinics
  name: string;
  mobile: string; // NEW: Unique identifier for linking
  registrationNumber?: string; // NEW: Medical Reg No
  email?: string; // NEW
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
  consultationTime: number; // New: Avg time per patient in minutes
  rating: number; // New: Individual rating
  reviewCount: number; // New: Individual review count
  // Rich Profile Fields
  bio?: string;
  education?: string[];
  languages?: string[];
  experience?: number; // Years of experience
  reviews?: Review[];
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
  timeStarted?: number; // NEW: Consultation Start Time
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
  queueOrder?: number; // Manual override for sorting
  nextOfKin?: { // New: Emergency Contact
      name: string;
      phone: string;
  };
  address?: string;
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
}

export interface Staff {
  id: string;
  name: string;
  role: 'RECEPTIONIST' | 'NURSE' | 'MANAGER';
  phone: string;
  isActive: boolean;
  joinedDate: number;
}

export interface ClinicStats {
  totalPatients: number;
  avgWaitTime: number; // in minutes
  completedToday: number;
}

// Renamed from Notification to AppNotification to avoid conflict with DOM Notification API
export interface AppNotification {
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
  operationMode: ClinicOperationMode; // New: Clinic Operational Mode
  doctors: Doctor[];
  patients: Patient[];
  staff: Staff[]; // New: Staff list
  // Location Data
  city: string; // New: City for filtering
  address: string;
  pincode: string;
  coordinates?: { x: number, y: number }; // Mock coordinates for map viz (0-100%)
  geoLocation?: { lat: number, lng: number }; // Real GPS coordinates for distance calc
  operatingHours?: string; // e.g. "09:00 AM - 09:00 PM"
  imageUrl?: string; // New: Clinic Image URL
  contactPhone?: string; // New: Clinic Contact Phone
  // Details
  about?: string; // New: Description
  amenities?: string[]; // New: List of facilities (Pharmacy, Parking, etc.)
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

// Super Admin Profile
export interface AdminProfile {
  name: string;
  email: string;
  role: 'SUPER_ADMIN';
  avatarUrl: string;
  lastLogin: string;
}

// Global declaration to fix JSX IntrinsicElements error
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      div: any;
      span: any;
      p: any;
      button: any;
      input: any;
      label: any;
      select: any;
      option: any;
      img: any;
      form: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      br: any;
      nav: any;
      header: any;
      main: any;
      section: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      th: any;
      td: any;
      ul: any;
      li: any;
      textarea: any;
      a: any;
      svg: any;
      path: any;
      circle: any;
      rect: any;
      g: any;
      aside: any;
    }
  }
}
