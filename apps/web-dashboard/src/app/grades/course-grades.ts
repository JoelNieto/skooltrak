import { DecimalToNumber, Modal } from '@/ui';
import { DecimalPipe, NgClass } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';
import GradesForm from './grades-form';

@Component({
  selector: 'app-course-grades',
  imports: [FormsModule, DecimalPipe, RouterLink, NgClass],
  template: ` <div class="flex justify-end gap-2">
      <select
        class="select select-primary w-64!"
        [ngModel]="currentPeriod()"
        (ngModelChange)="periodId.set($event)"
      >
        <option disabled selected value="">Selecciona un periodo...</option>
        @for(period of periodsResource.value()!; track period.id) {
        <option [value]="period.id">{{ period.name }}</option>
        }
      </select>
      <button class="btn btn-primary btn-soft" (click)="editGrade()">
        Nueva calificacion
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-zebra !w-fit">
        <thead>
          <tr>
            <th class="w-[10rem]">Estudiante</th>
            @for(grade of gradesResource.value(); track grade.id) {
            <th class="w-[2rem]">
              <a [routerLink]="['/grades', grade.id]" class="link link-primary">
                {{ grade.title }}</a
              >
            </th>
            }
          </tr>
        </thead>
        <tbody>
          @for(student of groupedGrades(); track student.id) {
          <tr>
            <td>{{ student.firstName }} {{ student.fatherName }}</td>
            @for(grade of student.grades; track grade.id) {
            <td
              class="text-center font-semibold"
              [ngClass]="{
              '!text-success bg-success/10':
                grade.item?.score &&
                grade.item?.score! >= metric().minimumApproval,
              '!text-warning bg-warning/10':
                grade.item?.score &&
                (grade.item?.score! >= metric().minimumApproval &&
                  grade.item?.score! < metric().minimumExcellence),
              '!text-error bg-error/10':
                grade.item?.score &&
                grade.item?.score! < metric().minimumApproval,
            }"
            >
              {{ (grade.item?.score | number : '1.1-1') ?? '-' }}
            </td>
            }
          </tr>
          } @empty {
          <tr>
            <td colspan="6" class="text-center">
              No hay calificaciones para este curso
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseGrades {
  public courseId = input.required<string>();
  public metric =
    input.required<DecimalToNumber<Prisma.GradeMetricGetPayload<undefined>>>();
  public currentPeriod = input<string | null>();
  #store = inject(Store);
  #apollo = inject(Apollo);
  #modal = inject(Modal);

  public periodId = signal<string>('');

  public periodsResource = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          periodsBySchoolId: Prisma.PeriodGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query PeriodsBySchoolId($schoolId: String!) {
              periodsBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.periodsBySchoolId));
    },
  });

  public students = rxResource({
    params: () => ({
      courseId: this.courseId(),
    }),
    stream: ({ params }) => {
      const { courseId } = params;
      if (!courseId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          studentsByCourseId: Prisma.StudentGetPayload<{
            include: {
              classGroup: true;
              user: true;
            };
          }>[];
        }>({
          query: gql`
            query StudentsByCourseId($courseId: String!) {
              studentsByCourseId(courseId: $courseId) {
                id
                firstName
                fatherName
                user {
                  id
                  email
                }
                classGroup {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            courseId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.studentsByCourseId));
    },
  });

  public gradesResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
      periodId: this.periodId(),
    }),
    stream: ({ params }) => {
      const { courseId, periodId } = params;
      if (!courseId || !periodId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          gradesByCourseId: DecimalToNumber<
            Prisma.GradeGetPayload<{
              include: {
                bucket: true;
                gradeStudents: {
                  include: {
                    student: { include: { classGroup: true } };
                  };
                };
              };
            }>
          >[];
        }>({
          query: gql`
            query GradesByCourseId($courseId: String!, $periodId: String!) {
              gradesByCourseId(courseId: $courseId, periodId: $periodId) {
                id
                title
                comments
                bucket {
                  id
                  name
                }
                gradeStudents {
                  id
                  student {
                    id
                    firstName
                    fatherName
                  }
                  score
                  comments
                  updatedAt
                }
                published
                date
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            courseId,
            periodId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.gradesByCourseId));
    },
  });

  public groupedGrades = computed(() => {
    const grades = this.gradesResource.value();
    const students = this.students.value();
    if (!grades || !students) {
      return [];
    }
    return students.map((student) => {
      return {
        ...student,
        grades: grades.map((grade) => {
          return {
            ...grade,
            item: grade.gradeStudents.find((gradeStudent) => {
              return gradeStudent.student.id === student.id;
            }),
          };
        }),
      };
    });
  });

  constructor() {
    afterRenderEffect(() => {
      this.periodId.set(this.currentPeriod() || '');
    });
  }

  editGrade() {
    this.#modal.open(GradesForm, {
      title: 'Nueva calificacion',
      size: 'large',
      data: {
        courseId: this.courseId(),
        currentPeriod: this.currentPeriod(),
      },
    });
  }
}
