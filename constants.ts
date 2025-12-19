
import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType, Patient, TimeSlot, Review, AdminProfile, Staff, ClinicOperationMode } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const genId = () => Math.random().toString(36).substr(2, 5);

// Expanded schedule with 3 distinct shifts
const createMultiShiftSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    slots: day === 'Sunday' ? [] : [
      { id: genId(), startTime: '08:00', endTime: '12:00', label: 'Morning Shift', active: true },
      { id: genId(), startTime: '14:00', endTime: '17:00', label: 'Afternoon Shift', active: true },
      { id: genId(), startTime: '18:00', endTime: '22:00', label: 'Evening Shift', active: true }
    ],
    isOff: day === 'Sunday'
  }));
};

// --- DATA GENERATORS ---

const PATIENT_NAMES = [
  "Aarav Sharma", "Vivaan Gupta", "Aditya Reddy", "Vihaan Nair", "Arjun Das", "Sai Kumar", "Reyansh Jain", "Ayan Mehta",
  "Krishna Desai", "Ishaan Joshi", "Shaurya Krishnan", "Atharva Raman", "Dhruv Verma", "Kabir Malhotra",
  "Ananya Iyer", "Diya Patel", "Gauri Singh", "Isha Rao", "Kavya Das", "Khushi Mehta", "Kiara Desai", "Myra Joshi",
  "Nandini Krishnan", "Pari Raman", "Prisha Verma", "Riya Malhotra", "Saanvi Iyer", "Samaira Patel", "Sara Singh",
  "Ishani Bose", "Advait Kulkarni", "Tanuja Hegde", "Rohan Mehra", "Meera Nanda", "Vikram Sethi"
];

const BIOS = [
    "Dedicated specialist with over 15 years of experience in clinical excellence and patient-centered care.",
    "Patient-focused physician specializing in preventive healthcare and long-term chronic disease management.",
    "Expert in complex diagnostic procedures and modern treatment methodologies with a focus on minimally invasive techniques.",
    "Compassionate healthcare provider committed to personalized patient care and empathetic communication.",
    "Board-certified professional with a background in academic research and advanced surgical procedures."
];

// Helper to generate a specific patient
const createPatient = (id: string, token: number, name: string, docId: string, status: PatientStatus, type: 'WALK_IN' | 'APPOINTMENT', extra: Partial<Patient> = {}): Patient => ({
    id,
    tokenNumber: token,
    name,
    phone: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    status,
    doctorId: docId,
    timeAdded: Date.now() - (Math.random() * 7200000), // Within last 2 hours
    visitType: type,
    isCheckedIn: type === 'WALK_IN' || !!extra.isCheckedIn,
    age: (2 + Math.floor(Math.random() * 80)).toString(),
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    ...extra
});

// --- DOCTOR DEFINITIONS ---

const createDoc = (id: string, name: string, specialty: string, room: string, status: DoctorStatus = DoctorStatus.AVAILABLE, delay: number = 0): Doctor => ({
    id,
    masterId: `master_${id}`,
    name,
    mobile: `99${id.replace(/\D/g, '').padStart(8, '0')}`,
    email: `${id}@smartqflow.com`,
    password: 'password',
    specialty,
    roomNumber: room,
    isAvailable: status === DoctorStatus.AVAILABLE,
    status,
    delayMinutes: delay,
    avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
    weeklySchedule: createMultiShiftSchedule(),
    consultationFee: 400 + (Math.floor(Math.random() * 12) * 50),
    consultationTime: 15,
    rating: 4.5 + (Math.random() * 0.5),
    reviewCount: 50 + Math.floor(Math.random() * 200),
    experience: 5 + Math.floor(Math.random() * 20),
    bio: BIOS[Math.floor(Math.random() * BIOS.length)],
    education: ["MBBS", "MD / MS - Specialization"],
    languages: ["English", "Hindi", "Tamil", "Telugu"]
});

// --- CLINIC DATA GENERATION (CHENNAI ONLY) ---

// 1. Apollo: Anna Nagar (HYBRID_FULL)
const apolloDocs = [
    { ...createDoc('apollo_1', 'Dr. Ravi Kumar', 'General Physician', '101'), email: 'ravi@demo.com' },
    createDoc('apollo_2', 'Dr. Lakshmi Narayan', 'Pediatrician', '102', DoctorStatus.ON_BREAK),
    createDoc('apollo_3', 'Dr. S. K. Gupta', 'Cardiologist', '103')
];
const apolloPatients = [
    createPatient('ap_p1', 1, 'Aarav Sharma', 'apollo_1', PatientStatus.WITH_DOCTOR, 'WALK_IN'),
    createPatient('ap_p2', 2, 'Vivaan Gupta', 'apollo_1', PatientStatus.WAITING, 'WALK_IN'),
    createPatient('ap_p3', 3, 'Ananya Iyer', 'apollo_1', PatientStatus.WAITING, 'APPOINTMENT', { appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: '10:00', isCheckedIn: false }),
];

// 2. Ambattur Medical Centre (DIRECT_WALK_IN)
const ambatturDocs = [
    createDoc('amb_1', 'Dr. Suresh Menon', 'General Surgeon', '401', DoctorStatus.AVAILABLE, 10),
    createDoc('amb_2', 'Dr. Tanuja Hegde', 'Dermatologist', '405')
];
const ambatturPatients = [
    createPatient('amb_p1', 101, 'Kabir Malhotra', 'amb_1', PatientStatus.WITH_DOCTOR, 'WALK_IN'),
    createPatient('amb_p2', 102, 'Riya Malhotra', 'amb_1', PatientStatus.WAITING, 'WALK_IN'),
];

// 3. Avadi Multi-Specialty (BOTH_WALK_IN)
const avadiDocs = [
    createDoc('avd_1', 'Dr. Anjali Rao', 'Dentist', 'D-1'),
    createDoc('avd_2', 'Dr. Krishna Moorthy', 'Orthodontist', 'D-2')
];
const avadiPatients = [
    createPatient('avd_p1', 51, 'Atharva Raman', 'avd_1', PatientStatus.WITH_DOCTOR, 'WALK_IN'),
    createPatient('avd_p2', 52, 'Samaira Patel', 'avd_1', PatientStatus.WAITING, 'WALK_IN', { isCheckedIn: false }),
];

// 4. Thirumullaivoyal Health Clinic (ONLINE_WALK_IN)
const thiruDocs = [
    createDoc('thiru_1', 'Dr. Meera Iyer', 'Gynecologist', 'G-01'),
    createDoc('thiru_2', 'Dr. Sanjay Dutt', 'ENT Specialist', 'E-02')
];
const thiruPatients = [
    createPatient('thiru_p1', 201, 'Sai Kumar', 'thiru_1', PatientStatus.WITH_DOCTOR, 'WALK_IN'),
    createPatient('thiru_p2', 202, 'Kiara Desai', 'thiru_1', PatientStatus.WAITING, 'WALK_IN', { isCheckedIn: false }),
];

// 5. Mogappair Specialty Clinic (HYBRID_DIRECT_APPT)
const mogDocs = [
    createDoc('mog_1', 'Dr. Vikram Reddy', 'Ophthalmologist', 'A-205'),
    createDoc('mog_2', 'Dr. Meera Nanda', 'Diabetologist', 'A-206')
];
const mogPatients = [
    createPatient('mog_p1', 301, 'Arjun Das', 'mog_1', PatientStatus.WITH_DOCTOR, 'WALK_IN'),
    createPatient('mog_p2', 302, 'Sara Singh', 'mog_1', PatientStatus.WAITING, 'APPOINTMENT', { appointmentTime: '11:30', isCheckedIn: true }),
];

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic_apollo',
    name: 'Apollo Clinic',
    slug: 'apollo-anna-nagar',
    plan: PlanType.SMALL,
    type: ClinicType.GENERAL,
    operationMode: ClinicOperationMode.HYBRID_FULL,
    city: 'Chennai',
    address: 'Anna Nagar 4th Avenue, near Metro Station',
    pincode: '600040',
    operatingHours: '08:00 AM - 10:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    geoLocation: { lat: 13.0850, lng: 80.2100 },
    doctors: apolloDocs,
    patients: apolloPatients,
    staff: [{ id: 'staff_1', name: 'Priya', role: 'RECEPTIONIST', phone: '9876543210', email: 'admin@demo.com', password: 'password', isActive: true, joinedDate: Date.now() }],
    about: "Apollo Clinic Anna Nagar is a flagship primary healthcare facility offering multi-specialty consultations and advanced diagnostics.",
    amenities: ['Pharmacy', 'Pathology Lab', 'X-Ray', 'Ambulance']
  },
  {
    id: 'clinic_ambattur',
    name: 'Ambattur Medical Centre',
    slug: 'ambattur-medical-centre',
    plan: PlanType.SOLO,
    type: ClinicType.GENERAL,
    operationMode: ClinicOperationMode.DIRECT_WALK_IN,
    city: 'Chennai',
    address: 'MTH Road, Near Ambattur OT',
    pincode: '600053',
    operatingHours: '09:00 AM - 09:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    geoLocation: { lat: 13.1143, lng: 80.1548 },
    doctors: ambatturDocs,
    patients: ambatturPatients,
    staff: [],
    about: "A trusted neighborhood clinic serving Ambattur with general consultation and emergency support.",
    amenities: ['Pharmacy', 'Lab', 'Emergency Unit']
  },
  {
    id: 'clinic_avadi',
    name: 'Avadi Multi-Specialty Hospital',
    slug: 'avadi-hospital',
    plan: PlanType.SMALL,
    type: ClinicType.GENERAL,
    operationMode: ClinicOperationMode.BOTH_WALK_IN,
    city: 'Chennai',
    address: 'Avadi Main Road, near Kamaraj Nagar',
    pincode: '600054',
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    geoLocation: { lat: 13.1154, lng: 80.1172 },
    doctors: avadiDocs,
    patients: avadiPatients,
    staff: [],
    about: "Leading hospital in Avadi providing comprehensive surgical and medical facilities.",
    amenities: ['24/7 Pharmacy', 'In-patient Rooms', 'ICU']
  },
  {
    id: 'clinic_thiru',
    name: 'Thirumullaivoyal Health Clinic',
    slug: 'thirumullaivoyal-health',
    plan: PlanType.SOLO,
    type: ClinicType.GYNECOLOGY,
    operationMode: ClinicOperationMode.ONLINE_WALK_IN,
    city: 'Chennai',
    address: 'CTH Road, Thirumullaivoyal',
    pincode: '600062',
    operatingHours: '10:00 AM - 08:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=600',
    geoLocation: { lat: 13.1311, lng: 80.1314 },
    doctors: thiruDocs,
    patients: thiruPatients,
    staff: [],
    about: "Modern specialized clinic with focus on women's health and ENT treatments in Thirumullaivoyal.",
    amenities: ['Specialized Suites', 'WiFi', 'Hearing Aid Lab']
  },
  {
    id: 'clinic_mogappair',
    name: 'Mogappair Specialty Clinic',
    slug: 'mogappair-specialty',
    plan: PlanType.PREMIUM,
    type: ClinicType.OTHER,
    operationMode: ClinicOperationMode.HYBRID_DIRECT_APPT,
    city: 'Chennai',
    address: 'Mogappair West Main Road',
    pincode: '600037',
    operatingHours: '09:00 AM - 09:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600',
    geoLocation: { lat: 13.0837, lng: 80.1748 },
    doctors: mogDocs,
    patients: mogPatients,
    staff: [],
    about: "Specialized eye care and diabetes management clinic in the heart of Mogappair.",
    amenities: ['Optical Store', 'Blood Sugar Lab', 'Parking']
  }
];

export const INITIAL_DOCTORS: Doctor[] = INITIAL_CLINICS[0].doctors;

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Solo Clinic',
    price: '₹1,250',
    features: ['Smart hybrid queue', 'Live waiting time', 'Reception dashboard', 'Doctor dashboard', 'TV display', 'Unlimited patients']
  },
  {
    name: 'Standard',
    price: '₹3,000',
    features: ['Everything in Solo', 'Multi-doctor management', 'Multi-counter reception', 'Digital vitals', 'Quick prescriptions', 'AI summaries'],
    recommended: true
  },
  {
    name: 'Premium',
    price: '₹6,000',
    features: ['Everything in Standard', 'Chain management', 'Telemedicine module', 'API access', 'Priority support', 'Advanced analytics']
  }
];

export const APP_NAME = "SmartQFlow";

export const SUPER_ADMIN_PROFILE: AdminProfile = {
  name: "Arjun Venkat",
  email: "arjun@smartqflow.com",
  role: "SUPER_ADMIN",
  avatarUrl: "https://i.pravatar.cc/150?u=super_admin",
  lastLogin: new Date().toLocaleString()
};
