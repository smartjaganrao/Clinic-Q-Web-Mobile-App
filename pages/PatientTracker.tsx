
import React, { useState, useEffect, useMemo } from 'react';
import { PatientStatus, Clinic, Patient } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { ArrowLeft, MapPin, Search, Building, Ticket, CalendarCheck, User, Users, Plus, Trash2, Save, History, Clock, ChevronRight, Activity, ChevronLeft, AlertTriangle, QrCode, Map, List, ScanLine, LogOut, Zap, AlertCircle, LocateFixed, Navigation, Heart, Smile, Baby, Stethoscope, Microscope, Brain, Filter, FileText, RefreshCcw, Bell, BellRing, BellOff, Calendar, Star, XCircle, Map as MapIcon } from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, appointmentTime?: string, appointmentDate?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateDetails: (id: string, updates: Partial<Patient>) => void; // New: For ratings
  onCancelVisit: (clinicId: string, patientId: string) => void; // New: For cancellation
}

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
}

interface PatientDataStore {
    name: string;
    phone: string;
    familyMembers: FamilyMember[];
}

interface Reminder {
    id: string; // correlates to patient/visit ID
    triggerTime: number; // timestamp
    minutesBefore: number;
    message: string;
    sent: boolean;
}

// Categories for Filter
const CATEGORIES = [
    { id: 'General Physician', label: 'General', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
    { id: 'Dentist', label: 'Dentist', icon: Smile, color: 'text-yellow-600 bg-yellow-50' },
    { id: 'Pediatrician', label: 'Kids', icon: Baby, color: 'text-pink-600 bg-pink-50' },
    { id: 'Cardiologist', label: 'Heart', icon: Heart, color: 'text-red-600 bg-red-50' },
    { id: 'Dermatologist', label: 'Skin', icon: User, color: 'text-purple-600 bg-purple-50' },
    { id: 'Orthopedic', label: 'Bone', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'Gynecologist', label: 'Women', icon: User, color: 'text-rose-600 bg-rose-50' },
];

// Helper for Local Date String (YYYY-MM-DD)
const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to parse Appointment Date/Time strings to Timestamp
const parseAppointmentDateTime = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hr, min] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, hr, min).getTime();
};

// Haversine Formula for distance (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

export const PatientTracker: React.FC<PatientTrackerProps> = ({ clinics, userPhone, userName, onBack, onGetToken, addToast, onUpdateDetails, onCancelVisit }) => {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'HISTORY' | 'PROFILE'>('NEW');
  
  // -- LOCAL STORAGE / PROFILE STATE --
  // Initialize from props
  const [userProfileName, setUserProfileName] = useState(userName);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // -- SEARCH & MAP STATE --
  const [searchCity, setSearchCity] = useState<string>(''); // City Filter
  const [searchQuery, setSearchQuery] = useState(''); // Name Filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Extract unique cities from clinics
  const availableCities = useMemo(() => {
      const cities = new Set(clinics.map(c => c.city).filter(Boolean));
      return Array.from(cities).sort();
  }, [clinics]);

  // Load data specific to logged-in phone number
  useEffect(() => {
      const storageKey = `clinicq_patient_${userPhone}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
          const parsed: PatientDataStore = JSON.parse(savedData);
          setUserProfileName(parsed.name);
          setFamilyMembers(parsed.familyMembers || []);
      } else {
          // First time setup for this number
          saveDataToStorage(userName, []);
      }

      // Load Reminders
      const savedReminders = localStorage.getItem(`clinicq_reminders_${userPhone}`);
      if (savedReminders) {
          setReminders(JSON.parse(savedReminders));
      }
  }, [userPhone]);

  const saveDataToStorage = (name: string, members: FamilyMember[]) => {
      const storageKey = `clinicq_patient_${userPhone}`;
      const data: PatientDataStore = {
          name: name,
          phone: userPhone,
          familyMembers: members
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const saveReminders = (newReminders: Reminder[]) => {
      setReminders(newReminders);
      localStorage.setItem(`clinicq_reminders_${userPhone}`, JSON.stringify(newReminders));
  };

  // -- REMINDER SYSTEM CHECKER --
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          reminders.forEach(r => {
              // Trigger reminder if time passed and not yet sent
              if (!r.sent && r.triggerTime <= now) {
                  addToast(`🔔 Reminder: ${r.message}`, 'info');
                  // Play a sound (optional/browser policy might block)
                  
                  // Mark as sent
                  setReminders(prev => {
                      const updated = prev.map(item => item.id === r.id ? { ...item, sent: true } : item);
                      localStorage.setItem(`clinicq_reminders_${userPhone}`, JSON.stringify(updated));
                      return updated;
                  });
              }
          });
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
  }, [reminders, userPhone, addToast]);

  const handleSetReminder = (visitId: string, appointmentTimestamp: number, minutesBefore: number, doctorName: string) => {
      const triggerTime = appointmentTimestamp - (minutesBefore * 60 * 1000);
      
      if (triggerTime <= Date.now()) {
          addToast("This time has already passed. Cannot set reminder.", "warning");
          return;
      }

      const newReminder: Reminder = {
          id: visitId,
          triggerTime,
          minutesBefore,
          message: `Your appointment with ${doctorName} is in ${minutesBefore} minutes!`,
          sent: false
      };

      // Remove existing if any, replace with new
      const updated = [...reminders.filter(r => r.id !== visitId), newReminder];
      saveReminders(updated);
      addToast(`Reminder set for ${minutesBefore} minutes before appointment.`, "success");
  };

  const handleRemoveReminder = (visitId: string) => {
      const updated = reminders.filter(r => r.id !== visitId);
      saveReminders(updated);
      addToast("Reminder removed.", "info");
  };

  const handleUpdateProfile = (newName: string) => {
      setUserProfileName(newName);
      saveDataToStorage(newName, familyMembers);
      addToast("Profile name updated", "success");
  };

  const addFamilyMember = (name: string, relation: string) => {
      const newMember = { id: Date.now().toString(), name, relation };
      const updatedMembers = [...familyMembers, newMember];
      setFamilyMembers(updatedMembers);
      saveDataToStorage(userProfileName, updatedMembers);
      addToast(`${name} added to family`, "success");
  };

  const removeFamilyMember = (id: string) => {
      const updatedMembers = familyMembers.filter(m => m.id !== id);
      setFamilyMembers(updatedMembers);
      saveDataToStorage(userProfileName, updatedMembers);
      addToast("Family member removed", "info");
  };

  // -- LOCATION HANDLER --
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
        addToast("Geolocation is not supported by your browser", "error");
        return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            setIsLocating(false);
            addToast("Location detected! Sorted by nearest.", "success");
            // Auto-clear city filter if using GPS to show nearest regardless of city
            setSearchCity(''); 
        },
        (error) => {
            setIsLocating(false);
            addToast("Unable to retrieve location. Please check permissions.", "error");
        }
    );
  };

  const handleGetDirections = (clinic: Clinic) => {
      const { lat, lng } = clinic.geoLocation || { lat: 0, lng: 0 };
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleRateVisit = (visitId: string, rating: number) => {
      onUpdateDetails(visitId, { rating });
      addToast("Thank you for your feedback!", "success");
  };

  const handleCancel = (clinicId: string, visitId: string) => {
      if (window.confirm("Are you sure you want to cancel this appointment?")) {
          onCancelVisit(clinicId, visitId);
          addToast("Appointment cancelled.", "info");
      }
  };

  // -- VISITS DATA DERIVATION --
  const allUserVisits = useMemo(() => {
      if (!userPhone) return [];
      
      const visits: any[] = [];
      clinics.forEach(c => {
          c.patients.forEach(p => {
              if (p.phone === userPhone) {
                  const doc = c.doctors.find(d => d.id === p.doctorId);
                  visits.push({
                      ...p,
                      clinicId: c.id,
                      clinicName: c.name,
                      clinicGeo: c.geoLocation,
                      doctorName: doc?.name || 'Unknown',
                      doctorRoom: doc?.roomNumber || '-',
                      doctorDelay: doc?.delayMinutes || 0
                  });
              }
          });
      });
      return visits.sort((a, b) => b.timeAdded - a.timeAdded);
  }, [clinics, userPhone]);

  const activeVisits = allUserVisits.filter(v => v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED && v.status !== PatientStatus.SKIPPED);
  const historyVisits = allUserVisits.filter(v => v.status === PatientStatus.COMPLETED || v.status === PatientStatus.CANCELLED || v.status === PatientStatus.SKIPPED);

  // -- MANUAL TRACKER STATE (Fallback) --
  const [tokenInput, setTokenInput] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<any | null>(null);
  const [manualSearchError, setManualSearchError] = useState('');

  // -- BOOKING FORM STATE --
  const [isAppointmentMode, setIsAppointmentMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('myself'); // 'myself' | memberId | 'custom'
  
  // -- BOOKING CALENDAR STATE --
  const [selectedDate, setSelectedDate] = useState(new Date()); // The visual month
  const [chosenDateStr, setChosenDateStr] = useState(getLocalYYYYMMDD(new Date())); // The selected value "YYYY-MM-DD"

  const currentClinic = clinics.find(c => c.id === selectedClinicId);

  // Initialize form with profile data when entering booking mode
  useEffect(() => {
      if (activeTab === 'NEW' && userProfileName && !newName) {
          setNewName(userProfileName);
          setNewPhone(userPhone);
          setSelectedMemberId('myself');
      }
  }, [activeTab, userProfileName, userPhone]);

  // QR Code Simulation Effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showQRScanner) {
        // Simulate a scan success after 2 seconds
        timer = setTimeout(() => {
           if (clinics.length > 0) {
               setShowQRScanner(false);
               setSelectedClinicId(clinics[0].id); // Auto-select first clinic for demo
               addToast("QR Code Detected! Redirecting to booking...", "success");
           }
        }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showQRScanner, clinics]);

  // Generate Slots Logic (Intelligent Weekly Schedule)
  const { availableSlots, scheduleStatus } = useMemo(() => {
      const result = { availableSlots: [] as string[], scheduleStatus: { isOff: false, shiftStarted: false, workingHours: '' } };
      
      if (!currentClinic || !selectedDocId) return result;
      const doc = currentClinic.doctors.find(d => d.id === selectedDocId);
      if (!doc) return result;

      // 1. Identify Day of Week for chosenDateStr
      const [y, m, dNum] = chosenDateStr.split('-').map(Number);
      const chosenDateObj = new Date(y, m - 1, dNum);
      const dayOfWeekName = chosenDateObj.toLocaleDateString('en-US', { weekday: 'long' });

      // 2. Get Schedule for that day
      const daySchedule = doc.weeklySchedule.find(s => s.day === dayOfWeekName);
      
      // If no schedule found or doctor is OFF
      if (!daySchedule || daySchedule.isOff) {
          result.scheduleStatus.isOff = true;
          return result;
      }
      
      result.scheduleStatus.workingHours = `${daySchedule.startTime} - ${daySchedule.endTime}`;

      // 3. CHECK IF SHIFT HAS STARTED (For Today)
      const localTodayStr = getLocalYYYYMMDD(new Date());
      if (chosenDateStr === localTodayStr) {
          const now = new Date();
          const [sH, sM] = daySchedule.startTime.split(':').map(Number);
          const startMins = sH * 60 + sM;
          const currentMins = now.getHours() * 60 + now.getMinutes();

          // If current time is past start time, disable booking for today
          if (currentMins >= startMins) {
              result.scheduleStatus.shiftStarted = true;
              return result; // Return empty slots
          }
      }

      // 4. Filter taken slots for the specific CHOSEN DATE
      const takenSlots = new Set(
          currentClinic.patients
            .filter(p => 
                p.doctorId === selectedDocId && 
                p.status !== PatientStatus.CANCELLED && 
                p.appointmentTime &&
                p.appointmentDate === chosenDateStr
            )
            .map(p => p.appointmentTime)
      );

      const slots = [];
      const [startH, startM] = daySchedule.startTime.split(':').map(Number);
      const [endH, endM] = daySchedule.endTime.split(':').map(Number);
      let currentH = startH;
      let currentM = startM;

      // 20 min intervals
      while (currentH < endH || (currentH === endH && currentM < endM)) {
          const timeString = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
          if (!takenSlots.has(timeString)) slots.push(timeString);
          currentM += 20;
          if (currentM >= 60) { currentH += 1; currentM -= 60; }
      }
      result.availableSlots = slots;
      return result;
  }, [currentClinic, selectedDocId, chosenDateStr]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClinic) return;
    const num = parseInt(tokenInput);
    const found = currentClinic.patients.find(p => p.tokenNumber === num && p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.CANCELLED);
    
    if (found) { 
        const doc = currentClinic.doctors.find(d => d.id === found.doctorId);
        setSearchedPatient({
            ...found,
            clinicId: currentClinic.id,
            clinicName: currentClinic.name,
            doctorName: doc?.name,
            doctorRoom: doc?.roomNumber
        }); 
        setManualSearchError(''); 
    } else { 
        setManualSearchError('Token not found or visit completed.'); 
        setSearchedPatient(null); 
    }
  };

  const handleGetToken = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentClinic || !selectedDocId) return;
      
      // CHECK DUPLICATE NAME IN ACTIVE QUEUE
      const isDuplicate = currentClinic.patients.some(p => 
        p.name.trim().toLowerCase() === newName.trim().toLowerCase() && 
        (p.status === PatientStatus.WAITING || p.status === PatientStatus.WITH_DOCTOR)
      );

      if (isDuplicate) {
        addToast(`"${newName}" is already in the queue. Please check Active tab.`, "error");
        return;
      }

      if (isAppointmentMode && !selectedSlot) { 
          addToast("Please select a time slot", "error");
          return; 
      }
      
      // If user changed their own name during booking, update profile
      if (selectedMemberId === 'myself' && newName !== userProfileName) {
          handleUpdateProfile(newName);
      }

      onGetToken(
          newName, 
          newPhone, 
          selectedDocId, 
          currentClinic.id, 
          isAppointmentMode ? selectedSlot : undefined,
          isAppointmentMode ? chosenDateStr : undefined
      );
      
      setActiveTab('ACTIVE');
      setNewName(''); setNewPhone(''); setSelectedDocId(''); setSelectedSlot(''); setIsAppointmentMode(false);
  };

  // --------------------------------------------------------------------------------
  // SMART QUEUE CALCULATOR
  // --------------------------------------------------------------------------------
  const getQueueInfoForVisit = (visit: any) => {
    const clinic = clinics.find(c => c.id === visit.clinicId);
    if (!clinic || visit.status !== PatientStatus.WAITING) return null;
    
    const queue = clinic.patients.filter(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WAITING);
    
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const LATE_THRESHOLD_MINS = 15;
    const AVG_CONSULT_TIME = 10; 

    // --- SMART STATUS LOGIC START ---
    // If appointment is in future days or hours, don't show "You are next"
    if (visit.visitType === 'APPOINTMENT' && visit.appointmentDate && visit.appointmentTime) {
        const todayStr = getLocalYYYYMMDD(now);
        
        // 1. Future Date
        if (visit.appointmentDate > todayStr) {
             return {
                 position: '-',
                 estWait: 0,
                 doctorDelay: 0,
                 statusMsg: `Scheduled for ${visit.appointmentDate}.`
             };
        }

        // 2. Same Day but far in future (>45 mins away)
        if (visit.appointmentDate === todayStr) {
            const apptTime = parseAppointmentDateTime(visit.appointmentDate, visit.appointmentTime);
            const diffMins = (apptTime - now.getTime()) / (1000 * 60);
            
            if (diffMins > 45) {
                return {
                    position: '-',
                    estWait: Math.floor(diffMins),
                    doctorDelay: 0,
                    statusMsg: `Scheduled for ${visit.appointmentTime}. Please arrive 10 mins early.`
                };
            }
        }
    }
    // --- SMART STATUS LOGIC END ---

    const timeToMins = (t?: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const classifyPatient = (p: Patient) => {
        if (p.isEmergency) return 1;
        if (p.visitType === 'APPOINTMENT' && p.appointmentTime) {
            const apptMins = timeToMins(p.appointmentTime);
            if (apptMins > currentMins) return 4; 
            if (currentMins > apptMins + LATE_THRESHOLD_MINS) return 3; 
            return 2;
        }
        return 3;
    };

    const sortedQueue = queue.sort((a, b) => {
        const priorityA = classifyPatient(a);
        const priorityB = classifyPatient(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (a.visitType === 'APPOINTMENT' && b.visitType === 'APPOINTMENT' && a.appointmentTime && b.appointmentTime) {
             return timeToMins(a.appointmentTime) - timeToMins(b.appointmentTime);
        }
        return a.timeAdded - b.timeAdded;
    });

    const position = sortedQueue.findIndex(p => p.id === visit.id);
    if (position === -1) return null;

    const doctorDelay = visit.doctorDelay || 0;
    const baseWait = (position + 1) * AVG_CONSULT_TIME;
    const totalWait = baseWait + doctorDelay;

    let statusMsg = "";
    if (doctorDelay > 0) statusMsg = `Doctor is delayed by ${doctorDelay} mins.`;
    else if (position === 0) statusMsg = "You are next! Please be ready.";
    else if (position <= 2) statusMsg = "Almost your turn. Please arrive at clinic.";
    else statusMsg = "Queue is moving smoothly.";

    return { 
        position: position + 1, 
        estWait: totalWait,
        doctorDelay: doctorDelay,
        statusMsg: statusMsg
    };
  };

  const selectPatient = (type: 'myself' | 'member' | 'new', memberId?: string) => {
      if (type === 'myself') {
          setNewName(userProfileName);
          setNewPhone(userPhone);
          setSelectedMemberId('myself');
      } else if (type === 'member' && memberId) {
          const member = familyMembers.find(m => m.id === memberId);
          if (member) {
              setNewName(member.name);
              setNewPhone(userPhone); 
              setSelectedMemberId(memberId);
          }
      } else {
          setNewName('');
          setNewPhone(userPhone || ''); 
          setSelectedMemberId('custom');
      }
  };

  const handleBookAgain = (clinicId: string, doctorId: string) => {
      setSelectedClinicId(clinicId);
      setSelectedDocId(doctorId);
      setActiveTab('NEW');
      setIsAppointmentMode(false); // Default to Walk-in for speed, user can switch
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];
    
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    const todayStr = getLocalYYYYMMDD(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = dateStr < todayStr;
        const isSelected = dateStr === chosenDateStr;

        days.push(
            <button
                key={day}
                type="button"
                disabled={isPast}
                onClick={() => { setChosenDateStr(dateStr); setSelectedSlot(''); }}
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all mx-auto
                    ${isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-purple-100'}
                    ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md scale-110' : ''}
                    ${!isPast && !isSelected ? 'text-slate-700' : ''}
                `}
            >
                {day}
            </button>
        );
    }
    return days;
  };
  
  if (showQRScanner) {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
              <div className="absolute top-4 left-4 z-10">
                  <button onClick={() => setShowQRScanner(false)} className="p-2 bg-black/50 rounded-full">
                      <ArrowLeft className="h-6 w-6 text-white" />
                  </button>
              </div>
              
              <div className="w-64 h-64 border-2 border-primary-500 rounded-2xl relative overflow-hidden bg-white/5">
                  <div className="absolute inset-0 border-t-4 border-primary-500 animate-pulse top-0 h-full w-full bg-gradient-to-b from-primary-500/20 to-transparent"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[ping_1.5s_ease-in-out_infinite]"></div>
              </div>
              
              <div className="mt-8 text-center px-6">
                  <h3 className="text-xl font-bold mb-2">Scan Clinic QR</h3>
                  <p className="text-slate-400 text-sm">Align the QR code within the frame to book instantly.</p>
                  <Button 
                    className="mt-6 bg-white text-black hover:bg-slate-200" 
                    onClick={() => {
                        if(clinics.length > 0) {
                            setSelectedClinicId(clinics[0].id);
                            setShowQRScanner(false);
                        }
                    }}
                  >
                      <ScanLine className="h-4 w-4 mr-2" />
                      Simulate Detection
                  </Button>
              </div>
          </div>
      );
  }

  // -- VIEW: Clinic Selection --
  if (!selectedClinicId && activeTab === 'NEW') {
    // CLinic filtering logic with location sorting
    const filteredClinics = clinics
        .map(clinic => {
            let distance = null;
            if (userLocation && clinic.geoLocation) {
                distance = calculateDistance(
                    userLocation.lat, userLocation.lng, 
                    clinic.geoLocation.lat, clinic.geoLocation.lng
                );
            }
            return { ...clinic, distance };
        })
        .filter(c => {
            // City Filter
            const matchesCity = searchCity ? c.city === searchCity : true;

            // Name / Doctor Search
            const q = searchQuery.toLowerCase();
            const matchesText = !q ? true : (
                c.name.toLowerCase().includes(q) || 
                c.address.toLowerCase().includes(q) ||
                c.doctors.some(d => d.specialty.toLowerCase().includes(q)) ||
                c.doctors.some(d => d.name.toLowerCase().includes(q))
            );

            // Category Search: Does clinic have a doctor with this specialty?
            const matchesCategory = selectedCategory 
                ? c.doctors.some(d => d.specialty === selectedCategory) 
                : true;

            return matchesCity && matchesText && matchesCategory;
        })
        .sort((a, b) => {
            // If location is active, sort by distance
            if (userLocation && a.distance !== null && b.distance !== null) {
                return a.distance - b.distance;
            }
            return 0; // Default order
        });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <LogOut className="h-5 w-5 text-red-500" />
                    </Button>
                    <h1 className="font-bold text-lg text-slate-900">Find Clinic</h1>
                </div>
                <div className="flex items-center gap-2" onClick={() => setActiveTab('PROFILE')}>
                     {userProfileName && <span className="text-sm font-medium text-slate-600 hidden sm:block">Hi, {userProfileName.split(' ')[0]}</span>}
                     <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 cursor-pointer">
                        <User className="h-5 w-5" />
                     </div>
                </div>
            </header>
            
            <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col relative">
                
                {/* SEARCH & FILTERS */}
                <div className="mb-4 space-y-3">
                    <div className="flex gap-2">
                        {/* City Dropdown */}
                        <div className="relative w-1/3">
                            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600 pointer-events-none" />
                            <select 
                                className="w-full pl-8 pr-2 py-3 rounded-xl border border-slate-200 shadow-sm bg-white text-sm font-medium appearance-none focus:ring-2 focus:ring-primary-500 focus:outline-none truncate"
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                            >
                                <option value="">All Cities</option>
                                {availableCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 rotate-90 pointer-events-none" />
                        </div>

                        {/* Name Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Hospital or Doctor..."
                                className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Location & QR */}
                    <div className="flex gap-2">
                        <button 
                            onClick={handleUseLocation} 
                            disabled={isLocating}
                            className={`flex-1 p-2.5 rounded-lg transition-colors border text-sm font-medium flex items-center justify-center gap-2 ${isLocating ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-primary-600 hover:bg-primary-50'}`}
                        >
                            <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
                            {isLocating ? 'Locating...' : 'Near Me'}
                        </button>

                        <button 
                            onClick={() => setShowQRScanner(true)}
                            className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                        >
                            <QrCode className="h-4 w-4" /> Scan QR
                        </button>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar pt-1">
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0 ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                >
                                    <Icon className={`h-3 w-3 ${isSelected ? 'text-white' : cat.color.split(' ')[0]}`} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RESULTS */}
                {viewMode === 'LIST' ? (
                    <div className="space-y-3 pb-24 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-1 px-1">
                             <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {searchCity ? `${searchCity} • ` : ''} 
                                    {selectedCategory ? `${selectedCategory}s` : searchQuery ? 'Search Results' : 'Clinics'}
                                </span>
                             </div>
                             <div className="flex items-center gap-2">
                                {userLocation && (
                                    <span className="text-[10px] text-primary-600 font-bold flex items-center bg-primary-50 px-2 py-0.5 rounded">
                                        <Navigation className="h-3 w-3 mr-1" />
                                        Nearest
                                    </span>
                                )}
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button onClick={() => setViewMode('LIST')} className="p-1 rounded bg-white shadow"><List className="h-4 w-4 text-slate-600"/></button>
                                    <button onClick={() => setViewMode('MAP')} className="p-1 rounded"><Map className="h-4 w-4 text-slate-600"/></button>
                                </div>
                             </div>
                        </div>
                        
                        {filteredClinics.length > 0 ? filteredClinics.map(clinic => (
                            <Card 
                                key={clinic.id} 
                                className="p-4 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all flex items-center justify-between group"
                                onClick={() => setSelectedClinicId(clinic.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 mt-1 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors flex-shrink-0">
                                        <Building className="h-6 w-6 text-slate-500 group-hover:text-primary-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 leading-tight">{clinic.name}</h3>
                                            {clinic.distance !== null && (
                                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {clinic.distance.toFixed(1)} km
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-1.5 mt-1">
                                             {Array.from(new Set(clinic.doctors.map(d => d.specialty))).slice(0, 2).map(spec => (
                                                 <span key={spec} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                     {spec}
                                                 </span>
                                             ))}
                                             {new Set(clinic.doctors.map(d => d.specialty)).size > 2 && (
                                                 <span className="text-[10px] text-slate-400 py-0.5">+{new Set(clinic.doctors.map(d => d.specialty)).size - 2}</span>
                                             )}
                                        </div>
                                        <div className="flex items-start gap-1 text-xs text-slate-400">
                                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-1">{clinic.city}, {clinic.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowLeft className="h-5 w-5 rotate-180 text-slate-300 group-hover:text-primary-500" />
                            </Card>
                        )) : (
                            <div className="text-center py-10 text-slate-400">
                                <Filter className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No clinics found.</p>
                                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSearchCity(''); setSelectedCategory(null); }} className="mt-2 text-primary-600">
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // MAP VIEW SIMULATION
                    <div className="relative w-full h-[500px] bg-slate-200 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
                        {/* Map Grid Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* User Location Pin */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                            <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                            <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-1 rounded mt-1">You</span>
                        </div>

                        {/* Clinic Pins */}
                        {filteredClinics.map((clinic, idx) => (
                            <div 
                                key={clinic.id}
                                className="absolute cursor-pointer group z-20"
                                style={{ 
                                    top: `${clinic.coordinates?.y || 50}%`, 
                                    left: `${clinic.coordinates?.x || 50}%` 
                                }}
                                onClick={() => setSelectedClinicId(clinic.id)}
                            >
                                <MapPin className="h-8 w-8 text-primary-600 drop-shadow-md hover:-translate-y-1 transition-transform" fill="currentColor" />
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow-lg text-xs font-bold whitespace-nowrap hidden group-hover:block z-30">
                                    {clinic.name}
                                </div>
                            </div>
                        ))}

                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-slate-500 shadow-sm">
                            Map Mode (Simulation)
                        </div>
                         <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-1 rounded-lg shadow-sm">
                             <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-100 rounded"><List className="h-5 w-5 text-slate-600"/></button>
                         </div>
                    </div>
                )}
                
                {/* BOTTOM NAV */}
                <div className="mt-auto fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pt-2 pb-6 px-6 flex justify-around max-w-md mx-auto z-20">
                    <button onClick={() => { setActiveTab('NEW'); setSelectedClinicId(''); }} className="flex flex-col items-center text-primary-600">
                        <Building className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Book</span>
                    </button>
                    <button onClick={() => setActiveTab('ACTIVE')} className="flex flex-col items-center text-slate-400 hover:text-slate-600">
                        <Activity className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Active</span>
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className="flex flex-col items-center text-slate-400 hover:text-slate-600">
                        <History className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">History</span>
                    </button>
                </div>
            </main>
        </div>
    )
  }

  // -- VIEW: Main App Layout --
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                {selectedClinicId && activeTab === 'NEW' ? (
                     <Button variant="ghost" size="sm" onClick={() => setSelectedClinicId('')}>
                        <ArrowLeft className="h-5 w-5" />
                     </Button>
                ) : (
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <LogOut className="h-5 w-5 text-red-500" />
                     </Button>
                )}
                
                <div className="flex flex-col">
                    <h1 className="font-bold text-slate-900 truncate max-w-[150px]">
                        {selectedClinicId && activeTab === 'NEW' ? currentClinic?.name : 'My Health'}
                    </h1>
                </div>
            </div>
            <button onClick={() => setActiveTab('PROFILE')} className="p-2 hover:bg-slate-100 rounded-full">
                <Users className="h-5 w-5 text-slate-600" />
            </button>
        </header>

        <main className="flex-1 p-4 max-w-md mx-auto w-full pb-24">
            {/* Tab Switcher */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200 mb-6 sticky top-20 z-10">
                <button 
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'NEW' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => { setActiveTab('NEW'); setSelectedClinicId(''); }}
                >
                    Book
                </button>
                <button 
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ACTIVE' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('ACTIVE')}
                >
                    Active
                </button>
                <button 
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('HISTORY')}
                >
                    History
                </button>
            </div>

            {/* --- TAB: NEW BOOKING (Logic Handled above for Clinic Select, this is form) --- */}
            {activeTab === 'NEW' && selectedClinicId && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    <div className="flex justify-center gap-4 mb-6">
                        <button 
                            type="button" 
                            onClick={() => setIsAppointmentMode(false)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-colors ${!isAppointmentMode ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                            <Ticket className="h-4 w-4" /> Walk-In
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsAppointmentMode(true)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-colors ${isAppointmentMode ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                            <CalendarCheck className="h-4 w-4" /> Appointment
                        </button>
                    </div>

                    <Card className="p-6">
                        <form onSubmit={handleGetToken} className="space-y-5">
                             
                             {/* Patient Selector */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Who is this for?</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => selectPatient('myself')}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedMemberId === 'myself' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        Myself ({userProfileName.split(' ')[0]})
                                    </button>
                                    {familyMembers.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => selectPatient('member', m.id)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedMemberId === m.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                        >
                                            {m.name} ({m.relation})
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => selectPatient('new')}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all ${selectedMemberId === 'custom' ? 'bg-slate-100 text-slate-900 border-slate-400' : 'bg-white text-slate-400 border-slate-300'}`}
                                    >
                                        + Other
                                    </button>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 gap-4">
                                <Input 
                                    label="Full Name"
                                    placeholder="e.g. Rahul Verma"
                                    value={newName}
                                    onChange={(e) => { setNewName(e.target.value); setSelectedMemberId('custom'); }}
                                    required
                                />
                                <Input 
                                    label="Phone Number"
                                    placeholder="10 digit mobile"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                />
                             </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                                <select 
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedDocId}
                                    onChange={(e) => { setSelectedDocId(e.target.value); setSelectedSlot(''); }}
                                    required
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {currentClinic?.doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            {/* CALENDAR & SLOTS */}
                            {isAppointmentMode && selectedDocId && (
                                <div className="animate-in fade-in space-y-4">
                                    
                                    {/* Month Selector */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-slate-800">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronRight className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-xs font-bold text-slate-400">{d}</span>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {renderCalendar()}
                                        </div>
                                        <div className="text-center mt-2 text-xs text-slate-500">
                                            Selected: <span className="font-bold text-purple-700">{chosenDateStr}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-700">Available Slots</label>
                                            {scheduleStatus.workingHours && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {scheduleStatus.workingHours}
                                                </span>
                                            )}
                                        </div>

                                        {/* SLOT RENDER LOGIC */}
                                        {scheduleStatus.shiftStarted ? (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                                <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-orange-800">Booking Closed for Today</p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Doctor's shift has already started. Please use <strong>Walk-In</strong> mode or visit the clinic directly.
                                                </p>
                                            </div>
                                        ) : scheduleStatus.isOff ? (
                                            <div className="p-4 bg-slate-100 rounded-lg text-center text-slate-500 text-sm">
                                                Doctor is OFF on this day.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`px-2 py-2 text-sm rounded border transition-all ${selectedSlot === slot ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}
                                                    >
                                                        {slot}
                                                    </button>
                                                )) : (
                                                    <p className="col-span-3 text-sm text-slate-500 text-center py-4 bg-slate-50 rounded italic">
                                                        No slots available. Fully booked.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className={`w-full mt-4 h-12 text-lg shadow-lg ${isAppointmentMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'shadow-primary-200'}`} 
                                disabled={isAppointmentMode && (!selectedSlot || !selectedDocId)}
                            >
                                {isAppointmentMode ? 'Confirm Appointment' : 'Get Token Now'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* --- TAB: ACTIVE TOKENS --- */}
            {activeTab === 'ACTIVE' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    
                    {!userPhone && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Session Error:</strong> Please re-login.
                            </p>
                        </div>
                    )}

                    {/* RENDER AUTO-DETECTED ACTIVE VISITS */}
                    {activeVisits.length > 0 ? (
                        activeVisits.map((visit) => {
                            const queueInfo = getQueueInfoForVisit(visit);
                            const isAppt = visit.visitType === 'APPOINTMENT';
                            const apptTime = isAppt && visit.appointmentDate && visit.appointmentTime ? parseAppointmentDateTime(visit.appointmentDate, visit.appointmentTime) : null;
                            const existingReminder = reminders.find(r => r.id === visit.id && !r.sent);

                            return (
                                <Card key={visit.id} className={`p-6 border-t-4 relative overflow-hidden mb-4 ${visit.isEmergency ? 'border-t-orange-500' : isAppt ? 'border-t-purple-500' : 'border-t-primary-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                            <p className="text-sm font-semibold text-primary-700 flex items-center gap-1">
                                                <User className="h-3 w-3" /> {visit.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{new Date(visit.timeAdded).toDateString()}</p>
                                        </div>
                                        <Badge status={visit.status} />
                                    </div>
                                    
                                    <div className="text-center mb-6 relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                                            {visit.isEmergency ? 'Emergency Token' : isAppt ? 'Appointment Token' : 'Walk-in Token'}
                                        </p>
                                        <div className={`text-5xl font-black mt-2 ${visit.isEmergency ? 'text-orange-500' : isAppt ? 'text-purple-600' : 'text-primary-600'}`}>
                                            #{visit.tokenNumber}
                                        </div>
                                        {isAppt && (
                                            <span className="inline-block mt-2 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                                {visit.appointmentDate} @ {visit.appointmentTime}
                                            </span>
                                        )}
                                        {visit.isEmergency && (
                                            <span className="inline-block mt-2 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded flex items-center justify-center gap-1">
                                                <Zap className="h-3 w-3 fill-current"/> PRIORITY
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Doctor</p>
                                                    <p className="font-medium text-slate-900">{visit.doctorName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-xs text-slate-500">Room</p>
                                                 <p className="font-bold text-slate-900">{visit.doctorRoom}</p>
                                            </div>
                                        </div>

                                        {/* APPOINTMENT REMINDER SECTION */}
                                        {isAppt && apptTime && apptTime > Date.now() && visit.status === PatientStatus.WAITING && (
                                            <div className="border-t border-slate-100 pt-3">
                                                <div className="flex justify-between items-center">
                                                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                                         {existingReminder ? <BellRing className="h-3 w-3 text-purple-600" /> : <Bell className="h-3 w-3" />}
                                                         Reminder
                                                     </div>
                                                     
                                                     {existingReminder ? (
                                                         <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded-lg">
                                                             <span className="text-xs text-purple-700 font-medium">
                                                                Set for {existingReminder.minutesBefore}m before
                                                             </span>
                                                             <button 
                                                                onClick={() => handleRemoveReminder(visit.id)}
                                                                className="text-slate-400 hover:text-red-500"
                                                                title="Remove Reminder"
                                                             >
                                                                 <BellOff className="h-3 w-3" />
                                                             </button>
                                                         </div>
                                                     ) : (
                                                         <div className="flex gap-1">
                                                             <button onClick={() => handleSetReminder(visit.id, apptTime, 15, visit.doctorName)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 hover:border-purple-300 text-slate-600 px-2 py-1 rounded">
                                                                15m
                                                             </button>
                                                             <button onClick={() => handleSetReminder(visit.id, apptTime, 30, visit.doctorName)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 hover:border-purple-300 text-slate-600 px-2 py-1 rounded">
                                                                30m
                                                             </button>
                                                             <button onClick={() => handleSetReminder(visit.id, apptTime, 60, visit.doctorName)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 hover:border-purple-300 text-slate-600 px-2 py-1 rounded">
                                                                1h
                                                             </button>
                                                         </div>
                                                     )}
                                                </div>
                                            </div>
                                        )}

                                        {visit.status === PatientStatus.WAITING && queueInfo && (
                                            <>
                                            {queueInfo.doctorDelay > 0 && (
                                                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <strong>Doctor Delayed</strong><br/>
                                                        Running {queueInfo.doctorDelay} mins late.
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 text-center bg-slate-800 text-white rounded-lg">
                                                    <div className="text-2xl font-bold mb-1">{queueInfo.position}</div>
                                                    <p className="text-xs opacity-70 font-medium">People Ahead</p>
                                                </div>
                                                <div className="p-3 text-center bg-white border border-slate-200 rounded-lg">
                                                    <div className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center gap-1">
                                                        {queueInfo.estWait}<span className="text-sm font-normal text-slate-400">min</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">Est. Wait Time</p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm text-center font-medium border border-blue-100">
                                                {queueInfo.statusMsg}
                                            </div>
                                            </>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                            <button 
                                                onClick={() => handleGetDirections(visit as Clinic)} // Casting works because we flattened props
                                                className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                <MapIcon className="h-4 w-4" /> Get Directions
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(visit.clinicId, visit.id)}
                                                className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        !manualSearchError && <div className="text-center py-8 text-slate-400">No active tokens found linked to your number.</div>
                    )}

                    {/* MANUAL SEARCH FALLBACK */}
                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                             <Search className="h-4 w-4" /> Track by ID (Manual)
                        </h4>
                        <Card className="p-6 bg-white">
                            {searchedPatient ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                         <h3 className="font-bold">{searchedPatient.clinicName}</h3>
                                         <button onClick={() => setSearchedPatient(null)} className="text-xs text-red-500 hover:underline">Clear</button>
                                    </div>
                                    <div className="text-center mb-4">
                                         <div className="text-4xl font-bold text-slate-800">#{searchedPatient.tokenNumber}</div>
                                         <Badge status={searchedPatient.status} />
                                    </div>
                                    <div className="text-sm text-center text-slate-500 mb-2">
                                        Doctor: {searchedPatient.doctorName}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleManualSearch} className="flex gap-2">
                                    <div className="flex-1">
                                        <Input 
                                            placeholder="Token #" 
                                            type="number" 
                                            value={tokenInput} 
                                            onChange={(e) => setTokenInput(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" variant="secondary">Track</Button>
                                </form>
                            )}
                            {manualSearchError && <p className="text-red-500 text-sm mt-2">{manualSearchError}</p>}
                        </Card>
                    </div>
                </div>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === 'HISTORY' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                     {!userPhone && (
                        <div className="text-center p-8 text-slate-400">
                            Session error. Please re-login.
                        </div>
                     )}

                     {historyVisits.length > 0 ? (
                         historyVisits.map((visit) => {
                             const isAppt = visit.visitType === 'APPOINTMENT';
                             return (
                             <Card key={visit.id} className="p-0 overflow-hidden border border-slate-200 flex flex-col">
                                 <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                         <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-500">
                                            <Building className="h-5 w-5" />
                                         </div>
                                         <div>
                                             <h3 className="font-bold text-slate-900 text-sm">{visit.clinicName}</h3>
                                             <div className="flex items-center gap-2 text-xs text-slate-500">
                                                 <Clock className="h-3 w-3" />
                                                 {new Date(visit.timeAdded).toLocaleDateString()} • {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </div>
                                         </div>
                                     </div>
                                     <Badge status={visit.status} />
                                 </div>
                                 
                                 <div className="p-4">
                                     <div className="flex justify-between items-start mb-4">
                                         <div>
                                             <div className="flex items-center gap-2 text-sm text-slate-900 font-bold mb-1">
                                                 <User className="h-4 w-4 text-primary-600" />
                                                 {visit.doctorName}
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAppt ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                     {isAppt ? 'APPOINTMENT' : 'WALK-IN'}
                                                 </span>
                                                 <span className="text-xs text-slate-500">Token #{visit.tokenNumber}</span>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             {isAppt && (
                                                <div className="text-xs text-slate-400">
                                                    Scheduled: {visit.appointmentTime}
                                                </div>
                                             )}
                                         </div>
                                     </div>

                                     {visit.notes && (
                                         <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4">
                                             <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 uppercase mb-1">
                                                 <FileText className="h-3 w-3" /> Consultation Notes
                                             </div>
                                             <p className="text-xs text-slate-700 leading-relaxed italic">"{visit.notes}"</p>
                                         </div>
                                     )}

                                     {/* FEEDBACK & RATING */}
                                     {visit.status === PatientStatus.COMPLETED && (
                                        <div className="mb-4">
                                            {!visit.rating ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500">Rate Visit:</span>
                                                    {[1,2,3,4,5].map(star => (
                                                        <button 
                                                            key={star}
                                                            onClick={() => handleRateVisit(visit.id, star)}
                                                            className="text-slate-300 hover:text-yellow-400 focus:outline-none"
                                                        >
                                                            <Star className="h-5 w-5 fill-current" />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    {[...Array(visit.rating)].map((_, i) => (
                                                        <Star key={i} className="h-4 w-4 fill-current" />
                                                    ))}
                                                    <span className="text-xs text-slate-400 ml-2">Thanks!</span>
                                                </div>
                                            )}
                                        </div>
                                     )}

                                     <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="w-full border-slate-200 hover:bg-slate-50 text-slate-600"
                                        onClick={() => handleBookAgain(visit.clinicId, visit.doctorId)}
                                     >
                                         <RefreshCcw className="h-3 w-3 mr-2" /> Book Again
                                     </Button>
                                 </div>
                             </Card>
                         )})
                     ) : (
                         userPhone && (
                            <div className="text-center py-12">
                                <History className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400">No past visits found.</p>
                            </div>
                         )
                     )}
                 </div>
            )}

            {/* --- TAB: PROFILE & FAMILY --- */}
            {activeTab === 'PROFILE' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                     
                     {/* My Profile Section */}
                     <Card className="p-6">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg text-slate-900">My Details</h3>
                         </div>
                         <div className="space-y-4">
                             <Input 
                                label="My Name"
                                value={userProfileName}
                                onChange={(e) => handleUpdateProfile(e.target.value)}
                                placeholder="Enter your name"
                             />
                             <div className="opacity-50">
                                <Input 
                                    label="Registered Phone"
                                    value={userPhone}
                                    disabled
                                />
                             </div>
                         </div>
                     </Card>

                     {/* Family Members Section */}
                     <div className="space-y-3">
                         <h3 className="font-bold text-lg text-slate-900 px-1">Family Members</h3>
                         {familyMembers.length === 0 && (
                             <div className="text-center p-6 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                                 <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                 <p className="text-slate-500 text-sm">Add family members to book quickly for them.</p>
                             </div>
                         )}
                         
                         {familyMembers.map((member) => (
                             <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                 <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                         {member.name[0]}
                                     </div>
                                     <div>
                                         <div className="font-bold text-slate-900">{member.name}</div>
                                         <div className="text-xs text-slate-500">{member.relation}</div>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={() => removeFamilyMember(member.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                 >
                                     <Trash2 className="h-5 w-5" />
                                 </button>
                             </div>
                         ))}

                         {/* Add Member Form */}
                         <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('memberName') as string;
                                const rel = formData.get('memberRel') as string;
                                if (name && rel) {
                                    addFamilyMember(name, rel);
                                    (e.target as HTMLFormElement).reset();
                                }
                            }}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4"
                         >
                             <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Member</h4>
                             <div className="flex gap-2 mb-3">
                                 <input name="memberName" placeholder="Name" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                                 <input name="memberRel" placeholder="Relation (e.g. Son)" className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                             </div>
                             <Button type="submit" size="sm" variant="secondary" className="w-full">
                                 <Plus className="h-4 w-4 mr-2" /> Add Member
                             </Button>
                         </form>
                     </div>
                 </div>
            )}
        </main>
    </div>
  );
};
