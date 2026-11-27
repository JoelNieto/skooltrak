import { isPlatformBrowser } from '@angular/common';
import { effect, inject, PLATFORM_ID, Service } from '@angular/core';
import { darkVariant, getContentColor, isValidHex } from './school-colors';
import Store from './store';

/**
 * The primary colour is not written to --color-primary directly: styles.css picks the light or
 * dark variant below under `html[data-school-brand]`, so a dark school colour stays readable on
 * the dark theme. Secondary and accent are set as-is.
 */
const PRIMARY_VARS = [
  '--app-school',
  '--app-school-primary',
  '--app-school-primary-content',
  '--app-school-primary-dark',
  '--app-school-primary-dark-content',
] as const;
const OTHER_VARS = [
  '--color-secondary',
  '--color-secondary-content',
  '--color-accent',
  '--color-accent-content',
] as const;
const BRAND_ATTR = 'data-school-brand';

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
    const primary = isValidHex(school?.primaryColor) ? school.primaryColor : null;
    const secondary = isValidHex(school?.secondaryColor) ? school.secondaryColor : null;
    const tertiary = isValidHex(school?.tertiaryColor) ? school.tertiaryColor : null;

    if (primary) {
      const dark = darkVariant(primary);
      root.style.setProperty('--app-school', primary);
      root.style.setProperty('--app-school-primary', primary);
      root.style.setProperty('--app-school-primary-content', getContentColor(primary));
      root.style.setProperty('--app-school-primary-dark', dark);
      root.style.setProperty('--app-school-primary-dark-content', getContentColor(dark));
      root.setAttribute(BRAND_ATTR, '');
    } else {
      for (const v of PRIMARY_VARS) root.style.removeProperty(v);
      root.removeAttribute(BRAND_ATTR);
    }

    this.setPair(root, '--color-secondary', secondary);
    this.setPair(root, '--color-accent', tertiary);
  }

  private setPair(root: HTMLElement, name: (typeof OTHER_VARS)[number], color: string | null): void {
    if (color) {
      root.style.setProperty(name, color);
      root.style.setProperty(`${name}-content`, getContentColor(color));
    } else {
      root.style.removeProperty(name);
      root.style.removeProperty(`${name}-content`);
    }
  }
}
