import { Badge, Card, CardBody, EmptyState, PageHeader, UiTable } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-student-assignment-submission',
  imports: [UiTable, Badge, Card, CardBody, EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Entrega de asignaciones"
      subtitle="Sube tus archivos y revisa el estado de entrega."
      actionLabel="Subir archivo"
      actionIcon="file-up"
    />

    <div uiCard>
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-ink-strong">Pendientes por entregar</h2>
        <div class="overflow-x-auto">
          <table uiTable>
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
                    <span uiBadge tone="warning">Pendiente</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-ink-strong mb-3">Entregas recientes</h2>
      @if (recentSubmissions.length === 0) {
        <lib-empty-state
          title="Sin entregas recientes"
          description="Cuando subas un archivo aparecerá aquí."
          icon="cloud-upload"
        />
      } @else {
        <div class="space-y-3">
          @for (submission of recentSubmissions; track submission.id) {
            <div uiCard>
              <div uiCardBody>
                <p class="font-semibold text-ink-strong">
                  {{ submission.title }}
                </p>
                <p class="text-sm text-ink-muted">{{ submission.course }} · {{ submission.submittedAt }}</p>
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
