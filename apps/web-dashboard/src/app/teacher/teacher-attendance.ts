import { Badge, BadgeTone, Card, CardBody, EmptyState, PageHeader, StatCard, UiTable } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-teacher-attendance',
  imports: [UiTable, Badge, Card, CardBody, EmptyState, PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Tomar asistencia"
      subtitle="Marca la asistencia de la clase actual."
      actionLabel="Guardar sesión"
      actionIcon="save"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Sección" value="2°B" helper="Matemáticas" />
      <lib-stat-card label="Fecha" value="Mar 14" helper="08:00 - 09:30" />
      <lib-stat-card label="Presentes" value="23/25" helper="Actualizado" />
    </div>

    <div uiCard class="mt-6">
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-ink-strong">Lista de estudiantes</h2>
        @if (roster.length === 0) {
          <lib-empty-state
            title="Sin estudiantes asignados"
            description="Cuando se asignen estudiantes aparecerán aquí."
            icon="users"
          />
        } @else {
          <div class="overflow-x-auto">
            <table uiTable>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                @for (student of roster; track student.id) {
                  <tr>
                    <td>{{ student.name }}</td>
                    <td>
                      <span uiBadge [tone]="student.tone">
                        {{ student.status }}
                      </span>
                    </td>
                    <td class="text-sm text-ink-muted">
                      {{ student.note }}
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
})
export default class TeacherAttendance {
  roster: { id: string; name: string; status: string; tone: BadgeTone; note: string }[] = [
    {
      id: 'stu-1',
      name: 'María González',
      status: 'Presente',
      tone: 'success',
      note: '',
    },
    {
      id: 'stu-2',
      name: 'Juan Pérez',
      status: 'Tarde',
      tone: 'warning',
      note: 'Llegó 5 min tarde',
    },
    {
      id: 'stu-3',
      name: 'Camila Ortiz',
      status: 'Falta',
      tone: 'danger',
      note: 'Sin aviso',
    },
  ];
}
