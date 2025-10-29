import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import ClassGroupsForm from '../forms/class-groups-form';

@Component({
  selector: 'app-groups',
  imports: [NgIcon, DatePipe],
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
    <div class="overflow-x-auto">
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
            <td>{{ group.name }}</td>
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
    this.modal.open(ClassGroupsForm, {
      title: group ? 'Editar grupo' : 'Nuevo grupo',
      data: {
        group,
      },
    });
  }

  public deleteClassGroup(id: string) {
    this.confirmation
      .confirm({
        title: 'Eliminar grupo',
        message: '¿Estás seguro de eliminar este grupo?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate({
              mutation: gql`
                mutation DeleteClassGroup($id: String!) {
                  deleteClassGroup(id: $id)
                }
              `,
              variables: {
                id,
              },
            })
            .subscribe(() => {
              this.toasts.showSuccess('Grupo eliminado correctamente');
              this.classGroups.reload();
            });
        }
      });
  }
}
