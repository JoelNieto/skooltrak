import { Alert, Button, Icon, Loader, Toast, UiField, UiIconName, UiInput, UiSelect, UiTable } from '#/ui';
import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { applyEach, form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { map, of, tap } from 'rxjs';

type StudentType = Prisma.StudentGetPayload<{ include: { classGroup: true } }>;

type AttendanceRecordType = {
  id: string;
  studentId: string;
  status: string;
  comment: string | null;
  student: StudentType;
};

type AttendanceSessionType = {
  id: string;
  date: string;
  courseId: string;
  classGroupId: string;
  records: AttendanceRecordType[];
};

type ClassGroupType = {
  id: string;
  name: string;
};

/** `color` tints the icon; `selected` fills the row's picker button once that status is chosen. */
const STATUS_OPTIONS: { value: string; label: string; icon: UiIconName; color: string; selected: string }[] = [
  {
    value: 'PRESENT',
    label: 'Presente',
    icon: 'circle-check',
    color: 'text-success',
    selected: 'bg-success text-success-content',
  },
  { value: 'ABSENT', label: 'Ausente', icon: 'circle-x', color: 'text-error', selected: 'bg-error text-error-content' },
  {
    value: 'LATE',
    label: 'Tardanza',
    icon: 'clock',
    color: 'text-warning',
    selected: 'bg-warning text-warning-content',
  },
  {
    value: 'SICK_LEAVE',
    label: 'Permiso médico',
    icon: 'heart-pulse',
    color: 'text-info',
    selected: 'bg-info text-info-content',
  },
  {
    value: 'EXCUSED',
    label: 'Excusado',
    icon: 'calendar-x',
    color: 'text-ink-muted',
    selected: 'bg-neutral text-neutral-content',
  },
];

@Component({
  selector: 'app-attendance-form',
  imports: [Alert, UiTable, UiInput, UiSelect, Button, FormField, Loader, NgClass, UiField, Icon],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ui-field label="Fecha">
          <input uiInput type="date" [formField]="form.date" />
        </ui-field>
        <ui-field label="Grupo">
          <select uiSelect id="classGroupId" [formField]="form.classGroupId">
            <option value="" disabled>Seleccionar grupo...</option>
            @for (group of data()?.groups || []; track group.id) {
              <option [value]="group.id">{{ group.name }}</option>
            }
          </select>
        </ui-field>
      </div>

      <!-- Bulk Actions -->
      <div class="flex gap-2 flex-wrap">
        <span class="text-sm font-medium self-center">Marcar todos:</span>
        @for (status of statusOptions; track status.value) {
          <button uiButton size="sm" type="button" (click)="markAll(status.value)">
            <ui-icon [name]="status.icon" class="text-sm" [class]="status.color" />
            {{ status.label }}
          </button>
        }
      </div>

      @if (studentsResource.isLoading()) {
        <lib-loader />
      }

      @if (studentsResource.hasValue() && form.records.length > 0) {
        <div class="overflow-x-auto max-h-96">
          <table uiTable density="compact" stickyHeader>
            <thead>
              <tr>
                <th class="w-1/3">Estudiante</th>
                <th>Estado</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody formArrayName="records">
              @for (record of form.records; track $index; let i = $index) {
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar avatar-placeholder">
                        <div class="bg-neutral text-neutral-content w-8 rounded-full">
                          <span class="text-xs">
                            {{ getStudentInitials(i) }}
                          </span>
                        </div>
                      </div>
                      <span class="font-medium">{{ getStudentName(i) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-1" role="group" [attr.aria-label]="'Estado de ' + getStudentName(i)">
                      @for (status of statusOptions; track status.value) {
                        <button
                          type="button"
                          class="inline-flex size-7 items-center justify-center rounded-full transition-colors"
                          [ngClass]="
                            record.status().value() === status.value
                              ? status.selected
                              : 'text-ink-subtle hover:bg-surface-2 hover:text-ink'
                          "
                          [title]="status.label"
                          [attr.aria-label]="status.label"
                          [attr.aria-pressed]="record.status().value() === status.value"
                          (click)="setStatus(i, status.value)"
                        >
                          <ui-icon [name]="status.icon" class="text-sm" />
                        </button>
                      }
                    </div>
                  </td>
                  <td>
                    <input
                      uiInput
                      size="sm"
                      type="text"
                      class="max-w-xs"
                      [formField]="record.comment"
                      placeholder="Comentario opcional..."
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (studentsResource.hasValue() && studentsResource.value()!.length === 0) {
        <div uiAlert tone="warning">
          <ui-icon name="triangle-alert" />
          No hay estudiantes en este grupo para el curso seleccionado
        </div>
      }

      <div class="modal-action">
        <button uiButton type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton [loading]="isSubmitting()" variant="primary" type="submit" [disabled]="isSubmitting()">
          {{ isEditing() ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </form>
  `,
})
export default class AttendanceForm {
  public data = input<{
    courseId: string;
    session?: AttendanceSessionType;
    groups?: ClassGroupType[];
    /** Preselects the group of a new session (e.g. from the teacher home, HOM-001-S01). */
    classGroupId?: string;
    /** Preselects the date of a new session, `YYYY-MM-DD`. */
    date?: string;
  }>();
  public closeModal = output<void>();

  #http = inject(HttpClient);
  #toast = inject(Toast);

  public statusOptions = STATUS_OPTIONS;
  public isSubmitting = signal(false);
  public isEditing = computed(() => !!this.data()?.session);
  public selectedGroupId = signal<string>('');

  private formModel = signal<{
    date: string;
    classGroupId: string;
    records: { id?: string; studentId: string; status: string; comment: string }[];
  }>({
    date: '',
    classGroupId: '',
    records: [],
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.date, { message: 'Fecha requerida' });
    required(schemaPath.classGroupId, { message: 'Grupo requerido' });
    applyEach(schemaPath.records, (recordPath) => {
      required(recordPath.status, { message: 'Status requerido' });
    });
  });

  public studentsResource = rxResource({
    params: () => ({
      courseId: this.data()?.courseId,
      classGroupId: this.selectedGroupId(),
      session: this.data()?.session,
    }),
    stream: ({ params }) => {
      const { courseId, classGroupId, session } = params;

      // If editing, use the existing records
      if (session) {
        this.initializeFormWithSession(session);
        return of(session.records.map((r) => r.student));
      }

      if (!courseId || !classGroupId) return of([]);

      return this.#http
        .get<StudentType[]>('/api/v1/attendance/students', {
          params: { courseId, classGroupId },
        })
        .pipe(
          tap((students) => this.initializeRecords(students ?? [])),
          map((students) => students ?? []),
        );
    },
  });

  constructor() {
    // Initialize form with session data if editing
    afterRenderEffect(() => {
      const data = this.data();
      const session = data?.session;
      if (session) {
        this.form.date().value.set(session.date.split('T')[0]);
        this.form.classGroupId().value.set(session.classGroupId);
        this.selectedGroupId.set(session.classGroupId);
      } else if (data?.classGroupId && !untracked(() => this.formModel().classGroupId)) {
        this.form.classGroupId().value.set(data.classGroupId);
        if (data.date) this.form.date().value.set(data.date);
      }
    });

    effect(() => {
      this.selectedGroupId.set(this.formModel().classGroupId);
    });
  }

  private initializeFormWithSession(session: AttendanceSessionType) {
    this.form.date().value.set(session.date.split('T')[0]);
    this.form.classGroupId().value.set(session.classGroupId);

    // Clear existing records
    this.form.records().value.set([]);

    // Add records from session
    session.records.forEach((record) => {
      const { id, studentId, status, comment } = record;
      this.form.records().value.update((current) => [...current, { id, studentId, status, comment: comment ?? '' }]);
    });
  }

  private initializeRecords(students: StudentType[]) {
    // Clear existing records
    this.form.records().value.set([]);

    // Add new records for each student
    students.forEach((student) => {
      this.form
        .records()
        .value.update((records) => [...records, { studentId: student.id, status: 'PRESENT', comment: '' }]);
    });
  }

  getStudentName(index: number): string {
    const students = this.studentsResource.value();
    if (!students || !students[index]) return '';
    const student = students[index];
    return `${student.firstName} ${student.fatherName}`;
  }

  getStudentInitials(index: number): string {
    const students = this.studentsResource.value();
    if (!students || !students[index]) return '';
    const student = students[index];
    return `${student.firstName.charAt(0)}${student.fatherName.charAt(0)}`;
  }

  setStatus(index: number, status: string) {
    this.form
      .records()
      .value.update((records) => records.map((record, i) => (i === index ? { ...record, status } : record)));
  }

  markAll(status: string) {
    this.form.records().value.update((records) => records.map((record) => ({ ...record, status })));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.#toast.showError('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.formModel().records.length === 0) {
      this.#toast.showError('No hay estudiantes para registrar asistencia');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing()) {
      this.updateAttendance();
    } else {
      this.createAttendance();
    }
  }

  private createAttendance() {
    const formValue = this.formModel();

    this.#http
      .post('/api/v1/attendance/sessions', {
        date: new Date(formValue.date).toISOString(),
        courseId: this.data()!.courseId,
        classGroupId: formValue.classGroupId,
        records: (formValue.records as Array<{ studentId: string; status: string; comment?: string }>).map((r) => ({
          studentId: r.studentId,
          status: r.status,
          comment: r.comment || null,
        })),
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Asistencia registrada correctamente');
          this.isSubmitting.set(false);
          this.closeModal.emit();
        },
        error: (err) => {
          console.error('Error creating attendance:', err);
          this.#toast.showError(err.message || 'Error al registrar la asistencia');
          this.isSubmitting.set(false);
        },
      });
  }

  private updateAttendance() {
    const formValue = this.formModel();

    this.#http
      .patch('/api/v1/attendance/records/batch', {
        inputs: (formValue.records as Array<{ id: string; status: string; comment?: string }>).map((r) => ({
          id: r.id,
          status: r.status,
          comment: r.comment || null,
        })),
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Asistencia actualizada correctamente');
          this.isSubmitting.set(false);
          this.closeModal.emit();
        },
        error: (err) => {
          console.error('Error updating attendance:', err);
          this.#toast.showError(err.message || 'Error al actualizar la asistencia');
          this.isSubmitting.set(false);
        },
      });
  }
}
