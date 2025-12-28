import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType, Patient, TimeSlot, Review, AdminProfile, Staff, ClinicOperationMode } from './types';
import { Stethoscope, Baby, Smile, Eye, Bone, Accessibility, Heart, Ear, Scissors, Sparkles, LayoutGrid } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const genId = () => Math.random().toString(36).substr(2, 5);

const createDefaultSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    slots: [
        { id: genId(), startTime: '09:00', endTime: '13:00', label: 'Morning Shift', active: true },
        { id: genId(), startTime: '17:00', endTime: '21:00', label: 'Evening Shift', active: true }
    ],
    isOff: false
  }));
};

// --- DATA GENERATORS ---

const SPECIALTIES = [
    'General Physician', 'Pediatrician', 'Dentist', 'Ophthalmologist', 
    'Orthopedic', 'Gynecologist', 'Cardiologist', 'Dermatologist', 'ENT Specialist', 'Surgeon'
];

const CLINIC_NAMES = [
    "Apollo Clinic", "Sankara Nethralaya", "Parasu Dental Centre", "Fortis Malar Hospital", "MIOT International",
    "Kauvery Hospital", "Gleneagles Global", "MGM Healthcare", "SIMS Hospital", "Vijaya Hospital",
    "Billroth Hospitals", "Prashanth Speciality", "Dr. Kamakshi Memorial", "Mehta's Hospital", "VS Hospitals",
    "Sooriya Hospital", "Sundaram Medical", "Madras Medical Mission", "Frontier Lifeline", "Hindu Mission Hospital",
    "SRM Institutes", "LifeLine Multispeciality", "G.G. Hospital", "A.A. Clinic", "Lotus Women's Clinic",
    "Smile Dental Care", "Kids Care Pediatric", "Ortho Specialty Clinic", "Skin & Beauty Derma", "Heart & Soul Cardiology"
];

const ADDRESSES = [
    "Anna Nagar", "T. Nagar", "Adyar", "Mylapore", "Velachery", 
    "Nungambakkam", "Besant Nagar", "Guindy", "Alwarpet", "Chromepet",
    "Egmore", "Kilpauk", "Kodambakkam", "Madipakkam", "Pallavaram",
    "Perambur", "Purasaiwakkam", "Saidapet", "Tambaram", "Thiruvanmiyur",
    "Ambattur", "Avadi", "Koyambedu", "Manapakkam", "Medavakkam",
    "Navalur", "Old Mahabalipuram Rd", "Porur", "Royapettah", "Santhome"
];

const OPERATION_MODES = [
    ClinicOperationMode.DIRECT_WALK_IN,
    ClinicOperationMode.ONLINE_WALK_IN,
    ClinicOperationMode.BOTH_WALK_IN,
    ClinicOperationMode.HYBRID_DIRECT_APPT,
    ClinicOperationMode.HYBRID_FULL
];

const PATIENT_NAMES = [
    "Aarav Sharma", "Vivaan Gupta", "Aditya Reddy", "Vihaan Nair", "Arjun Das", 
    "Sai Kumar", "Reyansh Jain", "Ayan Mehta", "Krishna Desai", "Ishaan Joshi"
];

// Helper to generate a specific patient
const createPatient = (id: string, token: number, name: string, docId: string, status: PatientStatus, type: 'WALK_IN' | 'APPOINTMENT', extra: Partial<Patient> = {}): Patient => ({
    id,
    tokenNumber: token,
    name,
    phone: name === "Aarav Sharma" ? "9876543210" : `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    status,
    doctorId: docId,
    timeAdded: Date.now() - (Math.random() * 3600000), 
    visitType: type,
    isCheckedIn: type === 'WALK_IN' || !!extra.isCheckedIn,
    age: (18 + Math.floor(Math.random() * 50)).toString(),
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    ...extra
});

const generateDoctors = (clinicId: string): Doctor[] => {
    return SPECIALTIES.map((spec, idx) => ({
        id: `doc_${clinicId}_${idx}`,
        masterId: `master_doc_${idx}`,
        name: `Dr. ${['Kumar', 'Reddy', 'Iyer', 'Nair', 'Sharma', 'Gupta', 'Patel', 'Das', 'Mehta', 'Joshi'][idx]}`,
        mobile: `99000${clinicId.replace(/\D/g, '')}${idx}`,
        email: `doc${idx}@${clinicId}.com`,
        password: 'password',
        specialty: spec,
        roomNumber: (100 + idx).toString(),
        isAvailable: true,
        status: DoctorStatus.AVAILABLE,
        delayMinutes: 0,
        avatarUrl: `https://i.pravatar.cc/150?u=doc_${clinicId}_${idx}`,
        weeklySchedule: createDefaultSchedule(),
        consultationFee: 400 + (idx * 50),
        consultationTime: 15,
        rating: 4.5 + (Math.random() * 0.5),
        reviewCount: 50 + Math.floor(Math.random() * 200),
        experience: 5 + idx,
        gender: idx % 3 === 1 ? 'Female' : 'Male', // Assign gender based on index
        bio: "Dedicated specialist committed to providing high-quality patient care and modern treatment methodologies.",
        education: ["MBBS", "MD Specialist"],
        languages: ["English", "Tamil", "Hindi"]
    }));
};

const generateClinics = (): Clinic[] => {
    return CLINIC_NAMES.map((name, idx) => {
        const id = `clinic_chn_${idx + 1}`;
        const doctors = generateDoctors(id);
        
        // Ensure Aarav Sharma (the demo user) is in the first clinic
        const patients = idx === 0 ? [
            createPatient('p_demo_1', 1, 'Aarav Sharma', doctors[0].id, PatientStatus.WITH_DOCTOR, 'WALK_IN'),
            createPatient('p_demo_2', 2, 'Vivaan Gupta', doctors[0].id, PatientStatus.WAITING, 'WALK_IN'),
            createPatient('p_demo_3', 3, 'Ananya Iyer', doctors[1].id, PatientStatus.WAITING, 'APPOINTMENT', { appointmentTime: '10:00' })
        ] : [
            createPatient(`p_${id}_1`, 1, PATIENT_NAMES[Math.floor(Math.random() * 10)], doctors[0].id, PatientStatus.WAITING, 'WALK_IN')
        ];

        return {
            id,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            plan: idx % 3 === 0 ? PlanType.PREMIUM : idx % 2 === 0 ? PlanType.SMALL : PlanType.SOLO,
            type: idx % 4 === 0 ? ClinicType.GENERAL : idx % 4 === 1 ? ClinicType.PEDIATRIC : idx % 4 === 2 ? ClinicType.DENTAL : ClinicType.OTHER,
            operationMode: OPERATION_MODES[idx % 5],
            city: 'Chennai',
            address: `${ADDRESSES[idx]}, Chennai`,
            pincode: `6000${(idx + 1).toString().padStart(2, '0')}`,
            timezone: 'Asia/Kolkata', // IST timezone for Chennai clinics
            operatingHours: idx % 4 === 0 ? '24 hours' : '09:00 AM - 09:00 PM', // Make every 4th clinic 24 hours
            imageUrl: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300&sig=${idx}`,
            geoLocation: { 
                lat: 13.0827 + (Math.random() - 0.5) * 0.1, 
                lng: 80.2707 + (Math.random() - 0.5) * 0.1 
            },
            doctors,
            patients,
            staff: idx === 0 ? [{ 
                id: 'staff_1', 
                name: 'Priya', 
                role: 'RECEPTIONIST', 
                phone: '9876543210', 
                email: 'admin@demo.com', 
                password: 'password', 
                isActive: true, 
                joinedDate: Date.now() 
            }] : []
        };
    });
};

export const INITIAL_CLINICS: Clinic[] = generateClinics();

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

export const CATEGORIES = [
    { id: 'ALL', label: 'All Specializations', icon: LayoutGrid },
    { id: 'general', label: 'General Physician', icon: Stethoscope },
    { id: 'pediatric', label: 'Pediatrician', icon: Baby },
    { id: 'dental', label: 'Dentist', icon: Smile },
    { id: 'ophthalmology', label: 'Ophthalmologist', icon: Eye },
    { id: 'orthopedic', label: 'Orthopedic', icon: Bone },
    { id: 'gynecology', label: 'Gynecologist', icon: Accessibility },
    { id: 'cardiology', label: 'Cardiologist', icon: Heart },
    { id: 'dermatology', label: 'Dermatologist', icon: Sparkles },
    { id: 'ent', label: 'ENT Specialist', icon: Ear },
    { id: 'surgery', label: 'Surgeon', icon: Scissors },
];

export const RELATIONSHIP_OPTIONS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

export const SYMPTOM_MAP: { [key: string]: string } = {
    'Fever, cough, sore throat': 'General Physician',
    'Child vaccination or illness': 'Pediatrician',
    'Toothache or dental check-up': 'Dentist',
    'Eye irritation or vision check': 'Ophthalmologist',
    'Joint pain or fracture': 'Orthopedic',
    'Pregnancy or women\'s health': 'Gynecologist',
    'Chest pain or high BP': 'Cardiologist',
    'Skin rash or acne': 'Dermatologist',
    'Ear pain or hearing issues': 'ENT Specialist',
    'Need for a surgical consultation': 'Surgeon'
};

export const SUPER_ADMIN_PROFILE: AdminProfile = {
  name: "Arjun Venkat",
  email: "arjun@smartqflow.com",
  role: "SUPER_ADMIN",
  avatarUrl: "https://i.pravatar.cc/150?u=super_admin",
  lastLogin: new Date().toLocaleString()
};