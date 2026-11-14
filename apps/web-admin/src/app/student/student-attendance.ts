import { Badge, BadgeTone, Card, CardBody, EmptyState, PageHeader, StatCard } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-student-attendance',
  imports: [Badge, Card, CardBody, EmptyState, PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Asistencia del estudiante"
      subtitle="Resumen de asistencia por curso y sesiones recientes."
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Asistencias" value="42" helper="Últimos 60 días" />
      <lib-stat-card label="Tardanzas" value="3" helper="Objetivo ≤ 5" />
      <lib-stat-card label="Faltas" value="1" helper="Justificada" />
    </div>

    <div uiCard class="mt-6">
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-base-content">Registro reciente</h2>
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
              @for (entry of attendance; track entry.id) {
                <tr>
                  <td>{{ entry.date }}</td>
                  <td>{{ entry.course }}</td>
                  <td>
                    <span uiBadge [tone]="entry.tone">
                      {{ entry.status }}
                    </span>
                  </td>
                  <td class="text-sm text-base-content/70">
                    {{ entry.note }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">Justificaciones pendientes</h2>
      @if (pendingJustifications.length === 0) {
        <lib-empty-state
          title="Sin justificaciones pendientes"
          description="Puedes subir justificativos desde aquí si es necesario."
          icon="check_circle"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (item of pendingJustifications; track item.id) {
            <li>{{ item.label }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class StudentAttendance {
  attendance: { id: string; date: string; course: string; status: string; tone: BadgeTone; note: string }[] = [
    {
      id: 'att-1',
      date: 'Mar 12',
      course: 'Matemáticas',
      status: 'Presente',
      tone: 'success',
      note: 'Sin observaciones',
    },
    {
      id: 'att-2',
      date: 'Mar 11',
      course: 'Historia',
      status: 'Tarde',
      tone: 'warning',
      note: 'Llegó 10 min tarde',
    },
    {
      id: 'att-3',
      date: 'Mar 10',
      course: 'Ciencias',
      status: 'Falta',
      tone: 'danger',
      note: 'Justificada por médico',
    },
  ];

  pendingJustifications: Array<{ id: string; label: string }> = [];
}
