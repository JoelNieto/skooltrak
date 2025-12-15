import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import ClassGroupsForm from '../forms/class-groups-form';
@Component({
  selector: 'app-groups',
  imports: [NgIcon, DatePipe, RouterLink],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorTrashDuotone,
      phosphorPencilDuotone,
    }),
  ],
  template: `
    <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editClassGroup()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo Grupo
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg border border-base-300 mt-4"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (group of classGroups.value(); track group.id) {
          <tr>
            <td>
              <a
                class="link link-primary"
                [routerLink]="['/groups', group.id]"
                >{{ group.name }}</a
              >
            </td>
            <td>{{ group.shortName }}</td>
            <td>{{ group.teacher?.name }}</td>
            <td>{{ group.studyPlan.name }}</td>
            <td>{{ group.createdAt | date : 'short' }}</td>
            <td>{{ group.updatedAt | date : 'short' }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-xs btn-soft"
                  (click)="editClassGroup(group)"
                >
                  <ng-icon name="phosphorPencilDuotone" />
                  Editar
                </button>
                <button
                  class="btn btn-error btn-xs btn-soft"
                  (click)="deleteClassGroup(group.id)"
                >
                  <ng-icon name="phosphorTrashDuotone" />
                  Eliminar
                </button>
              </div>
            </td>
          </tr>

          }
        </tbody>
      </table>
    </div>
  `,
})
export default class ClassGroups {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private store = inject(Store);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);
  public classGroups = rxResource({
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
          classGroupsBySchoolId: any[];
        }>({
          query: gql`
            query ClassGroupsBySchoolId($schoolId: String!) {
              classGroupsBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
                createdAt
                updatedAt
                teacherId
                studyPlanId
                teacher {
                  id
                  name
                }
                studyPlan {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.classGroupsBySchoolId));
    },
  });

  public editClassGroup(
    group?: Prisma.ClassGroupGetPayload<{
      include: { teacher: true; studyPlan: true };
    }>
  ) {
    this.modal
      .open(ClassGroupsForm, {
        title: group ? 'Editar grupo' : 'Nuevo grupo',
        data: {
          group,
        },
      })
      .closed.subscribe(() => {
        this.classGroups.reload();
      });
  }

  public deleteClassGroup(id: string) {
    this.confirmation
      .confirm({
        title: 'Eliminar grupo',
        message: '¿Estás seguro de eliminar este grupo?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() =>
          this.apollo.mutate({
            mutation: gql`
              mutation DeleteClassGroup($id: String!) {
                removeClassGroup(id: $id) {
                  id
                }
              }
            `,
            variables: {
              id,
            },
          })
        )
      )
      .subscribe(() => {
        this.toasts.showSuccess('Grupo eliminado correctamente');
        this.classGroups.reload();
      });
  }
}
