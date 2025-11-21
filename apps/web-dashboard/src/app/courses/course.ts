import { Loader, Modal } from '@/ui';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCalendarDotsDuotone,
  phosphorCalendarPlusDuotone,
  phosphorExamDuotone,
  phosphorFolderStarDuotone,
  phosphorListChecksDuotone,
  phosphorPencilDuotone,
  phosphorUsersThreeDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import AssignmentForm from '../assignments/assignment-form';
import CourseGrades from '../grades/course-grades';
import CourseAssignments from './course-assignments';
import CourseGradeBuckets from './course-grade-buckets';

@Component({
  imports: [
    Loader,
    RouterLink,
    NgIcon,
    CourseAssignments,
    CourseGradeBuckets,
    CourseGrades,
  ],
  viewProviders: [
    provideIcons({
      phosphorCalendarDotsDuotone,
      phosphorUsersThreeDuotone,
      phosphorListChecksDuotone,
      phosphorFolderStarDuotone,
      phosphorCalendarPlusDuotone,
      phosphorPencilDuotone,
      phosphorExamDuotone,
    }),
  ],
  template: ` @if(courseResource.isLoading()) {
    <lib-loader />
    } @if(courseResource.error()) {
    <p>Error al cargar curso</p>
    } @if(courseResource.hasValue()) { @let course = courseResource.value()!;
    <div>
      <div class="breadcrumbs">
        <ul>
          <li><a routerLink="/">Inicio</a></li>
          <li><a routerLink="/courses">Cursos</a></li>
          <li>{{ course.shortName }}</li>
        </ul>
      </div>
      <div class="card card-border border-base-300 mt-4">
        <div class="card-body flex md:flex-row md:gap-4 md:items-center">
          <img
            src="course-default.jpg"
            alt="Course"
            class="h-18 w-18 rounded"
          />
          <div class="flex justify-between items-center w-full">
            <div>
              <h2 class="card-title text-xl">{{ course.name }}</h2>
              <p>{{ course.shortName }}</p>
              <p class="text-base-200">{{ course.code }}</p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-accent" (click)="addAssignment()">
                <ng-icon name="phosphorCalendarPlusDuotone" /> Nueva asignacion
              </button>
              <button class="btn btn-primary btn-soft">
                <ng-icon name="phosphorPencilDuotone" /> Editar
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- name of each tab group should be unique -->
      <div class="tabs tabs-box mt-4">
        <label class="tab">
          <input
            type="radio"
            name="my_tabs_6"
            class="tab"
            aria-label="Calendario"
            checked="checked"
          />
          <span class="flex items-center gap-2">
            <ng-icon
              name="phosphorCalendarDotsDuotone"
              class="text-xl"
            />Calendario</span
          >
        </label>
        <div class="tab-content bg-base-100 border-base-300 p-6">
          <app-course-assignments [courseId]="id()" />
        </div>
        <label class="tab">
          <input type="radio" name="my_tabs_6" aria-label="Participantes" />
          <span class="flex items-center gap-2">
            <ng-icon
              name="phosphorUsersThreeDuotone"
              class="text-xl"
            />Participantes</span
          >
        </label>
        <div class="tab-content bg-base-100 border-base-300 p-6">
          Tab content 2
        </div>
        <label class="tab">
          <input type="radio" name="my_tabs_6" aria-label="Calificaciones" />
          <span class="flex items-center gap-2">
            <ng-icon name="phosphorExamDuotone" class="text-xl" />
            Calificaciones
          </span>
        </label>

        <div class="tab-content bg-base-100 border-base-300 p-6">
          <app-course-grades
            [courseId]="id()"
            [currentPeriod]="course.currentPeriodId"
          />
        </div>
        <label class="tab">
          <input type="radio" name="my_tabs_6" aria-label="Archivos" />
          <span class="flex items-center gap-2">
            <ng-icon name="phosphorFolderStarDuotone" />Archivos</span
          >
        </label>

        <div class="tab-content bg-base-100 border-base-300 p-6">
          Tab content 4
        </div>
        <label class="tab">
          <input type="radio" name="my_tabs_6" aria-label="Ponderacion" />
          <span class="flex items-center gap-2">
            <ng-icon name="phosphorFolderStarDuotone" />Ponderacion</span
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
          course: Prisma.CourseGetPayload<{
            include: { studyPlan: true; subject: true; teacher: true };
          }>;
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
                currentPeriodId
                subject {
                  id
                  name
                }
                teacher {
                  id
                  name
                }
                studyPlan {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            id,
          },
        })
        .pipe(map((result) => result.data.course));
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
