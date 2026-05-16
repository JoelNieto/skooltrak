import { Confirmation, Pagination, Paginator, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { httpResource, HttpClient } from '@angular/common/http';
import { Prisma } from '@generated/prisma';
import { catchError, filter, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';
import { toFetchQueryRecord } from '../core/fetch-query-params';
type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
  user: { id: string; email: string; color: string | null; initials: string; emailVerified: boolean | null };
};

@Component({
  selector: 'app-teachers',
  imports: [DatePipe, Paginator, FormsModule, RouterLink, Menu, MenuTrigger, OverlayModule, MenuContent, MenuItem],
  providers: [Pagination],

  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Docentes</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Docentes</h1>
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
          <span class="material-symbols-outlined">search</span>
          <input class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
        </label>
      </div>
      @if (auth.hasPermission('MANAGE_TEACHERS')) {
        <a routerLink="/teachers/new" class="btn btn-primary">
          <span class="material-symbols-outlined">add_circle</span> Agregar Profesor
        </a>
      }
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (teacher of teachers.value(); track teacher.id) {
            <tr>
              <td>
                <div class="flex gap-2 items-center cursor-pointer" [routerLink]="['/teachers', teacher.id]">
                  <div class="avatar avatar-placeholder">
                    <div class="text-white w-8 rounded-full" [style.background]="teacher.user?.color">
                      <span class="text-sm">{{ teacher.initials }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      {{ teacher.name }}
                      @if (teacher.user?.emailVerified) {
                        <span class="badge badge-success badge-sm gap-1">
                          <span class="material-symbols-outlined text-sm!">check_circle</span>
                          Verificado
                        </span>
                      } @else {
                        <span class="badge badge-warning badge-sm gap-1">
                          <span class="material-symbols-outlined text-sm!">schedule</span>
                          Pendiente
                        </span>
                      }
                    </div>
                    <span class="text-sm text-base-content/50">{{ teacher.user?.email }}</span>
                  </div>
                </div>
              </td>
              <td>{{ teacher.createdAt | date: 'short' }}</td>
              <td>{{ teacher.updatedAt | date: 'short' }}</td>
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
                        [routerLink]="['/teachers', teacher.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      @if (auth.hasPermission('MANAGE_TEACHERS')) {
                        <a
                          ngMenuItem
                          value="edit"
                          [routerLink]="['/teachers', teacher.id, 'edit']"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        >
                          <span class="material-symbols-outlined text-lg">edit</span>
                          <span>Editar</span>
                        </a>
                        @if (teacher.user && !teacher.user.emailVerified) {
                          <button
                            ngMenuItem
                            value="resend"
                            class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                            (click)="resendInvitationForTeacher(teacher)"
                          >
                            <span class="material-symbols-outlined text-lg">mail</span>
                            <span>Reenviar invitación</span>
                          </button>
                        }
                        <button
                          ngMenuItem
                          value="delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="deleteTeacher(teacher)"
                        >
                          <span class="material-symbols-outlined text-lg">delete</span>
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
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public teachers = httpResource<Teacher[]>(
    () => ({
      url: '/api/v1/teachers',
      params: toFetchQueryRecord({
        take: this.pagination.take(),
        skip: this.pagination.skip(),
        search: this.pagination.search(),
        orderBy: this.pagination.sortBy(),
        orderDirection: this.pagination.sortOrder(),
      }),
    }),
    { defaultValue: [] },
  );

  private readonly teachersCount = httpResource<number>(() => ({
    url: '/api/v1/teachers/count',
    params: toFetchQueryRecord({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
    effect(() => {
      const count = this.teachersCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
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
