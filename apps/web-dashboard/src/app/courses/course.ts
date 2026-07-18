import { Loader, Modal, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    Loader,
    RouterLink,
    CourseAssignments,
    CourseAttendance,
    CourseFiles,
    CourseGradeBuckets,
    CourseGrades,
    CourseStudentGrades,
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
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/courses">Cursos</a></li>
            <li>{{ course.name }}</li>
          </ul>
        </div>
        <div class="card mt-4 bg-base-100">
          <div class="card-body flex md:flex-row md:gap-4 md:items-center">
            <img src="course-default.jpg" alt="Course" class="h-18 w-18 rounded-lg" />
            <div class="flex justify-between items-center w-full">
              <div>
                <h2 class="card-title text-xl">{{ course.name }}</h2>
                <div class="flex items-center gap-1 text-sm">
                  @if (course.teacher) {
                    <div class="avatar avatar-placeholder">
                      <div class="text-white w-7 rounded-full" [style.background]="course.teacher.color">
                        <span class="text-xs">{{ course.teacher.initials }}</span>
                      </div>
                    </div>
                    {{ course.teacher.name }}
                  } @else {
                    <span class="text-sm text-base-content/50">No hay docente asignado</span>
                  }
                </div>
                <p class="text-base-200">{{ course.code }}</p>
              </div>

              <div class="flex gap-2">
                @if (canStartCourseChat()) {
                  <button class="btn btn-ghost" (click)="startCourseChat()" [disabled]="startingChat()">
                    @if (startingChat()) {
                      <span class="loading loading-spinner loading-sm"></span>
                    } @else {
                      <span class="material-symbols-outlined">chat</span>
                    }
                    Chat
                  </button>
                }
                @if (auth.hasPermission('MANAGE_ASSIGNMENTS')) {
                  <button class="btn btn-neutral" (click)="addAssignment()">
                    <span class="material-symbols-outlined">assignment_add</span>
                    Nueva asignacion
                  </button>
                }
                @if (auth.hasPermission('MANAGE_COURSES')) {
                  <button class="btn btn-primary btn-soft">
                    <span class="material-symbols-outlined">edit</span> Editar
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
        <div class="tabs tabs-box mt-4">
          <label class="tab">
            <input type="radio" name="my_tabs_6" class="tab" aria-label="Calificaciones" checked="checked" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xl">grade</span>
              Calificaciones
            </span>
          </label>

          <div class="tab-content bg-base-100 p-6">
            @if (auth.isTeacher() || auth.isAdmin()) {
              <app-course-grades [courseId]="id()" [metric]="$any(course.studyPlan.gradeMetric)" />
            }
            @if (auth.isStudent()) {
              <app-course-student-grades [courseId]="id()" [metric]="$any(course.studyPlan.gradeMetric)" />
            }
          </div>
          <label class="tab">
            <input type="radio" name="my_tabs_6" class="tab" aria-label="Calendario" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xl">calendar_month</span>Calendario</span
            >
          </label>
          <div class="tab-content bg-base-100 border-base-300 p-6">
            <app-course-assignments [courseId]="id()" (reload)="courseResource.reload()" />
          </div>
          @if (auth.isTeacher() || auth.isAdmin()) {
            <label class="tab">
              <input type="radio" name="my_tabs_6" class="tab" aria-label="Asistencia" />
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-xl">how_to_reg</span>Asistencia</span
              >
            </label>
            <div class="tab-content bg-base-100 p-6">
              <app-course-attendance [courseId]="id()" />
            </div>
          }
          <label class="tab">
            <input type="radio" name="my_tabs_6" aria-label="Participantes" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xl">groups</span>Participantes</span
            >
          </label>
          <div class="tab-content bg-base-100 p-6">Tab content 2</div>

          <label class="tab">
            <input type="radio" name="my_tabs_6" aria-label="Archivos" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined">folder_special</span>Archivos</span
            >
          </label>

          <div class="tab-content bg-base-100 p-6">
            <app-course-files [courseId]="id()" />
          </div>
          @if (auth.isTeacher() || auth.isAdmin()) {
            <label class="tab">
              <input type="radio" name="my_tabs_6" aria-label="Ponderacion" />
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">folder_special</span>Ponderacion</span
              >
            </label>

            <div class="tab-content bg-base-100 p-6">
              <app-course-grade-buckets [courseId]="id()" />
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

    console.log('Transforming course data', c);
    const t = c.teacher;
    if (t) {
      const color = t.user?.color ?? '#888';
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
