import { suggestedPlanName, suggestedPlanShortName } from '#/shared';
import { Alert, Button, Icon, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import Auth from '../../auth/auth';
import Store from '../../core/store';
import {
  EMPTY_PLAN_SETTINGS,
  hasOverrides,
  periodIncomplete,
  periodLabel,
  PlanSettingsFields,
  PlanSettingsRow,
  PlanSettingsValue,
  settingsFromRow,
  settingsPayload,
} from './plan-settings-fields';

/** A degree as GET /degrees/by-school returns it: the settings its plans inherit, its top grade. */
export type DegreeOption = { id: string; name: string; shortName: string } & PlanSettingsRow & {
    studyPlans?: { level: number }[];
  };

export type StudyPlanFormRow = {
  id: string;
  name: string;
  shortName: string;
  level: number;
  description?: string;
  degreeId: string;
} & PlanSettingsRow;

/** The grade after the degree's highest one (1 for a degree without plans). */
export function nextLevel(degree: DegreeOption | undefined): number {
  return (degree?.studyPlans?.[0]?.level ?? 0) + 1;
}

/**
 * A study plan: its degree, grade and names. The grade and names are suggested from the degree
 * ("3° Primaria"); the grade metric and financial settings come from the degree unless the plan
 * overrides them under "Personalizar este plan".
 */
@Component({
  selector: 'app-study-plan-form',
  imports: [Alert, UiField, UiInput, UiSelect, Button, FormField, Icon, PlanSettingsFields, DecimalPipe],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
        <ui-field label="Nivel" [field]="form.degreeId" class="md:col-span-3">
          <select uiSelect [formField]="form.degreeId">
            <option value="" disabled>Selecciona nivel...</option>
            @for (degree of degrees.value(); track degree.id) {
              <option [value]="degree.id">{{ degree.name }}</option>
            }
          </select>
        </ui-field>
        <ui-field label="Grado" [field]="form.level">
          <input uiInput type="number" [formField]="form.level" (input)="levelEdited.set(true)" />
        </ui-field>
        <ui-field label="Nombre" [field]="form.name" class="md:col-span-3">
          <input uiInput type="text" [formField]="form.name" (input)="nameEdited.set(true)" />
        </ui-field>
        <ui-field label="Nombre corto" [field]="form.shortName">
          <input uiInput type="text" [formField]="form.shortName" (input)="shortNameEdited.set(true)" />
        </ui-field>

        @if (selectedDegree(); as degree) {
          <div uiAlert tone="info" class="md:col-span-4 text-sm items-start" data-testid="inherited-summary">
            <ui-icon name="info" class="text-base mt-0.5" />
            <div>
              <p>
                @if (customized()) {
                  Configuración del plan (lo no personalizado viene del nivel {{ degree.name }}):
                } @else {
                  Usa la configuración del nivel {{ degree.name }}:
                }
              </p>
              <ul class="mt-1 space-y-0.5">
                <li>Métrica: {{ effectiveMetricName() ?? 'sin métrica' }}</li>
                @if (canManageFinancials) {
                  <li>
                    Colegiatura:
                    @if (effective().monthlyTuitionAmount !== null) {
                      {{ effective().monthlyTuitionAmount | number: '1.2-2' }}
                      {{ effectivePeriod() ? '· ' + effectivePeriod() : '· sin periodo' }}
                    } @else {
                      sin colegiatura
                    }
                  </li>
                  <li>
                    Matrícula:
                    {{ effective().enrollmentCosts.length ? effective().enrollmentCosts.length + ' costo(s)' : 'sin costos' }}
                  </li>
                }
              </ul>
              @if (!effectiveMetricName()) {
                <p class="text-warning mt-1">Sin métrica, las materias del plan no pueden calificarse.</p>
              }
            </div>
          </div>
        }

        <details class="md:col-span-4 border-t border-line pt-4 mt-2 group" [open]="overridesOpen()">
          <summary class="cursor-pointer font-semibold flex items-center gap-2 list-none">
            <ui-icon name="chevron-right" class="text-base transition-transform group-open:rotate-90" />
            Personalizar este plan
          </summary>
          <div class="flex flex-col gap-4 mt-4">
            <ui-field label="Descripción" [field]="form.description">
              <textarea uiInput [formField]="form.description"></textarea>
            </ui-field>
            <app-plan-settings-fields
              [(value)]="settings"
              [metrics]="metrics.value()"
              [inherited]="inherited()"
              [financial]="canManageFinancials"
            />
          </div>
        </details>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">Guardar</button>
      </div>
    </form>
  `,
})
export default class StudyPlanForm {
  public data = input<{ studyPlan?: StudyPlanFormRow; degreeId?: string }>();

  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);
  protected readonly canManageFinancials = inject(Auth).hasPermission('MANAGE_FINANCIALS');
  public metrics = httpResource<{ id: string; name: string }[]>(() => '/api/v1/grade-metrics', { defaultValue: [] });

  public degrees = httpResource<DegreeOption[]>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return { url: `/api/v1/degrees/by-school`, params: { schoolId } };
    },
    { defaultValue: [] },
  );

  public formModel = signal({ name: '', shortName: '', description: '', level: 1, degreeId: '' });
  protected readonly settings = signal<PlanSettingsValue>({ ...EMPTY_PLAN_SETTINGS });
  protected readonly saving = signal(false);
  protected readonly overridesOpen = signal(false);

  /** Set once the user types in the field: suggestions stop overwriting it. */
  protected readonly levelEdited = signal(false);
  protected readonly nameEdited = signal(false);
  protected readonly shortNameEdited = signal(false);

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.degreeId, { message: 'Nivel requerido' });
    required(schemaPath.level, { message: 'Grado requerido' });
    min(schemaPath.level, 0, { message: 'El grado no puede ser negativo' });
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto requerido' });
  });

  protected readonly selectedDegree = computed(() =>
    this.degrees.value().find((d) => d.id === this.form.degreeId().value()),
  );

  /** The degree's settings, shown as what the plan's empty fields inherit. */
  protected readonly inherited = computed(() => {
    const degree = this.selectedDegree();
    if (!degree) return null;
    return { ...settingsFromRow(degree), metricName: degree.gradeMetric?.name ?? null };
  });

  /** The settings the plan ends up with: its overrides, else the degree's. */
  protected readonly effective = computed(() => {
    const own = this.settings();
    const parent = this.inherited() ?? EMPTY_PLAN_SETTINGS;
    const ownPeriod = own.tuitionStartMonth != null;
    return {
      monthlyTuitionAmount: own.monthlyTuitionAmount ?? parent.monthlyTuitionAmount,
      tuitionStartMonth: ownPeriod ? own.tuitionStartMonth : parent.tuitionStartMonth,
      tuitionEndMonth: ownPeriod ? own.tuitionEndMonth : parent.tuitionEndMonth,
      enrollmentCosts: own.enrollmentCosts.length ? own.enrollmentCosts : parent.enrollmentCosts,
    };
  });

  protected readonly customized = computed(() => hasOverrides(this.settings()));

  protected readonly effectiveMetricName = computed(() => {
    const own = this.settings().gradeMetricId;
    if (own) return this.metrics.value().find((m) => m.id === own)?.name ?? null;
    return this.inherited()?.metricName ?? null;
  });

  protected readonly effectivePeriod = computed(() =>
    periodLabel(this.effective().tuitionStartMonth, this.effective().tuitionEndMonth),
  );

  private populatedPlanId: string | null = null;

  constructor() {
    // Editing: load the plan once.
    afterRenderEffect(() => {
      const plan = this.data()?.studyPlan;
      if (plan && this.populatedPlanId !== plan.id) {
        this.populatedPlanId = plan.id;
        this.formModel.set({
          name: plan.name,
          shortName: plan.shortName,
          description: plan.description ?? '',
          level: plan.level,
          degreeId: plan.degreeId,
        });
        const settings = settingsFromRow(plan);
        this.settings.set(settings);
        this.overridesOpen.set(hasOverrides(settings) || !!plan.description);
      }
    });

    // Creating: start on the degree the list is filtered by.
    effect(() => {
      const degreeId = this.data()?.degreeId;
      if (degreeId && !this.data()?.studyPlan) untracked(() => this.form.degreeId().value.set(degreeId));
    });

    // Creating: picking a degree suggests its next grade...
    effect(() => {
      const degree = this.selectedDegree();
      if (!degree || this.data()?.studyPlan) return;
      untracked(() => {
        if (!this.levelEdited()) this.form.level().value.set(nextLevel(degree));
      });
    });

    // ...and the grade and degree suggest the names ("3° Primaria", "3° P").
    effect(() => {
      const degree = this.selectedDegree();
      const level = Number(this.form.level().value());
      if (!degree || this.data()?.studyPlan || !Number.isFinite(level)) return;
      untracked(() => {
        if (!this.nameEdited()) this.form.name().value.set(suggestedPlanName(level, degree.name));
        if (!this.shortNameEdited()) this.form.shortName().value.set(suggestedPlanShortName(level, degree.shortName));
      });
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.degreeId().markAsTouched();
      this.form.level().markAsTouched();
      this.form.name().markAsTouched();
      this.form.shortName().markAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    if (periodIncomplete(this.settings())) {
      this.overridesOpen.set(true);
      this.toast.showError('El periodo de colegiatura necesita un mes de inicio y uno de fin');
      return;
    }
    const plan = this.data()?.studyPlan;
    const schoolId = this.store.currentSchoolId();
    if (!plan && !schoolId) return;

    const { name, shortName, description, level, degreeId } = this.formModel();
    const body = {
      name,
      shortName,
      description,
      level: Number(level),
      degreeId,
      ...settingsPayload(this.settings(), this.canManageFinancials),
    };

    this.saving.set(true);
    try {
      if (plan) {
        await firstValueFrom(this.http.patch('/api/v1/study-plans', { ...body, id: plan.id }));
        this.toast.showSuccess('Plan de estudio actualizado exitosamente');
      } else {
        await firstValueFrom(this.http.post('/api/v1/study-plans', { ...body, schoolId }));
        this.toast.showSuccess('Plan de estudio creado exitosamente');
      }
      this.closeModal.emit();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.toast.showError(message ?? (err instanceof Error ? err.message : 'Error al guardar'));
    } finally {
      this.saving.set(false);
    }
  }
}
