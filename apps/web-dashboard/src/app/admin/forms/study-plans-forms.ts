import { Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@prisma/client';
import { Apollo } from 'apollo-angular';

import { gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-study-plan-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
        <div class="fieldset md:col-span-2">
          <label for="name">Nombre</label>
          <input
            type="text"
            formControlName="name"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="shortName">Nombre corto</label>
          <input
            type="text"
            formControlName="shortName"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="code">Código</label>
          <input
            type="text"
            formControlName="code"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="level">Grado</label>
          <input
            type="number"
            formControlName="level"
            class="input input-primary"
          />
        </div>

        <div class="fieldset">
          <label for="degreeId">Nivel</label>
          <select formControlName="degreeId" class="select select-primary">
            <option value="" disabled>---Seleccionar---</option>
            @for (degree of degrees.value(); track degree.id) {
            <option [value]="degree.id">
              {{ degree.name }}
            </option>
            }
          </select>
        </div>
        <div class="fieldset md:col-span-4">
          <label for="description">Descripción</label>
          <textarea
            formControlName="description"
            class="textarea textarea-primary w-full"
          ></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">
          Cancelar
        </button>
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
        .valueChanges.pipe(map((result) => result.data.degreesBySchoolId));
    },
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    code: ['', [Validators.required]],
    description: ['', []],
    level: [0, [Validators.required]],
    degreeId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data()?.studyPlan) {
      this.form.patchValue(this.data()!.studyPlan!);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const request = this.form.getRawValue();
    if (this.data()?.studyPlan) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateStudyPlan(
              $updateStudyPlanInput: UpdateStudyPlanInput!
            ) {
              updateStudyPlan(updateStudyPlanInput: $updateStudyPlanInput) {
                id
                name
              }
            }
          `,
          variables: {
            updateStudyPlanInput: {
              ...request,
              id: this.data()?.studyPlan?.id,
            },
          },
        })
        .subscribe(() => {
          this.toast.showSuccess('Plan de estudio actualizado exitosamente');
          this.closeModal.emit();
        });
    }
    if (this.form.valid) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateStudyPlan(
              $createStudyPlanInput: CreateStudyPlanInput!
            ) {
              createStudyPlan(createStudyPlanInput: $createStudyPlanInput) {
                id
                name
              }
            }
          `,
          variables: {
            createStudyPlanInput: {
              ...request,
              schoolId: this.store.currentSchoolId(),
            },
          },
        })
        .subscribe(() => {
          this.toast.showSuccess('Plan de estudio creado exitosamente');
          this.closeModal.emit();
        });
    }
  }
}
