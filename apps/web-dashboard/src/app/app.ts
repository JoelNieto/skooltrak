import { Toast, ToastsContainer } from '@/ui';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

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
  protected title = 'web-dashboard';
  public toasts = inject(Toast);

  constructor() {
    inject(ThemeService);
  }
}
