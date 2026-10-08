import React from 'react';

/* Icons for content kinds (field types, layout components, files and folders) that stood in for emoji
   in menus, trees and palettes. Stroke icons drawn in currentColor, 24x24 viewBox, so they follow the
   surrounding text color and theme. */

interface ContentIconProps {
  className?: string;
}

/** Shared <svg> wrapper: sizing, stroke style and a11y attributes in one place. */
function Svg({ className = 'w-3.5 h-3.5', children }: ContentIconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** FileIcon: a page with a folded corner (an item / document). */
export const FileIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4z" /><path d="M14 3v4h4" /></Svg>
);

/** FolderIcon: a closed folder (a collection). */
export const FolderIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" /></Svg>
);

/** TextFieldIcon: lines of text (text field / note). */
export const TextFieldIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M4 6h16M4 12h16M4 18h10" /></Svg>
);

/** NumberFieldIcon: a hash sign (number field). */
export const NumberFieldIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" /></Svg>
);

/** ListIcon: a bulleted list (dropdown / select field). */
export const ListIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Svg>
);

/** ToggleIcon: an on/off switch (boolean field). */
export const ToggleIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="2" y="7" width="20" height="10" rx="5" /><circle cx="16" cy="12" r="2.5" fill="currentColor" stroke="none" /></Svg>
);

/** CalendarIcon: a month page (date field). */
export const CalendarIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
);

/** TableIcon: a grid with a header row (table component). */
export const TableIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 10v10" /></Svg>
);

/** ImageIcon: a picture frame with a sun and hills (media component). */
export const ImageIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></Svg>
);

/** CameraIcon: a camera body with a lens (add / empty photo). */
export const CameraIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></Svg>
);

/** ChartIcon: a rising line (stat / metric component). */
export const ChartIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M3 20h18M4 15l5-5 4 4 7-8" /></Svg>
);

/** NoteIcon: a sticky note with a folded corner (note component). */
export const NoteIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M5 4h14v10l-6 6H5V4z" /><path d="M19 14h-6v6M8 9h8" /></Svg>
);

/** CardsIcon: stacked cards (standard card / layout items). */
export const CardsIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="8" width="14" height="12" rx="2" /><path d="M7 4h12a2 2 0 0 1 2 2v10" /></Svg>
);

/** LayoutGridIcon: a frame split into blocks (layout items). */
export const LayoutGridIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></Svg>
);

/** PuzzleIcon: a puzzle piece (pre-defined components). */
export const PuzzleIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M10 4a2 2 0 1 1 4 0v2h4a1 1 0 0 1 1 1v4h-2a2 2 0 1 0 0 4h2v4a1 1 0 0 1-1 1h-4v-2a2 2 0 1 0-4 0v2H6a1 1 0 0 1-1-1v-4h2a2 2 0 1 0 0-4H5V7a1 1 0 0 1 1-1h4V4z" /></Svg>
);

/** BulbIcon: a light bulb (callout component). */
export const BulbIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Svg>
);

/** UserIcon: a head and shoulders (account). */
export const UserIcon = (p: ContentIconProps) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);

/** SparkleIcon: a four-point sparkle ("new"). */
export const SparkleIcon = (p: ContentIconProps) => (
  <Svg {...p}><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z" /></Svg>
);

/** RowsLayoutIcon / ColumnsLayoutIcon: a frame split into stacked rows or side-by-side columns. */
export const RowsLayoutIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18" /></Svg>
);
export const ColumnsLayoutIcon = (p: ContentIconProps) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18" /></Svg>
);

/** DotIcon: a filled status dot; color it with text-* classes or a theme variable. */
export const DotIcon = ({ className = 'w-2 h-2' }: ContentIconProps) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" focusable="false">
    <circle cx="4" cy="4" r="4" />
  </svg>
);

/** The icon for a layout component's `componentType`: field, table, media, stat, callout; anything
    else (note, divider, ...) falls back to `fallback` (the note icon unless a caller asks otherwise). */
export function ComponentTypeIcon({
  type,
  className,
  fallback = NoteIcon,
}: {
  type: string;
  className?: string;
  fallback?: (p: ContentIconProps) => React.ReactElement;
}) {
  const Icon =
    type === 'field' ? TextFieldIcon
    : type === 'table' ? TableIcon
    : type === 'media' ? ImageIcon
    : type === 'stat' ? ChartIcon
    : fallback;
  return <Icon className={className} />;
}

/** The icon for a template field type (text, number, select, boolean, date). */
export function FieldTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon =
    type === 'number' ? NumberFieldIcon
    : type === 'select' ? ListIcon
    : type === 'boolean' ? ToggleIcon
    : type === 'date' ? CalendarIcon
    : TextFieldIcon;
  return <Icon className={className} />;
}

/** The icon for one of the Layout tree filter's categories: container, field or predefined. */
export function HierarchyCategoryIcon({ type, className }: { type: string; className?: string }) {
  const Icon = type === 'container' ? LayoutGridIcon : type === 'field' ? TextFieldIcon : PuzzleIcon;
  return <Icon className={className} />;
}
