import { EmptyState, PageHeader, StatCard } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from './core/store';

type DashboardStats = {
  coursesCount: number;
  findManyStudentsCount: number;
  findManyTeachersCount: number;
  findManySubjectsCount: number;
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

type RecentStudent = {
  id: string;
  fullName: string;
  createdAt: string;
  classGroup?: { name: string } | null;
};

type RecentTeacher = {
  id: string;
  fullName: string;
  createdAt: string;
  user: { email: string };
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header title="Panel administrativo" subtitle="Resumen general de la institución." />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card
        label="Estudiantes"
        [value]="(statsResource.value()?.findManyStudentsCount ?? 0).toString()"
        helper="Matriculados"
        icon="school"
        color="primary"
      />
      <lib-stat-card
        label="Docentes"
        [value]="(statsResource.value()?.findManyTeachersCount ?? 0).toString()"
        helper="Activos"
        icon="groups"
        color="accent"
      />
      <lib-stat-card
        label="Cursos"
        [value]="(statsResource.value()?.coursesCount ?? 0).toString()"
        helper="En la institución"
        icon="menu_book"
        color="info"
      />
      <lib-stat-card
        label="Asignaturas"
        [value]="(statsResource.value()?.findManySubjectsCount ?? 0).toString()"
        helper="Plan académico"
        icon="library_books"
        color="success"
      />
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-3">
      <div class="card border border-base-300 bg-base-100 lg:col-span-2 shadow-sm">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-base-content">Mensajes recientes</h2>
            <a routerLink="/messages" class="btn btn-sm btn-ghost text-primary"> Ver todos </a>
          </div>
          @if ((recentMessages.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Las notificaciones nuevas aparecerán aquí."
              icon="mail"
              color="primary"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (message of recentMessages.value() ?? []; track message.id) {
                <div
                  class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200 cursor-pointer"
                >
                  <p class="font-medium text-base-content text-sm">
                    {{ message.message.subject }}
                  </p>
                  <div class="text-xs text-base-content/60 mt-1">
                    {{ message.message.sender.name }} ·
                    {{ message.message.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="text-base font-semibold text-base-content">Acciones rápidas</h2>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 mt-2">
            <a
              routerLink="/admin/students"
              class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-primary">school</span>
              <div>
                <p class="font-medium text-sm text-base-content">Gestionar alumnos</p>
                <p class="text-xs text-base-content/60">Altas y seguimiento</p>
              </div>
            </a>
            <a
              routerLink="/admin/teachers"
              class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-accent">groups</span>
              <div>
                <p class="font-medium text-sm text-base-content">Gestionar docentes</p>
                <p class="text-xs text-base-content/60">Equipo académico</p>
              </div>
            </a>
            <a
              routerLink="/admin/subjects"
              class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-info">library_books</span>
              <div>
                <p class="font-medium text-sm text-base-content">Asignaturas</p>
                <p class="text-xs text-base-content/60">Plan curricular</p>
              </div>
            </a>
            <a
              routerLink="/messages"
              class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-success">forum</span>
              <div>
                <p class="font-medium text-sm text-base-content">Mensajería</p>
                <p class="text-xs text-base-content/60">Comunicación interna</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <div class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="text-base font-semibold text-base-content">Últimos estudiantes</h2>
          @if ((recentStudents.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin estudiantes recientes"
              description="Las nuevas matrículas aparecerán aquí."
              icon="school"
              color="info"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (student of recentStudents.value() ?? []; track student.id) {
                <div class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200">
                  <p class="font-medium text-sm text-base-content">
                    {{ student.fullName }}
                  </p>
                  <div class="text-xs text-base-content/60 mt-1">
                    {{ student.classGroup?.name ?? 'Sin grupo' }} ·
                    {{ student.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="text-base font-semibold text-base-content">Docentes recientes</h2>
          @if ((recentTeachers.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin docentes recientes"
              description="Nuevas contrataciones aparecerán aquí."
              icon="groups"
              color="accent"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (teacher of recentTeachers.value() ?? []; track teacher.id) {
                <div class="rounded-lg border border-base-200 p-3 transition-colors duration-150 hover:bg-base-200">
                  <p class="font-medium text-sm text-base-content">
                    {{ teacher.fullName }}
                  </p>
                  <div class="text-xs text-base-content/60 mt-1">
                    {{ teacher.user.email }} ·
                    {{ teacher.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private apollo = inject(Apollo);
  private store = inject(Store);

  public statsResource = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of<DashboardStats>({
          coursesCount: 0,
          findManyStudentsCount: 0,
          findManyTeachersCount: 0,
          findManySubjectsCount: 0,
        });
      }
      return this.apollo
        .watchQuery<DashboardStats>({
          query: gql`
            query AdminDashboardStats($schoolId: String) {
              coursesCount(schoolId: $schoolId)
              findManyStudentsCount(schoolId: $schoolId)
              findManyTeachersCount(schoolId: $schoolId)
              findManySubjectsCount(schoolId: $schoolId)
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data));
    },
  });

  public recentMessages = rxResource({
    params: () => ({ take: 5, skip: 0 }),
    stream: ({ params }) => {
      return this.apollo
        .watchQuery<{ findManyMessages: RecentMessage[] }>({
          query: gql`
            query RecentMessages($take: Int!, $skip: Int!) {
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

  public recentStudents = rxResource({
    params: () => ({ take: 4, schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of<RecentStudent[]>([]);
      }
      return this.apollo
        .watchQuery<{ students: RecentStudent[] }>({
          query: gql`
            query RecentStudents($take: Int!, $orderBy: String, $orderDirection: String, $schoolId: String) {
              students(take: $take, orderBy: $orderBy, orderDirection: $orderDirection, schoolId: $schoolId) {
                id
                fullName
                createdAt
                classGroup {
                  name
                }
              }
            }
          `,
          variables: {
            take: params.take,
            orderBy: 'createdAt',
            orderDirection: 'desc',
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.students));
    },
  });

  public recentTeachers = rxResource({
    params: () => ({ take: 4, schoolId: this.store.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of<RecentTeacher[]>([]);
      }
      return this.apollo
        .watchQuery<{ teachers: RecentTeacher[] }>({
          query: gql`
            query RecentTeachers($take: Int!, $orderBy: String, $orderDirection: String, $schoolId: String) {
              teachers(take: $take, orderBy: $orderBy, orderDirection: $orderDirection, schoolId: $schoolId) {
                id
                fullName
                createdAt
                user {
                  email
                }
              }
            }
          `,
          variables: {
            take: params.take,
            orderBy: 'createdAt',
            orderDirection: 'desc',
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.teachers));
    },
  });
}
