import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center group/tip ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-all duration-200 pointer-events-none z-[100] whitespace-normal text-center leading-tight">
        {text}
        {/* Tiny Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};