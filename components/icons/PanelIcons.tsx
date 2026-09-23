import React from 'react';

/* ==========================================================================
   Panel & Dock Control Icons (Docking, Pins, Resizing, Tabs, DropZones)
   ========================================================================== */

/* Dock Panel Icons (VS Code layout controls for Left, Bottom, and Right panels) */
export const DockLeftPanelIcon = ({ className = '', isOpen }: { className?: string; isOpen: boolean }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polygon
      points={isOpen ? '8,9 4,12 8,15' : '5,9 9,12 5,15'}
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const DockBottomPanelIcon = ({ className = '', isOpen }: { className?: string; isOpen: boolean }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <polygon
      points={isOpen ? '9,16 12,20 15,16' : '9,19 12,15 15,19'}
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const DockRightPanelIcon = ({ className = '', isOpen }: { className?: string; isOpen: boolean }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <polygon
      points={isOpen ? '16,9 20,12 16,15' : '19,9 15,12 19,15'}
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

/* Pin Icons */
interface PinIconProps {
  className?: string;
  position?: 'left' | 'right';
}

export const PinOutlineIcon = ({ className = 'w-4 h-4', position = 'left' }: PinIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="transparent"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center icon-pin-outline transition-all duration-300 ease-out ${
      position === 'right' ? 'group-hover:-rotate-45' : 'group-hover:rotate-45'
    } ${className}`}
    aria-hidden="true"
  >
    <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
  </svg>
);

export const PinFilledIcon = ({ className = 'w-4 h-4', position = 'left' }: PinIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center icon-pin-filled ${
      position === 'right' ? '-rotate-45' : 'rotate-45'
    } transition-all duration-300 ease-out group-hover:rotate-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M8 3H16L15 8L18 11V13H13V19L12 22L11 19V13H6V11L9 8L8 3Z" />
  </svg>
);

/* Panel Width / Height Reset Indicators */
export const ResetWidthIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center transition-colors ${className}`}
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const ResetWidthRightIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center transition-colors ${className}`}
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const ResetHeightIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center transition-colors ${className}`}
    aria-hidden="true"
  >
    <path d="M12 21a9 9 0 1 0-9-9 9.75 9.75 0 0 0 2.74 6.74L8 21" />
    <path d="M3 21h5v-5" />
  </svg>
);

/* Chevrons for side and bottom panels */
export const ChevronLeftIcon = ({ className }: { className?: string }) => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRightIcon = ({ className }: { className?: string }) => (
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* Trash Can Icon (used in Dock Drop Zones to remove content) */
export const TrashCanIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

/* Prohibited / Slashed NO Icon (used in Dock Drop Zones for invalid target) */
export const ProhibitedIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.366zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
      clipRule="evenodd"
    />
  </svg>
);

/* Tree Type Tab Icons (replace the Items/Collections/Templates tab labels so a long word
   can't stretch the tab strip wide enough to push the panel's expand/collapse/+ controls
   off-screen; the button's own `title` attribute still carries the name on hover). */
export const ItemsTabIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3.5 18.5 7.2 12 10.9 5.5 7.2 12 3.5Z" />
    <path d="M5.5 7.2v9.6L12 20.5v-9.6" />
    <path d="M18.5 7.2v9.6L12 20.5" />
  </svg>
);

export const CollectionsTabIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* top cube */}
    <path d="M12 2.8 15.1 4.6 12 6.4 8.9 4.6 12 2.8Z" />
    <path d="M8.9 4.6v4.4L12 10.8V6.4" />
    <path d="M15.1 4.6v4.4L12 10.8" />

    {/* bottom left cube */}
    <path d="M7.4 10.2 10.5 12 7.4 13.8 4.3 12 7.4 10.2Z" />
    <path d="M4.3 12v4.4l3.1 1.8v-4.4" />
    <path d="M10.5 12v4.4l-3.1 1.8" />

    {/* bottom right cube */}
    <path d="M16.6 10.2 19.7 12 16.6 13.8 13.5 12 16.6 10.2Z" />
    <path d="M13.5 12v4.4l3.1 1.8v-4.4" />
    <path d="M19.7 12v4.4l-3.1 1.8" />
  </svg>
);

export const TemplatesTabIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.2" />
    <rect x="7.5" y="7.2" width="9" height="3.2" rx="0.8" />
    <rect x="7.5" y="12.2" width="3.2" height="4.2" rx="0.6" />
    <path d="M12.5 12.7h4" />
    <path d="M12.5 15.3h4" />
  </svg>
);

/* PanelFolderTabSvg: Reusable paper folder tab shape for side and bottom panels */
interface PanelFolderTabSvgProps {
  gradientId: string;
  isActive?: boolean;
  isTarget?: boolean;
  variant?: 'curved' | 'slanted';
  className?: string;
}

export const PanelFolderTabSvg = ({
  gradientId,
  isActive = false,
  isTarget = false,
  variant = 'curved',
  className = 'absolute inset-0 w-full h-full pointer-events-none',
}: PanelFolderTabSvgProps) => (
  <svg
    className={className}
    viewBox="0 0 100 28"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--tree-tab-active-top, rgba(18, 94, 158, 1))" className="tab-grad-top" />
        <stop offset="45%" stopColor="var(--tree-tab-active-mid, rgba(10, 64, 112, 1))" className="tab-grad-mid" />
        <stop offset="100%" stopColor="var(--tree-tab-active-bottom, rgba(5, 36, 70, 1))" className="tab-grad-bottom" />
      </linearGradient>
    </defs>

    {variant === 'slanted' ? (
      <>
        <polygon
          points="0,28 7,0 93,0 100,28"
          fill={isActive || isTarget ? `url(#${gradientId})` : undefined}
          className="tree-tab-svg-fill"
        />
        <polyline
          points="0,28 7,0 93,0 100,28"
          fill="none"
          strokeWidth={isTarget ? '2' : '1.5'}
          className="tree-tab-svg-stroke"
          vectorEffect="non-scaling-stroke"
        />
      </>
    ) : (
      <>
        <path
          d="M 0,28 L 8,3 C 9,1 11,0 14,0 L 86,0 C 89,0 91,1 92,3 L 100,28 Z"
          className="tree-tab-svg-fill"
          style={isActive || isTarget ? { fill: `url(#${gradientId})` } : undefined}
        />
        <path
          d="M 0,28 L 8,3 C 9,1 11,0 14,0 L 86,0 C 89,0 91,1 92,3 L 100,28"
          className="tree-tab-svg-stroke"
          fill="none"
          strokeWidth={isTarget ? '2' : '1.5'}
          vectorEffect="non-scaling-stroke"
        />
      </>
    )}
  </svg>
);

