import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorDotsThreeOutlineVerticalDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import { SchoolsForm } from './schools-form';

@Component({
  selector: 'app-schools',
  imports: [RouterLink, NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorDotsThreeOutlineVerticalDuotone,
    }),
  ],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Escuelas</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Escuelas</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de escuelas
        </p>
      </div>

      <button class="btn btn-primary" (click)="editSchool()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nueva Escuela
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Organización</th>
            <th>Año actual</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (school of schools.value(); track school.id) {
          <tr>
            <td>{{ school.name }}</td>
            <td>{{ school.organization.name }}</td>
            <td>{{ school.currentYear }}</td>
            <td>{{ school.createdAt | date : 'medium' }}</td>
            <td>{{ school.updatedAt | date : 'medium' }}</td>
            <td>
              <div class="flex gap-2 items-center">
                <button
                  class="btn btn-xs btn-primary btn-soft"
                  (click)="editSchool(school)"
                >
                  <ng-icon name="phosphorPencilDuotone" />
                  Editar
                </button>
                <button
                  class="btn btn-xs btn-error btn-soft"
                  (click)="deleteSchool(school)"
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
    </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schools {
  private readonly modal = inject(Modal);
  private readonly apollo = inject(Apollo);
  private readonly toasts = inject(Toast);
  private readonly confirmation = inject(Confirmation);

  public schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          schools: Prisma.SchoolGetPayload<{
            include: { organization: true };
          }>[];
        }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetSchools {
              schools {
                id
                organizationId
                organization {
                  id
                  name
                }
                name
                shortName
                logo
                address
                city
                state
                zip
                country
                email
                phone
                website
                currentYear
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.schools)),
  });

  public editSchool(
    school?: Prisma.SchoolGetPayload<{ include: { organization: true } }>
  ) {
    this.modal
      .open(SchoolsForm, {
        title: school ? 'Editar Escuela' : 'Nueva Escuela',
        showCloseButton: true,
        size: 'large',
        data: { school },
      })
      .closed.subscribe(() => {
        this.schools.reload();
      });
  }

  deleteSchool(
    school: Prisma.SchoolGetPayload<{ include: { organization: true } }>
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Escuela',
        message: '¿Estás seguro de eliminar esta escuela?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate<{ removeSchool: Prisma.SchoolCreateInput }>({
              mutation: gql`
                mutation RemoveSchool($id: String!) {
                  removeSchool(id: $id) {
                    id
                    name
                    createdAt
                    updatedAt
                  }
                }
              `,
              variables: {
                id: school.id,
              },
            })
            .subscribe({
              next: () => {
                this.toasts.showInfo('Escuela eliminada exitosamente');
                this.schools.reload();
              },
              error: (error) => {
                console.error(error);
                this.toasts.showError('Error al eliminar la escuela');
              },
            });
        }
      });
  }
}
