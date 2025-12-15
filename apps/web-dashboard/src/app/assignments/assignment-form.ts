import { markGroupDirty, TextEditor, Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { $Enums, Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { map, of } from 'rxjs';
import Store from '../core/store';

type Teacher = Prisma.TeacherGetPayload<false> & {
  name: string;
  fullName: string;
};

@Component({
  selector: 'app-assignment-form',
  imports: [ReactiveFormsModule, TextEditor],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-4">
      <div class="fieldset col-span-2">
        <label for="title">Titulo</label>
        <input
          type="text"
          formControlName="title"
          class="input input-primary"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="details">Detalles</label>
        <lib-text-editor formControlName="details" [bordered]="true" />
      </div>
      <div class="fieldset col-span-2">
        <label for="courseId">Curso</label>
        <select formControlName="courseId" class="select select-primary">
          <option disabled selected [value]="null">Seleccionar curso</option>
          @for(course of courses.value(); track course.id) {
          <option [value]="course.id">{{ course.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="type">Tipo</label>
        <select formControlName="type" class="select select-primary">
          @for(type of types; track type.value) {
          <option [value]="type.value">{{ type.label }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="date">Fecha</label>
        <input
          type="datetime-local"
          formControlName="date"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="teacherId">Profesor</label>
        <select formControlName="teacherId" class="select select-primary">
          <option disabled selected [value]="null">Seleccionar profesor</option>
          @for(teacher of teachers.value(); track teacher.id) {
          <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="requireSubmission">Requiere envio</label>
        <input
          type="checkbox"
          formControlName="requireSubmission"
          class="checkbox checkbox-primary"
        />
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit()">
        Cancelar
      </button>
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class AssignmentForm implements OnInit {
  public data = input<{ courseId?: string }>();
  private fb = inject(NonNullableFormBuilder);
  public closeModal = output<void>();
  private apollo = inject(Apollo);
  private store = inject(Store);
  private toast = inject(Toast);

  public courses = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          coursesBySchoolId: Prisma.CourseGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query coursesBySchoolId($schoolId: String!) {
              coursesBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.coursesBySchoolId));
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
      return this.apollo
        .watchQuery<{
          teachersByOrganizationId: Teacher[];
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
          map((result) =>
            result.data.teachersByOrganizationId.sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          )
        );
    },
  });

  public types = [
    { label: 'Nuevo', value: $Enums.AssignmentType.NEW },
    { label: 'Tarea', value: $Enums.AssignmentType.HOMEWORK },
    { label: 'Examen', value: $Enums.AssignmentType.EXAM },
    { label: 'Proyecto', value: $Enums.AssignmentType.PROJECT },
    { label: 'Quiz', value: $Enums.AssignmentType.QUIZ },
    { label: 'Ensayo', value: $Enums.AssignmentType.PAPER },
  ];

  public form = this.fb.group({
    title: ['', [Validators.required]],
    details: [''],
    type: this.fb.control<$Enums.AssignmentType>($Enums.AssignmentType.NEW, [
      Validators.required,
    ]),
    date: [
      format(
        addDays(setMinutes(setHours(new Date(), 8), 0), 1),
        "yyyy-MM-dd'T'HH:mm"
      ),
      [Validators.required],
    ],
    requireSubmission: [false],
    teacherId: this.fb.control<string | null>(null, [Validators.required]),
    courseId: this.fb.control<string | null>(null, [Validators.required]),
  });

  ngOnInit() {
    if (this.data()?.courseId)
      this.form.get('courseId')?.setValue(this.data()!.courseId!);
    if (this.store.currentTeacher()) {
      this.form.get('teacherId')?.setValue(this.store.currentTeacher()!.id);
      this.form.get('teacherId')?.disable();
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario invalido');
      markGroupDirty(this.form);
      return;
    }

    const req = this.form.getRawValue();
    this.apollo
      .mutate({
        mutation: gql`
          mutation CreateAssignment(
            $createAssignmentInput: CreateAssignmentInput!
          ) {
            createAssignment(createAssignmentInput: $createAssignmentInput) {
              id
            }
          }
        `,
        variables: {
          createAssignmentInput: {
            ...req,
            date: new Date(req.date),
            schoolId: this.store.currentSchoolId(),
          },
        },
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Tarea creada exitosamente');
          this.closeModal.emit();
        },
        error: () => {
          this.toast.showError('Error al crear la tarea');
        },
      });
  }
}
