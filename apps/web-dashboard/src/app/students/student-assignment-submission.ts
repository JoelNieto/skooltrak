import { EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-student-assignment-submission',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Entrega de asignaciones"
      subtitle="Sube tus archivos y revisa el estado de entrega."
      actionLabel="Subir archivo"
      actionIcon="upload_file"
    />

    <div class="card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Pendientes por entregar</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Asignación</th>
                <th>Curso</th>
                <th>Fecha límite</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (item of pendingAssignments; track item.id) {
                <tr>
                  <td>{{ item.title }}</td>
                  <td>{{ item.course }}</td>
                  <td>{{ item.dueDate }}</td>
                  <td>
                    <span class="badge badge-warning">Pendiente</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">Entregas recientes</h2>
      @if (recentSubmissions.length === 0) {
        <lib-empty-state
          title="Sin entregas recientes"
          description="Cuando subas un archivo aparecerá aquí."
          icon="cloud_upload"
        />
      } @else {
        <div class="space-y-3">
          @for (submission of recentSubmissions; track submission.id) {
            <div class="card border border-base-200 bg-base-100">
              <div class="card-body">
                <p class="font-semibold text-base-content">
                  {{ submission.title }}
                </p>
                <p class="text-sm text-base-content/70">{{ submission.course }} · {{ submission.submittedAt }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export default class StudentAssignmentSubmission {
  pendingAssignments = [
    {
      id: 'math-lab',
      title: 'Informe de laboratorio 2',
      course: 'Ciencias',
      dueDate: 'Mar 18',
    },
    {
      id: 'lang-essay',
      title: 'Ensayo de lectura',
      course: 'Lenguaje',
      dueDate: 'Jue 20',
    },
  ];

  recentSubmissions: Array<{
    id: string;
    title: string;
    course: string;
    submittedAt: string;
  }> = [];
}
