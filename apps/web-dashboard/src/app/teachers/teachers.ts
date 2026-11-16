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
  UiTable,
} from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, signal, viewChild } from '@angular/core';
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
    Breadcrumbs,
    Card,
    UiTable,
    Badge,
    Button,
    DatePipe,
    PaginatorV2,
    FormField,
    RouterLink,
    Menu,
    MenuTrigger,
    OverlayModule,
    MenuContent,
    MenuItem,
    UiInputGroup,
    Icon,
  ],
  providers: [Pagination],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Docentes' }]" />
    <h1 class="text-2xl font-semibold mb-2">Docentes</h1>
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label uiInputGroup>
          <ui-icon name="search" />
          <input class="pl-0" type="search" placeholder="Buscar..." [formField]="form.searchText" />
        </label>
      </div>
      @if (auth.hasPermission('MANAGE_TEACHERS')) {
        <a uiButton variant="primary" routerLink="/teachers/new"> <ui-icon name="circle-plus" /> Agregar Profesor </a>
      }
    </div>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th></th>
          </tr>
        </thead>
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
                <button
                  class="cursor-pointer hover:bg-surface-2 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="actionsMenu()"
                >
                  <ui-icon name="ellipsis" class="text-xl" />
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
                  <div ngMenu class="bg-surface-1 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <a
                        ngMenuItem
                        value="view"
                        [routerLink]="['/teachers', teacher.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                      >
                        <ui-icon name="eye" class="text-lg" />
                        <span>Ver</span>
                      </a>
                      @if (auth.hasPermission('MANAGE_TEACHERS')) {
                        <a
                          ngMenuItem
                          value="edit"
                          [routerLink]="['/teachers', teacher.id, 'edit']"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                        >
                          <ui-icon name="pencil" class="text-lg" />
                          <span>Editar</span>
                        </a>
                        @if (teacher.user && !teacher.user.emailVerified) {
                          <button
                            ngMenuItem
                            value="resend"
                            class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                            (click)="resendInvitationForTeacher(teacher)"
                          >
                            <ui-icon name="mail" class="text-lg" />
                            <span>Reenviar invitación</span>
                          </button>
                        }
                        <button
                          ngMenuItem
                          value="delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="deleteTeacher(teacher)"
                        >
                          <ui-icon name="trash-2" class="text-lg" />
                          <span>Eliminar</span>
                        </button>
                      }
                    </ng-template>
                  </div>
                </ng-template>
              </td>
            </tr>
          }
        </tbody>
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
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
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
}
