import { Toast, ToastsContainer } from '@/ui';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StoreThemeService } from './store-theme.service';

/**
 * Used when web-store runs standalone (`nx serve web-store`). When loaded as a remote in the shell,
 * only `STORE_ROUTES` is mounted — the shell `App` provides the global toast container.
 */
@Component({
  imports: [RouterOutlet, ToastsContainer],
  selector: 'app-root',
  template: `
    <lib-toasts-container [toasts]="toasts.toastList()" />
    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly toasts = inject(Toast);
  /** Ensures theme is applied from localStorage on every route (e.g. school picker). */
  private readonly _storeTheme = inject(StoreThemeService);
}
