import { Badge, Icon } from '#/ui';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseWork, CourseWorkItem, workDate, workPill, WORK_TYPES } from './course-work';

/**
 * *Resumen* for students and parents (ACA-001 FR .12): the grade summary (projected), the next 3 items
 * of work and the course's teacher.
 */
@Component({
  selector: 'app-course-overview',
  imports: [Badge, Icon, RouterLink],
  template: `
    <section aria-label="Resumen de calificaciones" class="mb-6">
      <!-- FR .12: the grade summary from FR .14, without the table. -->
      <ng-content />
    </section>
    <div class="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section aria-labelledby="overview-next">
        <div class="mb-2 flex items-center justify-between">
          <h3 id="overview-next" class="text-sm font-semibold text-ink-strong">Próximas entregas</h3>
          <button type="button" class="link link-primary text-sm" (click)="seeAll.emit()">Ver todas</button>
        </div>
        @if (next().length) {
          <ul class="flex flex-col">
            @for (item of next(); track item.assignmentId + item.dueAt) {
              <li class="border-t border-line first:border-t-0">
                <a
                  [routerLink]="['/assignments', item.assignmentId]"
                  class="flex items-center gap-3 py-2.5 hover:bg-surface-2"
                >
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
          <p class="text-sm text-ink-muted">Nada pendiente.</p>
        }
      </section>
      <section aria-labelledby="overview-teachers">
        <h3 id="overview-teachers" class="mb-2 text-sm font-semibold text-ink-strong">Docente</h3>
        @if (teacher(); as t) {
          <div class="flex items-center gap-2 text-sm text-ink">
            <div class="avatar avatar-placeholder" aria-hidden="true">
              <div class="w-8 rounded-full text-white" [style.background]="t.color">
                <span class="text-xs">{{ t.initials }}</span>
              </div>
            </div>
            {{ t.name }}
          </div>
        } @else {
          <p class="text-sm text-ink-muted">No hay docente asignado.</p>
        }
      </section>
    </div>
  `,
})
export class CourseOverview {
  readonly work = input.required<CourseWork>();
  readonly teacher = input<{ name: string; initials: string; color: string } | null>(null);
  /** Opens the *Asignaciones* tab. */
  readonly seeAll = output<void>();

  /** FR .12: the next 3 items, overdue first. */
  protected readonly next = computed(() => {
    const work = this.work();
    const overdue = work.past.filter((i) => i.status === 'VENCIDA').reverse();
    return [...overdue, ...work.upcoming].slice(0, 3);
  });

  protected type(item: CourseWorkItem) {
    return WORK_TYPES[item.type] ?? WORK_TYPES.NEW;
  }
  protected pill = workPill;
  protected date(item: CourseWorkItem) {
    return workDate(item, this.work().timezone);
  }
}
