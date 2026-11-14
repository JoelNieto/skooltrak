import { Alert, Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { SubjectGetPayload } from 'generated/prisma/models';
import { toFetchQueryParams } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';
import { SubjectCombobox } from '../../shared/subject-combobox';

interface CourseModel {
  id: string;
  name: string;
  shortName: string;
  code: string;
  subjectId: string;
  studyPlanId: string;
  teacherId: string;
  subject: SubjectGetPayload<{ include: undefined }>;
}
@Component({
  selector: 'app-courses-form',
  imports: [
    Alert,
    UiField,
    UiInput,
    UiSelect,
    Button,
    FormField,
    SubjectCombobox,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <ui-field label="Código" [field]="form.code" optional>
        <input uiInput type="text" id="code" [formField]="form.code" />
      </ui-field>
      <ui-field label="Asignatura" [field]="form.subjectId">
        <app-subject-combobox [formField]="form.subjectId" />
      </ui-field>
      <ui-field label="Plan de estudio" [field]="form.studyPlanId">
        <select uiSelect id="studyPlanId" [formField]="form.studyPlanId">
          <option value="" disabled>Seleccionar plan</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Docente" [field]="form.teacherId">
        <select uiSelect id="teacherId" [formField]="form.teacherId">
          <option [value]="null" disabled>Seleccionar docente...</option>
          @for (teacher of teachers.value()?.data; track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </ui-field>
    </div>
    @if (errorMessage()) {
      <div uiAlert tone="danger" class="mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ errorMessage() }}</span>
      </div>
    }
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class CoursesForm {
  public data = input<{
    course?: CourseModel;
  }>();
  public closeModal = output<void>();
  private toast = inject(Toast);
  private http = inject(HttpClient);
  private store = inject(Store);

  // Error message signal
  public errorMessage = signal('');

  public studyPlans = httpResource<{ id: string; name: string }[]>(() => {
    const currentSchoolId = this.store.currentSchoolId();
    if (!currentSchoolId) return undefined;

    return {
      url: `/api/v1/study-plans/by-school`,
      params: { schoolId: currentSchoolId },
    };
  });

  public formModel = signal<{
    name: string;
    shortName: string;
    code: string;
    subjectId: string;
    studyPlanId: string;
    teacherId: string;
  }>({ name: '', shortName: '', code: '', subjectId: '', studyPlanId: '', teacherId: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.subjectId, { message: 'Asignatura requerida' });
    required(schemaPath.studyPlanId, { message: 'Plan requerido' });
  });

  public teachers = httpResource<PaginatedResponse<{ id: string; name: string }>>(() => ({
    url: '/api/v1/teachers',
    params: toFetchQueryParams({
      take: 100,
      orderBy: 'firstName',
      orderDirection: 'asc',
    }),
  }));

  constructor() {
    afterRenderEffect(() => {
      const course = this.data()?.course;
      if (course) this.formModel.set(course);
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    if (!this.form().valid()) {
      this.toast.showError('Llenar todos los campos');
      return;
    }
    const req = this.formModel();
    if (this.data()?.course) {
      this.http
        .patch('/api/v1/courses', {
          ...req,
          id: this.data()!.course!.id,
        })
        .subscribe({
          next: () => {
            this.closeModal.emit();
            this.toast.showSuccess('Curso actualizado exitosamente');
          },
          error: (err) => {
            this.errorMessage.set(this.extractErrorMessage(err));
          },
        });
      return;
    }
    this.http
      .post('/api/v1/courses', {
        ...req,
        teacherId: req.teacherId || null,
        organizationId: this.store.currentOrganizationId() ?? '',
        schoolId: this.store.currentSchoolId() ?? '',
      })
      .subscribe({
        next: () => {
          this.closeModal.emit();
          this.toast.showSuccess('Curso creado exitosamente');
        },
        error: (err) => {
          this.errorMessage.set(this.extractErrorMessage(err));
        },
      });
  }

  private extractErrorMessage(err: unknown): string {
    const anyErr = err as { error?: { message?: string }; graphQLErrors?: { message?: string }[]; message?: string };
    const message =
      anyErr?.error?.message ?? anyErr?.graphQLErrors?.[0]?.message ?? anyErr?.message ?? 'Error inesperado';
    return message.replace(/^(ConflictException:\s*)/i, '');
  }
}
