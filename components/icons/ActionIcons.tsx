import React from 'react';

export const GearIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      className={`transition-colors duration-600 ${
        isActive ? 'fill-current' : 'fill-transparent group-hover/gear:fill-current'
      }`}
      d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.4 5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
    />
  </svg>
);

export const AddSubItemIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.7" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);