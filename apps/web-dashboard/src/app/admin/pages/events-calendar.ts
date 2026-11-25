import { Button, Card, CardBody, EmptyState, Icon } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-events-calendar',
  imports: [Card, CardBody, EmptyState, Button, Icon],
  template: `
    <div class="mb-4 flex justify-end">
      <button uiButton variant="primary" type="button"><ui-icon name="calendar-check" /> Nuevo evento</button>
    </div>

    <div uiCard>
      <div uiCardBody>
        <h2 class="text-lg font-semibold text-ink-strong">Próximos eventos</h2>
        @if (events.length === 0) {
          <lib-empty-state
            title="Sin eventos próximos"
            description="Agrega fechas institucionales y reuniones."
            icon="calendar-x"
          />
        } @else {
          <div class="space-y-3">
            @for (event of events; track event.id) {
              <div class="border border-line rounded-lg p-4">
                <p class="font-semibold text-ink-strong">{{ event.title }}</p>
                <p class="text-sm text-ink-muted">{{ event.date }} · {{ event.location }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export default class EventsCalendar {
  events: Array<{ id: string; title: string; date: string; location: string }> = [];
}
