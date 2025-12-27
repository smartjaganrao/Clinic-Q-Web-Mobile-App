
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PainPoint } from '../../../types';
import { Button } from '../../../components/Button';
import { generatePatientSummary } from '../../../services/geminiService';
import { 
    Activity, FileText, Pill, Save, PauseCircle, BrainCircuit, Plus, Trash2, X, Move, Sparkles, ChevronDown
} from 'lucide-react';

interface ConsultationWorkspaceProps {
  currentPatient: Patient;
  onComplete: (notes: string, prescriptions: any[], vitals: any, painPoints: PainPoint[]) => void;
  onHold: () => void;
}

const COMMON_MEDICINES = [
    { name: 'Paracetamol 650mg', type: 'Tablet', tags: ['fever', 'pain', 'headache'] },
    { name: 'Amoxicillin 500mg', type: 'Capsule', tags: ['infection', 'antibiotic', 'throat'] },
    { name: 'Cetirizine 10mg', type: 'Tablet', tags: ['allergy', 'cold', 'runny nose'] },
    { name: 'Pantoprazole 40mg', type: 'Tablet', tags: ['gastritis', 'acidity', 'stomach'] },
    { name: 'Ibuprofen 400mg', type: 'Tablet', tags: ['pain', 'inflammation', 'joint'] },
    { name: 'Azithromycin 500mg', type: 'Tablet', tags: ['infection', 'throat', 'chest'] },
    { name: 'Metformin 500mg', type: 'Tablet', tags: ['diabetes', 'sugar'] },
    { name: 'Atorvastatin 10mg', type: 'Tablet', tags: ['cholesterol', 'heart'] },
    { name: 'Amlodipine 5mg', type: 'Tablet', tags: ['bp', 'hypertension'] },
    { name: 'Ranitidine 150mg', type: 'Tablet', tags: ['gastritis', 'ulcer'] },
    { name: 'Dolo 650', type: 'Tablet', tags: ['fever', 'pain'] },
    { name: 'Augmentin 625', type: 'Tablet', tags: ['infection', 'severe'] },
    { name: 'Montelukast 10mg', type: 'Tablet', tags: ['asthma', 'allergy', 'cough'] },
    { name: 'Thyroxine 50mcg', type: 'Tablet', tags: ['thyroid'] },
    { name: 'Shelcal 500', type: 'Tablet', tags: ['calcium', 'bone', 'weakness'] },
    { name: 'Ascoril LS', type: 'Syrup', tags: ['cough', 'wet cough'] },
    { name: 'Benadryl', type: 'Syrup', tags: ['cough', 'dry cough'] },
    { name: 'Ondansetron 4mg', type: 'Tablet', tags: ['vomiting', 'nausea'] },
    { name: 'ORS Sachet', type: 'Powder', tags: ['dehydration', 'diarrhea'] },
    { name: 'Volini Gel', type: 'Gel', tags: ['pain', 'muscle'] },
];

const DOSAGE_FREQUENCIES = [
    { label: '1-0-0', desc: 'Morn' },
    { label: '1-0-1', desc: 'BD' },
    { label: '1-1-1', desc: 'TDS' },
    { label: '0-0-1', desc: 'Night' },
    { label: 'SOS', desc: 'Need' },
];

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({ currentPatient, onComplete, onHold }) => {
  const [notes, setNotes] = useState(currentPatient.notes || '');
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [prescriptions, setPrescriptions] = useState<{name: string, dosage: string, duration: string}[]>([]);
  const [newRx, setNewRx] = useState({name: '', dosage: '', duration: ''});
  
  // Suggestion State
  const [filteredMeds, setFilteredMeds] = useState<typeof COMMON_MEDICINES>([]);
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  
  const [vitals, setVitals] = useState({
      bp: currentPatient.vitals?.bp || '',
      temp: currentPatient.vitals?.temp || '',
      weight: currentPatient.vitals?.weight || '',
      pulse: currentPatient.vitals?.pulse || '',
      spo2: currentPatient.vitals?.spo2 || ''
  });

  const [painPoints, setPainPoints] = useState<PainPoint[]>(currentPatient.painPoints || []);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const bodyMapRef = useRef<HTMLDivElement>(null);
  const rxInputRef = useRef<HTMLInputElement>(null);

  // Reset state when patient changes
  useEffect(() => {
      setNotes(currentPatient.notes || '');
      setAiSummary('');
      setPrescriptions([]); 
      setVitals({
          bp: currentPatient.vitals?.bp || '',
          temp: currentPatient.vitals?.temp || '',
          weight: currentPatient.vitals?.weight || '',
          pulse: currentPatient.vitals?.pulse || '',
          spo2: currentPatient.vitals?.spo2 || ''
      });
      setPainPoints(currentPatient.painPoints || []);
      setNewRx({name: '', dosage: '', duration: ''});
  }, [currentPatient.id]);

  // Update suggestions based on input and notes
  useEffect(() => {
      if (!newRx.name.trim()) {
          // Smart suggestions based on notes
          if (notes.trim()) {
              const noteLower = notes.toLowerCase();
              const relevant = COMMON_MEDICINES.filter(m => m.tags.some(t => noteLower.includes(t)));
              setFilteredMeds(relevant);
          } else {
              setFilteredMeds([]);
          }
          return;
      }
      
      const q = newRx.name.toLowerCase();
      const matches = COMMON_MEDICINES.filter(m => m.name.toLowerCase().includes(q));
      setFilteredMeds(matches);
  }, [newRx.name, notes]);

  const handleGenerateSummary = async () => {
      if (!notes.trim()) return;
      setIsGeneratingSummary(true);
      const summary = await generatePatientSummary(notes, currentPatient.name, currentPatient.age);
      setAiSummary(summary);
      setIsGeneratingSummary(false);
  };

  const handleAddRx = () => {
      if (newRx.name && newRx.dosage) {
          setPrescriptions([...prescriptions, newRx]);
          setNewRx({name: '', dosage: '', duration: ''});
          setShowMedSuggestions(false);
      }
  };

  const selectMedicine = (name: string) => {
      setNewRx({ ...newRx, name });
      setShowMedSuggestions(false);
  };

  const handlePainPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent adding a new point if we just finished dragging
      if (draggingPointIndex !== null) return;

      if (bodyMapRef.current) {
          const rect = bodyMapRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setPainPoints([...painPoints, { x, y }]);
      }
  };

  const handlePointMouseDown = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setDraggingPointIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (draggingPointIndex !== null && bodyMapRef.current) {
          const rect = bodyMapRef.current.getBoundingClientRect();
          // Calculate new position
          let x = ((e.clientX - rect.left) / rect.width) * 100;
          let y = ((e.clientY - rect.top) / rect.height) * 100;
          
          // Constrain to container
          x = Math.max(0, Math.min(100, x));
          y = Math.max(0, Math.min(100, y));

          const updatedPoints = [...painPoints];
          updatedPoints[draggingPointIndex] = { x, y };
          setPainPoints(updatedPoints);
      }
  };

  const handleMouseUp = () => {
      setDraggingPointIndex(null);
  };

  const handleRemovePoint = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const updatedPoints = painPoints.filter((_, i) => i !== index);
      setPainPoints(updatedPoints);
  };

  return (
    <div className="h-full flex flex-col gap-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">{currentPatient.name}</h2>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{currentPatient.visitType}</span>
                    {currentPatient.isEmergency && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase">Emergency</span>}
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                    <span>{currentPatient.age || 'Age --'} Yrs</span>
                    <span>•</span>
                    <span>{currentPatient.gender || '--'}</span>
                    <span>•</span>
                    <span className="font-mono">{currentPatient.phone}</span>
                </div>
                {currentPatient.symptoms && (
                    <div className="mt-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                        <span className="font-bold text-slate-500 mr-2">Symptoms:</span>
                        {currentPatient.symptoms}
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onHold} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                    <PauseCircle className="h-4 w-4 mr-2" /> Hold
                </Button>
                <Button onClick={() => onComplete(notes, prescriptions, vitals, painPoints)} className="bg-green-600 hover:bg-green-700 shadow-green-200 shadow-lg">
                    <Save className="h-4 w-4 mr-2" /> Complete Visit
                </Button>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            
            {/* LEFT COLUMN: Clinical Notes & Vitals */}
            <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Vitals Input */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" /> Vitals
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">BP</label>
                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Temp (°F)</label>
                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="98.6" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Pulse (bpm)</label>
                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="72" value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">SpO2 (%)</label>
                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="98" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Weight (kg)</label>
                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="65" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Clinical Notes */}
                <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary-500" /> Clinical Notes
                        </h3>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={handleGenerateSummary} 
                            disabled={isGeneratingSummary || !notes}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                            {isGeneratingSummary ? 'Thinking...' : <><BrainCircuit className="h-4 w-4 mr-2" /> AI Summary</>}
                        </Button>
                    </div>
                    
                    {aiSummary && (
                        <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-900 relative animate-in fade-in">
                            <button onClick={() => setAiSummary('')} className="absolute top-2 right-2 text-purple-400 hover:text-purple-700"><X className="h-4 w-4" /></button>
                            <h4 className="font-bold mb-1 flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> AI Suggestion</h4>
                            <div className="whitespace-pre-line leading-relaxed">{aiSummary}</div>
                        </div>
                    )}

                    <textarea 
                        className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none resize-none font-mono text-sm leading-relaxed"
                        placeholder="Type clinical observations, diagnosis, and plan..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN: Prescription & Body Map */}
            <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                
                {/* Prescription Writer */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Pill className="h-5 w-5 text-green-500" /> Rx
                    </h3>
                    
                    <div className="space-y-3 mb-4">
                        <div className="relative">
                            <input 
                                ref={rxInputRef}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                placeholder="Medicine Name" 
                                value={newRx.name} 
                                onChange={e => { setNewRx({...newRx, name: e.target.value}); setShowMedSuggestions(true); }}
                                onFocus={() => setShowMedSuggestions(true)}
                            />
                            {showMedSuggestions && filteredMeds.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                    {!newRx.name.trim() && <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center gap-1"><Sparkles className="h-3 w-3 text-purple-500" /> Suggested based on notes</div>}
                                    {filteredMeds.map((med, idx) => (
                                        <button 
                                            key={idx} 
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center group"
                                            onClick={() => selectMedicine(med.name)}
                                        >
                                            <span className="text-slate-800 font-medium group-hover:text-primary-700">{med.name}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{med.type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input 
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                    placeholder="Dosage (e.g. 1-0-1)" 
                                    value={newRx.dosage} 
                                    onChange={e => setNewRx({...newRx, dosage: e.target.value})} 
                                />
                                {/* Quick Dosage Chips */}
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {DOSAGE_FREQUENCIES.map((freq) => (
                                        <button
                                            key={freq.label}
                                            type="button"
                                            onClick={() => setNewRx({ ...newRx, dosage: freq.label })}
                                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${newRx.dosage === freq.label ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                            title={freq.desc}
                                        >
                                            {freq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="w-1/3">
                                <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Days" value={newRx.duration} onChange={e => setNewRx({...newRx, duration: e.target.value})} />
                            </div>
                        </div>
                        <Button size="sm" onClick={handleAddRx} className="w-full" disabled={!newRx.name}><Plus className="h-4 w-4 mr-2" /> Add</Button>
                    </div>

                    <div className="space-y-2">
                        {prescriptions.map((rx, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                <div>
                                    <div className="font-bold text-slate-800">{rx.name}</div>
                                    <div className="text-xs text-slate-500">{rx.dosage} • {rx.duration}</div>
                                </div>
                                <button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}
                        {prescriptions.length === 0 && <div className="text-center text-slate-400 text-xs py-4 italic">No medicines added</div>}
                    </div>
                </div>

                {/* Body Map (Interactive Pain Points) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-red-500" /> Body Map
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => setPainPoints([])} className="text-xs text-slate-400 hover:text-red-500">Clear All</button>
                        </div>
                    </div>
                    
                    <div 
                        ref={bodyMapRef}
                        className={`relative w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 ${draggingPointIndex !== null ? 'cursor-grabbing' : 'cursor-crosshair'}`} 
                        onClick={handlePainPointClick}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Abstract Body Shape Placeholder - In real app, use an SVG/Image */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <Activity className="w-full h-full text-slate-900 p-8" />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                            <div className="w-20 h-20 rounded-full bg-slate-400 mb-2"></div>
                            <div className="w-32 h-40 bg-slate-400 rounded-3xl mb-2"></div>
                            <div className="flex gap-2">
                                <div className="w-10 h-40 bg-slate-400 rounded-full"></div>
                                <div className="w-10 h-40 bg-slate-400 rounded-full"></div>
                            </div>
                        </div>

                        {/* Pain Points */}
                        {painPoints.map((pt, idx) => (
                            <div 
                                key={idx} 
                                onMouseDown={(e) => handlePointMouseDown(idx, e)}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-red-600 flex items-center justify-center shadow-sm transition-transform hover:scale-110 cursor-grab active:cursor-grabbing z-10 group ${draggingPointIndex === idx ? 'scale-125 bg-red-600/30' : 'bg-red-500/50 animate-pulse'}`}
                                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                            >
                                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                {/* Tooltip / Remove */}
                                <div 
                                    className="absolute -top-6 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                >
                                    Drag
                                </div>
                                <button 
                                    className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                    onClick={(e) => handleRemovePoint(e, idx)}
                                    title="Remove"
                                >
                                    <X className="h-2 w-2" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Click to add. Drag to move. Hover to remove.
                    </p>
                </div>

            </div>
        </div>
    </div>
  );
};
