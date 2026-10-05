import React from 'react';

/* Typography icons for the content toolbar (TemplateEditorContentBar): bold / italic / underline and
   text alignment. Stroke icons in currentColor, like the other icon sets. */

interface TextIconProps {
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

/** BoldIcon: a heavy B. */
export const BoldIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps} strokeWidth={2.6}>
    <path d="M7 4.5h6a3.75 3.75 0 0 1 0 7.5H7Z" />
    <path d="M7 12h7a3.75 3.75 0 0 1 0 7.5H7Z" />
  </svg>
);

/** ItalicIcon: a slanted I. */
export const ItalicIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M10 4.5h8" />
    <path d="M6 19.5h8" />
    <path d="M14.5 4.5 9.5 19.5" />
  </svg>
);

/** UnderlineIcon: a U over a line. */
export const UnderlineIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M7 4v7a5 5 0 0 0 10 0V4" />
    <path d="M5 20h14" />
  </svg>
);

/** TextAlignLeftIcon / Center / Right: lines of text flush to one side. */
export const TextAlignLeftIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M4 6h16" />
    <path d="M4 10h10" />
    <path d="M4 14h16" />
    <path d="M4 18h10" />
  </svg>
);

export const TextAlignCenterIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M4 6h16" />
    <path d="M7 10h10" />
    <path d="M4 14h16" />
    <path d="M7 18h10" />
  </svg>
);

export const TextAlignRightIcon = ({ className = 'w-3.5 h-3.5' }: TextIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
    <path d="M4 6h16" />
    <path d="M10 10h10" />
    <path d="M4 14h16" />
    <path d="M10 18h10" />
  </svg>
);
