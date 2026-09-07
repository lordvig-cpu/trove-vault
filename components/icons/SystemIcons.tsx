import React from 'react';

/* Dock Panel Icon: Represents an arrow inside a square, indicating docking or expanding a panel. */
export const DockPanelIcon = ({ className = '', isOpen }: { className?: string; isOpen: boolean }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
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

/* Moon Icon: Represents a crescent moon, used to indicate dark mode theme is enabled. */
export const MoonIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 72 72" 
    fill="currentColor"
  >
    <g transform="rotate(-45 36 36)">
      <path d="M7.3634,42.4095c4.5525,6.1703,11.874,10.1726,20.1303,10.1726c13.8071,0,25-11.1929,25-25 c0-8.5226-4.2646-16.0492-10.7763-20.5621c13.0383,2.8385,22.7812,14.4426,22.7812,28.3317c0,16.0163-12.9837,29-29,29 C21.9109,64.3517,10.5097,55.0229,7.3634,42.4095z" />
    </g>
  </svg>
);

/* Sun Icon: Represents a sun, used to indicate light theme mode is enabled. */
export const SunIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.592a.75.75 0 00-1.061 1.061l1.59 1.591z" />
  </svg>
);

/* NavigationHeaderTextureFilter: Defines an SVG filter for the navigation header, creating a subtle noise texture overlay. */
export const NavigationBarTextureFilter = () => (
  <svg className="hidden" aria-hidden="true">
    <filter id="navigationBarTexture">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 1.8" numOctaves="5" stitchTiles="stitch" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" in="noise" result="coloredNoise" />
      <feBlend mode="overlay" in="SourceGraphic" in2="coloredNoise" />
    </filter>
  </svg>
);

/* used for the right-side panel pull-out tab when docked */
export const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/* used for the right-side panel to close the panel when open */

export const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);