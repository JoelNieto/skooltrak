import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ToastObject } from '../types/toast-types';
import { Alert, AlertTone } from './alert';

const TONE: Record<ToastObject['type'], AlertTone> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'lib-toasts-container',
  imports: [Alert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="toast toast-bottom toast-center z-50" id="toastContainer">
    @for (toast of toasts(); track toast.id) {
      <!-- Toasts float over content, so unlike inline alerts they keep a shadow. -->
      <div uiAlert [tone]="tone(toast.type)" class="shadow-lg">
        <span>{{ toast.message }}</span>
        @if (toast.detail) {
          <span class="text-xs">{{ toast.detail }}</span>
        }
      </div>
    }
  </div>`,
})
export class ToastsContainer {
  public toasts = input<ToastObject[]>([]);
  public removeToast = output<string | undefined>();

  protected tone = (type: ToastObject['type']) => TONE[type] ?? 'info';
}
