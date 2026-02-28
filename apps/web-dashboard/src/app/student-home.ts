import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { endOfWeek, startOfWeek } from 'date-fns';
import { map, of } from 'rxjs';
import { EmptyState, PageHeader, StatCard } from '@/ui';
import Store from './core/store';
@Component({
  selector: 'app-student-home',
  imports: [DatePipe, RouterLink, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header
      title="Dashboard del estudiante"
      subtitle="Lo más importante de tu semana académica."
    />

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
            <h2 class="text-lg font-semibold text-base-content">
              Asignaciones próximas
            </h2>
            <a routerLink="/assignments" class="link link-primary text-sm">
              Ver todas
            </a>
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
                    {{ assignment.course?.name }} ·
                    {{ assignment.date | date : 'mediumDate' }}
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
            <h2 class="text-lg font-semibold text-base-content">
              Mensajes recientes
            </h2>
            <a routerLink="/messages" class="link link-primary text-sm">
              Ir a mensajes
            </a>
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
                      {{ stripHtml(newsletter.content ?? '') }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-sm text-base-content/70">
                        {{ newsletter.author?.name }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-sm">
                        Ver más
                      </a>
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
  private apollo = inject(Apollo);
  private store = inject(Store);

  private currentDate = signal(new Date());
  private startDate = computed(() =>
    startOfWeek(this.currentDate(), { weekStartsOn: 1 })
  );
  private endDate = computed(() =>
    endOfWeek(this.currentDate(), { weekStartsOn: 1 })
  );

  public statsResource = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of({
          coursesCount: 0,
          findManyMessagesCount: 0,
        });
      }
      return this.apollo
        .watchQuery<{
          coursesCount: number;
          findManyMessagesCount: number;
        }>({
          query: gql`
            query StudentDashboardStats($schoolId: String) {
              coursesCount(schoolId: $schoolId)
              findManyMessagesCount
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data ?? { coursesCount: 0, findManyMessagesCount: 0 }));
    },
  });

  public assignmentsResource = rxResource({
    params: () => ({
      startDate: this.startDate(),
      endDate: this.endDate(),
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of<AssignmentPreview[]>([]);
      }
      return this.apollo
        .watchQuery<{ assignmentsBySchoolId: AssignmentPreview[] }>({
          query: gql`
            query StudentAssignments(
              $schoolId: String!
              $startDate: String!
              $endDate: String!
            ) {
              assignmentsBySchoolId(
                schoolId: $schoolId
                startDate: $startDate
                endDate: $endDate
              ) {
                id
                title
                date
                course {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
            startDate: params.startDate.toISOString(),
            endDate: params.endDate.toISOString(),
          },
        })
        .valueChanges.pipe(map((result) => result.data?.assignmentsBySchoolId ?? []));
    },
  });

  public recentMessages = rxResource({
    params: () => ({ take: 4, skip: 0 }),
    stream: ({ params }) => {
      return this.apollo
        .watchQuery<{ findManyMessages: RecentMessage[] }>({
          query: gql`
            query StudentRecentMessages($take: Int!, $skip: Int!) {
              findManyMessages(take: $take, skip: $skip) {
                id
                createdAt
                message {
                  id
                  subject
                  createdAt
                  sender {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: params,
        })
        .valueChanges.pipe(map((result) => result.data?.findManyMessages ?? []));
    },
  });

  public recentNewsletters = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of<RecentNewsletter[]>([]);
      }
      return this.apollo
        .watchQuery<{ publishedNewsletters: RecentNewsletter[] }>({
          query: gql`
            query StudentRecentNewsletters($schoolId: String!, $take: Int!) {
              publishedNewsletters(schoolId: $schoolId, take: $take) {
                id
                title
                content
                publishedAt
                author {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
            take: 3,
          },
        })
        .valueChanges.pipe(map((result) => result.data?.publishedNewsletters ?? []));
    },
  });

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }

  public upcomingAssignments = computed(() => {
    const assignments = this.assignmentsResource.value() ?? [];
    return [...assignments]
      .sort(
        (a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
      )
      .slice(0, 4);
  });

  public weeklyAssignmentsCount = computed(
    () => this.assignmentsResource.value()?.length ?? 0
  );
}

type AssignmentPreview = Prisma.AssignmentGetPayload<{
  include: { course: true };
}>;

type RecentNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: { id: string; name: string };
};

type RecentMessage = {
  id: string;
  createdAt: string;
  message: {
    id: string;
    subject: string;
    createdAt: string;
    sender: { id: string; name: string };
  };
};
