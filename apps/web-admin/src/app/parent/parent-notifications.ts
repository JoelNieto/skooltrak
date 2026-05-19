import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '#/ui';

@Component({
  selector: 'app-parent-notifications',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Notificaciones para padres"
      subtitle="Alertas sobre asistencia, notas y comunicaciones."
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
        Alertas resueltas
      </h2>
      @if (resolved.length === 0) {
        <lib-empty-state
          title="Sin alertas resueltas"
          description="Las alertas revisadas quedarán aquí."
          icon="done_all"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (item of resolved; track item.id) {
            <li>{{ item.title }}</li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ParentNotifications {
  notifications = [
    {
      id: 'alert-1',
      title: 'Ausencia registrada',
      message: 'Camila registró una falta en Ciencias.',
      time: 'Hoy 08:00',
    },
    {
      id: 'alert-2',
      title: 'Nueva calificación',
      message: 'Mateo obtuvo 8.9 en Matemáticas.',
      time: 'Ayer',
    },
    {
      id: 'alert-3',
      title: 'Mensaje del docente',
      message: 'Se recomienda reforzar lectura semanal.',
      time: 'Hace 2 días',
    },
  ];

  resolved: Array<{ id: string; title: string }> = [];
}
