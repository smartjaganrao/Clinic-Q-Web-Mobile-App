
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-2xl opacity-0 group-hover/tip:opacity-100 transition-all duration-200 pointer-events-none z-[200] whitespace-normal text-center leading-tight border border-white/10 break-words ring-1 ring-black/10">
        {text}
        {/* Tiny Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};
