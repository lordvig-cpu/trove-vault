import { DEFAULT_TEMPLATE_ICON } from '@/types/template';

/* A template's icon is user data: any single emoji (or character) the user picks. These are just the
   quick choices the icon picker offers before its "any emoji" box. */
export const TEMPLATE_ICON_CHOICES: readonly string[] = [
  DEFAULT_TEMPLATE_ICON, '📚', '🃏', '🎲', '🧩', '🎮',
  '🎬', '💿', '🎵', '📷', '🖼️', '🧸',
  '🪙', '💎', '⌚', '👟', '🚗', '🚂',
  '🍷', '🌱', '⚽', '🔧', '🗡️', '📮',
];

/** The first visible character of `text` (a whole emoji, even one built from several code points), or
 *  null when there is none. What the custom box saves, so a pasted phrase can't become an icon. */
export function firstGrapheme(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(trimmed)[Symbol.iterator]().next();
  return first.done ? null : first.value.segment;
}
