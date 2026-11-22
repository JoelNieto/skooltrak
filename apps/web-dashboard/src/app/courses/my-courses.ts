import {
  Badge,
  BadgeTone,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardTitle,
  CourseCover,
  EmptyState,
  Icon,
  Loader,
  Meter,
  StatCard,
  UiField,
  UiInputGroup,
  UiSelect,
} from '#/ui';
import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { ParentContext } from '../parent/parent-context.service';
import { ALL_AREAS, areaChips, inArea } from './course-areas';

/** `GET /api/v1/courses/mine` (ACA-001-S02, S03). */
interface MyCourses {
  timezone: string;
  periods: { id: string; name: string }[];
  periodId: string | null;
  classGroup: { id: string; name: string } | null;
  courses: {
    id: string;
    name: string;
    color: string;
    subject: { name: string; icon: string | null; area: string | null };
    teacher: { name: string; initials: string; color: string | null } | null;
    schedule: string | null;
    average: number | null;
    band: 'AL_DIA' | 'EN_RIESGO' | null;
    scale: { maximum: number; minimumApproval: number } | null;
    next: { assignmentId: string; title: string; dueAt: string; overdue: boolean } | null;
    progress: { done: number; total: number };
  }[];
  isCurrentPeriod: boolean;
  stats: {
    average: { value: number | null; previous: number | null; delta: number | null };
    week: { due: number; overdue: number };
    done: number;
    total: number;
  };
}

/** `GET /api/v1/home/parent/children` (HOM-001 FR .18), shared with the parent home. */
type ParentChild = {
  studentId: string;
  name: string;
  organizationId: string;
  classGroup: { id: string; name: string } | null;
  school: { id: string; name: string };
};
type ParentChildren = { firstName: string; defaultStudentId: string | null; children: ParentChild[] };

const BAND: Record<'AL_DIA' | 'EN_RIESGO', { label: string; tone: BadgeTone }> = {
  AL_DIA: { label: 'Al día', tone: 'success' },
  EN_RIESGO: { label: 'En riesgo', tone: 'danger' },
};

/**
 * A student's *Mis cursos* (ACA-001-S02–S04, FR .4–.7): a stats row, area chips, then one card per
 * enrolled course with its schedule, teacher, period average, *Próxima entrega* and progress. Parents
 * see the same for the child chosen in the switcher shared with the parent home (S05, FR .8).
 */
@Component({
  selector: 'app-my-courses',
  imports: [
    Badge,
    Breadcrumbs,
    Button,
    Card,
    CardBody,
    CardTitle,
    CourseCover,
    DecimalPipe,
    EmptyState,
    FormsModule,
    Icon,
    Loader,
    Meter,
    RouterLink,
    StatCard,
    UiField,
    UiInputGroup,
    UiSelect,
  ],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos' }]" />
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <h1 class="me-auto text-2xl font-semibold">{{ title() }}</h1>
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

    @if (isParent()) {
      @if (childrenRes.hasValue() && !children().length) {
        <lib-empty-state
          title="Sin hijos vinculados"
          description="Vincula a tus hijos con su código de matrícula para ver sus cursos."
          icon="users"
        />
      } @else if (children().length > 1) {
        <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Elegir hijo">
          @for (child of children(); track child.studentId) {
            <button
              uiButton
              size="sm"
              type="button"
              [variant]="child.studentId === childId() ? 'primary' : 'ghost'"
              [attr.aria-pressed]="child.studentId === childId()"
              (click)="selectChild(child)"
            >
              {{ child.name }}
            </button>
          }
        </div>
      }
    }
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
        <div class="mb-5 grid gap-4 md:grid-cols-3" role="group" aria-label="Resumen del periodo">
          <lib-stat-card
            label="Promedio del periodo"
            icon="chart-column"
            [value]="data.stats.average.value === null ? '—' : (data.stats.average.value | number: '1.1-1')!"
            [helper]="averageHelper(data.stats.average)"
          />
          <lib-stat-card
            label="Esta semana"
            icon="calendar-days"
            [value]="data.stats.week.due + ''"
            [helper]="
              data.stats.week.overdue
                ? data.stats.week.overdue === 1
                  ? '1 vencida'
                  : data.stats.week.overdue + ' vencidas'
                : 'entregas esta semana'
            "
            [color]="data.stats.week.overdue ? 'error' : 'primary'"
          />
          <lib-stat-card
            label="Completadas"
            icon="check-check"
            [value]="data.stats.done + ' de ' + data.stats.total"
            helper="asignaciones del periodo"
          />
        </div>
        @if (chips().length > 2) {
          <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por área">
            @for (chip of chips(); track chip.key) {
              <button
                uiButton
                size="sm"
                type="button"
                [variant]="area() === chip.key ? 'primary' : 'ghost'"
                [attr.aria-pressed]="area() === chip.key"
                (click)="area.set(chip.key)"
              >
                {{ chip.label }}
                <span class="text-xs opacity-75">{{ chip.count }}</span>
              </button>
            }
          </div>
        }
        <ul class="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Mis cursos">
          @for (course of visible(); track course.id) {
            <li>
              <a uiCard [routerLink]="['/courses', course.id]" class="group block h-full overflow-hidden">
                <ui-course-cover [color]="course.color" [icon]="course.subject.icon">
                  @if (course.subject.area) {
                    <span uiBadge size="sm" class="absolute top-2 right-2 bg-surface-1 text-ink-strong">{{
                      course.subject.area
                    }}</span>
                  }
                </ui-course-cover>
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
                  @if (data.isCurrentPeriod) {
                    <div class="rounded-box bg-surface-0 px-3 py-2 text-sm">
                      <span class="block text-xs text-ink-muted">Próxima entrega</span>
                      @if (course.next; as next) {
                        <span class="block truncate font-medium text-ink-strong">{{ next.title }}</span>
                        <span
                          class="block text-xs"
                          [class.text-error]="next.overdue"
                          [class.font-medium]="next.overdue"
                          [class.text-ink-muted]="!next.overdue"
                        >
                          {{ dueText(next, data.timezone) }}
                        </span>
                      } @else {
                        <span class="block text-ink-muted">Nada pendiente</span>
                      }
                    </div>
                  }
                  @if (course.progress.total) {
                    <ui-meter
                      [value]="course.progress.done"
                      [max]="course.progress.total"
                      [label]="course.progress.done + ' de ' + course.progress.total + ' completadas'"
                      tone="success"
                    />
                  }
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

  // ── ACA-001-S05: parents see the courses of the child chosen in the shared switcher (FR .8) ──
  #auth = inject(Auth);
  #ctx = inject(ParentContext);
  protected readonly isParent = this.#auth.isParent;
  protected readonly childrenRes = httpResource<ParentChildren>(() =>
    this.isParent() ? '/api/v1/home/parent/children' : undefined,
  );
  protected readonly children = computed(() => this.childrenRes.value()?.children ?? []);
  /** The context's child while still linked, else the parent home's default (BR-HOM-001.9). */
  protected readonly childId = computed(() => {
    const list = this.children();
    const chosen = this.#ctx.selectedChild()?.studentId;
    if (chosen && list.some((c) => c.studentId === chosen)) return chosen;
    return this.childrenRes.value()?.defaultStudentId ?? list[0]?.studentId ?? null;
  });
  protected readonly title = computed(() => {
    if (!this.isParent()) return 'Mis cursos';
    const child = this.children().find((c) => c.studentId === this.childId());
    return child ? `Cursos de ${child.name.split(' ')[0]}` : 'Cursos';
  });

  protected readonly mine = httpResource<MyCourses>(() => {
    const params: Record<string, string> = {};
    if (this.periodId()) params['periodId'] = this.periodId();
    if (this.isParent()) {
      const childId = this.childId();
      if (!childId) return undefined;
      params['studentId'] = childId;
    }
    return { url: '/api/v1/courses/mine', params };
  });

  protected selectChild(child: ParentChild): void {
    this.#ctx.select({
      studentId: child.studentId,
      name: child.name,
      schoolId: child.school.id,
      schoolName: child.school.name,
      organizationId: child.organizationId,
      classGroupName: child.classGroup?.name ?? null,
    });
    this.periodId.set('');
    this.area.set(ALL_AREAS);
  }

  /** BR-ACA-001.8: "Vencida desde lun 13 abr" / "Vence jue 16 abr, 12:00", in school time. */
  protected dueText(next: { dueAt: string; overdue: boolean }, timezone: string): string {
    const at = new Date(next.dueAt);
    const day = new Intl.DateTimeFormat('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: timezone,
    }).format(at);
    if (next.overdue) return `Vencida desde ${day}`;
    const time = new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(at);
    return `Vence ${day}, ${time}`;
  }

  protected averageHelper(average: { previous: number | null; delta: number | null }): string {
    if (average.delta === null || average.previous === null) return 'del periodo';
    const sign = average.delta > 0 ? '+' : average.delta < 0 ? '−' : '±';
    return `${sign}${Math.abs(average.delta).toFixed(1)} frente al periodo anterior (${average.previous.toFixed(1)})`;
  }

  /** FR-ACA-001.7: "Todas" plus one chip per subject area, with counts (BR .14). */
  protected readonly chips = computed(() => areaChips(this.mine.value()?.courses ?? []));
  protected readonly area = signal(ALL_AREAS);

  protected readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const area = this.area();
    return (this.mine.value()?.courses ?? []).filter(
      (c) => inArea(c, area) && (!q || c.name.toLowerCase().includes(q) || c.subject.name.toLowerCase().includes(q)),
    );
  });
}
