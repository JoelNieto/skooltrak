import { Loader, PageHeader, StatCard } from '#/ui';
import { DatePipe, NgClass } from '@angular/common';
import { httpResource, HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { isValidId } from '../core/validators';
import Store from '../core/store';

type AttendanceRecordType = {
  id: string;
  status: string;
  comment: string | null;
  attendanceSession: {
    id: string;
    date: string;
    course: {
      id: string;
      name: string;
      subject: { name: string };
    };
    classGroup: { id: string; name: string };
  };
};

type AttendanceStatsType = {
  total: number;
  present: number;
  absent: number;
  late: number;
  sickLeave: number;
  excused: number;
  presentPercentage: number;
  absentPercentage: number;
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
  selector: 'app-student-attendance',
  imports: [Loader, PageHeader, StatCard, DatePipe, NgClass],
  template: `
    <lib-page-header title="Mi Asistencia" subtitle="Resumen de asistencia por curso y sesiones recientes." />

    @if (statsResource.isLoading()) {
      <div class="flex justify-center py-8">
        <lib-loader />
      </div>
    }

    @if (statsResource.hasValue()) {
      @let stats = statsResource.value()!;
      <div class="grid gap-4 md:grid-cols-4">
        <lib-stat-card
          label="Asistencias"
          [value]="stats.present.toString()"
          [helper]="stats.presentPercentage + '% del total'"
        />
        <lib-stat-card label="Tardanzas" [value]="stats.late.toString()" helper="Procura llegar a tiempo" />
        <lib-stat-card
          label="Faltas"
          [value]="stats.absent.toString()"
          [helper]="stats.absentPercentage + '% del total'"
        />
        <lib-stat-card label="Permisos" [value]="(stats.sickLeave + stats.excused).toString()" helper="Justificadas" />
      </div>
    }

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Registro reciente</h2>

        @if (recordsResource.isLoading()) {
          <lib-loader />
        }

        @if (recordsResource.hasValue()) {
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Curso</th>
                  <th>Estado</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                @for (record of recordsResource.value(); track record.id) {
                  <tr class="hover">
                    <td>
                      @if (record.attendanceSession) {
                        {{ record.attendanceSession.date | date: 'fullDate' }}
                      } @else {
                        -
                      }
                    </td>
                    <td>{{ record.attendanceSession?.course?.subject?.name ?? '-' }}</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusColor(record.status)">
                        {{ getStatusLabel(record.status) }}
                      </span>
                    </td>
                    <td class="text-sm text-base-content/70">
                      {{ record.comment || '-' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="text-center py-8 text-base-content/60">No hay registros de asistencia</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentAttendance {
  #http = inject(HttpClient);
  #store = inject(Store);

  public statsResource = httpResource<AttendanceStatsType | null>(() => {
    const studentId = this.#store.currentStudentId();
    return isValidId(studentId) ? `/api/v1/attendance/stats/by-student/${studentId}` : undefined;
  });

  public recordsResource = httpResource<AttendanceRecordType[]>(
    () => {
      const studentId = this.#store.currentStudentId();
      if (!isValidId(studentId)) return undefined;
      return { url: `/api/v1/attendance/records/by-student/${studentId}`, params: { take: '50' } };
    },
    { defaultValue: [] },
  );

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'badge-ghost';
  }
}
