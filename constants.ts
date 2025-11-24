import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createDefaultSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    startTime: '09:00',
    endTime: '17:00',
    isOff: day === 'Sunday' // Default Sunday off
  }));
};

// Helper to create doctors
const createDoctors = (startId: number, count: number, prefix: string): Doctor[] => {
  const specialties = ['General Physician', 'Pediatrician', 'Cardiologist', 'Dermatologist'];
  return Array.from({ length: count }).map((_, i) => ({
    id: `doc_${prefix}_${startId + i}`,
    name: `Dr. ${['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh'][i % 5]}`,
    specialty: specialties[i % specialties.length],
    roomNumber: `${100 + i + 1}`,
    isAvailable: true,
    status: DoctorStatus.AVAILABLE,
    delayMinutes: 0,
    avatarUrl: `https://picsum.photos/100/100?random=${startId + i}`,
    weeklySchedule: createDefaultSchedule()
  }));
};

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic_1',
    name: 'City Care Clinic',
    slug: 'city-care',
    plan: PlanType.SOLO,
    address: '12, MG Road, Indiranagar',
    pincode: '560038',
    coordinates: { x: 30, y: 40 },
    doctors: createDoctors(1, 1, 'c1'),
    patients: [
      { id: 'p1', name: 'Rohan Gupta', phone: '9998887771', tokenNumber: 101, status: PatientStatus.WITH_DOCTOR, doctorId: 'doc_c1_1', timeAdded: Date.now(), visitType: 'WALK_IN' },
      { id: 'p2', name: 'Anita Desai', phone: '9998887772', tokenNumber: 102, status: PatientStatus.WAITING, doctorId: 'doc_c1_1', timeAdded: Date.now(), visitType: 'WALK_IN' },
    ]
  },
  {
    id: 'clinic_2',
    name: 'Green Valley Hospital',
    slug: 'green-valley',
    plan: PlanType.SMALL,
    address: 'Plot 45, Tech Park Road, Whitefield',
    pincode: '560066',
    coordinates: { x: 65, y: 70 },
    doctors: createDoctors(1, 3, 'c2'),
    patients: [
      { id: 'p3', name: 'Vikram Singh', phone: '9876543210', tokenNumber: 201, status: PatientStatus.WAITING, doctorId: 'doc_c2_1', timeAdded: Date.now(), visitType: 'WALK_IN' },
      { id: 'p4', name: 'Priya Mehta', phone: '9876543211', tokenNumber: 202, status: PatientStatus.WAITING, doctorId: 'doc_c2_2', timeAdded: Date.now(), visitType: 'WALK_IN' }
    ]
  }
];

export const INITIAL_DOCTORS: Doctor[] = INITIAL_CLINICS[0].doctors; // Fallback for legacy refs

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Solo Clinic',
    price: '₹799',
    features: [
      '1 Doctor',
      'Unlimited Patients',
      'Basic Dashboard',
      'WhatsApp Alerts'
    ]
  },
  {
    name: 'Small Hospital',
    price: '₹1,999',
    features: [
      'Up to 5 Doctors',
      'Multi-queue Management',
      'Patient History',
      'Auto Reminders'
    ],
    recommended: true
  },
  {
    name: 'Premium',
    price: '₹3,999',
    features: [
      '10+ Doctors',
      'Advanced Analytics',
      'No-show Prediction',
      'Custom Branding',
      'Kiosk Support'
    ]
  }
];

export const APP_NAME = "ClinicQ";