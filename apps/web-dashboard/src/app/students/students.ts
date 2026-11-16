import {
  Badge,
  BadgeTone,
  Breadcrumbs,
  Button,
  Card,
  Confirmation,
  EmptyState,
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
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { $Enums } from '@generated/prisma';
import { filter, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';

const ENROLLMENT_STATUS_LABELS: Record<$Enums.EnrollmentStatus, string> = {
  ACTIVE: 'Activo',
  CANDIDATE: 'Candidato',
  RETIRED: 'Retirado',
};

const ENROLLMENT_STATUS_TONES: Record<$Enums.EnrollmentStatus, BadgeTone> = {
  ACTIVE: 'success',
  CANDIDATE: 'warning',
  RETIRED: 'neutral',
};

type StudentRow = {
  id: string;
  name: string;
  email?: string;
  documentId?: string;
  enrollmentStatus?: $Enums.EnrollmentStatus;
  classGroupId?: string;
  classGroup?: { name: string };
  user?: { emailVerified?: boolean };
  createdAt?: string;
};

@Component({
  imports: [
    Breadcrumbs,
    Card,
    UiTable,
    Badge,
    Button,
    DatePipe,
    RouterLink,
    PaginatorV2,
    FormsModule,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    EmptyState,
    UiInputGroup,
    Icon,
  ],
  providers: [Pagination],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Alumnos' }]" />
    <h1 class="text-2xl font-semibold mb-2">Alumnos</h1>
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label uiInputGroup>
          <ui-icon name="search" />
          <input
            class="pl-0"
            type="search"
            placeholder="Buscar..."
            [(ngModel)]="searchText"
            (input)="pagination.updateSearch($event.target.value)"
          />
        </label>
      </div>
      <a uiButton variant="primary" routerLink="/students/new"> <ui-icon name="circle-plus" /> Agregar Alumno </a>
    </div>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable>
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
          @for (student of students.value()?.data; track student.id) {
            <tr>
              <td>
                <a [routerLink]="['/students', student.id]" class="link link-hover">{{ student.name }}</a>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  {{ student.email }}
                  @if (student.user?.emailVerified) {
                    <span uiBadge tone="success" size="sm" title="Verificado">
                      <ui-icon name="circle-check" class="text-xs!" />
                    </span>
                  } @else {
                    <span uiBadge tone="warning" size="sm" title="Pendiente de verificación">
                      <ui-icon name="clock" class="text-xs!" />
                    </span>
                  }
                </div>
              </td>
              <td>{{ student.documentId }}</td>
              <td>
                <span uiBadge size="sm" [tone]="enrollmentTone(student.enrollmentStatus ?? 'ACTIVE')">
                  {{ getStatusLabel(student.enrollmentStatus ?? 'ACTIVE') }}
                </span>
              </td>
              <td>
                @if (student.classGroup) {
                  <a uiBadge tone="action" size="sm" [routerLink]="['/groups', student.classGroupId]">
                    {{ student.classGroup.name }}
                  </a>
                } @else {
                  <span class="text-ink-subtle">-</span>
                }
              </td>
              <td>{{ student.createdAt | date: 'short' }}</td>
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
                        [routerLink]="['/students', student.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                      >
                        <ui-icon name="eye" class="text-lg" />
                        <span>Ver</span>
                      </a>
                      @if (auth.hasPermission('MANAGE_STUDENTS')) {
                        <a
                          ngMenuItem
                          value="edit"
                          [routerLink]="['/students', student.id, 'edit']"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                        >
                          <ui-icon name="pencil" class="text-lg" />
                          <span>Editar</span>
                        </a>
                      }
                      @if (student.user && !student.user.emailVerified) {
                        <button
                          ngMenuItem
                          value="resend"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="resendInvitationForStudent(student)"
                        >
                          <ui-icon name="mail" class="text-lg" />
                          <span>Reenviar invitación</span>
                        </button>
                      }
                      @if (auth.hasPermission('MANAGE_STUDENTS')) {
                        <button
                          ngMenuItem
                          value="delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="deleteStudent(student)"
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
          } @empty {
            <tr>
              <td colspan="7" class="text-center text-ink-subtle py-4">
                <lib-empty-state
                  title="No se encontraron estudiantes"
                  icon="user"
                  description="Intenta con otros criterios de búsqueda."
                />
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
export default class Students {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public pagination = inject(Pagination);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public auth = inject(Auth);
  public page = signal(1);
  public pageSize = signal(10);
  public total = computed(() => this.students.value()?.meta?.total ?? 0);

  public students = httpResource<PaginatedResponse<StudentRow>>(() => ({
    url: '/api/v1/students',
    params: toFetchQueryRecord({
      page: this.page(),
      take: this.pageSize(),
      search: this.searchText(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));

  getStatusLabel(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_LABELS[status] || status;
  }

  enrollmentTone(status: $Enums.EnrollmentStatus): BadgeTone {
    return ENROLLMENT_STATUS_TONES[status] || 'neutral';
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
