import {
  Button,
  Card,
  Confirmation,
  Icon,
  Modal,
  Pagination,
  PaginatorV2,
  Toast,
  UiIconName,
  UiInputGroup,
  UI_ICONS,
  UiRowAction,
  UiRowActions,
  UiSortHeader,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';

import { filter, switchMap } from 'rxjs';
import { DEFAULT_SUBJECT_ICON, SUBJECT_ICONS } from '@/shared';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import SubjectsForm from '../forms/subjects-form';
@Component({
  selector: 'app-subjects',
  imports: [
    UiTableToolbar,
    UiSortHeader,
    Card,
    UiTable,
    Button,
    DatePipe,
    DatePipe,
    PaginatorV2,
    FormsModule,
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
        <input aria-label="Buscar" class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
      </label>
      <button uiToolbarEnd uiButton variant="primary" size="sm" (click)="editSubject()">
        <ui-icon name="circle-plus" class="text-base" /> Nueva asignatura
      </button>
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table
        uiTable
        [sort]="pagination.sort()"
        (sortChange)="pagination.setSort($event)"
        [attr.aria-busy]="subjects.isLoading()"
      >
        <thead>
          <tr>
            <th class="w-12"><span class="sr-only">Ícono</span></th>
            <th uiSortHeader="name" class="w-1/4">Nombre</th>
            <th uiSortHeader="code" class="w-1/6">Código</th>
            <th class="w-1/6">Área</th>
            <th uiSortHeader="createdAt">Creado</th>
            <th uiSortHeader="updatedAt">Actualizado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (subjectsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="subjects.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (subject of subjectsList.rows()?.data ?? []; track subject.id) {
                <tr>
                  <td>
                    <span
                      class="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink"
                      [title]="iconLabel(subject.icon)"
                    >
                      <ui-icon [name]="iconName(subject.icon)" class="text-lg" />
                      <span class="sr-only">{{ iconLabel(subject.icon) }}</span>
                    </span>
                  </td>
                  <td>{{ subject.name }}</td>
                  <td>{{ subject.code }}</td>
                  <td>
                    @if (subject.area) {
                      {{ subject.area }}
                    } @else {
                      <span class="text-ink-subtle">—</span>
                    }
                  </td>
                  <td>{{ subject.createdAt | date: 'short' }}</td>
                  <td>{{ subject.updatedAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + subject.name"
                      (action)="onRowAction($event, subject)"
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
                  <tr uiTableEmpty [columns]="7" icon="book-open" title="Aún no hay materias"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      <div class="p-4 rounded-b-lg ">
        <lib-paginator
          [total]="total()"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>
    </div>
  `,
})
export default class Subjects {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #modal = inject(Modal);
  #toast = inject(Toast);
  pagination = inject(Pagination);
  searchText = signal('');
  public page = signal(1);
  public pageSize = signal(10);

  total = computed(() => this.subjectsList.rows()?.meta?.total ?? 0);

  public subjects = httpResource<PaginatedResponse<Prisma.SubjectGetPayload<false>>>(() => ({
    url: '/api/v1/subjects',
    params: toFetchQueryRecord({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchText(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));
  /** subjects with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly subjectsList = listState(this.subjects);

  public editSubject(subject?: Prisma.SubjectGetPayload<false>) {
    this.#modal
      .open(SubjectsForm, {
        title: subject ? 'Editar Asignatura' : 'Agregar Asignatura',
        data: {
          subject,
        },
      })
      .closed.subscribe(() => {
        this.subjects.reload();
      });
  }

  public deleteSubject(subject: Prisma.SubjectGetPayload<false>) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Asignatura',
        message: `¿Estás seguro de eliminar la asignatura ${subject.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.#http.delete(`/api/v1/subjects/${subject.id}`)),
      )
      .subscribe({
        next: () => {
          this.subjects.reload();
          this.#toast.showSuccess('Asignatura eliminada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar la asignatura');
        },
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  /** The subject's icon (ACA-001 FR .2), or the default one covers fall back to. */
  protected iconName(icon: string | null): UiIconName {
    return icon && icon in UI_ICONS ? (icon as UiIconName) : (DEFAULT_SUBJECT_ICON as UiIconName);
  }

  protected iconLabel(icon: string | null): string {
    const name = icon ?? DEFAULT_SUBJECT_ICON;
    return SUBJECT_ICONS.find((i) => i.name === name)?.label ?? name;
  }

  protected onRowAction(action: string, subject: Prisma.SubjectGetPayload<false>): void {
    switch (action) {
      case 'edit':
        this.editSubject(subject);
        break;
      case 'delete':
        this.deleteSubject(subject);
        break;
    }
  }
}
