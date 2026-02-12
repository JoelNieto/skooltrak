import { DecimalToNumber, Modal } from '@/ui';
import { DecimalPipe, NgClass } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';
import GradesForm from './grades-form';

export type StudentType = {
  id: string;
  name: string;
  initials: string;
  color: string;
  averageScore: number;
  classGroup: { id: string; name: string };
};

@Component({
  selector: 'app-course-grades',
  imports: [FormsModule, DecimalPipe, RouterLink, NgClass],
  template: ` <div class="flex justify-end gap-2">
      <select class="select select-primary w-64!" [ngModel]="periodId()" (ngModelChange)="periodId.set($event)">
        <option disabled selected value="">Selecciona un periodo...</option>
        @for (period of periodsResource.value()!; track period.id) {
          <option [value]="period.id">{{ period.name }}</option>
        }
      </select>
      <button class="btn btn-primary btn-soft" (click)="editGrade()">Nueva calificacion</button>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-zebra table-fixed">
        <thead>
          <tr>
            <th class="w-[10rem]">Estudiante</th>
            @for (grade of gradesResource.value(); track grade.id) {
              <th class="w-[2rem] min-w-[2rem] max-w-[2rem]">
                <a
                  [routerLink]="['/grades', grade.id]"
                  class="link link-primary text-nowrap overflow-hidden text-ellipsis block"
                >
                  {{ grade.title }}</a
                >
              </th>
            }
            <th class="w-[2rem] min-w-[2rem] max-w-[2rem]">Promedio actual</th>
          </tr>
        </thead>
        <tbody>
          @for (student of groupedGrades(); track student.id) {
            <tr>
              <td>
                <a [routerLink]="['/students', student.id]" class="flex items-center gap-2 cursor-pointer">
                  <div class="avatar avatar-placeholder">
                    <div class="text-white w-7 rounded-full" [style.background]="student.color">
                      <span class="text-xs">{{ student.initials }}</span>
                    </div>
                  </div>
                  {{ student.name }}
                </a>
              </td>
              @for (grade of student.grades; track grade.id) {
                <td
                  class="text-center w-[2rem] min-w-[2rem] max-w-[2rem]"
                  [ngClass]="{
                    '!text-success bg-success/10': grade.item?.score && grade.item?.score! >= metric().minimumApproval,
                    '!text-warning bg-warning/10':
                      grade.item?.score &&
                      grade.item?.score! >= metric().minimumApproval && grade.item?.score! < metric().minimumExcellence,
                    '!text-error bg-error/10': grade.item?.score && grade.item?.score! < metric().minimumApproval,
                  }"
                >
                  {{ (grade.item?.score | number: '1.1-1') ?? '-' }}
                </td>
              }
              <td
                class="text-center font-bold w-[2rem] min-w-[2rem] max-w-[2rem]"
                [ngClass]="{
                  '!text-success bg-success/10':
                    student.averageScore && student.averageScore >= metric().minimumApproval,
                  '!text-warning bg-warning/10':
                    student.averageScore &&
                    student.averageScore >= metric().minimumApproval &&
                      student.averageScore < metric().minimumExcellence,
                  '!text-error bg-error/10': student.averageScore && student.averageScore < metric().minimumApproval,
                }"
              >
                {{ student.averageScore ? (student.averageScore | number: '1.1-1') : '-' }}
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="text-center">No hay calificaciones para este curso</td>
            </tr>
          }
        </tbody>
      </table>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseGrades {
  public courseId = input.required<string>();
  public metric = input.required<DecimalToNumber<Prisma.GradeMetricGetPayload<undefined>>>();
  #store = inject(Store);
  #apollo = inject(Apollo);
  #modal = inject(Modal);

  public periodId = signal<string>('');

  public periodsResource = rxResource({
    params: () => ({
      year: this.#store.currentSchool()?.currentYear,
    }),
    stream: ({ params }) => {
      const { year } = params;
      if (!year) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          periodsByYear: Prisma.PeriodGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query PeriodsByYear($year: Int!) {
              periodsByYear(year: $year) {
                id
                name
                startDate
                endDate
              }
            }
          `,
          variables: {
            year: params.year,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.periodsByYear));
    },
  });

  private currentPeriodId = computed(() => {
    const periods = this.periodsResource.value();
    if (!periods?.length) return '';
    const today = new Date();
    const current = periods.find(
      (p) => new Date(p.startDate) <= today && today <= new Date(p.endDate),
    );
    return current?.id ?? '';
  });

  public students = rxResource({
    params: () => ({
      courseId: this.courseId(),
      periodId: this.periodId(),
    }),
    stream: ({ params }) => {
      const { courseId, periodId } = params;
      if (!courseId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          studentsByCourseId: StudentType[];
        }>({
          query: gql`
            query StudentsByCourseId($courseId: String!, $periodId: String!) {
              studentsByCourseId(courseId: $courseId) {
                id
                name
                initials
                color
                averageScore: averageScoreForStudent(courseId: $courseId, periodId: $periodId)
                classGroup {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            courseId,
            periodId,
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
                studentGrades: {
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
                studentGrades {
                  id
                  student {
                    id
                    firstName
                    fatherName
                    averageScoreForStudent(courseId: $courseId, periodId: $periodId)
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
            item: grade.studentGrades.find((studentGrade) => {
              return studentGrade.student.id === student.id;
            }),
          };
        }),
      };
    });
  });

  constructor() {
    afterRenderEffect(() => {
      const id = this.currentPeriodId();
      if (id) this.periodId.set(id);
    });
  }

  editGrade() {
    this.#modal
      .open(GradesForm, {
        title: 'Nueva calificacion',
        size: 'large',
        data: {
          courseId: this.courseId(),
          periodId: this.periodId(),
        },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.gradesResource.reload();
        }
      });
  }
}
