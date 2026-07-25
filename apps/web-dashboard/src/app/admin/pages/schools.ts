import { Confirmation, Pagination, Paginator, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';

type SchoolRow = {
  id: string;
  name: string;
  shortName?: string;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
};

@Component({
  selector: 'app-schools',
  imports: [DatePipe, Paginator, FormsModule, RouterLink, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  providers: [Pagination],
  template: `
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary">
          <span class="material-symbols-outlined">search</span>
          <input
            class="pl-0"
            type="search"
            placeholder="Buscar..."
            [(ngModel)]="searchText"
            (input)="pagination.updateSearch($event.target.value)"
          />
        </label>
      </div>
      <a routerLink="/schools/new" class="btn btn-primary">
        <span class="material-symbols-outlined">add_circle</span> Agregar Colegio
      </a>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Colegio</th>
            <th>Abreviatura</th>
            <th>Ciudad</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (school of schools.value() ?? []; track school.id) {
            <tr>
              <td>
                <a [routerLink]="['/schools', school.id]" class="flex items-center gap-3 hover:opacity-80">
                  <div
                    class="min-w-10 max-w-16 min-h-8 max-h-12 rounded-lg border border-base-300 flex items-center justify-center overflow-hidden bg-base-200 shrink-0"
                  >
                    @if (school.logoUrl) {
                      <img [src]="school.logoUrl" [alt]="school.name" class="w-full h-auto object-contain" />
                    } @else {
                      <span class="material-symbols-outlined text-xl text-base-content/40">school</span>
                    }
                  </div>
                  <span class="link link-hover font-medium">{{ school.name }}</span>
                </a>
              </td>
              <td>{{ school.shortName }}</td>
              <td>{{ school.city || '-' }}</td>
              <td>{{ school.email || '-' }}</td>
              <td>{{ school.phone || '-' }}</td>
              <td>{{ school.createdAt | date: 'short' }}</td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="actionsMenu()"
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
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <a
                        ngMenuItem
                        value="view"
                        [routerLink]="['/schools', school.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      <a
                        ngMenuItem
                        value="edit"
                        [routerLink]="['/schools', school.id, 'edit']"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </a>
                      <button
                        ngMenuItem
                        value="delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteSchool(school)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </ng-template>
                  </div>
                </ng-template>
              </td>
            </tr>
          } @empty {
            @if (schools.isLoading()) {
              @for (_ of [1, 2, 3, 4, 5]; track _) {
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="skeleton w-10 h-10 rounded-lg"></div>
                      <div class="skeleton h-4 w-32"></div>
                    </div>
                  </td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                  <td><div class="skeleton h-4 w-full"></div></td>
                </tr>
              }
            } @else {
              <tr>
                <td colspan="7" class="text-center">Sin colegios registrados</td>
              </tr>
            }
          }
        </tbody>
      </table>
      <div class="p-4 rounded-b-lg">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>
  `,
})
export default class Schools {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  pagination = inject(Pagination);
  searchText = signal('');
  actionsMenu = viewChild<Menu<string>>('actionsMenu');

  public schools = httpResource<SchoolRow[]>(() => '/api/v1/schools', { defaultValue: [] });

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
  }

  public deleteSchool(school: SchoolRow) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Colegio',
        message: `¿Estás seguro de eliminar el colegio ${school.name}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.#http.delete(`/api/v1/schools/${school.id}`)),
      )
      .subscribe({
        next: () => {
          this.schools.reload();
          this.#toast.showSuccess('Colegio eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar el colegio');
        },
      });
  }
}
