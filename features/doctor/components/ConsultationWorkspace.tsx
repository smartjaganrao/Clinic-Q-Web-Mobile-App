
import React, { useState, useEffect } from 'react';
import { Patient, PainPoint } from '../../../types';
import { Button } from '../../../components/Button';
import { generatePatientSummary } from '../../../services/geminiService';
import { FileText, Activity, Pill, User, Sparkles, Thermometer, Heart, Weight, Zap, Droplets, Trash2, Plus, PauseCircle, Check } from 'lucide-react';

interface ConsultationWorkspaceProps {
  currentPatient: Patient;
  onComplete: (notes: string, prescriptions: any[], vitals: any, painPoints: PainPoint[]) => void;
  onHold: () => void;
}

const COMMON_DIAGNOSES = [ "Viral Fever", "Common Cold", "Migraine", "Hypertension", "Diabetes T2", "Gastritis", "Allergy", "Back Pain" ];

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({ currentPatient, onComplete, onHold }) => {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'VITALS' | 'RX' | 'BODY'>('NOTES');
  const [notes, setNotes] = useState(currentPatient.notes || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vitals, setVitals] = useState({ bp: currentPatient.vitals?.bp || '', temp: currentPatient.vitals?.temp || '', weight: currentPatient.vitals?.weight || '', pulse: currentPatient.vitals?.pulse || '', spo2: currentPatient.vitals?.spo2 || '', height: currentPatient.vitals?.height || '', sugar: currentPatient.vitals?.sugar || '' });
  const [painPoints, setPainPoints] = useState<PainPoint[]>(currentPatient.painPoints || []);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [rxForm, setRxForm] = useState({ name: '', dosage: '1-0-1', duration: '3 days' });

  useEffect(() => {
      setNotes(currentPatient.notes || '');
      setVitals({ bp: currentPatient.vitals?.bp || '', temp: currentPatient.vitals?.temp || '', weight: currentPatient.vitals?.weight || '', pulse: currentPatient.vitals?.pulse || '', spo2: currentPatient.vitals?.spo2 || '', height: currentPatient.vitals?.height || '', sugar: currentPatient.vitals?.sugar || '' });
      setPainPoints(currentPatient.painPoints || []);
      setPrescriptions([]);
  }, [currentPatient.id]);

  const handleAiAssist = async () => { if (!notes) return; setIsAiLoading(true); const summary = await generatePatientSummary(notes, currentPatient.name); setNotes(summary); setIsAiLoading(false); };
  const addTemplateNote = (text: string) => { setNotes(prev => prev ? `${prev}\n- Diagnosis: ${text}` : `- Diagnosis: ${text}`); };
  const addPrescription = () => { if (rxForm.name) { setPrescriptions([...prescriptions, { ...rxForm }]); setRxForm({ name: '', dosage: '1-0-1', duration: '3 days' }); } };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`rounded-2xl p-4 sm:p-6 text-white shadow-lg mb-4 sm:mb-6 flex justify-between items-start transition-colors ${currentPatient.isEmergency ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
            <div><div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1"><h2 className="text-2xl sm:text-3xl font-bold">{currentPatient.name}</h2><span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold backdrop-blur-sm">#{currentPatient.tokenNumber}</span>{currentPatient.isEmergency && <span className="bg-white text-orange-600 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold uppercase">Emergency</span>}</div><div className="text-white/80 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm"><span>{currentPatient.age || '--'} Yrs, {currentPatient.gender || '--'}</span>{currentPatient.visitType === 'APPOINTMENT' && <span>• Appt {currentPatient.appointmentTime}</span>}</div>{currentPatient.symptoms && (<div className="mt-3 sm:mt-4 bg-white/10 p-2 sm:p-3 rounded-lg backdrop-blur-sm inline-block text-xs sm:text-sm max-w-full"><span className="opacity-70">Chief Complaint:</span> <span className="font-bold">{currentPatient.symptoms}</span></div>)}</div>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">{[{ id: 'NOTES', icon: FileText, label: 'Notes' }, { id: 'VITALS', icon: Activity, label: 'Vitals' }, { id: 'RX', icon: Pill, label: 'Rx' }, { id: 'BODY', icon: User, label: 'Body Map' },].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border ${activeTab === tab.id ? 'bg-white border-primary-500 text-primary-600 shadow-sm ring-1 ring-primary-100' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'}`}><tab.icon className="h-4 w-4" /> {tab.label}</button>))}</div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                {activeTab === 'NOTES' && (
                    <div className="h-full flex flex-col">
                        <div className="mb-4"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quick Diagnosis</label><div className="flex flex-wrap gap-2">{COMMON_DIAGNOSES.map(d => (<button key={d} onClick={() => addTemplateNote(d)} className="px-2 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] sm:text-xs font-medium text-slate-700 transition-colors">+ {d}</button>))}</div></div>
                        <textarea className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-medium text-slate-700 leading-relaxed text-sm sm:text-base" placeholder="Type clinical observations here..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <div className="flex justify-end mt-2"><Button size="sm" variant="ghost" onClick={handleAiAssist} disabled={isAiLoading || !notes} className="text-purple-600 text-xs sm:text-sm"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" /> AI Summarize</Button></div>
                    </div>
                )}
                {activeTab === 'VITALS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                        {Object.entries({ bp: { label: 'Blood Pressure', unit: 'mmHg', icon: Activity }, temp: { label: 'Temperature', unit: '°F', icon: Thermometer }, pulse: { label: 'Pulse Rate', unit: 'bpm', icon: Heart }, weight: { label: 'Weight', unit: 'kg', icon: Weight }, spo2: { label: 'SpO2', unit: '%', icon: Zap }, sugar: { label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets } }).map(([key, config]) => (
                            <div key={key} className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100"><div className="flex items-center gap-2 text-slate-500 mb-2"><config.icon className="h-3 w-3 sm:h-4 sm:w-4" /><span className="text-[10px] sm:text-xs font-bold uppercase">{config.label}</span></div><div className="flex items-baseline gap-2"><input className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-primary-500 outline-none text-lg sm:text-xl font-bold text-slate-900 pb-1 w-full" placeholder="--" value={(vitals as any)[key]} onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })} /><span className="text-[10px] sm:text-xs text-slate-400 font-medium">{config.unit}</span></div></div>
                        ))}
                    </div>
                )}
                {activeTab === 'RX' && (
                    <div>
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end">
                                <div className="col-span-12 sm:col-span-5"><label className="text-[10px] font-bold text-slate-400 uppercase">Medicine</label><input placeholder="e.g. Dolo 650" className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.name} onChange={e => setRxForm({...rxForm, name: e.target.value})} /></div>
                                <div className="col-span-6 sm:col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label><select className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})}><option>1-0-1</option><option>1-0-0</option><option>0-0-1</option><option>1-1-1</option><option>SOS</option></select></div>
                                <div className="col-span-6 sm:col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label><select className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={rxForm.duration} onChange={e => setRxForm({...rxForm, duration: e.target.value})}><option>3 days</option><option>5 days</option><option>7 days</option><option>15 days</option><option>1 month</option></select></div>
                                <div className="col-span-12 sm:col-span-1 mt-2 sm:mt-0"><Button onClick={addPrescription} className="w-full justify-center"><Plus className="h-5 w-5" /></Button></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {prescriptions.map((rx, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm"><div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-full text-green-600"><Pill className="h-4 w-4" /></div><div><div className="font-bold text-slate-900 text-sm">{rx.name}</div><div className="text-xs text-slate-500">{rx.dosage} for {rx.duration}</div></div></div><button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>))}
                            {prescriptions.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No medicines added yet.</div>}
                        </div>
                    </div>
                )}
                {activeTab === 'BODY' && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <p className="text-sm text-slate-500 mb-4">Click to mark pain areas</p>
                        <div className="relative h-72 sm:h-96 w-36 sm:w-48 bg-slate-100 rounded-full border-2 border-slate-200 cursor-crosshair shadow-inner" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - rect.left) / rect.width) * 100; const y = ((e.clientY - rect.top) / rect.height) * 100; setPainPoints([...painPoints, { x, y }]); }}>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-12 sm:h-16 rounded-full border-2 border-slate-300"></div><div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-24 sm:h-32 rounded-3xl border-2 border-slate-300"></div><div className="absolute top-40 sm:top-52 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-32 sm:h-40 rounded-b-3xl border-2 border-slate-300"></div>
                            {painPoints.map((p, i) => (<div key={i} className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in" style={{ left: `${p.x}%`, top: `${p.y}%` }}></div>))}
                        </div>
                        <button className="mt-4 text-xs text-red-500 hover:underline" onClick={() => setPainPoints([])}>Clear All Points</button>
                    </div>
                )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3"><Button variant="secondary" className="w-full sm:w-auto justify-center" onClick={onHold}><PauseCircle className="h-4 w-4 mr-2" /> Hold Patient</Button><Button onClick={() => onComplete(notes, prescriptions, vitals, painPoints)} className="w-full sm:w-auto justify-center px-8 shadow-lg shadow-primary-200"><Check className="h-5 w-5 mr-2" /> Complete Visit</Button></div>
        </div>
    </div>
  );
};
