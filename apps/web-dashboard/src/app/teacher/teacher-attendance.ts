import { EmptyState, PageHeader, StatCard } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-teacher-attendance',
  imports: [EmptyState, PageHeader, StatCard],
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

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Lista de estudiantes</h2>
        @if (roster.length === 0) {
          <lib-empty-state
            title="Sin estudiantes asignados"
            description="Cuando se asignen estudiantes aparecerán aquí."
            icon="group"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="table">
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
                      <span class="badge" [class]="student.badgeClass">
                        {{ student.status }}
                      </span>
                    </td>
                    <td class="text-sm text-base-content/70">
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
  roster = [
    {
      id: 'stu-1',
      name: 'María González',
      status: 'Presente',
      badgeClass: 'badge-success',
      note: '',
    },
    {
      id: 'stu-2',
      name: 'Juan Pérez',
      status: 'Tarde',
      badgeClass: 'badge-warning',
      note: 'Llegó 5 min tarde',
    },
    {
      id: 'stu-3',
      name: 'Camila Ortiz',
      status: 'Falta',
      badgeClass: 'badge-error',
      note: 'Sin aviso',
    },
  ];
}
