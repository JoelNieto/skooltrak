import { Card, CardBody, PageHeader, StatCard, UiTable } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-attendance-reporting',
  imports: [UiTable, Card, CardBody, PageHeader, StatCard],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Admin', link: '/admin' }, { label: 'Asistencia' }]"
      title="Reporte de asistencia"
      subtitle="Indicadores generales por curso y nivel."
      actionLabel="Exportar"
      actionIcon="download"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Asistencia global" value="94%" helper="Últimos 30 días" />
      <lib-stat-card label="Cursos críticos" value="2" helper="Menos de 85%" />
      <lib-stat-card label="Alertas activas" value="5" helper="Pendientes" />
    </div>

    <div uiCard class="mt-6">
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-ink-strong">Resumen por curso</h2>
        <div class="overflow-x-auto">
          <table uiTable>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Asistencia</th>
                <th>Faltas</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              @for (row of courseAttendance; track row.id) {
                <tr>
                  <td>{{ row.course }}</td>
                  <td>{{ row.attendance }}</td>
                  <td>{{ row.absences }}</td>
                  <td class="text-sm text-ink-muted">{{ row.note }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export default class AttendanceReporting {
  courseAttendance = [
    {
      id: 'course-1',
      course: '2°B',
      attendance: '92%',
      absences: '18',
      note: 'Seguimiento de estudiantes con faltas reiteradas.',
    },
    {
      id: 'course-2',
      course: '3°A',
      attendance: '96%',
      absences: '10',
      note: 'Sin alertas críticas.',
    },
    {
      id: 'course-3',
      course: '1°C',
      attendance: '88%',
      absences: '24',
      note: 'Requiere plan de acción.',
    },
  ];
}
