import { Toast, ToastsContainer } from '@/ui';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Federation host never bootstraps remote `App` components; remotes only expose route modules.
 * Host owns the global toast surface so `Toast` (providedIn root) is visible for dashboard + store.
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
