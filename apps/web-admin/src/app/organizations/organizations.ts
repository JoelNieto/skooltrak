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
import { OrganizationsForm } from './organizations-form';
@Component({
  selector: 'app-organizations',
  imports: [
    NgIcon,
    DatePipe,
    RouterLink,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
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
        <li>Organizaciones</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Organizaciones</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de organizaciones
        </p>
      </div>

      <button class="btn btn-neutral" (click)="editOrganization()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nueva Organizacións
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (organization of organizations.value(); track organization.id) {
          <tr>
            <td>{{ organization.name }}</td>
            <td>{{ organization.description }}</td>
            <td>{{ organization.createdAt | date : 'medium' }}</td>
            <td>{{ organization.updatedAt | date : 'medium' }}</td>
            <td>
              <button
                class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                ngMenuTrigger
                #origin
                #trigger="ngMenuTrigger"
                [menu]="actionsMenu()"
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
                  #actionsMenu="ngMenu"
                >
                  <ng-template ngMenuContent>
                    <button
                      ngMenuItem
                      value="Edit"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (keydown.enter)="editOrganization(organization)"
                      (click)="editOrganization(organization)"
                      type="button"
                    >
                      <ng-icon name="phosphorPencilDuotone" class="text-lg" />
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="Delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteOrganization(organization)"
                      (keydown.enter)="deleteOrganization(organization)"
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
    </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Organizations {
  private readonly apollo = inject(Apollo);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');

  public organizations = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ organizations: Prisma.OrganizationCreateInput[] }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetOrganizations {
              organizations {
                id
                name
                description
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.organizations)),
  });

  public editOrganization(organization?: Prisma.OrganizationCreateInput) {
    this.modal
      .open(OrganizationsForm, {
        title: organization ? 'Editar Organización' : 'Nueva Organización',
        showCloseButton: true,
        size: 'small',
        data: { organization },
      })
      .closed.subscribe(() => {
        this.organizations.reload();
      });
  }

  public deleteOrganization(organization: Prisma.OrganizationCreateInput) {
    this.confirmation
      .confirm({
        title: 'Eliminar Organización',
        message: '¿Estás seguro de eliminar esta organización?',
      })
      .subscribe((result) => {
        if (result) {
          this.apollo
            .mutate<{ removeOrganization: Prisma.OrganizationCreateInput }>({
              mutation: gql`
                mutation RemoveOrganization($id: String!) {
                  removeOrganization(id: $id) {
                    id
                    name
                    description
                    createdAt
                    updatedAt
                  }
                }
              `,
              variables: {
                id: organization.id,
              },
            })
            .subscribe({
              next: () => {
                this.toasts.showInfo('Organización eliminada exitosamente');
                this.organizations.reload();
              },
              error: (error) => {
                console.error(error);
                this.toasts.showError('Error al eliminar la organización');
              },
            });
        }
      });
  }
}
