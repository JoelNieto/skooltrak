import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import StudentsForm from '../forms/students-form';

type Student = Prisma.StudentGetPayload<{
  include: { classGroup: true; user: true };
}> & {
  name: string;
  email: string;
};

@Component({
  imports: [DatePipe, RouterLink],
  template: `<div class="flex justify-end">
      <button class="btn btn-primary" (click)="editStudent()">
        Agregar Alumno
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg border border-base-300 mt-4"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Documento</th>
            <th>Grupo</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for(student of students.value(); track student.id) {
          <tr>
            <td>
              <a
                class="link link-primary"
                [routerLink]="['/students', student.id]"
                >{{ student.name }}</a
              >
            </td>
            <td>{{ student.email }}</td>
            <td>{{ student.documentId }}</td>
            <td>{{ student.classGroup.name }}</td>
            <td>{{ student.createdAt | date : 'short' }}</td>
            <td>{{ student.updatedAt | date : 'short' }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-xs btn-soft"
                  (click)="editStudent(student)"
                >
                  Editar
                </button>
                <button
                  class="btn btn-error btn-xs btn-soft"
                  (click)="deleteStudent(student)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div> `,
})
export default class Students {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private store = inject(Store);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public students = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ studentsBySchoolId: Student[] }>({
          query: gql`
            query StudentsBySchoolId($schoolId: String!) {
              studentsBySchoolId(schoolId: $schoolId) {
                id
                name
                firstName
                middleName
                motherName
                birthDate
                gender
                fatherName
                documentId
                email
                classGroupId
                phone
                address
                classGroup {
                  name
                }
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.studentsBySchoolId));
    },
  });

  public editStudent(
    student?: Prisma.StudentGetPayload<{ include: undefined }>
  ) {
    this.modal
      .open(StudentsForm, {
        title: student ? 'Editar Alumno' : 'Nuevo Alumno',
        data: {
          student,
        },
      })
      .closed.subscribe(() => {
        this.students.reload();
      });
  }

  public deleteStudent(student: Student) {
    this.confirmation
      .confirm({
        title: 'Eliminar Alumno',
        message: `¿Estás seguro de eliminar al alumno ${student.name}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.apollo.mutate({
            mutation: gql`
              mutation RemoveStudent($id: String!) {
                removeStudent(id: $id) {
                  id
                }
              }
            `,
            variables: {
              id: student.id,
            },
          })
        )
      )
      .subscribe({
        next: () => {
          this.students.reload();
          this.toasts.showSuccess('Alumno eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toasts.showError('Error al eliminar el alumno');
        },
      });
  }
}
