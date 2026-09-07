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
      className={`origin-center transition-all duration-200 text-accent-primary group-hover:text-white ${className}`}
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
      className={`origin-center transition-all duration-200 text-accent-primary group-hover:text-white ${className}`}
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