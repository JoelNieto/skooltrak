import { EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-parent-teacher-communication',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      title="Comunicación con docentes"
      subtitle="Mensajes directos con el equipo académico."
      actionLabel="Enviar mensaje"
      actionIcon="send"
    />

    <div class="space-y-3">
      @for (thread of threads; track thread.id) {
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-base-content">{{ thread.teacher }}</p>
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
      <h2 class="text-lg font-semibold text-base-content mb-3">Consultas abiertas</h2>
      @if (openRequests.length === 0) {
        <lib-empty-state
          title="Sin consultas abiertas"
          description="Cuando envíes un mensaje nuevo aparecerá aquí."
          icon="question_answer"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (item of openRequests; track item.id) {
            <li>{{ item.label }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class ParentTeacherCommunication {
  threads = [
    {
      id: 'parent-thread-1',
      teacher: 'Prof. Laura Méndez',
      summary: 'Revisión de tareas de Ciencias.',
      lastMessage: 'Hoy 10:05',
    },
    {
      id: 'parent-thread-2',
      teacher: 'Prof. Diego Ruiz',
      summary: 'Consulta sobre evaluación de Lenguaje.',
      lastMessage: 'Ayer',
    },
  ];

  openRequests: Array<{ id: string; label: string }> = [];
}
