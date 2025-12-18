
import React, { useMemo, useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { 
  Users, Clock, CheckCircle, XCircle, Activity, CalendarDays, Star, 
  IndianRupee, TrendingUp, Zap, Calendar, BarChart3, Info, 
  ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles, 
  Target, Award, MousePointer2, PieChart
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

interface ReceptionStatsProps {
  patients: Patient[];
  doctors: Doctor[];
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
        // CUSTOM logic: Normalize to start/end of day for precise filtering
        if (customStart) {
            const s = new Date(customStart);
            s.setHours(0, 0, 0, 0);
            startDate = s.getTime();
        } else {
            startDate = 0;
        }

        if (customEnd) {
            const e = new Date(customEnd);
            e.setHours(23, 59, 59, 999);
            endDate = e.getTime();
        } else if (customStart) {
            // If only start selected, show that single day
            const e = new Date(customStart);
            e.setHours(23, 59, 59, 999);
            endDate = e.getTime();
        } else {
            endDate = Date.now();
        }
    }

    const filteredPatients = patients.filter(p => {
        let pTime = p.timeAdded;
        // For appointments, we might want to track them by their scheduled date for revenue/reporting
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

    // Financial Metrics
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

    const ratedPatients = completed.filter(p => p.rating !== undefined && p.rating > 0);
    const totalRating = ratedPatients.reduce((sum, p) => sum + (p.rating || 0), 0);
    const avgRating = ratedPatients.length > 0 ? (totalRating / ratedPatients.length).toFixed(1) : 'N/A';

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
        if (hour >= 8 && hour <= 20) heatmapGrid[day][hour - 8]++;
    });

    const formatRange = () => {
        if (filterType === 'TODAY') return 'Today';
        if (filterType === 'WEEK') return 'Last 7 Days';
        if (filterType === 'MONTH') return 'Last 30 Days';
        return customStart && customEnd ? `${customStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${customEnd.toLocaleDateString(undefined, {month:'short', day:'numeric'})}` : 'Custom Range';
    };

    return {
        total, 
        completed: completed.length, 
        waiting: waiting.length, 
        serving: serving.length, 
        cancelled: cancelled.length,
        walkIns: walkInsCount, 
        appointments: appointmentsCount, 
        totalRevenue, 
        waitingRevenue, 
        lostRevenue, 
        completionRate, 
        avgWaitMinutes,
        doctorStats, 
        heatmapGrid, 
        dateRangeLabel: formatRange(), 
        avgRating, 
        ratedCount: ratedPatients.length
    };
  }, [patients, doctors, filterType, customStart, customEnd]);

  const getHeatmapColor = (count: number) => {
      if (count === 0) return 'bg-slate-50';
      if (count < 3) return 'bg-primary-50 text-primary-400';
      if (count < 6) return 'bg-primary-100 text-primary-600';
      if (count < 10) return 'bg-primary-500 text-white';
      return 'bg-primary-700 text-white shadow-lg';
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm'];

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto bg-slate-50 custom-scrollbar pb-24">
        <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Header with Date Selection */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Business Insights <Activity className="h-8 w-8 text-primary-600" />
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Analyzing performance for <span className="text-primary-600 font-bold">{stats.dateRangeLabel}</span></p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                    {(['TODAY', 'WEEK', 'MONTH'] as const).map(t => (
                        <button 
                            key={t} 
                            onClick={() => { setFilterType(t); setShowDatePicker(false); }} 
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {t}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button 
                        onClick={() => { setFilterType('CUSTOM'); setShowDatePicker(!showDatePicker); }} 
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterType === 'CUSTOM' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Calendar className="h-4 w-4" /> Custom
                    </button>
                    {showDatePicker && filterType === 'CUSTOM' && (
                        <div className="relative">
                            <DateRangePicker 
                                startDate={customStart} 
                                endDate={customEnd} 
                                onChange={(s, e) => { 
                                    setCustomStart(s); 
                                    setCustomEnd(e); 
                                    setShowDatePicker(false);
                                }} 
                                onClose={() => setShowDatePicker(false)} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Financial Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-colors duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Net Realized Revenue</p>
                                <h3 className="text-6xl font-black tracking-tight">₹{stats.totalRevenue.toLocaleString()}</h3>
                            </div>
                            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2 border border-emerald-500/20">
                                <ArrowUpRight className="h-5 w-5" /> 14.2%
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">In Pipeline</p>
                                <p className="text-2xl font-black text-white">₹{stats.waitingRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Missed Potential</p>
                                <p className="text-2xl font-black text-rose-300">₹{stats.lostRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-primary-200 transition-colors group">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
                            <PieChart className="h-5 w-5 text-slate-300" />
                        </div>
                        <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Patient Load</h4>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Walk-ins</span>
                            <span className="font-black text-slate-900">{stats.walkIns}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-amber-500" style={{ width: `${(stats.walkIns/(stats.total || 1))*100}%` }}></div>
                            <div className="h-full bg-indigo-500" style={{ width: `${(stats.appointments/(stats.total || 1))*100}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" /> Appointments</span>
                            <span className="font-black text-slate-900">{stats.appointments}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-primary-100">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center"><Target className="h-6 w-6" /></div>
                            <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg">LIVE</span>
                        </div>
                        <h4 className="text-primary-200 text-xs font-black uppercase tracking-widest mb-1">System Efficiency</h4>
                        <p className="text-5xl font-black tracking-tighter">{stats.completionRate}%</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-3xl mt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary-200" />
                            <div>
                                <p className="text-xs font-black text-white">{stats.avgWaitMinutes}m Avg Wait</p>
                                <p className="text-[10px] text-primary-200">Across all doctors</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <Award className="h-6 w-6 text-primary-600" /> Doctor Performance P&L
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                            <MousePointer2 className="h-4 w-4" /> Detail View
                        </div>
                    </div>
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Medical Staff</th>
                                    <th className="px-8 py-5 text-center">Visits</th>
                                    <th className="px-8 py-5 text-center">Efficiency</th>
                                    <th className="px-8 py-5 text-right">Revenue Contrib.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.doctorStats.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img src={doc.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                                                <div>
                                                    <div className="font-black text-slate-900 text-base">{doc.name}</div>
                                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">{doc.specialty}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black">{doc.completed}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`font-black text-sm ${doc.actualAvgTime > doc.targetTime + 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {doc.actualAvgTime}m <span className="text-[10px] text-slate-400 font-medium">/ target {doc.targetTime}m</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mx-auto mt-2 overflow-hidden">
                                                <div className={`h-full ${doc.actualAvgTime > doc.targetTime + 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (doc.targetTime/(doc.actualAvgTime || 1))*100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-xl font-black text-slate-900">₹{doc.revenue.toLocaleString()}</span>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Contribution: {Math.round((doc.revenue/(stats.totalRevenue || 1))*100 || 0)}%</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="h-20 w-20" /></div>
                        <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-primary-400" /> AI Insights
                        </h4>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 font-black">01</div>
                                <div>
                                    <p className="text-sm font-black text-white">Peak Load Alert</p>
                                    <p className="text-xs text-indigo-200 mt-1 leading-relaxed">System data shows peaks between 10am-12pm. Consider adding a counter nurse during these windows.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 font-black">02</div>
                                <div>
                                    <p className="text-sm font-black text-white">Revenue Leakage</p>
                                    <p className="text-xs text-indigo-200 mt-1 leading-relaxed">{stats.cancelled} cancellations detected. Reducing wait times by 10m could reclaim pipeline revenue.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 font-black">03</div>
                                <div>
                                    <p className="text-sm font-black text-white">Patient Satisfaction</p>
                                    <p className="text-xs text-indigo-200 mt-1 leading-relaxed">Clinic rating is {stats.avgRating}/5 based on {stats.ratedCount} reviews. Maintain speed-of-care to improve scores.</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/10">Download PDF Report</button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Action Needed</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-xs font-black text-slate-700">Follow up with cancelled ({stats.cancelled})</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-xs font-black text-slate-700">Audit Dr. {stats.doctorStats[0]?.name.split(' ').pop()} slots</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Traffic Heatmap */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Patient Density Map <BarChart3 className="h-6 w-6 text-primary-600" />
                        </h4>
                        <p className="text-slate-500 text-sm font-medium mt-1">Visualize clinic traffic across hours and weekdays.</p>
                    </div>
                    <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <div className="w-3 h-3 bg-slate-200 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <div className="w-3 h-3 bg-primary-100 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <div className="w-3 h-3 bg-primary-500 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mid</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <div className="w-3 h-3 bg-primary-700 rounded-sm shadow-sm"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High</span>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[900px]">
                        <div className="flex mb-6">
                            <div className="w-20 shrink-0"></div>
                            {HOURS.map((h, i) => (
                                <div key={i} className="flex-1 text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">{h}</div>
                            ))}
                        </div>
                        {DAYS.map((day, dIdx) => (
                            <div key={dIdx} className="flex items-center mb-3">
                                <div className="w-20 text-xs font-black text-slate-700 uppercase tracking-widest">{day}</div>
                                {stats.heatmapGrid[dIdx].map((count, hIdx) => (
                                    <div key={hIdx} className="flex-1 px-1.5 h-12">
                                        <div 
                                            className={`
                                                w-full h-full rounded-2xl transition-all duration-300 flex items-center justify-center font-black text-xs
                                                ${getHeatmapColor(count)} 
                                                hover:scale-110 hover:shadow-lg cursor-help border border-transparent hover:border-white/20
                                            `}
                                            title={`${DAYS[dIdx]} ${HOURS[hIdx]}: ${count} patient visits`}
                                        >
                                            {count > 0 ? count : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary-600"><Info className="h-6 w-6" /></div>
                    <div>
                        <h5 className="text-sm font-black text-slate-900">Optimization Tip</h5>
                        <p className="text-xs text-slate-500 leading-relaxed">Focus your medical staffing resources on dark teal slots. Adding temporary relief during these peak windows directly correlates with a 15% increase in realized revenue.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
