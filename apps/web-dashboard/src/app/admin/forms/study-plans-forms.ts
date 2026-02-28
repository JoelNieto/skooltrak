import { Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of, switchMap } from 'rxjs';
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
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);
  public metrics = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          gradeMetrics: Prisma.GradeMetricGetPayload<{ include: undefined }>[];
        }>({
          query: gql`
            query GetGradeMetrics {
              gradeMetrics {
                id
                name
              }
            }
          `,
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data?.gradeMetrics ?? [])),
  });
  public degrees = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          degreesBySchoolId: Prisma.DegreeGetPayload<{
            include: { school: true };
          }>[];
        }>({
          query: gql`
            query DegreesBySchoolId($schoolId: String!) {
              degreesBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data?.degreesBySchoolId ?? []));
    },
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    description: ['', []],
    level: [0, [Validators.required]],
    degreeId: ['', [Validators.required]],
    gradeMetricId: this.fb.control<string | null>('', [Validators.required]),
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

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const request = this.form.getRawValue();
    const plan = this.data()?.studyPlan;
    const schoolId = this.store.currentSchoolId();

    const saveFinancial = (studyPlanId: string) => {
      if (
        !plan &&
        !request.monthlyTuitionAmount &&
        !request.tuitionMonths?.length &&
        (!request.enrollmentCosts?.length || request.enrollmentCosts.length === 0)
      )
        return Promise.resolve();
      const costs = (request.enrollmentCosts ?? []).map(
        (c: { name: string; amount: number; order: number }, i: number) => ({
          name: c.name,
          amount: c.amount,
          order: i,
        }),
      );
      return this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateStudyPlanFinancialConfig($input: UpdateStudyPlanFinancialInput!) {
              updateStudyPlanFinancialConfig(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              studyPlanId,
              monthlyTuitionAmount: request.monthlyTuitionAmount ?? undefined,
              tuitionMonths: request.tuitionMonths?.length ? request.tuitionMonths : undefined,
              enrollmentCosts: costs.length ? costs : undefined,
            },
          },
        })
        .toPromise();
    };

    if (plan) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateStudyPlan($updateStudyPlanInput: UpdateStudyPlanInput!) {
              updateStudyPlan(updateStudyPlanInput: $updateStudyPlanInput) {
                id
                name
              }
            }
          `,
          variables: {
            updateStudyPlanInput: {
              name: request.name,
              shortName: request.shortName,
              description: request.description,
              level: request.level,
              degreeId: request.degreeId,
              gradeMetricId: request.gradeMetricId,
              id: plan.id,
            },
          },
        })
        .pipe(switchMap(() => saveFinancial(plan.id)))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Plan de estudio actualizado exitosamente');
            this.closeModal.emit();
          },
          error: (err) => this.toast.showError(err?.message ?? 'Error al actualizar'),
        });
    } else if (schoolId) {
      this.apollo
        .mutate<{ createStudyPlan: { id: string } }>({
          mutation: gql`
            mutation CreateStudyPlan($createStudyPlanInput: CreateStudyPlanInput!) {
              createStudyPlan(createStudyPlanInput: $createStudyPlanInput) {
                id
                name
              }
            }
          `,
          variables: {
            createStudyPlanInput: {
              name: request.name,
              shortName: request.shortName,
              description: request.description,
              level: request.level,
              degreeId: request.degreeId,
              gradeMetricId: request.gradeMetricId,
              schoolId,
            },
          },
        })
        .pipe(
          switchMap((res) => {
            const id = res.data?.createStudyPlan?.id;
            return id ? saveFinancial(id).then(() => res) : Promise.resolve(res);
          }),
        )
        .subscribe({
          next: () => {
            this.toast.showSuccess('Plan de estudio creado exitosamente');
            this.closeModal.emit();
          },
          error: (err) => this.toast.showError(err?.message ?? 'Error al crear'),
        });
    }
  }
}
