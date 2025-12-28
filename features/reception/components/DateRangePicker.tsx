import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date, end: Date) => void;
  onClose: () => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(startDate || new Date());
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    // Normalize time to 00:00:00 for reliable comparisons
    const clickedDate = new Date(date);
    clickedDate.setHours(0,0,0,0);

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedDate);
      setTempEnd(null);
    } else {
      if (clickedDate < tempStart) {
        setTempEnd(new Date(tempStart));
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
    }
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  const isInRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d > tempStart && d < tempEnd;
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange(tempStart, tempEnd);
    } else if (tempStart) {
      onChange(tempStart, tempStart);
    }
    onClose();
  };

  const days = generateCalendarDays();

  return (
    <div 
        ref={containerRef} 
        className="absolute top-full right-0 mt-2 z-[100] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden"
    >
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="font-black text-slate-800 text-xs uppercase tracking-widest">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
                <div key={d} className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tighter">
                {d}
                </div>
            ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
            {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;
                
                const isStart = isSameDay(date, tempStart);
                const isEnd = isSameDay(date, tempEnd);
                const inRange = isInRange(date);
                const isToday = isSameDay(date, new Date());

                return (
                <div key={idx} className="relative py-0.5 px-0.5">
                    {inRange && <div className="absolute inset-y-0.5 left-0 right-0 bg-primary-50 z-0"></div>}
                    {isStart && tempEnd && <div className="absolute inset-y-0.5 right-0 w-1/2 bg-primary-50 z-0"></div>}
                    {isEnd && tempStart && <div className="absolute inset-y-0.5 left-0 w-1/2 bg-primary-50 z-0"></div>}
                    
                    <button 
                        onClick={() => handleDateClick(date)}
                        className={`
                            relative z-10 w-full aspect-square text-xs font-bold rounded-lg transition-all flex items-center justify-center
                            ${(isStart || isEnd) ? 'bg-primary-600 text-white shadow-md scale-110' : 
                              inRange ? 'text-primary-700' : 
                              isToday ? 'text-primary-600 border border-primary-200' : 'text-slate-600 hover:bg-slate-100'}
                        `}
                    >
                        {date.getDate()}
                    </button>
                </div>
                );
            })}
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                <span>Selection</span>
                <span className="text-primary-600">
                    {tempStart ? tempStart.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '---'}
                    {tempEnd ? ` - ${tempEnd.toLocaleDateString(undefined, {month:'short', day:'numeric'})}` : ''}
                </span>
            </div>
            <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">
                    Cancel
                </button>
                <button 
                    onClick={handleApply} 
                    disabled={!tempStart} 
                    className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                >
                    Apply
                </button>
            </div>
        </div>
    </div>
  );
};