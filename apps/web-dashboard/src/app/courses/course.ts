import {
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardTitle,
  courseColorVar,
  CourseCover,
  EmptyState,
  Icon,
  Loader,
  Modal,
  Toast,
  UiTab,
  UiTabContent,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatType } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import AssignmentForm from '../assignments/assignment-form';
import CourseAttendance from '../attendance/course-attendance';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import CourseGrades from '../grades/course-grades';
import CourseAssignments from './course-assignments';
import CourseFiles from './course-files';
import CourseGradeBuckets from './course-grade-buckets';
import CourseStudentGrades from './course-student-grades';

type CourseVm = {
  id: string;
  name: string;
  code: string;
  /** Resolved by the API: never null (ACA-001 BR .11). */
  color: string;
  subject?: { name?: string; icon?: string | null } | null;
  teacher?: {
    firstName?: string;
    fatherName?: string;
    name?: string;
    initials?: string;
    color?: string;
    user?: { id?: string; firstName?: string; lastName?: string; color?: string | null };
    userId?: string | null;
  } | null;
  studyPlan: { gradeMetric: unknown };
};

@Component({
  imports: [
    EmptyState,
    UiTabs,
    UiTabList,
    UiTab,
    UiTabPanel,
    UiTabContent,
    Breadcrumbs,
    Card,
    CardBody,
    CardTitle,
    CourseCover,
    Button,
    Loader,
    CourseAssignments,
    CourseAttendance,
    CourseFiles,
    CourseGradeBuckets,
    CourseGrades,
    CourseStudentGrades,
    Icon,
  ],
  template: ` @if (courseResource.isLoading()) {
      <lib-loader />
    }
    @if (courseResource.error()) {
      <p>Error al cargar curso</p>
    }
    @if (courseResource.hasValue() && courseResource.value()?.id) {
      @let course = transformedCourse()!;
      <div>
        <ui-breadcrumbs
          [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos', link: '/courses' }, { label: course.name }]"
        />
        <div uiCard class="mt-4">
          <div uiCardBody class="flex md:flex-row md:gap-4 md:items-center">
            <ui-course-cover variant="tile" [color]="course.color" [icon]="course.subject?.icon" />
            <div class="flex justify-between items-center w-full">
              <div>
                <h2 uiCardTitle class="text-xl">
                  <span
                    class="course-color-dot inline-block size-3.5 shrink-0 rounded-full"
                    [style.background-color]="colorVar(course.color)"
                    aria-hidden="true"
                  ></span>
                  {{ course.name }}
                </h2>
                <div class="flex items-center gap-1 text-sm">
                  @if (course.teacher) {
                    <div class="avatar avatar-placeholder">
                      <div class="text-white w-7 rounded-full" [style.background]="course.teacher.color">
                        <span class="text-xs">{{ course.teacher.initials }}</span>
                      </div>
                    </div>
                    {{ course.teacher.name }}
                  } @else {
                    <span class="text-sm text-ink-subtle">No hay docente asignado</span>
                  }
                </div>
                <p class="text-ink-muted">{{ course.code }}</p>
              </div>

              <div class="flex gap-2">
                @if (canStartCourseChat()) {
                  <button
                    uiButton
                    [loading]="startingChat()"
                    variant="ghost"
                    (click)="startCourseChat()"
                    [disabled]="startingChat()"
                  >
                    @if (!startingChat()) {
                      <ui-icon name="message-circle" />
                    }
                    Chat
                  </button>
                }
                @if (auth.hasPermission('MANAGE_ASSIGNMENTS')) {
                  <button uiButton variant="primary" (click)="addAssignment()">
                    <ui-icon name="clipboard-plus" />
                    Nueva asignacion
                  </button>
                }
                @if (auth.hasPermission('MANAGE_COURSES')) {
                  <button uiButton><ui-icon name="pencil" /> Editar</button>
                }
              </div>
            </div>
          </div>
        </div>
        <div uiTabs class="mt-4 flex flex-col gap-4">
          <div uiTabList [(selectedTab)]="tab" aria-label="Secciones del curso">
            <button uiTab value="grades">
              <ui-icon name="star" class="text-xl" />
              Calificaciones
            </button>
            <button uiTab value="calendar">
              <ui-icon name="calendar-days" class="text-xl" />
              Calendario
            </button>
            @if (auth.isTeacher() || auth.isAdmin()) {
              <button uiTab value="attendance">
                <ui-icon name="user-check" class="text-xl" />
                Asistencia
              </button>
            }
            <button uiTab value="participants">
              <ui-icon name="users" class="text-xl" />
              Participantes
            </button>
            <button uiTab value="files">
              <ui-icon name="folder-heart" class="text-xl" />
              Archivos
            </button>
            @if (auth.isTeacher() || auth.isAdmin()) {
              <button uiTab value="weights">
                <ui-icon name="scale" class="text-xl" />
                Ponderación
              </button>
            }
          </div>

          <div uiTabPanel uiCard value="grades" class="p-6">
            <ng-template uiTabContent>
              @if (auth.isTeacher() || auth.isAdmin()) {
                <app-course-grades [courseId]="id()" [metric]="$any(course.studyPlan.gradeMetric)" />
              }
              @if (auth.isStudent()) {
                <app-course-student-grades [courseId]="id()" [metric]="$any(course.studyPlan.gradeMetric)" />
              }
            </ng-template>
          </div>
          <div uiTabPanel uiCard value="calendar" class="p-6">
            <ng-template uiTabContent>
              <app-course-assignments [courseId]="id()" (reload)="courseResource.reload()" />
            </ng-template>
          </div>
          @if (auth.isTeacher() || auth.isAdmin()) {
            <div uiTabPanel uiCard value="attendance" class="p-6">
              <ng-template uiTabContent><app-course-attendance [courseId]="id()" /></ng-template>
            </div>
          }
          <div uiTabPanel uiCard value="participants" class="p-6">
            <ng-template uiTabContent>
              <lib-empty-state
                title="Participantes"
                description="La lista de participantes del curso estará disponible pronto."
                icon="users"
              />
            </ng-template>
          </div>
          <div uiTabPanel uiCard value="files" class="p-6">
            <ng-template uiTabContent><app-course-files [courseId]="id()" /></ng-template>
          </div>
          @if (auth.isTeacher() || auth.isAdmin()) {
            <div uiTabPanel uiCard value="weights" class="p-6">
              <ng-template uiTabContent><app-course-grade-buckets [courseId]="id()" /></ng-template>
            </div>
          }
        </div>
      </div>
    } @else if (!courseResource.isLoading() && !courseResource.error()) {
      <div>No se encontró el curso</div>
    }`,
})
export default class Course {
  public id = input.required<string>();
  public auth = inject(Auth);
  private http = inject(HttpClient);
  private modal = inject(Modal);
  private router = inject(Router);
  private toast = inject(Toast);
  protected readonly colorVar = courseColorVar;
  /** Selected section; the tab list and panels follow it. */
  readonly tab = signal('grades');
  startingChat = signal(false);

  canStartCourseChat() {
    if (!this.auth.hasPermission('MANAGE_MESSAGES')) return false;
    const course = this.courseResource.value() as {
      teacher?: { user?: { id?: string }; userId?: string | null };
    } | null;
    if (!course) return false;
    return this.auth.isAdmin() || course.teacher?.user?.id === this.auth.user()?.id;
  }

  async startCourseChat() {
    this.startingChat.set(true);
    try {
      const chat = await firstValueFrom(
        this.http.post<{ id: string }>(`/api/v1/chats/contextual`, {
          contextType: ChatType.COURSE,
          contextId: this.id(),
        }),
      );
      if (chat?.id) this.router.navigate(['/chats', chat.id]);
    } catch {
      this.toast.showError('Error al crear chat');
    } finally {
      this.startingChat.set(false);
    }
  }
  public courseResource = httpResource<CourseVm>(() => {
    const id = this.id();
    if (!isValidId(id)) {
      return undefined;
    }
    return `/api/v1/courses/${id}`;
  });

  public transformedCourse = computed(() => {
    const c = this.courseResource.value();
    if (!c?.id) return c;

    const t = c.teacher;
    if (t) {
      const color = t.user?.color ?? 'var(--ui-ink-subtle)';
      const fn = t.user?.firstName ?? t.firstName ?? '';
      const ln = t.user?.lastName ?? t.fatherName ?? '';
      const name = `${fn} ${ln}`.trim();
      const initials = `${(fn || '?').charAt(0)}${(ln || '?').charAt(0)}`.toUpperCase();
      return { ...c, teacher: { ...t, name, initials, color } };
    }
    return c;
  });

  public addAssignment() {
    this.modal.open(AssignmentForm, {
      title: 'Nueva asignacion',
      size: 'large',
      data: {
        courseId: this.id(),
      },
    });
  }
}
