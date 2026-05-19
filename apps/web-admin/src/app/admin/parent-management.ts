import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '#/ui';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parent-management',
  imports: [EmptyState, PageHeader, RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Administración</li>
        <li>Padres</li>
      </ul>
    </div>

    <lib-page-header
      title="Gestión de padres"
      subtitle="Crea cuentas y vincula estudiantes."
      actionLabel="Invitar padre"
      actionIcon="person_add"
    />

    <div class="card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Directorio</h2>
        <div class="overflow-x-auto">
          <table class="table">
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
                    <span class="badge badge-success">Activo</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">
        Invitaciones pendientes
      </h2>
      @if (pendingInvites.length === 0) {
        <lib-empty-state
          title="Sin invitaciones pendientes"
          description="Envía una invitación para vincular un padre."
          icon="mail"
        />
      } @else {
        <ul class="list-disc pl-5 text-sm text-base-content/70">
          @for (invite of pendingInvites; track invite.id) {
            <li>{{ invite.label }}</li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
