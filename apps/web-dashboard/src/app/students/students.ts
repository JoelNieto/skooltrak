import { Confirmation, Pagination, Paginator, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe, NgClass } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { $Enums } from '@generated/prisma';
import { filter, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';
import { toFetchQueryRecord } from '../core/fetch-query-params';

const ENROLLMENT_STATUS_LABELS: Record<$Enums.EnrollmentStatus, string> = {
  ACTIVE: 'Activo',
  CANDIDATE: 'Candidato',
  RETIRED: 'Retirado',
};

const ENROLLMENT_STATUS_COLORS: Record<$Enums.EnrollmentStatus, string> = {
  ACTIVE: 'badge-success',
  CANDIDATE: 'badge-warning',
  RETIRED: 'badge-neutral',
};

@Component({
  imports: [
    DatePipe,
    NgClass,
    RouterLink,
    Paginator,
    FormsModule,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
  providers: [Pagination],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Alumnos</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Alumnos</h1>
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
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
      <a routerLink="/students/new" class="btn btn-primary">
        <span class="material-symbols-outlined">add_circle</span> Agregar Alumno
      </a>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Documento</th>
            <th>Estado</th>
            <th>Grupo</th>
            <th>Fecha de creación</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (student of students.value(); track student.id) {
            <tr>
              <td>
                <a [routerLink]="['/students', student.id]" class="link link-hover">{{ student.name }}</a>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  {{ student.email }}
                  @if (student.user?.emailVerified) {
                    <span class="badge badge-success badge-xs" title="Verificado">
                      <span class="material-symbols-outlined text-xs!">check_circle</span>
                    </span>
                  } @else {
                    <span class="badge badge-warning badge-xs" title="Pendiente de verificación">
                      <span class="material-symbols-outlined text-xs!">schedule</span>
                    </span>
                  }
                </div>
              </td>
              <td>{{ student.documentId }}</td>
              <td>
                <span class="badge badge-sm" [ngClass]="getStatusColor(student.enrollmentStatus ?? 'ACTIVE')">
                  {{ getStatusLabel(student.enrollmentStatus ?? 'ACTIVE') }}
                </span>
              </td>
              <td>
                @if (student.classGroup) {
                  <a class="badge badge-primary badge-sm" [routerLink]="['/groups', student.classGroupId]">
                    {{ student.classGroup.name }}
                  </a>
                } @else {
                  <span class="text-base-content/50">-</span>
                }
              </td>
              <td>{{ student.createdAt | date: 'short' }}</td>
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
                        [routerLink]="['/students', student.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      @if (auth.hasPermission('MANAGE_STUDENTS')) {
                        <a
                          ngMenuItem
                          value="edit"
                          [routerLink]="['/students', student.id, 'edit']"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        >
                          <span class="material-symbols-outlined text-lg">edit</span>
                          <span>Editar</span>
                        </a>
                      }
                      @if (student.user && !student.user.emailVerified) {
                        <button
                          ngMenuItem
                          value="resend"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="resendInvitationForStudent(student)"
                        >
                          <span class="material-symbols-outlined text-lg">mail</span>
                          <span>Reenviar invitación</span>
                        </button>
                      }
                      @if (auth.hasPermission('MANAGE_STUDENTS')) {
                        <button
                          ngMenuItem
                          value="delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="deleteStudent(student)"
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
})
export default class Students {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public pagination = inject(Pagination);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public auth = inject(Auth);
  public students = httpResource<
    Array<{
      id: string;
      name: string;
      email?: string;
      documentId?: string;
      enrollmentStatus?: $Enums.EnrollmentStatus;
      classGroupId?: string;
      classGroup?: { name: string };
      user?: { emailVerified?: boolean };
      createdAt?: string;
    }>
  >(
    () => ({
      url: '/api/v1/students',
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

  private readonly studentsCount = httpResource<number>(() => ({
    url: '/api/v1/students/count',
    params: toFetchQueryRecord({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));

  constructor() {
    effect(() => {
      const count = this.studentsCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
    });
  }

  getStatusLabel(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_COLORS[status] || 'badge-ghost';
  }

  public resendInvitationForStudent(student: { email?: string }) {
    if (student?.email) {
      this.resendInvitation(student.email);
    }
  }

  public resendInvitation(email: string) {
    this.http.post('/api/v1/auth/resend-invitation', { email }).subscribe({
      next: () => {
        this.toasts.showSuccess('Invitación reenviada');
        this.students.reload();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al reenviar invitación';
        this.toasts.showError(msg);
      },
    });
  }

  public deleteStudent(student: { id?: string; name?: string }) {
    if (!student?.id) return;
    this.confirmation
      .confirm({
        title: 'Eliminar Alumno',
        message: `¿Estás seguro de eliminar al alumno ${student.name ?? 'este alumno'}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => {
          if (!student.id) return of(null);
          return this.http.delete(`/api/v1/students/${student.id}`);
        }),
      )
      .subscribe({
        next: () => {
          this.students.reload();
          this.toasts.showSuccess('Alumno eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toasts.showError('Error al eliminar el alumno');
        },
      });
  }
}
