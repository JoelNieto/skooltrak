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
import { RouterLink } from '@angular/router';
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
    RouterLink,
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
    <div class="flex justify-end">
      <button uiButton variant="primary" (click)="editSubject()">
        <ui-icon name="plus" class="text-base" /> Nueva asignatura
      </button>
    </div>
    <div uiCard class="overflow-hidden">
      <div class="border-b border-line px-4 py-3.5">
        <ui-table-toolbar>
          <label uiInputGroup size="sm" class="w-full sm:w-70">
            <ui-icon name="search" class="text-base text-ink-subtle" />
            <input
              aria-label="Buscar asignaturas"
              class="pl-0"
              type="search"
              placeholder="Buscar por nombre o código"
              [(ngModel)]="searchText"
            />
          </label>
          <span uiToolbarEnd class="text-[13px] text-ink-subtle" aria-live="polite">
            {{ total() }} {{ total() === 1 ? 'asignatura' : 'asignaturas' }}
          </span>
        </ui-table-toolbar>
      </div>
      <div class="overflow-x-auto">
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
            <th uiSortHeader="updatedAt">Actualizado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (subjectsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="subjects.reload()"></tr>
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
                  <td class="font-medium text-ink-strong">{{ subject.name }}</td>
                  <td>
                    @if (subject.code) {
                      <span class="rounded-md border border-line bg-surface-0 px-1.5 py-0.5 font-mono text-[13px] text-ink">{{
                        subject.code
                      }}</span>
                    }
                  </td>
                  <td>
                    @if (subject.area) {
                      {{ subject.area }}
                    } @else {
                      <span class="text-ink-subtle">—</span>
                    }
                  </td>
                  <td class="text-ink-muted">{{ subject.updatedAt | date: 'd MMM y' }}</td>
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
                    [columns]="6"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún resultado coincide con la búsqueda."
                  ></tr>
                } @else {
                  <tr uiTableEmpty [columns]="6" icon="book-open" title="Aún no hay materias"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      </div>
      <div class="border-t border-line p-4">
        <lib-paginator
          [total]="total()"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>
    </div>

    <a
      routerLink="/admin/courses"
      class="flex flex-wrap items-center gap-3.5 rounded-2xl border border-line bg-surface-1 px-4 py-3.5 text-ink no-underline hover:border-line-strong hover:no-underline"
    >
      <span class="flex size-9 flex-none items-center justify-center rounded-full bg-action-subtle text-primary">
        <ui-icon name="graduation-cap" class="text-lg" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="font-semibold text-ink-strong">Siguiente paso: crea los cursos</span>
        <span class="text-[13px] text-ink-muted">Asigna estas materias a cada plan de estudio y a un docente.</span>
      </span>
      <span class="inline-flex items-center gap-1.5 font-semibold text-primary">
        Ir a Cursos <ui-icon name="arrow-right" class="text-base" />
      </span>
    </a>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
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
