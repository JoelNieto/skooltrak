import { Confirmation, EmptyState, Modal, Pagination, Paginator, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Apollo } from 'apollo-angular';
import { filter, map, of, switchMap, tap } from 'rxjs';
import Store from '../../core/store';
import {
  AdminClassGroupsBySchoolIdDocument,
  AdminClassGroupsBySchoolIdQuery,
  AdminRemoveClassGroupDocument,
} from '../../graphql/generated/graphql';
import ClassGroupsForm from '../forms/class-groups-form';
@Component({
  selector: 'app-groups',
  imports: [DatePipe, RouterLink, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule, EmptyState, Paginator],
  providers: [Pagination],
  template: `
    <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editClassGroup()">
        <span class="material-symbols-outlined">add_circle</span> Nuevo Grupo
      </button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg border border-base-300 mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (group of classGroups.value(); track group.id) {
            <tr>
              <td>
                <a class="link link-primary" [routerLink]="['/groups', group.id]">{{ group.name }}</a>
              </td>
              <td>{{ group.teacher?.name }}</td>
              <td>{{ group.studyPlan.name }}</td>
              <td>{{ group.createdAt | date: 'short' }}</td>
              <td>{{ group.updatedAt | date: 'short' }}</td>
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
                      <a
                        ngMenuItem
                        value="view"
                        [routerLink]="['/groups', group.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      <button
                        ngMenuItem
                        value="edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editClassGroup(group)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteClassGroup(group.id)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </ng-template>
                  </div>
                </ng-template>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="text-center">
                <lib-empty-state
                  title="No hay grupos"
                  description="No hay grupos para mostrar"
                  icon="group"
                  actionLabel="Nuevo grupo"
                  (action)="editClassGroup()"
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div class="p-4 rounded-b-lg">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>
  `,
})
export default class ClassGroups {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private store = inject(Store);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);
  public pagination = inject(Pagination);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public classGroups = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
    }),
    stream: ({ params }) => {
      const { schoolId, take, skip, search } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery({
          query: AdminClassGroupsBySchoolIdDocument,
          variables: {
            schoolId,
            take,
            skip,
            search,
          },
        })
        .valueChanges.pipe(
          tap((result) => this.pagination.updateCount(result.data?.count ?? 0)),
          map((result) => (result.data?.classGroups ?? []) as AdminClassGroupsBySchoolIdQuery['classGroups']),
        );
    },
  });
  public editClassGroup(group?: AdminClassGroupsBySchoolIdQuery['classGroups'][number]) {
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
            mutation: AdminRemoveClassGroupDocument,
            variables: {
              id,
            },
          }),
        ),
      )
      .subscribe(() => {
        this.toasts.showSuccess('Grupo eliminado correctamente');
        this.classGroups.reload();
      });
  }
}
