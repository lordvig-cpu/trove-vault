import React from 'react';

interface HintIconProps {
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
 * Icons for the kinds of note in a help bubble (see HoverHint's HintNote): how to use something,
 * a helpful tip, and a caution.
 */

/** HintUseIcon: a pointer arrow -- "how to use this". */
export const HintUseIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: HintIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M5 3.5 19 10l-6.2 2.1L10.7 18.5 5 3.5Z" />
    <path d="m13.2 13 4.3 4.5" />
  </svg>
);

/** HintTipIcon: a light bulb -- a helpful hint. */
export const HintTipIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: HintIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M9.5 18h5" />
    <path d="M10.5 21h3" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
  </svg>
);

/** HintCautionIcon: a warning triangle with an exclamation mark -- something to watch out for. */
export const HintCautionIcon = ({ className = 'w-3.5 h-3.5', strokeWidth = 1.8 }: HintIconProps) => (
  <svg {...base(className, strokeWidth)}>
    <path d="M12 3.5 2.5 20h19L12 3.5Z" />
    <path d="M12 9.5V14" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * HintAnchorIcon: an anchor, on or off. A help bubble opens "anchored" (`filled`: it belongs to its
 * `?` and closes when the pointer leaves); un-anchoring it (outlined) frees it to be dragged and closed.
 */
export const HintAnchorIcon = ({
  className = 'w-4 h-4',
  strokeWidth = 1.8,
  filled = false,
}: HintIconProps & { filled?: boolean }) => (
  <svg {...base(className, filled ? 2.2 : strokeWidth)}>
    <circle cx="12" cy="5" r="2" fill={filled ? 'currentColor' : 'none'} />
    <path d="M12 7v12" />
    <path d="M8 10H4l3 3" />
    <path d="M16 10h4l-3 3" />
    <path d="M4 13c.7 4 3.8 7 8 7s7.3-3 8-7" />
  </svg>
);
