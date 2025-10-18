import { Modal, Toast } from '@/ui';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusCircleDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import CoursesForm from '../forms/courses-form';

@Component({
  selector: 'app-courses',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
    }),
  ],
  template: `<div class="flex justify-end">
      <button class="btn btn-primary" (click)="editCourse()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo curso
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Código</th>
            <th>Asignatura</th>
            <th>Plan de estudio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (course of courses.value(); track course.id) {
          <tr>
            <td>{{ course.name }}</td>
            <td>{{ course.shortName }}</td>
            <td>{{ course.code }}</td>
            <td>{{ course.subject.name }}</td>
            <td>{{ course.studyPlan.name }}</td>
            <td>
              <button
                class="btn btn-primary btn-xs"
                (click)="editCourse(course)"
              >
                Editar
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div> `,
})
export default class Courses {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private store = inject(Store);
  private toast = inject(Toast);
  public courses = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          coursesBySchoolId: Prisma.CourseGetPayload<{
            include: { subject: true; studyPlan: true };
          }>[];
        }>({
          query: gql`
            query coursesBySchoolId($schoolId: String!) {
              coursesBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
                schoolId
                subject {
                  name
                }
                studyPlan {
                  name
                }
                subjectId
                studyPlanId
                code
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.coursesBySchoolId));
    },
  });

  public editCourse(
    course?: Prisma.CourseGetPayload<{
      include: { subject: true; studyPlan: true };
    }>
  ) {
    this.modal
      .open(CoursesForm, {
        title: course ? 'Editar Curso' : 'Agregar Curso',
        data: {
          course,
        },
      })
      .closed.subscribe(() => {
        this.courses.reload();
      });
  }
}
