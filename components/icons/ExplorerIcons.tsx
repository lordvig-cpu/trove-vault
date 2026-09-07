import React from 'react';

interface ExplorerIconProps {
  className?: string;
}

// Folder with a minus sign (Collapse All / Current)
export function FolderCollapseIcon({ className = 'w-3.5 h-3.5' }: ExplorerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 text-accent-primary group-hover:text-content-primary ${className}`}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

// Folder with a plus sign (Expand Active / Selected)
export function FolderExpandIcon({ className = 'w-3.5 h-3.5' }: ExplorerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 text-accent-primary group-hover:text-content-primary ${className}`}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

// Down-pointing filled triangle (Folder/Item Open)
export function ChevronDownIcon({ className = 'w-[10px] h-[10px]' }: ExplorerIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="5,8 19,8 12,18" />
    </svg>
  );
}

// Right-pointing filled triangle (Folder/Item Closed)
export function ChevronRightIcon({ className = 'w-[10px] h-[10px]' }: ExplorerIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="8,5 8,19 18,12" />
    </svg>
  );
}

// Unpinned: Upright outline -> fills primary & rotates 45° to preview the pinned state
export function PinOutlineIcon({ className = 'w-4 h-4' }: ExplorerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="transparent"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-300 ease-out group-hover:fill-content-primary group-hover:stroke-content-primary group-hover:rotate-45 ${className}`}
    >
      <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
    </svg>
  );
}

// Pinned: 45° solid pin -> clears fill to transparent outline & rotates upright to preview unpinning
export function PinFilledIcon({ className = 'w-4 h-4' }: ExplorerIconProps) {
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