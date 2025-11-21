import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import StudyPlanForm from '../forms/study-plans-forms';

@Component({
  selector: 'app-study-plans',
  imports: [NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorPlusCircleDuotone,
    }),
  ],
  template: `<div class="flex justify-end">
      <button class="btn btn-primary" (click)="editStudyPlan()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo plan
      </button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Nombre corto</th>
          <th>Código</th>
          <th>Nivel</th>
          <th>Grado</th>
          <th>Creado</th>
          <th>Actualizado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (studyPlan of studyPlans.value(); track studyPlan.id) {
        <tr>
          <td>{{ studyPlan.name }}</td>
          <td>{{ studyPlan.shortName }}</td>
          <td>{{ studyPlan.code }}</td>
          <td>{{ studyPlan.level }}</td>
          <td>{{ studyPlan.degree.name }}</td>
          <td>{{ studyPlan.createdAt | date : 'short' }}</td>
          <td>{{ studyPlan.updatedAt | date : 'short' }}</td>
          <td>
            <div class="flex gap-2">
              <button
                class="btn btn-primary btn-xs btn-soft"
                (click)="editStudyPlan(studyPlan)"
              >
                <ng-icon name="phosphorPencilDuotone" /> Editar
              </button>
              <button
                class="btn btn-error btn-xs btn-soft"
                (click)="deleteStudyPlan(studyPlan)"
              >
                <ng-icon name="phosphorTrashDuotone" /> Eliminar
              </button>
            </div>
          </td>
        </tr>
        }
      </tbody>
    </table>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudyPlans {
  private apollo = inject(Apollo);
  private store = inject(Store);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  public studyPlans = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          studyPlansBySchoolId: Prisma.StudyPlanGetPayload<{
            include: { degree: true; school: true; gradeMetric: true };
          }>[];
        }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
                code
                shortName
                level
                degreeId
                gradeMetricId
                gradeMetric {
                  id
                  name
                }
                degree {
                  id
                  name
                }
                schoolId
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  public editStudyPlan(
    studyPlan?: Prisma.StudyPlanGetPayload<{
      include: { degree: true; school: true };
    }>
  ) {
    this.modal
      .open(StudyPlanForm, {
        title: studyPlan ? 'Editar Plan de Estudio' : 'Agregar Plan de Estudio',
        size: 'large',
        data: {
          studyPlan,
        },
      })
      .closed.subscribe(() => {
        this.studyPlans.reload();
      });
  }

  deleteStudyPlan(
    studyPlan: Prisma.StudyPlanGetPayload<{
      include: { degree: true; school: true };
    }>
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Plan de Estudio',
        message: '¿Estás seguro de eliminar este plan de estudio?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        severity: 'warning',
      })
      .pipe(
        switchMap((result) => {
          if (result) {
            return this.apollo.mutate({
              mutation: gql`
                mutation DeleteStudyPlan($id: String!) {
                  deleteStudyPlan(id: $id) {
                    id
                  }
                }
              `,
              variables: {
                id: studyPlan.id,
              },
            });
          }
          return of(null);
        })
      )
      .subscribe(() => {
        this.studyPlans.reload();
        this.toast.showSuccess('Plan de estudio eliminado');
      });
  }
}
