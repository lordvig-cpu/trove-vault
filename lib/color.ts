/** Default seeds are shared by the editor; CSS uses the same RGBA values. */
export const DEFAULT_PRIMARY_COLOR = 'rgba(0, 119, 255, 1)';
export const DEFAULT_SECONDARY_COLOR = 'rgba(248, 188, 9, 1)';

/** Convert an opaque RGBA seed to the HEX format used by the editor. */
export function rgbaToHex(rgba: string): string {
  const channels = rgba.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return '#' + channels.map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Convert a normalized six-digit editor value to a CSS RGBA color. */
export function hexToRgba(hex: string): string {
  const channels = hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16));
  return `rgba(${channels.join(', ')}, 1)`;
}
