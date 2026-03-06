import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { UpdateThemePreferenceDocument } from '../graphql/generated/graphql';
import Auth from '../auth/auth';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'skooltrak-theme-preference';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private apollo = inject(Apollo);
  private auth = inject(Auth);

  readonly theme = signal<ThemePreference>('system');

  private get resolvedTheme(): 'light' | 'dark' {
    const pref = this.theme();
    if (pref === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return pref;
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFromStorage();
      this.watchSystemPreference();
    }
  }

  private initFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      this.theme.set(stored);
      this.applyToDom();
    }
  }

  private watchSystemPreference(): void {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (this.theme() === 'system') {
        this.applyToDom();
      }
    });
  }

  private applyToDom(): void {
    if (typeof document === 'undefined') return;
    const resolved = this.resolvedTheme;
    document.documentElement.setAttribute('data-theme', resolved);
  }

  /** Apply theme without persisting to backend (for initial load from user profile). */
  applyTheme(value: ThemePreference | string | null | undefined): void {
    if (!value || !['light', 'dark', 'system'].includes(value)) {
      return;
    }
    const pref = value as ThemePreference;
    this.theme.set(pref);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, pref);
      this.applyToDom();
    }
  }

  /** Set theme and persist to user profile. */
  async setTheme(value: ThemePreference): Promise<void> {
    this.theme.set(value);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, value);
      this.applyToDom();
    }
    if (this.auth.isAuthenticated()) {
      try {
        await firstValueFrom(
          this.apollo.mutate({
            mutation: UpdateThemePreferenceDocument,
            variables: { themePreference: value },
          }),
        );
        this.auth.reloadUser();
      } catch {
        // Silently ignore - theme is still applied locally
      }
    }
  }
}
