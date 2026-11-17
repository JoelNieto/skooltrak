import { Component, inject } from '@angular/core';
import { StoreThemeService } from './store-theme.service';
import { Button, Icon } from '#/ui';

@Component({
  selector: 'app-store-theme-toggle',
  imports: [Button, Icon],
  template: `
    <div class="flex gap-1 p-2 rounded-lg bg-surface-0/50" role="group" aria-label="Tema">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        (click)="theme.setTheme('light')"
        [variant]="theme.theme() === 'light' ? 'primary' : 'ghost'"
        [attr.aria-pressed]="theme.theme() === 'light'"
        title="Claro"
        aria-label="Claro"
      >
        <ui-icon name="sun" class="text-lg" />
      </button>
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        (click)="theme.setTheme('dark')"
        [variant]="theme.theme() === 'dark' ? 'primary' : 'ghost'"
        [attr.aria-pressed]="theme.theme() === 'dark'"
        title="Oscuro"
        aria-label="Oscuro"
      >
        <ui-icon name="moon" class="text-lg" />
      </button>
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        (click)="theme.setTheme('system')"
        [variant]="theme.theme() === 'system' ? 'primary' : 'ghost'"
        [attr.aria-pressed]="theme.theme() === 'system'"
        title="Sistema"
        aria-label="Sistema"
      >
        <ui-icon name="sun-moon" class="text-lg" />
      </button>
    </div>
  `,
})
export default class StoreThemeToggle {
  protected readonly theme = inject(StoreThemeService);
}
