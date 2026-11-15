import { Badge, Card, CardBody, EmptyState, PageHeader, UiTable } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-parent-management',
  imports: [UiTable, Badge, Card, CardBody, EmptyState, PageHeader],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Admin', link: '/admin' }, { label: 'Padres' }]"
      title="Gestión de padres"
      subtitle="Crea cuentas y vincula estudiantes."
      actionLabel="Invitar padre"
      actionIcon="person_add"
    />

    <div uiCard>
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-ink-strong">Directorio</h2>
        <div class="overflow-x-auto">
          <table uiTable>
            <thead>
              <tr>
                <th>Padre/Madre</th>
                <th>Estudiantes vinculados</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (parent of parents; track parent.id) {
                <tr>
                  <td>{{ parent.name }}</td>
                  <td>{{ parent.children }}</td>
                  <td>
                    <span uiBadge tone="success">Activo</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-ink-strong mb-3">Invitaciones pendientes</h2>
      @if (pendingInvites.length === 0) {
        <lib-empty-state
          title="Sin invitaciones pendientes"
          description="Envía una invitación para vincular un padre."
          icon="mail"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-ink-muted">
          @for (invite of pendingInvites; track invite.id) {
            <li>{{ invite.label }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class ParentManagement {
  parents = [
    {
      id: 'parent-1',
      name: 'Ana Torres',
      children: 'Camila Pérez',
    },
    {
      id: 'parent-2',
      name: 'Luis García',
      children: 'Juan Pérez, Mateo Pérez',
    },
  ];

  pendingInvites: Array<{ id: string; label: string }> = [];
}
