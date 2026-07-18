import { Confirmation, Modal, Paginator, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma, StudyPlan } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import Store from '../../core/store';
import CoursesForm from '../forms/courses-form';

type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
};

type CourseType = Prisma.CourseGetPayload<{
  include: { subject: true; studyPlan: true };
}> & {
  teacher: Teacher;
};

@Component({
  selector: 'app-courses',
  imports: [Paginator, RouterLink, FormsModule, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  template: `<div class="flex justify-between">
      <div class="flex gap-2">
        <div class="md:w-96 w-full">
          <label class="input input-primary ">
            <span class="material-symbols-outlined">search</span>
            <input class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
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
        <span class="material-symbols-outlined">add_circle</span> Nuevo curso
      </button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Código</th>
            <th>Asignatura</th>
            <th>Plan de estudio</th>
            <th>Docente</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (course of courses.value(); track course.id) {
            <tr>
              <td>
                {{ course.name }}
              </td>
              <td>{{ course.shortName }}</td>
              <td>{{ course.code }}</td>
              <td>{{ course.subject.name }}</td>
              <td>{{ course.studyPlan.name }}</td>
              <td>
                @if (course.teacher) {
                  <a [routerLink]="['/teachers', course.teacher.id]" class="link link-primary">
                    {{ course.teacher.name }}
                  </a>
                } @else {
                  --
                }
              </td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="actionsMenu()"
                >
                  <span class="material-symbols-outlined text-xl">more_horiz</span>
                </button>
                <ng-template
                  [cdkConnectedOverlayOpen]="trigger.expanded()"
                  [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
                  [cdkConnectedOverlayPositions]="[
                    {
                      originX: 'end',
                      originY: 'bottom',
                      overlayX: 'end',
                      overlayY: 'top',
                      offsetY: 4,
                    },
                  ]"
                  cdkAttachPopoverAsChild
                >
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <a
                        ngMenuItem
                        value="view"
                        [routerLink]="['/courses', course.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      <button
                        ngMenuItem
                        value="edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editCourse(course)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteCourse(course)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
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
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #store = inject(Store);
  #toast = inject(Toast);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
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

  public studyPlans = httpResource<StudyPlan[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) {
        return undefined;
      }
      return {
        url: '/api/v1/study-plans/by-school',
        params: { schoolId },
      };
    },
    { defaultValue: [] },
  );

  public courses = httpResource<CourseType[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) {
        return undefined;
      }
      return {
        url: '/api/v1/courses',
        params: toFetchQueryRecord({
          schoolId,
          take: this.take(),
          skip: this.skip(),
          search: this.searchText(),
          studyPlanId: this.studyPlanId() ?? undefined,
        }),
      };
    },
    { defaultValue: [] },
  );

  private readonly coursesCount = httpResource<number>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) {
      return undefined;
    }
    return {
      url: '/api/v1/courses/count',
      params: toFetchQueryRecord({
        schoolId,
        take: this.take(),
        skip: this.skip(),
        search: this.searchText(),
        studyPlanId: this.studyPlanId() ?? undefined,
      }),
    };
  });

  constructor() {
    effect(() => {
      const count = this.coursesCount.value();
      if (count != null) {
        this.pagination.update((prev) => ({ ...prev, count }));
      }
    });
  }

  public editCourse(
    course?: Prisma.CourseGetPayload<{
      include: { subject: true; studyPlan: true };
    }>,
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
        switchMap(() => this.#http.delete(`/api/v1/courses/${course.id}`)),
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
