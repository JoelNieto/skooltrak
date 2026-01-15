import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader, StatCard } from '@/ui';

@Component({
  selector: 'app-parent-portal',
  imports: [EmptyState, PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Portal de padres"
      subtitle="Resumen rápido del progreso de tus hijos."
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Promedio general" value="8.7" helper="Último mes" />
      <lib-stat-card label="Asistencias" value="95%" helper="Últimas 4 semanas" />
      <lib-stat-card label="Alertas" value="2" helper="Pendientes de revisar" />
    </div>

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">
          Hijos vinculados
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          @for (child of children; track child.id) {
            <div class="border border-base-200 rounded-lg p-4">
              <p class="font-semibold text-base-content">{{ child.name }}</p>
              <p class="text-sm text-base-content/70">
                {{ child.grade }} · {{ child.group }}
              </p>
              <p class="text-sm text-base-content/70">
                Última nota: {{ child.lastGrade }}
              </p>
            </div>
          }
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">
        Comunicados recientes
      </h2>
      @if (announcements.length === 0) {
        <lib-empty-state
          title="Sin comunicados nuevos"
          description="Los avisos importantes aparecerán aquí."
          icon="campaign"
        />
      } @else {
        <div class="space-y-3">
          @for (announcement of announcements; track announcement.id) {
            <div class="card border border-base-200 bg-base-100">
              <div class="card-body">
                <p class="font-semibold text-base-content">
                  {{ announcement.title }}
                </p>
                <p class="text-sm text-base-content/70">
                  {{ announcement.summary }}
                </p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ParentPortal {
  children = [
    {
      id: 'child-1',
      name: 'Camila Pérez',
      grade: '7°',
      group: 'B',
      lastGrade: '9.0 en Ciencias',
    },
    {
      id: 'child-2',
      name: 'Mateo Pérez',
      grade: '5°',
      group: 'A',
      lastGrade: '8.4 en Lenguaje',
    },
  ];

  announcements: Array<{ id: string; title: string; summary: string }> = [];
}
