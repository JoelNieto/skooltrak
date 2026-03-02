import { Toast } from '@/ui';
import { Component, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import type { CreateChargeInput } from '../../graphql/generated/graphql';
import {
  CreateChargeFormCreateChargeDocument,
  CreateChargeFormStudentsBySchoolIdDocument,
  CreateChargeFormStudyPlansBySchoolIdDocument,
} from '../../graphql/generated/graphql';

@Component({
  selector: 'app-create-charge-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col gap-4">
        <div class="fieldset">
          <label for="targetType">Objetivo</label>
          <select formControlName="targetType" class="select select-primary w-full">
            <option value="student">Estudiante</option>
            <option value="studyPlan">Plan de estudio</option>
          </select>
        </div>
        @if (targetType === 'student') {
          <div class="fieldset">
            <label for="studentId">Estudiante</label>
            <select formControlName="studentId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar estudiante...</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </div>
        }
        @if (targetType === 'studyPlan') {
          <div class="fieldset">
            <label for="studyPlanId">Plan de estudio</label>
            <select formControlName="studyPlanId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar plan...</option>
              @for (sp of studyPlans.value(); track sp.id) {
                <option [value]="sp.id">{{ sp.name }}</option>
              }
            </select>
          </div>
        }
        <div class="fieldset">
          <label for="amount">Monto</label>
          <input type="number" step="0.01" min="0" formControlName="amount" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label for="dueDate">Fecha de vencimiento</label>
          <input type="date" formControlName="dueDate" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label for="description">Descripción (opcional)</label>
          <input
            type="text"
            formControlName="description"
            class="input input-primary w-full"
            placeholder="Ej. Colegiatura Septiembre"
          />
        </div>
        <div class="fieldset">
          <label for="chargeType">Tipo</label>
          <select formControlName="chargeType" class="select select-primary w-full">
            <option value="CUSTOM">Personalizado</option>
            <option value="TUITION">Colegiatura</option>
            <option value="ENROLLMENT">Matrícula</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Crear cargo</button>
      </div>
    </form>
  `,
})
export default class CreateChargeForm {
  public closeModal = output<void>();
  private fb = inject(NonNullableFormBuilder);

  get targetType(): 'student' | 'studyPlan' {
    const v = this.form.get('targetType')?.value as string | undefined;
    return v === 'studyPlan' ? 'studyPlan' : 'student';
  }
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);

  public students = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery({
          query: CreateChargeFormStudentsBySchoolIdDocument,
          variables: { schoolId: params.schoolId },
        })
        .valueChanges.pipe(map((r) => r.data?.studentsBySchoolId ?? []));
    },
  });

  public studyPlans = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery({
          query: CreateChargeFormStudyPlansBySchoolIdDocument,
          variables: { schoolId: params.schoolId },
        })
        .valueChanges.pipe(map((r) => r.data?.studyPlansBySchoolId ?? []));
    },
  });

  public form = this.fb.group({
    targetType: ['student' as const],
    studentId: [''],
    studyPlanId: [''],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    dueDate: ['', Validators.required],
    description: [''],
    chargeType: ['CUSTOM' as const],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showError('Completa los campos requeridos');
      return;
    }
    const v = this.form.getRawValue();
    const schoolId = this.store.currentSchoolId();
    const school = this.store.currentSchool();
    if (!schoolId || !school) {
      this.toast.showError('No hay escuela seleccionada');
      return;
    }
    const year = school.currentYear ?? new Date().getFullYear();
    const input: CreateChargeInput | null =
      v.targetType === 'student'
        ? (() => {
            if (!v.studentId) {
              this.toast.showError('Selecciona un estudiante');
              return null;
            }
            return {
              schoolId,
              year,
              amount: v.amount,
              dueDate: v.dueDate,
              description: v.description || undefined,
              chargeType: v.chargeType,
              studentId: v.studentId,
            };
          })()
        : (() => {
            if (!v.studyPlanId) {
              this.toast.showError('Selecciona un plan de estudio');
              return null;
            }
            return {
              schoolId,
              year,
              amount: v.amount,
              dueDate: v.dueDate,
              description: v.description || undefined,
              chargeType: v.chargeType,
              studyPlanId: v.studyPlanId,
            };
          })();
    if (!input) return;
    this.apollo
      .mutate({
        mutation: CreateChargeFormCreateChargeDocument,
        variables: { input },
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Cargo creado correctamente');
          this.closeModal.emit();
        },
        error: (err) => this.toast.showError(err?.message ?? 'Error al crear'),
      });
  }
}
