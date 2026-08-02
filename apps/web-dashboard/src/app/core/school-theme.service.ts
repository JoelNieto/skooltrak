import { isPlatformBrowser } from '@angular/common';
import { effect, inject, PLATFORM_ID, Service } from '@angular/core';
import Store from './store';

const THEME_VARS = [
  '--color-primary',
  '--color-primary-content',
  '--color-secondary',
  '--color-secondary-content',
  '--color-accent',
  '--color-accent-content',
] as const;

/** Returns relative luminance (0–1). Higher = lighter. */
function getLuminance(hex: string): number {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return 0.5;
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Returns a contrasting content color (white or dark) for the given background hex. */
function getContentColor(hex: string): string {
  return getLuminance(hex) > 0.4 ? '#1a1a1a' : '#fafafa';
}

function isValidHex(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  return /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(s) || /^#[0-9A-Fa-f]{6}$/.test(s);
}

@Service()
export class SchoolThemeService {
  private platformId = inject(PLATFORM_ID);
  private store = inject(Store);

  constructor() {
    effect(() => {
      const school = this.store.currentSchool();
      if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
        this.applySchoolTheme(school);
      }
    });
  }

  private applySchoolTheme(
    school: { primaryColor?: string | null; secondaryColor?: string | null; tertiaryColor?: string | null } | null,
  ): void {
    const root = document.documentElement;

    if (!school || (!school.primaryColor && !school.secondaryColor && !school.tertiaryColor)) {
      this.clearOverrides(root);
      return;
    }

    const primary = isValidHex(school.primaryColor) ? school.primaryColor! : null;
    const secondary = isValidHex(school.secondaryColor) ? school.secondaryColor! : null;
    const tertiary = isValidHex(school.tertiaryColor) ? school.tertiaryColor! : null;

    if (!primary && !secondary && !tertiary) {
      this.clearOverrides(root);
      return;
    }

    if (primary) {
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--color-primary-content', getContentColor(primary));
    }
    if (secondary) {
      root.style.setProperty('--color-secondary', secondary);
      root.style.setProperty('--color-secondary-content', getContentColor(secondary));
    }
    if (tertiary) {
      root.style.setProperty('--color-accent', tertiary);
      root.style.setProperty('--color-accent-content', getContentColor(tertiary));
    }

    // Clear any vars we didn't set (partial theme)
    if (!primary) {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-content');
    }
    if (!secondary) {
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-secondary-content');
    }
    if (!tertiary) {
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--color-accent-content');
    }
  }

  private clearOverrides(root: HTMLElement): void {
    for (const v of THEME_VARS) {
      root.style.removeProperty(v);
    }
  }
}
