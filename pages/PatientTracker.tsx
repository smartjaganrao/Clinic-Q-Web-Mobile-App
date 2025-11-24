import React, { useState, useEffect, useMemo } from 'react';
import { PatientStatus, Clinic } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { ArrowLeft, MapPin, Search, Building, Ticket, CalendarCheck, User, Users, Plus, Trash2, Save, History, Clock, ChevronRight, Activity, ChevronLeft, AlertTriangle, QrCode, Map, List, ScanLine, LogOut } from 'lucide-react';

interface PatientTrackerProps {
  clinics: Clinic[];
  userPhone: string;
  userName: string;
  onBack: () => void;
  onGetToken: (name: string, phone: string, doctorId: string, clinicId: string, appointmentTime?: string, appointmentDate?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
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

// Helper for Local Date String (YYYY-MM-DD)
const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const PatientTracker: React.FC<PatientTrackerProps> = ({ clinics, userPhone, userName, onBack, onGetToken, addToast }) => {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'HISTORY' | 'PROFILE'>('NEW');
  
  // -- LOCAL STORAGE / PROFILE STATE --
  // Initialize from props
  const [userProfileName, setUserProfileName] = useState(userName);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // -- SEARCH & MAP STATE --
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [showQRScanner, setShowQRScanner] = useState(false);

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
                      doctorName: doc?.name || 'Unknown',
                      doctorRoom: doc?.roomNumber || '-'
                  });
              }
          });
      });
      return visits.sort((a, b) => b.timeAdded - a.timeAdded);
  }, [clinics, userPhone]);

  const activeVisits = allUserVisits.filter(v => v.status !== PatientStatus.COMPLETED && v.status !== PatientStatus.CANCELLED);
  const historyVisits = allUserVisits.filter(v => v.status === PatientStatus.COMPLETED || v.status === PatientStatus.CANCELLED);

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

  const getQueueInfoForVisit = (visit: any) => {
    const clinic = clinics.find(c => c.id === visit.clinicId);
    if (!clinic || visit.status !== PatientStatus.WAITING) return null;
    
    const ahead = clinic.patients.filter(p => p.doctorId === visit.doctorId && p.status === PatientStatus.WAITING && p.tokenNumber < visit.tokenNumber);
    return { position: ahead.length + 1, estWait: (ahead.length + 1) * 10 };
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

  // Helper for Calendar Render
  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];
    
    // Empty slots
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
  
  // -- QR SCANNER VIEW --
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
    const filteredClinics = clinics.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.pincode.includes(searchQuery) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                
                {/* SEARCH BAR & TOOLS */}
                <div className="mb-6 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by Name, Pincode or City..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowQRScanner(true)}
                            className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                        >
                            <QrCode className="h-4 w-4" /> Scan QR
                        </button>
                        <div className="bg-slate-200 p-1 rounded-lg flex">
                             <button 
                                onClick={() => setViewMode('LIST')}
                                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                             >
                                 <List className="h-4 w-4" />
                             </button>
                             <button 
                                onClick={() => setViewMode('MAP')}
                                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'MAP' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                             >
                                 <Map className="h-4 w-4" />
                             </button>
                        </div>
                    </div>
                </div>

                {/* RESULTS */}
                {viewMode === 'LIST' ? (
                    <div className="space-y-3 pb-24">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {searchQuery ? `Results for "${searchQuery}"` : 'Nearby Clinics'}
                        </h3>
                        {filteredClinics.length > 0 ? filteredClinics.map(clinic => (
                            <Card 
                                key={clinic.id} 
                                className="p-4 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all flex items-center justify-between group"
                                onClick={() => setSelectedClinicId(clinic.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 mt-1 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        <Building className="h-5 w-5 text-slate-500 group-hover:text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{clinic.name}</h3>
                                        <p className="text-xs text-slate-500 mb-1">{clinic.doctors.length} Doctors Available</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]">{clinic.address}, {clinic.pincode}</span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowLeft className="h-5 w-5 rotate-180 text-slate-300 group-hover:text-primary-500" />
                            </Card>
                        )) : (
                            <div className="text-center py-10 text-slate-400">
                                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No clinics found matching your search.</p>
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
                            Use map to explore nearby clinics. Click pin to book.
                        </div>
                    </div>
                )}
                
                {/* BOTTOM NAV */}
                <div className="mt-auto fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pt-2 pb-6 px-6 flex justify-around max-w-md mx-auto z-20">
                    <button onClick={() => setActiveTab('NEW')} className="flex flex-col items-center text-primary-600">
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
                            return (
                                <Card key={visit.id} className={`p-6 border-t-4 relative overflow-hidden mb-4 ${isAppt ? 'border-t-purple-500' : 'border-t-primary-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{visit.clinicName}</h3>
                                            <p className="text-xs text-slate-500">{new Date(visit.timeAdded).toDateString()}</p>
                                        </div>
                                        <Badge status={visit.status} />
                                    </div>
                                    
                                    <div className="text-center mb-6 relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                                            {isAppt ? 'Appointment Token' : 'Walk-in Token'}
                                        </p>
                                        <div className={`text-5xl font-black mt-2 ${isAppt ? 'text-purple-600' : 'text-primary-600'}`}>
                                            #{visit.tokenNumber}
                                        </div>
                                        {isAppt && (
                                            <span className="inline-block mt-2 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                                {visit.appointmentDate} @ {visit.appointmentTime}
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

                                        {visit.status === PatientStatus.WAITING && queueInfo && (
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
                                        )}
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
                         historyVisits.map((visit) => (
                             <Card key={visit.id} className="p-4 flex flex-col gap-3">
                                 <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-3">
                                         <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Building className="h-5 w-5" />
                                         </div>
                                         <div>
                                             <h3 className="font-bold text-slate-900 text-sm">{visit.clinicName}</h3>
                                             <p className="text-xs text-slate-500">{new Date(visit.timeAdded).toLocaleDateString()} • {new Date(visit.timeAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                         </div>
                                     </div>
                                     <Badge status={visit.status} />
                                 </div>
                                 <div className="pl-12">
                                     <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                                         <User className="h-3 w-3 text-slate-400" />
                                         <span className="font-medium">{visit.doctorName}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-xs text-slate-500">
                                         <Ticket className="h-3 w-3" />
                                         <span>Token #{visit.tokenNumber}</span>
                                     </div>
                                 </div>
                             </Card>
                         ))
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