import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '@/ui';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-events-calendar',
  imports: [EmptyState, PageHeader, RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/admin">Admin</a></li>
        <li>Eventos</li>
      </ul>
    </div>

    <lib-page-header
      title="Calendario de eventos"
      subtitle="Eventos escolares y fechas importantes."
      actionLabel="Nuevo evento"
      actionIcon="event_available"
    />

    <div class="card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Próximos eventos</h2>
        @if (events.length === 0) {
          <lib-empty-state
            title="Sin eventos próximos"
            description="Agrega fechas institucionales y reuniones."
            icon="event_busy"
          />
        } @else {
          <div class="space-y-3">
            @for (event of events; track event.id) {
              <div class="border border-base-200 rounded-lg p-4">
                <p class="font-semibold text-base-content">{{ event.title }}</p>
                <p class="text-sm text-base-content/70">
                  {{ event.date }} · {{ event.location }}
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventsCalendar {
  events: Array<{ id: string; title: string; date: string; location: string }> =
    [];
}
