import { Confirmation, EditorViewer, Error, Loader, Modal, Toast } from '#/ui';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { HttpClient, httpResource } from '@angular/common/http';
import { filter, switchMap } from 'rxjs';
import StudentGradeForm from './student-grade-form';

type GradeDetail = {
  id: string;
  title: string;
  published?: boolean;
  comments?: string;
  courseId?: string;
  bucket?: { name?: string | null } | null;
  course?: {
    id?: string;
    name?: string;
    studyPlan?: {
      gradeMetric?: { minimumApproval?: number; minimumExcellence?: number } | null;
    } | null;
  } | null;
  studentGrades?: Array<{
    id: string;
    score?: number | null;
    comments?: string | null;
    updatedAt?: string;
    student?: { firstName?: string; fatherName?: string; classGroup?: { id?: string; name?: string } | null };
  }>;
};

@Component({
  selector: 'app-grade',
  imports: [Loader, RouterLink, EditorViewer, DatePipe, Error, DecimalPipe, NgClass],

  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @defer {
      @if (gradeResource.hasValue()) {
        @let grade = gradeResource.value()!;
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li>Calificaciones</li>
            <li>{{ grade.title }}</li>
          </ul>
        </div>
        <div class="card card-border border-base-300 mt-4 bg-base-100">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h1 class="text-xl font-semibold">{{ grade.title }}</h1>
              <div class="flex items-center gap-2">
                @if (grade.published) {
                  <span class="badge badge-success">
                    <span class="material-symbols-outlined">check_circle</span>
                    Publicada</span
                  >
                } @else {
                  <button class="btn btn-primary btn-sm" (click)="publishGrade()">
                    <span class="material-symbols-outlined">publish</span>
                    Publicar
                  </button>
                }
                <button class="btn btn-error btn-sm btn-soft" (click)="deleteGrade()">
                  <span class="material-symbols-outlined">delete</span> Eliminar
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a class="link link-primary" [routerLink]="['/courses', $safeNavigationMigration(grade.course?.id)]"> {{ grade.course?.name }} </a>/
              {{ grade.bucket?.name }}
            </div>

            <lib-editor-viewer [innerHTML]="grade.comments" />
          </div>
        </div>
        <div class="card card-border border-base-300 mt-4 bg-base-100">
          <div class="card-body">
            <h3 class="card-title">Calificaciones</h3>
            <div class="overflow-x-auto w-full">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th class="text-center px-0 w-25">Calificacion</th>
                    <th class="px-2!">Comentarios</th>
                    <th>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (group of studentGradesByClassGroup(); track group.classGroup?.id ?? '__none__') {
                    <tr class="bg-base-200/50">
                      <td colspan="4" class="font-semibold text-base-content/80 py-2">
                        @if (group.classGroup) {
                          {{ group.classGroup.name }}
                        } @else {
                          Sin grupo
                        }
                      </td>
                    </tr>
                    @for (studentGrade of group.studentGrades; track studentGrade.id) {
                      <tr>
                        <td class="overflow-hidden">
                          <span class="block truncate">
                            {{ studentGrade.student?.firstName }}
                            {{ studentGrade.student?.fatherName }}
                          </span>
                        </td>
                        <td
                          class="font-semibold text-center px-0! cursor-pointer hover:bg-base-200"
                          (click)="editGradeItem(studentGrade)"
                          [ngClass]="{
                            'text-success! bg-success/10':
                              studentGrade.score !== null &&
                              studentGrade.score !== undefined &&
                              metric() &&
                              studentGrade.score >= (metric()?.minimumApproval ?? 0),
                            'text-warning! bg-warning/10':
                              studentGrade.score !== null &&
                              studentGrade.score !== undefined &&
                              metric() &&
                              studentGrade.score >= (metric()?.minimumApproval ?? 0) &&
                              studentGrade.score < (metric()?.minimumExcellence ?? 0),
                            'text-error! bg-error/10':
                              studentGrade.score !== null &&
                              studentGrade.score !== undefined &&
                              metric() &&
                              studentGrade.score < (metric()?.minimumApproval ?? 0),
                          }"
                        >
                          @if (studentGrade.score) {
                            {{ studentGrade.score | number: '1.1-1' }}
                          } @else {
                            <span class="material-symbols-outlined text-2xl">more_horiz</span>
                          }
                        </td>
                        <td class="overflow-hidden text-ellipsis whitespace-nowrap max-w-50 pl-2!">
                          {{ studentGrade.comments }}
                        </td>
                        <td>{{ studentGrade.updatedAt | date: 'medium' }}</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      } @else if (gradeResource.error()) {
        <lib-error (retry)="gradeResource.reload()" [description]="$safeNavigationMigration(gradeResource.error()?.message)" />
      }
      @if (gradeResource.isLoading()) {
        <lib-loader />
      }
    } @loading (after 100ms; minimum 1s) {
      <lib-loader />
    } @placeholder (minimum 1s) {
      <lib-loader />
    }
  `,
})
export default class Grade {
  public id = input.required<string>();
  #http = inject(HttpClient);
  #router = inject(Router);
  #modal = inject(Modal);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  public gradeResource = httpResource<GradeDetail>(() => `/api/v1/grades/${this.id()}/with-course`);

  public metric = computed(() => this.gradeResource.value()?.course?.studyPlan?.gradeMetric);

  /** Groups student grades by class group, with "Sin grupo" last. */
  public studentGradesByClassGroup = computed(() => {
    const grade = this.gradeResource.value();
    if (!grade?.studentGrades?.length) return [];
    const studentGrades = grade.studentGrades;
    type StudentGrade = (typeof studentGrades)[number];
    const groups = new Map<
      string | null,
      { classGroup: { id: string; name: string } | null; studentGrades: StudentGrade[] }
    >();
    for (const sg of studentGrades) {
      const rawCg = sg.student?.classGroup;
      const cg: { id: string; name: string } | null =
        rawCg?.id && rawCg?.name ? { id: rawCg.id, name: rawCg.name } : null;
      const key = cg?.id ?? '__none__';
      const group = groups.get(key);
      if (group) {
        group.studentGrades.push(sg as StudentGrade);
      } else {
        groups.set(key, { classGroup: cg, studentGrades: [sg as StudentGrade] });
      }
    }
    const result = [...groups.values()];
    result.sort((a, b) => {
      if (!a.classGroup) return 1;
      if (!b.classGroup) return -1;
      return a.classGroup.name.localeCompare(b.classGroup.name);
    });
    return result;
  });

  publishGrade() {
    this.#confirmation
      .confirm({
        title: 'Publicar calificacion',
        message:
          '¿Estás seguro de publicar esta calificacion? Esta calificacion se vera en el informe de calificaciones.',
      })
      .pipe(
        filter((result) => result),
        switchMap(() =>
          this.#http.patch('/api/v1/grades', {
            id: this.gradeResource.value()?.id ?? '',
            published: true,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.gradeResource.reload();
          this.#toast.showSuccess('Calificacion publicada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al publicar la calificacion');
        },
      });
  }

  editGradeItem(studentGrade?: { id?: string; student?: unknown; score?: number | null; comments?: string | null }) {
    if (!studentGrade) return;
    this.#modal.open(StudentGradeForm, {
      data: {
        studentGrade,
        metric: this.metric(),
      },
      title: 'Editar calificacion',
    });
  }

  deleteGrade() {
    this.#confirmation
      .confirm({
        title: 'Eliminar calificacion',
        message: '¿Estás seguro de eliminar esta calificacion?',
      })
      .pipe(
        filter((result: boolean) => result === true),
        switchMap(() => this.#http.delete(`/api/v1/grades/${this.gradeResource.value()?.id ?? ''}`)),
      )
      .subscribe({
        next: () => {
          this.#router.navigate(['/courses', this.gradeResource.value()?.courseId]);
          this.#toast.showSuccess('Calificacion eliminada correctamente');
        },

        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar la calificacion');
        },
      });
  }
}
