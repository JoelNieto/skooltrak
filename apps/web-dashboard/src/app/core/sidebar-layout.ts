import { isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, inject, PLATFORM_ID, Service, signal } from '@angular/core';

const STORAGE_KEY = 'skooltrak-sidebar-collapsed';
/** Tailwind's `lg` breakpoint: below it the sidebar is an overlay drawer, always shown expanded. */
const DESKTOP_QUERY = '(min-width: 64rem)';

/**
 * Whether the dashboard sidebar shows as an icon rail. Collapsed is the default; the choice is
 * remembered per browser. Phones and tablets always get the full drawer.
 */
@Service()
export class SidebarLayout {
  readonly #browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly collapsed = signal(true);
  readonly #desktop = signal(true);

  /** The rail: collapsed, on a screen wide enough to keep the sidebar docked. */
  readonly compact = computed(() => this.collapsed() && this.#desktop());

  constructor() {
    if (!this.#browser) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) this.collapsed.set(stored === '1');
    } catch {
      // Storage blocked: keep the default.
    }
    const mq = window.matchMedia?.(DESKTOP_QUERY);
    if (mq) {
      this.#desktop.set(mq.matches);
      const onChange = (e: MediaQueryListEvent) => this.#desktop.set(e.matches);
      mq.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', onChange));
    }
  }

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (!this.#browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }
}
