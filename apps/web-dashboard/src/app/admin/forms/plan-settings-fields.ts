import { UiField, UiSelect } from '#/ui';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/**
 * The grade metric a degree sets for its study plans, and a plan may override
 * (dashboard-backend study-plans/plan-settings.ts). On a plan, an empty field inherits the
 * degree's value. Fees live in the finance catalog (FIN-001).
 */
export interface PlanSettingsValue {
  /** '' = none (degree) or inherit (plan). */
  gradeMetricId: string;
}

export const EMPTY_PLAN_SETTINGS: PlanSettingsValue = { gradeMetricId: '' };

/** The settings as the API returns them on a degree or plan. */
export interface PlanSettingsRow {
  gradeMetricId?: string | null;
  gradeMetric?: { id: string; name: string } | null;
}

export function settingsFromRow(row: PlanSettingsRow | null | undefined): PlanSettingsValue {
  return { gradeMetricId: row?.gradeMetricId ?? '' };
}

/** Whether a plan overrides any of its degree's settings (the form then opens its overrides). */
export function hasOverrides(value: PlanSettingsValue): boolean {
  return !!value.gradeMetricId;
}

/** The request fields for the settings. */
export function settingsPayload(value: PlanSettingsValue) {
  return { gradeMetricId: value.gradeMetricId || null };
}

@Component({
  selector: 'app-plan-settings-fields',
  imports: [UiField, UiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-field label="Métrica de calificaciones" [hint]="metricHint()">
      <select uiSelect [value]="value().gradeMetricId" (change)="setMetric($event)">
        <option value="">{{ inherited() ? 'Usar la del nivel' : 'Sin métrica' }}</option>
        @for (metric of metrics(); track metric.id) {
          <option [value]="metric.id" [selected]="metric.id === value().gradeMetricId">{{ metric.name }}</option>
        }
      </select>
    </ui-field>
  `,
})
export class PlanSettingsFields {
  readonly value = model.required<PlanSettingsValue>();
  readonly metrics = input<{ id: string; name: string }[]>([]);
  /** The degree's settings when editing a plan: empty fields then show and inherit them. */
  readonly inherited = input<(PlanSettingsValue & { metricName?: string | null }) | null>(null);

  protected readonly metricHint = computed(() => {
    const parent = this.inherited();
    if (!parent) return 'Las materias de los planes de este nivel la usan, salvo que el plan elija otra.';
    return parent.metricName ? `El nivel usa: ${parent.metricName}` : 'El nivel no tiene métrica.';
  });

  protected setMetric(event: Event) {
    const gradeMetricId = (event.target as HTMLSelectElement).value;
    this.value.update((v) => ({ ...v, gradeMetricId }));
  }
}
