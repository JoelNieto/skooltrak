import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Confirmation,
  Icon,
  Pagination,
  PaginatorV2,
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
import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { catchError, filter, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';
import Store from '../core/store';

type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
  user: { id: string; email: string; color: string | null; initials: string; emailVerified: boolean | null };
};

@Component({
  selector: 'app-teachers',
  imports: [
    UiTableToolbar,
    Breadcrumbs,
    Card,
    UiTable,
    Badge,
    Button,
    DatePipe,
    PaginatorV2,
    FormField,
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
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Docentes' }]" />
    <h1 class="text-2xl font-semibold mb-2">Docentes</h1>
    <ui-table-toolbar>
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input aria-label="Buscar" class="pl-0" type="search" placeholder="Buscar..." [formField]="form.searchText" />
      </label>
      @if (auth.hasPermission('MANAGE_TEACHERS')) {
        <a uiToolbarEnd uiButton variant="primary" size="sm" routerLink="/teachers/new">
          <ui-icon name="circle-plus" class="text-base" /> Agregar Profesor
        </a>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="teachers.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @if (teachers.isLoading() && !teachers.hasValue()) {
          <tbody uiTableSkeleton [columns]="4"></tbody>
        } @else if (teachers.error()) {
          <tbody>
            <tr uiTableError [columns]="4" (retry)="teachers.reload()"></tr>
          </tbody>
        } @else {
          <tbody>
            @for (teacher of teachers.value()?.data; track teacher.id) {
              <tr>
                <td>
                  <div class="flex gap-2 items-center cursor-pointer" [routerLink]="['/teachers', teacher.id]">
                    <div class="avatar avatar-placeholder">
                      @if (avatarUrlFor(teacher)) {
                        <div class="w-8 rounded-full overflow-hidden">
                          <img [src]="avatarUrlFor(teacher)!" [alt]="teacher.name" class="w-full h-full object-cover" />
                        </div>
                      } @else {
                        <div class="text-white w-8 rounded-full" [style.background]="teacher.user?.color">
                          <span class="text-sm">{{ teacher.initials }}</span>
                        </div>
                      }
                    </div>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        {{ teacher.name }}
                        @if (teacher.user?.emailVerified) {
                          <span uiBadge tone="success" size="sm" class="gap-1">
                            <ui-icon name="circle-check" class="text-sm!" />
                            Verificado
                          </span>
                        } @else {
                          <span uiBadge tone="warning" size="sm" class="gap-1">
                            <ui-icon name="clock" class="text-sm!" />
                            Pendiente
                          </span>
                        }
                      </div>
                      <span class="text-sm text-ink-subtle">{{ teacher.user?.email }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ teacher.createdAt | date: 'short' }}</td>
                <td>{{ teacher.updatedAt | date: 'short' }}</td>
                <td>
                  <ui-row-actions
                    [actions]="rowActions(teacher)"
                    [label]="'Acciones para ' + teacher.name"
                    (action)="onRowAction($event, teacher)"
                  />
                </td>
              </tr>
            } @empty {
              @if (form.searchText().value()) {
                <tr
                  uiTableEmpty
                  [columns]="4"
                  icon="search-x"
                  title="Sin resultados"
                  description="Ningún resultado coincide con la búsqueda."
                ></tr>
              } @else {
                <tr uiTableEmpty [columns]="4" icon="users" title="Aún no hay docentes"></tr>
              }
            }
          </tbody>
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
export default class Teachers {
  public store = inject(Store);
  private http = inject(HttpClient);
  public auth = inject(Auth);
  public pagination = inject(Pagination);
  #confirmation = inject(Confirmation);
  #toasts = inject(Toast);
  searchText = signal('');
  public page = signal(1);
  public pageSize = signal(10);
  total = computed(() => this.teachers.value()?.meta.total ?? 0);
  public formModel = signal<{ searchText: string }>({ searchText: '' });
  public form = form(this.formModel, (f) => {
    debounce(f.searchText, 400);
  });

  public teachers = httpResource<PaginatedResponse<Teacher>>(() => ({
    url: '/api/v1/teachers',
    params: toFetchQueryRecord({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.form().value().searchText,
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));

  public avatarMap = httpResource<Record<string, string | null>>(
    () => {
      const ids = (this.teachers.value()?.data ?? []).map((t) => t.user?.id).filter((id): id is string => !!id);
      if (!ids.length) return undefined;
      return { method: 'POST', url: '/api/v1/users/avatar-urls', body: { userIds: ids } };
    },
    { defaultValue: {} },
  );

  public avatarUrlFor(teacher: Teacher): string | null {
    const id = teacher.user?.id;
    if (!id) return null;
    return this.avatarMap.value()?.[id] ?? null;
  }

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
  }

  public resendInvitationForTeacher(teacher: { user?: { email?: string } | null }) {
    if (teacher.user?.email) {
      this.resendInvitation(teacher.user.email);
    }
  }

  public resendInvitation(email: string) {
    this.http.post('/api/v1/auth/resend-invitation', { email }).subscribe({
      next: () => {
        this.#toasts.showSuccess('Invitación reenviada');
        this.teachers.reload();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al reenviar invitación';
        this.#toasts.showError(msg);
      },
    });
  }

  public deleteTeacher(teacher: { id?: string }) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Profesor',
        message: '¿Estás seguro de eliminar este profesor?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() => {
          if (!teacher.id) return of(null);
          return this.http.delete(`/api/v1/teachers/${teacher.id}`);
        }),
        catchError((error) => {
          console.error(error);
          this.#toasts.showError('Error al eliminar el profesor');
          return of(null);
        }),
      )
      .subscribe(() => {
        this.#toasts.showSuccess('Profesor eliminado correctamente');
        this.teachers.reload();
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(teacher: Teacher): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/teachers', teacher.id] },
      {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
        link: ['/teachers', teacher.id, 'edit'],
        hidden: !this.auth.hasPermission('MANAGE_TEACHERS'),
      },
      {
        id: 'resend',
        label: 'Reenviar invitación',
        icon: 'mail',
        hidden: !(this.auth.hasPermission('MANAGE_TEACHERS') && teacher.user && !teacher.user.emailVerified),
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: 'trash-2',
        tone: 'danger',
        hidden: !this.auth.hasPermission('MANAGE_TEACHERS'),
      },
    ];
  }

  protected onRowAction(action: string, teacher: Teacher): void {
    switch (action) {
      case 'resend':
        this.resendInvitationForTeacher(teacher);
        break;
      case 'delete':
        this.deleteTeacher(teacher);
        break;
    }
  }
}
