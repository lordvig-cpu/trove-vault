import React from 'react';

/* ==========================================================================
   Navigation Header & Footer Icons (Theme, Audio/Media, Texture Filters)
   ========================================================================== */

/* Moon Icon: Indicates dark theme is active */
export const MoonIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    viewBox="0 0 72 72" 
    fill="currentColor"
    aria-hidden="true"
  >
    <g transform="rotate(-45 36 36)">
      <path d="M7.3634,42.4095c4.5525,6.1703,11.874,10.1726,20.1303,10.1726c13.8071,0,25-11.1929,25-25 c0-8.5226-4.2646-16.0492-10.7763-20.5621c13.0383,2.8385,22.7812,14.4426,22.7812,28.3317c0,16.0163-12.9837,29-29,29 C21.9109,64.3517,10.5097,55.0229,7.3634,42.4095z" />
    </g>
  </svg>
);

/* Sun Icon: Indicates light theme is active */
export const SunIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.592a.75.75 0 00-1.061 1.061l1.59 1.591z" />
  </svg>
);

/* Animations State Icons */
export const AnimationsOnIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

export const AnimationsOffIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

/* Audio State Icons */
export const AudioOnIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={`origin-center transition-transform duration-200 ease-out group-hover:scale-115 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

/* NavigationHeaderTextureFilter: Defines an SVG filter for header texture overlay */
export const NavigationBarTextureFilter = () => (
  <svg className="absolute w-0 h-0 pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
    <filter id="navigationBarTexture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 1.8" numOctaves="5" stitchTiles="stitch" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" in="noise" result="coloredNoise" />
      <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="clippedNoise" />
      <feBlend mode="overlay" in="SourceGraphic" in2="clippedNoise" />
    </filter>
  </svg>
);

