import { Badge, EmptyState, Icon, UiInputGroup } from '#/ui';
import { Component, computed, input, signal } from '@angular/core';

/** `GET /api/v1/courses/:id/participants` (ACA-001-S08, FR .15). */
export interface CourseParticipants {
  teachers: { id: string; name: string; initials: string; color: string | null; roles: string[] }[];
  students: { id: string; name: string; initials: string }[];
  count: number;
}

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * *Participantes* (ACA-001 FR .15): the course's teachers, labelled *Docente* / *Docente consejero*,
 * and its students, names and initials only (BR .13), with a name search. Parents get teachers only.
 */
@Component({
  selector: 'app-course-participants',
  imports: [Badge, EmptyState, Icon, UiInputGroup],
  template: `
    <label uiInputGroup class="mb-4 w-72!">
      <ui-icon name="search" />
      <input
        type="search"
        placeholder="Buscar por nombre"
        aria-label="Buscar participante"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
    </label>

    <section aria-labelledby="participants-teachers" class="mb-6">
      <h3 id="participants-teachers" class="mb-2 text-sm font-semibold text-ink-strong">Docentes</h3>
      <ul class="flex flex-col">
        @for (teacher of teachers(); track teacher.id) {
          <li class="flex items-center gap-3 border-t border-line py-2 first:border-t-0">
            <div class="avatar avatar-placeholder" aria-hidden="true">
              <div class="w-8 rounded-full text-white" [style.background]="teacher.color ?? 'var(--ui-ink-subtle)'">
                <span class="text-xs">{{ teacher.initials }}</span>
              </div>
            </div>
            <span class="flex-1 text-sm text-ink-strong">{{ teacher.name }}</span>
            @for (role of teacher.roles; track role) {
              <span uiBadge size="sm" [tone]="role === 'Docente consejero' ? 'info' : 'neutral'">{{ role }}</span>
            }
          </li>
        } @empty {
          <li class="text-sm text-ink-muted">
            {{ query() ? 'Ningún docente coincide.' : 'No hay docente asignado.' }}
          </li>
        }
      </ul>
    </section>

    @if (data().students.length) {
      <section aria-labelledby="participants-students">
        <h3 id="participants-students" class="mb-2 text-sm font-semibold text-ink-strong">
          Estudiantes <span class="font-normal text-ink-muted">· {{ data().students.length }}</span>
        </h3>
        <ul class="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (student of students(); track student.id) {
            <li class="flex items-center gap-3 border-t border-line py-2">
              <div class="avatar avatar-placeholder" aria-hidden="true">
                <div class="w-8 rounded-full bg-surface-2 text-ink">
                  <span class="text-xs">{{ student.initials }}</span>
                </div>
              </div>
              <span class="text-sm text-ink">{{ student.name }}</span>
            </li>
          } @empty {
            <li class="col-span-full text-sm text-ink-muted">Ningún estudiante coincide con la búsqueda.</li>
          }
        </ul>
      </section>
    } @else if (!data().teachers.length) {
      <lib-empty-state title="Sin participantes" description="Este curso aún no tiene participantes." icon="users" />
    }
  `,
})
export class CourseParticipantsList {
  readonly data = input.required<CourseParticipants>();
  protected readonly query = signal('');

  protected readonly teachers = computed(() =>
    this.data().teachers.filter((t) => fold(t.name).includes(fold(this.query().trim()))),
  );
  protected readonly students = computed(() =>
    this.data().students.filter((s) => fold(s.name).includes(fold(this.query().trim()))),
  );
}
