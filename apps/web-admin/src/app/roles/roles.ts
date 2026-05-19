import { Confirmation, Error, Modal, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { HttpClient } from '@angular/common/http';
import { RolesForm } from './roles-form';

@Component({
  selector: 'app-roles',
  imports: [RouterLink, DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Roles</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Roles</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Listado de roles</p>
      </div>

      <button class="btn btn-primary" (click)="editRole()">
        <span class="material-symbols-outlined">add_circle</span> Nuevo Rol
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Nombre</th>
            <th>Organización</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (role of roles.value(); track role.id) {
            <tr>
              <td>{{ role.name }}</td>
              <td>{{ role.description }}</td>
              <td>{{ role.name }}</td>
              <td>{{ role.organization?.name }}</td>
              <td>{{ role.createdAt | date: 'medium' }}</td>
              <td>{{ role.updatedAt | date: 'medium' }}</td>
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
                        (click)="editRole($any(role))"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteRole($any(role))"
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
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Roles {
  private modal = inject(Modal);
  private http = inject(HttpClient);
  formatMenu = viewChild<Menu<string>>('formatMenu');
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public roles = httpResource<
    Prisma.RoleGetPayload<{ include: { organization: true; permissions: true } }>[]
  >(() => '/api/v1/roles', { defaultValue: [] });

  public editRole(role?: Prisma.RoleGetPayload<false>) {
    this.modal
      .open(RolesForm, {
        title: role ? 'Editar Rol' : 'Nuevo Rol',
        showCloseButton: true,
        data: { role },
      })
      .closed.subscribe(() => {
        this.roles.reload();
      });
  }

  deleteRole(role: Prisma.RoleGetPayload<false>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Rol',
        message: '¿Estás seguro de eliminar este rol?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/roles/${role.id}`).subscribe({
            next: () => {
              this.toast.showInfo('Rol eliminado exitosamente');
              this.roles.reload();
            },
            error: (error) => {
              console.error(error);
              this.toast.showError('Error al eliminar el rol');
            },
          });
        }
      });
  }
}
