import { PageHeader, StatCard } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-parent-child-progress',
  imports: [PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Progreso del estudiante"
      subtitle="Detalle de calificaciones y asistencia."
      actionLabel="Descargar reporte"
      actionIcon="download"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Promedio" value="8.8" helper="Último corte" />
      <lib-stat-card label="Asistencia" value="96%" helper="Mensual" />
      <lib-stat-card label="Metas cumplidas" value="4/5" helper="Semanal" />
    </div>

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Calificaciones por materia</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Nota</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              @for (item of progress; track item.id) {
                <tr>
                  <td>{{ item.subject }}</td>
                  <td>{{ item.score }}</td>
                  <td class="text-sm text-base-content/70">{{ item.note }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export default class ParentChildProgress {
  progress = [
    {
      id: 'progress-1',
      subject: 'Matemáticas',
      score: '9.1',
      note: 'Muy buen avance en resolución de problemas.',
    },
    {
      id: 'progress-2',
      subject: 'Lenguaje',
      score: '8.5',
      note: 'Reforzar comprensión lectora.',
    },
    {
      id: 'progress-3',
      subject: 'Ciencias',
      score: '9.0',
      note: 'Participación activa en clase.',
    },
  ];
}
