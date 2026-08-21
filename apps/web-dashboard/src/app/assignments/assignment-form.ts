import { TextEditor, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { applyEach, form, FormField, required } from '@angular/forms/signals';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import Store from '../core/store';

enum AssignmentType {
  HOMEWORK = 'HOMEWORK',
  EXAM = 'EXAM',
  QUIZ = 'QUIZ',
  PROJECT = 'PROJECT',
  PAPER = 'PAPER',
  NEW = 'NEW',
}
interface AssignmentFormData {
  title: string;
  details: string;
  type: AssignmentType;
  date: string;
  requireSubmission: boolean;
  teacherId: string;
  courseId: string;
  groupDates: { classGroupId: string; date: string }[];
}

@Component({
  selector: 'app-assignment-form',
  imports: [TextEditor, FormField],
  template: `<form (submit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-4">
      <div class="fieldset col-span-2">
        <label for="title">Titulo</label>
        <input type="text" [formField]="form.title" class="input input-primary" />
      </div>
      <div class="fieldset col-span-2">
        <label for="details">Detalles</label>
        <lib-text-editor [formField]="form.details" [bordered]="true" />
      </div>
      <div class="fieldset col-span-2">
        <label for="courseId">Curso</label>
        <select [formField]="form.courseId" class="select select-primary">
          <option disabled selected [value]="null">Seleccionar curso</option>
          @for (course of courses.value(); track course.id) {
            <option [value]="course.id">{{ course.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="type">Tipo</label>
        <select [formField]="form.type" class="select select-primary">
          @for (type of types; track type.value) {
            <option [value]="type.value">{{ type.label }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="teacherId">Profesor</label>
        <select [formField]="form.teacherId" class="select select-primary">
          <option disabled selected [value]="">Seleccionar profesor</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="requireSubmission">Requiere envio</label>
        <input type="checkbox" [formField]="form.requireSubmission" class="checkbox checkbox-primary" />
      </div>

      @if (courseGroups.value()?.length) {
        <div class="col-span-2 mt-2">
          <h3 class="text-lg font-medium mb-2">Fechas de entrega por grupo</h3>
          <div class="grid gap-3">
            @for (group of form.groupDates; let i = $index; track i) {
              <div class="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                <span class="font-medium min-w-24">{{ group.name }}</span>
                <input
                  [id]="'group-date-' + i"
                  type="datetime-local"
                  [formField]="group.date"
                  class="input input-primary flex-1"
                />
              </div>
            }
          </div>
        </div>
      } @else if (!form.courseId().value()) {
        <div class="col-span-2">
          <div class="fieldset">
            <label for="date">Fecha por defecto</label>
            <input type="datetime-local" [formField]="form.date" class="input input-primary" />
          </div>
        </div>
      }
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class AssignmentForm {
  public data = input<{ courseId?: string }>();
  private fb = inject(NonNullableFormBuilder);
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private store = inject(Store);
  private toast = inject(Toast);

  public courses = httpResource<{ id: string; name: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return `/api/v1/courses/by-school/${schoolId}`;
  });

  public courseGroups = httpResource<{ id: string; name: string }[]>(() => {
    const courseId = this.form.courseId().value();
    if (!courseId) return undefined;
    return `/api/v1/class-groups/by-course/${courseId}`;
  });

  public teachers = httpResource<{ id: string; name: string }[]>(() => {
    const organizationId = this.store.currentOrganizationId();
    if (!organizationId) return undefined;
    return `/api/v1/teachers/by-organization/${organizationId}`;
  });

  public types = [
    { label: 'Nuevo', value: AssignmentType.NEW },
    { label: 'Tarea', value: AssignmentType.HOMEWORK },
    { label: 'Examen', value: AssignmentType.EXAM },
    { label: 'Proyecto', value: AssignmentType.PROJECT },
    { label: 'Quiz', value: AssignmentType.QUIZ },
    { label: 'Ensayo', value: AssignmentType.PAPER },
  ];

  private defaultDate = format(addDays(setMinutes(setHours(new Date(), 8), 0), 1), "yyyy-MM-dd'T'HH:mm");

  assignmentModel = signal<AssignmentFormData>({
    title: '',
    details: '',
    type: AssignmentType.NEW,
    date: this.defaultDate,
    requireSubmission: false,
    teacherId: '',
    courseId: '',
    groupDates: [],
  });

  form = form(this.assignmentModel, (model) => {
    required(model.title, { message: 'El titulo es requerido' });
    required(model.type, { message: 'El tipo es requerido' });
    required(model.date, { message: 'La fecha es requerida' });
    required(model.teacherId, { message: 'El profesor es requerido' });
    required(model.courseId, { message: 'El curso es requerido' });
    applyEach(model.groupDates, (groupDate) => {
      required(groupDate.date, { message: 'La fecha es requerida' });
    });
  });

  constructor() {
    // Watch for course selection changes
    effect(() => {
      const groups = this.courseGroups.value();
      if (groups?.length) {
        this.buildGroupDatesArray(groups);
      }
    });
    afterRenderEffect(() => {
      if (this.data()?.courseId) {
        this.form.courseId().value.set(this.data()!.courseId!);
      }
      if (this.store.currentTeacher()) {
        this.form.teacherId().value.set(this.store.currentTeacher()!.id ?? '');
      }
    });
  }

  private buildGroupDatesArray(groups: { id: string; name: string }[]) {
    this.assignmentModel.update((model) => ({
      ...model,
      groupDates: groups.map((group) => ({
        classGroupId: group.id,
        date: this.defaultDate,
      })),
    }));
  }

  onSubmit() {
    if (this.form().invalid()) {
      this.toast.showError('Formulario invalido');
      return;
    }

    const req = this.form().value();
    const groups = this.courseGroups.value();

    // Build groupDates array if groups exist
    const groupDates =
      groups?.length && req.groupDates.length
        ? req.groupDates.map((gd) => ({
            classGroupId: gd.classGroupId,
            date: new Date(gd.date),
          }))
        : undefined;

    firstValueFrom(
      this.http.post('/api/v1/assignments', {
        title: req.title,
        details: req.details,
        type: req.type,
        date: new Date(req.date).toISOString(),
        requireSubmission: req.requireSubmission,
        teacherId: req.teacherId ?? '',
        courseId: req.courseId ?? '',
        schoolId: this.store.currentSchoolId() ?? '',
        groupDates,
      }),
    )
      .then(() => {
        this.toast.showSuccess('Tarea creada exitosamente');
        this.closeModal.emit();
      })
      .catch(() => {
        this.toast.showError('Error al crear la tarea');
      });
  }
}
