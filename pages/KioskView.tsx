
import React, { useEffect, useRef, useState } from 'react';
import { Doctor, Patient, PatientStatus, DoctorStatus } from '../types';
import { Coffee, Clock, Zap, AlertTriangle, PlayCircle, LogOut, Maximize, Minimize, User, Calendar, Languages, Volume2, VolumeX, Settings, X, Check } from 'lucide-react';

interface KioskProps {
  doctors: Doctor[];
  patients: Patient[];
  clinicName: string;
  onExit: () => void;
}

// --- LOCALIZATION CONFIG ---
const LANGUAGES = [
    { code: 'en', label: 'English', langCode: 'en-IN' },
    { code: 'ta', label: 'தமிழ் (Tamil)', langCode: 'ta-IN' },
    { code: 'te', label: 'తెలుగు (Telugu)', langCode: 'te-IN' },
    { code: 'hi', label: 'हिंदी (Hindi)', langCode: 'hi-IN' }
];

const TRANSLATIONS = {
    en: {
        emergency: "Emergency Alert. Priority patient {name} to Room {room}",
        token: "Token {token}, {name}, please proceed to Room {room}",
        nowServing: "Now Serving",
        upNext: "Up Next",
        waiting: "Waiting",
        appt: "Appt",
        walkIn: "Walk-In"
    },
    ta: {
        emergency: "அவசர அறிவிப்பு. நோயாளி {name}, அறை எண் {room}-க்கு செல்லவும்",
        token: "டோக்கன் {token}, {name}, அறை எண் {room}-க்கு செல்லவும்",
        nowServing: "இப்போது அழைப்பது",
        upNext: "அடுத்து",
        waiting: "காத்திருப்பு",
        appt: "பதிவு",
        walkIn: "நேரடி"
    },
    te: {
        emergency: "అత్యవసర హెచ్చరిక. పేషెంట్ {name}, గది సంఖ్య {room}-కు వెళ్ళండి",
        token: "టోకెన్ {token}, {name}, దయచేసి గది సంఖ్య {room}-కు వెళ్ళండి",
        nowServing: "ప్రస్తుతం పిలుస్తున్నారు",
        upNext: "తరువాత",
        waiting: "వేచి ఉన్నారు",
        appt: "అపాయింట్మెంట్",
        walkIn: "వాక్-ఇన్"
    },
    hi: {
        emergency: "आपातकालीन घोषणा. मरीज {name}, कृपया कक्ष संख्या {room} में जाएं",
        token: "टोकन नंबर {token}, {name}, कृपया कक्ष संख्या {room} में जाएं",
        nowServing: "अब बुला रहे हैं",
        upNext: "अगला नंबर",
        waiting: "प्रतीक्षा में",
        appt: "नियुक्ति",
        walkIn: "वॉक-इन"
    }
};

export const KioskView: React.FC<KioskProps> = ({ doctors, patients, clinicName, onExit }) => {
  // Browser Audio Policy State
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'ta' | 'te' | 'hi'>('en');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [missingVoiceWarning, setMissingVoiceWarning] = useState<string>('');
  
  // Voice Preferences (Persisted)
  const [voicePreferences, setVoicePreferences] = useState<Record<string, string>>({}); // langCode -> voiceURI
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Track previous serving tokens AND language to trigger TTS only on change
  const lastServingRef = useRef<Record<string, { token: number, lang: string }>>({});
  
  // Emergency Flash State
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: Patient, doctorName: string } | null>(null);

  // Responsive Pagination State
  const [doctorsPerPage, setDoctorsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter only available/active doctors if needed, or show all assigned to this clinic
  const displayDoctors = doctors;
  const totalPages = Math.ceil(displayDoctors.length / doctorsPerPage);

  // --- LOAD VOICES & PREFS ---
  useEffect(() => {
      const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
              setAvailableVoices(voices);
          }
      };
      
      loadVoices();
      
      // Some browsers fire this asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // Fallback polling for Safari/Chrome sometimes failing to trigger event
      const interval = setInterval(loadVoices, 1000);

      // Load Saved Prefs
      try {
          const saved = localStorage.getItem('kiosk_voice_prefs');
          if (saved) setVoicePreferences(JSON.parse(saved));
      } catch (e) { console.error("Error loading voice prefs", e); }

      return () => {
          window.speechSynthesis.onvoiceschanged = null;
          clearInterval(interval);
      };
  }, []);

  // --- HELPER: GET BEST VOICE ---
  const getBestVoice = (langCode: string) => {
      // 1. Check User Preference First
      if (voicePreferences[langCode]) {
          const prefVoice = availableVoices.find(v => v.voiceURI === voicePreferences[langCode]);
          if (prefVoice) return { voice: prefVoice, isExplicitFemale: false };
      }

      // 2. Heuristic Search
      const normalizedLang = langCode.toLowerCase().replace('_', '-');
      const baseLang = normalizedLang.split('-')[0];
      
      // Filter voices that loosely match the language
      const langVoices = availableVoices.filter(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          return vLang.includes(normalizedLang) || vLang.includes(baseLang);
      });
      
      if (langVoices.length === 0) return null;

      // Priority: Google > Female > First
      const googleVoice = langVoices.find(v => v.name.toLowerCase().includes('google'));
      if (googleVoice) return { voice: googleVoice, isExplicitFemale: false }; 

      const femaleVoice = langVoices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('woman') ||
          v.name.toLowerCase().includes('samantha')
      );
      if (femaleVoice) return { voice: femaleVoice, isExplicitFemale: true };

      return { voice: langVoices[0], isExplicitFemale: false };
  };

  const speak = (text: string, forceLang?: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = forceLang || currentLang;
      const targetLangConfig = LANGUAGES.find(l => l.code === targetLang);
      
      if (targetLangConfig) {
          const result = getBestVoice(targetLangConfig.langCode);
          if (result) {
              utterance.voice = result.voice;
              utterance.pitch = result.isExplicitFemale ? 1.05 : 1.1; 
              utterance.lang = result.voice.lang; 
          } else {
              // Fallback
              console.warn(`No voice found for ${targetLangConfig.langCode}`);
              utterance.lang = targetLangConfig.langCode;
          }
      }
      
      utterance.rate = 0.9; 
      window.speechSynthesis.speak(utterance);
  };

  // --- CHECK VOICE WARNING ---
  useEffect(() => {
      const targetLangConfig = LANGUAGES.find(l => l.code === currentLang);
      if (targetLangConfig && availableVoices.length > 0) {
          const result = getBestVoice(targetLangConfig.langCode);
          if (!result && currentLang !== 'en') {
              setMissingVoiceWarning(`${targetLangConfig.label} voice not found. Check settings.`);
          } else {
              setMissingVoiceWarning('');
          }
      }
  }, [currentLang, availableVoices, voicePreferences]);

  const saveVoicePreference = (langCode: string, voiceURI: string) => {
      const newPrefs = { ...voicePreferences, [langCode]: voiceURI };
      setVoicePreferences(newPrefs);
      localStorage.setItem('kiosk_voice_prefs', JSON.stringify(newPrefs));
      
      // Test Speak
      const targetLangConfig = LANGUAGES.find(l => l.langCode === langCode);
      if (targetLangConfig) {
          const testText = targetLangConfig.code === 'ta' ? 'வணக்கம்' : 
                           targetLangConfig.code === 'te' ? 'నమస్కారం' : 
                           targetLangConfig.code === 'hi' ? 'नमस्ते' : 'Hello Test';
          // Use a temporary utterance to test the specific voice immediately
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(testText);
          const v = availableVoices.find(v => v.voiceURI === voiceURI);
          if (v) u.voice = v;
          window.speechSynthesis.speak(u);
      }
  };

  // --- RESPONSIVE LAYOUT HANDLER (UPDATED FOR HEIGHT CHECK) ---
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isShortScreen = height < 600;

      if (width < 768) {
        setDoctorsPerPage(1);
      } else if (width < 1280) {
        setDoctorsPerPage(2);
      } else {
        if (isShortScreen) {
            setDoctorsPerPage(2);
        } else {
            setDoctorsPerPage(4);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => console.log(e));
          setIsFullscreen(true);
      } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
      }
  };

  const handleStart = () => {
      setAudioEnabled(true);
      toggleFullscreen();
      // Speak a test phrase to warm up TTS
      speak(""); 
  };

  useEffect(() => {
    if (!audioEnabled) return;

    let foundEmergency = false;

    displayDoctors.forEach(doc => {
      const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
      
      if (currentPatient) {
        if (currentPatient.isEmergency && !emergencyAlert) {
            setEmergencyAlert({ patient: currentPatient, doctorName: doc.name });
            foundEmergency = true;
            
            const template = TRANSLATIONS[currentLang].emergency;
            const text = template
                .replace('{name}', currentPatient.name)
                .replace('{room}', doc.roomNumber);
            speak(text);
        }

        // Check if token changed OR language changed since last announcement
        const lastState = lastServingRef.current[doc.id];
        const hasTokenChanged = !lastState || lastState.token !== currentPatient.tokenNumber;
        const hasLangChanged = lastState && lastState.lang !== currentLang;

        if (hasTokenChanged || hasLangChanged) {
          if (!currentPatient.isEmergency) {
              const template = TRANSLATIONS[currentLang].token;
              const text = template
                .replace('{token}', currentPatient.tokenNumber.toString())
                .replace('{name}', currentPatient.name)
                .replace('{room}', doc.roomNumber);
              
              // Small delay to ensure language switch state has settled if triggered by lang change
              setTimeout(() => speak(text), 200);
          }
          // Update ref with current token AND language
          lastServingRef.current[doc.id] = { 
              token: currentPatient.tokenNumber, 
              lang: currentLang 
          };
        }
      }
    });

    if (!foundEmergency && emergencyAlert) {
        setEmergencyAlert(null);
    }

  }, [patients, displayDoctors, emergencyAlert, audioEnabled, currentLang]);

  useEffect(() => {
      if (totalPages <= 1) return;
      const interval = setInterval(() => {
          setCurrentPage(prev => (prev + 1) % totalPages);
      }, 15000); 

      return () => clearInterval(interval);
  }, [totalPages, doctorsPerPage]); 

  useEffect(() => {
      if (currentPage >= totalPages) {
          setCurrentPage(0);
      }
  }, [totalPages, currentPage]);

  const visibleDoctors = displayDoctors.slice(currentPage * doctorsPerPage, (currentPage + 1) * doctorsPerPage);

  const getSortTime = (p: Patient) => {
      if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
          return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
      }
      return p.timeAdded;
  };

  const getGridTopology = () => {
      if (visibleDoctors.length === 1) return 'grid-cols-1 grid-rows-1';
      if (visibleDoctors.length === 2) return 'grid-cols-1 md:grid-cols-2 grid-rows-1'; 
      return 'grid-cols-1 md:grid-cols-2 grid-rows-2'; 
  };

  const t = TRANSLATIONS[currentLang];

  if (!audioEnabled) {
      return (
          <div className="h-[100dvh] w-screen bg-slate-950 flex items-center justify-center text-white p-8 font-sans overflow-hidden">
              <button 
                  onClick={onExit} 
                  className="absolute top-6 left-6 p-4 text-slate-500 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-white/10 z-50"
              >
                  <LogOut className="h-6 w-6" /> <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">Exit</span>
              </button>
              <div className="text-center max-w-2xl animate-in zoom-in duration-500">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-8 rounded-full bg-primary-600/20 flex items-center justify-center animate-pulse">
                    <PlayCircle className="h-16 w-16 sm:h-20 sm:w-20 text-primary-500" />
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Kiosk Display Mode</h1>
                  <p className="text-slate-400 mb-10 text-lg sm:text-xl leading-relaxed">
                      This will enter fullscreen and enable voice announcements.
                      <br className="hidden sm:block"/> Connect to your TV via HDMI or Cast.
                  </p>
                  
                  <div className="flex justify-center gap-4 mb-8 flex-wrap">
                      {LANGUAGES.map(l => (
                          <button 
                            key={l.code}
                            onClick={() => setCurrentLang(l.code as any)}
                            className={`px-4 py-2 rounded-lg border font-bold transition-all ${currentLang === l.code ? 'bg-primary-600 border-primary-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                          >
                              {l.label}
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={handleStart}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-10 sm:py-6 sm:px-16 rounded-full text-xl sm:text-2xl shadow-2xl shadow-primary-900/50 transition-all transform hover:scale-105 flex items-center gap-4 mx-auto"
                  >
                      <Zap className="h-6 w-6 sm:h-8 sm:w-8 fill-current" /> Launch
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none cursor-none hover:cursor-default transition-all p-2 sm:p-4 lg:p-6 relative">
      
      {/* VOICE SETTINGS MODAL */}
      {showVoiceSettings && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                      <h3 className="font-bold text-white flex items-center gap-2"><Settings className="h-5 w-5" /> Audio Settings</h3>
                      <button onClick={() => setShowVoiceSettings(false)} className="p-2 hover:bg-slate-700 rounded-full"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <p className="text-slate-400 text-sm mb-6">Select specific voices for each language. This ensures correct pronunciation even if the browser default is incorrect.</p>
                      <div className="space-y-6">
                          {LANGUAGES.map(lang => (
                              <div key={lang.code} className="space-y-2">
                                  <label className="text-xs font-bold text-primary-400 uppercase tracking-wider">{lang.label} Voice</label>
                                  <select 
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-primary-500 outline-none"
                                      value={voicePreferences[lang.langCode] || ''}
                                      onChange={(e) => saveVoicePreference(lang.langCode, e.target.value)}
                                  >
                                      <option value="">-- Auto Detect (Default) --</option>
                                      {availableVoices
                                          .filter(v => v.lang.includes(lang.langCode.split('-')[0]) || v.lang.includes(lang.code)) // Loose match for listing
                                          .map(v => (
                                              <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                                          ))
                                      }
                                      {/* Show all voices option for debugging */}
                                      <optgroup label="All Installed Voices">
                                          {availableVoices.map(v => (
                                              <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                                          ))}
                                      </optgroup>
                                  </select>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-4 bg-slate-800 text-right">
                      <button onClick={() => setShowVoiceSettings(false)} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-bold">Done</button>
                  </div>
              </div>
          </div>
      )}

      {emergencyAlert && (
          <div className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center animate-[pulse_1s_ease-in-out_infinite] p-4 text-center">
               <AlertTriangle className="h-32 w-32 sm:h-64 sm:w-64 text-white mb-4 sm:mb-8" />
               <h1 className="text-6xl sm:text-[12rem] font-black text-white uppercase tracking-tighter leading-none mb-4">Emergency</h1>
               <div className="bg-white text-red-600 px-8 py-6 sm:px-20 sm:py-10 rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-4xl">
                   <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-2 sm:mb-4 truncate">{emergencyAlert.patient.name}</h2>
                   <p className="text-2xl sm:text-4xl font-bold text-center text-red-800">Proceed immediately to Room {displayDoctors.find(d => d.name === emergencyAlert.doctorName)?.roomNumber}</p>
               </div>
          </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-center mb-2 sm:mb-4 pb-2 border-b border-slate-800/50 flex-shrink-0 min-h-[50px]">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-100 flex items-center gap-2 sm:gap-4 truncate">
                <span className="truncate">{clinicName}</span>
                <span className="hidden sm:inline-block text-sm sm:text-2xl font-bold bg-primary-600 text-white px-2 py-0.5 sm:px-4 sm:py-1 rounded-full uppercase tracking-wider shadow-lg shadow-primary-900/20 flex-shrink-0">Live Queue</span>
            </h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            {missingVoiceWarning && (
                <button onClick={() => setShowVoiceSettings(true)} className="hidden lg:flex items-center text-orange-400 bg-orange-900/20 px-3 py-1 rounded-full border border-orange-500/30 animate-pulse hover:bg-orange-900/40 transition-colors">
                    <VolumeX className="h-4 w-4 mr-2" />
                    <span className="text-xs font-bold">{missingVoiceWarning}</span>
                </button>
            )}
            
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
                <Languages className="h-4 w-4 text-slate-500 mx-2" />
                <select 
                    value={currentLang} 
                    onChange={(e) => setCurrentLang(e.target.value as any)}
                    className="bg-transparent text-slate-300 text-sm font-bold outline-none border-none cursor-pointer focus:ring-0"
                >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <div className="w-px h-4 bg-slate-700 mx-2"></div>
                <button onClick={() => setShowVoiceSettings(true)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Voice Settings">
                    <Settings className="h-4 w-4" />
                </button>
            </div>

            <div className="text-right">
                <div className="text-lg sm:text-5xl font-mono font-bold tracking-tight text-slate-200">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[10px] sm:text-xl text-slate-500 font-medium uppercase tracking-widest mt-1 hidden sm:block">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
            </div>
            
            <div className="flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300 fixed top-4 right-4 z-50 sm:static sm:opacity-30 sm:hover:opacity-100">
                <button onClick={toggleFullscreen} className="p-2 sm:p-3 rounded-full bg-black/50 sm:bg-transparent hover:bg-white/10 backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none">
                    {isFullscreen ? <Minimize className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
                <button onClick={onExit} className="p-2 sm:p-3 rounded-full bg-black/50 sm:bg-transparent hover:bg-red-500/20 hover:text-red-500 backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none">
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            </div>
        </div>
      </header>

      {/* CONTENT GRID - FILLS REMAINING SPACE WITHOUT SCROLL */}
      <div className={`flex-1 min-h-0 grid gap-2 sm:gap-4 lg:gap-6 ${getGridTopology()}`}>
            {visibleDoctors.map(doc => {
            const currentPatient = patients.find(p => p.doctorId === doc.id && p.status === PatientStatus.WITH_DOCTOR);
            const nextPatients = patients
                .filter(p => p.doctorId === doc.id && p.status === PatientStatus.WAITING)
                .sort((a, b) => {
                    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
                    return getSortTime(a) - getSortTime(b);
                })
                .slice(0, 3);

            return (
                <div key={doc.id} className="bg-slate-900 rounded-xl sm:rounded-[2rem] p-2 sm:p-4 lg:p-6 border border-slate-800 flex flex-col shadow-xl relative overflow-hidden h-full ring-1 ring-white/5">
                
                {doc.status !== DoctorStatus.AVAILABLE && (
                    <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
                        {doc.status === DoctorStatus.ON_BREAK ? (
                            <>
                                <Coffee className="h-12 w-12 sm:h-24 lg:h-32 text-orange-500 mb-2 sm:mb-6 animate-pulse" />
                                <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">On Break</h3>
                                <p className="text-sm sm:text-xl lg:text-2xl text-slate-400 mt-2 sm:mt-4 font-medium">Dr. {doc.name} will return shortly</p>
                            </>
                        ) : (
                            <>
                                <LogOut className="h-12 w-12 sm:h-24 lg:h-32 text-slate-600 mb-2 sm:mb-6" />
                                <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-500 tracking-tight">Off Duty</h3>
                            </>
                        )}
                    </div>
                )}

                {/* Card Header */}
                <div className="flex items-center gap-2 sm:gap-6 mb-2 sm:mb-4 pb-2 border-b border-slate-800 flex-shrink-0">
                    <div className="h-12 w-12 sm:h-20 lg:h-24 rounded-full bg-slate-800 p-1 border-2 border-primary-500/50 shadow-[0_0_20px_rgba(20,184,166,0.2)] flex-shrink-0">
                        <img src={doc.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-3xl lg:text-4xl font-bold text-white truncate leading-tight">
                            {doc.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-0.5 sm:mt-2">
                            <span className="text-xs sm:text-lg lg:text-xl text-primary-400 font-medium truncate">{doc.specialty}</span>
                            <div className="hidden sm:block h-1.5 w-1.5 rounded-full bg-slate-600"></div>
                            <span className="text-[10px] sm:text-base lg:text-xl text-white font-bold bg-slate-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-slate-700 whitespace-nowrap">Room {doc.roomNumber}</span>
                        </div>
                    </div>
                    {doc.delayMinutes > 0 && (
                        <div className="hidden sm:flex bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1 sm:px-4 sm:py-2 rounded-xl items-center gap-2 sm:gap-3 animate-pulse">
                            <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
                            <span className="font-bold text-sm sm:text-lg">Delayed {doc.delayMinutes}m</span>
                        </div>
                    )}
                </div>

                {/* Main Display Area (Serving) */}
                <div className="flex-1 flex flex-col items-center justify-center mb-2 sm:mb-4 relative rounded-xl sm:rounded-3xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-800/50 min-h-0">
                    {currentPatient ? (
                    <div className="flex flex-col items-center justify-center h-full w-full px-2 sm:px-4 py-2">
                        <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 w-full">
                            
                            {/* Vertical Label */}
                            <div className="flex items-center h-full">
                                <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] -rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                                    {t.nowServing}
                                </span>
                            </div>

                            {/* Token */}
                            <div 
                                className={`font-black leading-none tracking-tighter drop-shadow-2xl ${currentPatient.isEmergency ? 'text-red-500' : currentPatient.visitType === 'APPOINTMENT' ? 'text-purple-400' : 'text-primary-400'}`} 
                                style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}
                            >
                                {currentPatient.tokenNumber}
                            </div>
                            
                            {/* Details */}
                            <div className="flex flex-col items-start justify-center space-y-1 border-l-2 border-slate-700/50 pl-2 sm:pl-6 py-1 sm:py-2 min-w-0">
                                <span className={`text-sm sm:text-xl lg:text-2xl font-black uppercase tracking-tight ${currentPatient.visitType === 'APPOINTMENT' ? 'text-purple-400' : 'text-slate-400'}`}>
                                    {currentPatient.visitType === 'APPOINTMENT' ? t.appt : t.walkIn}
                                </span>
                                {currentPatient.isEmergency && (
                                    <span className="text-[8px] sm:text-sm font-bold text-red-500 uppercase tracking-widest animate-pulse border border-red-500/30 px-1 sm:px-2 py-0.5 rounded">
                                        Emergency
                                    </span>
                                )}
                                {currentPatient.visitType === 'APPOINTMENT' && currentPatient.appointmentTime && (
                                    <span className="text-[8px] sm:text-sm font-medium text-slate-500 flex items-center gap-1 mt-1 bg-slate-800 px-1 sm:px-2 py-0.5 rounded-full">
                                        <Clock className="h-2 w-2 sm:h-3 sm:w-3" /> {currentPatient.appointmentTime}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-1 sm:mt-4 text-center w-full px-2 sm:px-4">
                            <span className="text-lg sm:text-3xl text-white font-bold tracking-tight truncate block max-w-full">{currentPatient.name}</span>
                        </div>
                    </div>
                    ) : (
                    <div className="text-center opacity-30 flex flex-col items-center justify-center h-full">
                        <span className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-600 block">--</span>
                        <span className="text-xs sm:text-xl font-medium text-slate-500 mt-2">{t.waiting}</span>
                    </div>
                    )}
                </div>

                {/* Queue List (Up Next) */}
                <div className="flex-shrink-0 min-h-[60px] sm:min-h-[80px]">
                    <div className="flex justify-between items-end mb-1 sm:mb-2 px-1">
                        <h3 className="text-slate-400 text-[10px] sm:text-sm font-bold uppercase tracking-[0.1em]">{t.upNext}</h3>
                        <span className="text-slate-500 text-[8px] sm:text-xs font-bold">{nextPatients.length} {t.waiting}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 h-full">
                    {nextPatients.map((p, idx) => {
                        const isAppt = p.visitType === 'APPOINTMENT';
                        return (
                            <div key={p.id} className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border relative overflow-hidden flex flex-col justify-between ${isAppt ? 'bg-purple-900/20 border-purple-500/30' : p.isEmergency ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-lg sm:text-2xl lg:text-4xl font-black tracking-tight ${isAppt ? 'text-purple-300' : p.isEmergency ? 'text-red-400' : 'text-slate-200'}`}>{p.tokenNumber}</span>
                                    <span className={`text-[6px] sm:text-[10px] font-extrabold uppercase tracking-wider py-0.5 px-1.5 rounded ${isAppt ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/50 text-slate-400'}`}>
                                        {isAppt ? t.appt : t.walkIn}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <span className={`text-[10px] sm:text-base lg:text-lg font-bold truncate block w-full ${isAppt ? 'text-purple-100' : 'text-slate-300'}`}>{p.name}</span>
                                    {isAppt && <span className="text-[8px] sm:text-xs text-purple-400 font-medium block mt-0.5">{p.appointmentTime}</span>}
                                </div>
                                {p.isEmergency && <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl sm:rounded-2xl animate-pulse pointer-events-none"></div>}
                            </div>
                        );
                    })}
                    {/* Empty Slots */}
                    {[...Array(Math.max(0, 3 - nextPatients.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-800/30 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/50 flex items-center justify-center opacity-30 h-full">
                            <span className="h-1.5 w-1.5 sm:h-3 sm:w-3 rounded-full bg-slate-600"></span>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            );
            })}
      </div>
      
      {/* Footer Info & Pagination */}
      <div className="mt-1 sm:mt-4 flex justify-between items-center flex-shrink-0 h-[24px] sm:h-[30px]">
          <div className="text-[10px] sm:text-base text-slate-500 font-medium flex items-center gap-2">
             <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div> 
             <span className="hidden sm:inline">System Active •</span> {patients.filter(p => p.status === PatientStatus.WAITING).length} {t.waiting}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 sm:gap-3 bg-slate-800/50 px-2 py-1 sm:px-6 sm:py-1.5 rounded-full backdrop-blur-sm">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-500 ${i === currentPage ? 'bg-white scale-125 shadow-[0_0_10px_white]' : 'bg-slate-600'}`} 
                    />
                ))}
            </div>
          )}

          <div className="text-right">
              <p className="text-slate-600 text-[8px] sm:text-xs">Powered by <strong>SmartQFlow</strong></p>
          </div>
      </div>
    </div>
  );
};
