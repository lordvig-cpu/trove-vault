import React from 'react';

interface PinIconProps {
  className?: string;
}

// Unpinned: Upright outline -> fills white & rotates 45° to preview the pinned state
export function PinOutlineIcon({ className = 'w-4 h-4' }: PinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="transparent"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-300 ease-out group-hover:fill-white group-hover:stroke-white group-hover:rotate-45 ${className}`}
    >
      <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
    </svg>
  );
}

// Pinned: 45° solid white pin -> clears fill to transparent outline & rotates upright to preview unpinning
export function PinFilledIcon({ className = 'w-4 h-4' }: PinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center text-content-primary rotate-45 transition-all duration-300 ease-out group-hover:fill-transparent group-hover:stroke-content-muted group-hover:rotate-0 ${className}`}
    >
      <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
    </svg>
  );
}