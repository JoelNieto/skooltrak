import {
  Badge,
  BadgeTone,
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
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
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
    UiTableToolbar,
    Breadcrumbs,
    Card,
    UiTable,
    Badge,
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
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Alumnos' }]" />
    <h1 class="text-2xl font-semibold mb-2">Alumnos</h1>
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
      <a uiToolbarEnd uiButton variant="primary" size="sm" routerLink="/students/new">
        <ui-icon name="circle-plus" class="text-base" /> Agregar Alumno
      </a>
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="students.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Documento</th>
            <th>Estado</th>
            <th>Grupo</th>
            <th>Fecha de creación</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (studentsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="students.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (student of studentsList.rows()?.data; track student.id) {
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
                    <ui-row-actions
                      [actions]="rowActions(student)"
                      [label]="'Acciones para ' + student.name"
                      (action)="onRowAction($event, student)"
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
                  <tr
                    uiTableEmpty
                    [columns]="7"
                    icon="users"
                    title="Aún no hay estudiantes"
                    description="Agrégalos uno por uno o impórtalos desde un CSV."
                  ></tr>
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
export default class Students {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public pagination = inject(Pagination);
  public auth = inject(Auth);
  public page = signal(1);
  public pageSize = signal(10);
  public total = computed(() => this.studentsList.rows()?.meta?.total ?? 0);

  public students = httpResource<PaginatedResponse<StudentRow>>(() => ({
    url: '/api/v1/students',
    params: toFetchQueryRecord({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchText(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));
  /** students with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly studentsList = listState(this.students);

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

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(student: StudentRow): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/students', student.id] },
      {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
        link: ['/students', student.id, 'edit'],
        hidden: !this.auth.hasPermission('MANAGE_STUDENTS'),
      },
      {
        id: 'resend',
        label: 'Reenviar invitación',
        icon: 'mail',
        hidden: !(student.user && !student.user.emailVerified),
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: 'trash-2',
        tone: 'danger',
        hidden: !this.auth.hasPermission('MANAGE_STUDENTS'),
      },
    ];
  }

  protected onRowAction(action: string, student: StudentRow): void {
    switch (action) {
      case 'resend':
        this.resendInvitationForStudent(student);
        break;
      case 'delete':
        this.deleteStudent(student);
        break;
    }
  }
}
