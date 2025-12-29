
import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType, Patient, TimeSlot, Review, AdminProfile, Staff, ClinicOperationMode, SessionMode } from './types';
import { Stethoscope, Baby, Smile, Eye, Bone, Accessibility, Heart, Ear, Scissors, Sparkles, LayoutGrid } from 'lucide-react';

export const APP_NAME = "SmartQFlow";

// --- HELPERS ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const genId = () => Math.random().toString(36).substr(2, 5);

// Precise schedule generator
const createSchedule = (
    slotsConfig: { start: string; end: string; mode: SessionMode; label: string }[],
    daysOff: string[] = ['Sunday']
): DaySchedule[] => {
    return DAYS.map(day => {
        const isOff = daysOff.includes(day);
        return {
            day,
            isOff,
            slots: isOff ? [] : slotsConfig.map(s => ({
                id: genId(),
                startTime: s.start, // Format: "HH:mm" (24h)
                endTime: s.end,     // Format: "HH:mm" (24h)
                label: s.label,
                active: true,
                mode: s.mode
            }))
        };
    });
};

// --- MASTER DATA ---
const MASTER_DOCTORS = [
    { name: "Dr. Arun Kumar", specialty: "General Physician", education: ["MBBS", "MD"], exp: 12, gender: "Male" as const, avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Priya Sharma", specialty: "Gynecologist", education: ["MBBS", "MS (OBG)"], exp: 8, gender: "Female" as const, avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Rajesh Iyer", specialty: "Cardiologist", education: ["MBBS", "DM (Cardio)"], exp: 15, gender: "Male" as const, avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Anita Desai", specialty: "Pediatrician", education: ["MBBS", "MD (Ped)"], exp: 6, gender: "Female" as const, avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Suresh Reddy", specialty: "Orthopedic", education: ["MBBS", "MS (Ortho)"], exp: 20, gender: "Male" as const, avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Meera Patel", specialty: "Dermatologist", education: ["MBBS", "DDVL"], exp: 5, gender: "Female" as const, avatarUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Vikram Singh", specialty: "Dentist", education: ["BDS", "MDS"], exp: 9, gender: "Male" as const, avatarUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300&h=300" },
    { name: "Dr. Sanjay Gupta", specialty: "ENT Specialist", education: ["MBBS", "MS (ENT)"], exp: 11, gender: "Male" as const, avatarUrl: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&q=80&w=300&h=300" }
];

const createPatientsForClinic = (clinicId: string, doctors: Doctor[]) => {
    const patients: Patient[] = [];
    const names = ["Rohan", "Kavya", "Aditya", "Sneha", "Rahul", "Pooja", "Amit", "Divya", "Karthik", "Swetha"];
    
    doctors.forEach((doc, docIdx) => {
        // Create 2-4 patients per doctor
        const count = 2 + Math.floor(Math.random() * 3);
        for(let i=0; i<count; i++) {
             const isServing = i === 0;
             const isCheckedIn = i < 2; // First 2 checked in
             patients.push({
                 id: `pat_${clinicId}_${doc.id}_${i}`,
                 tokenNumber: i + 1,
                 name: names[(docIdx * 3 + i) % names.length],
                 phone: "9876543210",
                 status: isServing ? PatientStatus.WITH_DOCTOR : PatientStatus.WAITING,
                 doctorId: doc.id,
                 timeAdded: Date.now() - (i * 15 * 60000) - (Math.random() * 300000), // Staggered times
                 visitType: 'WALK_IN',
                 age: (20 + Math.floor(Math.random()*40)).toString(),
                 gender: (Math.random() > 0.5 ? 'Male' : 'Female') as 'Male' | 'Female',
                 isCheckedIn: isCheckedIn,
                 symptoms: i % 3 === 0 ? "Fever and cold" : i % 3 === 1 ? "General checkup" : ""
             });
        }
    });
    return patients;
};

// --- CLINIC DEFINITIONS ---

// 1. Apollo Clinic (Premium, Hybrid Full)
const CLINIC_1: Clinic = {
    id: "clinic_apollo_anna_nagar",
    name: "Apollo Clinic",
    slug: "apollo-clinic-anna-nagar",
    type: ClinicType.GENERAL,
    plan: PlanType.PREMIUM,
    operationMode: ClinicOperationMode.HYBRID_FULL,
    city: "Chennai",
    address: "AB-12, 2nd Ave, Anna Nagar",
    pincode: "600040",
    timezone: "Asia/Kolkata",
    operatingHours: "08:00 AM - 10:00 PM",
    geoLocation: { lat: 13.0850, lng: 80.2100 },
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    amenities: ["Pharmacy", "Lab", "X-Ray", "Parking", "Wheelchair", "WiFi"],
    subscriptionStatus: "ACTIVE",
    doctors: [],
    patients: [],
    staff: [{ id: "staff_1", name: "Priya (Admin)", role: "RECEPTIONIST", phone: "9999999999", email: "admin@demo.com", password: "password", isActive: true, joinedDate: Date.now() }]
};
CLINIC_1.doctors = [
    // Dr. Arun: Morning Shift (09:00 - 13:00)
    { 
        ...MASTER_DOCTORS[0], 
        id: "doc_1_1", 
        masterId: "master_arun", 
        mobile: "9000000001", 
        email: "arun@apollo.com", 
        password: "password", 
        roomNumber: "101", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 0, 
        consultationFee: 600, 
        consultationTime: 15, 
        rating: 4.8, 
        reviewCount: 120, 
        weeklySchedule: createSchedule([{ start: "09:00", end: "13:00", mode: SessionMode.HYBRID, label: "Morning OPD" }])
    },
    // Dr. Rajesh: Evening Shift (17:00 - 21:00)
    { 
        ...MASTER_DOCTORS[2], 
        id: "doc_1_2", 
        masterId: "master_rajesh", 
        mobile: "9000000003", 
        email: "rajesh@apollo.com", 
        password: "password", 
        roomNumber: "102", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 10, 
        consultationFee: 800, 
        consultationTime: 20, 
        rating: 4.9, 
        reviewCount: 200, 
        weeklySchedule: createSchedule([{ start: "17:00", end: "21:00", mode: SessionMode.APPOINTMENT, label: "Evening Cardio" }])
    }
];
CLINIC_1.patients = createPatientsForClinic(CLINIC_1.id, CLINIC_1.doctors);

// 2. Child Care (Pediatric, Online Token Only) - Evening Clinic
const CLINIC_2: Clinic = {
    id: "clinic_child_care",
    name: "Little Smiles Pediatric",
    slug: "little-smiles-velachery",
    type: ClinicType.PEDIATRIC,
    plan: PlanType.SMALL,
    operationMode: ClinicOperationMode.ONLINE_WALK_IN, 
    city: "Chennai",
    address: "45, 100ft Road, Velachery",
    pincode: "600042",
    timezone: "Asia/Kolkata",
    operatingHours: "04:00 PM - 09:00 PM",
    geoLocation: { lat: 12.9800, lng: 80.2200 },
    imageUrl: "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&q=80&w=800",
    amenities: ["Play Area", "Vaccination", "Nebulizer"],
    subscriptionStatus: "ACTIVE",
    doctors: [],
    patients: [],
    staff: []
};
CLINIC_2.doctors = [
    // Dr. Anita: Evening only (16:30 - 20:30)
    { 
        ...MASTER_DOCTORS[3], 
        id: "doc_2_1", 
        masterId: "master_anita", 
        mobile: "9000000004", 
        email: "anita@smiles.com", 
        password: "password", 
        roomNumber: "A", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 0, 
        consultationFee: 500, 
        consultationTime: 15, 
        rating: 4.9, 
        reviewCount: 350, 
        weeklySchedule: createSchedule([{ start: "16:30", end: "20:30", mode: SessionMode.WALK_IN, label: "Evening Clinic" }])
    }
];
CLINIC_2.patients = createPatientsForClinic(CLINIC_2.id, CLINIC_2.doctors);

// 3. Parasu Dental (Dental, Direct Walk-in Only)
const CLINIC_3: Clinic = {
    id: "clinic_parasu_dental",
    name: "Parasu Dental Centre",
    slug: "parasu-dental-adyar",
    type: ClinicType.DENTAL,
    plan: PlanType.SOLO,
    operationMode: ClinicOperationMode.DIRECT_WALK_IN,
    city: "Chennai",
    address: "12, LB Road, Adyar",
    pincode: "600020",
    timezone: "Asia/Kolkata",
    operatingHours: "10:00 AM - 08:00 PM",
    geoLocation: { lat: 13.0012, lng: 80.2565 },
    imageUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800",
    amenities: ["X-Ray", "Root Canal", "Whitening"],
    subscriptionStatus: "ACTIVE",
    doctors: [],
    patients: [],
    staff: []
};
CLINIC_3.doctors = [
    // Dr. Vikram: Split Shift (10-14, 16-20)
    { 
        ...MASTER_DOCTORS[6], 
        id: "doc_3_1", 
        masterId: "master_vikram", 
        mobile: "9000000007", 
        email: "vikram@parasu.com", 
        password: "password", 
        roomNumber: "1", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 0, 
        consultationFee: 300, 
        consultationTime: 20, 
        rating: 4.6, 
        reviewCount: 85, 
        weeklySchedule: createSchedule([
            { start: "10:00", end: "14:00", mode: SessionMode.WALK_IN, label: "Morning Session" },
            { start: "16:00", end: "20:00", mode: SessionMode.WALK_IN, label: "Evening Session" }
        ])
    }
];
CLINIC_3.patients = createPatientsForClinic(CLINIC_3.id, CLINIC_3.doctors);

// 4. Fortis Malar (Emergency, Hybrid, Shared Doctor)
const CLINIC_4: Clinic = {
    id: "clinic_malar_fortis",
    name: "Fortis Malar Hospital",
    slug: "fortis-malar-adyar",
    type: ClinicType.EMERGENCY,
    plan: PlanType.PREMIUM,
    operationMode: ClinicOperationMode.HYBRID_FULL,
    city: "Chennai",
    address: "52, 1st Main Rd, Gandhi Nagar, Adyar",
    pincode: "600020",
    timezone: "Asia/Kolkata",
    operatingHours: "24 hours",
    geoLocation: { lat: 13.0067, lng: 80.2585 },
    imageUrl: "https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=800",
    amenities: ["Emergency", "ICU", "Ambulance", "Cafeteria", "Pharmacy"],
    subscriptionStatus: "ACTIVE",
    doctors: [],
    patients: [],
    staff: []
};
CLINIC_4.doctors = [
    // Dr. Arun shared from Apollo (Works Evening here: 17:00 - 21:00)
    // Note: In Apollo he is Morning 09:00 - 13:00. No Conflict.
    { 
        ...MASTER_DOCTORS[0], 
        id: "doc_4_1", 
        masterId: "master_arun", 
        mobile: "9000000001", 
        email: "arun@fortis.com", 
        password: "password", 
        roomNumber: "OPD-1", 
        isAvailable: true, 
        status: DoctorStatus.OFF_DUTY, 
        delayMinutes: 0, 
        consultationFee: 700, 
        consultationTime: 10, 
        rating: 4.8, 
        reviewCount: 300, 
        weeklySchedule: createSchedule([{ start: "17:00", end: "21:00", mode: SessionMode.HYBRID, label: "Evening OPD" }])
    },
    // Dr. Suresh: Morning OPD (08:00 - 12:00)
    { 
        ...MASTER_DOCTORS[4], 
        id: "doc_4_2", 
        masterId: "master_suresh", 
        mobile: "9000000005", 
        email: "suresh@fortis.com", 
        password: "password", 
        roomNumber: "OPD-5", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 5, 
        consultationFee: 900, 
        consultationTime: 20, 
        rating: 4.7, 
        reviewCount: 450, 
        weeklySchedule: createSchedule([{ start: "08:00", end: "12:00", mode: SessionMode.APPOINTMENT, label: "Morning Ortho" }])
    }
];
CLINIC_4.patients = createPatientsForClinic(CLINIC_4.id, CLINIC_4.doctors);

// 5. Skin Care (Dermatology, Hybrid Direct)
const CLINIC_5: Clinic = {
    id: "clinic_skin_care",
    name: "Glow Skin Clinic",
    slug: "glow-skin-t-nagar",
    type: ClinicType.DERMATOLOGY,
    plan: PlanType.SMALL,
    operationMode: ClinicOperationMode.HYBRID_DIRECT_APPT, // Walk-in at desk, Online Appt
    city: "Chennai",
    address: "15, North Boag Road, T. Nagar",
    pincode: "600017",
    timezone: "Asia/Kolkata",
    operatingHours: "10:00 AM - 07:00 PM",
    geoLocation: { lat: 13.0400, lng: 80.2350 },
    imageUrl: "https://images.unsplash.com/photo-1616391182219-e080b4d1043a?auto=format&fit=crop&q=80&w=800",
    amenities: ["Laser", "Facial", "Cosmetology"],
    subscriptionStatus: "ACTIVE",
    doctors: [],
    patients: [],
    staff: []
};
CLINIC_5.doctors = [
    // Dr. Meera: Day Shift (11:00 - 18:00)
    { 
        ...MASTER_DOCTORS[5], 
        id: "doc_5_1", 
        masterId: "master_meera", 
        mobile: "9000000006", 
        email: "meera@glow.com", 
        password: "password", 
        roomNumber: "1", 
        isAvailable: true, 
        status: DoctorStatus.AVAILABLE, 
        delayMinutes: 0, 
        consultationFee: 750, 
        consultationTime: 20, 
        rating: 4.9, 
        reviewCount: 150, 
        weeklySchedule: createSchedule([{ start: "11:00", end: "18:00", mode: SessionMode.HYBRID, label: "Day Shift" }])
    }
];
CLINIC_5.patients = createPatientsForClinic(CLINIC_5.id, CLINIC_5.doctors);


export const INITIAL_CLINICS: Clinic[] = [CLINIC_1, CLINIC_2, CLINIC_3, CLINIC_4, CLINIC_5];
export const INITIAL_DOCTORS: Doctor[] = CLINIC_1.doctors;

export const PRICING_PLANS: PricingPlan[] = [
  { name: 'Solo Clinic', price: '₹1,250', features: ['Smart hybrid queue', 'Live waiting time', 'Reception dashboard', 'Doctor dashboard', 'TV display', 'Unlimited patients'] },
  { name: 'Standard', price: '₹3,000', features: ['Everything in Solo', 'Multi-doctor management', 'Multi-counter reception', 'Digital vitals', 'Quick prescriptions', 'AI summaries'], recommended: true },
  { name: 'Premium', price: '₹6,000', features: ['Everything in Standard', 'Chain management', 'Telemedicine module', 'API access', 'Priority support', 'Advanced analytics'] }
];

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
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
  lastLogin: new Date().toLocaleString()
};
