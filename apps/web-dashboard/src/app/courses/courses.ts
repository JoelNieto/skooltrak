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
                 <div class="text-xs text-base-content/60 flex items-center gap-1">
                   @if (course.teacher?.avatarUrl) {
                     <img [src]="course.teacher.avatarUrl" [alt]="course.teacher.name" class="w-7 h-7 rounded-full object-cover" />
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
                 <div class="text-xs text-base-content/60 flex items-center gap-1">
                   <div class="avatar avatar-placeholder">
                     <div class="text-white w-7 rounded-full" [style.background]="course.teacher?.color ?? '#6B7280'">
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
    const color = teacher.color ?? '#4F46E5'; // Indigo-600

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
