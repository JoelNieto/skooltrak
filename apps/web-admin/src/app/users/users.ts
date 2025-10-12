import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import { UsersForm } from './users-form';

@Component({
  selector: 'app-users',
  imports: [RouterLink, NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
    }),
  ],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Usuarios</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de usuarios
        </p>
      </div>

      <button class="btn btn-primary" (click)="editUser()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nuevo Usuario
      </button>
    </div>
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
            <td>{{ user.role.name }}</td>
            <td>{{ user.organization?.name }}</td>
            <td>{{ user.createdAt | date : 'medium' }}</td>
            <td>{{ user.updatedAt | date : 'medium' }}</td>
            <td>
              <div class="flex gap-2 items-center">
                <button class="btn btn-xs btn-primary" (click)="editUser(user)">
                  <ng-icon name="phosphorPencilDuotone" />
                  Editar
                </button>
                <button class="btn btn-xs btn-error" (click)="deleteUser(user)">
                  <ng-icon name="phosphorTrashDuotone" />
                  Eliminar
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
export class Users {
  private modal = inject(Modal);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);

  public users = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          users: Prisma.UserGetPayload<{
            include: { organization: true; role: true };
          }>[];
        }>({
          query: gql`
            query GetUsers {
              users {
                id
                firstName
                lastName
                email
                createdAt
                updatedAt
                roleId
                role {
                  id
                  name
                }
                organizationId
                organization {
                  id
                  name
                }
              }
            }
          `,
        })
        .valueChanges.pipe(map((res) => res.data.users)),
  });

  public editUser(
    user?: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>
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
    }>
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Usuario',
        message: '¿Estás seguro de eliminar este usuario?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate<{ removeUser: Prisma.UserCreateInput }>({
              mutation: gql`
                mutation RemoveUser($id: String!) {
                  removeUser(id: $id) {
                    id
                    name
                    createdAt
                    updatedAt
                  }
                }
              `,
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
