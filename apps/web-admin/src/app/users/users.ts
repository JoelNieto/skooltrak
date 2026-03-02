import { Confirmation, Error, Modal, Pagination, Paginator, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo } from 'apollo-angular';
import {
  WebAdminGetUsersDocument,
  WebAdminRemoveUserDocument,
} from '../graphql/generated';
import { map, tap } from 'rxjs';
import { UsersForm } from './users-form';
@Component({
  selector: 'app-users',
  imports: [RouterLink, DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule, Paginator, FormsModule, Error],
  providers: [Pagination],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Usuarios</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Listado de usuarios</p>
      </div>

      <button class="btn btn-neutral" (click)="editUser()">
        <span class="material-symbols-outlined">add_circle</span> Nuevo Usuario
      </button>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div class="md:w-96 w-full">
        <input type="text" class="input" placeholder="Buscar" [(ngModel)]="searchText" />
      </div>
    </div>
    @if (users.error()) {
      <lib-error
        (retry)="users.reload()"
        [description]="users.error()?.message"
      />
    } @else {
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Organización</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (user of users.value(); track user.id) {
            <tr>
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role?.name ?? 'Sin rol' }}</td>
              <td>{{ user.organization?.name ?? 'Sin organización' }}</td>
              <td>{{ user.createdAt | date: 'medium' }}</td>
              <td>{{ user.updatedAt | date: 'medium' }}</td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="formatMenu()"
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
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #formatMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <button
                        ngMenuItem
                        value="Edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editUser($any(user))"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteUser($any(user))"
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
      <lib-paginator
        [count]="pagination.count()"
        [take]="pagination.take()"
        [skip]="pagination.skip()"
        (skipChange)="pagination.updateSkip($event)"
        (takeChange)="pagination.updateTake($event)"
      />
    </div>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  public pagination = inject(Pagination);
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  formatMenu = viewChild<Menu<string>>('formatMenu');
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public users = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery({
          query: WebAdminGetUsersDocument,
          variables: {
            take: params.take,
            skip: params.skip,
            search: params.search,
          },
        })
        .valueChanges.pipe(
          tap((res) => {
            this.pagination.updateCount(res.data?.count ?? 0);
          }),
          map((res) => res.data?.users ?? []),
        ),
  });

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
  }

  public editUser(
    user?: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>,
  ) {
    this.modal.open(UsersForm, {
      title: user ? 'Editar Usuario' : 'Nuevo Usuario',
      showCloseButton: true,
      size: 'large',
      data: { user },
    });
  }

  public deleteUser(
    user: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>,
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Usuario',
        message: '¿Estás seguro de eliminar este usuario?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate({
              mutation: WebAdminRemoveUserDocument,
              variables: {
                id: user.id,
              },
            })
            .subscribe({
              next: () => {
                this.toasts.showInfo('Usuario eliminado exitosamente');
                this.users.reload();
              },
              error: (error) => {
                console.error(error);
                this.toasts.showError('Error al eliminar el usuario');
              },
            });
        }
      });
  }
}
