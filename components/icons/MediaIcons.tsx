import React from 'react';

export const AnimationsOnIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

export const AnimationsOffIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

export const AudioOnIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const AudioOffIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);