import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardTitle,
  debounceSignal,
  EmptyState,
  Loader,
  Pagination,
  PaginatorV2,
  UiInputGroup,
} from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';
import Store from '../core/store';

type CourseRow = {
  id: string;
  subject?: { name?: string };
  studyPlan?: { name?: string };
  teacher?: {
    firstName?: string;
    fatherName?: string;
    name?: string;
    initials?: string;
    color?: string;
    avatarUrl?: string;
  };
};

@Component({
  selector: 'app-courses',
  imports: [
    Breadcrumbs,
    Badge,
    Card,
    CardBody,
    CardTitle,
    RouterLink,
    Loader,
    PaginatorV2,
    FormsModule,
    EmptyState,
    UiInputGroup,
  ],
  providers: [Pagination],

  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos' }]" />
    <h1 class="text-2xl font-semibold mb-2">Cursos</h1>
    <label uiInputGroup size="lg">
      <span class="material-symbols-outlined">search</span>
      <input class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
    </label>
    @if (coursesListResource.isLoading()) {
      <lib-loader />
    }
    @if (coursesListResource.error()) {
      <p>Error al cargar cursos</p>
    }
    @if (coursesListResource.hasValue()) {
      <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
        @for (course of courses(); track course.id) {
          <a uiCard [routerLink]="['/courses', course.id]" class="group overflow-hidden">
            <figure class="relative overflow-hidden">
              <img
                src="course-default.jpg"
                alt="Course"
                class="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
              <span uiBadge tone="action" size="sm" class="absolute bottom-2 left-2">
                {{ course.studyPlan?.name }}
              </span>
            </figure>
            <div uiCardBody class="p-3">
              <h2 uiCardTitle class="text-sm line-clamp-2">{{ course.subject?.name }}</h2>
              @if (course.teacher?.name) {
                <div class="text-xs text-ink-muted flex items-center gap-1">
                  @if (course.teacher?.avatarUrl) {
                    <img
                      [src]="course.teacher.avatarUrl"
                      [alt]="course.teacher.name"
                      class="w-7 h-7 rounded-full object-cover"
                    />
                  } @else {
                    <div class="avatar avatar-placeholder">
                      <div class="text-white w-7 rounded-full" [style.background]="course.teacher.color">
                        <span class="text-xs">{{ course.teacher.initials }}</span>
                      </div>
                    </div>
                  }
                  {{ course.teacher?.name }}
                </div>
              } @else {
                <div class="text-xs text-ink-muted flex items-center gap-1">
                  <div class="avatar avatar-placeholder">
                    <div
                      class="text-white w-7 rounded-full"
                      [style.background]="course.teacher?.color ?? 'var(--ui-ink-subtle)'"
                    >
                      <span class="text-xs">?</span>
                    </div>
                  </div>
                  Sin docente asignado
                </div>
              }
            </div>
          </a>
        } @empty {
          <div class="col-span-full">
            <lib-empty-state
              [title]="'No se encontraron cursos'"
              [description]="'No se encontraron cursos para la búsqueda'"
              [icon]="'search'"
            />
          </div>
        }
      </div>
    }
    <div class="flex justify-end mt-4">
      <lib-paginator
        [total]="total()"
        [page]="page()"
        [pageSize]="pageSize()"
        (pageChange)="page.set($event)"
        (pageSizeChange)="pageSize.set($event)"
      />
    </div>
  `,
})
export default class Courses {
  #store = inject(Store);
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;
  total = computed(() => this.coursesListResource.value()?.meta.total ?? 0);

  public page = signal<number>(1);
  public pageSize = signal<number>(12);

  protected coursesListResource = httpResource<PaginatedResponse<CourseRow>>(() => {
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
        search: this.#debouncedSearch(),
      }),
    };
  });

  protected courses = computed(() =>
    (this.coursesListResource.value()?.data ?? []).map((c) => {
      const teacher = c.teacher;
      if (!teacher) return c;

      const firstName = teacher.firstName ?? '';
      const fatherName = teacher.fatherName ?? '';
      const name = teacher.name ?? `${firstName} ${fatherName}`.trim();
      const initials = `${(firstName || '?').charAt(0)}${(fatherName || '?').charAt(0)}`.toUpperCase();
      // Use the teacher's color if available, otherwise a default
      const color = teacher.color ?? 'var(--ui-ink-subtle)';

      return {
        ...c,
        teacher: {
          ...teacher,
          name,
          initials,
          color,
          // avatarUrl is preserved from the original teacher object via spread
        },
      };
    }),
  );

  constructor() {
    this.#debouncedSearch = debounceSignal(this.searchText, 400);
  }
}
