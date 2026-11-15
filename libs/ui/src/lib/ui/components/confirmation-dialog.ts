import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DialogData } from '../types/dialog.type';
import { Button, ButtonVariant } from './button';

@Component({
  selector: 'lib-confirmation',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="my-4">{{ data().message }}</p>
    <div class="flex justify-end gap-2">
      @if (!data().hideCancel) {
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">
          {{ data().cancelText || 'Cancelar' }}
        </button>
      }
      <button uiButton [variant]="confirmVariant()" type="button" (click)="closeModal.emit(true)">
        {{ data().confirmText || 'Confirmar' }}
      </button>
    </div>`,
})
export class ConfirmationDialog {
  public data = input.required<DialogData>();
  public closeModal = output<boolean>();
  /** Destructive by default (no severity, or `error`); any other severity is a regular confirm. */
  public confirmVariant = computed<ButtonVariant>(() => {
    const severity = this.data().severity;
    return !severity || severity === 'error' ? 'danger' : 'primary';
  });
}
