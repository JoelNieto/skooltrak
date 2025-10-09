import { computed, Injectable, signal } from '@angular/core';
import { v7 } from 'uuid';
import { ToastObject } from '../types/toast-types';

@Injectable({
  providedIn: 'root',
})
export class Toast {
  public toasts = signal<Record<string, ToastObject>>({});
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  public toastList = computed<ToastObject[]>(() =>
    Object.values(this.toasts()).reverse()
  );

  public showSuccess(message: string) {
    this.showToast({
      type: 'success',
      message,
    });
  }

  public showError(message: string) {
    this.showToast({
      type: 'error',
      message,
    });
  }

  public showWarning(message: string) {
    this.showToast({
      type: 'warning',
      message,
    });
  }

  public showInfo(message: string) {
    this.showToast({
      type: 'info',
      message,
    });
  }

  public showToast(toast: ToastObject) {
    const id = v7();
    let className: string;

    switch (toast.type) {
      case 'success':
        className = 'alert-success';
        break;
      case 'error':
        className = 'alert-error';
        break;
      case 'warning':
        className = 'alert-warning';
        break;
      case 'info':
        className = 'alert-info';
        break;
      default:
        className = '';
    }

    this.toasts.update((toasts) => ({
      ...toasts,
      [id]: { ...toast, className, id },
    }));

    const timeout = setTimeout(() => {
      this.removeToast(id);
    }, toast.timeout ?? 5000);

    this.timeouts.set(id, timeout);
  }

  public removeToast(id: string) {
    this.toasts.update((toasts) => {
      const newToasts = { ...toasts };
      delete newToasts[id];
      return newToasts;
    });

    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }
}
