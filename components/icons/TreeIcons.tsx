import React from 'react';

/* ==========================================================================
   Tree & Tree Navigation Icons (Search, Filter, Folders, Actions)
   ========================================================================== */

interface TreeIconProps {
  className?: string;
  isActive?: boolean;
}

// Clear the editable search pill
export function SearchClearIcon({ className = 'w-3 h-3' }: TreeIconProps) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  );
}

// Horizontal equalizer / tuning sliders (Advanced Search Trigger)
export function SlidersHorizontalIcon({ className = 'w-3.5 h-3.5', isActive = false }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
      aria-hidden="true"
    >
      <line x1="21" y1="5" x2="14" y2="5" />
      <line x1="10" y1="5" x2="3" y2="5" />
      <circle cx="12" cy="5" r="2" fill={isActive ? 'currentColor' : 'none'} />

      <line x1="21" y1="12" x2="8" y2="12" />
      <line x1="4" y1="12" x2="3" y2="12" />
      <circle cx="6" cy="12" r="2" fill={isActive ? 'currentColor' : 'none'} />

      <line x1="21" y1="19" x2="18" y2="19" />
      <line x1="14" y1="19" x2="3" y2="19" />
      <circle cx="16" cy="19" r="2" fill={isActive ? 'currentColor' : 'none'} />
    </svg>
  );
}

// Filter icon
export function FilterIcon({ className = 'w-3.5 h-3.5', isActive = false }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isActive ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
      aria-hidden="true"
    >
      <path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5L4 5z"/>
    </svg>
  );
}

// Search Glass: Unfilled stroke outline by default; solid fill when active/focused
export function SearchGlassIcon({
  className = 'w-3.5 h-3.5',
  isFocused = false,
}: TreeIconProps & { isFocused?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isFocused ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ${className}`}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// Magnifier with a plus / minus inside the lens (canvas zoom controls)
export function ZoomInIcon({ className = 'w-4 h-4' }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="11" y1="8" x2="11" y2="14" />
    </svg>
  );
}

export function ZoomOutIcon({ className = 'w-4 h-4' }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

// Folder with a minus sign (Collapse All / Current)
export function FolderCollapseIcon({ className = 'w-3.5 h-3.5' }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ease-out group-hover:scale-115 ${className}`}
      aria-hidden="true"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

// Folder with a plus sign (Expand Active / Selected)
export function FolderExpandIcon({ className = 'w-3.5 h-3.5' }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-200 ease-out group-hover:scale-115 ${className}`}
      aria-hidden="true"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

// Down-pointing filled triangle
export function TreeTriangleDownIcon({ className = 'w-[10px] h-[10px]' }: TreeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <polygon points="5,8 19,8 12,18" />
    </svg>
  );
}

// Right-pointing filled triangle
export function TreeTriangleRightIcon({ className = 'w-[10px] h-[10px]' }: TreeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <polygon points="8,5 8,19 18,12" />
    </svg>
  );
}

// Tree elbow branch connector (used in Filter / Tree hierarchy tree)
export function TreeBranchIcon({ className = 'w-3.5 h-3.5' }: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`tree-filter-branch shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <path d="M 5 2 L 5 9 L 13 9" />
      <polyline points="10 6 13 9 10 12" />
    </svg>
  );
}

// Plus Icon (used for contextual add action in headers)
export function PlusIcon({ className = 'w-2.5 h-2.5' }: TreeIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Gear Icon: Settings / actions trigger
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
      className={`transition-colors duration-700 ${
        isActive ? 'icon-gear-active' : 'icon-gear-idle'
      }`}
      d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.4 5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
    />
  </svg>
);

// Add Sub-Item Icon: Nested creation trigger
export const AddSubItemIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.7" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// Re-export pin icons for backwards compatibility
export { PinOutlineIcon, PinFilledIcon } from './PanelIcons';
