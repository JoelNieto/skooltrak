import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { applyEach, form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import Store from '../../core/store';

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

@Component({
  selector: 'app-study-plan-form',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, UiSelect, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
        <ui-field label="Nombre" [field]="form.name" class="md:col-span-2">
          <input uiInput type="text" [formField]="form.name" />
        </ui-field>
        <ui-field label="Nombre corto" [field]="form.shortName">
          <input uiInput type="text" [formField]="form.shortName" />
        </ui-field>
        <ui-field label="Grado" [field]="form.level">
          <input uiInput type="number" [formField]="form.level" />
        </ui-field>

        <ui-field label="Nivel" [field]="form.degreeId">
          <select uiSelect [formField]="form.degreeId">
            <option value="" disabled>Selecciona nivel...</option>
            @for (degree of degrees.value(); track degree.id) {
              <option [value]="degree.id">
                {{ degree.name }}
              </option>
            }
          </select>
        </ui-field>
        <ui-field label="Metrica de calificaciones" [field]="form.gradeMetricId">
          <select uiSelect [formField]="form.gradeMetricId">
            <option value="" disabled>Selecciona metrica...</option>
            @for (metric of metrics.value(); track metric.id) {
              <option [value]="metric.id">
                {{ metric.name }}
              </option>
            }
          </select>
        </ui-field>
        <ui-field label="Descripción" [field]="form.description" class="md:col-span-4">
          <textarea uiInput [formField]="form.description"></textarea>
        </ui-field>

        <div class="fieldset md:col-span-4 border-t border-base-300 pt-4 mt-2">
          <h3 class="font-semibold mb-2">Configuración financiera</h3>
          <div class="flex flex-col gap-4">
            <div class="fieldset">
              <label for="monthlyTuitionAmount">Colegiatura mensual</label>
              <input uiInput type="number" step="0.01" [formField]="form.monthlyTuitionAmount" placeholder="0.00" />
            </div>
            <div class="fieldset">
              <label for="tuitionMonths">Meses de colegiatura</label>
              <div class="flex flex-wrap gap-2">
                @for (m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track m) {
                  <ui-choice label="{{ monthLabel(m) }}" class="flex! border border-primary rounded-lg px-3 py-2">
                    <input
                      uiCheckbox
                      tone="neutral"
                      size="sm"
                      type="checkbox"
                      [value]="m"
                      [checked]="form.tuitionMonths().value().includes(m)"
                      (change)="toggleTuitionMonth(m, $event)"
                    />
                  </ui-choice>
                }
              </div>
            </div>
            <div class="fieldset">
              <label for="enrollmentCosts">Costos de matrícula</label>
              <div class="space-y-2">
                @for (item of form.enrollmentCosts; track $index; let i = $index) {
                  <div class="flex gap-2 items-end">
                    <input uiInput [formField]="item.name" class="flex-1" placeholder="Ej. Matrícula, Seguro" />
                    <input uiInput [formField]="item.amount" type="number" step="0.01" class="w-24!" placeholder="0" />
                    <button uiButton variant="ghost" size="sm" type="button" (click)="removeEnrollmentCost(i)">
                      <span class="material-symbols-outlined text-lg">remove_circle</span>
                    </button>
                  </div>
                }
              </div>
              <button uiButton variant="ghost" size="sm" type="button" class="mt-2" (click)="addEnrollmentCost()">
                <span class="material-symbols-outlined text-lg">add_circle</span> Agregar costo
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit">Guardar</button>
      </div>
    </form>
  `,
})
export default class StudyPlanForm {
  public data = input<{
    studyPlan?: Prisma.StudyPlanGetPayload<{
      include: { degree: true; school: true };
    }>;
  }>();

  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);
  public metrics = httpResource<{ id: string; name: string }[]>(() => '/api/v1/grade-metrics');

  public degrees = httpResource<{ id: string; name: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/degrees/by-school`,
      params: { schoolId },
    };
  });

  public formModel = signal<{
    name: string;
    shortName: string;
    description: string;
    level: number;
    gradeMetricId: string;
    degreeId: string;
    monthlyTuitionAmount: number | null;
    tuitionMonths: number[];
    enrollmentCosts: { name: string; amount: number; order: number }[];
  }>({
    name: '',
    shortName: '',
    description: '',
    level: 0,
    degreeId: '',
    gradeMetricId: '',
    monthlyTuitionAmount: null,
    tuitionMonths: [],
    enrollmentCosts: [],
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto requerido' });
    required(schemaPath.degreeId, { message: 'Nombre corto requerido' });
    required(schemaPath.gradeMetricId, { message: 'Nombre corto requerido' });
    required(schemaPath.level, { message: 'Nombre corto requerido' });
    applyEach(schemaPath.enrollmentCosts, (costPath) => {
      required(costPath.name);
      required(costPath.amount);
    });
  });

  monthLabel(m: number) {
    return MONTH_LABELS[m] ?? m;
  }

  addEnrollmentCost() {
    this.formModel.update((current) => ({
      ...current,
      enrollmentCosts: [...current.enrollmentCosts, { name: '', amount: 0, order: 0 }],
    }));
  }

  removeEnrollmentCost(i: number) {
    this.formModel.update((current) => ({
      ...current,
      enrollmentCosts: current.enrollmentCosts.filter((_, idx) => idx !== i),
    }));
  }

  toggleTuitionMonth(m: number, ev: Event) {
    const arr = this.formModel().tuitionMonths;
    const idx = arr.indexOf(m);
    if ((ev.target as HTMLInputElement).checked) {
      if (idx === -1) arr.push(m);
    } else {
      if (idx >= 0) arr.splice(idx, 1);
    }
    arr.sort((a, b) => a - b);
    this.form.tuitionMonths().value.set(arr);
  }

  private populatedPlanId = signal<string | null>(null);

  constructor() {
    afterRenderEffect(() => {
      const plan = this.data()?.studyPlan;
      if (plan && this.populatedPlanId() !== plan.id) {
        this.populatedPlanId.set(plan.id);
        const { enrollmentCosts, ...rest } = plan as {
          enrollmentCosts?: { name: string; amount: unknown; order: number }[];
          [k: string]: unknown;
        };
        const patch: Record<string, unknown> = { ...rest };
        if ('monthlyTuitionAmount' in plan && plan.monthlyTuitionAmount != null) {
          patch['monthlyTuitionAmount'] = Number(plan.monthlyTuitionAmount);
        }
        if ('tuitionMonths' in plan && Array.isArray(plan.tuitionMonths)) {
          patch['tuitionMonths'] = plan.tuitionMonths;
        }
        const sortedCosts =
          enrollmentCosts && Array.isArray(enrollmentCosts)
            ? [...enrollmentCosts]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((c, i) => ({ name: c.name, amount: Number(c.amount), order: i }))
            : [];
        this.formModel.set({ ...(patch as any), enrollmentCosts: sortedCosts });
      }
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const request = this.formModel();
    const plan = this.data()?.studyPlan;
    const schoolId = this.store.currentSchoolId();

    const saveFinancial = async (studyPlanId: string) => {
      if (
        !plan &&
        !request.monthlyTuitionAmount &&
        !request.tuitionMonths?.length &&
        (!request.enrollmentCosts?.length || request.enrollmentCosts.length === 0)
      )
        return;
      const costs = (request.enrollmentCosts ?? []).map(
        (c: { name: string; amount: number; order: number }, i: number) => ({
          name: c.name,
          amount: c.amount,
          order: i,
        }),
      );
      await firstValueFrom(
        this.http.post('/api/v1/financial/study-plan-config', {
          studyPlanId,
          monthlyTuitionAmount: request.monthlyTuitionAmount ?? undefined,
          tuitionMonths: request.tuitionMonths ?? [],
          enrollmentCosts: costs,
        }),
      );
    };

    try {
      if (plan) {
        await firstValueFrom(
          this.http.patch('/api/v1/study-plans', {
            id: plan.id,
            name: request.name,
            shortName: request.shortName,
            description: request.description,
            level: request.level,
            degreeId: request.degreeId,
            gradeMetricId: request.gradeMetricId,
          }),
        );
        await saveFinancial(plan.id);
        this.toast.showSuccess('Plan de estudio actualizado exitosamente');
        this.closeModal.emit();
      } else if (schoolId) {
        const created = await firstValueFrom(
          this.http.post<{ id: string }>('/api/v1/study-plans', {
            name: request.name,
            shortName: request.shortName,
            description: request.description,
            level: request.level,
            degreeId: request.degreeId,
            gradeMetricId: request.gradeMetricId,
            schoolId,
          }),
        );
        await saveFinancial(created.id);
        this.toast.showSuccess('Plan de estudio creado exitosamente');
        this.closeModal.emit();
      }
    } catch (err: unknown) {
      this.toast.showError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }
}
