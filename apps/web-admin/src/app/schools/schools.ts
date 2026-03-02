import { Confirmation, Error, Loader, Modal, Pagination, Paginator, Toast } from '@/ui';
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
import { Apollo } from 'apollo-angular';
import {
  WebAdminGetSchoolsDocument,
  WebAdminRemoveSchoolDocument,
} from '../graphql/generated';
import { map } from 'rxjs';
import { SchoolsForm } from './schools-form';
@Component({
  selector: 'app-schools',
  imports: [
    RouterLink,
    DatePipe,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    Paginator,
    Error,
    Loader,
  ],
  providers: [Pagination],
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
        <span class="material-symbols-outlined">add_circle</span> Nueva Escuela
      </button>
    </div>
    @if (schools.error()) {
      <lib-error
        (retry)="schools.reload()"
        [description]="schools.error()?.message"
      />
    } @else if (!schools.hasValue()) {
      <lib-loader />
    } @else {
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
            <td>{{ school.organization?.name }}</td>
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
                <span class="material-symbols-outlined text-xl"
                  >more_horiz</span
                >
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
                      (keydown.enter)="editSchool($any(school))"
                      (click)="editSchool($any(school))"
                      type="button"
                    >
                      <span class="material-symbols-outlined text-lg"
                        >edit</span
                      >
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="Delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteSchool($any(school))"
                      (keydown.enter)="deleteSchool($any(school))"
                      type="button"
                    >
                      <span class="material-symbols-outlined text-lg"
                        >delete</span
                      >
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
    </div>
    }`,
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
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery({
          fetchPolicy: 'cache-and-network',
          query: WebAdminGetSchoolsDocument,
        })
        .valueChanges.pipe(
          map(({ data }) => {
            const all = data?.schools ?? [];
            this.pagination.updateCount(all.length);
            return all.slice(params.skip, params.skip + params.take);
          })
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
            .mutate({
              mutation: WebAdminRemoveSchoolDocument,
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
