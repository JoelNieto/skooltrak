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
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import DegreesForm from '../forms/degrees-form';

@Component({
  selector: 'app-degrees',
  imports: [DatePipe, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorPlusCircleDuotone,
    }),
  ],
  template: ` <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editDegree()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Agregar nivel
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Escuela</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (degree of degrees.value(); track degree.id) {
          <tr>
            <td>{{ degree.name }}</td>
            <td>{{ degree.shortName }}</td>
            <td>{{ degree.school.name }}</td>
            <td>{{ degree.createdAt | date : 'short' }}</td>
            <td>{{ degree.updatedAt | date : 'short' }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-xs btn-soft"
                  (click)="editDegree(degree)"
                >
                  <ng-icon name="phosphorPencilDuotone" /> Editar
                </button>
                <button
                  class="btn btn-error btn-xs btn-soft"
                  (click)="deleteDegree(degree)"
                >
                  <ng-icon name="phosphorTrashDuotone" /> Eliminar
                </button>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Degrees {
  private apollo = inject(Apollo);
  private store = inject(Store);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  public degrees = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          degreesBySchoolId: Prisma.DegreeGetPayload<{
            include: { school: true };
          }>[];
        }>({
          query: gql`
            query DegreesBySchoolId($schoolId: String!) {
              degreesBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
                schoolId
                school {
                  id
                  name
                }
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.degreesBySchoolId));
    },
  });

  public editDegree(
    degree?: Prisma.DegreeGetPayload<{ include: { school: true } }>
  ) {
    this.modal
      .open(DegreesForm, {
        title: degree ? 'Editar Nivel' : 'Agregar Nivel',
        data: {
          degree,
        },
      })
      .closed.subscribe(() => {
        this.degrees.reload();
      });
  }

  public deleteDegree(
    degree: Prisma.DegreeGetPayload<{ include: { school: true } }>
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Nivel',
        message: `¿Estás seguro de eliminar el nivel ${degree.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.apollo.mutate({
            mutation: gql`
              mutation RemoveDegree($removeDegreeId: String!) {
                removeDegree(id: $removeDegreeId) {
                  id
                }
              }
            `,
            variables: {
              removeDegreeId: degree.id,
            },
          })
        )
      )
      .subscribe({
        next: () => {
          this.degrees.reload();
          this.toast.showSuccess('Nivel eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar el nivel');
        },
      });
  }
}
