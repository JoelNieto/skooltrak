import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader, StatCard } from '#/ui';

@Component({
  selector: 'app-teacher-gradebook',
  imports: [EmptyState, PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Libro de calificaciones"
      subtitle="Vista consolidada de notas por estudiante."
      actionLabel="Exportar CSV"
      actionIcon="download"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Promedio curso" value="8.6" helper="Último corte" />
      <lib-stat-card label="Evaluaciones" value="3" helper="Activas" />
      <lib-stat-card label="Estudiantes" value="25" helper="2°B" />
    </div>

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">
          Calificaciones recientes
        </h2>
        @if (grades.length === 0) {
          <lib-empty-state
            title="Sin calificaciones registradas"
            description="Registra una evaluación para ver resultados."
            icon="assignment"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Evaluación</th>
                  <th>Nota</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                @for (grade of grades; track grade.id) {
                  <tr>
                    <td>{{ grade.student }}</td>
                    <td>{{ grade.assessment }}</td>
                    <td>{{ grade.score }}</td>
                    <td class="text-sm text-base-content/70">
                      {{ grade.note }}
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
export default class TeacherGradebook {
  grades = [
    {
      id: 'grade-1',
      student: 'María González',
      assessment: 'Prueba 1',
      score: '9.4',
      note: 'Mejora en ejercicios prácticos',
    },
    {
      id: 'grade-2',
      student: 'Juan Pérez',
      assessment: 'Prueba 1',
      score: '7.8',
      note: 'Reforzar lectura de problemas',
    },
    {
      id: 'grade-3',
      student: 'Camila Ortiz',
      assessment: 'Prueba 1',
      score: '8.9',
      note: 'Buen desempeño',
    },
  ];
}
