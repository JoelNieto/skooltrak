import { Alert, Badge, BadgeTone, Button, Card, CardBody, EmptyState, Meter, Modal, PageHeader, Spinner, StatCard } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import AttendanceForm from './attendance/attendance-form';
import { toFetchQueryRecord } from './core/fetch-query-params';
import Store from './core/store';
import { RecentBroadcasts } from './communication/recent-broadcasts';

/** `GET /api/v1/home/teacher/today` (HOM-001 FR .6). */
type TeacherSlotState = 'DONE' | 'NOW' | 'LATER' | 'MISSED' | 'PAST';
type TeacherSlot = {
  id: string;
  startTime: string;
  endTime: string;
  recess: boolean;
  remote: boolean;
  remoteLink: string;
  location: string;
  course: { id: string; name: string };
  classGroup: { id: string; name: string };
  state: TeacherSlotState;
  attendance: { sessionId: string; presentOrLate: number; total: number } | null;
};
type TeacherToday = {
  firstName: string;
  timezone: string;
  date: string;
  time: string;
  period: { id: string; name: string; endDate: string } | null;
  slots: TeacherSlot[];
  pendingAttendance: number;
};

/** `GET /api/v1/home/teacher/summary` (HOM-001 FR .5 .7 .8). */
type TeacherSummary = {
  weekStart: string;
  weekEnd: string;
  attendance: { rate: number | null; lowestGroup: { id: string; name: string; rate: number } | null };
  toReview: {
    submissions: number;
    assignments: number;
    oldestSubmittedAt: string | null;
    top: { assignmentId: string; title: string; courseName: string; count: number } | null;
  };
  grades: {
    periodId: string;
    emptyCells: number;
    coursesWithEmptyCells: number;
    unpublished: number;
    coursesWithUnpublished: number;
    totalCourses: number;
    topCourseId: string | null;
  } | null;
  periodClose: { name: string; endDate: string; daysLeft: number } | null;
};

type AssignmentType = 'HOMEWORK' | 'EXAM' | 'QUIZ' | 'PROJECT' | 'PAPER' | 'NEW';

/** `GET /api/v1/home/teacher/week` (HOM-001 FR .9). */
type TeacherWeekItem = {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  requireSubmission: boolean;
  course: { id: string; name: string };
  classGroup: { id: string; name: string };
  dueAt: string;
  submitted: number;
  expected: number;
};
type TeacherWeek = { timezone: string; weekStart: string; weekEnd: string; items: TeacherWeekItem[] };

type PendingRow = { icon: string; iconClass: string; title: string; detail: string; link: (string | null)[] | string };

/** Labels as in the assignment form. */
const ASSIGNMENT_TYPES: Record<AssignmentType, { label: string; tone: BadgeTone }> = {
  NEW: { label: 'Nuevo', tone: 'neutral' },
  HOMEWORK: { label: 'Tarea', tone: 'info' },
  EXAM: { label: 'Examen', tone: 'warning' },
  PROJECT: { label: 'Proyecto', tone: 'action' },
  QUIZ: { label: 'Quiz', tone: 'neutral' },
  PAPER: { label: 'Ensayo', tone: 'success' },
};

type InboxRow = {
  id: string;
  message?: { subject?: string; createdAt?: string; sender?: { name?: string } };
};

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: { name: string };
};

const percent = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 });
const longDate = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

@Component({
  selector: 'app-teacher-home',
  imports: [
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    DatePipe,
    EmptyState,
    PageHeader,
    RecentBroadcasts,
    RouterLink,
    Meter,
    Spinner,
    StatCard,
  ],
  template: `
    <lib-page-header
      [title]="greeting()"
      [subtitle]="headerSubtitle()"
      [actionLabel]="nextPendingSlot() ? 'Tomar asistencia' : undefined"
      actionIcon="fact_check"
      (action)="takeAttendance(nextPendingSlot()!)"
    />

    @if (summary.value()?.periodClose; as close) {
      <div uiAlert tone="info" class="mb-4">
        <span class="material-symbols-outlined" aria-hidden="true">event_upcoming</span>
        <span class="flex-1">
          <strong>{{ periodCloseTitle() }}</strong>
          @if (summary.value()?.grades; as grades) {
            @if (grades.coursesWithEmptyCells > 0) {
              · faltan notas en {{ grades.coursesWithEmptyCells }} de tus {{ grades.totalCourses }} cursos.
            } @else {
              · tus cursos tienen todas las notas.
            }
          }
        </span>
        <a routerLink="/courses" class="link font-medium">Ver mis cursos</a>
      </div>
    }

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card
        label="Entregas por revisar"
        [value]="toReviewValue()"
        [helper]="toReviewHelper()"
        icon="inbox"
        color="warning"
      />
      <lib-stat-card
        label="Asistencia de mis grupos"
        [value]="attendanceValue()"
        [helper]="attendanceHelper()"
        icon="how_to_reg"
        color="success"
      />
    </div>

    <div class="mt-6 flex flex-wrap gap-6">
    <section uiCard class="min-w-0 flex-[999_1_560px]" aria-labelledby="my-day-title">
      <div uiCardBody>
        <h2 id="my-day-title" class="text-base font-semibold text-ink-strong">Mi día</h2>

        @if (today.isLoading()) {
          <div class="flex justify-center py-8"><span uiSpinner></span></div>
        } @else if (today.error()) {
          <div uiAlert tone="danger" role="alert" class="mt-2">
            <span>No se pudo cargar tu horario de hoy.</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="today.reload()">Reintentar</button>
          </div>
        } @else if (slots().length === 0) {
          <lib-empty-state
            title="No tienes clases hoy"
            description="Las clases de tu horario semanal aparecerán aquí."
            icon="event_available"
          />
        } @else {
          <ol class="mt-2 flex flex-col gap-2">
            @for (slot of slots(); track slot.id) {
              <li
                class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-field border p-3"
                [class]="slotClass(slot)"
                [attr.aria-current]="slot.state === 'NOW' ? 'time' : null"
              >
                <span class="w-28 shrink-0 text-sm tabular-nums" [class]="slot.state === 'NOW' ? 'font-semibold text-primary' : 'text-ink-muted'">
                  {{ slot.startTime }} – {{ slot.endTime }}
                </span>

                @if (slot.recess) {
                  <span class="flex-1 text-ink-muted">Recreo</span>
                } @else {
                  <div class="min-w-48 flex-1">
                    <p class="flex flex-wrap items-center gap-2 font-medium text-ink-strong">
                      {{ slot.course.name }} · {{ slot.classGroup.name }}
                      @if (slot.state === 'NOW') {
                        <span uiBadge tone="action" size="sm">Ahora</span>
                      }
                    </p>
                    <p class="text-xs text-ink-muted">{{ slot.remote ? 'Clase virtual' : slot.location || 'Sin aula asignada' }}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    @if (slot.remote && slot.remoteLink) {
                      <a uiButton variant="secondary" size="sm" [href]="slot.remoteLink" target="_blank" rel="noopener noreferrer">
                        <span class="material-symbols-outlined" aria-hidden="true">videocam</span>
                        Abrir enlace
                      </a>
                    }
                    @if (slot.attendance) {
                      <span uiBadge tone="success">
                        <span class="material-symbols-outlined text-base" aria-hidden="true">check</span>
                        Asistencia tomada · {{ slot.attendance.presentOrLate }}/{{ slot.attendance.total }}
                      </span>
                    } @else if (slot.state === 'NOW' || slot.state === 'MISSED') {
                      <button uiButton [variant]="slot.state === 'NOW' ? 'primary' : 'secondary'" size="sm" type="button" (click)="takeAttendance(slot)">
                        Tomar asistencia
                      </button>
                    } @else if (slot.state === 'LATER') {
                      <span uiBadge tone="neutral">Más tarde</span>
                    }
                  </div>
                }
              </li>
            }
          </ol>
        }
      </div>
    </section>

    <section uiCard class="min-w-0 flex-[1_1_340px]" aria-labelledby="pending-title">
      <div uiCardBody>
        <h2 id="pending-title" class="text-base font-semibold text-ink-strong">Pendientes</h2>
        @if (summary.isLoading()) {
          <div class="flex justify-center py-8"><span uiSpinner></span></div>
        } @else if (summary.error()) {
          <div uiAlert tone="danger" role="alert" class="mt-2">
            <span>No se pudieron cargar tus pendientes.</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="summary.reload()">Reintentar</button>
          </div>
        } @else if (pendingRows().length === 0) {
          <lib-empty-state title="Todo al día" description="No tienes entregas ni notas pendientes." icon="task_alt" color="success" />
        } @else {
          <ul class="mt-1 flex flex-col">
            @for (row of pendingRows(); track row.title) {
              <li class="border-t border-line first:border-t-0">
                <a [routerLink]="row.link" class="flex min-h-11 items-center gap-3 py-2.5 text-ink hover:no-underline">
                  <span class="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-field" [class]="row.iconClass" aria-hidden="true">{{ row.icon }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-medium text-ink-strong">{{ row.title }}</span>
                    <span class="block text-xs text-ink-muted">{{ row.detail }}</span>
                  </span>
                  <span class="material-symbols-outlined text-ink-subtle" aria-hidden="true">chevron_right</span>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </section>
    </div>

    <section uiCard class="mt-6" aria-labelledby="week-title">
      <div uiCardBody>
        <div class="flex items-center justify-between">
          <h2 id="week-title" class="text-base font-semibold text-ink-strong">Asignaciones de la semana</h2>
          <a routerLink="/assignments" class="link link-primary text-sm">Ver todas</a>
        </div>
        @if (week.isLoading()) {
          <div class="flex justify-center py-8"><span uiSpinner></span></div>
        } @else if (week.error()) {
          <div uiAlert tone="danger" role="alert" class="mt-2">
            <span>No se pudieron cargar las asignaciones de la semana.</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="week.reload()">Reintentar</button>
          </div>
        } @else if (weekItems().length === 0) {
          <lib-empty-state
            title="Sin asignaciones esta semana"
            description="Las asignaciones de tus cursos con fecha esta semana aparecerán aquí."
            icon="assignment"
          />
        } @else {
          <ul class="mt-1 flex flex-col">
            @for (item of weekItems(); track item.assignmentId + item.classGroup.id) {
              <li class="border-t border-line first:border-t-0">
                <a
                  [routerLink]="['/assignments', item.assignmentId]"
                  class="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 py-2.5 text-ink hover:no-underline"
                >
                  <span class="min-w-56 flex-[1_1_240px]">
                    <span class="flex flex-wrap items-center gap-2">
                      <span uiBadge [tone]="typeOf(item).tone" size="sm">{{ typeOf(item).label }}</span>
                      <span class="font-medium text-ink-strong">{{ item.title }}</span>
                    </span>
                    <span class="mt-0.5 block text-xs text-ink-muted">
                      {{ item.course.name }} · {{ item.classGroup.name }} · vence {{ dueLabel(item) }}
                    </span>
                  </span>
                  @if (item.requireSubmission) {
                    <ui-meter
                      class="flex-[0_1_220px]"
                      [value]="item.submitted"
                      [max]="item.expected"
                      [label]="item.submitted + '/' + item.expected + ' entregaron'"
                    />
                  } @else {
                    <span uiBadge tone="neutral">Sin entrega en línea</span>
                  }
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </section>

    <div class="mt-6">
      <app-recent-broadcasts />
    </div>

    <div class="mt-6">
      <div uiCard>
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Mensajes recientes</h2>
            <a routerLink="/messages" class="link link-primary text-sm"> Ir a mensajes </a>
          </div>
          @if ((recentMessages.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Revisa tu bandeja para novedades."
              icon="mail"
            />
          } @else {
            <div class="space-y-3">
              @for (message of recentMessages.value() ?? []; track message.id) {
                <div class="rounded-lg border border-base-200 p-3">
                  <p class="font-medium text-base-content">
                    {{ message.message?.subject }}
                  </p>
                  <div class="text-sm text-base-content/70">
                    {{ message.message?.sender?.name }} ·
                    {{ message.message?.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (!recentNewsletters.error()) {
      <div class="mt-6">
        <div uiCard>
          <div uiCardBody>
            <h2 class="text-lg font-semibold text-base-content">Boletines recientes</h2>
            @if ((recentNewsletters.value() ?? []).length === 0) {
              <lib-empty-state
                title="Sin boletines recientes"
                description="Los boletines publicados aparecerán aquí."
                icon="newspaper"
              />
            } @else {
              <div class="space-y-3">
                @for (newsletter of recentNewsletters.value() ?? []; track newsletter.id) {
                  <div class="rounded-lg border border-base-200 p-3">
                    <p class="font-medium text-base-content">{{ newsletter.title }}</p>
                    <p class="text-sm text-base-content/70 mt-1 line-clamp-2">
                      {{ stripHtml(newsletter.content) }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-sm text-base-content/70">
                        {{ newsletter.author.name }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-sm"> Ver más </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export default class TeacherHome {
  #store = inject(Store);
  #modal = inject(Modal);

  // ── HOM-001-S01: "Mi día" + scoped attendance KPI ─────────────────────────
  public today = httpResource<TeacherToday>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: '/api/v1/home/teacher/today', params: { schoolId } };
  });

  public summary = httpResource<TeacherSummary>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: '/api/v1/home/teacher/summary', params: { schoolId } };
  });

  // ── HOM-001-S02: Pendientes, period banner, this week's assignments ──────
  public week = httpResource<TeacherWeek>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: '/api/v1/home/teacher/week', params: { schoolId } };
  });

  public weekItems = computed(() => this.week.value()?.items ?? []);

  public slots = computed(() => this.today.value()?.slots ?? []);

  /** The class to take attendance for from the header: the current one, else the earliest missed one. */
  public nextPendingSlot = computed(() => {
    const pending = this.slots().filter((s) => !s.recess && !s.attendance);
    return pending.find((s) => s.state === 'NOW') ?? pending.find((s) => s.state === 'MISSED') ?? null;
  });

  public greeting = computed(() => {
    const today = this.today.value();
    if (!today) return 'Hola';
    const hour = Number(today.time.slice(0, 2));
    const salutation = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return `${salutation}, ${today.firstName}`;
  });

  public headerSubtitle = computed(() => {
    const today = this.today.value();
    if (!today) return 'Resumen de tus clases y seguimiento semanal.';
    const date = capitalize(longDate.format(new Date(`${today.date}T00:00:00Z`)));
    const parts = [today.period ? `${date} · ${today.period.name}` : date];
    const classes = today.slots.filter((s) => !s.recess).length;
    if (classes > 0) {
      const classesText = classes === 1 ? 'Tienes 1 clase hoy' : `Tienes ${classes} clases hoy`;
      const pending = today.pendingAttendance;
      parts.push(
        pending > 0
          ? `${classesText} y ${pending} ${pending === 1 ? 'asistencia' : 'asistencias'} por tomar.`
          : `${classesText}.`,
      );
    }
    return parts.join(' · ');
  });

  public attendanceValue = computed(() => {
    if (this.summary.isLoading()) return '…';
    const rate = this.summary.value()?.attendance.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });

  public attendanceHelper = computed(() => {
    if (this.summary.error()) return 'No se pudo cargar';
    const lowest = this.summary.value()?.attendance.lowestGroup;
    return lowest ? `Esta semana · ${lowest.name} es el más bajo (${percent.format(lowest.rate)})` : 'Esta semana';
  });

  public periodCloseTitle = computed(() => {
    const close = this.summary.value()?.periodClose;
    if (!close) return '';
    if (close.daysLeft === 0) return `Hoy cierra el ${close.name}`;
    return `Cierre del ${close.name} en ${close.daysLeft} ${close.daysLeft === 1 ? 'día' : 'días'}`;
  });

  public toReviewValue = computed(() => {
    if (this.summary.isLoading()) return '…';
    return String(this.summary.value()?.toReview.submissions ?? '—');
  });

  public toReviewHelper = computed(() => {
    if (this.summary.error()) return 'No se pudo cargar';
    const review = this.summary.value()?.toReview;
    if (!review || review.submissions === 0) return 'Nada por revisar';
    const parts = [review.assignments === 1 ? 'De 1 asignación' : `De ${review.assignments} asignaciones`];
    if (review.oldestSubmittedAt) {
      const days = Math.floor((Date.now() - new Date(review.oldestSubmittedAt).getTime()) / 86_400_000);
      parts.push(days <= 0 ? 'la más antigua es de hoy' : `la más antigua hace ${days} ${days === 1 ? 'día' : 'días'}`);
    }
    return parts.join(' · ');
  });

  /** FR-HOM-001.8 rows with a non-zero count, each linking to where it is resolved. */
  public pendingRows = computed<PendingRow[]>(() => {
    const summary = this.summary.value();
    if (!summary) return [];
    const rows: PendingRow[] = [];
    const { toReview, grades } = summary;
    if (toReview.submissions > 0) {
      rows.push({
        icon: 'assignment_turned_in',
        iconClass: 'bg-warning/15 text-warning',
        title: `Revisar ${plural(toReview.submissions, 'entrega', 'entregas')}`,
        detail: toReview.top ? `${toReview.top.title} (${toReview.top.courseName}) · ${toReview.top.count} por revisar` : '',
        link: toReview.top ? ['/assignments', toReview.top.assignmentId] : '/assignments',
      });
    }
    if (grades && grades.emptyCells > 0) {
      rows.push({
        icon: 'edit_note',
        iconClass: 'bg-error/15 text-error',
        title: `Completar notas en ${plural(grades.coursesWithEmptyCells, 'curso', 'cursos')}`,
        detail: `${plural(grades.emptyCells, 'casilla vacía', 'casillas vacías')} en el periodo`,
        link: grades.topCourseId ? ['/courses', grades.topCourseId] : '/courses',
      });
    }
    if (grades && grades.unpublished > 0) {
      rows.push({
        icon: 'publish',
        iconClass: 'bg-primary/15 text-primary',
        title: `Publicar ${plural(grades.unpublished, 'calificación', 'calificaciones')}`,
        detail: `En ${plural(grades.coursesWithUnpublished, 'curso', 'cursos')}`,
        link: grades.topCourseId ? ['/courses', grades.topCourseId] : '/courses',
      });
    }
    return rows;
  });

  typeOf(item: TeacherWeekItem) {
    return ASSIGNMENT_TYPES[item.type] ?? ASSIGNMENT_TYPES.NEW;
  }

  dueLabel(item: TeacherWeekItem): string {
    const timeZone = this.week.value()?.timezone ?? 'UTC';
    return new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone }).format(
      new Date(item.dueAt),
    );
  }

  slotClass(slot: TeacherSlot): string {
    if (slot.state === 'NOW') return 'border-primary bg-primary/5';
    if (slot.recess) return 'border-line bg-surface-2';
    return 'border-line';
  }

  takeAttendance(slot: TeacherSlot) {
    const today = this.today.value();
    if (!today) return;
    this.#modal
      .open(AttendanceForm, {
        title: 'Nueva asistencia',
        size: 'large',
        data: {
          courseId: slot.course.id,
          groups: [slot.classGroup],
          classGroupId: slot.classGroup.id,
          date: today.date,
        },
      })
      .closed.subscribe(() => {
        this.today.reload();
        this.summary.reload();
      });

  }

  // ── Pre-HOM sections, replaced in HOM-001-S03 ─────────────────────────────
  public recentMessages = httpResource<InboxRow[]>(
    () => ({
      url: '/api/v1/messages',
      params: toFetchQueryRecord({ take: 4, skip: 0 }),
    }),
    { defaultValue: [] },
  );

  public recentNewsletters = httpResource<PublishedNewsletter[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/newsletters/published',
        params: { schoolId, take: '3' },
      };
    },
    { defaultValue: [] },
  );

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }

}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
