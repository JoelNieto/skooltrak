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
  selector: 'app-courses-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="code">Código</label>
        <input
          type="text"
          id="code"
          name="code"
          formControlName="code"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="subjectId">Asignatura</label>
        <select
          id="subjectId"
          name="subjectId"
          formControlName="subjectId"
          class="select select-primary"
        >
          <option value="" disabled>Seleccionar asignatura</option>
          @for(subject of subjects.value(); track subject.id) {
          <option [value]="subject.id">{{ subject.name }}</option>
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
        <label for="currentPeriodId">Periodo actual</label>
        <select
          id="currentPeriodId"
          name="currentPeriodId"
          formControlName="currentPeriodId"
          class="select select-primary"
        >
          <option value="" disabled>Seleccionar periodo...</option>
          @for(period of periods.value(); track period.id) {
          <option [value]="period.id">{{ period.name }}</option>
          }
        </select>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  </form>`,
})
export default class CoursesForm {
  private fb = inject(NonNullableFormBuilder);
  public data = input<{
    course?: Prisma.CourseGetPayload<{
      include: { school: true; subject: true; studyPlan: true };
    }>;
  }>();
  public closeModal = output<void>();
  private toast = inject(Toast);
  private apollo = inject(Apollo);
  private store = inject(Store);
  public periods = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ periodsBySchoolId: Prisma.PeriodGetPayload<false>[] }>({
          query: gql`
            query GetPeriodsBySchoolId($schoolId: String!) {
              periodsBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.periodsBySchoolId));
    },
  });
  public subjects = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      const { organizationId } = params;
      if (!organizationId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ subjects: Prisma.SubjectGetPayload<false>[] }>({
          query: gql`
            query GetSubjects($organizationId: String!) {
              subjects(organizationId: $organizationId) {
                id
                name
              }
            }
          `,
          variables: {
            organizationId: params.organizationId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.subjects));
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

  public form = this.fb.group({
    name: [''],
    shortName: [''],
    code: [''],
    subjectId: ['', [Validators.required]],
    studyPlanId: ['', [Validators.required]],
    currentPeriodId: this.fb.control<string | null>('', [Validators.required]),
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.course) {
        this.form.patchValue(this.data()!.course!);
      }
    });
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Llenar todos los campos');
      markGroupDirty(this.form);
      return;
    }
    const req = this.form.getRawValue();
    if (this.data()?.course) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateCourse($updateCourseInput: UpdateCourseInput!) {
              updateCourse(updateCourseInput: $updateCourseInput) {
                id
                name
                shortName
                code
                subjectId
                studyPlanId
              }
            }
          `,
          variables: {
            updateCourseInput: {
              ...req,
              id: this.data()!.course!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.closeModal.emit();
            this.toast.showSuccess('Curso actualizado exitosamente');
          },
          error: (err) => {
            this.toast.showError(err.message);
          },
        });
      return;
    }
    this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCourse($createCourseInput: CreateCourseInput!) {
            createCourse(createCourseInput: $createCourseInput) {
              id
              name
              shortName
              code
              subjectId
              studyPlanId
            }
          }
        `,
        variables: {
          createCourseInput: {
            ...req,
            organizationId: this.store.currentOrganizationId(),
            schoolId: this.store.currentSchoolId(),
          },
        },
      })
      .subscribe({
        next: () => {
          this.closeModal.emit();
          this.toast.showSuccess('Curso creado exitosamente');
        },
        error: (err) => {
          this.toast.showError(err.message);
        },
      });
  }
}
