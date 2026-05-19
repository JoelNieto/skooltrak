import { EmptyState, PageHeader, StatCard } from '#/ui';
import { httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { endOfWeek, startOfWeek } from 'date-fns';
import Store from './core/store';
import { toFetchQueryRecord } from './core/fetch-query-params';

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

@Component({
  selector: 'app-teacher-home',
  imports: [DatePipe, RouterLink, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header title="Dashboard docente" subtitle="Resumen de tus clases y seguimiento semanal." />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card
        label="Cursos activos"
        [value]="statsResource().coursesCount.toString()"
        helper="En la institución"
      />
      <lib-stat-card
        label="Estudiantes"
        [value]="statsResource().findManyStudentsCount.toString()"
        helper="Matriculados"
      />
      <lib-stat-card
        label="Asignaciones esta semana"
        [value]="weeklyAssignmentsCount().toString()"
        helper="Por evaluar"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherHome {
  #store = inject(Store);

  private currentDate = signal(new Date());
  private startDate = computed(() => startOfWeek(this.currentDate(), { weekStartsOn: 1 }));
  private endDate = computed(() => endOfWeek(this.currentDate(), { weekStartsOn: 1 }));

  #coursesCount = httpResource<number>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: '/api/v1/courses/count',
      params: toFetchQueryRecord({ schoolId }),
    };
  });

  #studentsCount = httpResource<number>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: '/api/v1/students/count',
      params: toFetchQueryRecord({ schoolId }),
    };
  });

  public statsResource = computed(() => ({
    coursesCount: this.#coursesCount.value() ?? 0,
    findManyStudentsCount: this.#studentsCount.value() ?? 0,
  }));

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

  public weeklyAssignmentsCount = computed(() => this.assignmentsResource.value()?.length ?? 0);
}
