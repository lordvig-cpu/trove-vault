import React from 'react';

interface SectionIconProps {
  className?: string;
  strokeWidth?: number | string;
}

const base = (className: string, strokeWidth: number | string) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: `origin-center shrink-0 ${className}`,
  'aria-hidden': true as const,
});

/**
 * Large icons for a Properties section's header tile (see ActionMenuSection): Size, Spacing,
 * Layout, Appearance, Content, Label and Text.
 */

/** SectionSizeIcon: a frame with an arrow running corner to corner -- resizing. */
export const SectionSizeIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="m9 15 6-6" />
    <path d="M11 9h4v4" />
    <path d="M13 15H9v-4" />
  </svg>
);

/** SectionSpacingIcon: a dashed box inside a solid one -- space around and inside. */
export const SectionSpacingIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" strokeDasharray="2.6 2.2" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" />
  </svg>
);

/** SectionLayoutIcon: a two-by-two grid of blocks. */
export const SectionLayoutIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

/** SectionAppearanceIcon: a paint palette. */
export const SectionAppearanceIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 2-.8 2-1.7 0-.7-.4-1.2-.4-1.9 0-1 .8-1.7 1.9-1.7H18a2.5 2.5 0 0 0 2.5-2.5C20.5 7.2 16.7 3.5 12 3.5Z" />
    <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="9" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** SectionContentIcon: a data cylinder -- what the content is bound to. */
export const SectionContentIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
    <path d="M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
  </svg>
);

/** SectionLabelIcon: a price tag -- the caption beside the value. */
export const SectionLabelIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M3.5 12V4.5a1 1 0 0 1 1-1H12l8.5 8.5-8.5 8.5-8.5-8.5Z" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/** SectionTextIcon: a capital A -- typography. */
export const SectionTextIcon = ({ className = 'w-5 h-5', strokeWidth = 1.7 }: SectionIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M5 19 12 4l7 15" />
    <path d="M7.8 14h8.4" />
  </svg>
);
