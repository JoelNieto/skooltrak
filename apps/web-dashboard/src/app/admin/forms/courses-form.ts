import { Alert, Button, courseColorVar, Icon, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { COURSE_COLORS, CourseColorKey } from '@/shared';
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
  /** Resolved by the API; `colorIsDefault` says whether it was chosen or derived. */
  color?: string | null;
  colorIsDefault?: boolean;
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
    Icon,
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
      <fieldset class="course-color-picker flex flex-col gap-2">
        <legend class="mb-1 text-sm font-medium text-ink-strong">Color</legend>
        <div class="flex flex-wrap gap-1">
          @for (c of colors; track c.key) {
            <label class="relative flex size-11 cursor-pointer items-center justify-center" [title]="c.label">
              <input
                type="radio"
                name="course-color"
                class="peer sr-only"
                [value]="c.key"
                [checked]="formModel().color === c.key"
                (change)="setColor(c.key)"
                [attr.aria-label]="c.label"
              />
              <span
                class="flex size-9 items-center justify-center rounded-full ring-ink-strong ring-offset-2 ring-offset-surface-1 peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-action"
                [style.background-color]="colorVar(c.key)"
              >
                @if (formModel().color === c.key) {
                  <ui-icon name="check" class="text-lg text-white" />
                }
              </span>
            </label>
          }
        </div>
        <p class="text-xs text-ink-muted">
          @if (selectedColorLabel(); as label) {
            {{ label }} ·
            <button type="button" class="link" (click)="setColor('')">Usar color automático</button>
          } @else {
            Automático: cada curso recibe un color fijo hasta que elijas uno.
          }
        </p>
      </fieldset>
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

  protected readonly colors = COURSE_COLORS;
  protected readonly colorVar = courseColorVar;

  public formModel = signal<{
    name: string;
    shortName: string;
    code: string;
    subjectId: string;
    studyPlanId: string;
    teacherId: string;
    /** '' = automatic (derived from the course id). */
    color: CourseColorKey | '';
  }>({ name: '', shortName: '', code: '', subjectId: '', studyPlanId: '', teacherId: '', color: '' });

  protected selectedColorLabel() {
    const color = this.formModel().color;
    return COURSE_COLORS.find((c) => c.key === color)?.label ?? '';
  }

  protected setColor(color: CourseColorKey | '') {
    this.formModel.update((model) => ({ ...model, color }));
  }

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
      if (course) {
        this.formModel.set({
          name: course.name,
          shortName: course.shortName,
          code: course.code,
          subjectId: course.subjectId,
          studyPlanId: course.studyPlanId,
          teacherId: course.teacherId,
          color: course.colorIsDefault ? '' : ((course.color ?? '') as CourseColorKey | ''),
        });
      }
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
          color: req.color || null,
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
        color: req.color || null,
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
