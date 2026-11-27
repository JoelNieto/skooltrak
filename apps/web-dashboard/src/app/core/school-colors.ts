/**
 * Colour helpers for school branding (school-theme.service.ts and the sidebar's crest monogram).
 * Plain functions so they can be unit tested without a DOM.
 */

/** The dark theme's raised surface (libs/ui theme.css --ui-p-night-raised): what the sidebar and cards sit on. */
const DARK_SURFACE = '#131f42';

export function isValidHex(s: string | null | undefined): s is string {
  if (!s || typeof s !== 'string') return false;
  return /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(s);
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/** Relative luminance (0–1). Higher = lighter. */
export function getLuminance(hex: string): number {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = toRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [getLuminance(a), getLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A contrasting content colour (white or dark) for the given background. */
export function getContentColor(hex: string): string {
  return getLuminance(hex) > 0.4 ? '#1a1a1a' : '#fafafa';
}

/**
 * The school colour to use on the dark theme: the same hue, mixed toward white until it reads as
 * text on the dark surface (4.5:1). Colours that already read are returned unchanged.
 */
export function darkVariant(hex: string): string {
  const rgb = toRgb(hex);
  for (let step = 0; step <= 10; step++) {
    const t = step / 10;
    const mixed = toHex(rgb.map((c) => c + (255 - c) * t) as [number, number, number]);
    if (contrastRatio(mixed, DARK_SURFACE) >= 4.5) return mixed;
  }
  return '#ffffff';
}

const SMALL_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'of', 'the', 'and']);

/** Two-letter monogram for a school without a logo: "Escuela Nuevo Horizonte" → "NH" (skips the school-type word when there are more). */
export function schoolInitials(name: string | null | undefined): string {
  const words = (name ?? '')
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w && !SMALL_WORDS.has(w.toLowerCase()));
  if (!words.length) return '?';
  const pick = words.length > 2 ? words.slice(1, 3) : words.slice(0, 2);
  return pick
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
