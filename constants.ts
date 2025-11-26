
import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createDefaultSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    startTime: '09:00',
    endTime: '17:00',
    isOff: day === 'Sunday' // Default Sunday off
  }));
};

// Helper to create doctors with realistic profiles
const createRealDoctors = (startId: number, count: number, specialty: string, feeRange: [number, number]): Doctor[] => {
  const names = [
    'Dr. Ravi Kumar', 'Dr. Lakshmi Narayanan', 'Dr. Anita Desai', 'Dr. Suresh Menon', 
    'Dr. Priya Krishnan', 'Dr. Rajeshwari S', 'Dr. Vikram Reddy', 'Dr. Meera Iyer',
    'Dr. Sanjay Gupta', 'Dr. Anjali Rao', 'Dr. Deepak Thomas', 'Dr. Sarah John',
    'Dr. Karthik Raja', 'Dr. Swathi Balaji', 'Dr. Arjun Das', 'Dr. Nithya Ram'
  ];
  
  const qualMap: Record<string, string> = {
      'Cardiologist': 'MD, DM (Cardio)',
      'Dermatologist': 'MD (DVL)',
      'Dentist': 'BDS, MDS',
      'Orthopedic': 'MS (Ortho)',
      'Gynecologist': 'MBBS, DGO',
      'Pediatrician': 'MD (Pediatrics)',
      'General Physician': 'MBBS, MD (Gen Med)',
      'Ophthalmologist': 'MBBS, MS (Ophth)',
      'ENT Specialist': 'MBBS, MS (ENT)'
  };

  return Array.from({ length: count }).map((_, i) => {
    const idVal = startId + i;
    // Deterministic random for consistency across reloads
    const rand = (idVal * 9301 + 49297) % 233280; 
    const fee = Math.floor(Math.random() * (feeRange[1] - feeRange[0] + 1) + feeRange[0]);
    const rating = (3.8 + (rand % 12) / 10).toFixed(1);
    
    return {
        id: `doc_${specialty.substring(0,3)}_${idVal}`,
        name: names[(idVal + i) % names.length],
        specialty: specialty,
        roomNumber: `${100 + i + 1}`,
        isAvailable: true,
        status: DoctorStatus.AVAILABLE,
        delayMinutes: 0,
        avatarUrl: `https://i.pravatar.cc/150?u=${idVal}`,
        weeklySchedule: createDefaultSchedule(),
        consultationFee: fee - (fee % 50), // Round to 50
        rating: parseFloat(rating),
        reviewCount: 50 + (rand % 400)
    };
  });
};

export const INITIAL_CLINICS: Clinic[] = [
  // --- CHENNAI CLINICS ---
  {
    id: 'clinic_chn_1',
    name: 'Apollo Clinic',
    slug: 'apollo-anna-nagar',
    plan: PlanType.SMALL,
    type: ClinicType.GENERAL,
    city: 'Chennai',
    address: 'Plot 12, 4th Avenue, Shanthi Colony, Anna Nagar',
    pincode: '600040',
    operatingHours: '08:00 AM - 09:00 PM',
    geoLocation: { lat: 13.0850, lng: 80.2100 },
    doctors: [
        ...createRealDoctors(100, 2, 'General Physician', [500, 700]),
        ...createRealDoctors(102, 1, 'Diabetologist', [700, 900])
    ],
    patients: []
  },
  {
    id: 'clinic_chn_2',
    name: 'Sankara Nethralaya',
    slug: 'sankara-nethralaya',
    plan: PlanType.PREMIUM,
    type: ClinicType.OTHER,
    city: 'Chennai',
    address: '41, College Road, Nungambakkam',
    pincode: '600006',
    operatingHours: '08:00 AM - 06:00 PM',
    geoLocation: { lat: 13.0629, lng: 80.2495 },
    doctors: createRealDoctors(200, 4, 'Ophthalmologist', [600, 1000]),
    patients: []
  },
  {
    id: 'clinic_chn_3',
    name: 'Cloudnine Hospital',
    slug: 'cloudnine-tnagar',
    plan: PlanType.PREMIUM,
    type: ClinicType.GYNECOLOGY,
    city: 'Chennai',
    address: '54, Vijaya Raghava Rd, T. Nagar',
    pincode: '600017',
    operatingHours: '24 Hours',
    geoLocation: { lat: 13.0350, lng: 80.2350 },
    doctors: [
        ...createRealDoctors(300, 3, 'Gynecologist', [800, 1200]),
        ...createRealDoctors(303, 2, 'Pediatrician', [700, 1000])
    ],
    patients: []
  },
  {
    id: 'clinic_chn_4',
    name: 'MIOT International',
    slug: 'miot-hospital',
    plan: PlanType.PREMIUM,
    type: ClinicType.ORTHOPEDIC,
    city: 'Chennai',
    address: '4/112, Mount Poonamallee Rd, Manapakkam',
    pincode: '600089',
    operatingHours: '24 Hours',
    geoLocation: { lat: 13.0280, lng: 80.1850 },
    doctors: createRealDoctors(400, 3, 'Orthopedic', [900, 1500]),
    patients: []
  },
  {
    id: 'clinic_chn_5',
    name: 'Parasu Dental Centre',
    slug: 'parasu-dental',
    plan: PlanType.SOLO,
    type: ClinicType.DENTAL,
    city: 'Chennai',
    address: '11, 3rd Cross St, Kasturba Nagar, Adyar',
    pincode: '600020',
    operatingHours: '10:00 AM - 08:00 PM',
    geoLocation: { lat: 13.0012, lng: 80.2565 },
    doctors: createRealDoctors(500, 2, 'Dentist', [400, 800]),
    patients: []
  },
  {
    id: 'clinic_chn_6',
    name: 'Fortis Malar Hospital',
    slug: 'fortis-malar',
    plan: PlanType.PREMIUM,
    type: ClinicType.CARDIOLOGY,
    city: 'Chennai',
    address: '52, 1st Main Rd, Gandhi Nagar, Adyar',
    pincode: '600020',
    operatingHours: '24 Hours',
    geoLocation: { lat: 13.0060, lng: 80.2580 },
    doctors: [
        ...createRealDoctors(600, 2, 'Cardiologist', [1000, 1800]),
        ...createRealDoctors(602, 1, 'General Physician', [600, 800])
    ],
    patients: []
  },
  {
    id: 'clinic_chn_7',
    name: 'Oliva Skin & Hair Clinic',
    slug: 'oliva-alwarpet',
    plan: PlanType.SOLO,
    type: ClinicType.DERMATOLOGY,
    city: 'Chennai',
    address: '2nd Floor, TTK Road, Alwarpet',
    pincode: '600018',
    operatingHours: '10:00 AM - 08:00 PM',
    geoLocation: { lat: 13.0330, lng: 80.2550 },
    doctors: createRealDoctors(700, 2, 'Dermatologist', [700, 1200]),
    patients: []
  },
  {
    id: 'clinic_chn_8',
    name: 'KKR ENT Hospital',
    slug: 'kkr-ent',
    plan: PlanType.SMALL,
    type: ClinicType.OTHER,
    city: 'Chennai',
    address: '827, Poonamallee High Rd, Kilpauk',
    pincode: '600010',
    operatingHours: '09:00 AM - 07:00 PM',
    geoLocation: { lat: 13.0780, lng: 80.2400 },
    doctors: createRealDoctors(800, 3, 'ENT Specialist', [600, 900]),
    patients: []
  },
  {
    id: 'clinic_chn_9',
    name: 'Dr. Mehta’s Hospitals',
    slug: 'mehtas-chetpet',
    plan: PlanType.SMALL,
    type: ClinicType.PEDIATRIC,
    city: 'Chennai',
    address: '2, McNichols Rd, Chetpet',
    pincode: '600031',
    operatingHours: '24 Hours',
    geoLocation: { lat: 13.0700, lng: 80.2380 },
    doctors: createRealDoctors(900, 4, 'Pediatrician', [600, 1000]),
    patients: []
  },

  // --- BANGALORE CLINICS (Legacy + Enhanced) ---
  {
    id: 'clinic_blr_1',
    name: 'Manipal Hospital',
    slug: 'manipal-old-airport',
    plan: PlanType.PREMIUM,
    type: ClinicType.GENERAL,
    city: 'Bangalore',
    address: '98, HAL Old Airport Rd, Kodihalli',
    pincode: '560017',
    operatingHours: '24 Hours',
    geoLocation: { lat: 12.9592, lng: 77.6475 },
    doctors: [
        ...createRealDoctors(1000, 2, 'Cardiologist', [1000, 1500]),
        ...createRealDoctors(1002, 2, 'Orthopedic', [900, 1400])
    ],
    patients: []
  },
  {
    id: 'clinic_blr_2',
    name: 'Ovum Woman & Child',
    slug: 'ovum-hrbr',
    plan: PlanType.SMALL,
    type: ClinicType.PEDIATRIC,
    city: 'Bangalore',
    address: '4th Block, HRBR Layout, Kalyan Nagar',
    pincode: '560043',
    operatingHours: '24 Hours',
    geoLocation: { lat: 13.0285, lng: 77.6400 },
    doctors: [
        ...createRealDoctors(1100, 2, 'Pediatrician', [600, 900]),
        ...createRealDoctors(1102, 2, 'Gynecologist', [700, 1000])
    ],
    patients: []
  },
  {
    id: 'clinic_blr_3',
    name: 'Clove Dental',
    slug: 'clove-indiranagar',
    plan: PlanType.SOLO,
    type: ClinicType.DENTAL,
    city: 'Bangalore',
    address: '12th Main Rd, Indiranagar',
    pincode: '560038',
    operatingHours: '10:00 AM - 08:00 PM',
    geoLocation: { lat: 12.9716, lng: 77.6412 },
    doctors: createRealDoctors(1200, 1, 'Dentist', [400, 800]),
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
