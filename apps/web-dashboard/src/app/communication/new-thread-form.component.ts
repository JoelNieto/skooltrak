import { Button, EmptyState, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpParams, httpResource } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { PaginatedResponse } from '../core/pagination-meta';
import Store from '../core/store';
import { CommunicationApi, Thread, ThreadType, UrgencyTier } from './communication-api.service';

interface ClassGroupOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-new-thread-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField, EmptyState],
  template: `
    <form (submit)="submit($event)" class="space-y-4">
      <ui-field label="Tipo de hilo" [field]="form.type">
        <select uiSelect [formField]="form.type">
          <option value="CLASS_GROUP">Grupo de clase</option>
          <option value="STUDENT_GUARDIANS">Padres de un estudiante</option>
        </select>
      </ui-field>

      <ui-field label="Grupo de clase" [field]="form.classGroupId">
        <select uiSelect [formField]="form.classGroupId">
          <option [value]="''" disabled>Selecciona un grupo…</option>
          @for (cg of classGroups.value()?.data; track cg.id) {
            <option [value]="cg.id">{{ cg.name }}</option>
          }
        </select>
      </ui-field>

      @if (form.type().value() === 'STUDENT_GUARDIANS') {
        <ui-field label="Estudiante">
          @if (!studentsResource.isLoading() && studentsResource.value().length === 0) {
            <lib-empty-state title="Sin estudiantes" description="Elige primero un grupo de clase." icon="users" />
          } @else {
            <select uiSelect [formField]="form.studentId">
              <option [value]="''" disabled>Selecciona un estudiante…</option>
              @for (s of studentsResource.value(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          }
        </ui-field>
      }

      <ui-field label="Asunto" [field]="form.title">
        <input uiInput [formField]="form.title" />
      </ui-field>

      <ui-field label="Mensaje" [field]="form.body">
        <textarea uiInput rows="4" [formField]="form.body"></textarea>
      </ui-field>

      <ui-field label="Prioridad" [field]="form.urgency">
        <select uiSelect [formField]="form.urgency">
          <option value="ROUTINE">Rutina</option>
          <option value="IMPORTANT">Importante</option>
        </select>
      </ui-field>

      <div class="flex justify-end gap-2 pt-2">
        <button uiButton type="button" (click)="closeModal.emit(undefined)">Cancelar</button>
        <button
          uiButton
          [loading]="submitting()"
          variant="primary"
          type="submit"
          [disabled]="submitting() || form().invalid()"
        >
          @if (!submitting()) {
            Crear hilo
          }
        </button>
      </div>
    </form>
  `,
})
export class NewThreadFormComponent {
  data = input<{ type?: ThreadType }>();
  closeModal = output<Thread | undefined>();
  #api = inject(CommunicationApi);
  #toast = inject(Toast);
  #store = inject(Store);

  private formModel = signal<{
    type: ThreadType;
    classGroupId: string;
    title: string;
    body: string;
    studentId: string;
    urgency: UrgencyTier;
  }>({
    type: 'CLASS_GROUP',
    classGroupId: '',
    title: '',
    body: '',
    studentId: '',
    urgency: 'ROUTINE',
  });

  readonly submitting = signal(false);

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Asunto requerido' });
    required(schemaPath.body, { message: 'Mensaje requerido' });
    minLength(schemaPath.body, 1, { message: 'Mensaje requerido' });
    required(schemaPath.classGroupId, { message: 'Grupo requerido' });
    maxLength(schemaPath.title, 120, { message: 'Máximo 120 caracteres' });
    maxLength(schemaPath.body, 8000, { message: 'Máximo 8000 caracteres' });
    required(schemaPath.studentId, {
      message: 'Estudiante requerido',
      when: ({ valueOf }) => valueOf(schemaPath.type) === 'STUDENT_GUARDIANS',
    });
  });

  public classGroups = httpResource<PaginatedResponse<ClassGroupOption>>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) {
      return undefined;
    }
    const params = new HttpParams().set('schoolId', schoolId).set('pageSize', 100);
    console.log({ params });
    return {
      url: '/api/v1/class-groups',
      params: params,
    };
  });

  public studentsResource = httpResource<StudentOption[]>(
    () => {
      const groupId = this.form.classGroupId().value();
      if (!groupId) return undefined;
      const params = new HttpParams();
      params.set('pageSize', 50);
      return {
        url: `/api/v1/students/by-group/${groupId}`,
        params,
      };
    },
    { defaultValue: [] },
  );

  constructor() {
    this.form.type().value.set(this.data()?.type ?? 'CLASS_GROUP');
  }

  submit(event: Event) {
    event.preventDefault();
    if (this.form().invalid() || this.submitting()) return;
    this.submitting.set(true);

    const { type, studentId, classGroupId, title, body, urgency } = this.formModel();

    const scopeId = type === 'STUDENT_GUARDIANS' ? studentId : classGroupId;

    this.#api
      .createThread({
        type: type,
        scopeId,
        title: title.trim(),
        body: body.trim(),
        urgencyDefault: urgency,
      })
      .subscribe({
        next: (thread) => this.closeModal.emit(thread),
        error: () => {
          this.#toast.showError('No se pudo crear el hilo de comunicación');
          this.submitting.set(false);
        },
      });
  }
}
