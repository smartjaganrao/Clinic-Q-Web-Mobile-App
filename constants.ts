import { Doctor, PricingPlan, Clinic, PlanType, PatientStatus, DoctorStatus, DaySchedule, ClinicType, Patient, TimeSlot } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const genId = () => Math.random().toString(36).substr(2, 5);

const createDefaultSchedule = (): DaySchedule[] => {
  return DAYS.map(day => ({
    day,
    slots: day === 'Sunday' ? [] : [{ id: genId(), startTime: '09:00', endTime: '17:00', label: 'Regular', active: true }],
    isOff: day === 'Sunday'
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
        rating: parseFloat(rating),
        reviewCount: 50 + (rand % 400)
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

      patients.push({
        id: `pat_${doc.id}_${i}`,
        tokenNumber: (docIdx + 1) * 100 + (i + 1),
        name,
        phone: `9${Math.floor(Math.random()*900000000 + 100000000)}`,
        status,
        doctorId: doc.id,
        timeAdded: now - timeOffset,
        timeCompleted: isCompleted ? now - timeOffset + (15 * 60 * 1000) : undefined,
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

const INSURANCE_PROVIDERS = ["Star Health", "HDFC Ergo", "ICICI Lombard", "Max Bupa", "Religare"];
const getRandomInsurances = () => INSURANCE_PROVIDERS.sort(() => 0.5 - Math.random()).slice(0, 3);

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
    rating: 4.2,
    reviewCount: 150
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
    operatingHours: '08:00 AM - 09:00 PM',
    geoLocation: { lat: 13.0850, lng: 80.2100 },
    about: 'A multi-specialty clinic providing comprehensive healthcare services with state-of-the-art diagnostic facilities and expert doctors.',
    amenities: ['Pharmacy', 'Pathology Lab', 'X-Ray', 'Parking', 'Wheelchair Access'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs1,
    patients: createRealisticPatients(chennaiDocs1, ClinicType.GENERAL, 'Chennai')
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
    about: 'World-class eye care hospital dedicated to providing equitable and efficient eye care to all sections of society.',
    amenities: ['Optical Shop', 'Cafeteria', 'Emergency Eye Care', 'Pharmacy', 'Prayer Room'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs2,
    patients: createRealisticPatients(chennaiDocs2, 'OPHTHALMOLOGY', 'Chennai')
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
    about: 'India’s premier birthing, woman, and child care hospital celebrating the journey of maternity and beyond.',
    amenities: ['NICU', 'Labor Suites', 'Valet Parking', 'Baby Shop', '24x7 Pharmacy'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs3,
    patients: createRealisticPatients(chennaiDocs3, ClinicType.GYNECOLOGY, 'Chennai')
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
    about: 'A 1000-bed quaternary care hospital offering best-in-class treatment for Orthopedics, Trauma, and Joint Replacement.',
    amenities: ['Ambulance', 'Blood Bank', 'Cafeteria', 'Rehab Center', 'International Patient Care'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs4,
    patients: createRealisticPatients(chennaiDocs4, ClinicType.ORTHOPEDIC, 'Chennai')
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
    about: 'Advanced dental care center specializing in implants, root canals, and cosmetic dentistry with modern equipment.',
    amenities: ['Digital X-Ray', 'Waiting Lounge', 'Parking', 'Card Payment'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs5,
    patients: createRealisticPatients(chennaiDocs5, ClinicType.DENTAL, 'Chennai')
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
    about: 'Leading multi-specialty hospital known for its excellence in Cardiology, Cardiac Surgery, and Neurology.',
    amenities: ['ICU/CCU', 'Emergency', 'Diagnostics', 'Pharmacy', 'Wifi'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs6,
    patients: createRealisticPatients(chennaiDocs6, ClinicType.CARDIOLOGY, 'Chennai')
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
    about: 'Expert dermatologists providing advanced skin and hair treatments including laser hair removal and acne treatment.',
    amenities: ['Laser Suite', 'Private Consultation', 'Valet Parking', 'Wifi'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs7,
    patients: createRealisticPatients(chennaiDocs7, ClinicType.DERMATOLOGY, 'Chennai')
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
    about: 'Specialized ENT care hospital known for Micro Ear Surgery, Endoscopic Sinus Surgery, and Cochlear Implants.',
    amenities: ['Audiology Lab', 'Speech Therapy', 'Pharmacy', 'In-patient Rooms'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs8,
    patients: createRealisticPatients(chennaiDocs8, 'ENT', 'Chennai')
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
    about: 'A heritage hospital with a strong focus on Pediatric care, General Medicine, and Surgery since 1933.',
    amenities: ['Pediatric ICU', 'Play Area', 'Vaccination Center', 'Emergency', 'Lab'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs9,
    patients: createRealisticPatients(chennaiDocs9, ClinicType.PEDIATRIC, 'Chennai')
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
    geoLocation: { lat: 13.0827, lng: 80.2707 },
    about: 'Affordable and accessible general healthcare services for the community with round-the-clock emergency support.',
    amenities: ['Emergency', 'Pharmacy', 'General Ward', 'Basic Lab'],
    acceptedInsurances: getRandomInsurances(),
    doctors: chennaiDocs10,
    patients: createRealisticPatients(chennaiDocs10, ClinicType.GENERAL, 'Chennai')
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
    about: 'One of India’s foremost multi-specialty healthcare providers offering comprehensive care.',
    amenities: ['Advanced ICU', 'Robotic Surgery', 'Cafeteria', 'Valet Parking', 'Pharmacy'],
    acceptedInsurances: getRandomInsurances(),
    doctors: blrDocs1,
    patients: createRealisticPatients(blrDocs1, ClinicType.GENERAL, 'Bangalore')
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
    about: 'Specialized hospital for women and children, providing maternity, gynecology, and pediatric services.',
    amenities: ['NICU', 'Labor Rooms', 'Lactation Consulting', 'Ultrasound'],
    acceptedInsurances: getRandomInsurances(),
    doctors: blrDocs2,
    patients: createRealisticPatients(blrDocs2, ClinicType.PEDIATRIC, 'Bangalore')
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
    about: 'India’s largest dental chain offering quality dental care with modern technology and hygiene standards.',
    amenities: ['X-Ray', 'Sterilization Zone', 'Wifi', 'Card Payment'],
    acceptedInsurances: getRandomInsurances(),
    doctors: blrDocs3,
    patients: createRealisticPatients(blrDocs3, ClinicType.DENTAL, 'Bangalore')
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