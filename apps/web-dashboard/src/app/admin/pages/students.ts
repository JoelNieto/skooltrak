import { Confirmation, Modal, Pagination, Paginator, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorMagnifyingGlassDuotone,
  phosphorPlusCircleDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap, tap } from 'rxjs';
import StudentsForm from '../forms/students-form';

type Student = Prisma.StudentGetPayload<{
  include: { classGroup: true; user: true };
}> & {
  name: string;
  email: string;
};

@Component({
  imports: [DatePipe, RouterLink, Paginator, NgIcon, FormsModule],
  providers: [Pagination],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorMagnifyingGlassDuotone,
    }),
  ],
  template: `<div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
          <ng-icon name="phosphorMagnifyingGlassDuotone" />
          <input
            class="pl-0"
            type="search"
            placeholder="Buscar..."
            [(ngModel)]="searchText"
            (input)="pagination.updateSearch($event.target.value)"
          />
        </label>
      </div>
      <button class="btn btn-primary" (click)="editStudent()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Agregar Alumno
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
            <td>
              <a
                class="badge badge-primary badge-sm badge-soft"
                [routerLink]="['/groups', student.classGroupId]"
                >{{ student.classGroup.name }}</a
              >
            </td>
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
      <div class="p-4 rounded-b-lg ">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
        />
      </div>
    </div> `,
})
export default class Students {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public pagination = inject(Pagination);
  public students = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
    stream: ({ params }) => {
      const { take, skip, search, orderBy, orderDirection } = params;
      return this.apollo
        .watchQuery<{ count: number; students: Student[] }>({
          query: gql`
            query getStudents(
              $take: Int!
              $skip: Int!
              $search: String
              $orderBy: String
              $orderDirection: String
            ) {
              count: findManyStudentsCount(search: $search)
              students(
                take: $take
                skip: $skip
                search: $search
                orderBy: $orderBy
                orderDirection: $orderDirection
              ) {
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
            take,
            skip,
            search,
            orderBy,
            orderDirection,
          },
        })
        .valueChanges.pipe(
          tap(({ data }) => {
            this.pagination.updateCount(data.count);
          }),
          map((result) => result.data.students)
        );
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
