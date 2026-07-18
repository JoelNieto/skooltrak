import { Toast, ToastsContainer } from '#/ui';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule, ToastsContainer],
  selector: 'app-root',

  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<lib-toasts-container [toasts]="toasts.toastList()" />
    <router-outlet /> `,
})
export class App {
  protected title = 'web-admin';
  public toasts = inject(Toast);
}
