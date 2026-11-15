import { Alert, Badge, BadgeTone, Button, Card, CardBody, EmptyState, PageHeader, Spinner } from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toFetchQueryParams } from './core/fetch-query-params';
import Store from './core/store';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type InboxRow = {
  id: string;
  message: {
    subject: string;
    createdAt: string;
    sender: { name?: string | null; firstName?: string | null; lastName?: string | null };
  };
};

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  author: { name?: string | null; firstName?: string | null; lastName?: string | null };
};

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
    DatePipe,
    DecimalPipe,
    RouterLink,
    PageHeader,
    EmptyState,
    RecentBroadcasts,
  ],
  template: `
    <lib-page-header [title]="greeting()" [subtitle]="headerSubtitle()" />

    <section uiCard aria-labelledby="today-title">
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
          <lib-empty-state title="Aún no tienes grupo asignado" description="Cuando te asignen a un grupo verás aquí tu horario." icon="groups" />
        } @else if (classes().length === 0) {
          <lib-empty-state title="No tienes clases hoy" description="Tu horario de la semana aparecerá aquí." icon="event_available" />
        } @else {
          <div class="flex flex-wrap items-center gap-4">
            @if (highlight(); as main) {
              <span class="material-symbols-outlined flex size-12 shrink-0 items-center justify-center rounded-field bg-primary/10 text-2xl text-primary" aria-hidden="true">co_present</span>
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
                <a uiButton variant="primary" size="sm" [href]="main.remoteLink" target="_blank" rel="noopener noreferrer">
                  <span class="material-symbols-outlined" aria-hidden="true">videocam</span>
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
                [class]="slot.state === 'NOW' ? 'border-primary bg-primary/5' : slot.state === 'PAST' ? 'border-line opacity-60' : 'border-line'"
                [attr.aria-current]="slot.state === 'NOW' ? 'time' : null"
              >
                <span class="text-xs tabular-nums" [class]="slot.state === 'NOW' ? 'font-semibold text-primary' : 'text-ink-muted'">{{ slot.startTime }}</span>
                <span class="flex items-center gap-1 text-sm font-medium text-ink-strong">
                  {{ slot.course.name }}
                  @if (slot.remote) {
                    <span class="material-symbols-outlined text-base text-ink-muted" aria-label="Clase virtual" role="img">videocam</span>
                  }
                </span>
              </li>
            }
          </ol>
        }
      </div>
    </section>

    <section uiCard class="mt-6" aria-labelledby="work-title">
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
            icon="assignment"
          />
        } @else {
          <ul class="mt-1 flex flex-col">
            @for (item of workItems(); track item.assignmentId) {
              <li class="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-2.5 first:border-t-0">
                <div class="min-w-56 flex-[1_1_240px]">
                  <p class="flex flex-wrap items-center gap-2">
                    <span uiBadge [tone]="typeOf(item).tone" size="sm">{{ typeOf(item).label }}</span>
                    <a [routerLink]="['/assignments', item.assignmentId]" class="font-medium text-ink-strong">{{ item.title }}</a>
                  </p>
                  <p class="mt-0.5 text-xs text-ink-muted">
                    {{ item.course.name }} ·
                    <span [class]="item.status === 'VENCIDA' ? 'font-medium text-error' : ''">{{ dueLabel(item) }}</span>
                  </p>
                </div>
                <span uiBadge [tone]="statusOf(item).tone">{{ statusOf(item).label }}</span>
                @if (item.status === 'PENDIENTE' || item.status === 'VENCIDA') {
                  <a uiButton [variant]="item.status === 'PENDIENTE' ? 'primary' : 'secondary'" size="sm" [routerLink]="['/assignments', item.assignmentId]">
                    Entregar
                  </a>
                } @else if (item.status === 'ENTREGADO') {
                  <a uiButton variant="ghost" size="sm" [routerLink]="['/assignments', item.assignmentId]">Ver entrega</a>
                }
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
                    {{ senderDisplayName($safeNavigationMigration(message.message?.sender)) }} ·
                    {{ $safeNavigationMigration(message.message?.createdAt) | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (gradeReportStudentId()) {
      <div class="mt-6">
        <div uiCard>
          <div uiCardBody>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-base-content">Informe de calificaciones</h2>
              @if (gradeReportResource.hasValue() && gradeReportResource.value()) {
                <a
                  [routerLink]="['/students', gradeReportStudentId(), 'grade-report']"
                  class="link link-primary text-sm"
                >
                  Ver informe completo
                </a>
              }
            </div>
            @if (gradeReportResource.isLoading()) {
              <div class="flex justify-center py-8">
                <span uiSpinner></span>
              </div>
            } @else if (gradeReportResource.hasValue() && gradeReportResource.value(); as report) {
              <div class="flex flex-col gap-2">
                <p class="text-sm text-base-content/70">Periodo: {{ report.periodName || 'Selecciona un periodo' }}</p>
                @let cumulativeAverage = report.overallGradesRow?.cumulativeAverage;
                @if (cumulativeAverage !== null && cumulativeAverage !== undefined) {
                  <p class="text-lg font-bold text-base-content">
                    Promedio general: {{ cumulativeAverage | number: '1.1-1' }}
                  </p>
                } @else {
                  <p class="text-sm text-base-content/70">No hay calificaciones publicadas para este periodo.</p>
                }
              </div>
            } @else if (gradeReportResource.error()) {
              <lib-empty-state
                title="No se pudo cargar el informe"
                description="Intenta de nuevo más tarde."
                icon="grade"
              />
            } @else {
              <lib-empty-state
                title="Sin informe disponible"
                description="Selecciona un periodo para ver tus calificaciones."
                icon="grade"
              />
            }
          </div>
        </div>
      </div>
    }

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
                        {{ authorDisplayName(newsletter.author) }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
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
export default class StudentHome {
  private store = inject(Store);

  // ── HOM-001-S04: now / next, today's classes, upcoming and overdue work ──
  public today = httpResource<StudentToday>(() => '/api/v1/home/student/today');
  public work = httpResource<StudentWork>(() => '/api/v1/home/student/work');

  public classes = computed(() => (this.today.value()?.slots ?? []).filter((s) => !s.recess));
  public workItems = computed(() => this.work.value()?.items ?? []);
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

  public gradeReportStudentId = computed(() => this.store.currentStudentId() ?? null);
  public gradeReportPeriodId = signal<string>('');

  senderDisplayName(sender: InboxRow['message']['sender'] | undefined): string {
    if (!sender) return '—';
    if (sender.name?.trim()) return sender.name;
    return [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  authorDisplayName(author: PublishedNewsletter['author']): string {
    if (author.name?.trim()) return author.name;
    return [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  public gradeReportPeriodsResource = httpResource<{ id: string; name: string; startDate: string; endDate: string }[]>(
    () => {
      const year = this.store.currentSchool()?.currentYear;
      if (!year) return undefined;
      return {
        url: `/api/v1/periods/by-year`,
        params: { year: String(year) },
      };
    },
  );

  private gradeReportCurrentPeriodId = computed(() => {
    const periods = this.gradeReportPeriodsResource.value();
    if (!periods?.length) return '';
    const today = new Date();
    const current = periods.find((p) => new Date(p.startDate) <= today && today <= new Date(p.endDate));
    return current?.id ?? '';
  });

  public gradeReportResource = httpResource<{
    periodName?: string | null;
    overallGradesRow?: { cumulativeAverage?: number | null } | null;
  }>(() => {
    const studentId = this.gradeReportStudentId();
    const periodId = this.gradeReportPeriodId() || this.gradeReportCurrentPeriodId();
    if (!studentId || !periodId) {
      return undefined;
    }
    return {
      url: `/api/v1/grade-report`,
      params: { studentId, periodId },
    };
  });

  public recentMessages = httpResource<InboxRow[]>(() => {
    return {
      url: '/api/v1/messages',
      params: toFetchQueryParams({ take: 4, skip: 0 }),
      defaultValue: [],
    };
  });

  public recentNewsletters = httpResource<PublishedNewsletter[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/newsletters/published`,
      params: { schoolId, take: '3' },
    };
  });

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }

  constructor() {
    afterRenderEffect(() => {
      const id = this.gradeReportCurrentPeriodId();
      if (id) this.gradeReportPeriodId.set(id);
    });
  }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
