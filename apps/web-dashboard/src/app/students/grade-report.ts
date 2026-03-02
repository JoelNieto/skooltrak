import { Loader } from '@/ui';
import { DecimalPipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { GradeReportDocument, PeriodsByYearForReportDocument } from '../graphql/generated/graphql';
import { map, of } from 'rxjs';
import Store from '../core/store';

interface GradeReportPeriodInfo {
  id: string;
  name: string;
  shortName: string;
}

interface GradeReportGradesRow {
  courseId: string;
  courseName: string;
  periodAverages: (number | null)[];
  cumulativeAverage: number | null;
}

interface GradeReportPeriodAttendance {
  periodId: string;
  absent: number;
  late: number;
}

interface GradeReportAttendanceRow {
  courseId: string;
  courseName: string;
  periodAttendance: GradeReportPeriodAttendance[];
}

interface GradeReportHabitRow {
  metricName: string;
  value: string;
}

interface GradeReportOverallRow {
  periodAverages: (number | null)[];
  cumulativeAverage: number | null;
}

interface GradeReportData {
  schoolName: string;
  schoolLogoUrl: string | null;
  periodName: string;
  studentName: string;
  documentId: string;
  classGroupName: string | null;
  teacherName: string | null;
  studyPlanName: string | null;
  level: number | null;
  periods: GradeReportPeriodInfo[];
  gradesRows: GradeReportGradesRow[];
  overallGradesRow: GradeReportOverallRow | null;
  attendanceRows: GradeReportAttendanceRow[];
  habitRows: GradeReportHabitRow[];
}

@Component({
  selector: 'app-grade-report',
  imports: [DecimalPipe, FormsModule, Loader, RouterLink],
  template: `
    <div class="grade-report-container">
      <div class="flex justify-between items-center mb-4 print:hidden">
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/students">Alumnos</a></li>
            <li><a [routerLink]="['/students', id()]">Estudiante</a></li>
            <li>Boletín de calificaciones</li>
          </ul>
        </div>
        <div class="flex gap-2 items-center">
          <select class="select select-primary w-48" [ngModel]="periodId()" (ngModelChange)="periodId.set($event)">
            <option disabled [ngValue]="''">Selecciona un periodo...</option>
            @for (period of periodsResource.value(); track period.id) {
              <option [ngValue]="period.id">{{ period.name }}</option>
            }
          </select>
          <button class="btn btn-primary" (click)="printReport()">
            <span class="material-symbols-outlined">print</span>
            Imprimir / Descargar PDF
          </button>
        </div>
      </div>

      @if (reportResource.isLoading()) {
        <div class="flex justify-center py-12">
          <lib-loader />
        </div>
      } @else if (reportResource.hasValue() && reportResource.value(); as report) {
        <div class="grade-report-content bg-base-100 rounded-lg p-6 shadow-sm print:shadow-none print:p-2">
          <!-- HEADER: Ministerio + logos -->
          <div class="flex items-start justify-between gap-4 pb-4 mb-6 print:pb-1 print:mb-2">
            <div class="w-36 h-24 shrink-0 print:w-32 print:h-24 flex items-center justify-start">
              @if (report.schoolLogoUrl) {
                <img
                  [src]="report.schoolLogoUrl"
                  alt="Logo del colegio"
                  class="object-contain max-h-24 w-auto print:max-h-18"
                  loading="eager"
                />
              }
            </div>
            <div class="flex-1 text-center min-w-0">
              <h1 class="text-xl font-bold text-base-content mt-2 print:text-sm print:uppercase">
                Ministerio de Educación
              </h1>
              <h2 class="text-xl font-bold text-base-content mt-1 print:text-sm print:uppercase">
                {{ report.schoolName }}
              </h2>
              <h3 class="text-xl font-semibold mt-1 print:text-xs print:uppercase">Boletín de calificaciones</h3>
              <p class="text-base-content/80 mt-1 print:text-xs print:uppercase">{{ report.periodName }}</p>
            </div>
            <div class="w-36 h-24 flex-shrink-0 flex items-center justify-end print:w-32 print:h-24">
              <img
                src="/meduca.svg"
                alt="Logo MEDUCA"
                class="object-contain max-h-16 w-auto print:max-h-10"
                loading="eager"
              />
            </div>
          </div>

          <!-- MAIN INFO -->
          <div
            class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm print:grid-cols-2 print:gap-1 print:mb-2 print:text-[10px] print:uppercase print:border print:border-gray-700 print:p-4"
          >
            <div>
              <span class="font-medium text-base-content/70">Estudiante:</span>
              <span class="ml-2">{{ report.studentName }}</span>
            </div>
            <div>
              <span class="font-medium text-base-content/70">Documento:</span>
              <span class="ml-2">{{ report.documentId }}</span>
            </div>
            <div>
              <span class="font-medium text-base-content/70">Grupo:</span>
              <span class="ml-2">{{ report.classGroupName ?? '-' }}</span>
            </div>
            <div>
              <span class="font-medium text-base-content/70">Profesor:</span>
              <span class="ml-2">{{ report.teacherName ?? '-' }}</span>
            </div>
            <div>
              <span class="font-medium text-base-content/70">Plan de estudio:</span>
              <span class="ml-2">{{ report.studyPlanName ?? '-' }}</span>
            </div>
            <div>
              <span class="font-medium text-base-content/70">Nivel:</span>
              <span class="ml-2">{{ report.level ?? '-' }}</span>
            </div>
          </div>

          <!-- GRADES + ATTENDANCE (side by side) -->
          <div
            class="grades-attendance-grid grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-6 print:grid-cols-[60fr_40fr] print:gap-4 print:mb-2 print:mt-6 mt-6"
          >
            <!-- GRADES TABLE -->
            <section class="grade-table-section">
              <h3 class="text-lg font-semibold mb-3 print:mb-1">Calificaciones</h3>
              <div class="overflow-x-auto grades-table-wrap">
                <table class="table table-sm w-full">
                  <thead>
                    <tr>
                      <th class="min-w-32">Materias</th>
                      @for (period of report.periods; track period.id) {
                        <th class="text-center min-w-16">{{ period.shortName }}</th>
                      }
                      <th class="text-center min-w-24 font-semibold">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of report.gradesRows; track row.courseId) {
                      <tr>
                        <td>{{ row.courseName }}</td>
                        @for (avg of row.periodAverages; track $index) {
                          <td class="text-center">
                            {{ avg !== null ? (avg | number: '1.1-1') : '-' }}
                          </td>
                        }
                        <td class="text-center font-semibold">
                          {{ row.cumulativeAverage !== null ? (row.cumulativeAverage | number: '1.1-1') : '-' }}
                        </td>
                      </tr>
                    }
                    @if (report.overallGradesRow) {
                      <tr class="bg-base-200 font-semibold">
                        <td class="uppercase font-bold">Promedio general</td>
                        @for (avg of report.overallGradesRow.periodAverages; track $index) {
                          <td class="text-center">
                            {{ avg !== null ? (avg | number: '1.1-1') : '-' }}
                          </td>
                        }
                        <td class="text-center">
                          {{
                            report.overallGradesRow.cumulativeAverage !== null
                              ? (report.overallGradesRow.cumulativeAverage | number: '1.1-1')
                              : '-'
                          }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <!-- ATTENDANCE TABLE (no course column - rows align with grades by index) -->
            <section>
              <h3 class="text-lg font-semibold mb-3 print:mb-1">Asistencia</h3>
              <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr>
                      @for (period of report.periods; track period.id) {
                        <th class="text-center min-w-10 border-l border-base-300 first:border-l-0" title="Faltas">F</th>
                        <th class="text-center min-w-10" title="Tardanzas">T</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of report.attendanceRows; track row.courseId) {
                      <tr>
                        @for (pa of row.periodAttendance; track pa.periodId) {
                          <td class="text-center border-l border-base-300 first:border-l-0">{{ pa.absent }}</td>
                          <td class="text-center">{{ pa.late }}</td>
                        }
                      </tr>
                    }
                    @if (report.overallGradesRow) {
                      <tr class="bg-base-200">
                        @for (period of report.periods; track period.id) {
                          <td colspan="2" class="text-center border-l border-base-300 first:border-l-0">-</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-base-content/60 mt-1 print:text-[9px]">F = Faltas, T = Tardanzas</p>
            </section>
          </div>

          <!-- MERITS (HABITS) -->
          <section class="print:mt-1">
            <h3 class="text-lg font-semibold mb-3 print:text-xs print:mb-1">Méritos (Hábitos)</h3>
            <div class="overflow-x-auto">
              <table class="table table-sm w-full max-w-md">
                <thead>
                  <tr>
                    <th>Criterio</th>
                    <th class="text-center">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of report.habitRows; track row.metricName) {
                    <tr>
                      <td>{{ row.metricName }}</td>
                      <td class="text-center font-medium">{{ row.value }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2" class="text-center text-base-content/60">Sin datos de hábitos</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="text-xs text-base-content/60 mt-2 print:mt-0.5 print:text-[9px]">
              Leyenda: X = Deficiente, R = Regular, S = Satisfactorio
            </p>
          </section>
        </div>
      } @else if (reportResource.error()) {
        <div class="alert alert-error">No se pudo cargar el boletín. Verifica que el periodo esté seleccionado.</div>
      }
    </div>
  `,
  styles: [
    `
      @media print {
        .grade-report-container {
          print-color-adjust: exact;
          width: 100%;
        }
        .grade-report-content {
          box-shadow: none !important;
        }
        .grade-report-content table {
          font-size: 9px !important;
        }
        .grade-report-content th,
        .grade-report-content td {
          padding: 2px 4px !important;
        }
        .grade-report-content section {
          page-break-inside: avoid;
        }
        /* Prevent table overflow from cutting off last column when printing */
        .grade-report-content .overflow-x-auto {
          overflow: visible !important;
        }
        .grade-report-content .overflow-x-auto table {
          width: 100% !important;
        }
        /* Ensure last column (Nota/promedio) is never cut off */
        .grade-report-content .overflow-x-auto th:last-child,
        .grade-report-content .overflow-x-auto td:last-child {
          min-width: 2.5rem !important;
          white-space: nowrap !important;
        }
        .grade-report-content .grade-table-section {
          min-width: 0;
          overflow: visible;
        }
        /* Allow grid columns to shrink so tables fit; reduce period column width for print */
        .grades-attendance-grid {
          overflow: visible !important;
        }
        /* Shrink period columns in grades table for print so Nota column fits */
        .grades-table-wrap th:not(:last-child):not(:first-child),
        .grades-table-wrap td:not(:last-child):not(:first-child) {
          min-width: 1.5rem !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeReport {
  id = input.required<string>();
  #apollo = inject(Apollo);
  #store = inject(Store);

  periodId = signal<string>('');

  periodsResource = rxResource({
    params: () => ({ year: this.#store.currentSchool()?.currentYear }),
    stream: ({ params }) => {
      if (!params.year) return of([]);
      return this.#apollo
        .watchQuery({
          query: PeriodsByYearForReportDocument,
          variables: { year: params.year },
        })
        .valueChanges.pipe(map((r) => r.data?.periodsByYear ?? []));
    },
  });

  private currentPeriodId = computed(() => {
    const periods = this.periodsResource.value();
    if (!periods?.length) return '';
    const today = new Date();
    const current = periods.find((p) => {
      const start = (p as { startDate?: string }).startDate;
      const end = (p as { endDate?: string }).endDate;
      if (!start || !end) return false;
      return new Date(start) <= today && today <= new Date(end);
    });
    return current?.id ?? periods[0]?.id ?? '';
  });

  reportResource = rxResource({
    params: () => ({
      studentId: this.id(),
      periodId: this.periodId(),
    }),
    stream: ({ params }) => {
      const { studentId, periodId } = params;
      if (!studentId || !periodId) return of(null);
      return this.#apollo
        .query({
          query: GradeReportDocument,
          variables: { studentId, periodId },
        })
        .pipe(map((r) => r.data?.gradeReport));
    },
  });

  constructor() {
    afterRenderEffect(() => {
      const id = this.currentPeriodId();
      if (id) this.periodId.set(id);
    });
  }

  printReport() {
    window.print();
  }
}
