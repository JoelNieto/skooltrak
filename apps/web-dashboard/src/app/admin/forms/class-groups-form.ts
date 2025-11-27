import { markGroupDirty, Toast } from '@/ui';
import {
  afterRenderEffect,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-class-groups-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          name="name"
          formControlName="name"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          name="shortName"
          formControlName="shortName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="teacherId">Profesor</label>
        <select
          id="teacherId"
          name="teacherId"
          formControlName="teacherId"
          class="select select-primary"
        >
          <option [value]="null" disabled>Seleccionar profesor</option>
          @for(teacher of teachers.value(); track teacher.id) {
          <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="studyPlanId">Plan de estudio</label>
        <select
          id="studyPlanId"
          name="studyPlanId"
          formControlName="studyPlanId"
          class="select select-primary"
        >
          <option value="" disabled>Seleccionar plan</option>
          @for(studyPlan of studyPlans.value(); track studyPlan.id) {
          <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="active">Activo</label>
        <input
          type="checkbox"
          id="active"
          name="active"
          formControlName="active"
          class="checkbox checkbox-primary"
        />
      </div>
    </div>
    <div class="flex justify-end mt-4 gap-2">
      <button class="btn btn-ghost" (click)="closeModal.emit()">
        Cancelar
      </button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class ClassGroupsForm {
  public data = input<{
    group?: Prisma.ClassGroupGetPayload<{
      include: { teacher: true; studyPlan: true };
    }>;
  }>();
  private store = inject(Store);
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  public closeModal = output<void>();

  public teachers = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      const { organizationId } = params;
      if (!organizationId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          teachersByOrganizationId: { id: string; name: string }[];
        }>({
          query: gql`
            query TeachersByOrganizationId($organizationId: String!) {
              teachersByOrganizationId(organizationId: $organizationId) {
                id
                name
              }
            }
          `,
          variables: {
            organizationId: params.organizationId,
          },
        })
        .valueChanges.pipe(
          map((result) => result.data.teachersByOrganizationId)
        );
    },
  });

  public studyPlans = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          studyPlansBySchoolId: Prisma.StudyPlanGetPayload<{
            include: { degree: true; school: true };
          }>[];
        }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  private fb = inject(NonNullableFormBuilder);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    teacherId: this.fb.control<string | null>(null),
    studyPlanId: ['', [Validators.required]],
    active: [true],
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.group) {
        this.form.patchValue(this.data()!.group!);
      }
    });
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario inválido');
      markGroupDirty(this.form);
      return;
    }

    const req = this.form.getRawValue();

    if (this.data()?.group) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateClassGroup(
              $updateClassGroupInput: UpdateClassGroupInput!
            ) {
              updateClassGroup(updateClassGroupInput: $updateClassGroupInput) {
                id
                name
                shortName
              }
            }
          `,
          variables: {
            updateClassGroupInput: {
              ...req,
              id: this.data()!.group!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Grupo actualizado correctamente');
            this.closeModal.emit();
          },
          error: (err) => {
            console.error(err);
            this.toast.showError('Error al actualizar el grupo');
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateClassGroup(
              $createClassGroupInput: CreateClassGroupInput!
            ) {
              createClassGroup(createClassGroupInput: $createClassGroupInput) {
                id
                name
                shortName
              }
            }
          `,
          variables: {
            createClassGroupInput: {
              ...req,
              schoolId: this.store.currentSchoolId()!,
              organizationId: this.store.currentOrganizationId()!,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Grupo creado correctamente');
            this.closeModal.emit();
          },
          error: (err) => {
            console.error(err);
            this.toast.showError('Error al crear el grupo');
          },
        });
    }
  }
}
