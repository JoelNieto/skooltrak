import { Loader, Toast, markGroupDirty } from '@/ui';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';

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

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Presente', icon: 'check_circle', color: 'text-success' },
  { value: 'ABSENT', label: 'Ausente', icon: 'cancel', color: 'text-error' },
  { value: 'LATE', label: 'Tardanza', icon: 'schedule', color: 'text-warning' },
  { value: 'SICK_LEAVE', label: 'Permiso médico', icon: 'healing', color: 'text-info' },
  { value: 'EXCUSED', label: 'Excusado', icon: 'event_busy', color: 'text-neutral' },
];

@Component({
  selector: 'app-attendance-form',
  imports: [ReactiveFormsModule, Loader, NgClass],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label" for="date">
            <span class="label-text">Fecha</span>
          </label>
          <input
            type="date"
            class="input input-bordered input-primary"
            formControlName="date"
            [attr.disabled]="isEditing() ? true : null"
          />
        </div>
        <div class="form-control">
          <label class="label" for="classGroupId">
            <span class="label-text">Grupo</span>
          </label>
          <select
            id="classGroupId"
            class="select select-bordered select-primary"
            formControlName="classGroupId"
            [disabled]="isEditing()"
            (change)="onGroupChange()"
          >
            <option value="" disabled>Seleccionar grupo...</option>
            @for (group of data()?.groups || []; track group.id) {
              <option [value]="group.id">{{ group.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="flex gap-2 flex-wrap">
        <span class="text-sm font-medium self-center">Marcar todos:</span>
        @for (status of statusOptions; track status.value) {
          <button
            type="button"
            class="btn btn-sm btn-outline"
            [ngClass]="{
              'btn-success': status.value === 'PRESENT',
              'btn-error': status.value === 'ABSENT',
              'btn-warning': status.value === 'LATE',
              'btn-info': status.value === 'SICK_LEAVE',
              'btn-neutral': status.value === 'EXCUSED',
            }"
            (click)="markAll(status.value)"
          >
            <span class="material-symbols-outlined text-sm">{{ status.icon }}</span>
            {{ status.label }}
          </button>
        }
      </div>

      @if (studentsResource.isLoading()) {
        <lib-loader />
      }

      @if (studentsResource.hasValue() && records.length > 0) {
        <div class="overflow-x-auto max-h-96">
          <table class="table table-sm table-pin-rows">
            <thead>
              <tr>
                <th class="w-1/3">Estudiante</th>
                <th>Estado</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody formArrayName="records">
              @for (record of records.controls; track $index; let i = $index) {
                <tr [formGroupName]="i" class="hover">
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
                    <div class="flex gap-1">
                      @for (status of statusOptions; track status.value) {
                        <button
                          type="button"
                          class="btn btn-xs btn-circle"
                          [ngClass]="{
                            'btn-success': status.value === 'PRESENT' && record.get('status')?.value === 'PRESENT',
                            'btn-error': status.value === 'ABSENT' && record.get('status')?.value === 'ABSENT',
                            'btn-warning': status.value === 'LATE' && record.get('status')?.value === 'LATE',
                            'btn-info': status.value === 'SICK_LEAVE' && record.get('status')?.value === 'SICK_LEAVE',
                            'btn-neutral': status.value === 'EXCUSED' && record.get('status')?.value === 'EXCUSED',
                            'btn-ghost': record.get('status')?.value !== status.value,
                          }"
                          [title]="status.label"
                          (click)="setStatus(i, status.value)"
                        >
                          <span class="material-symbols-outlined text-sm">
                            {{ status.icon }}
                          </span>
                        </button>
                      }
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      class="input input-bordered input-sm w-full max-w-xs"
                      formControlName="comment"
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
        <div class="alert alert-warning">
          <span class="material-symbols-outlined">warning</span>
          No hay estudiantes en este grupo para el curso seleccionado
        </div>
      }

      <div class="modal-action">
        <button type="button" class="btn" (click)="closeModal.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
          @if (isSubmitting()) {
            <span class="loading loading-spinner"></span>
          }
          {{ isEditing() ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceForm {
  public data = input<{
    courseId: string;
    session?: AttendanceSessionType;
    groups?: ClassGroupType[];
  }>();
  public closeModal = output<void>();

  #apollo = inject(Apollo);
  #fb = inject(NonNullableFormBuilder);
  #toast = inject(Toast);

  public statusOptions = STATUS_OPTIONS;
  public isSubmitting = signal(false);
  public isEditing = computed(() => !!this.data()?.session);
  public selectedGroupId = signal<string>('');

  public form = this.#fb.group({
    date: ['', [Validators.required]],
    classGroupId: ['', [Validators.required]],
    records: this.#fb.array<FormGroup>([]),
  });

  get records() {
    return this.form.get('records') as FormArray<FormGroup>;
  }

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

      return this.#apollo
        .query<{ studentsForAttendance: StudentType[] }>({
          query: gql`
            query StudentsForAttendance($courseId: String!, $classGroupId: String!) {
              studentsForAttendance(courseId: $courseId, classGroupId: $classGroupId) {
                id
                firstName
                middleName
                fatherName
                motherName
                classGroup {
                  id
                  name
                }
              }
            }
          `,
          variables: { courseId, classGroupId },
          fetchPolicy: 'network-only',
        })
        .pipe(
          map((r) => {
            const students = r.data.studentsForAttendance;
            this.initializeRecords(students);
            return students;
          }),
        );
    },
  });

  constructor() {
    // Initialize form with session data if editing
    const session = this.data()?.session;
    if (session) {
      this.form.patchValue({
        date: session.date.split('T')[0],
        classGroupId: session.classGroupId,
      });
      this.selectedGroupId.set(session.classGroupId);
    }
  }

  onGroupChange() {
    const groupId = this.form.get('classGroupId')?.value || '';
    this.selectedGroupId.set(groupId);
  }

  private initializeFormWithSession(session: AttendanceSessionType) {
    this.form.patchValue({
      date: session.date.split('T')[0],
      classGroupId: session.classGroupId,
    });

    // Clear existing records
    while (this.records.length) {
      this.records.removeAt(0);
    }

    // Add records from session
    session.records.forEach((record) => {
      this.records.push(
        this.#fb.group({
          id: [record.id],
          studentId: [record.studentId],
          status: [record.status, [Validators.required]],
          comment: [record.comment || ''],
        }),
      );
    });
  }

  private initializeRecords(students: StudentType[]) {
    // Clear existing records
    while (this.records.length) {
      this.records.removeAt(0);
    }

    // Add new records for each student
    students.forEach((student) => {
      this.records.push(
        this.#fb.group({
          studentId: [student.id],
          status: ['PRESENT', [Validators.required]],
          comment: [''],
        }),
      );
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
    this.records.at(index).get('status')?.setValue(status);
  }

  markAll(status: string) {
    this.records.controls.forEach((control) => {
      control.get('status')?.setValue(status);
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.#toast.showError('Por favor complete todos los campos requeridos');
      markGroupDirty(this.form);
      return;
    }

    if (this.records.length === 0) {
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
    const formValue = this.form.getRawValue();

    this.#apollo
      .mutate({
        mutation: gql`
          mutation CreateAttendanceSession($input: CreateAttendanceSessionInput!) {
            createAttendanceSession(input: $input) {
              id
              date
              classGroup {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: {
            date: new Date(formValue.date).toISOString(),
            courseId: this.data()!.courseId,
            classGroupId: formValue.classGroupId,
            records: formValue.records.map((r: any) => ({
              studentId: r.studentId,
              status: r.status,
              comment: r.comment || null,
            })),
          },
        },
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
    const formValue = this.form.getRawValue();

    this.#apollo
      .mutate({
        mutation: gql`
          mutation UpdateAttendanceRecords($inputs: [UpdateAttendanceRecordInput!]!) {
            updateAttendanceRecords(inputs: $inputs) {
              id
              status
              comment
            }
          }
        `,
        variables: {
          inputs: formValue.records.map((r: any) => ({
            id: r.id,
            status: r.status,
            comment: r.comment || null,
          })),
        },
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
