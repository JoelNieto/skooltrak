import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { disabled, form, FormField, max, maxLength, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import Store from '../../core/store';
import { apiError, FEE_KIND_LABEL, FeeItem, FeeKind, FeeSchedule, MONTH_NAMES } from '../finance.types';

/**
 * "Nuevo concepto" / "Editar concepto" (FR-FIN-001.4). Once charges were generated from an item,
 * its kind and calendar are fixed: only the name, amount and active flag change, and never the
 * charges already created (BR-FIN-001.5).
 */
@Component({
  selector: 'app-finance-fee-item-form',
  imports: [Button, FormField, UiCheckbox, UiChoice, UiField, UiInput, UiSelect],
  template: `
    <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" placeholder="Ej.: Mensualidad" [formField]="form.name" />
      </ui-field>
      <div class="grid grid-cols-2 gap-4">
        <ui-field label="Tipo" [field]="form.kind">
          <select uiSelect [formField]="form.kind">
            @for (k of kinds; track k.value) {
              <option [value]="k.value">{{ k.label }}</option>
            }
          </select>
        </ui-field>
        <ui-field label="Monto" [field]="form.amount">
          <input uiInput type="number" step="0.01" inputmode="decimal" [formField]="form.amount" />
        </ui-field>
      </div>

      <ui-field label="Frecuencia" [field]="form.schedule">
        <select uiSelect [formField]="form.schedule">
          <option value="ONE_TIME">Único (una fecha)</option>
          <option value="MONTHLY">Mensual</option>
        </select>
      </ui-field>

      @if (form.schedule().value() === 'ONE_TIME') {
        <div class="grid grid-cols-2 gap-4">
          <ui-field label="Mes de vencimiento" [field]="form.dueMonth">
            <select uiSelect [formField]="form.dueMonth">
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </ui-field>
          <ui-field label="Día de vencimiento" [field]="form.dueDay">
            <input uiInput type="number" [formField]="form.dueDay" />
          </ui-field>
        </div>
      } @else {
        <div class="grid grid-cols-3 gap-4">
          <ui-field label="Desde" [field]="form.startMonth">
            <select uiSelect [formField]="form.startMonth">
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </ui-field>
          <ui-field label="Hasta" [field]="form.endMonth">
            <select uiSelect [formField]="form.endMonth">
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </ui-field>
          <ui-field label="Día de vencimiento" [field]="form.dueDay">
            <input uiInput type="number" [formField]="form.dueDay" />
          </ui-field>
        </div>
      }
      <p class="text-sm text-ink-muted -mt-2">
        Los meses se ubican en el año escolar del colegio. Si el mes tiene menos días, vence el último día.
      </p>

      @if (item()) {
        <ui-choice label="Activo" hint="Los conceptos inactivos no se asignan ni generan cargos.">
          <input uiCheckbox type="checkbox" [formField]="form.active" />
        </ui-choice>
      }
      @if (locked()) {
        <p class="text-sm text-ink-muted" role="note">
          Este concepto ya tiene cargos generados: su tipo y calendario no se pueden cambiar. Los cambios de nombre o monto
          no modifican los cargos existentes.
        </p>
      }

      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">{{ item() ? 'Guardar' : 'Crear concepto' }}</button>
      </div>
    </form>
  `,
})
export default class FeeItemForm implements OnInit {
  readonly data = input<{ item?: FeeItem }>();
  readonly closeModal = output<void>();

  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  protected readonly kinds = (Object.keys(FEE_KIND_LABEL) as FeeKind[]).map((value) => ({ value, label: FEE_KIND_LABEL[value] }));
  protected readonly months = MONTH_NAMES.map((label, i) => ({ value: String(i + 1), label }));
  protected readonly item = computed(() => this.data()?.item);
  protected readonly locked = computed(() => (this.item()?.chargeCount ?? 0) > 0);
  protected readonly saving = signal(false);

  private model = signal({
    name: '',
    kind: 'TUITION' as FeeKind,
    amount: 0,
    schedule: 'MONTHLY' as FeeSchedule,
    dueMonth: '3',
    startMonth: '3',
    endMonth: '12',
    dueDay: 5,
    active: true,
  });
  protected readonly form = form(this.model, (p) => {
    required(p.name, { message: 'Escribe el nombre' });
    maxLength(p.name, 120, { message: 'Máximo 120 caracteres' });
    required(p.amount, { message: 'Indica el monto' });
    min(p.amount, 0.01, { message: 'El monto debe ser mayor que cero' });
    min(p.dueDay, 1, { message: 'Entre 1 y 31' });
    max(p.dueDay, 31, { message: 'Entre 1 y 31' });
    const locked = () => this.locked();
    disabled(p.kind, locked);
    disabled(p.schedule, locked);
    disabled(p.dueMonth, locked);
    disabled(p.startMonth, locked);
    disabled(p.endMonth, locked);
    disabled(p.dueDay, locked);
  });

  ngOnInit() {
    const item = this.item();
    if (!item) return;
    this.model.set({
      name: item.name,
      kind: item.kind,
      amount: item.amount,
      schedule: item.schedule,
      dueMonth: String(item.dueMonth ?? 3),
      startMonth: String(item.startMonth ?? 3),
      endMonth: String(item.endMonth ?? 12),
      dueDay: item.dueDay,
      active: item.active,
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return;
    if (this.form().invalid()) {
      this.form.name().markAsTouched();
      this.form.amount().markAsTouched();
      this.toast.showError('Revisa los campos');
      return;
    }
    const v = this.model();
    const calendar =
      v.schedule === 'ONE_TIME'
        ? { schedule: v.schedule, dueMonth: Number(v.dueMonth), dueDay: Number(v.dueDay) }
        : { schedule: v.schedule, startMonth: Number(v.startMonth), endMonth: Number(v.endMonth), dueDay: Number(v.dueDay) };
    const item = this.item();
    this.saving.set(true);
    try {
      if (item) {
        const body = { name: v.name.trim(), amount: Number(v.amount), active: v.active, ...(this.locked() ? {} : { kind: v.kind, ...calendar }) };
        await firstValueFrom(this.http.patch(`/api/v1/finance/fee-items/${item.id}`, body));
        this.toast.showSuccess('Concepto actualizado');
      } else {
        await firstValueFrom(
          this.http.post('/api/v1/finance/fee-items', { schoolId, name: v.name.trim(), kind: v.kind, amount: Number(v.amount), ...calendar }),
        );
        this.toast.showSuccess('Concepto creado');
      }
      this.closeModal.emit();
    } catch (err) {
      this.toast.showError(apiError(err, 'No se pudo guardar el concepto'));
    } finally {
      this.saving.set(false);
    }
  }
}
