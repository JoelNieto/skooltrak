import { Confirmation, Modal, Paginator, Toast } from '@/ui';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap, tap } from 'rxjs';
import Store from '../../core/store';
import CoursesForm from '../forms/courses-form';

@Component({
  selector: 'app-courses',
  imports: [NgIcon, Paginator],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorTrashDuotone,
      phosphorPencilDuotone,
    }),
  ],
  template: `<div class="flex justify-end">
      <button class="btn btn-primary" (click)="editCourse()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo curso
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Código</th>
            <th>Asignatura</th>
            <th>Plan de estudio</th>
            <th>Periodo actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (course of courses.value(); track course.id) {
          <tr>
            <td>{{ course.name }}</td>
            <td>{{ course.shortName }}</td>
            <td>{{ course.code }}</td>
            <td>{{ course.subject.name }}</td>
            <td>{{ course.studyPlan.name }}</td>
            <td>{{ course.currentPeriod?.name }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-xs btn-soft"
                  (click)="editCourse(course)"
                >
                  <ng-icon name="phosphorPencilDuotone" />
                  Editar
                </button>
                <button
                  class="btn btn-error btn-xs btn-soft"
                  (click)="deleteCourse(course)"
                >
                  <ng-icon name="phosphorTrashDuotone" />
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
          [count]="pagination().count"
          [take]="pagination().take"
          [skip]="pagination().skip"
          (skipChange)="updateSkip($event)"
          (takeChange)="updateTake($event)"
        />
      </div>
    </div> `,
})
export default class Courses {
  #modal = inject(Modal);
  #apollo = inject(Apollo);
  #confirmation = inject(Confirmation);
  #store = inject(Store);
  #toast = inject(Toast);

  public updateSkip(skip: number) {
    this.pagination.update((prev) => ({ ...prev, skip }));
  }

  public updateTake(take: number) {
    this.pagination.update((prev) => ({ ...prev, take }));
  }
  public take = computed(() => this.pagination().take);
  public skip = computed(() => this.pagination().skip);

  public pagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });

  public courses = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
      take: this.take(),
      skip: this.skip(),
    }),
    stream: ({ params }) => {
      const { schoolId, take, skip } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          count: number;
          courses: Prisma.CourseGetPayload<{
            include: { subject: true; studyPlan: true; currentPeriod: true };
          }>[];
        }>({
          query: gql`
            query getCourses($schoolId: String!, $take: Int!, $skip: Int!) {
              count: coursesCount(schoolId: $schoolId)
              courses(schoolId: $schoolId, take: $take, skip: $skip) {
                id
                name
                shortName
                schoolId
                subject {
                  name
                }
                studyPlan {
                  name
                }
                currentPeriod {
                  name
                }
                currentPeriodId
                subjectId
                studyPlanId
                code
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId,
            take,
            skip,
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.pagination.update((prev) => ({
              ...prev,
              count: result.data.count,
            }));
          }),
          map((result) => result.data.courses)
        );
    },
  });

  public editCourse(
    course?: Prisma.CourseGetPayload<{
      include: { subject: true; studyPlan: true };
    }>
  ) {
    this.#modal
      .open(CoursesForm, {
        title: course ? 'Editar Curso' : 'Agregar Curso',
        data: {
          course,
        },
      })
      .closed.subscribe(() => {
        this.courses.reload();
      });
  }

  public deleteCourse(course: Prisma.CourseGetPayload<false>) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Curso',
        message: `¿Estás seguro de eliminar el curso ${course.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.#apollo.mutate({
            mutation: gql`
              mutation RemoveCourse($removeCourseId: String!) {
                removeCourse(id: $removeCourseId) {
                  id
                }
              }
            `,
            variables: {
              removeCourseId: course.id,
            },
          })
        )
      )
      .subscribe({
        next: () => {
          this.courses.reload();
          this.#toast.showSuccess('Curso eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar el curso');
        },
      });
  }
}
