import React from 'react';
import type { FlexAlign, FlexJustify } from '@/types/layout';

interface AlignIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * Container alignment icons, drawn for a ROW: children are vertical bars laid out left to right.
 * A Column is the same picture turned a quarter turn -- rotate the align icons -90 degrees and the
 * justify icons +90 (see TemplateLayoutActionMenu's AlignmentButtons), so top/middle/bottom become
 * left/center/right for the cross axis and left/right become top/bottom for the main axis.
 */

const svgProps = (className: string, strokeWidth: number | string) => ({
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
 * AlignItemsIcon: the CROSS axis (up/down in a Row). Two bars against a wall line at the top
 * (start), the middle (center) or the bottom (end), or both bars filling wall to wall (stretch).
 */
export const AlignItemsIcon = ({
  value,
  className = 'w-3.5 h-3.5',
  strokeWidth = 1.7,
}: AlignIconProps & { value: FlexAlign }) => (
  <svg {...svgProps(className, strokeWidth)}>
    {value === 'start' && (
      <>
        <path d="M4 4h16" />
        <rect x="6" y="6.5" width="4" height="12" rx="0.8" />
        <rect x="14" y="6.5" width="4" height="7" rx="0.8" />
      </>
    )}
    {value === 'center' && (
      <>
        <path d="M4 12h16" />
        <rect x="6" y="6" width="4" height="12" rx="0.8" />
        <rect x="14" y="8.5" width="4" height="7" rx="0.8" />
      </>
    )}
    {value === 'end' && (
      <>
        <path d="M4 20h16" />
        <rect x="6" y="5.5" width="4" height="12" rx="0.8" />
        <rect x="14" y="10.5" width="4" height="7" rx="0.8" />
      </>
    )}
    {value === 'stretch' && (
      <>
        <path d="M4 4h16" />
        <path d="M4 20h16" />
        <rect x="6" y="6.5" width="4" height="11" rx="0.8" />
        <rect x="14" y="6.5" width="4" height="11" rx="0.8" />
      </>
    )}
  </svg>
);

/**
 * JustifyContentIcon: the MAIN axis (left/right in a Row). Three bars grouped against a wall at the
 * start, centered, or grouped at the end; or spread between two walls (between: touching the
 * walls' ends, around: with half a gap at each end).
 */
export const JustifyContentIcon = ({
  value,
  className = 'w-3.5 h-3.5',
  strokeWidth = 1.7,
}: AlignIconProps & { value: FlexJustify }) => (
  <svg {...svgProps(className, strokeWidth)}>
    {value === 'start' && (
      <>
        <path d="M4 4v16" />
        <rect x="7" y="7" width="3" height="10" rx="0.8" />
        <rect x="11.5" y="7" width="3" height="10" rx="0.8" />
        <rect x="16" y="7" width="3" height="10" rx="0.8" />
      </>
    )}
    {value === 'center' && (
      <>
        <rect x="6" y="7" width="3" height="10" rx="0.8" />
        <rect x="10.5" y="7" width="3" height="10" rx="0.8" />
        <rect x="15" y="7" width="3" height="10" rx="0.8" />
      </>
    )}
    {value === 'end' && (
      <>
        <path d="M20 4v16" />
        <rect x="5" y="7" width="3" height="10" rx="0.8" />
        <rect x="9.5" y="7" width="3" height="10" rx="0.8" />
        <rect x="14" y="7" width="3" height="10" rx="0.8" />
      </>
    )}
    {value === 'between' && (
      <>
        <path d="M3 4v16" />
        <path d="M21 4v16" />
        <rect x="5" y="7" width="2.5" height="10" rx="0.8" />
        <rect x="10.75" y="7" width="2.5" height="10" rx="0.8" />
        <rect x="16.5" y="7" width="2.5" height="10" rx="0.8" />
      </>
    )}
    {value === 'around' && (
      <>
        <path d="M3 4v16" />
        <path d="M21 4v16" />
        <rect x="6" y="7" width="2.5" height="10" rx="0.8" />
        <rect x="10.75" y="7" width="2.5" height="10" rx="0.8" />
        <rect x="15.5" y="7" width="2.5" height="10" rx="0.8" />
      </>
    )}
  </svg>
);
