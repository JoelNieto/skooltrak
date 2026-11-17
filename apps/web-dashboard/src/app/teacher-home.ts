import { Alert, Badge, Button, Card, CardBody, EmptyState, Modal, PageHeader, Spinner, StatCard } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { endOfWeek, startOfWeek } from 'date-fns';
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

/** `GET /api/v1/home/teacher/summary` (HOM-001 FR .7). */
type TeacherSummary = {
  weekStart: string;
  weekEnd: string;
  attendance: { rate: number | null; lowestGroup: { id: string; name: string; rate: number } | null };
};

type AssignmentRow = {
  id: string;
  title: string;
  date?: string;
  course: { name: string };
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

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card
        label="Asistencia de mis grupos"
        [value]="attendanceValue()"
        [helper]="attendanceHelper()"
        icon="how_to_reg"
        color="success"
      />
    </div>

    <section uiCard class="mt-6" aria-labelledby="my-day-title">
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

    <div class="mt-6">
      <app-recent-broadcasts />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div uiCard>
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Asignaciones de la semana</h2>
            <a routerLink="/assignments" class="link link-primary text-sm"> Ver todas </a>
          </div>
          @if (upcomingAssignments().length === 0) {
            <lib-empty-state
              title="Sin asignaciones esta semana"
              description="Cuando se registren nuevas tareas aparecerán aquí."
              icon="assignment"
            />
          } @else {
            <div class="space-y-3">
              @for (assignment of upcomingAssignments(); track assignment.id) {
                <div
                  class="rounded-lg border border-base-200 cursor-pointer hover:bg-base-100 transition-colors p-3"
                  [routerLink]="['/assignments', assignment.id]"
                >
                  <p class="font-medium text-base-content">
                    {{ assignment.title }}
                  </p>
                  <div class="text-sm text-base-content/70">
                    {{ assignment.course.name }} ·
                    {{ assignment.date | date: 'mediumDate' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

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

  // ── Pre-HOM sections, replaced in HOM-001-S02 / S03 ───────────────────────
  private currentDate = signal(new Date());
  private startDate = computed(() => startOfWeek(this.currentDate(), { weekStartsOn: 1 }));
  private endDate = computed(() => endOfWeek(this.currentDate(), { weekStartsOn: 1 }));

  public assignmentsResource = httpResource<AssignmentRow[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/assignments/by-school',
        params: {
          schoolId,
          startDate: this.startDate().toISOString(),
          endDate: this.endDate().toISOString(),
        },
      };
    },
    { defaultValue: [] },
  );

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

  public upcomingAssignments = computed(() => {
    const assignments = this.assignmentsResource.value() ?? [];
    return [...assignments]
      .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())
      .slice(0, 4);
  });
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
