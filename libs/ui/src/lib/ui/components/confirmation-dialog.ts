import { Component, computed, input, output } from '@angular/core';
import { DialogData } from '../types/dialog.type';
import { Button } from './button';

@Component({
  selector: 'lib-confirmation',
  imports: [Button],
  template: `<p class="my-4">{{ data().message }}</p>
    <div class="flex justify-end gap-2">
      @if (!data().hideCancel) {
        <button uiButton variant="ghost" (click)="closeModal.emit(false)">
          {{ data().cancelText || 'Cancelar' }}
        </button>
      }
      <button [class]="buttonClass()" (click)="closeModal.emit(true)">
        {{ data().confirmText || 'Confirmar' }}
      </button>
    </div>`,
})
export class ConfirmationDialog {
  public data = input.required<DialogData>();
  public closeModal = output<boolean>();
  public buttonClass = computed(() => {
    switch (this.data().severity) {
      case 'success':
        return 'btn btn-success btn-soft';
      case 'info':
        return 'btn btn-info btn-soft';
      case 'warning':
        return 'btn btn-warning btn-soft';
      case 'error':
        return 'btn btn-error btn-soft';
      default:
        return 'btn btn-error btn-soft';
    }
  });
}
