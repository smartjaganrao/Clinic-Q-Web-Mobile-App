
import React, { useMemo, useState } from 'react';
import { Patient, Doctor, PatientStatus } from '../../../types';
import { Users, Clock, CheckCircle, XCircle, Activity, CalendarDays, Filter } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

interface ReceptionStatsProps {
  patients: Patient[];
  doctors: Doctor[];
}

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const ReceptionStats: React.FC<ReceptionStatsProps> = ({ patients, doctors }) => {
  const [filterType, setFilterType] = useState<FilterType>('TODAY');
  // Store custom dates as Date objects or null
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: number;
    let endDate: number = now.setHours(23, 59, 59, 999); // End of today by default

    // Determine Date Range
    if (filterType === 'TODAY') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
    } else if (filterType === 'WEEK') {
        const start = new Date();
        start.setDate(now.getDate() - 6); // Last 7 days
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
    } else if (filterType === 'MONTH') {
        const start = new Date();
        start.setDate(now.getDate() - 29); // Last 30 days
        start.setHours(0, 0, 0, 0);
        startDate = start.getTime();
    } else {
        // Custom
        startDate = customStart ? customStart.getTime() : 0;
        endDate = customEnd ? customEnd.setHours(23, 59, 59, 999) : new Date().getTime();
    }

    // Filter Patients
    const filteredPatients = patients.filter(p => {
        let pTime = p.timeAdded;
        // Use appointment date if available and valid
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate) {
            const apptDate = new Date(p.appointmentDate);
            // If it has a specific time, try to use that, otherwise start of day
            if (p.appointmentTime) {
                const [h, m] = p.appointmentTime.split(':').map(Number);
                apptDate.setHours(h, m, 0, 0);
            }
            pTime = apptDate.getTime();
        }
        
        return pTime >= startDate && pTime <= endDate;
    });
    
    const completed = filteredPatients.filter(p => p.status === PatientStatus.COMPLETED);
    const waiting = filteredPatients.filter(p => p.status === PatientStatus.WAITING);
    const cancelled = filteredPatients.filter(p => p.status === PatientStatus.CANCELLED);
    const serving = filteredPatients.filter(p => p.status === PatientStatus.WITH_DOCTOR);
    
    const total = filteredPatients.length;

    // Calculate Avg Wait Time (completed patients only)
    let totalWaitTime = 0;
    let waitTimeCount = 0;
    
    completed.forEach(p => {
        if (p.timeCompleted && p.timeAdded) {
            const doc = doctors.find(d => d.id === p.doctorId);
            const duration = p.timeCompleted - p.timeAdded;
            // Approximate wait time: Total duration - Avg Consult Time
            // If negative (completed super fast), clamp to 0
            const consultTime = (doc?.consultationTime || 15) * 60 * 1000;
            const wait = Math.max(0, duration - consultTime);
            totalWaitTime += wait;
            waitTimeCount++;
        }
    });
    
    const avgWaitMinutes = waitTimeCount > 0 ? Math.round((totalWaitTime / waitTimeCount) / 60000) : 0;

    // Doctor Performance (Enhanced with Actual Consult Time)
    const doctorStats = doctors.map(doc => {
        const docPatients = filteredPatients.filter(p => p.doctorId === doc.id);
        const completedPatients = docPatients.filter(p => p.status === PatientStatus.COMPLETED);
        const waitingCount = docPatients.filter(p => p.status === PatientStatus.WAITING).length;
        
        // Calculate Actual Avg Consult Time
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
            waiting: waitingCount,
            utilization: docPatients.length > 0 ? Math.round((completedPatients.length / docPatients.length) * 100) : 0,
            actualAvgTime,
            targetTime: doc.consultationTime || 15
        };
    }).sort((a, b) => b.total - a.total);

    // Heatmap Data (Day x Hour)
    // 7 Days x 13 Hours (8 AM - 8 PM)
    const heatmapGrid = Array(7).fill(0).map(() => Array(13).fill(0));
    filteredPatients.forEach(p => {
        let time = p.timeAdded;
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
             const [h, m] = p.appointmentTime.split(':').map(Number);
             const d = new Date(p.appointmentDate);
             d.setHours(h, m);
             time = d.getTime();
        }
        const dateObj = new Date(time);
        const day = dateObj.getDay(); // 0 = Sun
        const hour = dateObj.getHours();
        
        if (hour >= 8 && hour <= 20) {
            heatmapGrid[day][hour - 8]++;
        }
    });

    const formatRange = () => {
        if (filterType === 'TODAY') return 'Today';
        if (filterType === 'WEEK') return 'Last 7 Days';
        if (filterType === 'MONTH') return 'Last 30 Days';
        if (customStart && customEnd) {
            return `${customStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${customEnd.toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;
        }
        return 'Custom Range';
    };

    return {
        total,
        completed: completed.length,
        waiting: waiting.length,
        serving: serving.length,
        cancelled: cancelled.length,
        avgWaitMinutes,
        doctorStats,
        heatmapGrid,
        dateRangeLabel: formatRange()
    };
  }, [patients, doctors, filterType, customStart, customEnd]);

  // Helper for Heatmap Color
  const getHeatmapColor = (count: number) => {
      if (count === 0) return 'bg-slate-50';
      if (count < 3) return 'bg-green-100';
      if (count < 6) return 'bg-yellow-200';
      if (count < 10) return 'bg-orange-300';
      return 'bg-red-400';
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm'];

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-slate-50/50 custom-scrollbar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" /> Analytics
            </h3>
            
            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="bg-white border border-slate-200 p-1 rounded-lg flex text-xs font-bold shadow-sm self-start">
                    <button onClick={() => setFilterType('TODAY')} className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'TODAY' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Today</button>
                    <button onClick={() => setFilterType('WEEK')} className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'WEEK' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Weekly</button>
                    <button onClick={() => setFilterType('MONTH')} className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'MONTH' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Monthly</button>
                    <button 
                        onClick={() => { setFilterType('CUSTOM'); setShowDatePicker(true); }} 
                        className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'CUSTOM' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Custom
                    </button>
                </div>

                {filterType === 'CUSTOM' && (
                    <div className="relative animate-in fade-in slide-in-from-left-2">
                        <button 
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:border-slate-300 transition-colors"
                        >
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                                {customStart ? (
                                    `${customStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${customEnd ? customEnd.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '...'}`
                                ) : 'Select Date Range'}
                            </span>
                        </button>
                        
                        {showDatePicker && (
                            <DateRangePicker 
                                startDate={customStart} 
                                endDate={customEnd} 
                                onChange={(start, end) => {
                                    setCustomStart(start);
                                    setCustomEnd(end);
                                }}
                                onClose={() => setShowDatePicker(false)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Visits ({stats.dateRangeLabel})</p>
                    <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Avg Wait Time</p>
                    <p className="text-2xl font-black text-slate-900">{stats.avgWaitMinutes} <span className="text-sm font-bold text-slate-400">mins</span></p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <XCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Cancelled</p>
                    <p className="text-2xl font-black text-slate-900">{stats.cancelled}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Doctor Efficiency Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">Doctor Efficiency</h4>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">Performance</span>
                </div>
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3">Doctor</th>
                                <th className="px-5 py-3 text-center">Visits</th>
                                <th className="px-5 py-3 text-center">Avg Time</th>
                                <th className="px-5 py-3 w-32">Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.doctorStats.map(doc => {
                                const diff = doc.actualAvgTime - doc.targetTime;
                                const isEfficient = diff <= 2; // Allow 2 min buffer
                                return (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={doc.avatar} className="w-8 h-8 rounded-full bg-slate-200" />
                                            <div>
                                                <div className="font-bold text-slate-900">{doc.name}</div>
                                                <div className="text-[10px] text-slate-500">Target: {doc.targetTime}m</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold">{doc.completed}</td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="font-bold text-slate-800">{doc.actualAvgTime}m</div>
                                        <div className={`text-[10px] font-bold ${diff > 5 ? 'text-red-500' : 'text-green-500'}`}>
                                            {diff > 0 ? `+${diff}` : diff}m
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isEfficient ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isEfficient ? 'Optimal' : 'Slow'}
                                        </span>
                                    </td>
                                </tr>
                            )})}
                            {stats.doctorStats.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8 text-slate-400">No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Peak Hours Heatmap */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[400px]">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-800">Peak Hours Heatmap</h4>
                        <p className="text-xs text-slate-500">Patient Footfall Density ({stats.dateRangeLabel})</p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-100 rounded"></span> Low</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-300 rounded"></span> Med</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded"></span> High</div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="min-w-[500px]">
                        <div className="flex">
                            <div className="w-12 flex-shrink-0"></div>
                            {HOURS.map((h, i) => (
                                <div key={i} className="flex-1 text-[10px] text-center text-slate-400 font-bold uppercase pb-2">{h}</div>
                            ))}
                        </div>
                        {DAYS.map((day, dIdx) => (
                            <div key={dIdx} className="flex items-center mb-1">
                                <div className="w-12 text-[10px] font-bold text-slate-500 uppercase">{day}</div>
                                {stats.heatmapGrid[dIdx].map((count, hIdx) => (
                                    <div key={hIdx} className="flex-1 px-0.5 h-8">
                                        <div 
                                            className={`w-full h-full rounded-md ${getHeatmapColor(count)} flex items-center justify-center text-[10px] font-bold text-slate-700 transition-all hover:scale-110 cursor-default`}
                                            title={`${DAYS[dIdx]} ${HOURS[hIdx]}: ${count} patients`}
                                        >
                                            {count > 0 ? count : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
