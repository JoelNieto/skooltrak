import { Component, inject } from '@angular/core';
import { StoreThemeService } from './store-theme.service';

@Component({
  selector: 'app-store-theme-toggle',
  template: `
    <div class="flex gap-1 p-2 rounded-lg bg-base-200/50" role="group" aria-label="Tema">
      <button
        type="button"
        (click)="theme.setTheme('light')"
        [class.btn-active]="theme.theme() === 'light'"
        class="btn btn-ghost btn-sm btn-square"
        [attr.aria-pressed]="theme.theme() === 'light'"
        title="Claro"
      >
        <span class="material-symbols-outlined text-lg">light_mode</span>
      </button>
      <button
        type="button"
        (click)="theme.setTheme('dark')"
        [class.btn-active]="theme.theme() === 'dark'"
        class="btn btn-ghost btn-sm btn-square"
        [attr.aria-pressed]="theme.theme() === 'dark'"
        title="Oscuro"
      >
        <span class="material-symbols-outlined text-lg">dark_mode</span>
      </button>
      <button
        type="button"
        (click)="theme.setTheme('system')"
        [class.btn-active]="theme.theme() === 'system'"
        class="btn btn-ghost btn-sm btn-square"
        [attr.aria-pressed]="theme.theme() === 'system'"
        title="Sistema"
      >
        <span class="material-symbols-outlined text-lg">contrast</span>
      </button>
    </div>
  `,
})
export default class StoreThemeToggle {
  protected readonly theme = inject(StoreThemeService);
}
