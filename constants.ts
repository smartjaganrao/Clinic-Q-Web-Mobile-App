
import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType, Patient, TimeSlot, Review, AdminProfile, Staff } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const genId = () => Math.random().toString(36).substr(2, 5);

const createDefaultSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    // Updated: 24/7 Schedule for all doctors
    slots: [{ id: genId(), startTime: '00:00', endTime: '23:59', label: '24 Hours', active: true }],
    isOff: false
  }));
};

// --- DATA GENERATORS ---

const PATIENT_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayan",
  "Krishna", "Ishaan", "Shaurya", "Atharva", "Dhruv", "Kabir",
  "Ananya", "Diya", "Gauri", "Isha", "Kavya", "Khushi", "Kiara", "Myra",
  "Nandini", "Pari", "Prisha", "Riya", "Saanvi", "Samaira", "Sara",
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Suresh", "Lakshmi",
  "Rohan", "Meera", "Karthik", "Swathi", "Deepak", "Pooja", "Arun", "Divya"
];

const SURNAMES = [
  "Sharma", "Verma", "Gupta", "Malhotra", "Iyer", "Reddy", "Nair", "Patel",
  "Singh", "Kumar", "Das", "Rao", "Jain", "Mehta", "Desai", "Joshi", "Krishnan", "Raman"
];

const BIOS = [
    "A dedicated specialist with over a decade of experience in providing comprehensive care. Committed to patient well-being and using the latest medical advancements.",
    "Compassionate and skilled physician focused on preventive care and long-term health management. Known for a patient-centric approach and clear communication.",
    "Highly experienced specialist dealing with complex cases. Regularly attends international conferences to stay updated with cutting-edge treatments.",
    "Friendly and approachable doctor who believes in treating the patient, not just the disease. Specializes in rapid diagnosis and effective treatment plans."
];

const DEGREES = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "FRCS", "MRCP"];
const COLLEGES = ["AIIMS Delhi", "CMC Vellore", "Madras Medical College", "JIPMER", "KMC Manipal", "Stanley Medical College"];
const LANGUAGES_SPOKEN = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"];

const REVIEW_COMMENTS = [
    "Excellent doctor! Very patient and listened to all my concerns.",
    "Wait time was a bit long, but the treatment was worth it.",
    "Very professional and knowledgeable. Highly recommended.",
    "Clinic is very clean and staff is helpful. Doctor is great.",
    "Explained the diagnosis very clearly. Feeling much better now.",
    "Best doctor in the area for this condition."
];

const generateReviews = (count: number): Review[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: genId(),
        patientName: `${PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)].charAt(0)}.`,
        rating: 3 + Math.floor(Math.random() * 3), // 3 to 5
        comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
    }));
};

const SYMPTOMS_BY_TYPE: Record<string, string[]> = {
  GENERAL: ["Fever and chills", "Severe headache", "Stomach ache", "Viral infection", "Body pain", "Food poisoning", "Cough and cold", "Typhoid follow-up", "Low BP"],
  PEDIATRIC: ["High fever", "Vaccination", "Stomach infection", "Persistent cough", "Ear pain", "Skin rash", "General checkup", "Colic pain", "Growth monitoring"],
  GYNECOLOGY: ["Pregnancy checkup", "Irregular periods", "PCOS consultation", "Lower back pain", "Prenatal vitamin check", "Trimester scan review"],
  ORTHOPEDIC: ["Knee pain", "Fracture follow-up", "Back ache", "Shoulder stiffness", "Arthritis checkup", "Sports injury", "Ankle sprain"],
  DENTAL: ["Tooth ache", "Root canal", "Cavity filling", "Gum bleeding", "Dental cleaning", "Braces adjustment", "Wisdom tooth pain"],
  CARDIOLOGY: ["Chest pain", "High BP check", "Palpitations", "Routine ECG", "Breathlessness", "Post-surgery checkup", "Cholesterol review"],
  DERMATOLOGY: ["Acne treatment", "Skin allergy", "Hair fall", "Eczema flare-up", "Mole removal", "Laser treatment", "Pigmentation"],
  OTHER: ["General consultation", "Follow up", "Routine checkup"]
};

// Shared Master ID for Dr. Ravi Kumar to demonstrate multi-hospital linking
const MASTER_ID_RAVI = 'master_doc_ravi_123';

// Helper to create doctors with realistic profiles
const createRealDoctors = (startId: number, count: number, specialty: string, feeRange: [number, number]): Doctor[] => {
  const names = [
    'Dr. Ravi Kumar', 'Dr. Lakshmi Narayanan', 'Dr. Anita Desai', 'Dr. Suresh Menon', 
    'Dr. Priya Krishnan', 'Dr. Rajeshwari S', 'Dr. Vikram Reddy', 'Dr. Meera Iyer',
    'Dr. Sanjay Gupta', 'Dr. Anjali Rao', 'Dr. Deepak Thomas', 'Dr. Sarah John',
    'Dr. Karthik Raja', 'Dr. Swathi Balaji', 'Dr. Arjun Das', 'Dr. Nithya Ram'
  ];
  
  return Array.from({ length: count }).map((_, i) => {
    const idVal = startId + i;
    const rand = (idVal * 9301 + 49297) % 233280; 
    const fee = Math.floor(Math.random() * (feeRange[1] - feeRange[0] + 1) + feeRange[0]);
    const rating = (3.8 + (rand % 12) / 10).toFixed(1);
    const name = names[(idVal + i) % names.length];
    
    // Unified Identity Logic for demo
    let masterId = `master_${idVal}`;
    let mobile = `98${idVal.toString().padStart(8, '0')}`;

    // Force Dr. Ravi Kumar to have specific ID for linking demo
    if (name === 'Dr. Ravi Kumar') {
        masterId = MASTER_ID_RAVI;
        mobile = '9876543210';
    }

    const exp = 5 + (rand % 20);
    const bio = BIOS[(idVal + i) % BIOS.length];
    const edu = [
        `${DEGREES[(idVal) % DEGREES.length]} - ${COLLEGES[(idVal) % COLLEGES.length]}`,
        `${DEGREES[(idVal + 1) % DEGREES.length]} - ${COLLEGES[(idVal + 1) % COLLEGES.length]}`
    ];
    const langs = ["English", LANGUAGES_SPOKEN[(idVal) % LANGUAGES_SPOKEN.length], LANGUAGES_SPOKEN[(idVal+2) % LANGUAGES_SPOKEN.length]];
    
    return {
        id: `doc_${specialty.substring(0,3)}_${idVal}`,
        masterId: masterId,
        name: name,
        mobile: mobile,
        registrationNumber: `REG${idVal}`,
        specialty: specialty,
        roomNumber: `${100 + i + 1}`,
        isAvailable: true,
        status: DoctorStatus.AVAILABLE,
        delayMinutes: 0,
        avatarUrl: `https://i.pravatar.cc/150?u=${masterId}`, // Consistent avatar based on masterId
        weeklySchedule: createDefaultSchedule(),
        consultationFee: fee - (fee % 50), // Round to 50
        consultationTime: 15, // Default 15 mins
        rating: parseFloat(rating),
        reviewCount: 50 + (rand % 400),
        // Rich Profile Data
        bio: bio,
        education: edu,
        languages: [...new Set(langs)], // Unique
        experience: exp,
        reviews: generateReviews(3 + (rand % 5))
    };
  });
};

// Helper to generate realistic patient queue
const createRealisticPatients = (doctors: Doctor[], clinicType: ClinicType | string, city: string): Patient[] => {
  const patients: Patient[] = [];
  const symptomsList = SYMPTOMS_BY_TYPE[clinicType] || SYMPTOMS_BY_TYPE.GENERAL;
  const now = Date.now();
  
  doctors.forEach((doc, docIdx) => {
    const count = 3 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < count; i++) {
      const isCompleted = i < Math.floor(count * 0.3); 
      const isWithDoctor = !isCompleted && i === Math.floor(count * 0.3);
      
      const name = `${PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;
      const age = (clinicType === 'PEDIATRIC' ? 1 + Math.floor(Math.random() * 12) : 18 + Math.floor(Math.random() * 60)).toString();
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const symptom = symptomsList[Math.floor(Math.random() * symptomsList.length)];
      
      const status = isCompleted ? PatientStatus.COMPLETED : 
                     isWithDoctor ? PatientStatus.WITH_DOCTOR : 
                     PatientStatus.WAITING;

      const timeOffset = (count - i) * 12 * 60 * 1000; 
      const visitType = Math.random() > 0.4 ? 'WALK_IN' : 'APPOINTMENT';
      let appointmentTime;
      let appointmentDate;
      
      if (visitType === 'APPOINTMENT') {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          appointmentDate = `${year}-${month}-${day}`;

          const hour = 9 + Math.floor(i/2);
          const min = (i%2) * 30;
          appointmentTime = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
      }

      // Generate realistic start/end times for stats
      const timeAdded = now - timeOffset;
      // Start time: if active or completed, assume it started some time after added
      // For random data: started 5-30 mins after addition
      const startDelay = 5 * 60 * 1000 + Math.random() * 25 * 60 * 1000;
      const timeStarted = (isWithDoctor || isCompleted) ? timeAdded + startDelay : undefined;
      
      // Completed time: started + 10-20 mins
      const duration = 10 * 60 * 1000 + Math.random() * 10 * 60 * 1000;
      const timeCompleted = isCompleted ? (timeStarted || 0) + duration : undefined;

      patients.push({
        id: `pat_${doc.id}_${i}`,
        tokenNumber: (docIdx + 1) * 100 + (i + 1),
        name,
        phone: `9${Math.floor(Math.random()*900000000 + 100000000)}`,
        status,
        doctorId: doc.id,
        timeAdded,
        timeStarted,
        timeCompleted,
        visitType,
        appointmentDate,
        appointmentTime,
        isEmergency: !isCompleted && !isWithDoctor && Math.random() > 0.95, 
        isCheckedIn: visitType === 'APPOINTMENT' ? Math.random() > 0.3 : false,
        vitals: (isWithDoctor || isCompleted) ? {
            bp: `${110 + Math.floor(Math.random()*30)}/${70 + Math.floor(Math.random()*20)}`,
            temp: '98.6',
            weight: `${(clinicType === 'PEDIATRIC' ? 10 : 50) + Math.floor(Math.random()*30)}`,
            pulse: `${70 + Math.floor(Math.random()*20)}`,
            spo2: '98'
        } : {},
        age,
        gender,
        symptoms: symptom
      });
    }
  });

  return patients;
};

const createMockStaff = (): Staff[] => {
    return [
        { id: genId(), name: "Priya Sharma", role: 'RECEPTIONIST', phone: '9876543210', isActive: true, joinedDate: Date.now() - 10000000 },
        { id: genId(), name: "Anjali Verma", role: 'NURSE', phone: '9876543211', isActive: true, joinedDate: Date.now() - 5000000 }
    ];
};

const chennaiDocs1 = [...createRealDoctors(100, 2, 'General Physician', [500, 700]), ...createRealDoctors(102, 1, 'Diabetologist', [700, 900])];
const chennaiDocs2 = createRealDoctors(200, 4, 'Ophthalmologist', [600, 1000]);
const chennaiDocs3 = [...createRealDoctors(300, 3, 'Gynecologist', [800, 1200]), ...createRealDoctors(303, 2, 'Pediatrician', [700, 1000])];
const chennaiDocs4 = createRealDoctors(400, 3, 'Orthopedic', [900, 1500]);
const chennaiDocs5 = createRealDoctors(500, 2, 'Dentist', [400, 800]);
const chennaiDocs6 = [...createRealDoctors(600, 2, 'Cardiologist', [1000, 1800]), ...createRealDoctors(602, 1, 'General Physician', [600, 800])];
const chennaiDocs7 = createRealDoctors(700, 2, 'Dermatologist', [700, 1200]);
const chennaiDocs8 = createRealDoctors(800, 3, 'ENT Specialist', [600, 900]);
const chennaiDocs9 = createRealDoctors(900, 4, 'Pediatrician', [600, 1000]);

const raviKumarCityGeneral: Doctor = {
    id: 'doc_GEN_1599',
    masterId: MASTER_ID_RAVI, // SAME MASTER ID
    name: 'Dr. Ravi Kumar',
    mobile: '9876543210',
    registrationNumber: 'REG100',
    specialty: 'General Physician',
    roomNumber: '205',
    isAvailable: true,
    status: DoctorStatus.AVAILABLE,
    delayMinutes: 0,
    avatarUrl: `https://i.pravatar.cc/150?u=${MASTER_ID_RAVI}`,
    weeklySchedule: createDefaultSchedule(),
    consultationFee: 300, // Different fee
    consultationTime: 10,
    rating: 4.2,
    reviewCount: 150,
    bio: BIOS[0],
    education: ['MBBS - Madras Medical College', 'MD - AIIMS Delhi'],
    languages: ['English', 'Tamil', 'Hindi'],
    experience: 12,
    reviews: generateReviews(5)
};

const chennaiDocs10 = [raviKumarCityGeneral, ...createRealDoctors(1501, 3, 'General Physician', [400, 600])];

const blrDocs1 = [...createRealDoctors(1000, 2, 'Cardiologist', [1000, 1500]), ...createRealDoctors(1002, 2, 'Orthopedic', [900, 1400])];
const blrDocs2 = [...createRealDoctors(1100, 2, 'Pediatrician', [600, 900]), ...createRealDoctors(1102, 2, 'Gynecologist', [700, 1000])];
const blrDocs3 = createRealDoctors(1200, 1, 'Dentist', [400, 800]);

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic_chn_1',
    name: 'Apollo Clinic',
    slug: 'apollo-anna-nagar',
    plan: PlanType.SMALL,
    type: ClinicType.GENERAL,
    city: 'Chennai',
    address: 'Plot 12, 4th Avenue, Shanthi Colony, Anna Nagar',
    pincode: '600040',
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0850, lng: 80.2100 },
    about: 'A multi-specialty clinic providing comprehensive healthcare services with state-of-the-art diagnostic facilities and expert doctors.',
    amenities: ['Pharmacy', 'Pathology Lab', 'X-Ray', 'Parking', 'Wheelchair Access'],
    doctors: chennaiDocs1,
    patients: createRealisticPatients(chennaiDocs1, ClinicType.GENERAL, 'Chennai'),
    staff: createMockStaff()
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
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0629, lng: 80.2495 },
    about: 'World-class eye care hospital dedicated to providing equitable and efficient eye care to all sections of society.',
    amenities: ['Optical Shop', 'Cafeteria', 'Emergency Eye Care', 'Pharmacy', 'Prayer Room'],
    doctors: chennaiDocs2,
    patients: createRealisticPatients(chennaiDocs2, 'OPHTHALMOLOGY', 'Chennai'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0350, lng: 80.2350 },
    about: 'India’s premier birthing, woman, and child care hospital celebrating the journey of maternity and beyond.',
    amenities: ['NICU', 'Labor Suites', 'Valet Parking', 'Baby Shop', '24x7 Pharmacy'],
    doctors: chennaiDocs3,
    patients: createRealisticPatients(chennaiDocs3, ClinicType.GYNECOLOGY, 'Chennai'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2187d80a18f7?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0280, lng: 80.1850 },
    about: 'A 1000-bed quaternary care hospital offering best-in-class treatment for Orthopedics, Trauma, and Joint Replacement.',
    amenities: ['Ambulance', 'Blood Bank', 'Cafeteria', 'Rehab Center', 'International Patient Care'],
    doctors: chennaiDocs4,
    patients: createRealisticPatients(chennaiDocs4, ClinicType.ORTHOPEDIC, 'Chennai'),
    staff: []
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
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0012, lng: 80.2565 },
    about: 'Advanced dental care center specializing in implants, root canals, and cosmetic dentistry with modern equipment.',
    amenities: ['Digital X-Ray', 'Waiting Lounge', 'Parking', 'Card Payment'],
    doctors: chennaiDocs5,
    patients: createRealisticPatients(chennaiDocs5, ClinicType.DENTAL, 'Chennai'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0060, lng: 80.2580 },
    about: 'Leading multi-specialty hospital known for its excellence in Cardiology, Cardiac Surgery, and Neurology.',
    amenities: ['ICU/CCU', 'Emergency', 'Diagnostics', 'Pharmacy', 'Wifi'],
    doctors: chennaiDocs6,
    patients: createRealisticPatients(chennaiDocs6, ClinicType.CARDIOLOGY, 'Chennai'),
    staff: []
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
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0330, lng: 80.2550 },
    about: 'Expert dermatologists providing advanced skin and hair treatments including laser hair removal and acne treatment.',
    amenities: ['Laser Suite', 'Private Consultation', 'Valet Parking', 'Wifi'],
    doctors: chennaiDocs7,
    patients: createRealisticPatients(chennaiDocs7, ClinicType.DERMATOLOGY, 'Chennai'),
    staff: []
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
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0780, lng: 80.2400 },
    about: 'Specialized ENT care hospital known for Micro Ear Surgery, Endoscopic Sinus Surgery, and Cochlear Implants.',
    amenities: ['Audiology Lab', 'Speech Therapy', 'Pharmacy', 'In-patient Rooms'],
    doctors: chennaiDocs8,
    patients: createRealisticPatients(chennaiDocs8, 'ENT', 'Chennai'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0700, lng: 80.2380 },
    about: 'A heritage hospital with a strong focus on Pediatric care, General Medicine, and Surgery since 1933.',
    amenities: ['Pediatric ICU', 'Play Area', 'Vaccination Center', 'Emergency', 'Lab'],
    doctors: chennaiDocs9,
    patients: createRealisticPatients(chennaiDocs9, ClinicType.PEDIATRIC, 'Chennai'),
    staff: []
  },
  {
    id: 'clinic_chn_10',
    name: 'City General Hospital',
    slug: 'city-general-chennai',
    plan: PlanType.SMALL,
    type: ClinicType.GENERAL,
    city: 'Chennai',
    address: '123 Main Street',
    pincode: '600001',
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0827, lng: 80.2707 },
    about: 'Affordable and accessible general healthcare services for the community with round-the-clock emergency support.',
    amenities: ['Emergency', 'Pharmacy', 'General Ward', 'Basic Lab'],
    doctors: chennaiDocs10,
    patients: createRealisticPatients(chennaiDocs10, ClinicType.GENERAL, 'Chennai'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 12.9592, lng: 77.6475 },
    about: 'One of India’s foremost multi-specialty healthcare providers offering comprehensive care.',
    amenities: ['Advanced ICU', 'Robotic Surgery', 'Cafeteria', 'Valet Parking', 'Pharmacy'],
    doctors: blrDocs1,
    patients: createRealisticPatients(blrDocs1, ClinicType.GENERAL, 'Bangalore'),
    staff: []
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
    imageUrl: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 13.0285, lng: 77.6400 },
    about: 'Specialized hospital for women and children, providing maternity, gynecology, and pediatric services.',
    amenities: ['NICU', 'Labor Rooms', 'Lactation Consulting', 'Ultrasound'],
    doctors: blrDocs2,
    patients: createRealisticPatients(blrDocs2, ClinicType.PEDIATRIC, 'Bangalore'),
    staff: []
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
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1609840114035-1c290b777f3f?auto=format&fit=crop&q=80&w=300',
    geoLocation: { lat: 12.9716, lng: 77.6412 },
    about: 'India’s largest dental chain offering quality dental care with modern technology and hygiene standards.',
    amenities: ['X-Ray', 'Sterilization Zone', 'Wifi', 'Card Payment'],
    doctors: blrDocs3,
    patients: createRealisticPatients(blrDocs3, ClinicType.DENTAL, 'Bangalore'),
    staff: []
  }
];

export const INITIAL_DOCTORS: Doctor[] = INITIAL_CLINICS[0].doctors;

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Solo Clinic',
    price: '₹999',
    features: [
      '1 Doctor',
      'Unlimited Patients',
      'Basic Dashboard',
      'WhatsApp Alerts'
    ]
  },
  {
    name: 'Small Hospital',
    price: '₹2,499',
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
    price: '₹4,499',
    features: [
      '10+ Doctors',
      'Advanced Analytics',
      'No-show Prediction',
      'Custom Branding',
      'Kiosk Support'
    ]
  }
];

export const APP_NAME = "SmartQFlow";

// Super Admin Profile Data
export const SUPER_ADMIN_PROFILE: AdminProfile = {
  name: "Arjun Venkat",
  email: "arjun@smartqflow.com",
  role: "SUPER_ADMIN",
  avatarUrl: "https://i.pravatar.cc/150?u=super_admin_arjun",
  lastLogin: new Date().toLocaleString()
};
