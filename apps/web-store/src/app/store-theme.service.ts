import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { readAccessTokenFromStorage } from '@/client-auth';

export type StoreThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'skooltrak-theme-preference';

@Injectable({
  providedIn: 'root',
})
export class StoreThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  readonly theme = signal<StoreThemePreference>('system');

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
    const stored = localStorage.getItem(STORAGE_KEY) as StoreThemePreference | null;
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
    document.documentElement.setAttribute('data-theme', this.resolvedTheme);
  }

  /** Apply without persisting to the server (e.g. initial load from `me.themePreference`). */
  applyTheme(value: StoreThemePreference | string | null | undefined): void {
    if (!value || !['light', 'dark', 'system'].includes(value)) {
      return;
    }
    const pref = value as StoreThemePreference;
    this.theme.set(pref);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, pref);
      this.applyToDom();
    }
  }

  async setTheme(value: StoreThemePreference): Promise<void> {
    this.theme.set(value);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, value);
      this.applyToDom();
    }
    if (readAccessTokenFromStorage()) {
      try {
        await firstValueFrom(
          this.http.patch('/api/v1/auth/me/theme', { themePreference: value }),
        );
      } catch {
        // Theme still applied locally
      }
    }
  }
}
