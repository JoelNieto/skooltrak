import { Button, EmptyState, Icon, Loader, PageHeader } from '#/ui';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ParentContext } from '../parent/parent-context.service';
import { MySchedule, WeekSchedule } from './week-schedule';

type Ref = { id: string; name: string };
/** `GET /api/v1/home/parent/children` (HOM-001 FR .18). */
type ParentChild = { studentId: string; name: string; organizationId: string; classGroup: Ref | null; school: Ref };
type ParentChildren = { defaultStudentId: string | null; children: ParentChild[] };

export type ScheduleAudience = 'student' | 'parent' | 'teacher';

/**
 * The read-only weekly schedule: a student's own group (/student/schedule), the selected child's
 * group for a parent (/parent/schedule) or a teacher's classes in all their groups
 * (/teacher/schedule). The route's `audience` data picks which.
 */
@Component({
  selector: 'app-my-schedule-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, EmptyState, Icon, Loader, PageHeader, WeekSchedule],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <lib-page-header [title]="title()" [subtitle]="subtitle()" />
        @if (schedule.hasValue() && schedule.value()?.slots?.length) {
          <button uiButton type="button" iconOnly aria-label="Imprimir horario" class="print:hidden" (click)="print()">
            <ui-icon name="printer" class="text-lg" />
          </button>
        }
      </div>

      @if (audience() === 'parent' && children().length > 1) {
        <div class="flex flex-wrap gap-2 print:hidden" role="group" aria-label="Elegir hijo">
          @for (child of children(); track child.studentId) {
            <button
              uiButton
              size="sm"
              type="button"
              [variant]="child.studentId === childId() ? 'primary' : 'ghost'"
              [attr.aria-pressed]="child.studentId === childId()"
              (click)="selectChild(child)"
            >
              {{ child.name }}
            </button>
          }
        </div>
      }

      @if (audience() === 'parent' && childrenRes.hasValue() && !children().length) {
        <lib-empty-state
          title="Sin hijos vinculados"
          description="Vincula a tus hijos con su código de matrícula para ver su horario."
          icon="users"
        />
      } @else if (schedule.isLoading() && !schedule.hasValue()) {
        <lib-loader />
      } @else if (schedule.error()) {
        <lib-empty-state
          title="No se pudo cargar el horario"
          description="Intenta de nuevo en unos minutos."
          icon="calendar-x"
        />
      } @else if (schedule.value(); as data) {
        @if (data.kind === 'STUDENT' && !data.group) {
          <lib-empty-state
            title="Sin grupo asignado"
            [description]="
              (audience() === 'parent' ? data.name + ' aún no tiene' : 'Aún no tienes') +
              ' un grupo. El horario aparecerá cuando la escuela lo asigne.'
            "
            icon="calendar-days"
          />
        } @else if (!data.slots.length) {
          <lib-empty-state
            title="Aún no hay horario"
            [description]="
              data.kind === 'TEACHER'
                ? 'Tus clases aparecerán aquí cuando la escuela arme los horarios de tus grupos.'
                : 'Cuando la escuela publique el horario de ' + data.group?.name + ' lo verás aquí.'
            "
            icon="calendar-days"
          />
        } @else {
          <app-week-schedule
            [slots]="data.slots"
            [now]="data.now"
            [perspective]="data.kind === 'TEACHER' ? 'teacher' : 'student'"
          />
        }
      }
    </div>
  `,
})
export default class MySchedulePage {
  /** From the route's data. */
  readonly audience = input<ScheduleAudience>('student');

  #ctx = inject(ParentContext);

  readonly childrenRes = httpResource<ParentChildren>(() =>
    this.audience() === 'parent' ? '/api/v1/home/parent/children' : undefined,
  );
  protected readonly children = computed(() => this.childrenRes.value()?.children ?? []);
  /** The shared switcher's child while still linked, else the parent home's default (BR-HOM-001.9). */
  protected readonly childId = computed(() => {
    const list = this.children();
    const chosen = this.#ctx.selectedChild()?.studentId;
    if (chosen && list.some((c) => c.studentId === chosen)) return chosen;
    return this.childrenRes.value()?.defaultStudentId ?? list[0]?.studentId ?? null;
  });

  readonly schedule = httpResource<MySchedule>(() => {
    if (this.audience() !== 'parent') return { url: '/api/v1/groups-schedules/mine' };
    const studentId = this.childId();
    return studentId ? { url: '/api/v1/groups-schedules/mine', params: { studentId } } : undefined;
  });

  protected readonly title = computed(() => {
    if (this.audience() === 'teacher') return 'Mi horario';
    if (this.audience() === 'parent') {
      const child = this.children().find((c) => c.studentId === this.childId());
      return child ? `Horario de ${child.name.split(' ')[0]}` : 'Horario';
    }
    return 'Mi horario';
  });

  protected readonly subtitle = computed(() => {
    const data = this.schedule.value();
    if (!data) return '';
    if (data.kind === 'TEACHER') {
      const groups = new Set(data.slots.map((s) => s.group.id)).size;
      return `${data.name} · ${data.slots.length} clases en ${groups} grupo${groups === 1 ? '' : 's'} por semana`;
    }
    return data.group ? `${data.name} · ${data.group.name} · se repite cada semana` : data.name;
  });

  protected selectChild(child: ParentChild) {
    this.#ctx.select({
      studentId: child.studentId,
      name: child.name,
      schoolId: child.school.id,
      schoolName: child.school.name,
      organizationId: child.organizationId,
      classGroupName: child.classGroup?.name ?? null,
    });
  }

  protected print() {
    window.print();
  }
}
