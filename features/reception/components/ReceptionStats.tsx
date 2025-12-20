import React, { useMemo, useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { 
  Users, Clock, CheckCircle, XCircle, Activity, CalendarDays, Star, 
  TrendingUp, Zap, Calendar, BarChart3, Info, 
  ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles, 
  Target, Award, MousePointer2, PieChart, Wallet, TrendingDown
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

interface ReceptionStatsProps {
  patients: Patient[];
  doctors: Doctor[];
}

function IndianRupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" /><path d="M6 8h12" /><path d="m 6 13 8.5 10" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const ReceptionStats: React.FC<ReceptionStatsProps> = ({ patients, doctors }) => {
  const [filterType, setFilterType] = useState<FilterType>('TODAY');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: number;
    let endDate: number = now.getTime();

    if (filterType === 'TODAY') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        endDate = end.getTime();
    } else if (filterType === 'WEEK') {
        const start = new Date();
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        endDate = end.getTime();
    } else if (filterType === 'MONTH') {
        const start = new Date();
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        endDate = end.getTime();
    } else {
        startDate = customStart ? new Date(customStart).setHours(0, 0, 0, 0) : 0;
        endDate = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : Date.now();
    }

    const filteredPatients = patients.filter(p => {
        let pTime = p.timeAdded;
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate) {
            const [y, m, d] = p.appointmentDate.split('-').map(Number);
            const apptDate = new Date(y, m - 1, d);
            if (p.appointmentTime) {
                const [h, min] = p.appointmentTime.split(':').map(Number);
                apptDate.setHours(h, min, 0, 0);
            }
            pTime = apptDate.getTime();
        }
        return pTime >= startDate && pTime <= endDate;
    });
    
    const completed = filteredPatients.filter(p => p.status === PatientStatus.COMPLETED);
    const waiting = filteredPatients.filter(p => p.status === PatientStatus.WAITING);
    const cancelled = filteredPatients.filter(p => p.status === PatientStatus.CANCELLED);
    const skipped = filteredPatients.filter(p => p.status === PatientStatus.SKIPPED);
    const serving = filteredPatients.filter(p => p.status === PatientStatus.WITH_DOCTOR);
    
    const total = filteredPatients.length;
    const walkInsCount = filteredPatients.filter(p => p.visitType === 'WALK_IN').length;
    const appointmentsCount = filteredPatients.filter(p => p.visitType === 'APPOINTMENT').length;

    const totalRevenue = completed.reduce((sum, p) => {
        const doc = doctors.find(d => d.id === p.doctorId);
        return sum + (doc?.consultationFee || 0);
    }, 0);

    const waitingRevenue = [...waiting, ...serving].reduce((sum, p) => {
        const doc = doctors.find(d => d.id === p.doctorId);
        return sum + (doc?.consultationFee || 0);
    }, 0);

    const lostRevenue = [...cancelled, ...skipped].reduce((sum, p) => {
        const doc = doctors.find(d => d.id === p.doctorId);
        return sum + (doc?.consultationFee || 0);
    }, 0);

    const completionRate = total > 0 ? Math.round((completed.length / (total || 1)) * 100) : 0;

    let totalWaitTime = 0;
    let waitTimeCount = 0;
    completed.forEach(p => {
        if (p.timeCompleted && p.timeAdded) {
            const duration = p.timeCompleted - p.timeAdded;
            totalWaitTime += duration;
            waitTimeCount++;
        }
    });
    const avgWaitMinutes = waitTimeCount > 0 ? Math.round((totalWaitTime / waitTimeCount) / 60000) : 0;

    const doctorStats = doctors.map(doc => {
        const docPatients = filteredPatients.filter(p => p.doctorId === doc.id);
        const completedPatients = docPatients.filter(p => p.status === PatientStatus.COMPLETED);
        const docRevenue = completedPatients.reduce((s, _) => s + (doc.consultationFee || 0), 0);
        
        let totalConsultTime = 0;
        let consultCount = 0;
        completedPatients.forEach(p => {
            if (p.timeStarted && p.timeCompleted) {
                totalConsultTime += (p.timeCompleted - p.timeStarted);
                consultCount++;
            }
        });
        const actualAvgTime = consultCount > 0 ? Math.round((totalConsultTime / consultCount) / 60000) : 0;

        return {
            id: doc.id,
            name: doc.name,
            specialty: doc.specialty,
            avatar: doc.avatarUrl,
            total: docPatients.length,
            completed: completedPatients.length,
            revenue: docRevenue,
            actualAvgTime,
            targetTime: doc.consultationTime || 15
        };
    }).sort((a, b) => b.revenue - a.revenue);

    const heatmapGrid = Array(7).fill(0).map(() => Array(13).fill(0));
    filteredPatients.forEach(p => {
        let time = p.timeAdded;
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
             const [h, m] = p.appointmentTime.split(':').map(Number);
             const [y, mon, d] = p.appointmentDate.split('-').map(Number);
             const dateObj = new Date(y, mon - 1, d, h, m);
             time = dateObj.getTime();
        }
        const dateObj = new Date(time);
        const day = dateObj.getDay();
        const hour = dateObj.getHours();
        if (hour >= 8 && hour <= 20) {
            heatmapGrid[day][hour - 8]++;
        }
    });

    return {
        total, completed: completed.length, waiting: waiting.length, serving: serving.length, cancelled: cancelled.length,
        walkIns: walkInsCount, appointments: appointmentsCount, totalRevenue, waitingRevenue, lostRevenue, completionRate, avgWaitMinutes,
        doctorStats, heatmapGrid, dateRangeLabel: filterType === 'TODAY' ? 'TODAY' : filterType === 'WEEK' ? 'WEEK' : filterType === 'MONTH' ? 'MONTH' : 'CUSTOM'
    };
  }, [patients, doctors, filterType, customStart, customEnd]);

  const getHeatmapColor = (count: number) => {
      if (count === 0) return 'bg-slate-100/50';
      if (count < 2) return 'bg-primary-50 text-primary-400';
      if (count < 4) return 'bg-primary-100 text-primary-600';
      if (count < 6) return 'bg-primary-300 text-primary-800';
      return 'bg-primary-600 text-white shadow-sm';
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p'];

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
        {/* Dashboard Header */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-900/10"><BarChart3 className="h-5 w-5" /></div>
                <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 leading-none">Business Insights</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Range:</span>
                        <span className="bg-primary-50 text-primary-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-primary-100 uppercase tracking-widest">{stats.dateRangeLabel}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                {(['TODAY', 'WEEK', 'MONTH'] as const).map(t => (
                    <button key={t} onClick={() => { setFilterType(t); setShowDatePicker(false); }} className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === t ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}> {t} </button>
                ))}
                <div className="hidden sm:block w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={() => { setFilterType('CUSTOM'); setShowDatePicker(!showDatePicker); }} className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${filterType === 'CUSTOM' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Calendar className="h-3 w-3" /> Custom
                </button>
                {showDatePicker && filterType === 'CUSTOM' && (
                    <div className="absolute top-full right-0 sm:relative sm:top-0 sm:right-0 mt-2 sm:mt-0 z-[100]">
                        <DateRangePicker startDate={customStart} endDate={customEnd} onChange={(s, e) => { setCustomStart(s); setCustomEnd(e); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
                    </div>
                )}
            </div>
        </div>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6 pb-24 sm:pb-6">
            <div className="max-w-[1920px] mx-auto grid grid-cols-12 gap-4 md:gap-6">
                
                {/* Row 1: KPI Hero Cards */}
                <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group min-h-[180px] md:min-h-[220px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-all duration-700 pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Net Realized Revenue</p>
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">₹{stats.totalRevenue.toLocaleString()}</h3>
                            <span className="text-[10px] md:text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20"><ArrowUpRight className="h-3 w-3" /> 14.2%</span>
                        </div>
                    </div>
                    <div className="flex gap-4 md:gap-8 mt-6 pt-6 border-t border-white/10">
                        <div className="flex-1"><p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pipeline</p><p className="text-lg md:text-xl font-black">₹{stats.waitingRevenue.toLocaleString()}</p></div>
                        <div className="flex-1 text-right"><p className="text-[9px] md:text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1 whitespace-nowrap">Missed Potential</p><p className="text-lg md:text-xl font-black text-rose-300">₹{stats.lostRevenue.toLocaleString()}</p></div>
                    </div>
                </div>

                <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-primary-500 transition-colors min-h-[180px] md:min-h-[220px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="h-5 w-5 md:h-6 md:w-6" /></div>
                            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Load</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Patient Load</p>
                        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{stats.total}</p>
                    </div>
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase tracking-tighter mb-1">
                            <span className="text-amber-600">Walk-ins: {stats.walkIns}</span>
                            <span className="text-indigo-600">Appts: {stats.appointments}</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-1.5 md:h-2">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${(stats.walkIns/(stats.total||1))*100}%` }}></div>
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(stats.appointments/(stats.total||1))*100}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-colors min-h-[180px] md:min-h-[220px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Target className="h-5 w-5 md:h-6 md:w-6" /></div>
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-200">Efficiency</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visit Completion</p>
                        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{stats.completionRate}%</p>
                    </div>
                    <div className="flex items-center gap-2 mt-6 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest truncate">
                        <Clock className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" /> {stats.avgWaitMinutes}m Avg Wait
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3 bg-indigo-600 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-900/20 flex flex-col justify-between relative overflow-hidden min-h-[180px] md:min-h-[220px]">
                    <Sparkles className="absolute -top-4 -right-4 h-32 w-32 opacity-10 pointer-events-none" />
                    <div className="relative z-10">
                        <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] mb-4 md:mb-5 flex items-center gap-2">AI Insights <TrendingUp className="h-3 w-3" /></h4>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex gap-2">
                                <div className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0"></div>
                                <p className="text-[10px] md:text-[11px] font-bold leading-tight opacity-90">Peak load detected between 10am-12pm. Consider extra staff.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] md:text-[11px] font-bold leading-tight opacity-75">Revenue Leakage: ₹{stats.lostRevenue.toLocaleString()} from cancellations.</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-4 md:mt-6 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all backdrop-blur-md border border-white/10">Full Report</button>
                </div>

                {/* Row 2: Performance vs Traffic 50/50 Grid */}
                <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-auto md:h-[520px]">
                    <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h4 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-[0.2em] flex items-center gap-3"><Award className="h-5 w-5 text-primary-600 flex-shrink-0" /> Staff Performance</h4>
                        <span className="bg-slate-200 text-slate-500 text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full uppercase tracking-widest">{stats.doctorStats.length} Docs</span>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
                            <thead className="bg-white text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] sticky top-0 z-10 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 md:px-8 py-4 md:py-5">Medical Staff</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-center">Visits</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-center">Efficiency</th>
                                    <th className="px-6 md:px-8 py-4 md:py-5 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.doctorStats.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 md:px-8 py-4 md:py-5">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                                                    <img src={doc.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-slate-900 text-[12px] md:text-[13px] truncate leading-tight">{doc.name}</div>
                                                    <div className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate mt-1">{doc.specialty}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-100 text-slate-900 font-black text-xs md:text-sm">{doc.completed}</span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] md:text-[11px] font-black leading-none mb-1.5 md:mb-2 ${doc.actualAvgTime > doc.targetTime + 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {doc.actualAvgTime}m <span className="text-slate-300 font-normal">/ {doc.targetTime}m</span>
                                                </span>
                                                <div className="w-20 md:w-28 h-1 md:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${doc.actualAvgTime > doc.targetTime + 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (doc.targetTime/(doc.actualAvgTime||1))*100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                            <span className="text-sm md:text-base font-black text-slate-900">₹{doc.revenue.toLocaleString()}</span>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Contrib: {Math.round((doc.revenue/(stats.totalRevenue||1))*100)}%</p>
                                        </td>
                                    </tr>
                                ))}
                                {stats.doctorStats.length === 0 && (
                                    <tr><td colSpan={4} className="py-16 md:py-24 text-center text-slate-400 text-xs md:text-sm font-medium">No performance data captured.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10 flex flex-col h-auto md:h-[520px]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 md:p-3 bg-indigo-50 rounded-xl md:rounded-2xl text-indigo-600 shadow-sm"><TrendingUp className="h-5 w-5 md:h-6 md:w-6" /></div>
                            <div>
                                <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Traffic Heatmap</h4>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Day and Hour Density</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 self-end md:self-auto">
                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 md:mr-2">Scale:</span>
                            {[0,1,2,3,4].map(v => <div key={v} className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-md ${v === 0 ? 'bg-slate-100' : v === 1 ? 'bg-primary-50' : v === 2 ? 'bg-primary-100' : v === 3 ? 'bg-primary-300' : 'bg-primary-600'}`}></div>)}
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center overflow-x-auto no-scrollbar -mx-2 px-2">
                        <div className="grid grid-cols-[2.5rem_repeat(13,_1fr)] md:grid-cols-[3rem_repeat(13,_1fr)] gap-1.5 md:gap-2.5 min-w-[500px]">
                            <div className="col-span-1"></div>
                            {HOURS.map(h => (
                                <div key={h} className="text-[8px] md:text-[9px] text-slate-400 font-black text-center uppercase tracking-tighter mb-2 md:mb-4 py-1">
                                    {h}
                                </div>
                            ))}
                            {DAYS.map((day, dIdx) => (
                                <React.Fragment key={day}>
                                    <div className="flex items-center justify-start text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-tighter h-8 md:h-12 pr-2 md:pr-4">
                                        {day}
                                    </div>
                                    {stats.heatmapGrid[dIdx].map((count, hIdx) => (
                                        <div 
                                            key={hIdx} 
                                            className={`h-8 md:h-12 rounded-lg md:rounded-xl transition-all cursor-help border border-slate-200/20 hover:scale-110 hover:z-10 hover:shadow-lg origin-center flex items-center justify-center ${getHeatmapColor(count)}`}
                                            title={`${day} ${hIdx+8}:00 - ${count} Patients`}
                                        >
                                            {count > 0 && <span className="text-[8px] md:text-[10px] font-black opacity-50">{count}</span>}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 md:mt-10 flex items-start gap-3 md:gap-5 bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-inner">
                        <div className="hidden sm:block bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm"><Info className="h-5 w-5 md:h-6 md:w-6 text-primary-600" /></div>
                        <div className="flex-1">
                            <p className="text-[9px] md:text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                                High intensity zones represent peak volume. Consider staffing adjustments outside these windows to optimize throughput.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};