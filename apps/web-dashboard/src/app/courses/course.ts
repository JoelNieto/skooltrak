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
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatType } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import AssignmentForm from '../assignments/assignment-form';
import CourseAttendance from '../attendance/course-attendance';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import GradebookGrid from '../gradebook/gradebook-grid';
import { ParentContext } from '../parent/parent-context.service';
import CourseAssignments from './course-assignments';
import CourseCalendarDialog from './course-calendar-dialog';
import CourseCustomizeDialog from './course-customize-dialog';
import { CourseAssignmentsList } from './course-assignments-list';
import CourseFiles from './course-files';
import CourseGradeBuckets from './course-grade-buckets';
import { CourseGradesSummaryView } from './course-grades-summary';
import { CourseParticipants, CourseParticipantsList } from './course-participants';
import { CourseOverview } from './course-overview';
import { CourseWork } from './course-work';

type CourseVm = {
  id: string;
  name: string;
  code: string;
  /** Resolved by the API: never null (ACA-001 BR .11). */
  color: string;
  subject?: { name?: string; icon?: string | null; area?: string | null } | null;
  teacher?: {
    firstName?: string;
    fatherName?: string;
    name?: string;
    initials?: string;
    color?: string;
    user?: { id?: string; firstName?: string; lastName?: string; color?: string | null };
    userId?: string | null;
  } | null;
  studyPlan: { name?: string; gradeMetric: unknown };
  /** FR-ACA-001.3: presigned cover photo; null keeps the color cover. */
  coverUrl?: string | null;
  /** FR-ACA-001.3: the teacher's icon; null shows the subject's. */
  icon?: string | null;
  /** FR-ACA-001.3: the course's teacher or an admin may set color and cover. */
  canCustomize?: boolean;
  /** BR-ACA-001.3: who is looking; students and parents carry the student. */
  viewer?: { kind: 'STAFF' | 'HOMEROOM' | 'STUDENT' | 'PARENT'; student: { id: string; firstName: string } | null };
  /** The student's group (students and parents). */
  classGroup?: { id: string; name: string } | null;
  /** BR-ACA-001.9 for the student's group; null for staff. */
  schedule?: { days: string; place: string | null; times: string | null } | null;
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
    GradebookGrid,
    CourseGradesSummaryView,
    CourseParticipantsList,
    CourseAssignmentsList,
    CourseOverview,
    Icon,
    RouterLink,
  ],
  template: ` @if (courseResource.isLoading()) {
      <lib-loader />
    }
    @if (courseResource.error()) {
      <!-- BR-ACA-001.3 -->
      <div class="mt-4">
        <lib-empty-state
          [title]="forbidden() ? 'No tienes acceso a este curso' : 'No se pudo cargar el curso'"
          [description]="
            forbidden() ? 'Solo lo ven sus estudiantes, sus familias y su personal.' : 'Inténtalo de nuevo más tarde.'
          "
          icon="circle-alert"
        />
        <p class="mt-2 text-center"><a routerLink="/courses" class="link link-primary">Volver a Mis cursos</a></p>
      </div>
    }
    @if (courseResource.hasValue() && courseResource.value()?.id) {
      @let course = transformedCourse()!;
      <div>
        <ui-breadcrumbs
          [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos', link: '/courses' }, { label: course.name }]"
        />
        <div uiCard class="mt-4">
          <div uiCardBody class="flex md:flex-row md:gap-4 md:items-center">
            <ui-course-cover
              variant="tile"
              [color]="course.color"
              [icon]="course.icon ?? course.subject?.icon"
              [image]="course.coverUrl"
            />
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
                <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                  @if (course.subject?.area) {
                    <span uiBadge size="sm">{{ course.subject?.area }}</span>
                  }
                  @if (course.classGroup) {
                    <span>{{ course.classGroup.name }}</span>
                  } @else if (course.studyPlan.name) {
                    <span>{{ course.studyPlan.name }}</span>
                  }
                  @if (course.schedule; as schedule) {
                    <span class="flex items-center gap-1">
                      <ui-icon name="calendar-days" class="text-base" />
                      {{ schedule.days }}{{ schedule.times ? ' · ' + schedule.times : ''
                      }}{{ schedule.place ? ' · ' + schedule.place : '' }}
                    </span>
                  }
                  @if (!family()) {
                    <span>{{ course.code }}</span>
                  }
                </p>
              </div>

              <div class="flex gap-2">
                @if (family()) {
                  <button uiButton variant="ghost" type="button" (click)="openCalendar()">
                    <ui-icon name="calendar-days" />
                    Ver calendario
                  </button>
                }
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
                @if (course.canCustomize) {
                  <button uiButton variant="ghost" type="button" (click)="customize()">
                    <ui-icon name="palette" />
                    Personalizar
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
            @if (family()) {
              <!-- FR-ACA-001.11: Resumen · Asignaciones · Calificaciones · Participantes · Recursos -->
              <button uiTab value="overview">
                <ui-icon name="house" class="text-xl" />
                Resumen
              </button>
              <button uiTab value="work">
                <ui-icon name="clipboard-list" class="text-xl" />
                Asignaciones
                @if (work.value()?.pending) {
                  <span uiBadge size="sm" tone="warning">{{ work.value()?.pending }} pendientes</span>
                }
              </button>
              <button uiTab value="grades">
                <ui-icon name="star" class="text-xl" />
                Calificaciones
              </button>
              <button uiTab value="participants">
                <ui-icon name="users" class="text-xl" />
                Participantes
                @if (participants.value()?.count) {
                  <span class="text-xs text-ink-muted">· {{ participants.value()?.count }}</span>
                }
              </button>
              <button uiTab value="files">
                <ui-icon name="folder-heart" class="text-xl" />
                Recursos
              </button>
            } @else {
              <button uiTab value="grades">
                <ui-icon name="star" class="text-xl" />
                @if (auth.isTeacher() || auth.isAdmin()) {
                  Libro de calificaciones
                } @else {
                  Calificaciones
                }
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
                @if (participants.value()?.count) {
                  <span class="text-xs text-ink-muted">· {{ participants.value()?.count }}</span>
                }
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
            }
          </div>

          @if (family()) {
            <div uiTabPanel uiCard value="overview" class="p-6">
              <ng-template uiTabContent>
                @if (work.value(); as w) {
                  <app-course-overview [work]="w" [teacher]="$any(course.teacher) ?? null" (seeAll)="tab.set('work')">
                    <app-course-grades-summary
                      [courseId]="id()"
                      [studentId]="course.viewer?.kind === 'PARENT' ? (course.viewer?.student?.id ?? null) : null"
                      [compact]="true"
                    />
                  </app-course-overview>
                }
              </ng-template>
            </div>
            <div uiTabPanel uiCard value="work" class="p-6">
              <ng-template uiTabContent>
                @if (work.value(); as w) {
                  <app-course-assignments-list [work]="w" />
                }
              </ng-template>
            </div>
          }

          <div uiTabPanel uiCard value="grades" class="p-6">
            <ng-template uiTabContent>
              @if (auth.isTeacher() || auth.isAdmin()) {
                <app-gradebook-grid [courseId]="id()" />
              }
              @if (family()) {
                <app-course-grades-summary
                  [courseId]="id()"
                  [studentId]="course.viewer?.kind === 'PARENT' ? (course.viewer?.student?.id ?? null) : null"
                />
              }
            </ng-template>
          </div>
          @if (!family()) {
            <!-- Families open the calendar from the header (a panel without its tab would show under every tab). -->
            <div uiTabPanel uiCard value="calendar" class="p-6">
              <ng-template uiTabContent>
                <app-course-assignments [courseId]="id()" (reload)="courseResource.reload()" />
              </ng-template>
            </div>
          }
          @if (auth.isTeacher() || auth.isAdmin()) {
            <div uiTabPanel uiCard value="attendance" class="p-6">
              <ng-template uiTabContent><app-course-attendance [courseId]="id()" /></ng-template>
            </div>
          }
          <div uiTabPanel uiCard value="participants" class="p-6">
            <ng-template uiTabContent>
              @if (participants.value(); as p) {
                <app-course-participants [data]="p" />
              } @else if (participants.error()) {
                <p class="text-sm text-ink-muted">No se pudieron cargar los participantes.</p>
              }
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
  #ctx = inject(ParentContext);

  /** BR-ACA-001.3: students and parents get the family view of the page (FR-ACA-001.11). */
  protected readonly family = computed(() => {
    const kind = this.courseResource.value()?.viewer?.kind;
    return kind === 'STUDENT' || kind === 'PARENT';
  });
  /** Selected section; the tab list and panels follow it. Families start on Resumen. */
  readonly tab = linkedSignal<boolean, string>({
    source: this.family,
    computation: (family) => (family ? 'overview' : 'grades'),
  });

  protected readonly forbidden = computed(() => {
    const error = this.courseResource.error();
    return error instanceof HttpErrorResponse && error.status === 403;
  });

  /** FR-ACA-001.15: teachers and students; the tab shows the head count (FR .11). */
  public participants = httpResource<CourseParticipants>(() => {
    const course = this.courseResource.value();
    if (!course?.id) return undefined;
    const studentId = course.viewer?.kind === 'PARENT' ? course.viewer.student?.id : undefined;
    const params: Record<string, string> = studentId ? { studentId } : {};
    return { url: `/api/v1/courses/${course.id}/participants`, params };
  });

  /** FR-ACA-001.12, .13: the student's work in this course. */
  public work = httpResource<CourseWork>(() => {
    if (!this.family()) return undefined;
    const studentId = this.courseResource.value()?.viewer?.student?.id;
    const params: Record<string, string> = studentId ? { studentId } : {};
    return { url: `/api/v1/courses/${this.id()}/work`, params };
  });
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
    // Parents see the course for the child chosen in the shared switcher (BR-ACA-001.2).
    const childId = this.auth.isParent() ? this.#ctx.selectedChild()?.studentId : undefined;
    const params: Record<string, string> = childId ? { studentId: childId } : {};
    return { url: `/api/v1/courses/${id}`, params };
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

  /** FR-ACA-001.3: color and cover, for the course's teacher or an admin. */
  public customize() {
    const course = this.courseResource.value();
    if (!course) return;
    this.modal
      .open<boolean, CourseCustomizeDialog>(CourseCustomizeDialog, {
        title: 'Personalizar curso',
        size: 'medium',
        data: {
          courseId: course.id,
          color: course.color,
          icon: course.icon ?? null,
          subjectIcon: course.subject?.icon ?? null,
          coverUrl: course.coverUrl ?? null,
        },
      })
      .closed.subscribe((changed) => {
        if (changed) this.courseResource.reload();
      });
  }

  /** FR-ACA-001.10: "Ver calendario" for students and parents. */
  public openCalendar() {
    this.modal.open(CourseCalendarDialog, {
      title: 'Calendario del curso',
      size: 'large',
      data: { courseId: this.id() },
    });
  }

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
