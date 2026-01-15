import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '@/ui';

@Component({
  selector: 'app-teacher-parent-communication',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Comunicación con padres"
      subtitle="Canales activos y mensajes pendientes."
      actionLabel="Nuevo mensaje"
      actionIcon="mail"
    />

    <div class="space-y-3">
      @for (thread of threads; track thread.id) {
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-base-content">{{ thread.parent }}</p>
              <span class="text-xs text-base-content/60">
                {{ thread.lastMessage }}
              </span>
            </div>
            <p class="text-sm text-base-content/70">{{ thread.summary }}</p>
          </div>
        </div>
      }
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">
        Respuestas pendientes
      </h2>
      @if (pendingReplies.length === 0) {
        <lib-empty-state
          title="Sin respuestas pendientes"
          description="Cuando un padre responda verás la alerta aquí."
          icon="mark_email_read"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (item of pendingReplies; track item.id) {
            <li>{{ item.label }}</li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherParentCommunication {
  threads = [
    {
      id: 'thr-1',
      parent: 'Ana Torres (Madre de Camila)',
      summary: 'Seguimiento de progreso en matemáticas.',
      lastMessage: 'Hoy 09:20',
    },
    {
      id: 'thr-2',
      parent: 'Luis García (Padre de Juan)',
      summary: 'Solicitud de reunión para revisar tareas.',
      lastMessage: 'Ayer',
    },
  ];

  pendingReplies: Array<{ id: string; label: string }> = [];
}
