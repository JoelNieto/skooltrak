import { Confirmation, Modal, Pagination, Paginator, Toast } from '@/ui';
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
import { map, tap } from 'rxjs';
import { SchoolsForm } from './schools-form';
@Component({
  selector: 'app-schools',
  imports: [
    RouterLink,
    NgIcon,
    DatePipe,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    Paginator,
  ],
  providers: [Pagination],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorDotsThreeOutlineDuotone,
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

      <button class="btn btn-neutral" (click)="editSchool()">
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
                      (keydown.enter)="editSchool(school)"
                      (click)="editSchool(school)"
                      type="button"
                    >
                      <ng-icon name="phosphorPencilDuotone" class="text-lg" />
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="Delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteSchool(school)"
                      (keydown.enter)="deleteSchool(school)"
                      type="button"
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
      <div class="p-2">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schools {
  private readonly modal = inject(Modal);
  public pagination = inject(Pagination);
  private readonly apollo = inject(Apollo);
  private readonly toasts = inject(Toast);
  private readonly confirmation = inject(Confirmation);
  formatMenu = viewChild<Menu<string>>('formatMenu');

  public schools = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery<{
          count: number;
          schools: Prisma.SchoolGetPayload<{
            include: { organization: true };
          }>[];
        }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetSchools($take: Int!, $skip: Int!, $search: String!) {
              count: schoolsCount(search: $search)
              schools(take: $take, skip: $skip, search: $search) {
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
          variables: {
            take: params.take,
            skip: params.skip,
            search: params.search,
          },
        })
        .valueChanges.pipe(
          tap(({ data }) => {
            this.pagination.updateCount(data.count);
          }),
          map(({ data }) => data.schools)
        ),
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
