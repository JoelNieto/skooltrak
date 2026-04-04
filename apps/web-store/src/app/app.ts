import { Toast, ToastsContainer } from '@/ui';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
}
