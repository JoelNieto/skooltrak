import { MONTH_NAMES, tuitionMonthsInRange } from '#/shared';
import { Button, Icon, UiField, UiInput, UiSelect } from '#/ui';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/**
 * The grade metric and financial settings a degree sets for its study plans, and a plan may
 * override (dashboard-backend study-plans/plan-settings.ts). On a plan, an empty field inherits
 * the degree's value.
 */
export interface PlanSettingsValue {
  /** '' = none (degree) or inherit (plan). */
  gradeMetricId: string;
  monthlyTuitionAmount: number | null;
  tuitionStartMonth: number | null;
  tuitionEndMonth: number | null;
  enrollmentCosts: { name: string; amount: number }[];
}

export const EMPTY_PLAN_SETTINGS: PlanSettingsValue = {
  gradeMetricId: '',
  monthlyTuitionAmount: null,
  tuitionStartMonth: null,
  tuitionEndMonth: null,
  enrollmentCosts: [],
};

/** The settings as the API returns them on a degree or plan (amounts arrive as decimal strings). */
export interface PlanSettingsRow {
  gradeMetricId?: string | null;
  gradeMetric?: { id: string; name: string } | null;
  monthlyTuitionAmount?: number | string | null;
  tuitionStartMonth?: number | null;
  tuitionEndMonth?: number | null;
  enrollmentCosts?: { name: string; amount: number | string; order?: number }[];
}

export function settingsFromRow(row: PlanSettingsRow | null | undefined): PlanSettingsValue {
  if (!row) return { ...EMPTY_PLAN_SETTINGS, enrollmentCosts: [] };
  return {
    gradeMetricId: row.gradeMetricId ?? '',
    monthlyTuitionAmount: row.monthlyTuitionAmount == null ? null : Number(row.monthlyTuitionAmount),
    tuitionStartMonth: row.tuitionStartMonth ?? null,
    tuitionEndMonth: row.tuitionEndMonth ?? null,
    enrollmentCosts: [...(row.enrollmentCosts ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({ name: c.name, amount: Number(c.amount) })),
  };
}

/** Whether a plan overrides any of its degree's settings (the form then opens its overrides). */
export function hasOverrides(value: PlanSettingsValue): boolean {
  return (
    !!value.gradeMetricId ||
    value.monthlyTuitionAmount != null ||
    value.tuitionStartMonth != null ||
    value.enrollmentCosts.length > 0
  );
}

/** A tuition period with one bound and not the other: the API refuses it. */
export function periodIncomplete(value: PlanSettingsValue): boolean {
  return (value.tuitionStartMonth == null) !== (value.tuitionEndMonth == null);
}

/** The request fields for the settings; financial ones only for finance managers. */
export function settingsPayload(value: PlanSettingsValue, withFinancial: boolean) {
  return {
    gradeMetricId: value.gradeMetricId || null,
    ...(withFinancial
      ? {
          monthlyTuitionAmount: value.monthlyTuitionAmount,
          tuitionStartMonth: value.tuitionStartMonth,
          tuitionEndMonth: value.tuitionEndMonth,
          enrollmentCosts: value.enrollmentCosts
            .filter((c) => c.name.trim())
            .map((c, order) => ({ name: c.name.trim(), amount: c.amount, order })),
        }
      : {}),
  };
}

/** "10 meses: Agosto → Mayo", or '' without a full period. */
export function periodLabel(start: number | null | undefined, end: number | null | undefined): string {
  const months = tuitionMonthsInRange(start, end);
  if (!months.length || start == null || end == null) return '';
  const count = months.length === 1 ? '1 mes' : `${months.length} meses`;
  return start === end ? `${count}: ${MONTH_NAMES[start]}` : `${count}: ${MONTH_NAMES[start]} → ${MONTH_NAMES[end]}`;
}

@Component({
  selector: 'app-plan-settings-fields',
  imports: [Button, Icon, UiField, UiInput, UiSelect, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <ui-field label="Métrica de calificaciones" [hint]="metricHint()">
        <select uiSelect [value]="value().gradeMetricId" (change)="set('gradeMetricId', selectValue($event))">
          <option value="">{{ inherited() ? 'Usar la del nivel' : 'Sin métrica' }}</option>
          @for (metric of metrics(); track metric.id) {
            <option [value]="metric.id" [selected]="metric.id === value().gradeMetricId">{{ metric.name }}</option>
          }
        </select>
      </ui-field>

      @if (financial()) {
        <section class="flex flex-col gap-4 border-t border-line pt-4">
          <h3 class="font-semibold">Configuración financiera</h3>
          <ui-field label="Colegiatura mensual" [hint]="amountHint()">
            <input
              uiInput
              type="number"
              step="0.01"
              min="0"
              [value]="value().monthlyTuitionAmount ?? ''"
              [placeholder]="amountPlaceholder()"
              (input)="set('monthlyTuitionAmount', numberValue($event))"
            />
          </ui-field>

          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-medium text-ink-strong mb-2">Periodo de colegiatura</legend>
            <div class="grid grid-cols-2 gap-4">
              <ui-field label="Desde" [error]="startError()">
                <select uiSelect (change)="set('tuitionStartMonth', monthValue($event))">
                  <option value="" [selected]="value().tuitionStartMonth === null">{{ emptyMonthLabel() }}</option>
                  @for (m of months; track m) {
                    <option [value]="m" [selected]="value().tuitionStartMonth === m">{{ monthNames[m] }}</option>
                  }
                </select>
              </ui-field>
              <ui-field label="Hasta" [error]="endError()">
                <select uiSelect (change)="set('tuitionEndMonth', monthValue($event))">
                  <option value="" [selected]="value().tuitionEndMonth === null">{{ emptyMonthLabel() }}</option>
                  @for (m of months; track m) {
                    <option [value]="m" [selected]="value().tuitionEndMonth === m">{{ monthNames[m] }}</option>
                  }
                </select>
              </ui-field>
            </div>
            <p class="text-xs text-ink-muted">{{ periodHint() }}</p>
          </fieldset>

          <fieldset>
            <legend class="text-sm font-medium text-ink-strong mb-2">Costos de matrícula</legend>
            @if (!value().enrollmentCosts.length && inherited()?.enrollmentCosts?.length) {
              <p class="text-xs text-ink-muted mb-2">
                Usa los del nivel:
                @for (cost of inherited()!.enrollmentCosts; track $index; let last = $last) {
                  {{ cost.name }} {{ cost.amount | number: '1.2-2' }}{{ last ? '' : ', ' }}
                }
              </p>
            }
            <div class="space-y-2">
              @for (cost of value().enrollmentCosts; track $index; let i = $index) {
                <div class="flex gap-2 items-end">
                  <input
                    uiInput
                    class="flex-1"
                    placeholder="Ej. Matrícula, Seguro"
                    [attr.aria-label]="'Concepto del costo ' + (i + 1)"
                    [value]="cost.name"
                    (input)="setCost(i, 'name', textValue($event))"
                  />
                  <input
                    uiInput
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-28!"
                    placeholder="0"
                    [attr.aria-label]="'Monto del costo ' + (i + 1)"
                    [value]="cost.amount"
                    (input)="setCost(i, 'amount', numberValue($event) ?? 0)"
                  />
                  <button
                    uiButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    [attr.aria-label]="'Quitar costo ' + (i + 1)"
                    (click)="removeCost(i)"
                  >
                    <ui-icon name="circle-minus" class="text-lg" />
                  </button>
                </div>
              }
            </div>
            <button uiButton variant="ghost" size="sm" type="button" class="mt-2" (click)="addCost()">
              <ui-icon name="circle-plus" class="text-lg" />
              {{ inherited() && !value().enrollmentCosts.length ? 'Usar costos propios' : 'Agregar costo' }}
            </button>
          </fieldset>
        </section>
      }
    </div>
  `,
})
export class PlanSettingsFields {
  readonly value = model.required<PlanSettingsValue>();
  readonly metrics = input<{ id: string; name: string }[]>([]);
  /** The degree's settings when editing a plan: empty fields then show and inherit them. */
  readonly inherited = input<(PlanSettingsValue & { metricName?: string | null }) | null>(null);
  /** Shows the tuition and enrollment cost fields (finance managers only). */
  readonly financial = input(true);

  protected readonly months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  protected readonly monthNames = MONTH_NAMES;

  protected readonly metricHint = computed(() => {
    const parent = this.inherited();
    if (!parent) return 'Las materias de los planes de este nivel la usan, salvo que el plan elija otra.';
    return parent.metricName ? `El nivel usa: ${parent.metricName}` : 'El nivel no tiene métrica.';
  });

  protected readonly amountHint = computed(() =>
    this.inherited() ? 'Vacío: usa la colegiatura del nivel.' : 'Vacío: sin colegiatura.',
  );

  protected readonly amountPlaceholder = computed(() => {
    const amount = this.inherited()?.monthlyTuitionAmount;
    return amount == null ? '0.00' : `Del nivel: ${amount.toFixed(2)}`;
  });

  protected readonly emptyMonthLabel = computed(() => (this.inherited() ? 'Del nivel' : '—'));

  protected readonly startError = computed(() =>
    this.value().tuitionStartMonth == null && this.value().tuitionEndMonth != null ? 'Elige el mes de inicio' : null,
  );
  protected readonly endError = computed(() =>
    this.value().tuitionEndMonth == null && this.value().tuitionStartMonth != null ? 'Elige el mes de fin' : null,
  );

  protected readonly periodHint = computed(() => {
    const v = this.value();
    if (v.tuitionStartMonth != null && v.tuitionEndMonth != null) {
      return `${periodLabel(v.tuitionStartMonth, v.tuitionEndMonth)}. Si termina antes del mes de inicio, sigue en el año siguiente.`;
    }
    const parent = this.inherited();
    if (parent && v.tuitionStartMonth == null && v.tuitionEndMonth == null) {
      const label = periodLabel(parent.tuitionStartMonth, parent.tuitionEndMonth);
      return label ? `Usa el del nivel (${label}).` : 'El nivel no tiene periodo de colegiatura.';
    }
    return 'Un cargo de colegiatura por cada mes del periodo.';
  });

  protected set<K extends keyof PlanSettingsValue>(key: K, val: PlanSettingsValue[K]) {
    this.value.update((v) => ({ ...v, [key]: val }));
  }

  protected setCost(i: number, key: 'name' | 'amount', val: string | number) {
    this.value.update((v) => ({
      ...v,
      enrollmentCosts: v.enrollmentCosts.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)),
    }));
  }

  protected addCost() {
    this.value.update((v) => ({ ...v, enrollmentCosts: [...v.enrollmentCosts, { name: '', amount: 0 }] }));
  }

  protected removeCost(i: number) {
    this.value.update((v) => ({ ...v, enrollmentCosts: v.enrollmentCosts.filter((_, idx) => idx !== i) }));
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected textValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected numberValue(event: Event): number | null {
    const n = (event.target as HTMLInputElement).valueAsNumber;
    return Number.isNaN(n) ? null : n;
  }

  protected monthValue(event: Event): number | null {
    const raw = (event.target as HTMLSelectElement).value;
    return raw ? Number(raw) : null;
  }
}
