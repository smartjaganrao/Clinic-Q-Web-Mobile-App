
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

    // Doctor Performance
    const doctorStats = doctors.map(doc => {
        const docPatients = filteredPatients.filter(p => p.doctorId === doc.id);
        const completedCount = docPatients.filter(p => p.status === PatientStatus.COMPLETED).length;
        const waitingCount = docPatients.filter(p => p.status === PatientStatus.WAITING).length;
        return {
            id: doc.id,
            name: doc.name,
            specialty: doc.specialty,
            avatar: doc.avatarUrl,
            total: docPatients.length,
            completed: completedCount,
            waiting: waitingCount,
            utilization: docPatients.length > 0 ? Math.round((completedCount / docPatients.length) * 100) : 0
        };
    }).sort((a, b) => b.total - a.total);

    // Hourly Distribution (Aggregated across the selected range)
    // Useful to see "Busy hours of the day" regardless of date range
    const hourlyData = new Array(13).fill(0); // 08:00 to 20:00
    filteredPatients.forEach(p => {
        let time = p.timeAdded;
        if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
             const [h, m] = p.appointmentTime.split(':').map(Number);
             const d = new Date(p.appointmentDate);
             d.setHours(h, m);
             time = d.getTime();
        }
        
        const hour = new Date(time).getHours();
        if (hour >= 8 && hour <= 20) {
            hourlyData[hour - 8]++;
        }
    });
    const maxHourly = Math.max(...hourlyData, 1);

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
        hourlyData,
        maxHourly,
        dateRangeLabel: formatRange()
    };
  }, [patients, doctors, filterType, customStart, customEnd]);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor Workload Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">Doctor Performance</h4>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{stats.dateRangeLabel}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="px-5 py-3">Doctor</th>
                                <th className="px-5 py-3 text-center">Total</th>
                                <th className="px-5 py-3 text-center">Done</th>
                                <th className="px-5 py-3 text-center">Waiting</th>
                                <th className="px-5 py-3 w-32">Utilization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.doctorStats.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={doc.avatar} className="w-8 h-8 rounded-full bg-slate-200" />
                                            <div>
                                                <div className="font-bold text-slate-900">{doc.name}</div>
                                                <div className="text-[10px] text-slate-500">{doc.specialty}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center font-medium">{doc.total}</td>
                                    <td className="px-5 py-3 text-center font-bold text-green-600">{doc.completed}</td>
                                    <td className="px-5 py-3 text-center font-bold text-orange-600">{doc.waiting}</td>
                                    <td className="px-5 py-3">
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${doc.utilization}%` }}></div>
                                        </div>
                                        <div className="text-[10px] text-right text-slate-400 mt-1">{doc.utilization}%</div>
                                    </td>
                                </tr>
                            ))}
                            {stats.doctorStats.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No data available for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Peak Hours Chart (Simple CSS Bar Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                <div className="mb-6">
                    <h4 className="font-bold text-slate-800">Peak Hours</h4>
                    <p className="text-xs text-slate-500">Busiest times of day ({stats.dateRangeLabel})</p>
                </div>
                
                <div className="flex-1 flex items-end justify-between gap-1 min-h-[200px] border-b border-slate-200 pb-2">
                    {stats.hourlyData.map((count, index) => {
                        const height = stats.maxHourly > 0 ? (count / stats.maxHourly) * 100 : 0;
                        const hourLabel = (index + 8).toString().padStart(2, '0');
                        return (
                            <div key={index} className="flex-1 flex flex-col justify-end group relative" title={`${hourLabel}:00 - ${count} patients`}>
                                <div 
                                    className="w-full bg-primary-100 hover:bg-primary-500 rounded-t-sm transition-all duration-300 relative group-hover:shadow-lg"
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                >
                                    {count > 0 && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            {count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                    <span>08:00</span>
                    <span>14:00</span>
                    <span>20:00</span>
                </div>
            </div>
        </div>
    </div>
  );
};
