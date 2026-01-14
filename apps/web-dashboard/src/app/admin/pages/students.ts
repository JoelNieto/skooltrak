import { Confirmation, Modal, Pagination, Paginator, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';

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
  imports: [
    DatePipe,
    RouterLink,
    Paginator,
    Paginator,
    FormsModule,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
  providers: [Pagination],

  template: `<div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
          <span class="material-symbols-outlined">search</span>
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
        <span class="material-symbols-outlined">add_circle</span> Agregar Alumno
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
              {{ student.name }}
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
              <button
                class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                ngMenuTrigger
                #origin
                #trigger="ngMenuTrigger"
                [menu]="actionsMenu()"
              >
                <span class="material-symbols-outlined text-xl"
                  >more_horiz</span
                >
              </button>
              <ng-template
                [cdkConnectedOverlayOpen]="trigger.expanded()"
                [cdkConnectedOverlay]="{origin, usePopover: 'inline'}"
                [cdkConnectedOverlayPositions]="[
                  {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                    offsetY: 4
                  }
                ]"
                cdkAttachPopoverAsChild
              >
                <div
                  ngMenu
                  class="bg-base-100 shadow-sm rounded-lg p-1 w-48"
                  #actionsMenu="ngMenu"
                >
                  <ng-template ngMenuContent>
                    <a
                      ngMenuItem
                      value="view"
                      [routerLink]="['/students', student.id]"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                    >
                      <span class="material-symbols-outlined text-lg"
                        >visibility</span
                      >
                      <span>Ver</span>
                    </a>
                    <button
                      ngMenuItem
                      value="edit"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="editStudent(student)"
                    >
                      <span class="material-symbols-outlined text-lg"
                        >edit</span
                      >
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteStudent(student)"
                    >
                      <span class="material-symbols-outlined text-lg"
                        >delete</span
                      >
                      <span>Eliminar</span>
                    </button>
                  </ng-template>
                </div>
              </ng-template>
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
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
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
