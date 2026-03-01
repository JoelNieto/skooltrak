import { Loader, StatCard } from '@/ui';
import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { isValidId } from '../core/validators';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';

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
  selector: 'app-student-attendance-report',
  imports: [Loader, StatCard, DatePipe, NgClass],
  template: `
    @if (statsResource.isLoading()) {
      <div class="flex justify-center py-8">
        <lib-loader />
      </div>
    }

    @if (statsResource.hasValue()) {
      @let stats = statsResource.value()!;
      <div class="grid gap-4 md:grid-cols-4 mb-6">
        <lib-stat-card
          label="Asistencias"
          [value]="stats.present.toString()"
          [helper]="stats.presentPercentage + '% del total'"
        />
        <lib-stat-card
          label="Tardanzas"
          [value]="stats.late.toString()"
          helper="Total acumulado"
        />
        <lib-stat-card
          label="Faltas"
          [value]="stats.absent.toString()"
          [helper]="stats.absentPercentage + '% del total'"
        />
        <lib-stat-card
          label="Permisos"
          [value]="(stats.sickLeave + stats.excused).toString()"
          helper="Justificadas"
        />
      </div>
    }

    <div class="card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">
          Historial de asistencia
        </h2>

        @if (recordsResource.isLoading()) {
          <lib-loader />
        }

        @if (recordsResource.hasValue()) {
          <div class="overflow-x-auto">
            <table class="table table-zebra">
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
                    <td>{{ record.attendanceSession.date | date: 'fullDate' }}</td>
                    <td>{{ record.attendanceSession.course.subject.name }}</td>
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
                    <td colspan="4" class="text-center py-8 text-base-content/60">
                      No hay registros de asistencia para este estudiante
                    </td>
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
export default class StudentAttendanceReport {
  public studentId = input.required<string>();

  #apollo = inject(Apollo);

  public statsResource = rxResource({
    params: () => ({
      studentId: this.studentId(),
    }),
    stream: ({ params }) => {
      if (!isValidId(params.studentId)) return of(null);
      return this.#apollo
        .query<{ studentAttendanceStats: AttendanceStatsType }>({
          query: gql`
            query StudentAttendanceStats($studentId: String!) {
              studentAttendanceStats(studentId: $studentId) {
                total
                present
                absent
                late
                sickLeave
                excused
                presentPercentage
                absentPercentage
              }
            }
          `,
          variables: { studentId: params.studentId },
        })
        .pipe(map((r) => r.data?.studentAttendanceStats));
    },
  });

  public recordsResource = rxResource({
    params: () => ({
      studentId: this.studentId(),
    }),
    stream: ({ params }) => {
      if (!isValidId(params.studentId)) return of([]);
      return this.#apollo
        .query<{ attendanceRecordsByStudentId: AttendanceRecordType[] }>({
          query: gql`
            query AttendanceRecordsByStudentId($studentId: String!) {
              attendanceRecordsByStudentId(studentId: $studentId, take: 100) {
                id
                status
                comment
                attendanceSession {
                  id
                  date
                  course {
                    id
                    name
                    subject {
                      name
                    }
                  }
                  classGroup {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: { studentId: params.studentId },
        })
        .pipe(map((r) => r.data?.attendanceRecordsByStudentId ?? []));
    },
  });

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'badge-ghost';
  }
}
