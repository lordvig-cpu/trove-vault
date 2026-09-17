import React from 'react';

interface ExplorerIconProps {
  className?: string;
  isActive?: boolean;
}

// Clear the editable search pill.
export function SearchClearIcon({ className = 'w-3 h-3' }: ExplorerIconProps) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  );
}

// Horizontal equalizer / tuning sliders (Advanced Search Trigger)
export function SlidersHorizontalIcon({ className = 'w-3.5 h-3.5', isActive = false }: ExplorerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
    >
      {/* Top track + thumb */}
      <line x1="21" y1="5" x2="14" y2="5" />
      <line x1="10" y1="5" x2="3" y2="5" />
      <circle cx="12" cy="5" r="2" fill={isActive ? 'currentColor' : 'none'} />

      {/* Middle track + thumb */}
      <line x1="21" y1="12" x2="8" y2="12" />
      <line x1="4" y1="12" x2="3" y2="12" />
      <circle cx="6" cy="12" r="2" fill={isActive ? 'currentColor' : 'none'} />

      {/* Bottom track + thumb */}
      <line x1="21" y1="19" x2="18" y2="19" />
      <line x1="14" y1="19" x2="3" y2="19" />
      <circle cx="16" cy="19" r="2" fill={isActive ? 'currentColor' : 'none'} />
    </svg>
  );
}

// Filter icon
export function FilterIcon({ className = 'w-3.5 h-3.5', isActive = false }: ExplorerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isActive ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
    >
      <path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5L4 5z"/>
      {/*<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />*/}
    </svg>
  );
}

// Search Glass: Unfilled stroke outline by default; solid fill when active/focused
export function SearchGlassIcon({
  className = 'w-3.5 h-3.5',
  isFocused = false,
}: ExplorerIconProps & { isFocused?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isFocused ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
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
      className={`origin-center transition-all duration-200 ease-out group-hover:scale-115 ${className}`}
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
      className={`origin-center transition-all duration-200 ease-out group-hover:scale-115 ${className}`}
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
      className={`origin-center icon-pin-outline transition-all duration-300 ease-out group-hover:rotate-45 ${className}`}
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
      className={`origin-center icon-pin-filled rotate-45 transition-all duration-300 ease-out group-hover:rotate-0 ${className}`}
    >
      <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
    </svg>
  );
}
