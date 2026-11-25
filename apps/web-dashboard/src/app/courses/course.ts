import {
  Breadcrumbs,
  Button,
  Card,
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
  Alert,
  UiSelect,
} from '#/ui';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import AssignmentForm from '../assignments/assignment-form';
import CourseAttendance from '../attendance/course-attendance';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import GradebookGrid from '../gradebook/gradebook-grid';
import { ParentContext } from '../parent/parent-context.service';
import CourseAssignments from './course-assignments';
import CourseCalendarDialog from './course-calendar-dialog';
import CourseCustomizeDialog from './course-customize-dialog';
import CourseRosterDialog from './course-roster-dialog';
import { CourseAssignmentsList } from './course-assignments-list';
import CourseFiles from './course-files';
import CourseGradeBuckets from './course-grade-buckets';
import { CourseGradesSummaryView } from './course-grades-summary';
import { CourseParticipants, CourseParticipantsList } from './course-participants';
import { CourseOverview } from './course-overview';
import { CourseChannelsList } from './course-channels-list';
import {
  askChannel,
  assignmentDueText,
  ChannelAssignment,
  ChannelViewer,
  courseChannels,
  newCount,
  openChannelId,
  toAnswerTotal,
} from './course-channels';
import Channel from '../communication/channel';
import { CourseWork, WORK_TYPES } from './course-work';
import { CommunicationApi } from '../communication/communication-api';
import type { ChannelSummary } from '@/shared';

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
    Alert,
    UiSelect,
    EmptyState,
    UiTabs,
    UiTabList,
    UiTab,
    UiTabPanel,
    UiTabContent,
    Breadcrumbs,
    Card,
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
    CourseChannelsList,
    Channel,
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
        <div uiTabs class="mt-4 flex flex-col gap-4">
          <!-- FR-ACA-001.10: the cover as a banner, then name, area, group, teacher, schedule and room. -->
          <section uiCard class="overflow-hidden" aria-labelledby="course-title">
            <ui-course-cover
              variant="banner"
              [color]="course.color"
              [icon]="course.icon ?? course.subject?.icon"
              [image]="course.coverUrl"
            >
              @if (course.canCustomize) {
                <button
                  uiButton
                  size="sm"
                  type="button"
                  class="absolute right-5 bottom-5 rounded-full border-0 bg-surface-1 text-ink-strong hover:bg-surface-2"
                  (click)="customize()"
                >
                  <ui-icon name="palette" />
                  Personalizar
                </button>
              }
            </ui-course-cover>
            <div class="flex flex-wrap items-start justify-between gap-5 px-6 py-5 md:px-8">
              <div class="flex min-w-0 flex-col gap-2.5">
                <div class="flex flex-wrap items-center gap-3">
                  <span
                    class="course-color-dot inline-block size-3.5 shrink-0 rounded-full"
                    [style.background-color]="colorVar(course.color)"
                    aria-hidden="true"
                  ></span>
                  <h1 id="course-title" class="text-2xl font-bold text-ink-strong md:text-3xl">{{ course.name }}</h1>
                  @if (course.subject?.area) {
                    <span uiBadge>{{ course.subject?.area }}</span>
                  }
                  @if (course.classGroup) {
                    <span uiBadge>{{ course.classGroup.name }}</span>
                  } @else if (course.studyPlan.name) {
                    <span uiBadge>{{ course.studyPlan.name }}</span>
                  }
                </div>
                <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink">
                  @if (course.teacher) {
                    <span class="flex items-center gap-2">
                      <span class="avatar avatar-placeholder" aria-hidden="true">
                        <span class="w-7 rounded-full text-white" [style.background]="course.teacher.color">
                          <span class="text-xs">{{ course.teacher.initials }}</span>
                        </span>
                      </span>
                      Prof. {{ course.teacher.name }}
                    </span>
                  } @else {
                    <span class="text-ink-subtle">No hay docente asignado</span>
                  }
                  @if (course.schedule; as schedule) {
                    <span class="flex items-center gap-1.5">
                      <ui-icon name="calendar-days" class="text-base text-ink-muted" />
                      {{ schedule.days }}{{ schedule.times ? ' · ' + schedule.times : '' }}
                    </span>
                    @if (schedule.place) {
                      <span class="flex items-center gap-1.5">
                        <ui-icon name="map-pin" class="text-base text-ink-muted" />
                        {{ schedule.place }}
                      </span>
                    }
                  }
                  @if (!family()) {
                    <span class="text-ink-muted">{{ course.code }}</span>
                  }
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                @if (family()) {
                  <button uiButton variant="secondary" type="button" (click)="openCalendar()">
                    <ui-icon name="calendar-days" />
                    Ver calendario
                  </button>
                }
                @if (ask(); as channel) {
                  <!-- FR-ACA-001.25: the course conversation, where the student replies under the latest post. -->
                  <button uiButton variant="primary" type="button" (click)="openInTab(channel.id)">
                    <ui-icon name="message-circle" />
                    Preguntar en el curso
                  </button>
                }
                @if (canOpenChannel() && !showChannels()) {
                  <!-- Without COMMUNICATION_VIEW managers keep the Canal button (BR-ACA-001.19). -->
                  <button
                    uiButton
                    variant="ghost"
                    type="button"
                    [loading]="openingChannel()"
                    [disabled]="openingChannel()"
                    (click)="openChannel()"
                  >
                    @if (!openingChannel()) {
                      <ui-icon name="megaphone" />
                    }
                    Canal
                  </button>
                }
                @if (staff() && auth.hasPermission('MANAGE_ASSIGNMENTS')) {
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
            <!-- FR-ACA-001.11: the section tabs close the header, as in the design. -->
            <div
              uiTabList
              variant="line"
              [(selectedTab)]="tab"
              aria-label="Secciones del curso"
              class="border-t border-line px-4 md:px-6"
            >
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
                @if (showChannels()) {
                  <!-- FR-ACA-001.21 -->
                  <button uiTab value="channels">
                    <ui-icon name="message-circle" class="text-xl" />
                    Canales
                    @if (channelsUnread()) {
                      <span uiBadge tone="new" size="sm">{{ newCount(channelsUnread()) }}</span>
                    }
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
                @if (showChannels()) {
                  <!-- FR-ACA-001.27: managers post, see receipts and answer here. -->
                  <button uiTab value="channels">
                    <ui-icon name="message-circle" class="text-xl" />
                    Canales
                    @if (channelsToAnswer()) {
                      <!-- FR-ACA-001.28 -->
                      <span uiBadge tone="new" size="sm">{{ channelsToAnswer() }} por responder</span>
                    }
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
          </section>
          @if (homeroom()) {
            <!-- FR-ACA-001.18, BR .16: read-only, one student of the homeroom group at a time. -->
            <div uiAlert tone="info" class="flex flex-wrap items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <ui-icon name="eye" />
                Vista de docente consejero: solo lectura, con las calificaciones publicadas.
              </span>
              <label class="flex items-center gap-2 text-sm">
                Estudiante
                <select
                  uiSelect
                  size="sm"
                  aria-label="Estudiante del grupo"
                  [value]="homeroomStudentId() ?? ''"
                  (change)="homeroomStudentId.set($any($event.target).value)"
                >
                  @for (s of participants.value()?.students ?? []; track s.id) {
                    <option [value]="s.id" [selected]="s.id === homeroomStudentId()">{{ s.name }}</option>
                  }
                </select>
              </label>
            </div>
          }
          @if (family()) {
            <div uiTabPanel uiCard value="overview" class="p-6">
              <ng-template uiTabContent>
                @if (work.value(); as w) {
                  <app-course-overview
                    [work]="w"
                    [teacher]="$any(course.teacher) ?? null"
                    [linkable]="!homeroom()"
                    (seeAll)="tab.set('work')"
                  >
                    <app-course-grades-summary [courseId]="id()" [studentId]="viewedStudentId()" [compact]="true" />
                    @if (showChannels() && (channelsRes.error() || hasOpenChannels())) {
                      <!-- FR-ACA-001.22: hidden when the course has no open channels. -->
                      <section courseOverviewAside aria-labelledby="overview-channels">
                        <div class="mb-2 flex items-center justify-between">
                          <h3 id="overview-channels" class="text-sm font-semibold text-ink-strong">Canales</h3>
                          <button type="button" class="link link-primary text-sm" (click)="tab.set('channels')">
                            Ver todos
                          </button>
                        </div>
                        <app-course-channels-list
                          [channels]="channels()"
                          [error]="!!channelsRes.error()"
                          [compact]="true"
                          (retry)="channelsRes.reload()"
                          (choose)="openInTab($event)"
                        />
                      </section>
                    }
                  </app-course-overview>
                }
              </ng-template>
            </div>
            <div uiTabPanel uiCard value="work" class="p-6">
              <ng-template uiTabContent>
                @if (work.value(); as w) {
                  <app-course-assignments-list [work]="w" [linkable]="!homeroom()" />
                }
              </ng-template>
            </div>
          }

          @if (showChannels()) {
            <div uiTabPanel uiCard value="channels" class="p-6">
              <ng-template uiTabContent>
                <!-- FR-ACA-001.26, .27: the list, and the chosen channel beside it; stacked on a phone. -->
                <div class="grid gap-6 md:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
                  <div class="md:block" [class.hidden]="phoneShowsChannel()">
                    @if (channelsViewer() === 'MANAGER') {
                      <button
                        uiButton
                        variant="secondary"
                        size="sm"
                        type="button"
                        class="mb-3 w-full"
                        (click)="newCourseChannel()"
                      >
                        <ui-icon name="plus" />
                        Nuevo canal para este curso
                      </button>
                    }
                    <app-course-channels-list
                      [channels]="channels()"
                      [loading]="channelsRes.isLoading()"
                      [error]="!!channelsRes.error()"
                      [selectedId]="shownChannelId()"
                      [emptyDescription]="
                        channelsViewer() === 'MANAGER'
                          ? 'Crea el primero con «Nuevo canal para este curso».'
                          : 'Cuando tu docente cree un canal para el curso, aparecerá aquí.'
                      "
                      (retry)="channelsRes.reload()"
                      (choose)="openInTab($event)"
                    />
                  </div>
                  <div class="min-w-0 md:block" [class.hidden]="!phoneShowsChannel()">
                    @if (shownChannelId(); as channelId) {
                      <button
                        uiButton
                        variant="ghost"
                        size="sm"
                        type="button"
                        class="mb-3 md:hidden"
                        (click)="phoneShowsChannel.set(false)"
                      >
                        <ui-icon name="arrow-left" />
                        Volver a canales
                      </button>
                      @if (shownAssignment(); as assignment) {
                        <!-- FR-ACA-001.29: the Q&A channel's assignment, above its posts. -->
                        <div
                          class="mb-4 flex flex-wrap items-center gap-3 rounded-box border border-line bg-surface-1 p-4"
                        >
                          <ui-icon [name]="workType(assignment.type).icon" class="text-2xl text-primary" />
                          <div class="min-w-0 flex-1">
                            <p class="font-semibold text-ink-strong">{{ assignment.title }}</p>
                            <p class="text-sm text-ink-muted">
                              {{ workType(assignment.type).label }} · {{ dueText(assignment.dates) }}
                            </p>
                            <p class="text-xs text-ink-muted">{{ shownChannel()?.kind }}</p>
                          </div>
                          <a uiButton variant="ghost" size="sm" [routerLink]="['/assignments', assignment.id]">
                            Ver asignación
                          </a>
                        </div>
                      }
                      <app-channel
                        [id]="channelId"
                        [embedded]="true"
                        (read)="channelsRes.reload()"
                        (changed)="channelsRes.reload()"
                      />
                    } @else if (channels().length) {
                      <lib-empty-state
                        [title]="
                          channelsViewer() === 'MANAGER'
                            ? 'Elige un canal para publicar o responder'
                            : 'Elige un canal para leerlo'
                        "
                        description="Sus publicaciones y respuestas se abren aquí, sin salir del curso."
                        icon="message-circle"
                      />
                    }
                  </div>
                </div>
              </ng-template>
            </div>
          }

          <div uiTabPanel uiCard value="grades" class="p-6">
            <ng-template uiTabContent>
              @if (staff()) {
                <app-gradebook-grid [courseId]="id()" />
              }
              @if (family()) {
                <app-course-grades-summary [courseId]="id()" [studentId]="viewedStudentId()" />
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
          @if (staff()) {
            <div uiTabPanel uiCard value="attendance" class="p-6">
              <ng-template uiTabContent><app-course-attendance [courseId]="id()" /></ng-template>
            </div>
          }
          <div uiTabPanel uiCard value="participants" class="p-6">
            <ng-template uiTabContent>
              @if (auth.hasPermission('MANAGE_COURSES')) {
                <!-- FR-ACA-001.19: admins add and remove students (electives, exemptions). -->
                <div class="mb-4 flex justify-end">
                  <button uiButton variant="secondary" size="sm" type="button" (click)="manageRoster()">
                    <ui-icon name="user-cog" />
                    Gestionar estudiantes
                  </button>
                </div>
              }
              @if (participants.value(); as p) {
                <app-course-participants [data]="p" />
              } @else if (participants.error()) {
                <p class="text-sm text-ink-muted">No se pudieron cargar los participantes.</p>
              }
            </ng-template>
          </div>
          <div uiTabPanel uiCard value="files" class="p-6">
            <ng-template uiTabContent><app-course-files [courseId]="id()" [readOnly]="homeroom()" /></ng-template>
          </div>
          @if (staff()) {
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
  /** FR-ACA-001.26: `?canal=<id>`, the channel open in the Canales tab. */
  readonly canal = input<string>();
  public auth = inject(Auth);
  private modal = inject(Modal);
  private router = inject(Router);
  #route = inject(ActivatedRoute);
  private toast = inject(Toast);
  protected readonly colorVar = courseColorVar;
  #ctx = inject(ParentContext);

  protected readonly viewerKind = computed(() => this.courseResource.value()?.viewer?.kind);
  /** The course's teacher or an admin: the only viewers with write actions (BR-ACA-001.3). */
  protected readonly staff = computed(() => this.viewerKind() === 'STAFF');
  /** A homeroom teacher's read-only view of a colleague's course (FR-ACA-001.18, BR .16). */
  protected readonly homeroom = computed(() => this.viewerKind() === 'HOMEROOM');
  /**
   * BR-ACA-001.3: students and parents get the family view of the page (FR-ACA-001.11); so does a
   * homeroom teacher, read-only, for one student of their group at a time (BR .16).
   */
  protected readonly family = computed(() => {
    const kind = this.viewerKind();
    return kind === 'STUDENT' || kind === 'PARENT' || kind === 'HOMEROOM';
  });
  /** BR .16: the homeroom teacher's chosen student; starts on the one the API picked. */
  protected readonly homeroomStudentId = linkedSignal(() =>
    this.homeroom() ? (this.courseResource.value()?.viewer?.student?.id ?? null) : null,
  );
  /** Whose work and grades the family view shows: a parent's child, a homeroom teacher's pick, else the caller. */
  protected readonly viewedStudentId = computed(() => {
    const viewer = this.courseResource.value()?.viewer;
    if (viewer?.kind === 'HOMEROOM') return this.homeroomStudentId();
    return viewer?.kind === 'PARENT' ? (viewer.student?.id ?? null) : null;
  });
  /** Selected section; the tab list and panels follow it. Families start on Resumen. */
  readonly tab = linkedSignal<{ family: boolean; canal: boolean }, string>({
    source: () => ({ family: this.family(), canal: !!this.canal() && this.showChannels() }),
    // FR-ACA-001.26, .27: a `?canal=` link opens on the Canales tab.
    computation: ({ family, canal }) => (canal ? 'channels' : family ? 'overview' : 'grades'),
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
    const studentId = this.viewedStudentId();
    const params: Record<string, string> = studentId ? { studentId } : {};
    return { url: `/api/v1/courses/${this.id()}/work`, params };
  });
  private communication = inject(CommunicationApi);

  /**
   * FR-ACA-001.21, .22, .27: students and parents read the course's channels from COM-003, and its
   * teacher or an admin manage them in the same tab. A homeroom teacher is neither manager nor member
   * (BR-ACA-001.19); without COMMUNICATION_VIEW nothing is requested (BR .17).
   */
  protected readonly channelsViewer = computed<ChannelViewer | null>(() => {
    if (!this.auth.hasPermission('COMMUNICATION_VIEW')) return null;
    const kind = this.viewerKind();
    if (kind === 'STUDENT' || kind === 'PARENT') return kind;
    // FR-ACA-001.27: the course's teacher or an admin, who manage its channels (BR-COM-003.3).
    return this.canOpenChannel() ? 'MANAGER' : null;
  });
  protected readonly showChannels = computed(() => !!this.channelsViewer());
  protected readonly channelsRes = httpResource<ChannelSummary[]>(() =>
    this.showChannels() ? '/api/v1/communication/channels' : undefined,
  );
  protected readonly channels = computed(() => {
    const viewer = this.channelsViewer();
    return viewer ? courseChannels(this.channelsRes.value() ?? [], this.id(), viewer) : [];
  });
  /** FR-ACA-001.25: students only; hidden without an open course conversation. */
  protected readonly ask = computed(() => (this.viewerKind() === 'STUDENT' ? askChannel(this.channels()) : null));
  protected readonly hasOpenChannels = computed(() => this.channels().some((c) => !c.archived));
  /** The tab's count: unread posts in the course's open channels. */
  protected readonly channelsUnread = computed(() =>
    this.channels().reduce((sum, c) => sum + (c.archived ? 0 : c.unread), 0),
  );
  protected readonly newCount = newCount;
  /** FR-ACA-001.28: managers' "por responder" across the course's open channels. */
  protected readonly channelsToAnswer = computed(() =>
    this.channelsViewer() === 'MANAGER' ? toAnswerTotal(this.channels()) : 0,
  );

  /** FR-ACA-001.26: the channel open beside the list; only one of the course's, never by itself. */
  protected readonly shownChannelId = computed(() => openChannelId(this.channels(), this.canal()));
  /** FR-ACA-001.29: the open channel, and its assignment when it is an assignment's Q&A channel. */
  protected readonly shownChannel = computed(() => this.channels().find((c) => c.id === this.shownChannelId()) ?? null);
  protected readonly assignmentRes = httpResource<ChannelAssignment>(() => {
    const channel = this.shownChannel();
    return channel?.scope === 'ASSIGNMENT' && channel.assignmentId
      ? `/api/v1/assignments/${channel.assignmentId}`
      : undefined;
  });
  protected readonly shownAssignment = computed(() =>
    this.shownChannel()?.scope === 'ASSIGNMENT' ? (this.assignmentRes.value() ?? null) : null,
  );
  protected readonly dueText = assignmentDueText;
  protected workType(type: string) {
    return WORK_TYPES[type as keyof typeof WORK_TYPES] ?? WORK_TYPES.NEW;
  }
  /** On a phone the open channel replaces the list until "Volver a canales". */
  protected readonly phoneShowsChannel = linkedSignal(() => !!this.canal());

  /** FR-ACA-001.26: open a channel inside the Canales tab and keep it in the URL. */
  protected openInTab(channelId: string) {
    this.tab.set('channels');
    this.phoneShowsChannel.set(true);
    void this.router.navigate([], {
      relativeTo: this.#route,
      queryParams: { canal: channelId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  openingChannel = signal(false);

  /** FR-ACA-001.27: the channel form, already set to this course (COM-003 §7). */
  protected newCourseChannel() {
    void this.router.navigate(['/communication/channels/new'], {
      queryParams: { scope: 'COURSE', targetId: this.id() },
    });
  }

  /** BR-COM-003.2: the course's teacher or an admin manages its channel. */
  canOpenChannel() {
    // BR-ACA-001.16: a homeroom teacher's view has no write actions.
    if (!this.staff()) return false;
    if (!this.auth.hasPermission('COMMUNICATION_CHANNELS')) return false;
    const course = this.courseResource.value() as {
      teacher?: { user?: { id?: string }; userId?: string | null };
    } | null;
    if (!course) return false;
    return this.auth.isAdmin() || course.teacher?.user?.id === this.auth.user()?.id;
  }

  /** COM-003: the course's channel, or the create form set to it. */
  async openChannel() {
    this.openingChannel.set(true);
    try {
      const id = await this.communication.managedChannelFor('COURSE', this.id());
      if (id) this.router.navigate(['/communication/channels', id]);
      else
        this.router.navigate(['/communication/channels/new'], {
          queryParams: { scope: 'COURSE', targetId: this.id() },
        });
    } catch {
      this.toast.showError('No se pudo abrir el canal');
    } finally {
      this.openingChannel.set(false);
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

  /** FR-ACA-001.19: an admin adds or removes students on this course. */
  public manageRoster() {
    this.modal
      .open<boolean, CourseRosterDialog>(CourseRosterDialog, {
        title: 'Estudiantes del curso',
        size: 'large',
        data: { courseId: this.id() },
      })
      .closed.subscribe((changed) => {
        if (changed) this.participants.reload();
      });
  }

  /** FR-ACA-001.10: "Ver calendario" for students and parents. */
  public openCalendar() {
    this.modal.open(CourseCalendarDialog, {
      title: 'Calendario del curso',
      size: 'large',
      data: { courseId: this.id(), linkable: !this.homeroom() },
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
