import { Confirmation, Modal, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Apollo } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import {
  AdminDegreesBySchoolIdDocument,
  AdminDegreesBySchoolIdQuery,
  AdminRemoveDegreeDocument,
} from '../../graphql/generated/graphql';
import DegreesForm from '../forms/degrees-form';
@Component({
  selector: 'app-degrees',
  imports: [DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],

  template: ` <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editDegree()">
        <span class="material-symbols-outlined">add_circle</span> Agregar nivel
      </button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Escuela</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (degree of degrees.value(); track degree.id) {
            <tr>
              <td>{{ degree.name }}</td>
              <td>{{ degree.shortName }}</td>
              <td>{{ degree.school.name }}</td>
              <td>{{ degree.createdAt | date: 'short' }}</td>
              <td>{{ degree.updatedAt | date: 'short' }}</td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="actionsMenu()"
                >
                  <span class="material-symbols-outlined text-xl">more_horiz</span>
                </button>
                <ng-template
                  [cdkConnectedOverlayOpen]="trigger.expanded()"
                  [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
                  [cdkConnectedOverlayPositions]="[
                    {
                      originX: 'end',
                      originY: 'bottom',
                      overlayX: 'end',
                      overlayY: 'top',
                      offsetY: 4,
                    },
                  ]"
                  cdkAttachPopoverAsChild
                >
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <button
                        ngMenuItem
                        value="Edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editDegree(degree)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteDegree(degree)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </ng-template>
                  </div>
                </ng-template>
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
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public degrees = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery({
          query: AdminDegreesBySchoolIdDocument,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(
          map((result) => (result.data?.degreesBySchoolId as AdminDegreesBySchoolIdQuery['degreesBySchoolId']) ?? []),
        );
    },
  });

  public editDegree(degree?: AdminDegreesBySchoolIdQuery['degreesBySchoolId'][number]) {
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

  public deleteDegree(degree: AdminDegreesBySchoolIdQuery['degreesBySchoolId'][number]) {
    this.confirmation
      .confirm({
        title: 'Eliminar Nivel',
        message: `¿Estás seguro de eliminar el nivel ${degree.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.apollo.mutate({
            mutation: AdminRemoveDegreeDocument,
            variables: {
              removeDegreeId: degree.id,
            },
          }),
        ),
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
