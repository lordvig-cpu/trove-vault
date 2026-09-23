import React from 'react';

interface LayoutIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * BodyIcon:
 * The root template layout, drawn as a plain tall frame — no internal detail implied.
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
    <rect x="5" y="2" width="14" height="20" rx="2" />
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

/**
 * FlexRowIcon:
 * A horizontal line with arrows pointing outward at both ends.
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
    <path d="M3.5 12h17" />
    <path d="M8 7.5L3.5 12l4.5 4.5" />
    <path d="M16 7.5l4.5 4.5-4.5 4.5" />
  </svg>
);

/**
 * FlexColumnIcon:
 * A vertical line with arrows pointing outward at both ends.
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
    <path d="M12 3.5v17" />
    <path d="M7.5 8L12 3.5 16.5 8" />
    <path d="M7.5 16l4.5 4.5 4.5-4.5" />
  </svg>
);

/**
 * SplitColumnsIcon:
 * Two squares split vertically by a dashed line.
 */
export const SplitColumnsIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2.5 2" />
  </svg>
);

/**
 * SplitRowsIcon:
 * Two squares split horizontally by a dashed line (same icon rotated 90 degrees).
 */
export const SplitRowsIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2.5 2" />
  </svg>
);

/**
 * DashedSquareQuestionIcon:
 * Empty dashed square with a question mark inside (used for empty container placeholders).
 */
export const DashedSquareQuestionIcon = ({ className = 'w-5 h-5', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="3 2" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
    <circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * ContainerOverflowIcon:
 * Warning triangle (used in the Structure tree to flag a container whose children don't fit
 * their own row at their set widths).
 */
export const ContainerOverflowIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M12 3.5 2.5 20h19L12 3.5Z" />
    <line x1="12" y1="9.5" x2="12" y2="14" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
/**
 * AddContainerBeforeIcon:
 * Clean plus sign on the left, with a solid container box on the right (+ [ ]).
 * Conveys inserting a container before the current one; clear and legible at small sizes.
 */
export const AddContainerBeforeIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    {/* Plus sign on left */}
    <line x1="2.5" y1="12" x2="8.5" y2="12" />
    <line x1="5.5" y1="9" x2="5.5" y2="15" />
    {/* Container box on right */}
    <rect x="11.5" y="5.5" width="10" height="13" rx="2" />
  </svg>
);

/**
 * AddChildContainerIcon:
 * Clean container box with a centered plus sign inside ([ + ]).
 * Conveys adding a child / nested container inside the current container.
 */
export const AddChildContainerIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    {/* Container box */}
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    {/* Plus sign inside */}
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </svg>
);

/**
 * AddContainerAfterIcon:
 * Clean solid container box on the left, with a plus sign on the right ([ ] +).
 * Conveys inserting a container after the current one; clear and legible at small sizes.
 */
export const AddContainerAfterIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    {/* Container box on left */}
    <rect x="2.5" y="5.5" width="10" height="13" rx="2" />
    {/* Plus sign on right */}
    <line x1="15.5" y1="12" x2="21.5" y2="12" />
    <line x1="18.5" y1="9" x2="18.5" y2="15" />
  </svg>
);
