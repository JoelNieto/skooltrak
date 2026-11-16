import {
  Button,
  Card,
  Confirmation,
  Icon,
  Pagination,
  Paginator,
  Toast,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
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
  imports: [
    UiTableToolbar,
    Card,
    UiTable,
    Button,
    DatePipe,
    Paginator,
    FormsModule,
    RouterLink,
    UiInputGroup,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  providers: [Pagination],
  template: `
    <ui-table-toolbar>
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input
          aria-label="Buscar"
          class="pl-0"
          type="search"
          placeholder="Buscar..."
          [(ngModel)]="searchText"
          (input)="pagination.updateSearch($event.target.value)"
        />
      </label>
      <a uiToolbarEnd uiButton variant="primary" size="sm" routerLink="/schools/new">
        <ui-icon name="circle-plus" class="text-base" /> Agregar Colegio
      </a>
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="schools.isLoading()">
        <thead>
          <tr>
            <th>Colegio</th>
            <th>Abreviatura</th>
            <th>Ciudad</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Creado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @if (schools.isLoading() && !schools.hasValue()) {
          <tbody uiTableSkeleton [columns]="7"></tbody>
        } @else if (schools.error()) {
          <tbody>
            <tr uiTableError [columns]="7" (retry)="schools.reload()"></tr>
          </tbody>
        } @else {
          <tbody>
            @for (school of schools.value() ?? []; track school.id) {
              <tr>
                <td>
                  <a [routerLink]="['/schools', school.id]" class="flex items-center gap-3 hover:opacity-80">
                    <div
                      class="min-w-10 max-w-16 min-h-8 max-h-12 rounded-lg border border-line flex items-center justify-center overflow-hidden bg-surface-0 shrink-0"
                    >
                      @if (school.logoUrl) {
                        <img [src]="school.logoUrl" [alt]="school.name" class="w-full h-auto object-contain" />
                      } @else {
                        <ui-icon name="school" class="text-xl text-ink-subtle" />
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
                  <ui-row-actions
                    [actions]="rowActions(school)"
                    [label]="'Acciones para ' + school.name"
                    (action)="onRowAction($event, school)"
                  />
                </td>
              </tr>
            } @empty {
              @if (searchText()) {
                <tr
                  uiTableEmpty
                  [columns]="7"
                  icon="search-x"
                  title="Sin resultados"
                  description="Ningún resultado coincide con la búsqueda."
                ></tr>
              } @else {
                <tr uiTableEmpty [columns]="7" icon="school" title="Aún no hay colegios"></tr>
              }
            }
          </tbody>
        }
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

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(school: SchoolRow): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/schools', school.id] },
      { id: 'edit', label: 'Editar', icon: 'pencil', link: ['/schools', school.id, 'edit'] },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, school: SchoolRow): void {
    switch (action) {
      case 'delete':
        this.deleteSchool(school);
        break;
    }
  }
}
