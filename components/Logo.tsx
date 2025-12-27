
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Teal Rounded Square Background */}
    <rect width="100" height="100" rx="22" fill="#0d9488" />
    
    {/* Letter Q */}
    <circle cx="45" cy="50" r="28" stroke="white" strokeWidth="10" />
    <path d="M65 70L80 85" stroke="white" strokeWidth="10" strokeLinecap="round" />
    
    {/* Flow Arrows */}
    <g transform="translate(65, 30) scale(0.4)">
        <path d="M0 10H40 M30 0L40 10L30 20" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g transform="translate(65, 50) scale(0.4)">
        <path d="M0 10H40 M30 0L40 10L30 20" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g transform="translate(65, 70) scale(0.4)">
        <path d="M0 10H40 M30 0L40 10L30 20" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
