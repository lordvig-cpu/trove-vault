import React from 'react';

interface LayoutIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * BodyIcon:
 * The root template layout: an outlined page with a header strip, a footer split and a center
 * divider -- outline only, like the rest of the layout icons.
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
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M4 8.5h16" />
    <path d="M12 8.5v12" />
    <path d="M4 14.5h16" />
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
 * ContainerOverflowIcon:
 * Warning triangle (used in the Layout tree to flag a container whose children don't fit
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

/**
 * AutoSizingIcon:
 * Three sparkle/star shapes, for automatic ("Auto") container sizing.
 */
export const AutoSizingIcon = ({ className = 'w-4 h-4', strokeWidth = 1.9 }: LayoutIconProps) => (
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
    <path d="M12 3.5 13.3 7l3.5 1.3-3.5 1.3L12 13l-1.3-3.4-3.5-1.3L10.7 7 12 3.5Z" />
    <path d="M18.5 13.5 19.2 15.3 21 16l-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    <path d="M6 14.5 6.8 16.5 8.8 17.3 6.8 18.1 6 20.1 5.2 18.1 3.2 17.3 5.2 16.5 6 14.5Z" />
  </svg>
);

/**
 * FitContentIcon:
 * A small block with arrows closing in on it from both sides, for "Fit" container sizing (the
 * container shrinks to hug its content -- the opposite of FillIcon's arrows pointing outward).
 */
export const FitContentIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <rect x="9.5" y="8" width="5" height="8" rx="1" />
    <path d="M2.5 12H7" />
    <path d="m5 9.5 2.5 2.5L5 14.5" />
    <path d="M21.5 12H17" />
    <path d="m19 9.5-2.5 2.5 2.5 2.5" />
  </svg>
);

/**
 * CustomSizingIcon:
 * Three sliders (rows with dots at different positions), for manual ("Custom") container sizing.
 */
export const CustomSizingIcon = ({ className = 'w-4 h-4', strokeWidth = 1.9 }: LayoutIconProps) => (
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
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
    <circle cx="9" cy="7" r="1.7" />
    <circle cx="15" cy="12" r="1.7" />
    <circle cx="11" cy="17" r="1.7" />
  </svg>
);

/**
 * FitFrameIcon:
 * Four corner brackets, for the preview-width Fit toggle. With `active`, a filled rounded square
 * appears inside the brackets, showing the preview snugged to fit them.
 */
export const FitFrameIcon = ({
  className = 'w-4 h-4',
  strokeWidth = 2,
  active,
}: LayoutIconProps & { active?: boolean }) => (
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
    <path d="M9 5H5v4" />
    <path d="M15 5h4v4" />
    <path d="M19 15v4h-4" />
    <path d="M9 19H5v-4" />
    {active && <rect x="8" y="8" width="8" height="8" rx="1.5" />}
  </svg>
);

/**
 * ActionIcon:
 * A lightning bolt, for a menu section grouping actions (e.g. "Add Child Container").
 */
export const ActionIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M13.5 2.8 5.8 13h5.5l-.8 8.2L18.2 11h-5.5l.8-8.2Z" />
  </svg>
);

/**
 * PropertiesIcon:
 * Three rows with a dot on each at a different position, like a set of sliders -- for a menu
 * section grouping property/setting controls.
 */
export const PropertiesIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
    <circle cx="9" cy="7" r="1.7" />
    <circle cx="15" cy="12" r="1.7" />
    <circle cx="11" cy="17" r="1.7" />
  </svg>
);

/**
 * FillIcon:
 * Two vertical bars (the available width) with a horizontal line and outward-pointing arrows
 * spanning between them, for "Fill" sizing (stretches to fill the available space).
 */
export const FillIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    {/* outer available width */}
    <path d="M3 6v12" />
    <path d="M21 6v12" />
    {/* horizontal fill */}
    <path d="M7 12h10" />
    {/* left arrow */}
    <path d="m7 9-3 3 3 3" />
    {/* right arrow */}
    <path d="m17 9 3 3-3 3" />
  </svg>
);

/**
 * LinkIcon:
 * Two chain links, for "link these values together" (e.g. edit all four sides at once).
 */
export const LinkIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

/**
 * HelpCircleIcon:
 * A circled question mark, for an inline hint that would otherwise need a paragraph of help text.
 */
export const HelpCircleIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1.4 1-1.4 1.9" />
    <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * UndoIcon:
 * A curved arrow turning back to the left.
 */
export const UndoIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);

/**
 * RedoIcon:
 * UndoIcon mirrored: a curved arrow turning forward to the right.
 */
export const RedoIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </svg>
);

/**
 * SaveIcon:
 * A floppy disk: outline with a label slot at the top and a shutter at the bottom.
 */
export const SaveIcon = ({ className = 'w-4 h-4', strokeWidth = 1.8 }: LayoutIconProps) => (
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
    <path d="M5 3h11.5L21 7.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M7 3v5h8V3" />
    <rect x="7" y="13" width="10" height="8" rx="1" />
  </svg>
);

/**
 * PencilIcon:
 * A pencil, for the editor's Edit mode.
 */
export const PencilIcon = ({ className = 'w-4 h-4', strokeWidth = 2 }: LayoutIconProps) => (
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
    <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

/**
 * EyeIcon:
 * An eye, for the editor's Preview mode.
 */
export const EyeIcon = ({ className = 'w-4 h-4', strokeWidth = 2 }: LayoutIconProps) => (
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
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
