import {
  Badge,
  BadgeTone,
  Breadcrumbs,
  Card,
  CardBody,
  CardTitle,
  CourseCover,
  EmptyState,
  Icon,
  Loader,
  UiField,
  UiInputGroup,
  UiSelect,
} from '#/ui';
import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/** `GET /api/v1/courses/mine` (ACA-001-S02). */
interface MyCourses {
  periods: { id: string; name: string }[];
  periodId: string | null;
  classGroup: { id: string; name: string } | null;
  courses: {
    id: string;
    name: string;
    color: string;
    subject: { name: string; icon: string | null };
    teacher: { name: string; initials: string; color: string | null } | null;
    schedule: string | null;
    average: number | null;
    band: 'AL_DIA' | 'EN_RIESGO' | null;
    scale: { maximum: number; minimumApproval: number } | null;
  }[];
}

const BAND: Record<'AL_DIA' | 'EN_RIESGO', { label: string; tone: BadgeTone }> = {
  AL_DIA: { label: 'Al día', tone: 'success' },
  EN_RIESGO: { label: 'En riesgo', tone: 'danger' },
};

/**
 * A student's *Mis cursos* (ACA-001-S02, FR .4 .5): one card per enrolled course with its schedule,
 * teacher and period average. *Próxima entrega* and progress come in S03.
 */
@Component({
  selector: 'app-my-courses',
  imports: [
    Badge,
    Breadcrumbs,
    Card,
    CardBody,
    CardTitle,
    CourseCover,
    DecimalPipe,
    EmptyState,
    FormsModule,
    Icon,
    Loader,
    RouterLink,
    UiField,
    UiInputGroup,
    UiSelect,
  ],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos' }]" />
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <h1 class="me-auto text-2xl font-semibold">Mis cursos</h1>
      <label uiInputGroup class="w-64!">
        <ui-icon name="search" />
        <input type="search" placeholder="Buscar..." aria-label="Buscar curso" [(ngModel)]="search" />
      </label>
      @if (mine.value()?.periods?.length) {
        <ui-field label="Periodo" class="w-48">
          <select uiSelect [ngModel]="mine.value()?.periodId ?? ''" (ngModelChange)="periodId.set($event)">
            @for (period of mine.value()!.periods; track period.id) {
              <option [value]="period.id">{{ period.name }}</option>
            }
          </select>
        </ui-field>
      }
    </div>

    @if (mine.isLoading() && !mine.hasValue()) {
      <lib-loader />
    } @else if (mine.error()) {
      <lib-empty-state
        title="No se pudieron cargar tus cursos"
        description="Inténtalo de nuevo más tarde."
        icon="circle-alert"
      />
    } @else if (mine.value(); as data) {
      @if (!data.courses.length) {
        <lib-empty-state
          [title]="data.classGroup ? 'No tienes cursos inscritos' : 'Aún no tienes grupo asignado'"
          [description]="
            data.classGroup
              ? 'Cuando te inscriban en un curso, aparecerá aquí.'
              : 'Tu colegio aún no te asigna a un grupo.'
          "
          icon="book-open"
        />
      } @else {
        <ul class="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Mis cursos">
          @for (course of visible(); track course.id) {
            <li>
              <a uiCard [routerLink]="['/courses', course.id]" class="group block h-full overflow-hidden">
                <ui-course-cover [color]="course.color" [icon]="course.subject.icon" />
                <div uiCardBody class="gap-3 p-4">
                  <h2 uiCardTitle class="text-base">{{ course.name }}</h2>
                  @if (course.schedule) {
                    <p class="flex items-center gap-1.5 text-sm text-ink-muted">
                      <ui-icon name="calendar-days" class="text-base" />
                      {{ course.schedule }}
                    </p>
                  }
                  <div class="flex items-center gap-2 text-sm text-ink">
                    @if (course.teacher) {
                      <div class="avatar avatar-placeholder" aria-hidden="true">
                        <div
                          class="w-7 rounded-full text-white"
                          [style.background]="course.teacher.color ?? 'var(--ui-ink-subtle)'"
                        >
                          <span class="text-xs">{{ course.teacher.initials }}</span>
                        </div>
                      </div>
                      {{ course.teacher.name }}
                    } @else {
                      <span class="text-ink-muted">Sin docente asignado</span>
                    }
                  </div>
                  <div class="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                    <span class="text-xs text-ink-muted">Promedio</span>
                    @if (!course.scale) {
                      <span class="text-xs text-ink-muted">Escala de notas no configurada</span>
                    } @else if (course.average === null) {
                      <span class="text-sm text-ink-muted">Sin notas</span>
                    } @else {
                      <span class="flex items-center gap-2">
                        <span class="font-semibold tabular-nums text-ink-strong">
                          {{ course.average | number: '1.1-1' }}
                          <span class="text-xs font-normal text-ink-muted">/ {{ course.scale.maximum }}</span>
                        </span>
                        @if (course.band) {
                          <span uiBadge size="sm" [tone]="band[course.band].tone">{{ band[course.band].label }}</span>
                        }
                      </span>
                    }
                  </div>
                </div>
              </a>
            </li>
          } @empty {
            <li class="col-span-full">
              <lib-empty-state
                title="No se encontraron cursos"
                description="Ningún curso coincide con la búsqueda."
                icon="search"
              />
            </li>
          }
        </ul>
      }
    }
  `,
})
export default class MyCoursesPage {
  protected readonly band = BAND;
  /** '' = the API's default (the current period). */
  protected readonly periodId = signal('');
  protected readonly search = signal('');

  protected readonly mine = httpResource<MyCourses>(() => {
    const params: Record<string, string> = {};
    if (this.periodId()) params['periodId'] = this.periodId();
    return { url: '/api/v1/courses/mine', params };
  });

  protected readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const courses = this.mine.value()?.courses ?? [];
    return q
      ? courses.filter((c) => c.name.toLowerCase().includes(q) || c.subject.name.toLowerCase().includes(q))
      : courses;
  });
}
