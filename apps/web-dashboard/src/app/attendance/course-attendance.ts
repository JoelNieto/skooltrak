import { Confirmation, Loader, Modal, Pagination, Paginator } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { forkJoin, map, of, tap } from 'rxjs';
import AttendanceForm from './attendance-form';
type StudentType = Prisma.StudentGetPayload<{ include: { classGroup: true } }>;

type AttendanceRecordType = {
  id: string;
  studentId: string;
  status: string;
  comment: string | null;
  student: StudentType;
};

type AttendanceSessionType = {
  id: string;
  date: string;
  courseId: string;
  classGroupId: string;
  teacherId: string;
  classGroup: { id: string; name: string };
  records: AttendanceRecordType[];
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  SICK_LEAVE: 'Permiso médico',
  EXCUSED: 'Excusado',
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'badge-success',
  ABSENT: 'badge-error',
  LATE: 'badge-warning',
  SICK_LEAVE: 'badge-info',
  EXCUSED: 'badge-neutral',
};

@Component({
  selector: 'app-course-attendance',
  imports: [Loader, FormsModule, DatePipe, NgClass, Paginator, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  providers: [Pagination],
  template: `
    <div class="flex flex-col md:flex-row justify-between gap-4 mb-4">
      <div class="flex gap-2 items-center">
        <select
          class="select select-primary"
          [ngModel]="selectedGroupId()"
          (ngModelChange)="selectedGroupId.set($event)"
        >
          <option value="">Todos los grupos</option>
          @for (group of groupsResource.value(); track group.id) {
            <option [value]="group.id">{{ group.name }}</option>
          }
        </select>
      </div>
      <button class="btn btn-primary" (click)="openForm()">
        <span class="material-symbols-outlined">add</span>
        Nueva asistencia
      </button>
    </div>

    @if (sessionsResource.isLoading()) {
      <lib-loader />
    }

    @if (sessionsResource.error()) {
      <div class="alert alert-error">
        <span class="material-symbols-outlined">error</span>
        Error al cargar las sesiones de asistencia
      </div>
    }

    @if (sessionsResource.hasValue()) {
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Grupo</th>
              <th>Presentes</th>
              <th>Ausentes</th>
              <th>Tardanzas</th>
              <th>Otros</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (session of sessionsResource.value(); track session.id) {
              @let stats = getStats(session);
              <tr class="hover">
                <td>
                  <span class="font-medium">
                    {{ session.date | date: 'fullDate' }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-ghost">
                    {{ session.classGroup.name }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-success gap-1">
                    <span class="material-symbols-outlined text-sm!">check</span>
                    {{ stats.present }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-error gap-1">
                    <span class="material-symbols-outlined text-sm!">close</span>
                    {{ stats.absent }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-warning gap-1">
                    <span class="material-symbols-outlined text-sm!">schedule</span>
                    {{ stats.late }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-info gap-1">
                    {{ stats.other }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-sm btn-ghost"
                    ngMenuTrigger
                    #origin
                    #trigger="ngMenuTrigger"
                    [menu]="actionsMenu()"
                  >
                    <span class="material-symbols-outlined text-xl!">more_horiz</span>
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
                        <button
                          ngMenuItem
                          value="View"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="viewSession(session)"
                          title="Ver detalles"
                        >
                          <span class="material-symbols-outlined">visibility</span>
                          <span>Ver detalles</span>
                        </button>
                        <button
                          ngMenuItem
                          value="Edit"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="editSession(session)"
                          title="Editar"
                        >
                          <span class="material-symbols-outlined">edit</span>
                          <span>Editar</span>
                        </button>
                        <button
                          ngMenuItem
                          value="Delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="deleteSession(session)"
                          title="Eliminar"
                        >
                          <span class="material-symbols-outlined">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </ng-template>
                    </div>
                  </ng-template>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-8 text-base-content/60">
                  No hay sesiones de asistencia registradas
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="flex justify-end mt-4">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    }

    <!-- Session Detail Modal -->
    @if (selectedSession()) {
      <dialog class="modal modal-open">
        <div class="modal-box max-w-3xl">
          <h3 class="font-bold text-lg mb-4">Asistencia - {{ selectedSession()!.date | date: 'fullDate' }}</h3>
          <div class="badge badge-ghost mb-4">
            {{ selectedSession()!.classGroup.name }}
          </div>
          <div class="overflow-x-auto max-h-96">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                @for (record of selectedSession()!.records; track record.id) {
                  <tr>
                    <td>
                      {{ record.student.firstName }}
                      {{ record.student.fatherName }}
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusColor(record.status)">
                        {{ getStatusLabel(record.status) }}
                      </span>
                    </td>
                    <td class="text-sm text-base-content/70">
                      {{ record.comment || '-' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="modal-action">
            <button class="btn" (click)="selectedSession.set(null)">Cerrar</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="selectedSession.set(null)">close</button>
        </form>
      </dialog>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseAttendance {
  public courseId = input.required<string>();

  #http = inject(HttpClient);
  #modal = inject(Modal);
  #confirmation = inject(Confirmation);
  public pagination = inject(Pagination);
  public actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public selectedGroupId = signal<string>('');
  public selectedSession = signal<AttendanceSessionType | null>(null);

  public groupsResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
    }),
    stream: ({ params }) => {
      if (!params.courseId) return of([]);
      return this.#http
        .get<Array<{ id: string; name: string }>>(`/api/v1/class-groups/by-course/${params.courseId}`)
        .pipe(map((r) => r ?? []));
    },
  });

  public sessionsResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
      classGroupId: this.selectedGroupId() || undefined,
      skip: this.pagination.skip(),
      take: this.pagination.take(),
    }),
    stream: ({ params }) => {
      if (!params.courseId) return of([]);
      const q: Record<string, string> = {
        courseId: params.courseId,
        skip: String(params.skip),
        take: String(params.take),
      };
      if (params.classGroupId) {
        q['classGroupId'] = params.classGroupId;
      }
      return forkJoin({
        count: this.#http.get<number>('/api/v1/attendance/sessions/count', { params: q }),
        sessions: this.#http.get<AttendanceSessionType[]>('/api/v1/attendance/sessions', { params: q }),
      }).pipe(
        tap(({ count }) => this.pagination.updateCount(count ?? 0)),
        map(({ sessions }) => sessions ?? []),
      );
    },
  });

  constructor() {
    this.pagination.updateTake(10);
  }

  getStats(session: AttendanceSessionType) {
    const records = session.records;
    return {
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      other: records.filter((r) => ['SICK_LEAVE', 'EXCUSED'].includes(r.status)).length,
    };
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'badge-ghost';
  }

  openForm(session?: AttendanceSessionType) {
    this.#modal
      .open(AttendanceForm, {
        title: session ? 'Editar asistencia' : 'Nueva asistencia',
        size: 'large',
        data: {
          courseId: this.courseId(),
          session,
          groups: this.groupsResource.value(),
        },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.sessionsResource.reload();
        }
      });
  }

  viewSession(session: AttendanceSessionType) {
    this.selectedSession.set(session);
  }

  editSession(session: AttendanceSessionType) {
    this.openForm(session);
  }

  deleteSession(session: AttendanceSessionType) {
    this.#confirmation
      .confirm({
        title: 'Eliminar sesión de asistencia',
        message: '¿Está seguro de eliminar esta sesión de asistencia?',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.#http.delete(`/api/v1/attendance/sessions/${session.id}`).subscribe({
            next: () => {
              this.sessionsResource.reload();
            },
          });
        }
      });
  }
}
