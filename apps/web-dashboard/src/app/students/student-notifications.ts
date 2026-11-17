import { Card, CardBody, EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-student-notifications',
  imports: [Card, CardBody, EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Notificaciones del estudiante"
      subtitle="Alertas recientes sobre notas, mensajes y tareas."
    />

    <div class="space-y-3">
      @for (notification of notifications; track notification.id) {
        <div uiCard>
          <div uiCardBody>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-ink-strong">
                {{ notification.title }}
              </p>
              <span class="text-xs text-ink-muted">
                {{ notification.time }}
              </span>
            </div>
            <p class="text-sm text-ink-muted">
              {{ notification.message }}
            </p>
          </div>
        </div>
      }
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-ink-strong mb-3">Notificaciones archivadas</h2>
      @if (archived.length === 0) {
        <lib-empty-state
          title="Sin notificaciones archivadas"
          description="Aquí aparecerán las notificaciones que marques como leídas."
          icon="notifications_off"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-ink-muted">
          @for (item of archived; track item.id) {
            <li>{{ item.title }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class StudentNotifications {
  notifications = [
    {
      id: 'grade-update',
      title: 'Nueva calificación publicada',
      message: 'Ciencias: 9.2 en el informe de laboratorio.',
      time: 'Hace 2 horas',
    },
    {
      id: 'message',
      title: 'Mensaje del docente',
      message: 'Recuerda repasar el tema de fracciones.',
      time: 'Ayer',
    },
    {
      id: 'assignment',
      title: 'Tarea próxima a vencer',
      message: 'Ensayo de lectura vence el jueves.',
      time: 'Hace 3 días',
    },
  ];

  archived: Array<{ id: string; title: string }> = [];
}
