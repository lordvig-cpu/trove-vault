import React from 'react';

interface LayoutIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * BodyIcon:
 * Root template layout container icon representing a layout frame with header and content boxes.
 */
export const BodyIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth={strokeWidth} />
    <rect x="6" y="10.5" width="4" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
    <rect x="11.5" y="10.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
  </svg>
);

/**
 * LayoutContainerIcon:
 * Dashed rectangle representing a layout container boundary.
 */
export const LayoutContainerIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2.5"
      strokeDasharray="3 2"
    />
  </svg>
);

export const ContainerIcon = LayoutContainerIcon;

/**
 * FlexRowIcon:
 * Two boxes side-by-side with an arrow across the top pointing left and right.
 */
export const FlexRowIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Arrow pointing left and right */}
    <path d="M6.5 2.5L3.5 5l3 2.5" />
    <path d="M3.5 5h17" />
    <path d="M17.5 2.5L20.5 5l-3 2.5" />
    {/* Two boxes side-by-side */}
    <rect x="3.5" y="9.5" width="7.5" height="11" rx="1.5" />
    <rect x="13" y="9.5" width="7.5" height="11" rx="1.5" />
  </svg>
);

/**
 * FlexColumnIcon:
 * Two boxes stacked top-bottom with an arrow on the left pointing up and down.
 */
export const FlexColumnIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`origin-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Arrow on the left pointing up and down */}
    <path d="M2.5 6.5L5 3.5l2.5 3" />
    <path d="M5 3.5v17" />
    <path d="M2.5 17.5L5 20.5l2.5-3" />
    {/* Two boxes stacked top-bottom */}
    <rect x="9.5" y="3.5" width="11" height="7.5" rx="1.5" />
    <rect x="9.5" y="13" width="11" height="7.5" rx="1.5" />
  </svg>
);

