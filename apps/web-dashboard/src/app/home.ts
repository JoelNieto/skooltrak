import { EmptyState, PageHeader, StatCard } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { toFetchQueryParams } from './core/fetch-query-params';
import Store from './core/store';
import WelcomeBanner from './shared/welcome-banner';

type DashboardStats = {
  coursesCount: number;
  findManyStudentsCount: number;
  findManyTeachersCount: number;
  findManySubjectsCount: number;
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
  user?: { email?: string | null } | null;
};

type InboxRow = {
  id: string;
  message: {
    subject: string;
    createdAt: string;
    sender: { name?: string | null; firstName?: string; lastName?: string };
  };
};

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  author: { name?: string | null; firstName?: string; lastName?: string };
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, PageHeader, StatCard, EmptyState, WelcomeBanner],
  template: `
    <!-- Welcome Banner for recently completed onboarding -->
    @if (showWelcomeBanner()) {
      <app-welcome-banner [summary]="onboardingSummary()" [firstVisit]="isFirstVisit()" />
    }

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
      <div class="card bg-base-100 lg:col-span-2 ">
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
                    {{ senderDisplayName(message.message.sender) }} ·
                    {{ message.message.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="card bg-base-100">
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

    @if (!recentNewsletters.error()) {
      <div class="mt-5">
        <div class="card bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-base-content">Boletines recientes</h2>
              <a routerLink="/admin/newsletters" class="btn btn-sm btn-ghost text-primary"> Ver todos </a>
            </div>
            @if ((recentNewsletters.value() ?? []).length === 0) {
              <lib-empty-state
                title="Sin boletines recientes"
                description="Los boletines publicados aparecerán aquí."
                icon="newspaper"
                color="info"
              />
            } @else {
              <div class="space-y-3">
                @for (newsletter of recentNewsletters.value() ?? []; track newsletter.id) {
                  <div class="rounded-lg border border-base-200 p-4 transition-colors duration-150 hover:bg-base-200">
                    <p class="font-medium text-base-content text-sm">{{ newsletter.title }}</p>
                    <p class="text-xs text-base-content/60 mt-1 line-clamp-2">
                      {{ stripHtml(newsletter.content) }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs text-base-content/60">
                        {{ authorDisplayName(newsletter.author) }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-xs"> Ver más </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <div class="card bg-base-100">
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

      <div class="card bg-base-100">
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
                    {{ teacher.user ? teacher.user.email : 'Sin correo' }} ·
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
  private http = inject(HttpClient);
  private store = inject(Store);
  private FIRST_VISIT_KEY = 'skooltrak_first_visit_shown';

  senderDisplayName(sender: InboxRow['message']['sender']): string {
    if (sender.name?.trim()) return sender.name;
    return [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  authorDisplayName(author: PublishedNewsletter['author']): string {
    if (author.name?.trim()) return author.name;
    return [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  // Onboarding status query
  public onboardingStatus = httpResource<{
    onboardingCompleted: boolean;
    schoolName?: string | null;
    degreesCount: number;
    studyPlansCount: number;
    coursesCount: number;
    groupsCount: number;
  }>(() => '/api/v1/auth/onboarding-status');

  // Check if we should show the welcome banner
  public showWelcomeBanner = computed(() => {
    const status = this.onboardingStatus.value();
    if (!status?.onboardingCompleted) return false;
    // Show if onboarding was just completed or user hasn't dismissed
    return true;
  });

  public onboardingSummary = computed(() => {
    const status = this.onboardingStatus.value();
    return {
      schoolName: status?.schoolName ?? undefined,
      degreesCount: status?.degreesCount ?? 0,
      studyPlansCount: status?.studyPlansCount ?? 0,
      coursesCount: status?.coursesCount ?? 0,
      groupsCount: status?.groupsCount ?? 0,
    };
  });

  public isFirstVisit = computed(() => {
    if (typeof localStorage === 'undefined') return false;
    const shown = localStorage.getItem(this.FIRST_VISIT_KEY);
    if (!shown) {
      // Mark as shown for next time
      localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
      return true;
    }
    return false;
  });

  public statsResource = rxResource({
    params: () => ({ schoolId: this.store.currentSchoolId() }),
    stream: ({ params }): import('rxjs').Observable<DashboardStats> => {
      if (!params.schoolId) {
        return of<DashboardStats>({
          coursesCount: 0,
          findManyStudentsCount: 0,
          findManyTeachersCount: 0,
          findManySubjectsCount: 0,
        });
      }
      const q = toFetchQueryParams({ schoolId: params.schoolId });
      return forkJoin({
        coursesCount: this.http.get<number>('/api/v1/courses/count', { params: q }),
        findManyStudentsCount: this.http.get<number>('/api/v1/students/count', { params: q }),
        findManyTeachersCount: this.http.get<number>('/api/v1/teachers/count', { params: q }),
        findManySubjectsCount: this.http.get<number>('/api/v1/subjects/count', { params: q }),
      });
    },
  });

  public recentMessages = httpResource<InboxRow[]>(() => ({
    url: '/api/v1/messages',
    params: toFetchQueryParams({ take: 5, skip: 0 }),
    defaultValue: [],
  }));

  public recentStudents = httpResource<RecentStudent[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/students`,
      params: toFetchQueryParams({
        take: 4,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        schoolId,
      }),
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

  public recentTeachers = httpResource<RecentTeacher[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/teachers`,
      params: toFetchQueryParams({
        take: 4,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        schoolId,
      }),
    };
  });
}
