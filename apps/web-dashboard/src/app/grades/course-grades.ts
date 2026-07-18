import { DecimalToNumber, Modal } from '#/ui';
import { DecimalPipe, NgClass } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
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
                  class="link link-primary flex flex-col items-center gap-0.5"
                  [title]="grade.title"
                >
                  <span class="block truncate w-full text-center">{{ grade.title }}</span>
                  @if (!grade.published) {
                    <span class="badge badge-ghost badge-sm gap-0.5">
                      <span class="material-symbols-outlined text-sm">visibility_off</span>
                      Borrador
                    </span>
                  }
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
                  <a [routerLink]="['/students', student.id]" class="flex items-center gap-2 cursor-pointer min-w-0">
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
                      'text-success! bg-success/10':
                        grade.item?.score && grade.item?.score! >= metric().minimumApproval,
                      'text-warning! bg-warning/10':
                        grade.item?.score &&
                        grade.item?.score! >= metric().minimumApproval &&
                        grade.item?.score! < metric().minimumExcellence,
                      'text-error! bg-error/10': grade.item?.score && grade.item?.score! < metric().minimumApproval,
                    }"
                  >
                    {{ ($safeNavigationMigration(grade.item?.score) | number: '1.1-1') ?? '-' }}
                  </td>
                }
                <td
                  class="text-center font-bold min-w-24 w-24"
                  [ngClass]="{
                    'text-success! bg-success/10':
                      student.averageScore && student.averageScore >= metric().minimumApproval,
                    'text-warning! bg-warning/10':
                      student.averageScore &&
                      student.averageScore >= metric().minimumApproval &&
                      student.averageScore < metric().minimumExcellence,
                    'text-error! bg-error/10': student.averageScore && student.averageScore < metric().minimumApproval,
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
  #modal = inject(Modal);

  public periodId = signal<string>('');

  public periodsResource = httpResource<{ id: string; name: string; startDate: string; endDate: string }[]>(() => {
    const year = this.#store.currentSchool()?.currentYear;
    if (!year) {
      return undefined;
    }
    return { url: `/api/v1/periods/by-year`, params: { year: String(year) }, defaultValue: [] };
  });

  private currentPeriodId = computed(() => {
    const periods = this.periodsResource.value();
    if (!periods?.length) return '';
    const today = new Date();
    const current = periods.find((p) => new Date(p.startDate) <= today && today <= new Date(p.endDate));
    return current?.id ?? '';
  });

  public students = httpResource<StudentType[]>(() => {
    const courseId = this.courseId();
    if (!courseId) {
      return undefined;
    }
    return `/api/v1/students/by-course/${courseId}`;
  });

  public gradesResource = httpResource<
    {
      id: string;
      title: string;
      published: boolean;
      studentGrades?: Array<{
        id: string;
        score?: number | null;
        student?: { id: string; classGroup?: { id: string; name: string } | null };
      }>;
    }[]
  >(() => {
    const courseId = this.courseId(),
      periodId = this.periodId();
    if (!courseId || !periodId) {
      return undefined;
    }
    return { url: `/api/v1/grades/by-course/${courseId}`, params: { periodId }, defaultValue: [] };
  });

  public groupedGrades = computed(() => {
    const grades = this.gradesResource.value();
    const students = this.students.value();
    if (!grades || !students) {
      return [];
    }
    return students.map((student) => {
      const gradeCells = grades.map((grade) => ({
        ...grade,
        item: grade.studentGrades?.find((studentGrade) => studentGrade.student?.id === student.id),
      }));
      const scores = gradeCells.map((g) => g.item?.score).filter((s): s is number => s != null);
      const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        ...student,
        averageScore,
        grades: gradeCells,
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
