
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

  // Close on click outside (Desktop logic mostly)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only trigger if screen is desktop (md) or if backdrop didn't catch it
      if (window.innerWidth >= 768 && containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Start new selection
      setTempStart(date);
      setTempEnd(null);
    } else {
      // Complete selection
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
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
    return date > tempStart && date < tempEnd;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange(tempStart, tempEnd);
      onClose();
    } else if (tempStart) {
      // If only start selected, assume single day range
      onChange(tempStart, tempStart);
      onClose();
    }
  };

  const days = generateCalendarDays();

  return (
    <>
        {/* Mobile Backdrop */}
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm md:hidden" onClick={onClose}></div>

        <div 
            ref={containerRef} 
            className="
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[300px]
                md:absolute md:top-full md:right-0 md:left-auto md:translate-x-0 md:translate-y-0 md:mt-2 md:w-72
                bg-white rounded-xl shadow-2xl border border-slate-200 
                animate-in fade-in zoom-in-95 
                origin-center md:origin-top-right
            "
        >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="font-bold text-slate-800 text-sm">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
        </div>

        {/* Grid */}
        <div className="p-3">
            <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase">
                {d}
                </div>
            ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;
                
                const isStart = isSameDay(date, tempStart);
                const isEnd = isSameDay(date, tempEnd);
                const inRange = isInRange(date);
                const isToday = isSameDay(date, new Date());

                let btnClass = "text-sm w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10";
                
                if (isStart || isEnd) {
                btnClass += " bg-slate-900 text-white font-bold shadow-md scale-105";
                } else if (inRange) {
                btnClass += " bg-blue-50 text-blue-700 font-medium rounded-none";
                // Visual connector tweaks
                if (isSameDay(new Date(date.getTime() - 86400000), tempStart)) btnClass += " rounded-l-none";
                } else {
                btnClass += " hover:bg-slate-100 text-slate-700";
                if (isToday) btnClass += " text-blue-600 font-bold border border-blue-200";
                }

                return (
                <div key={idx} className="relative p-0.5">
                    {/* Range Connector Backgrounds */}
                    {inRange && <div className="absolute inset-y-0.5 left-0 right-0 bg-blue-50 z-0"></div>}
                    {isStart && tempEnd && <div className="absolute inset-y-0.5 right-0 w-1/2 bg-blue-50 z-0 rounded-l-full"></div>}
                    {isEnd && tempStart && <div className="absolute inset-y-0.5 left-0 w-1/2 bg-blue-50 z-0 rounded-r-full"></div>}
                    
                    <button 
                    onClick={() => handleDateClick(date)}
                    className={btnClass}
                    >
                    {date.getDate()}
                    </button>
                </div>
                );
            })}
            </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-xl">
            <div className="text-xs font-medium text-slate-500">
            {tempStart ? (
                <>
                {tempStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                {tempEnd ? ` - ${tempEnd.toLocaleDateString(undefined, {month:'short', day:'numeric'})}` : ''}
                </>
            ) : 'Select range'}
            </div>
            <div className="flex gap-2">
            <button onClick={onClose} className="p-1.5 hover:bg-white rounded-lg text-slate-500 border border-transparent hover:border-slate-200 transition-all">
                <X className="h-4 w-4" />
            </button>
            <button onClick={handleApply} disabled={!tempStart} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">
                <Check className="h-4 w-4" />
            </button>
            </div>
        </div>
        </div>
    </>
  );
};
