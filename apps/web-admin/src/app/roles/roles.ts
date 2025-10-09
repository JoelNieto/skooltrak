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
import { RolesForm } from './roles-form';

@Component({
  selector: 'app-roles',
  imports: [RouterLink, NgIcon, DatePipe],
  viewProviders: [provideIcons({ phosphorPlusCircleDuotone })],
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
              <div class="join">
                <button
                  class="join-item btn btn-primary btn-xs"
                  (click)="editRole(role)"
                >
                  Editar
                </button>
                <button
                  class="join-item btn btn-error btn-xs"
                  (click)="deleteRole(role)"
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
export class Roles {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
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
