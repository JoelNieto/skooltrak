import { Button, UiField, UiInput } from '#/ui';
import { Component, computed, input, output, signal } from '@angular/core';
import { isValidReason } from './gradebook-draft';

/**
 * Asks once for the reason covering every changed published score of a save (BR-ASM-001.8).
 * Closes with the reason, or `false` when cancelled.
 */
@Component({
  selector: 'app-gradebook-reason-dialog',
  imports: [Button, UiField, UiInput],
  template: `
    <form class="flex flex-col gap-4" (submit)="$event.preventDefault(); confirm()">
      <p class="text-sm text-ink">
        {{ data().count === 1 ? 'Cambias 1 nota publicada.' : 'Cambias ' + data().count + ' notas publicadas.' }}
        Los estudiantes y sus familias verán el cambio al guardar, y quedará en el historial de cada celda.
      </p>
      <ui-field label="Motivo del cambio" hint="Entre 3 y 300 caracteres." [error]="touched() && !valid() ? 'Indica el motivo del cambio' : null">
        <textarea uiInput rows="3" maxlength="300" [value]="reason()" (input)="reason.set($any($event.target).value)" (blur)="touched.set(true)"></textarea>
      </ui-field>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="!valid()">Guardar cambios</button>
      </div>
    </form>
  `,
})
export default class ReasonDialog {
  public readonly data = input.required<{ count: number }>();
  public readonly closeModal = output<string | false>();
  protected readonly reason = signal('');
  protected readonly touched = signal(false);
  protected readonly valid = computed(() => isValidReason(this.reason()));

  protected confirm(): void {
    this.touched.set(true);
    if (this.valid()) this.closeModal.emit(this.reason().trim());
  }
}
