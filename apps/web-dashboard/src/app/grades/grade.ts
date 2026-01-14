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

import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap } from 'rxjs';
import StudentGradeForm from './student-grade-form';

@Component({
  selector: 'app-grade',
  imports: [
    Loader,
    RouterLink,
    EditorViewer,
    DatePipe,
    Error,
    DecimalPipe,
    NgClass,
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
          <h1 class="text-xl font-semibold">{{ grade.title }}</h1>
          <div class="flex items-center gap-2">
            @if(grade.published) {
            <span class="badge badge-success">
              <span class="material-symbols-outlined">check_circle</span>
              Publicada</span
            >
            } @else {
            <button
              class="btn btn-neutral btn-sm btn-soft"
              (click)="publishGrade()"
            >
              <span class="material-symbols-outlined text-success"
                >publish</span
              >
              Publicar
            </button>
            }
            <button
              class="btn btn-error btn-sm btn-soft"
              (click)="deleteGrade()"
            >
              <span class="material-symbols-outlined">delete</span> Eliminar
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a
            class="link link-primary"
            [routerLink]="['/courses', grade.course.id]"
          >
            {{ grade.course.name }} </a
          >/ {{ grade.bucket.name }}
        </div>

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
            @for (studentGrade of grade.studentGrades; track studentGrade.id) {
            <tr>
              <td>
                {{ studentGrade.student.firstName }}
                {{ studentGrade.student.fatherName }}
              </td>
              <td
                class="font-semibold text-center !px-0 cursor-pointer hover:bg-base-200"
                (click)="editGradeItem(studentGrade)"
                [ngClass]="{
                  '!text-success bg-success/10':
                    studentGrade.score &&
                    studentGrade.score! >= metric()!.minimumApproval,
                  '!text-warning bg-warning/10':
                    studentGrade.score &&
                    (studentGrade.score! >= metric()!.minimumApproval &&
                      studentGrade.score! < metric()!.minimumExcellence),
                  '!text-error bg-error/10':
                    studentGrade.score &&
                    studentGrade.score! < metric()!.minimumApproval,
                }"
              >
                @if(studentGrade.score) {
                {{ studentGrade.score | number : '1.1-1' }}
                } @else {
                <span class="material-symbols-outlined text-2xl"
                  >more_horiz</span
                >
                }
              </td>
              <td
                class="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] !pl-2"
              >
                {{ studentGrade.comments }}
              </td>
              <td>{{ studentGrade.updatedAt | date : 'medium' }}</td>
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
                studentGrades: { include: { student: true } };
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
                published
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
                studentGrades {
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
          this.#apollo.mutate({
            mutation: gql`
              mutation UpdateGrade($updateGradeInput: UpdateGradeInput!) {
                updateGrade(updateGradeInput: $updateGradeInput) {
                  id
                  published
                }
              }
            `,
            variables: {
              updateGradeInput: {
                id: this.gradeResource.value()!.id,
                published: true,
              },
            },
          })
        )
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

  editGradeItem(
    studentGrade: DecimalToNumber<
      Prisma.StudentGradeGetPayload<{ include: { student: true } }>
    >
  ) {
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
        switchMap(() =>
          this.#apollo.mutate({
            mutation: gql`
              mutation RemoveGrade($id: String!) {
                removeGrade(id: $id) {
                  id
                }
              }
            `,
            variables: { id: this.gradeResource.value()?.id },
          })
        )
      )
      .subscribe({
        next: () => {
          this.#router.navigate([
            '/courses',
            this.gradeResource.value()?.courseId,
          ]);
          this.#toast.showSuccess('Calificacion eliminada correctamente');
        },

        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar la calificacion');
        },
      });
  }
}
