import { EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-teacher-reports',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Reportes docentes"
      subtitle="Genera y exporta informes de rendimiento."
      actionLabel="Generar reporte"
      actionIcon="description"
    />

    <div class="grid gap-4 md:grid-cols-3">
      @for (report of reportTypes; track report.id) {
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
            <p class="font-semibold text-base-content">{{ report.title }}</p>
            <p class="text-sm text-base-content/70">
              {{ report.description }}
            </p>
          </div>
        </div>
      }
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">Historial de reportes</h2>
      @if (reportHistory.length === 0) {
        <lib-empty-state
          title="Sin reportes generados"
          description="Los reportes exportados aparecerán aquí."
          icon="insert_drive_file"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (entry of reportHistory; track entry.id) {
            <li>{{ entry.label }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class TeacherReports {
  reportTypes = [
    {
      id: 'progress',
      title: 'Progreso por estudiante',
      description: 'Comparativo de evaluaciones y asistencia.',
    },
    {
      id: 'course',
      title: 'Resumen de curso',
      description: 'Distribución de notas y participación.',
    },
    {
      id: 'risk',
      title: 'Alumnos en riesgo',
      description: 'Alertas por bajo rendimiento o ausencias.',
    },
  ];

  reportHistory: Array<{ id: string; label: string }> = [];
}
