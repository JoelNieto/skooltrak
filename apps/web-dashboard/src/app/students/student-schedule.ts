import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader, StatCard } from '#/ui';

@Component({
  selector: 'app-student-schedule',
  imports: [EmptyState, PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Agenda del estudiante"
      subtitle="Calendario semanal y próximos hitos académicos."
    />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Clases hoy" value="4" helper="Hasta las 14:30" />
      <lib-stat-card
        label="Tareas pendientes"
        value="3"
        helper="2 vencen esta semana"
      />
      <lib-stat-card
        label="Próximos exámenes"
        value="1"
        helper="Matemáticas - viernes"
      />
    </div>

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <h2 class="text-lg font-semibold text-base-content">Horario semanal</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Asignatura</th>
                <th>Aula</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of schedule; track entry.id) {
                <tr>
                  <td>{{ entry.day }}</td>
                  <td>{{ entry.time }}</td>
                  <td>{{ entry.subject }}</td>
                  <td>{{ entry.room }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold text-base-content mb-3">
        Exámenes próximos
      </h2>
      @if (upcomingExams.length === 0) {
        <lib-empty-state
          title="Sin evaluaciones próximas"
          description="Agrega exámenes desde el módulo docente."
          icon="event_busy"
        />
      } @else {
        <div class="grid gap-4 md:grid-cols-2">
          @for (exam of upcomingExams; track exam.id) {
            <div class="card border border-base-200 bg-base-100">
              <div class="card-body">
                <p class="font-semibold text-base-content">{{ exam.title }}</p>
                <p class="text-sm text-base-content/70">
                  {{ exam.date }} · {{ exam.course }}
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
export default class StudentSchedule {
  schedule = [
    {
      id: 'mon-math',
      day: 'Lunes',
      time: '08:00 - 09:30',
      subject: 'Matemáticas',
      room: 'A-101',
    },
    {
      id: 'mon-sci',
      day: 'Lunes',
      time: '10:00 - 11:30',
      subject: 'Ciencias',
      room: 'B-204',
    },
    {
      id: 'tue-lang',
      day: 'Martes',
      time: '09:00 - 10:30',
      subject: 'Lenguaje',
      room: 'A-103',
    },
    {
      id: 'wed-hist',
      day: 'Miércoles',
      time: '11:00 - 12:30',
      subject: 'Historia',
      room: 'C-110',
    },
  ];

  upcomingExams: Array<{ id: string; title: string; date: string; course: string }> =
    [];
}
