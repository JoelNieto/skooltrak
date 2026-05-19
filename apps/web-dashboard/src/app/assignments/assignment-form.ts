import { markGroupDirty, TextEditor, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { firstValueFrom, of } from 'rxjs';
import Store from '../core/store';

enum AssignmentType {
  HOMEWORK = 'HOMEWORK',
  EXAM = 'EXAM',
  QUIZ = 'QUIZ',
  PROJECT = 'PROJECT',
  PAPER = 'PAPER',
  NEW = 'NEW',
}

@Component({
  selector: 'app-assignment-form',
  imports: [ReactiveFormsModule, TextEditor],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-4">
      <div class="fieldset col-span-2">
        <label for="title">Titulo</label>
        <input type="text" formControlName="title" class="input input-primary" />
      </div>
      <div class="fieldset col-span-2">
        <label for="details">Detalles</label>
        <lib-text-editor formControlName="details" [bordered]="true" />
      </div>
      <div class="fieldset col-span-2">
        <label for="courseId">Curso</label>
        <select formControlName="courseId" class="select select-primary">
          <option disabled selected [value]="null">Seleccionar curso</option>
          @for (course of courses.value(); track course.id) {
            <option [value]="course.id">{{ course.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="type">Tipo</label>
        <select formControlName="type" class="select select-primary">
          @for (type of types; track type.value) {
            <option [value]="type.value">{{ type.label }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="teacherId">Profesor</label>
        <select formControlName="teacherId" class="select select-primary">
          <option disabled selected [value]="null">Seleccionar profesor</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="requireSubmission">Requiere envio</label>
        <input type="checkbox" formControlName="requireSubmission" class="checkbox checkbox-primary" />
      </div>

      @if (courseGroups.value()?.length) {
        <div class="col-span-2 mt-2">
          <h3 class="text-lg font-medium mb-2">Fechas de entrega por grupo</h3>
          <div class="grid gap-3">
            @for (group of courseGroups.value(); track group.id; let i = $index) {
              <div class="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                <span class="font-medium min-w-24">{{ group.name }}</span>
                <input
                  type="datetime-local"
                  [formControl]="getGroupDateControl(i)"
                  class="input input-primary flex-1"
                />
              </div>
            }
          </div>
        </div>
      } @else if (!selectedCourseId()) {
        <div class="col-span-2">
          <div class="fieldset">
            <label for="date">Fecha por defecto</label>
            <input type="datetime-local" formControlName="date" class="input input-primary" />
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
export default class AssignmentForm implements OnInit {
  public data = input<{ courseId?: string }>();
  private fb = inject(NonNullableFormBuilder);
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private store = inject(Store);
  private toast = inject(Toast);

  public selectedCourseId = signal<string | null>(null);

  public courses = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.http.get<{ id: string; name: string }[]>(`/api/v1/courses/by-school/${schoolId}`);
    },
  });

  public courseGroups = rxResource({
    params: () => ({
      courseId: this.selectedCourseId(),
    }),
    stream: ({ params }) => {
      const { courseId } = params;
      if (!courseId) {
        return of([]);
      }
      return this.http.get<{ id: string; name: string }[]>(`/api/v1/class-groups/by-course/${courseId}`);
    },
  });

  public teachers = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      const { organizationId } = params;
      if (!organizationId) {
        return of([]);
      }
      return this.http.get<{ id: string; name: string }[]>(
        `/api/v1/teachers/by-organization/${organizationId}`,
      );
    },
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

  public form = this.fb.group({
    title: ['', [Validators.required]],
    details: [''],
    type: this.fb.control<AssignmentType>(AssignmentType.NEW, [Validators.required]),
    date: [this.defaultDate, [Validators.required]],
    requireSubmission: [false],
    teacherId: this.fb.control<string | null>(null, [Validators.required]),
    courseId: this.fb.control<string | null>(null, [Validators.required]),
    groupDates: this.fb.array<{ classGroupId: string; date: string }>([]),
  });

  get groupDatesArray(): FormArray {
    return this.form.get('groupDates') as FormArray;
  }

  getGroupDateControl(index: number): FormControl<string> {
    return this.groupDatesArray.at(index).get('date') as FormControl<string>;
  }

  constructor() {
    // Watch for course selection changes
    effect(() => {
      const groups = this.courseGroups.value();
      if (groups?.length) {
        this.buildGroupDatesArray(groups);
      }
    });
  }

  ngOnInit() {
    // Listen to courseId changes
    this.form.get('courseId')?.valueChanges.subscribe((courseId) => {
      this.selectedCourseId.set(courseId);
    });

    if (this.data()?.courseId) {
      this.form.get('courseId')?.setValue(this.data()!.courseId!);
      this.selectedCourseId.set(this.data()!.courseId!);
    }
    if (this.store.currentTeacher()) {
      this.form.get('teacherId')?.setValue(this.store.currentTeacher()!.id ?? '');
      this.form.get('teacherId')?.disable();
    }
  }

  private buildGroupDatesArray(groups: { id: string; name: string }[]) {
    this.groupDatesArray.clear();
    groups.forEach((group) => {
      this.groupDatesArray.push(
        this.fb.group({
          classGroupId: [group.id],
          date: [this.defaultDate, [Validators.required]],
        }),
      );
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario invalido');
      markGroupDirty(this.form);
      return;
    }

    const req = this.form.getRawValue();
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
