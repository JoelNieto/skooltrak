import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusCircleDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import { PermissionsForm } from './permissions-form';

@Component({
  selector: 'app-permissions',
  imports: [RouterLink, NgIcon, DatePipe],
  viewProviders: [provideIcons({ phosphorPlusCircleDuotone })],
  template: ` <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Permisos</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Permisos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de permisos
        </p>
      </div>

      <button class="btn btn-primary" (click)="editPermission()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo Permiso
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>ID</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (permission of permissions.value(); track permission.id) {
          <tr>
            <td>{{ permission.description }}</td>
            <td>{{ permission.descriptiveId }}</td>
            <td>{{ permission.createdAt | date : 'medium' }}</td>
            <td>{{ permission.updatedAt | date : 'medium' }}</td>
            <td>
              <div class="join">
                <button
                  class="join-item btn btn-primary btn-xs"
                  (click)="editPermission(permission)"
                >
                  Editar
                </button>
                <button
                  class="join-item btn btn-error btn-xs"
                  (click)="deletePermission(permission)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Permissions {
  private modal = inject(Modal);

  private apollo = inject(Apollo);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public permissions = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ permissions: Prisma.PermissionGetPayload<false>[] }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetPermissions {
              permissions {
                id
                descriptiveId
                description
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.permissions)),
  });

  public editPermission(permission?: Prisma.PermissionGetPayload<false>) {
    this.modal
      .open(PermissionsForm, {
        title: permission ? 'Editar Permiso' : 'Nuevo Permiso',
        showCloseButton: true,
        data: { permission },
      })
      .closed.subscribe(() => {
        this.permissions.reload();
      });
  }

  public deletePermission(permission: Prisma.PermissionGetPayload<false>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Permiso',
        message: '¿Estás seguro de eliminar este permiso?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate<{ removePermission: Prisma.PermissionGetPayload<false> }>({
              mutation: gql`
                mutation RemovePermission($id: String!) {
                  removePermission(id: $id) {
                    id
                    descriptiveId
                    description
                    createdAt
                    updatedAt
                  }
                }
              `,
              variables: {
                id: permission.id,
              },
            })
            .subscribe({
              next: () => {
                this.toast.showInfo('Permiso eliminado exitosamente');
                this.permissions.reload();
              },
              error: (error) => {
                console.error(error);
                this.toast.showError('Error al eliminar el permiso');
              },
            });
        }
      });
  }
}
