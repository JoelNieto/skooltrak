import {
  Confirmation,
  DecimalToNumber,
  EditorViewer,
  Error,
  Loader,
  Modal,
  Toast,
} from '@/ui';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCalendarDotsDuotone,
  phosphorPencilDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap } from 'rxjs';
import GradeStudentForm from './grade-student-form';
@Component({
  selector: 'app-grade',
  imports: [
    Loader,
    RouterLink,
    EditorViewer,
    NgIcon,
    DatePipe,
    Error,
    DecimalPipe,
    NgClass,
  ],
  viewProviders: [
    provideIcons({
      phosphorCalendarDotsDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
    }),
  ],
  template: `
    @defer{ @if(gradeResource.hasValue()) { @let grade = gradeResource.value()!;
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/grades">Calificaciones</a></li>
        <li>{{ grade.title }}</li>
      </ul>
    </div>
    <div class="card card-border border-base-300 mt-4 bg-base-100">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-medium">{{ grade.title }}</h1>
          <div class="flex items-center gap-2">
            <button class="btn btn-neutral btn-sm btn-soft">
              <ng-icon name="phosphorPencilDuotone" /> Editar
            </button>
            <button
              class="btn btn-error btn-sm btn-soft"
              (click)="deleteGrade(grade)"
            >
              <ng-icon name="phosphorTrashDuotone" /> Eliminar
            </button>
          </div>
        </div>
        <a
          class="text-sm text-link"
          [routerLink]="['/courses', grade.course.id]"
        >
          {{ grade.course.name }}
        </a>
        <lib-editor-viewer [innerHTML]="grade.comments" />
      </div>
    </div>
    <div class="card card-border border-base-300 mt-4 bg-base-100">
      <div class="card-body">
        <h3 class="card-title">Calificaciones</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th class="text-center px-0 w-[100px]">Calificacion</th>
              <th class="!px-2">Comentarios</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            @for (gradeStudent of grade.gradeStudents; track gradeStudent.id) {
            <tr>
              <td>
                {{ gradeStudent.student.firstName }}
                {{ gradeStudent.student.fatherName }}
              </td>
              <td
                class="font-semibold text-center !px-0 cursor-pointer hover:bg-base-200"
                (click)="editGradeItem(gradeStudent)"
                [ngClass]="{
                  '!text-success bg-success/10':
                    gradeStudent.score &&
                    gradeStudent.score! >= metric()!.minimumApproval,
                  '!text-warning bg-warning/10':
                    gradeStudent.score &&
                    (gradeStudent.score! >= metric()!.minimumApproval &&
                      gradeStudent.score! < metric()!.minimumExcellence),
                  '!text-error bg-error/10':
                    gradeStudent.score &&
                    gradeStudent.score! < metric()!.minimumApproval,
                }"
              >
                {{ gradeStudent.score | number : '1.1-1' }}
              </td>
              <td
                class="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] !pl-2"
              >
                {{ gradeStudent.comments }}
              </td>
              <td>{{ gradeStudent.updatedAt | date : 'medium' }}</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    } @else if (gradeResource.error()) {
    <lib-error
      (retry)="gradeResource.reload()"
      [description]="gradeResource.error()?.message"
    />
    } @if (gradeResource.isLoading()) {<lib-loader />} } @loading(after 100ms;
    minimum 1s){
    <lib-loader />
    } @placeholder(minimum 1s){
    <lib-loader />
    }
  `,
})
export default class Grade {
  public id = input.required<string>();
  #apollo = inject(Apollo);
  #router = inject(Router);
  #modal = inject(Modal);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  public gradeResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      const { id } = params;
      return this.#apollo
        .watchQuery<{
          grade: DecimalToNumber<
            Prisma.GradeGetPayload<{
              include: {
                course: {
                  include: { studyPlan: { include: { gradeMetric: true } } };
                };
                bucket: true;
                period: true;
                gradeStudents: { include: { student: true } };
              };
            }>
          >;
        }>({
          query: gql`
            query Grade($id: String!) {
              grade(id: $id) {
                id
                title
                comments
                date
                courseId
                course {
                  id
                  name
                  studyPlan {
                    id
                    name
                    gradeMetric {
                      id
                      name
                      minimum
                      maximum
                      minimumApproval
                      minimumExcellence
                    }
                  }
                }
                bucket {
                  id
                  name
                  weight
                }
                period {
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
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            id,
          },
        })
        .valueChanges.pipe(map((res) => res.data.grade));
    },
  });

  public metric = computed(
    () => this.gradeResource.value()?.course.studyPlan?.gradeMetric
  );

  editGradeItem(
    gradeStudent: DecimalToNumber<
      Prisma.GradeStudentGetPayload<{ include: { student: true } }>
    >
  ) {
    this.#modal.open(GradeStudentForm, {
      data: {
        gradeStudent,
        metric: this.metric(),
      },
      title: 'Editar calificacion',
    });
  }

  deleteGrade(grade: Prisma.GradeGetPayload<{ include: undefined }>) {
    this.#confirmation
      .confirm({
        title: 'Eliminar calificacion',
        message: '¿Estás seguro de eliminar esta calificacion?',
      })
      .pipe(
        filter((result: boolean) => result === true),
        switchMap(() =>
          this.#apollo.mutate({
            mutation: gql`
              mutation RemoveGrade($id: String!) {
                removeGrade(id: $id) {
                  id
                }
              }
            `,
            variables: { id: grade.id },
          })
        )
      )
      .subscribe({
        next: () => {
          this.#router.navigate(['/courses', grade.courseId]);
          this.#toast.showSuccess('Calificacion eliminada correctamente');
        },

        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar la calificacion');
        },
      });
  }
}
