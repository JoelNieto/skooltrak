import { DecimalToNumber, Loader, Modal } from '@/ui';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';

import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import AssignmentForm from '../assignments/assignment-form';
import CourseAttendance from '../attendance/course-attendance';
import Auth from '../auth/auth';
import CourseGrades from '../grades/course-grades';
import CourseAssignments from './course-assignments';
import CourseFiles from './course-files';
import CourseGradeBuckets from './course-grade-buckets';
import CourseStudentGrades from './course-student-grades';
type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
  color: string;
};

type CourseType = Prisma.CourseGetPayload<{
  include: {
    studyPlan: { include: { gradeMetric: true } };
    subject: true;
  };
}> & {
  teacher?: Teacher;
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
    @if (courseResource.hasValue()) {
      @let course = courseResource.value()!;
      <div>
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/courses">Cursos</a></li>
            <li>{{ course.name }}</li>
          </ul>
        </div>
        <div class="card card-border border-base-300 mt-4 bg-base-100">
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

          <div class="tab-content bg-base-100 border-base-300 p-6">
            @if (auth.isTeacher() || auth.isAdmin()) {
              <app-course-grades
                [courseId]="id()"
                [metric]="course.studyPlan.gradeMetric!"
              />
            }
            @if (auth.isStudent()) {
              <app-course-student-grades
                [courseId]="id()"
                [metric]="course.studyPlan.gradeMetric!"
              />
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
            <div class="tab-content bg-base-100 border-base-300 p-6">
              <app-course-attendance [courseId]="id()" />
            </div>
          }
          <label class="tab">
            <input type="radio" name="my_tabs_6" aria-label="Participantes" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xl">groups</span>Participantes</span
            >
          </label>
          <div class="tab-content bg-base-100 border-base-300 p-6">Tab content 2</div>

          <label class="tab">
            <input type="radio" name="my_tabs_6" aria-label="Archivos" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined">folder_special</span>Archivos</span
            >
          </label>

          <div class="tab-content bg-base-100 border-base-300 p-6">
            <app-course-files [courseId]="id()" />
          </div>
          <label class="tab">
            <input type="radio" name="my_tabs_6" aria-label="Ponderacion" />
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined">folder_special</span>Ponderacion</span
            >
          </label>

          <div class="tab-content bg-base-100 border-base-300 p-6">
            <app-course-grade-buckets [courseId]="id()" />
          </div>
        </div>
      </div>
    }`,
})
export default class Course {
  public id = input.required<string>();
  public auth = inject(Auth);
  private apollo = inject(Apollo);
  private modal = inject(Modal);
  public courseResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      const { id } = params;
      if (!id) {
        return of(null);
      }
      return this.apollo
        .query<{
          course: DecimalToNumber<CourseType>;
        }>({
          query: gql`
            query Course($id: String!) {
              course(id: $id) {
                id
                name
                shortName
                code
                createdAt
                updatedAt
                subject {
                  id
                  name
                }
                teacher {
                  id
                  name
                  color
                  initials
                }
                studyPlan {
                  id
                  name
                  gradeMetric {
                    id
                    name
                    minimumApproval
                    minimumExcellence
                    maximum
                    minimum
                  }
                }
              }
            }
          `,
          variables: {
            id,
          },
        })
        .pipe(map((result) => result.data?.course));
    },
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
