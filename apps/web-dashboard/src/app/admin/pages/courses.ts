import { Confirmation, Modal, Paginator, Toast } from '@/ui';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorMagnifyingGlassDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap, tap } from 'rxjs';
import Store from '../../core/store';
import CoursesForm from '../forms/courses-form';
type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
};

type CourseType = Prisma.CourseGetPayload<{
  include: { subject: true; studyPlan: true; currentPeriod: true };
}> & {
  teacher: Teacher;
};

@Component({
  selector: 'app-courses',
  imports: [NgIcon, Paginator, RouterLink, FormsModule],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorTrashDuotone,
      phosphorPencilDuotone,
      phosphorMagnifyingGlassDuotone,
    }),
  ],
  template: `<div class="flex justify-between">
      <div class="flex gap-2">
        <div class="md:w-96 w-full">
          <label class="input input-primary ">
            <ng-icon name="phosphorMagnifyingGlassDuotone" />
            <input
              class="pl-0"
              type="search"
              placeholder="Buscar..."
              [(ngModel)]="searchText"
            />
          </label>
        </div>
        <select class="select select-primary" [(ngModel)]="studyPlanId">
          <option [ngValue]="null">Elija nivel...</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
          <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>

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
            <th>Docente</th>
            <th>Periodo actual</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (course of courses.value(); track course.id) {
          <tr>
            <td>
              <a
                class="link link-primary"
                [routerLink]="['/courses', course.id]"
                >{{ course.name }}</a
              >
            </td>
            <td>{{ course.shortName }}</td>
            <td>{{ course.code }}</td>
            <td>{{ course.subject.name }}</td>
            <td>{{ course.studyPlan.name }}</td>
            <td>
              @if(course.teacher) {
              <a
                [routerLink]="['/teachers', course.teacher.id]"
                class="link link-primary"
              >
                {{ course.teacher.name }}
              </a>
              } @else { -- }
            </td>
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
  public searchText = signal('');
  public studyPlanId = signal<string | null>(null);

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

  public studyPlans = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          studyPlansBySchoolId: Prisma.StudyPlanGetPayload<{
            include: { degree: true; school: true; gradeMetric: true };
          }>[];
        }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  public courses = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
      search: this.searchText(),
      studyPlanId: this.studyPlanId(),
      take: this.take(),
      skip: this.skip(),
    }),
    stream: ({ params }) => {
      const { schoolId, take, skip, search, studyPlanId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          count: number;
          courses: CourseType[];
        }>({
          query: gql`
            query getCourses(
              $schoolId: String!
              $take: Int!
              $skip: Int!
              $search: String
              $studyPlanId: String
            ) {
              count: coursesCount(
                schoolId: $schoolId
                studyPlanId: $studyPlanId
                search: $search
              )
              courses(
                schoolId: $schoolId
                take: $take
                skip: $skip
                studyPlanId: $studyPlanId
                search: $search
              ) {
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
                teacher {
                  id
                  name
                }
                currentPeriodId
                subjectId
                studyPlanId
                teacherId
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
            search,
            studyPlanId,
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
