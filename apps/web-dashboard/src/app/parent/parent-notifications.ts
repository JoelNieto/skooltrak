import { Card, CardBody, EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-parent-notifications',
  imports: [Card, CardBody, EmptyState, PageHeader],
  template: `
    <lib-page-header title="Notificaciones para padres" subtitle="Alertas sobre asistencia, notas y comunicaciones." />

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
      <h2 class="text-lg font-semibold text-ink-strong mb-3">Alertas resueltas</h2>
      @if (resolved.length === 0) {
        <lib-empty-state
          title="Sin alertas resueltas"
          description="Las alertas revisadas quedarán aquí."
          icon="done_all"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-ink-muted">
          @for (item of resolved; track item.id) {
            <li>{{ item.title }}</li>
          }
        </ul>
      }
    </div>
  `,
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
