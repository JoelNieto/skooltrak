import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { apiError, FeeItem, FeeTargets } from '../finance.types';

/**
 * "Asignar concepto" (FR-FIN-001.5): a fee item for a degree (all its study plans) or one study
 * plan, for a year. A plan's assignment replaces the degree's for the same item (BR-FIN-001.4).
 */
@Component({
  selector: 'app-finance-fee-assignment-form',
  imports: [Button, FormField, UiField, UiInput, UiSelect],
  template: `
    <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
      <p class="text-sm text-ink-muted">Año escolar {{ data().year }}</p>
      <ui-field label="Concepto" [field]="form.feeItemId">
        <select uiSelect [formField]="form.feeItemId">
          <option value="" disabled>Selecciona un concepto…</option>
          @for (i of activeItems(); track i.id) {
            <option [value]="i.id">{{ i.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field
        label="Aplica a"
        [field]="form.target"
        hint="Un plan de estudio reemplaza el monto del nivel para el mismo concepto."
      >
        <select uiSelect [formField]="form.target">
          <option value="" disabled>Selecciona un nivel o plan…</option>
          @for (d of data().targets.degrees; track d.id) {
            <optgroup [label]="d.name">
              <option [value]="'degree:' + d.id">Todo el nivel {{ d.name }}</option>
              @for (p of d.studyPlans; track p.id) {
                <option [value]="'plan:' + p.id">{{ p.name }}</option>
              }
            </optgroup>
          }
        </select>
      </ui-field>
      <ui-field label="Monto" [hint]="amountHint()">
        <input uiInput type="number" step="0.01" inputmode="decimal" placeholder="Monto del concepto" [formField]="form.amount" />
      </ui-field>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">Asignar</button>
      </div>
    </form>
  `,
})
export default class FeeAssignmentForm {
  readonly data = input.required<{ year: number; items: FeeItem[]; targets: FeeTargets }>();
  readonly closeModal = output<void>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  protected readonly saving = signal(false);
  protected readonly activeItems = computed(() => this.data().items.filter((i) => i.active));

  private model = signal({ feeItemId: '', target: '', amount: null as number | null });
  protected readonly form = form(this.model, (p) => {
    required(p.feeItemId, { message: 'Elige un concepto' });
    required(p.target, { message: 'Elige un nivel o plan' });
  });

  protected readonly amountHint = computed(() => {
    const item = this.activeItems().find((i) => i.id === this.form.feeItemId().value());
    return item ? `Déjalo vacío para cobrar ${item.amount.toFixed(2)}.` : 'Déjalo vacío para cobrar el monto del concepto.';
  });

  async onSubmit(event: Event) {
    event.preventDefault();
    const v = this.model();
    if (this.form().invalid()) {
      this.form.feeItemId().markAsTouched();
      this.form.target().markAsTouched();
      this.toast.showError('Elige el concepto y a qué aplica');
      return;
    }
    const [kind, id] = v.target.split(':');
    const amount = v.amount == null || Number.isNaN(v.amount) ? undefined : Number(v.amount);
    if (amount !== undefined && !(amount > 0)) {
      this.toast.showError('El monto debe ser mayor que cero');
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.http.post('/api/v1/finance/fee-assignments', {
          feeItemId: v.feeItemId,
          year: this.data().year,
          ...(kind === 'degree' ? { degreeId: id } : { studyPlanId: id }),
          ...(amount !== undefined ? { amountOverride: amount } : {}),
        }),
      );
      this.toast.showSuccess('Concepto asignado');
      this.closeModal.emit();
    } catch (err) {
      this.toast.showError(apiError(err, 'No se pudo asignar el concepto'));
    } finally {
      this.saving.set(false);
    }
  }
}
