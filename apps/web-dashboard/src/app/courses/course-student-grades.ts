import { DecimalToNumber } from '@/ui';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { afterRenderEffect, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';

type StudentGradeItem = DecimalToNumber<
  Prisma.StudentGradeGetPayload<{
    include: {
      grade: {
        include: {
          bucket: true;
        };
      };
    };
  }>
>;
@Component({
  selector: 'app-course-student-grades',
  imports: [FormsModule, NgClass, DatePipe, DecimalPipe],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-start">
        <div
          class="text-sm card card-compact bg-base-100 "
          [ngClass]="{
            'bg-success/10': studentsResource.value().average >= metric().minimumApproval,
            'bg-warning/10':
              studentsResource.value().average >= metric().minimumApproval &&
              studentsResource.value().average < metric().minimumExcellence,
            'bg-error/10': studentsResource.value().average < metric().minimumApproval,
          }"
        >
          <div class="card-body">
            <div class="text-sm text-base-content/70">Promedio del periodo:</div>
            <div class="text-lg font-bold">
              <span
                [ngClass]="{
                  'text-success': studentsResource.value().average >= metric().minimumApproval,
                  'text-warning':
                    studentsResource.value().average >= metric().minimumApproval &&
                    studentsResource.value().average < metric().minimumExcellence,
                  'text-error': studentsResource.value().average < metric().minimumApproval,
                }"
              >
                {{ studentsResource.value().average | number: '1.1-1' }}
              </span>
            </div>
          </div>
        </div>
        <div class="w-64!">
          <select class="select select-primary" [ngModel]="periodId()" (ngModelChange)="periodId.set($event)">
            <option disabled selected [value]="">Selecciona un periodo...</option>
            @for (period of periodsResource.value(); track period.id) {
              <option [value]="period.id">{{ period.name }}</option>
            }
          </select>
        </div>
      </div>
      <div class="flex items-center justify-between">
        @if (studentsResource.value().studentGradesByCourseId.length) {
        } @else {
          <div class="text-sm text-base-content/70">Promedio del periodo: -</div>
        }
      </div>
      <div class="overflow-x-auto">
        <table class="table table-zebra table-fixed">
          <thead>
            <tr>
              <th class="w-1/5">Nombre</th>
              <th class="w-1/5">Comentarios</th>
              <th class="w-1/5">Fecha</th>
              <th class="w-1/5">Tipo</th>
              <th class="w-1/5">Calificacion ({{ metric().name }})</th>
            </tr>
          </thead>
          <tbody>
            @for (item of studentsResource.value().studentGradesByCourseId; track item.id) {
              <tr>
                <td>{{ item.grade.title }}</td>

                <td>{{ item.comments }}</td>
                <td>{{ item.grade.date | date: 'dd/MM/yyyy' }}</td>
                <td>{{ item.grade.bucket.name }}</td>
                <td
                  [ngClass]="{
                    '!text-success bg-success/10': item.score && item.score! >= metric().minimumApproval,
                    '!text-warning bg-warning/10':
                      item.score && item.score! >= metric().minimumApproval && item.score! < metric().minimumExcellence,
                    '!text-error bg-error/10': item.score && item.score! < metric().minimumApproval,
                  }"
                >
                  {{ item.score | number: '1.1-1' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center">No hay calificaciones para este periodo</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class CourseStudentGrades {
  public courseId = input.required<string>();
  public currentPeriod = input<string | null>();
  public metric = input.required<DecimalToNumber<Prisma.GradeMetricGetPayload<undefined>>>();
  #store = inject(Store);
  #apollo = inject(Apollo);
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
        .query<{
          periodsByYear: Prisma.PeriodGetPayload<{ include: undefined }>[];
        }>({
          query: gql`
            query PeriodsByYear($year: Int!) {
              periodsByYear(year: $year) {
                id
                name
              }
            }
          `,
          variables: {
            year,
          },
          fetchPolicy: 'cache-first',
        })
        .pipe(map((result) => result.data.periodsByYear));
    },
  });

  public studentsResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
      periodId: this.periodId(),
      studentId: this.#store.currentStudentId(),
    }),
    defaultValue: {
      average: 0,
      studentGradesByCourseId: [],
    },
    stream: ({ params }) => {
      const { courseId, periodId, studentId } = params;
      if (!courseId || !periodId || !studentId) {
        return of({
          average: 0,
          studentGradesByCourseId: [],
        });
      }
      return this.#apollo
        .watchQuery<{
          average: number;
          studentGradesByCourseId: StudentGradeItem[];
        }>({
          query: gql`
            query StudentGradesByCourseId($courseId: String!, $periodId: String!, $studentId: String!) {
              average: averageCourseScoreForStudent(studentId: $studentId, courseId: $courseId, periodId: $periodId)
              studentGradesByCourseId(courseId: $courseId, periodId: $periodId, studentId: $studentId) {
                id
                score
                comments
                grade {
                  id
                  title
                  date
                  comments
                  bucket {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: {
            courseId,
            periodId,
            studentId,
          },
        })
        .valueChanges.pipe(
          map((result) => ({
            average: result.data.average,
            studentGradesByCourseId: result.data.studentGradesByCourseId,
          })),
        );
    },
  });

  constructor() {
    afterRenderEffect(() => {
      this.periodId.set(this.currentPeriod() || '');
    });
  }
}
