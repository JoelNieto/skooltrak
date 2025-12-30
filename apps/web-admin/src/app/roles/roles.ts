import { Confirmation, Modal, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorDotsThreeOutlineDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import { RolesForm } from './roles-form';
@Component({
  selector: 'app-roles',
  imports: [
    RouterLink,
    NgIcon,
    DatePipe,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorDotsThreeOutlineDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
    }),
  ],
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
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo Rol
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Nombre</th>
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
            <td>{{ role.createdAt | date : 'medium' }}</td>
            <td>{{ role.updatedAt | date : 'medium' }}</td>
            <td>
              <button
                class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                ngMenuTrigger
                #origin
                #trigger="ngMenuTrigger"
                [menu]="formatMenu()"
              >
                <ng-icon
                  name="phosphorDotsThreeOutlineDuotone"
                  class="text-xl"
                />
              </button>
              <ng-template
                [cdkConnectedOverlayOpen]="trigger.expanded()"
                [cdkConnectedOverlay]="{origin, usePopover: 'inline'}"
                [cdkConnectedOverlayPositions]="[
                  {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                    offsetY: 4
                  }
                ]"
                cdkAttachPopoverAsChild
              >
                <div
                  ngMenu
                  class="bg-base-100 shadow-sm rounded-lg p-1 w-48"
                  #formatMenu="ngMenu"
                >
                  <ng-template ngMenuContent>
                    <button
                      ngMenuItem
                      value="Edit"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="editRole(role)"
                    >
                      <ng-icon name="phosphorPencilDuotone" class="text-lg" />
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="Delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteRole(role)"
                    >
                      <ng-icon name="phosphorTrashDuotone" class="text-lg" />
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
  private apollo = inject(Apollo);
  formatMenu = viewChild<Menu<string>>('formatMenu');
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public roles = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          roles: Prisma.RoleGetPayload<{
            include: { organization: true; permissions: true };
          }>[];
        }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetRoles {
              roles {
                id
                name
                description
                createdAt
                updatedAt
                organization {
                  id
                  name
                }
                permissions {
                  id
                  descriptiveId
                  description
                }
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.roles)),
  });

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
          this.apollo
            .mutate({
              mutation: gql`
                mutation RemoveRole($id: String!) {
                  removeRole(id: $id) {
                    id
                    name
                    description
                  }
                }
              `,
              variables: {
                id: role.id,
              },
            })
            .subscribe({
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
