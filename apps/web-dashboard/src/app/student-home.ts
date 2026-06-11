import { EmptyState, PageHeader, StatCard } from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { endOfWeek, startOfWeek } from 'date-fns';
import { forkJoin, of } from 'rxjs';
import { toFetchQueryParams } from './core/fetch-query-params';
import Store from './core/store';

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

type StudentAssignmentRow = {
  id: string;
  title: string;
  date: string;
  course: { id: string; name: string };
};

@Component({
  selector: 'app-student-home',
  imports: [DatePipe, DecimalPipe, RouterLink, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header title="Dashboard del estudiante" subtitle="Lo más importante de tu semana académica." />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card
        label="Asignaciones esta semana"
        [value]="weeklyAssignmentsCount().toString()"
        helper="Por entregar"
      />
      <lib-stat-card
        label="Cursos activos"
        [value]="(statsResource.value()?.coursesCount ?? 0).toString()"
        helper="Inscritos"
      />
      <lib-stat-card
        label="Mensajes nuevos"
        [value]="(statsResource.value()?.findManyMessagesCount ?? 0).toString()"
        helper="Bandeja de entrada"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Asignaciones próximas</h2>
            <a routerLink="/assignments" class="link link-primary text-sm"> Ver todas </a>
          </div>
          @if (upcomingAssignments().length === 0) {
            <lib-empty-state
              title="Sin asignaciones pendientes"
              description="Cuando tengas nuevas entregas aparecerán aquí."
              icon="assignment"
            />
          } @else {
            <div class="space-y-3">
              @for (assignment of upcomingAssignments(); track assignment.id) {
                <div class="rounded-lg border border-base-200 p-3">
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

      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
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
                    {{ senderDisplayName(message.message?.sender) }} ·
                    {{ message.message?.createdAt | date: 'short' }}
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
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
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
                <span class="loading loading-spinner loading-md"></span>
              </div>
            } @else if (gradeReportResource.hasValue() && gradeReportResource.value(); as report) {
              <div class="flex flex-col gap-2">
                <p class="text-sm text-base-content/70">Periodo: {{ report.periodName || 'Selecciona un periodo' }}</p>
                @if (report.overallGradesRow?.cumulativeAverage != null) {
                  <p class="text-lg font-bold text-base-content">
                    Promedio general: {{ report.overallGradesRow!.cumulativeAverage! | number: '1.1-1' }}
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
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentHome {
  private http = inject(HttpClient);
  private store = inject(Store);

  private currentDate = signal(new Date());
  private startDate = computed(() => startOfWeek(this.currentDate(), { weekStartsOn: 1 }));
  private endDate = computed(() => endOfWeek(this.currentDate(), { weekStartsOn: 1 }));

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

  public statsResource = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of({
          coursesCount: 0,
          findManyMessagesCount: 0,
        });
      }
      const q = toFetchQueryParams({ schoolId: params.schoolId });
      return forkJoin({
        coursesCount: this.http.get<number>('/api/v1/courses/count', { params: q }),
        findManyMessagesCount: this.http.get<number>('/api/v1/messages/count'),
      });
    },
  });

  public assignmentsResource = httpResource<StudentAssignmentRow[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/assignments/by-school`,
      params: {
        schoolId,
        startDate: this.startDate().toISOString(),
        endDate: this.endDate().toISOString(),
      },
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

  public upcomingAssignments = computed(() => {
    const assignments = this.assignmentsResource.value() ?? [];
    return [...assignments]
      .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())
      .slice(0, 4);
  });

  public weeklyAssignmentsCount = computed(() => this.assignmentsResource.value()?.length ?? 0);

  constructor() {
    afterRenderEffect(() => {
      const id = this.gradeReportCurrentPeriodId();
      if (id) this.gradeReportPeriodId.set(id);
    });
  }
}
