import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardBody,
  ChartPlaceholder,
  EmptyState,
  Icon,
  Meter,
  MeterTone,
  PageHeader,
  Spinner,
  StatCard,
} from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type Ref = { id: string; name: string };

/** `GET /api/v1/home/student/today` (HOM-001 FR .12). */
type StudentSlot = {
  id: string;
  startTime: string;
  endTime: string;
  recess: boolean;
  remote: boolean;
  remoteLink: string;
  location: string;
  course: Ref;
  teacherName: string | null;
  state: 'LATER' | 'NOW' | 'PAST';
};
type StudentToday = {
  firstName: string;
  timezone: string;
  date: string;
  time: string;
  period: { id: string; name: string; endDate: string } | null;
  classGroup: Ref | null;
  now: StudentSlot | null;
  next: StudentSlot | null;
  slots: StudentSlot[];
};

type AssignmentType = 'HOMEWORK' | 'EXAM' | 'QUIZ' | 'PROJECT' | 'PAPER' | 'NEW';
type WorkStatus = 'PENDIENTE' | 'ENTREGADO' | 'VENCIDA' | 'PRESENCIAL';

/** `GET /api/v1/home/student/work` (HOM-001 FR .14). */
type StudentWorkItem = {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  requireSubmission: boolean;
  course: Ref;
  dueAt: string;
  status: WorkStatus;
  submittedAt: string | null;
};
type StudentWork = { timezone: string; today: string; classGroup: Ref | null; items: StudentWorkItem[] };

type GradeBand = 'EXCELLENT' | 'PASSING' | 'BELOW';

/** `GET /api/v1/home/student/progress` (HOM-001 FR .13 .16 .17). */
type StudentProgress = {
  studentId: string;
  period: Ref | null;
  previousPeriod: Ref | null;
  scale: { maximum: number; minimumApproval: number; minimumExcellence: number } | null;
  average: { value: number | null; previous: number | null; delta: number | null };
  courses: { id: string; name: string; average: number | null; band: GradeBand | null }[];
  recentGrades: { id: string; title: string; course: Ref; score: number; band: GradeBand | null; date: string }[];
  attendance: { rate: number | null; absences: number; late: number } | null;
  messages: { unread: number; fromTeachers: number; broadcasts: number };
  habits: { total: number; satisfactory: number; flagged: { name: string; value: 'R' | 'X' }[] } | null;
};

/** Meter / badge tones per band; no band = neutral (BR-HOM-001.1). */
const BAND_METER: Record<GradeBand, MeterTone> = { EXCELLENT: 'success', PASSING: 'action', BELOW: 'danger' };
const BAND_BADGE: Record<GradeBand, BadgeTone> = { EXCELLENT: 'success', PASSING: 'action', BELOW: 'danger' };

/** Grades show with one decimal and a point, as elsewhere in the app. */
const grade = (n: number) => n.toFixed(1);
const percent = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 });

/** Labels as in the assignment form. */
const ASSIGNMENT_TYPES: Record<AssignmentType, { label: string; tone: BadgeTone }> = {
  NEW: { label: 'Nuevo', tone: 'neutral' },
  HOMEWORK: { label: 'Tarea', tone: 'info' },
  EXAM: { label: 'Examen', tone: 'warning' },
  PROJECT: { label: 'Proyecto', tone: 'action' },
  QUIZ: { label: 'Quiz', tone: 'neutral' },
  PAPER: { label: 'Ensayo', tone: 'success' },
};

const WORK_STATUS: Record<WorkStatus, { label: string; tone: BadgeTone }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  ENTREGADO: { label: 'Entregado', tone: 'success' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
  PRESENCIAL: { label: 'Presencial', tone: 'neutral' },
};

const longDate = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

@Component({
  selector: 'app-student-home',
  imports: [
    Alert,
    Badge,
    Button,
    Spinner,
    Card,
    CardBody,
    ChartPlaceholder,
    Meter,
    RouterLink,
    PageHeader,
    EmptyState,
    RecentBroadcasts,
    StatCard,
    Icon,
  ],
  template: `
    <lib-page-header [title]="greeting()" [subtitle]="headerSubtitle()" />

    <section uiCard bleed aria-labelledby="today-title">
      <div uiCardBody>
        <h2 id="today-title" class="sr-only">Hoy</h2>
        @if (today.isLoading()) {
          <div class="flex justify-center py-6"><span uiSpinner></span></div>
        } @else if (today.error()) {
          <div uiAlert tone="danger" role="alert">
            <span>No se pudo cargar tu horario de hoy.</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="today.reload()">Reintentar</button>
          </div>
        } @else if (!today.value()?.classGroup) {
          <lib-empty-state
            title="Aún no tienes grupo asignado"
            description="Cuando te asignen a un grupo verás aquí tu horario."
            icon="users"
          />
        } @else if (classes().length === 0) {
          <lib-empty-state
            title="No tienes clases hoy"
            description="Tu horario de la semana aparecerá aquí."
            icon="calendar-check"
          />
        } @else {
          <div class="flex flex-wrap items-center gap-4">
            @if (highlight(); as main) {
              <ui-icon
                name="presentation"
                class="flex size-12 shrink-0 items-center justify-center rounded-field bg-action-subtle text-2xl text-primary"
              />
              <div class="min-w-0 flex-[1_1_280px]">
                <p class="flex items-center gap-2 text-sm text-ink-muted">
                  @if (main.state === 'NOW') {
                    <span uiBadge tone="action" size="sm">Ahora</span> hasta las {{ main.endTime }}
                  } @else {
                    <span uiBadge tone="neutral" size="sm">Siguiente</span> a las {{ main.startTime }}
                  }
                </p>
                <p class="mt-0.5 text-xl font-semibold text-ink-strong">{{ main.course.name }}</p>
                <p class="text-sm text-ink-muted">{{ slotWhere(main) }}</p>
              </div>
              @if (main.remote && main.remoteLink) {
                <a
                  uiButton
                  variant="primary"
                  size="sm"
                  [href]="main.remoteLink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ui-icon name="video" />
                  Abrir enlace
                </a>
              }
              @if (main.state === 'NOW' && today.value()?.next; as next) {
                <div class="min-w-0 flex-[0_1_260px] rounded-field bg-surface-2 px-4 py-3">
                  <p class="text-xs font-medium text-ink-muted">Siguiente · {{ next.startTime }}</p>
                  <p class="font-semibold text-ink-strong">{{ next.course.name }}</p>
                  <p class="text-xs text-ink-muted">{{ slotWhere(next) }}</p>
                </div>
              }
            } @else {
              <p class="text-ink-muted">Ya terminaron tus clases de hoy.</p>
            }
          </div>

          <ol class="mt-4 flex flex-wrap gap-2" aria-label="Clases de hoy">
            @for (slot of classes(); track slot.id) {
              <li
                class="flex min-w-28 flex-[1_1_120px] flex-col rounded-field border px-3 py-2"
                [class]="
                  slot.state === 'NOW'
                    ? 'border-primary bg-action-subtle'
                    : slot.state === 'PAST'
                      ? 'border-line opacity-60'
                      : 'border-line'
                "
                [attr.aria-current]="slot.state === 'NOW' ? 'time' : null"
              >
                <span
                  class="text-xs tabular-nums"
                  [class]="slot.state === 'NOW' ? 'font-semibold text-primary' : 'text-ink-muted'"
                  >{{ slot.startTime }}</span
                >
                <span class="flex items-center gap-1 text-sm font-medium text-ink-strong">
                  {{ slot.course.name }}
                  @if (slot.remote) {
                    <ui-icon name="video" class="text-base text-ink-muted" aria-label="Clase virtual" role="img" />
                  }
                </span>
              </li>
            }
          </ol>
        }
      </div>
    </section>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card
        label="Promedio del periodo"
        [value]="averageValue()"
        [helper]="averageHelper()"
        icon="star"
        color="primary"
      />
      <lib-stat-card
        label="Asistencia"
        [value]="attendanceValue()"
        [helper]="attendanceHelper()"
        icon="user-check"
        color="success"
      />
      <lib-stat-card
        label="Por entregar"
        [value]="toDoValue()"
        [helper]="toDoHelper()"
        icon="clipboard-list"
        color="warning"
      />
      <lib-stat-card
        label="Mensajes nuevos"
        [value]="messagesValue()"
        [helper]="messagesHelper()"
        icon="mail"
        color="info"
      />
    </div>

    <div class="mt-6 flex flex-wrap gap-6">
      <section uiCard bleed class="min-w-0 flex-[999_1_560px]" aria-labelledby="work-title">
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 id="work-title" class="text-base font-semibold text-ink-strong">Próximas entregas y evaluaciones</h2>
            <a routerLink="/student/assignments" class="link link-primary text-sm">Ver todas</a>
          </div>
          @if (work.isLoading()) {
            <div class="flex justify-center py-8"><span uiSpinner></span></div>
          } @else if (work.error()) {
            <div uiAlert tone="danger" role="alert" class="mt-2">
              <span>No se pudieron cargar tus entregas.</span>
              <button uiButton variant="ghost" size="sm" type="button" (click)="work.reload()">Reintentar</button>
            </div>
          } @else if (workItems().length === 0) {
            <lib-empty-state
              title="Sin entregas próximas"
              description="Las tareas y evaluaciones de las próximas dos semanas aparecerán aquí."
              icon="clipboard-list"
            />
          } @else {
            <ul class="mt-1 flex flex-col">
              @for (item of workItems(); track item.assignmentId) {
                <li
                  class="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-2.5 first:border-t-0"
                >
                  <div class="min-w-56 flex-[1_1_240px]">
                    <p class="flex flex-wrap items-center gap-2">
                      <span uiBadge [tone]="typeOf(item).tone" size="sm">{{ typeOf(item).label }}</span>
                      <a [routerLink]="['/assignments', item.assignmentId]" class="font-medium text-ink-strong">{{
                        item.title
                      }}</a>
                    </p>
                    <p class="mt-0.5 text-xs text-ink-muted">
                      {{ item.course.name }} ·
                      <span [class]="item.status === 'VENCIDA' ? 'font-medium text-error' : ''">{{
                        dueLabel(item)
                      }}</span>
                    </p>
                  </div>
                  <span uiBadge [tone]="statusOf(item).tone">{{ statusOf(item).label }}</span>
                  @if (item.status === 'PENDIENTE' || item.status === 'VENCIDA') {
                    <a
                      uiButton
                      [variant]="item.status === 'PENDIENTE' ? 'primary' : 'secondary'"
                      size="sm"
                      [routerLink]="['/assignments', item.assignmentId]"
                    >
                      Entregar
                    </a>
                  } @else if (item.status === 'ENTREGADO') {
                    <a uiButton variant="ghost" size="sm" [routerLink]="['/assignments', item.assignmentId]"
                      >Ver entrega</a
                    >
                  }
                </li>
              }
            </ul>
          }
        </div>
      </section>

      <div class="min-w-0 flex-[1_1_340px]">
        <app-recent-broadcasts />
      </div>
    </div>

    <div class="mt-6 flex flex-wrap gap-6">
      <section uiCard bleed class="min-w-0 flex-[999_1_560px]" aria-labelledby="grades-title">
        <div uiCardBody>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 id="grades-title" class="text-base font-semibold text-ink-strong">
              Mis calificaciones{{ progress.value()?.period ? ' · ' + progress.value()?.period?.name : '' }}
            </h2>
            @if (progress.value()?.studentId; as studentId) {
              <a [routerLink]="['/students', studentId, 'grade-report']" class="link link-primary text-sm"
                >Ver informe completo</a
              >
            }
          </div>
          @if (progress.isLoading()) {
            <div class="flex justify-center py-8"><span uiSpinner></span></div>
          } @else if (progress.error()) {
            <div uiAlert tone="danger" role="alert" class="mt-2">
              <span>No se pudieron cargar tus calificaciones.</span>
              <button uiButton variant="ghost" size="sm" type="button" (click)="progress.reload()">Reintentar</button>
            </div>
          } @else if (!progress.value()?.period) {
            <lib-empty-state
              title="No hay un periodo activo"
              description="Tus promedios aparecerán cuando inicie el periodo."
              icon="calendar-x"
            />
          } @else if (courseRows().length === 0) {
            <lib-empty-state
              title="Sin cursos inscritos"
              description="Tus cursos y promedios aparecerán aquí."
              icon="book-open"
            />
          } @else {
            <ul class="mt-1 flex flex-col">
              @for (course of courseRows(); track course.id) {
                <li class="flex min-h-11 items-center gap-3 border-t border-line py-2 first:border-t-0">
                  <span class="w-36 shrink-0 truncate font-medium text-ink-strong">{{ course.name }}</span>
                  @if (course.average !== null && scaleMax(); as max) {
                    <ui-meter
                      class="flex-1"
                      [value]="course.average"
                      [max]="max"
                      [label]="course.name + ': ' + gradeText(course.average) + ' de ' + gradeText(max)"
                      [tone]="course.band ? bandMeter[course.band] : 'action'"
                      [showLabel]="false"
                    />
                  } @else {
                    <span class="flex-1"></span>
                  }
                  <strong class="w-10 text-right tabular-nums text-ink-strong">{{
                    course.average === null ? '—' : gradeText(course.average)
                  }}</strong>
                </li>
              }
            </ul>
            @if (progress.value()?.scale; as scale) {
              <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span class="inline-flex items-center gap-1.5"
                  ><span class="size-2.5 rounded-sm bg-success" aria-hidden="true"></span>Excelencia ({{
                    gradeText(scale.minimumExcellence)
                  }}+)</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><span class="size-2.5 rounded-sm bg-primary" aria-hidden="true"></span>Aprobado ({{
                    gradeText(scale.minimumApproval)
                  }}+)</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><span class="size-2.5 rounded-sm bg-error" aria-hidden="true"></span>Bajo el mínimo</span
                >
                <span>Según la escala de tu plan de estudio</span>
              </p>
            } @else {
              <p class="mt-2 text-xs text-ink-muted">Escala de notas no configurada</p>
            }
            @if (recentGrades().length > 0) {
              <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <span class="text-xs font-medium text-ink-muted">Notas recientes:</span>
                @for (g of recentGrades(); track g.id) {
                  <span uiBadge [tone]="g.band ? bandBadge[g.band] : 'neutral'"
                    >{{ g.course.name }} · {{ g.title }} · {{ gradeText(g.score) }}</span
                  >
                }
              </div>
            }
          }
        </div>
      </section>

      <section uiCard class="min-w-0 flex-[1_1_340px]" aria-labelledby="progress-title">
        <div uiCardBody>
          <h2 id="progress-title" class="text-base font-semibold text-ink-strong">Mi progreso</h2>
          <ui-chart-placeholder
            class="mt-2 h-56"
            shape="line"
            kind="Línea"
            description="Tu promedio general por periodo y año; toca una materia para ver la suya"
            source="grade-report"
          />
          <div class="mt-3 flex items-center gap-3 rounded-field bg-surface-2 p-3">
            <ui-icon
              name="brain"
              class="flex size-9 shrink-0 items-center justify-center rounded-field bg-success/15 text-success"
            />
            <span class="min-w-0 flex-1">
              <span class="block font-medium text-ink-strong">Hábitos y actitudes</span>
              <span class="block text-xs text-ink-muted">{{ habitsText() }}</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class StudentHome {
  // ── HOM-001-S04: now / next, today's classes, upcoming and overdue work ──
  public today = httpResource<StudentToday>(() => '/api/v1/home/student/today');
  public work = httpResource<StudentWork>(() => '/api/v1/home/student/work');

  public classes = computed(() => (this.today.value()?.slots ?? []).filter((s) => !s.recess));
  public workItems = computed(() => this.work.value()?.items ?? []);

  // ── HOM-001-S05: KPIs, course averages on the study plan scale, habits ───
  public progress = httpResource<StudentProgress>(() => '/api/v1/home/student/progress');

  protected readonly bandMeter = BAND_METER;
  protected readonly bandBadge = BAND_BADGE;
  public courseRows = computed(() => this.progress.value()?.courses ?? []);
  public recentGrades = computed(() => this.progress.value()?.recentGrades ?? []);
  public scaleMax = computed(() => this.progress.value()?.scale?.maximum ?? null);

  public averageValue = computed(() => {
    if (this.progress.isLoading()) return '…';
    const p = this.progress.value();
    if (!p || p.average.value === null) return '—';
    return p.scale ? `${grade(p.average.value)} / ${grade(p.scale.maximum)}` : grade(p.average.value);
  });

  public averageHelper = computed(() => {
    if (this.progress.error()) return 'No se pudo cargar';
    const p = this.progress.value();
    if (!p?.period) return 'Sin periodo activo';
    const { delta } = p.average;
    if (delta === null || !p.previousPeriod) return p.period.name;
    if (delta === 0) return `Igual que en ${p.previousPeriod.name}`;
    return `${delta > 0 ? '+' : '−'}${grade(Math.abs(delta))} vs ${p.previousPeriod.name}`;
  });

  public attendanceValue = computed(() => {
    if (this.progress.isLoading()) return '…';
    const rate = this.progress.value()?.attendance?.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });

  public attendanceHelper = computed(() => {
    if (this.progress.error()) return 'No se pudo cargar';
    const a = this.progress.value()?.attendance;
    if (!a) return 'Sin periodo activo';
    return `${plural(a.absences, 'ausencia', 'ausencias')} · ${plural(a.late, 'tardanza', 'tardanzas')} en el periodo`;
  });

  public toDoValue = computed(() => {
    if (this.work.isLoading()) return '…';
    if (!this.work.hasValue()) return '—';
    return String(this.workItems().filter((i) => i.status === 'PENDIENTE' || i.status === 'VENCIDA').length);
  });

  public toDoHelper = computed(() => {
    if (this.work.error()) return 'No se pudo cargar';
    const items = this.workItems();
    const overdue = items.filter((i) => i.status === 'VENCIDA').length;
    if (overdue > 0) return plural(overdue, 'vencida', 'vencidas');
    const today = this.work.value()?.today;
    const tz = this.work.value()?.timezone ?? 'UTC';
    if (!today) return 'Próximas dos semanas';
    const tomorrow = new Date(`${today}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowKey = tomorrow.toISOString().slice(0, 10);
    const dueTomorrow = items.filter(
      (i) =>
        i.status === 'PENDIENTE' &&
        new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(i.dueAt)) === tomorrowKey,
    ).length;
    return dueTomorrow > 0 ? `${dueTomorrow} vence${dueTomorrow === 1 ? '' : 'n'} mañana` : 'Próximas dos semanas';
  });

  public messagesValue = computed(() => {
    if (this.progress.isLoading()) return '…';
    return String(this.progress.value()?.messages.unread ?? '—');
  });

  public messagesHelper = computed(() => {
    if (this.progress.error()) return 'No se pudo cargar';
    const m = this.progress.value()?.messages;
    if (!m || m.unread === 0) return 'Estás al día';
    const parts: string[] = [];
    if (m.fromTeachers) parts.push(plural(m.fromTeachers, 'de un docente', 'de docentes'));
    if (m.broadcasts) parts.push(plural(m.broadcasts, 'aviso escolar', 'avisos escolares'));
    return parts.join(' · ');
  });

  public habitsText = computed(() => {
    const h = this.progress.value()?.habits;
    if (!h || h.total === 0) return 'Aún no hay hábitos publicados en este periodo';
    const flagged = h.flagged.map((f) => `${f.name}: «${f.value === 'R' ? 'Regular' : 'Por mejorar'}»`).join(' · ');
    return `${h.satisfactory} de ${h.total} en «Satisfactorio»${flagged ? ' · ' + flagged : ''}`;
  });

  gradeText(n: number): string {
    return grade(n);
  }
  /** The class in progress, else the next one today. */
  public highlight = computed(() => this.today.value()?.now ?? this.today.value()?.next ?? null);

  public greeting = computed(() => {
    const name = this.today.value()?.firstName;
    return name ? `Hola, ${name}` : 'Hola';
  });

  public headerSubtitle = computed(() => {
    const today = this.today.value();
    if (!today) return 'Lo más importante de tu semana académica.';
    const date = capitalize(longDate.format(new Date(`${today.date}T00:00:00Z`)));
    const parts = [today.classGroup ? `${date} · ${today.classGroup.name}` : date];
    const items = this.workItems();
    const overdue = items.filter((i) => i.status === 'VENCIDA').length;
    const pending = items.filter((i) => i.status === 'PENDIENTE').length;
    if (overdue > 0) {
      parts.push(`Tienes ${plural(overdue, 'entrega vencida', 'entregas vencidas')} y ${pending} por entregar.`);
    } else if (pending > 0) {
      parts.push(`Tienes ${plural(pending, 'entrega', 'entregas')} en las próximas dos semanas.`);
    } else if (this.work.hasValue()) {
      parts.push('No tienes entregas pendientes.');
    }
    return parts.join(' · ');
  });

  slotWhere(slot: StudentSlot): string {
    const where = slot.remote ? 'Clase virtual' : slot.location || 'Sin aula asignada';
    return slot.teacherName ? `Prof. ${slot.teacherName} · ${where}` : where;
  }

  typeOf(item: StudentWorkItem) {
    return ASSIGNMENT_TYPES[item.type] ?? ASSIGNMENT_TYPES.NEW;
  }

  statusOf(item: StudentWorkItem) {
    return WORK_STATUS[item.status];
  }

  dueLabel(item: StudentWorkItem): string {
    const timeZone = this.work.value()?.timezone ?? 'UTC';
    const when = new Intl.DateTimeFormat('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date(item.dueAt));
    return item.status === 'VENCIDA' ? `venció ${when}` : `vence ${when}`;
  }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
