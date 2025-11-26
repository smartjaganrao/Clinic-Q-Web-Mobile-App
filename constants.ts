
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
  // Expanded list of specialties for category search
  const specialties = [
    'General Physician', 
    'Pediatrician', 
    'Cardiologist', 
    'Dermatologist', 
    'Dentist', 
    'Orthopedic', 
    'Gynecologist',
    'ENT Specialist'
  ];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `doc_${prefix}_${startId + i}`,
    name: `Dr. ${['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Reddy', 'Kumar', 'Das'][i % 8]}`,
    specialty: specialties[i % specialties.length],
    roomNumber: `${100 + i + 1}`,
    isAvailable: true,
    status: DoctorStatus.AVAILABLE,
    delayMinutes: 0,
    avatarUrl: `https://picsum.photos/100/100?random=${startId + i}`,
    weeklySchedule: createDefaultSchedule(),
    // Randomize Fee between 300 and 1000
    consultationFee: Math.floor(Math.random() * (1000 - 300 + 1) + 300),
    // Randomize Rating between 3.5 and 5.0
    rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 100) + 10
  }));
};

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic_1',
    name: 'City Care Clinic',
    slug: 'city-care',
    plan: PlanType.SOLO,
    city: 'Bangalore',
    address: '12, MG Road, Indiranagar',
    pincode: '560038',
    operatingHours: '08:00 AM - 09:00 PM',
    coordinates: { x: 30, y: 40 },
    geoLocation: { lat: 12.9716, lng: 77.6412 }, // Indiranagar, Bangalore
    doctors: createDoctors(1, 1, 'c1'),
    patients: [
      { 
        id: 'p1', 
        name: 'Rohan Gupta', 
        phone: '9998887771', 
        tokenNumber: 101, 
        status: PatientStatus.WITH_DOCTOR, 
        doctorId: 'doc_c1_1', 
        timeAdded: Date.now() - 1000 * 60 * 20, // 20 mins ago
        visitType: 'WALK_IN',
        age: '28',
        gender: 'Male',
        symptoms: 'High Fever & Cold',
        isCheckedIn: true,
        isEmergency: false
      },
      { 
        id: 'p2', 
        name: 'Anita Desai', 
        phone: '9998887772', 
        tokenNumber: 102, 
        status: PatientStatus.WAITING, 
        doctorId: 'doc_c1_1', 
        timeAdded: Date.now() - 1000 * 60 * 5, // 5 mins ago
        visitType: 'WALK_IN',
        age: '34',
        gender: 'Female',
        symptoms: 'Migraine Headache',
        isCheckedIn: true,
        isEmergency: false
      },
    ]
  },
  {
    id: 'clinic_2',
    name: 'Green Valley Hospital',
    slug: 'green-valley',
    plan: PlanType.SMALL,
    city: 'Bangalore',
    address: 'Plot 45, Tech Park Road, Whitefield',
    pincode: '560066',
    operatingHours: '24 Hours',
    coordinates: { x: 65, y: 70 },
    geoLocation: { lat: 12.9698, lng: 77.7500 }, // Whitefield, Bangalore
    doctors: createDoctors(1, 4, 'c2'), // Increased doctor count to show diverse categories
    patients: [
      { 
        id: 'p3', 
        name: 'Vikram Singh', 
        phone: '9876543210', 
        tokenNumber: 201, 
        status: PatientStatus.WAITING, 
        doctorId: 'doc_c2_1', 
        timeAdded: Date.now() - 1000 * 60 * 30, 
        visitType: 'WALK_IN',
        age: '45',
        gender: 'Male',
        symptoms: 'Back Pain',
        isCheckedIn: true
      },
      { 
        id: 'p4', 
        name: 'Priya Mehta', 
        phone: '9876543211', 
        tokenNumber: 202, 
        status: PatientStatus.WAITING, 
        doctorId: 'doc_c2_2', 
        timeAdded: Date.now() - 1000 * 60 * 10, 
        visitType: 'WALK_IN',
        age: '6',
        gender: 'Female',
        symptoms: 'Stomach Ache',
        isCheckedIn: true
      }
    ]
  },
  {
    id: 'clinic_3',
    name: 'Smile Dental & Ortho',
    slug: 'smile-dental',
    plan: PlanType.SOLO,
    city: 'Bangalore',
    address: '88, 5th Block, Koramangala',
    pincode: '560034',
    operatingHours: '10:00 AM - 08:00 PM',
    coordinates: { x: 45, y: 25 },
    geoLocation: { lat: 12.9352, lng: 77.6245 }, // Koramangala
    doctors: [
        {
            id: 'doc_c3_1',
            name: 'Dr. Neha Reddy',
            specialty: 'Dentist',
            roomNumber: 'D-1',
            isAvailable: true,
            status: DoctorStatus.AVAILABLE,
            delayMinutes: 0,
            avatarUrl: `https://picsum.photos/100/100?random=99`,
            weeklySchedule: createDefaultSchedule(),
            consultationFee: 400,
            rating: 4.8,
            reviewCount: 124
        }
    ],
    patients: []
  },
  {
    id: 'clinic_4',
    name: 'Mumbai Heart Institute',
    slug: 'mumbai-heart',
    plan: PlanType.SMALL,
    city: 'Mumbai',
    address: '101, Bandra West, Near Sea Link',
    pincode: '400050',
    operatingHours: '09:00 AM - 06:00 PM',
    coordinates: { x: 20, y: 80 },
    geoLocation: { lat: 19.0596, lng: 72.8295 },
    doctors: [
        {
            id: 'doc_c4_1',
            name: 'Dr. Arjun Kapoor',
            specialty: 'Cardiologist',
            roomNumber: 'H-101',
            isAvailable: true,
            status: DoctorStatus.AVAILABLE,
            delayMinutes: 0,
            avatarUrl: `https://picsum.photos/100/100?random=102`,
            weeklySchedule: createDefaultSchedule(),
            consultationFee: 1200,
            rating: 4.9,
            reviewCount: 312
        }
    ],
    patients: []
  },
  {
    id: 'clinic_5',
    name: 'Chennai Care Hospital',
    slug: 'chennai-care',
    plan: PlanType.SMALL,
    city: 'Chennai',
    address: '45, Anna Salai, Guindy',
    pincode: '600032',
    operatingHours: '24 Hours',
    coordinates: { x: 60, y: 60 },
    geoLocation: { lat: 13.0067, lng: 80.2206 },
    doctors: [
        {
            id: 'doc_c5_1',
            name: 'Dr. S. Raman',
            specialty: 'Orthopedic',
            roomNumber: '202',
            isAvailable: true,
            status: DoctorStatus.AVAILABLE,
            delayMinutes: 0,
            avatarUrl: `https://picsum.photos/100/100?random=108`,
            weeklySchedule: createDefaultSchedule(),
            consultationFee: 600,
            rating: 4.5,
            reviewCount: 89
        },
        {
            id: 'doc_c5_2',
            name: 'Dr. Priya Kumar',
            specialty: 'Gynecologist',
            roomNumber: '203',
            isAvailable: true,
            status: DoctorStatus.AVAILABLE,
            delayMinutes: 0,
            avatarUrl: `https://picsum.photos/100/100?random=109`,
            weeklySchedule: createDefaultSchedule(),
            consultationFee: 700,
            rating: 4.7,
            reviewCount: 156
        }
    ],
    patients: []
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
