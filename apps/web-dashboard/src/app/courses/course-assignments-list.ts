import { Badge, EmptyState, Icon } from '#/ui';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseWork, CourseWorkItem, workDate, workPill, WORK_TYPES } from './course-work';

/**
 * *Asignaciones* for students and parents (ACA-001 FR .13): *Próximas* (soonest first) and
 * *Pasadas* (most recent first), each row with its type, date and status pill (BR .6).
 */
@Component({
  selector: 'app-course-assignments-list',
  imports: [Badge, EmptyState, Icon, RouterLink],
  template: `
    @for (section of sections(); track section.title) {
      <section class="mb-6 last:mb-0" [attr.aria-labelledby]="section.id">
        <h3 [id]="section.id" class="mb-2 text-sm font-semibold text-ink-strong">{{ section.title }}</h3>
        @if (section.items.length) {
          <ul class="flex flex-col">
            @for (item of section.items; track item.assignmentId + item.dueAt) {
              <li class="border-t border-line first:border-t-0">
                <a [routerLink]="['/assignments', item.assignmentId]" class="flex items-center gap-3 py-2.5 hover:bg-surface-2">
                  <ui-icon [name]="type(item).icon" class="text-xl text-ink-muted" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium text-ink-strong">{{ item.title }}</span>
                    <span class="block text-xs text-ink-muted">{{ type(item).label }} · {{ date(item) }}</span>
                  </span>
                  <span uiBadge size="sm" [tone]="pill(item).tone">{{ pill(item).label }}</span>
                </a>
              </li>
            }
          </ul>
        } @else {
          <p class="text-sm text-ink-muted">{{ section.empty }}</p>
        }
      </section>
    } @empty {
      <lib-empty-state title="Sin asignaciones" description="Aún no hay asignaciones en este curso." icon="clipboard-list" />
    }
  `,
})
export class CourseAssignmentsList {
  readonly work = input.required<CourseWork>();

  protected sections() {
    const work = this.work();
    if (!work.upcoming.length && !work.past.length) return [];
    return [
      { id: 'work-upcoming', title: 'Próximas', items: work.upcoming, empty: 'Nada próximo.' },
      { id: 'work-past', title: 'Pasadas', items: work.past, empty: 'Aún no hay asignaciones pasadas.' },
    ];
  }

  protected type(item: CourseWorkItem) {
    return WORK_TYPES[item.type] ?? WORK_TYPES.NEW;
  }
  protected pill = workPill;
  protected date(item: CourseWorkItem) {
    return workDate(item, this.work().timezone);
  }
}
