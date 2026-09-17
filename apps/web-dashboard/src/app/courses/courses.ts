import { debounceSignal, EmptyState, Loader, Pagination, PaginatorV2 } from '#/ui';
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
  teacher?: { firstName?: string; fatherName?: string; name?: string };
};

@Component({
  selector: 'app-courses',
  imports: [RouterLink, Loader, PaginatorV2, FormsModule, EmptyState],
  providers: [Pagination],

  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Cursos</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Cursos</h1>
    <label class="input input-primary input-lg">
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
          <a
            [routerLink]="['/courses', course.id]"
            class="group card bg-base-100 hover:shadow hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <figure class="relative overflow-hidden">
              <img
                src="course-default.jpg"
                alt="Course"
                class="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
              <span class="absolute bottom-2 left-2 badge badge-sm badge-primary">
                {{ course.studyPlan?.name }}
              </span>
            </figure>
            <div class="card-body p-3">
              <h2 class="card-title text-sm line-clamp-2">{{ course.subject?.name }}</h2>
              @if (course.teacher?.name) {
                <p class="text-xs text-base-content/60 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">person</span>
                  {{ course.teacher?.name }}
                </p>
              } @else {
                <p class="text-xs text-base-content/60 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">person</span>
                  Sin docente asignado
                </p>
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
    (this.coursesListResource.value()?.data ?? []).map((c) => ({
      ...c,
      teacher: c.teacher
        ? {
            ...c.teacher,
            name: c.teacher.name ?? `${c.teacher.firstName ?? ''} ${c.teacher.fatherName ?? ''}`.trim(),
          }
        : c.teacher,
    })),
  );

  constructor() {
    this.#debouncedSearch = debounceSignal(this.searchText, 400);
  }
}
