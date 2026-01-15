import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '@/ui';

@Component({
  selector: 'app-student-notifications',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Notificaciones del estudiante"
      subtitle="Alertas recientes sobre notas, mensajes y tareas."
    />

    <div class="space-y-3">
      @for (notification of notifications; track notification.id) {
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-base-content">
                {{ notification.title }}
              </p>
              <span class="text-xs text-base-content/60">
                {{ notification.time }}
              </span>
            </div>
            <p class="text-sm text-base-content/70">
              {{ notification.message }}
            </p>
          </div>
        </div>
      }
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">
        Notificaciones archivadas
      </h2>
      @if (archived.length === 0) {
        <lib-empty-state
          title="Sin notificaciones archivadas"
          description="Aquí aparecerán las notificaciones que marques como leídas."
          icon="notifications_off"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (item of archived; track item.id) {
            <li>{{ item.title }}</li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
