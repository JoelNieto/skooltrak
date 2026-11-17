import {
  Button,
  Card,
  Confirmation,
  Icon,
  Modal,
  PaginatorV2,
  Toast,
  UiField,
  UiFilterChip,
  UiFilterMenu,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  listState,
} from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounce, form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Prisma, StudyPlan } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
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
  imports: [
    Card,
    UiTable,
    UiSelect,
    Button,
    PaginatorV2,
    RouterLink,
    FormsModule,
    FormField,
    UiInputGroup,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiField,
    UiFilterChip,
    UiFilterMenu,
    UiTableToolbar,
  ],
  template: `<ui-table-toolbar label="Filtrar cursos">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input type="search" placeholder="Buscar curso" aria-label="Buscar curso" [formField]="form.searchText" />
      </label>
      <ui-filter-menu [activeCount]="form.studyPlanId().value() ? 1 : 0" (clear)="form.studyPlanId().value.set('')">
        <ui-field label="Plan de estudios">
          <select uiSelect [formField]="form.studyPlanId">
            <option value="">Todos los planes</option>
            @for (studyPlan of studyPlans.value(); track studyPlan.id) {
              <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
            }
          </select>
        </ui-field>
      </ui-filter-menu>
      <button uiToolbarEnd uiButton variant="primary" size="sm" type="button" (click)="editCourse()">
        <ui-icon name="circle-plus" class="text-base" /> Nuevo curso
      </button>
      @if (form.studyPlanId().value()) {
        <ng-container uiToolbarChips>
          <ui-filter-chip [label]="'Plan: ' + selectedStudyPlanName()" (remove)="form.studyPlanId().value.set('')" />
        </ng-container>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="courses.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Código</th>
            <th>Asignatura</th>
            <th>Plan de estudio</th>
            <th>Docente</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (coursesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="courses.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (course of coursesList.rows()?.data; track course.id) {
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
                        {{ course.teacher.firstName }} {{ course.teacher.fatherName }}
                      </a>
                    } @else {
                      --
                    }
                  </td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions(course)"
                      [label]="'Acciones para ' + course.name"
                      (action)="onRowAction($event, course)"
                    />
                  </td>
                </tr>
              } @empty {
                @if (form.searchText().value()) {
                  <tr
                    uiTableEmpty
                    [columns]="7"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún resultado coincide con la búsqueda."
                  ></tr>
                } @else {
                  <tr uiTableEmpty [columns]="7" icon="book-open" title="Aún no hay cursos"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      <div class="p-4 rounded-b-lg ">
        <lib-paginator
          [total]="total()"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>
    </div> `,
})
export default class Courses {
  /** Name of the selected filter, for its chip. */
  protected readonly selectedStudyPlanName = computed(
    () => (this.studyPlans.value() ?? []).find((x) => x.id === this.form.studyPlanId().value())?.name ?? '',
  );
  #modal = inject(Modal);
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #store = inject(Store);
  #toast = inject(Toast);

  private formModel = signal<{ searchText: string; studyPlanId: string }>({
    searchText: '',
    studyPlanId: '',
  });

  public form = form(this.formModel, (f) => {
    debounce(f.searchText, 400);
  });

  public total = computed(() => this.coursesList.rows()?.meta.total ?? 0);

  public page = signal(1);
  public pageSize = signal(10);

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

  public courses = httpResource<PaginatedResponse<CourseType>>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) {
      return undefined;
    }
    return {
      url: '/api/v1/courses',
      params: toFetchQueryRecord({
        schoolId,
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.form.searchText().value(),
        studyPlanId: this.form.studyPlanId().value(),
      }),
    };
  });
  /** courses with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly coursesList = listState(this.courses);

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

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(course: CourseType): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/courses', course.id] },
      { id: 'edit', label: 'Editar', icon: 'pencil' },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, course: CourseType): void {
    switch (action) {
      case 'edit':
        this.editCourse(course);
        break;
      case 'delete':
        this.deleteCourse(course);
        break;
    }
  }
}
