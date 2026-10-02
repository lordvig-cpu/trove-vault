import React from 'react';

/* Small stroke icons that replace the unicode/emoji glyphs the app used for chevrons, arrows, tags,
   checks and similar. They draw in currentColor so they follow the surrounding text/theme color. */

interface GlyphIconProps {
  className?: string;
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  focusable: 'false' as const,
};

/** ChevronUpIcon: points up (move up, collapse). */
export const ChevronUpIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <polyline points="6 15 12 9 18 15" />
  </svg>
);

/** CheckIcon: a tick mark (done / selected). */
export const CheckIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
);

/** ArrowUpIcon: an arrow pointing up ("select parent"). */
export const ArrowUpIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M12 20V5M6 11l6-6 6 6" />
  </svg>
);

/** TagIcon: a price-tag outline (rename). */
export const TagIcon = ({ className = 'w-3.5 h-3.5' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/** InboxIcon: a tray with a downward arrow (drop / link in an existing item). */
export const InboxIcon = ({ className = 'w-3.5 h-3.5' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M12 3v10M8 9l4 4 4-4" />
    <path d="M3 14v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5h-5l-1.5 2h-5L8 14H3z" />
  </svg>
);

/** PackageIcon: a box (a grabbed item to dock). */
export const PackageIcon = ({ className = 'w-3.5 h-3.5' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
);

/** ResetIcon: a counter-clockwise arrow (reset to default). */
export const ResetIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />
  </svg>
);

/** StarIcon: a filled five-point star (verified / rank). */
export const StarIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
  </svg>
);

/** CornerDownRightIcon: an elbow arrow (a nested child under its parent in a list). */
export const CornerDownRightIcon = ({ className = 'w-3 h-3' }: GlyphIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M5 4v7a2 2 0 0 0 2 2h12M14 8l5 5-5 5" />
  </svg>
);
