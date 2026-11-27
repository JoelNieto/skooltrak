import { Button, Toast, UiField, UiInput } from '#/ui';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiError } from './finance.types';

export interface ReasonDialogData {
  message: string;
  confirmText: string;
  /** Sends the reason; a rejection keeps the dialog open and shows the API's message. */
  submit: (reason: string) => Promise<void>;
  [key: string]: unknown;
}

/**
 * Asks for the mandatory reason of an irreversible finance action: voiding a payment
 * (FR-FIN-001.16) or cancelling a charge (FR-FIN-001.8).
 */
@Component({
  selector: 'app-finance-reason-dialog',
  imports: [Button, FormsModule, UiField, UiInput],
  template: `
    <form class="flex flex-col gap-4" (submit)="confirm($event)">
      <p class="text-ink-muted">{{ data().message }}</p>
      <ui-field label="Motivo">
        <textarea uiInput name="reason" rows="3" maxlength="500" [ngModel]="reason()" (ngModelChange)="reason.set($event)"></textarea>
      </ui-field>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Volver</button>
        <button uiButton variant="danger" type="submit" [disabled]="saving() || !reason().trim()">{{ data().confirmText }}</button>
      </div>
    </form>
  `,
})
export default class ReasonDialog {
  readonly data = input.required<ReasonDialogData>();
  readonly closeModal = output<void>();

  private toast = inject(Toast);
  protected readonly reason = signal('');
  protected readonly saving = signal(false);

  async confirm(event: Event) {
    event.preventDefault();
    const reason = this.reason().trim();
    if (!reason || this.saving()) return;
    this.saving.set(true);
    try {
      await this.data().submit(reason);
      this.closeModal.emit();
    } catch (err) {
      this.toast.showError(apiError(err, 'No se pudo completar la acción'));
    } finally {
      this.saving.set(false);
    }
  }
}
