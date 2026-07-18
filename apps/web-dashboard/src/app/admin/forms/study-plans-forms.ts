import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, OnInit, output, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
        <div class="fieldset md:col-span-2">
          <label for="name">Nombre</label>
          <input type="text" formControlName="name" class="input input-primary" />
        </div>
        <div class="fieldset">
          <label for="shortName">Nombre corto</label>
          <input type="text" formControlName="shortName" class="input input-primary" />
        </div>
        <div class="fieldset">
          <label for="level">Grado</label>
          <input type="number" formControlName="level" class="input input-primary" />
        </div>

        <div class="fieldset">
          <label for="degreeId">Nivel</label>
          <select formControlName="degreeId" class="select select-primary">
            <option value="" disabled>Selecciona nivel...</option>
            @for (degree of degrees.value(); track degree.id) {
              <option [value]="degree.id">
                {{ degree.name }}
              </option>
            }
          </select>
        </div>
        <div class="fieldset">
          <label for="gradeMetricId">Metrica de calificaciones</label>
          <select formControlName="gradeMetricId" class="select select-primary">
            <option value="" disabled>Selecciona metrica...</option>
            @for (metric of metrics.value(); track metric.id) {
              <option [value]="metric.id">
                {{ metric.name }}
              </option>
            }
          </select>
        </div>
        <div class="fieldset md:col-span-4">
          <label for="description">Descripción</label>
          <textarea formControlName="description" class="textarea textarea-primary w-full"></textarea>
        </div>

        <div class="fieldset md:col-span-4 border-t border-base-300 pt-4 mt-2">
          <h3 class="font-semibold mb-2">Configuración financiera</h3>
          <div class="flex flex-col gap-4">
            <div class="fieldset">
              <label for="monthlyTuitionAmount">Colegiatura mensual</label>
              <input
                type="number"
                step="0.01"
                min="0"
                formControlName="monthlyTuitionAmount"
                class="input input-primary"
                placeholder="0.00"
              />
            </div>
            <div class="fieldset">
              <label for="tuitionMonths">Meses de colegiatura</label>
              <div class="flex flex-wrap gap-2">
                @for (m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track m) {
                  <label
                    class="label cursor-pointer flex! items-center gap-2 border border-primary rounded-lg px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      [value]="m"
                      [checked]="tuitionMonthsArray().includes(m)"
                      (change)="toggleTuitionMonth(m, $event)"
                      class="checkbox checkbox-sm"
                    />
                    <span class="text-sm">{{ monthLabel(m) }}</span>
                  </label>
                }
              </div>
            </div>
            <div class="fieldset">
              <label for="enrollmentCosts">Costos de matrícula</label>
              <div formArrayName="enrollmentCosts" class="space-y-2">
                @for (item of enrollmentCostsArray().controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="flex gap-2 items-end">
                    <input
                      formControlName="name"
                      class="input input-primary flex-1"
                      placeholder="Ej. Matrícula, Seguro"
                    />
                    <input
                      formControlName="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="input input-primary w-24!"
                      placeholder="0"
                    />
                    <button type="button" class="btn btn-ghost btn-sm" (click)="removeEnrollmentCost(i)">
                      <span class="material-symbols-outlined text-lg">remove_circle</span>
                    </button>
                  </div>
                }
              </div>
              <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="addEnrollmentCost()">
                <span class="material-symbols-outlined text-lg">add_circle</span> Agregar costo
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `,
})
export default class StudyPlanForm implements OnInit {
  public data = input<{
    studyPlan?: Prisma.StudyPlanGetPayload<{
      include: { degree: true; school: true };
    }>;
  }>();

  public closeModal = output<void>();
  private fb = inject(NonNullableFormBuilder);
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

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    description: ['', []],
    level: [0, [Validators.required]],
    degreeId: ['', [Validators.required]],
    gradeMetricId: this.fb.control<string>('', [Validators.required]),
    monthlyTuitionAmount: this.fb.control<number | null>(null),
    tuitionMonths: this.fb.control<number[]>([], []),
    enrollmentCosts: this.fb.array([]) as FormArray,
  });

  enrollmentCostsArray() {
    return this.form.get('enrollmentCosts') as FormArray;
  }

  tuitionMonthsArray() {
    return this.form.get('tuitionMonths')?.value ?? [];
  }

  monthLabel(m: number) {
    return MONTH_LABELS[m] ?? m;
  }

  addEnrollmentCost() {
    (this.form.get('enrollmentCosts') as FormArray).push(
      this.fb.group({
        name: ['', Validators.required],
        amount: [0, [Validators.required, Validators.min(0)]],
        order: [0],
      }),
    );
  }

  removeEnrollmentCost(i: number) {
    (this.form.get('enrollmentCosts') as FormArray).removeAt(i);
  }

  toggleTuitionMonth(m: number, ev: Event) {
    const arr = [...(this.form.get('tuitionMonths')?.value ?? [])];
    const idx = arr.indexOf(m);
    if ((ev.target as HTMLInputElement).checked) {
      if (idx === -1) arr.push(m);
    } else {
      if (idx >= 0) arr.splice(idx, 1);
    }
    arr.sort((a, b) => a - b);
    this.form.get('tuitionMonths')?.setValue(arr);
  }

  ngOnInit(): void {
    const plan = this.data()?.studyPlan;
    if (plan) {
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
      this.form.patchValue(patch);
      if (enrollmentCosts && Array.isArray(enrollmentCosts)) {
        const arr = this.form.get('enrollmentCosts') as FormArray;
        arr.clear();
        [...enrollmentCosts]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((c, i) => {
            arr.push(
              this.fb.group({
                name: [c.name, Validators.required],
                amount: [Number(c.amount), [Validators.required, Validators.min(0)]],
                order: [i],
              }),
            );
          });
      }
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const request = this.form.getRawValue();
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
          tuitionMonths: request.tuitionMonths?.length ? request.tuitionMonths : undefined,
          enrollmentCosts: costs.length ? costs : undefined,
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
