import { EmptyState, Toast } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
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
  imports: [FormField, EmptyState],
  template: `
    <form (submit)="submit($event)" class="space-y-4">
      <div class="fieldset">
        <label for="type">Tipo de hilo</label>
        <select class="select select-primary" [formField]="form.type">
          <option value="CLASS_GROUP">Grupo de clase</option>
          <option value="STUDENT_GUARDIANS">Padres de un estudiante</option>
        </select>
      </div>

      <div class="fieldset">
        <label for="class-group-id">Grupo de clase</label>
        <select class="select select-primary" [formField]="form.classGroupId">
          <option [value]="''" disabled>Selecciona un grupo…</option>
          @for (cg of classGroups.value(); track cg.id) {
            <option [value]="cg.id">{{ cg.name }}</option>
          }
        </select>
      </div>

      @if (form.type().value() === 'STUDENT_GUARDIANS') {
        <div class="fieldset">
          <label for="student">Estudiante</label>
          @if (!studentsResource.isLoading() && studentsResource.value().length === 0) {
            <lib-empty-state title="Sin estudiantes" description="Elige primero un grupo de clase." icon="group" />
          } @else {
            <select class="select select-primary" [formField]="form.studentId">
              <option [value]="''" disabled>Selecciona un estudiante…</option>
              @for (s of studentsResource.value(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          }
        </div>
      }

      <div class="fieldset">
        <label for="title">Asunto</label>
        <input class="input input-primary" [formField]="form.title" />
      </div>

      <div class="fieldset">
        <label for="urgency">Prioridad</label>
        <select class="select select-primary" [formField]="form.urgency">
          <option value="ROUTINE">Rutina</option>
          <option value="IMPORTANT">Importante</option>
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn" (click)="closeModal.emit(undefined)">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="submitting() || form().invalid()">
          @if (submitting()) {
            <span class="loading loading-spinner loading-sm"></span>
          } @else {
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
    studentId: string;
    urgency: UrgencyTier;
  }>({
    type: 'CLASS_GROUP',
    classGroupId: '',
    title: '',
    studentId: '',
    urgency: 'ROUTINE',
  });

  readonly submitting = signal(false);

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Asunto requerido' });
    required(schemaPath.classGroupId, { message: 'Grupo requerido' });
    maxLength(schemaPath.title, 120, { message: 'Maximo 120 caractere' });
    required(schemaPath.studentId, {
      message: 'Estudiante requerido',
      when: ({ valueOf }) => valueOf(schemaPath.type) === 'STUDENT_GUARDIANS',
    });
  });

  public classGroups = httpResource<ClassGroupOption[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) {
        return undefined;
      }
      return {
        url: '/api/v1/class-groups',
        params: {
          schoolId,
        },
      };
    },
    { defaultValue: [] },
  );

  public studentsResource = httpResource<StudentOption[]>(
    () => {
      const groupId = this.form.classGroupId().value();
      if (!groupId) return undefined;
      return {
        url: `/api/v1/students/by-group/${groupId}`,
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

    const { type, studentId, classGroupId, title, urgency } = this.formModel();

    const scopeId = type === 'STUDENT_GUARDIANS' ? studentId : classGroupId;

    this.#api
      .createThread({
        type: type,
        scopeId,
        title: title.trim(),
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
