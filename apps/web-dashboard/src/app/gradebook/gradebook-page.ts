import { Card, CardBody, EmptyState, Icon, Loader, PageHeader, UiField, UiSelect } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Store from '../core/store';
import GradebookGrid from './gradebook-grid';

/** `GET /api/v1/gradebook/courses` (FR-ASM-001.1). Last graded first. */
interface GradebookCourses {
  courses: { id: string; name: string; lastGradedAt: string | null }[];
}

/**
 * Sidebar *Libro de calificaciones* (`/teacher/gradebook`, FR-ASM-001.1): opens the course graded
 * most recently, with a course switcher. With nothing graded yet, the teacher picks a course.
 * `?course=<id>` keeps the choice in the URL.
 */
@Component({
  selector: 'app-gradebook-page',
  imports: [Card, CardBody, EmptyState, FormsModule, GradebookGrid, Icon, Loader, PageHeader, RouterLink, UiField, UiSelect],
  template: `
    <lib-page-header
      title="Libro de calificaciones"
      [subtitle]="selected()?.name ?? 'Notas de tus cursos por periodo y grupo.'"
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Libro de calificaciones' }]"
    />

    @if (courses.isLoading()) {
      <lib-loader />
    } @else if (courses.error()) {
      <lib-empty-state
        title="No se pudieron cargar tus cursos"
        description="Inténtalo de nuevo más tarde."
        icon="circle-alert"
      />
    } @else if (!list().length) {
      <lib-empty-state
        title="No tienes cursos asignados"
        description="Cuando te asignen un curso, podrás calificarlo aquí."
        icon="book-open"
      />
    } @else if (selected(); as course) {
      <div uiCard>
        <div uiCardBody>
          <ui-field label="Curso" class="mb-4 w-72">
            <select uiSelect [ngModel]="course.id" (ngModelChange)="open($event)">
              @for (option of list(); track option.id) {
                <option [value]="option.id">{{ option.name }}</option>
              }
            </select>
          </ui-field>
          <app-gradebook-grid [courseId]="course.id" />
        </div>
      </div>
    } @else {
      <div uiCard>
        <div uiCardBody>
          <h2 class="type-heading-sm text-ink-strong">Elige un curso</h2>
          <ul class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Tus cursos">
            @for (option of list(); track option.id) {
              <li>
                <a
                  [routerLink]="[]"
                  [queryParams]="{ course: option.id }"
                  class="flex items-center gap-3 rounded-box border border-line px-4 py-3 hover:bg-surface-2"
                >
                  <ui-icon name="book-open" class="text-xl text-ink-muted" />
                  <span class="font-semibold text-ink-strong">{{ option.name }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
})
export default class GradebookPage {
  /** `?course=`, bound by the router. */
  public readonly course = input<string>();
  #store = inject(Store);
  #router = inject(Router);

  public readonly courses = httpResource<GradebookCourses>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: '/api/v1/gradebook/courses', params: { schoolId } };
  });

  protected readonly list = computed(() => this.courses.value()?.courses ?? []);

  /** The course in the URL, else the one graded last; none on a first visit (picker). */
  protected readonly selected = computed(() => {
    const list = this.list();
    const wanted = this.course();
    return list.find((c) => c.id === wanted) ?? list.find((c) => c.lastGradedAt !== null) ?? null;
  });

  open(courseId: string): void {
    this.#router.navigate([], { queryParams: { course: courseId } });
  }
}
