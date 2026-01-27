import { EmptyState, PageHeader, StatCard } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { endOfWeek, startOfWeek } from 'date-fns';
import { map, of } from 'rxjs';
import Store from './core/store';
@Component({
  selector: 'app-teacher-home',
  imports: [DatePipe, RouterLink, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header title="Dashboard docente" subtitle="Resumen de tus clases y seguimiento semanal." />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card
        label="Cursos activos"
        [value]="(statsResource.value()?.coursesCount ?? 0).toString()"
        helper="En la institución"
      />
      <lib-stat-card
        label="Estudiantes"
        [value]="(statsResource.value()?.findManyStudentsCount ?? 0).toString()"
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
                    {{ message.message.subject }}
                  </p>
                  <div class="text-sm text-base-content/70">
                    {{ message.message.sender.name }} ·
                    {{ message.message.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherHome {
  private apollo = inject(Apollo);
  private store = inject(Store);

  private currentDate = signal(new Date());
  private startDate = computed(() => startOfWeek(this.currentDate(), { weekStartsOn: 1 }));
  private endDate = computed(() => endOfWeek(this.currentDate(), { weekStartsOn: 1 }));

  public statsResource = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of({
          coursesCount: 0,
          findManyStudentsCount: 0,
        });
      }
      return this.apollo
        .watchQuery<{
          coursesCount: number;
          findManyStudentsCount: number;
        }>({
          query: gql`
            query TeacherDashboardStats($schoolId: String) {
              coursesCount(schoolId: $schoolId)
              findManyStudentsCount(schoolId: $schoolId)
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data));
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
            query TeacherAssignments($schoolId: String!, $startDate: String!, $endDate: String!) {
              assignmentsBySchoolId(schoolId: $schoolId, startDate: $startDate, endDate: $endDate) {
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
        .valueChanges.pipe(map((result) => result.data.assignmentsBySchoolId));
    },
  });

  public recentMessages = rxResource({
    params: () => ({ take: 4, skip: 0 }),
    stream: ({ params }) => {
      return this.apollo
        .watchQuery<{ findManyMessages: RecentMessage[] }>({
          query: gql`
            query TeacherRecentMessages($take: Int!, $skip: Int!) {
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
        .valueChanges.pipe(map((result) => result.data.findManyMessages));
    },
  });

  public upcomingAssignments = computed(() => {
    const assignments = this.assignmentsResource.value() ?? [];
    return [...assignments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);
  });

  public weeklyAssignmentsCount = computed(() => this.assignmentsResource.value()?.length ?? 0);
}

type AssignmentPreview = Prisma.AssignmentGetPayload<{
  include: { course: true };
}>;

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
