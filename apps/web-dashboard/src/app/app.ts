import { Toast, ToastsContainer } from '@/ui';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  imports: [RouterOutlet, ToastsContainer],
  selector: 'app-root',
  template: `
    <lib-toasts-container [toasts]="toasts.toastList()" />
    <router-outlet />
  `,
})
export class App {
  protected title = 'web-dashboard';
  public toasts = inject(Toast);
}
