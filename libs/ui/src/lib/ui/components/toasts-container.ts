import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ToastObject } from '../types/toast-types';

@Component({
  selector: 'lib-toasts-container',
  imports: [NgClass],
  template: `<div
    class="toast toast-bottom toast-center z-50"
    id="toastContainer"
  >
    @for (toast of toasts(); track toast.id) {
    <div class="alert {{ toast.type }} " [ngClass]="toast.className">
      <span>{{ toast.message }}</span>
      @if (toast.detail) {
      <span class="text-xs">{{ toast.detail }}</span>
      }
    </div>
    }
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastsContainer {
  public toasts = input<ToastObject[]>([]);
  public removeToast = output<string | undefined>();
}
