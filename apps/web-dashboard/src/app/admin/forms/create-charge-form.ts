import { Toast } from '@/ui';
import { Component, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-create-charge-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col gap-4">
        <div class="fieldset">
          <label>Objetivo</label>
          <select formControlName="targetType" class="select select-primary w-full">
            <option value="student">Estudiante</option>
            <option value="group">Grupo</option>
          </select>
        </div>
        @if (targetType === 'student') {
          <div class="fieldset">
            <label>Estudiante</label>
            <select formControlName="studentId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar estudiante...</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </div>
        }
        @if (targetType === 'group') {
          <div class="fieldset">
            <label>Grupo</label>
            <select formControlName="classGroupId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar grupo...</option>
              @for (g of classGroups.value(); track g.id) {
                <option [value]="g.id">{{ g.name }}</option>
              }
            </select>
          </div>
        }
        <div class="fieldset">
          <label>Monto</label>
          <input type="number" step="0.01" min="0" formControlName="amount" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label>Fecha de vencimiento</label>
          <input type="date" formControlName="dueDate" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label>Descripción (opcional)</label>
          <input type="text" formControlName="description" class="input input-primary w-full" placeholder="Ej. Colegiatura Septiembre" />
        </div>
        <div class="fieldset">
          <label>Tipo</label>
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

  get targetType(): 'student' | 'group' {
    const v = this.form.get('targetType')?.value as string | undefined;
    return v === 'group' ? 'group' : 'student';
  }
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);

  public students = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery<{ studentsBySchoolId: { id: string; firstName: string; fatherName: string }[] }>({
          query: gql`
            query StudentsForCharges($schoolId: String!) {
              studentsBySchoolId(schoolId: $schoolId) {
                id
                firstName
                fatherName
              }
            }
          `,
          variables: { schoolId: params.schoolId },
        })
        .valueChanges.pipe(map((r) => r.data.studentsBySchoolId));
    },
  });

  public classGroups = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery<{ classGroupsBySchoolId: { id: string; name: string }[] }>({
          query: gql`
            query ClassGroupsForCharges($schoolId: String!) {
              classGroupsBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: { schoolId: params.schoolId },
        })
        .valueChanges.pipe(map((r) => r.data.classGroupsBySchoolId));
    },
  });

  public form = this.fb.group({
    targetType: ['student' as const],
    studentId: [''],
    classGroupId: [''],
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
    const input: Record<string, unknown> = {
      schoolId,
      year,
      amount: v.amount,
      dueDate: v.dueDate,
      description: v.description || '',
      chargeType: v.chargeType,
    };
    if (v.targetType === 'student') {
      if (!v.studentId) {
        this.toast.showError('Selecciona un estudiante');
        return;
      }
      input['studentId'] = v.studentId;
    } else {
      if (!v.classGroupId) {
        this.toast.showError('Selecciona un grupo');
        return;
      }
      input['classGroupId'] = v.classGroupId;
    }
    this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCharge($input: CreateChargeInput!) {
            createCharge(input: $input) {
              id
            }
          }
        `,
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
