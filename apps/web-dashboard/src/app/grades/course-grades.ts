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
  classGroup: { id: string; name: string } | null;
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
    <div class="overflow-x-auto w-full">
      <table class="table table-zebra table-fixed w-full">
        <thead>
          <tr>
            <th class="min-w-48 w-48">Estudiante</th>
            @for (grade of gradesResource.value(); track grade.id) {
              <th class="min-w-24 w-24">
                <a
                  [routerLink]="['/grades', grade.id]"
                  class="link link-primary block truncate"
                  [title]="grade.title"
                >
                  {{ grade.title }}
                </a>
              </th>
            }
            <th class="min-w-24 w-24">Promedio actual</th>
          </tr>
        </thead>
        <tbody>
          @for (group of groupedGradesByClassGroup(); track group.classGroup?.id ?? '__none__') {
            <tr class="bg-base-200/50">
              <td colspan="100" class="font-semibold text-base-content/80 py-2">
                @if (group.classGroup) {
                  {{ group.classGroup.name }}
                } @else {
                  Sin grupo
                }
              </td>
            </tr>
            @for (student of group.students; track student.id) {
              <tr>
                <td class="overflow-hidden">
                  <a
                    [routerLink]="['/students', student.id]"
                    class="flex items-center gap-2 cursor-pointer min-w-0"
                  >
                    <div class="avatar avatar-placeholder flex-shrink-0">
                      <div class="text-white w-7 rounded-full" [style.background]="student.color">
                        <span class="text-xs">{{ student.initials }}</span>
                      </div>
                    </div>
                    <span class="truncate">{{ student.name }}</span>
                  </a>
                </td>
                @for (grade of student.grades; track grade.id) {
                  <td
                    class="text-center min-w-24 w-24"
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
                  class="text-center font-bold min-w-24 w-24"
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
            }
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
        .valueChanges.pipe(map((result) => result.data?.periodsByYear ?? []));
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
        .valueChanges.pipe(map((result) => result.data?.studentsByCourseId ?? []));
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
        .valueChanges.pipe(map((result) => result.data?.gradesByCourseId ?? []));
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
            item: grade.studentGrades?.find((studentGrade) => {
              return studentGrade.student?.id === student.id;
            }),
          };
        }),
      };
    });
  });

  /** Groups students by class group for display, with "Sin grupo" last. */
  public groupedGradesByClassGroup = computed(() => {
    const flat = this.groupedGrades();
    if (!flat.length) return [];
    const groups = new Map<string | null, { classGroup: { id: string; name: string } | null; students: typeof flat }>();
    for (const student of flat) {
      const rawCg = student.classGroup;
      const cg: { id: string; name: string } | null =
        rawCg?.id && rawCg?.name ? { id: rawCg.id, name: rawCg.name } : null;
      const key = cg?.id ?? null;
      if (!groups.has(key)) {
        groups.set(key, { classGroup: cg, students: [] });
      }
      groups.get(key)!.students.push(student);
    }
    const result = [...groups.values()];
    result.sort((a, b) => {
      if (!a.classGroup) return 1;
      if (!b.classGroup) return -1;
      return a.classGroup.name.localeCompare(b.classGroup.name);
    });
    return result;
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
