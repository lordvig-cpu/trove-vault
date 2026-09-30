/** Default seeds are shared by the editor; CSS uses the same RGBA values. */
export const DEFAULT_PRIMARY_COLOR = 'rgba(0, 119, 255, 1)';
export const DEFAULT_SECONDARY_COLOR = 'rgba(255, 157, 0, 1)';

/** Default Background seed of Dark/Light: the calibrated canvas sample rgb(10, 15, 24). */
export const DEFAULT_BACKGROUND_COLOR = 'rgba(10, 15, 24, 1)';

/** Convert an opaque RGBA seed to the HEX format used by the editor. */
export function rgbaToHex(rgba: string): string {
  const channels = rgba.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return '#' + channels.map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Convert a normalized six-digit editor value to a CSS RGBA color. */
export function hexToRgba(hex: string): string {
  const channels = hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16));
  const alpha = channels.length > 3 ? Math.round(channels[3] / 255 * 100) / 100 : 1;
  return `rgba(${channels.slice(0, 3).join(', ')}, ${alpha})`;
}

/** Alpha of an "#RRGGBB" / "#RRGGBBAA" value as 0-100 (100 when there is no alpha part). */
export function hexAlphaPercent(hex: string): number {
  return hex.length > 7 ? Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) : 100;
}

/** Join an "#RRGGBB" color and a 0-100 opacity into "#RRGGBB", or "#RRGGBBAA" below 100 (so a fully
 *  opaque color is stored exactly as before alpha existed). */
export function withAlphaPercent(rgbHex: string, percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return p === 100 ? rgbHex.slice(0, 7) : rgbHex.slice(0, 7) + Math.round(p / 100 * 255).toString(16).padStart(2, '0').toUpperCase();
}

/** Like normalizeHex, but also accepts a 4- or 8-digit value with an alpha part; an alpha of FF is
 *  dropped, so the result is "#RRGGBB" or "#RRGGBBAA". */
export function normalizeHexAlpha(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return null;
  const full = (hex.length <= 4 ? [...hex].map(c => c + c).join('') : hex).toUpperCase();
  return `#${full.endsWith('FF') && full.length === 8 ? full.slice(0, 6) : full}`;
}

/** A 3- or 6-digit HEX color, with or without "#", as an uppercase "#RRGGBB"; null if it isn't one. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null;
  return `#${(hex.length === 3 ? [...hex].map(c => c + c).join('') : hex).toUpperCase()}`;
}
