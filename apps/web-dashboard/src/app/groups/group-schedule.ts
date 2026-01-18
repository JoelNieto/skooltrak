import { Modal } from '@/ui';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import GroupScheduleForm from './group-schedule-form';

type Schedule = Prisma.ClassGroupWeeklyScheduleGetPayload<{
  include: {
    course: { include: { subject: true; teacher: { include: { user: true } } } };
  };
}>;
type WeekdayKey = Schedule['weekday'];
type ScheduleLayout = {
  id: string;
  top: number;
  height: number;
  left: number;
  width: number;
  schedule: Schedule;
};

@Component({
  selector: 'app-group-schedule',
  imports: [],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 class="text-lg font-semibold text-base-content">
            Horario semanal del grupo
          </h4>
          <p class="text-sm text-base-200">
            Visualiza las clases en un calendario semanal por horas.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="editSchedule()">
          Agregar clase
        </button>
      </div>
      @if (schedulesResource.isLoading()) {
        <div class="flex items-center gap-2 text-sm text-base-200">
          <span class="loading loading-spinner loading-sm"></span>
          Cargando horario...
        </div>
      } @else {
        @let schedules = localSchedules();
        @if (schedules?.length) {
          <div class="w-full overflow-x-auto">
            <div class="min-w-[1100px]">
              <div
                class="grid border border-base-300 rounded-lg bg-base-100"
                [style.gridTemplateColumns]="gridTemplateColumns"
              >
                <div class="border-b border-base-200 bg-base-200 px-3 py-2 text-xs font-semibold">
                  Hora
                </div>
                @for (day of weekdays; track day.key) {
                  <div class="border-b border-base-200 bg-base-200 px-3 py-2 text-xs font-semibold">
                    <div class="flex items-center justify-between">
                      <span>{{ day.label }}</span>
                      <button
                        class="btn btn-ghost btn-xs"
                        (click)="editSchedule(undefined, day.key)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                }

                <div class="relative border-r border-base-300 mt-4" [style.height.px]="gridHeight">
                  @for (hour of hourMarks; track hour.label) {
                    <div
                      class="absolute left-0 right-0 -translate-y-1/2 px-2 text-[11px] text-base-200 pt-4 border-t border-base-300"
                      [style.top.px]="hour.top"
                    >
                      {{ hour.label }}
                    </div>
                  }
                </div>

                @for (day of weekdays; track day.key) {
                  <div
                    class="relative border-r border-base-300 schedule-day-column"
                    [attr.data-day]="day.key"
                    [style.height.px]="gridHeight"
                    [style.backgroundImage]="gridBackground"
                  >
                    @for (entry of layoutByDay()[day.key]; track entry.id) {
                      <div
                        class="absolute rounded-md border bg-primary-content text-primary p-2 text-xs  cursor-move group"
                        [class.opacity-70]="draggingId() === entry.id"
                        [style.top.px]="entry.top"
                        [style.height.px]="entry.height"
                        [style.left.%]="entry.left"
                        [style.width.%]="entry.width"
                        style="touch-action: none;"
                        (pointerdown)="onEntryPointerDown(entry, $event)"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <p class="font-semibold text-primary">
                            {{ entry.schedule.course.subject.name }}
                          </p>
                          <button
                            class="btn btn-ghost btn-xs"
                            type="button"
                            (click)="editSchedule(entry.schedule); $event.stopPropagation()"
                          >
                            Editar
                          </button>
                        </div>
                        <p class="text-[11px] text-base-200">
                          {{ entry.schedule.startTime }} - {{ entry.schedule.endTime }}
                        </p>
                        <p class="text-[11px] text-base-200">
                          {{ entry.schedule.location }}
                        </p>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-base-300 bg-base-100 p-6">
            <h5 class="text-base font-semibold text-base-content">
              Aún no hay horario semanal
            </h5>
            <p class="text-sm text-base-200 mt-1">
              Empieza agregando las clases para cada día de la semana.
            </p>
            <button class="btn btn-primary btn-sm mt-4" (click)="editSchedule()">
              Crear horario
            </button>
          </div>
        }
      }
    </div>
  `,
})
export default class GroupSchedule {
  public id = input<string>();
  #modal = inject(Modal);
  #apollo = inject(Apollo);
  public localSchedules = signal<Schedule[]>([]);
  public draggingId = signal<string | null>(null);

  public weekdays: Array<{ key: WeekdayKey; label: string }> = [
    { key: 'MONDAY', label: 'Lunes' },
    { key: 'TUESDAY', label: 'Martes' },
    { key: 'WEDNESDAY', label: 'Miércoles' },
    { key: 'THURSDAY', label: 'Jueves' },
    { key: 'FRIDAY', label: 'Viernes' },
    { key: 'SATURDAY', label: 'Sábado' },
    { key: 'SUNDAY', label: 'Domingo' },
  ];
  public startHour = 7;
  public endHour = 14;
  public slotMinutes = 5;
  public slotHeight = 12;

  public schedulesResource = rxResource({
    params: () => ({
      classGroupId: this.id(),
    }),
    stream: ({ params }) => {
      if (!params.classGroupId) {
        return of([]);
      }

      return this.#apollo
        .watchQuery<{
          groupsSchedulesByClassGroupId: Schedule[];
        }>({
          query: gql`
            query GroupsSchedulesByClassGroupId($classGroupId: String!) {
              groupsSchedulesByClassGroupId(classGroupId: $classGroupId) {
                id
                weekday
                startTime
                endTime
                location
                remote
                remoteLink
                courseId
                course {
                  id
                  name
                  subject {
                    name
                  }
                  teacher {
                    user {
                      firstName
                      lastName
                    }
                  }
                }
              }
            }
          `,
          variables: {
            classGroupId: params.classGroupId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(
          map((result) => result.data.groupsSchedulesByClassGroupId)
        );
    },
  });

  public layoutByDay = computed(() => {
    const schedules = this.localSchedules();
    return this.weekdays.reduce((acc, day) => {
      const daySchedules = schedules.filter(
        (schedule) => schedule.weekday === day.key
      );
      acc[day.key] = this.buildDayLayout(daySchedules);
      return acc;
    }, {} as Record<WeekdayKey, ScheduleLayout[]>);
  });

  constructor() {
    effect(() => {
      const schedules = this.schedulesResource.value();
      if (schedules) {
        this.localSchedules.set([...schedules]);
      }
    });
  }

  public get gridTemplateColumns() {
    return `72px repeat(${this.weekdays.length}, minmax(160px, 1fr))`;
  }

  public get gridHeight() {
    const totalMinutes = (this.endHour - this.startHour) * 60;
    const totalSlots = totalMinutes / this.slotMinutes;
    return totalSlots * this.slotHeight;
  }

  public get hourMarks() {
    const hours = [];
    for (let hour = this.startHour; hour <= this.endHour; hour += 1) {
      const minutesFromStart = (hour - this.startHour) * 60;
      hours.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        top: (minutesFromStart / this.slotMinutes) * this.slotHeight,
      });
    }
    return hours;
  }

  public get gridBackground() {
    const minor = this.slotHeight;
    const major = this.slotHeight * (60 / this.slotMinutes);
    return `
      repeating-linear-gradient(
        to bottom,
        rgba(148, 163, 184, 0.08) 0,
        rgba(148, 163, 184, 0.08) 1px,
        transparent 1px,
        transparent ${minor}px
      ),
      repeating-linear-gradient(
        to bottom,
        rgba(148, 163, 184, 0.25) 0,
        rgba(148, 163, 184, 0.25) 1px,
        transparent 1px,
        transparent ${major}px
      )
    `;
  }

  public teacherName(teacher: Schedule['course']['teacher'] | null | undefined) {
    if (!teacher?.user) {
      return 'Sin docente';
    }
    return `${teacher.user.firstName} ${teacher.user.lastName}`;
  }

  public onEntryPointerDown(entry: ScheduleLayout, event: PointerEvent) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const column = target.closest('.schedule-day-column') as HTMLElement | null;
    if (!column) return;
    const columnRect = column.getBoundingClientRect();
    const entryRect = target.getBoundingClientRect();
    const duration =
      this.timeToMinutes(entry.schedule.endTime) -
      this.timeToMinutes(entry.schedule.startTime);
    const dragOffset = event.clientY - entryRect.top;

    this.draggingId.set(entry.id);
    this.activeDrag = {
      id: entry.id,
      duration,
      offsetY: dragOffset,
      dayKey: entry.schedule.weekday,
      columnRect,
    };

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private activeDrag: {
    id: string;
    duration: number;
    offsetY: number;
    dayKey: WeekdayKey;
    columnRect: DOMRect;
  } | null = null;

  private onPointerMove = (event: PointerEvent) => {
    if (!this.activeDrag) return;
    const element = document.elementFromPoint(
      event.clientX,
      event.clientY
    ) as HTMLElement | null;
    const dayColumn = element?.closest?.('.schedule-day-column') as HTMLElement | null;
    const dayKey =
      (dayColumn?.dataset?.['day'] as WeekdayKey | undefined) ??
      this.activeDrag.dayKey;
    const columnRect = dayColumn?.getBoundingClientRect() ?? this.activeDrag.columnRect;

    const rawMinutes =
      ((event.clientY - columnRect.top - this.activeDrag.offsetY) /
        this.slotHeight) *
      this.slotMinutes;
    const snappedMinutes = this.snapMinutes(rawMinutes);
    const startMinutes = this.clampMinutes(
      this.startHour * 60 + snappedMinutes,
      this.startHour * 60,
      this.endHour * 60 - this.activeDrag.duration
    );
    const endMinutes = startMinutes + this.activeDrag.duration;
    this.updateSchedule(this.activeDrag.id, dayKey, startMinutes, endMinutes);
  };

  private onPointerUp = () => {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.activeDrag = null;
    this.draggingId.set(null);
  };

  private updateSchedule(
    id: string,
    weekday: WeekdayKey,
    startMinutes: number,
    endMinutes: number
  ) {
    this.localSchedules.update((schedules) =>
      schedules.map((schedule) =>
        schedule.id === id
          ? {
              ...schedule,
              weekday,
              startTime: this.minutesToTime(startMinutes),
              endTime: this.minutesToTime(endMinutes),
            }
          : schedule
      )
    );
  }

  private buildDayLayout(schedules: Schedule[]): ScheduleLayout[] {
    const dayStart = this.startHour * 60;
    const dayEnd = this.endHour * 60;
    const prepared = schedules
      .map((schedule) => {
        const start = this.timeToMinutes(schedule.startTime);
        const end = this.timeToMinutes(schedule.endTime);
        return {
          schedule,
          start: Math.max(start, dayStart),
          end: Math.min(end, dayEnd),
        };
      })
      .filter((item) => item.end > item.start)
      .sort((a, b) => a.start - b.start);

    const groups: Array<Array<typeof prepared[number]>> = [];
    let currentGroup: Array<typeof prepared[number]> = [];
    let currentEnd = -Infinity;

    for (const item of prepared) {
      if (item.start < currentEnd) {
        currentGroup.push(item);
        currentEnd = Math.max(currentEnd, item.end);
      } else {
        if (currentGroup.length) groups.push(currentGroup);
        currentGroup = [item];
        currentEnd = item.end;
      }
    }
    if (currentGroup.length) groups.push(currentGroup);

    const layouts: ScheduleLayout[] = [];
    for (const group of groups) {
      const lanes: number[] = [];
      const itemsWithLane = group.map((item) => {
        let laneIndex = lanes.findIndex((laneEnd) => laneEnd <= item.start);
        if (laneIndex === -1) {
          laneIndex = lanes.length;
          lanes.push(item.end);
        } else {
          lanes[laneIndex] = item.end;
        }
        return { item, laneIndex };
      });
      const laneCount = lanes.length;
      const laneGap = 2;
      const laneWidth = 100 / laneCount;

      for (const { item, laneIndex } of itemsWithLane) {
        const top =
          ((item.start - dayStart) / this.slotMinutes) * this.slotHeight;
        const height =
          ((item.end - item.start) / this.slotMinutes) * this.slotHeight;
        layouts.push({
          id: item.schedule.id,
          top,
          height: Math.max(height, this.slotHeight),
          left: laneIndex * laneWidth + laneGap / 2,
          width: laneWidth - laneGap,
          schedule: item.schedule,
        });
      }
    }
    return layouts;
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private snapMinutes(minutes: number) {
    return Math.round(minutes / this.slotMinutes) * this.slotMinutes;
  }

  private clampMinutes(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  public editSchedule(
    schedule?: Prisma.ClassGroupWeeklyScheduleGetPayload<undefined>,
    weekday?: string
  ) {
    const modalRef = this.#modal.open(GroupScheduleForm, {
      title: schedule ? 'Editar clase' : 'Agregar clase',
      data: {
        schedule,
        weekday,
        groupId: this.id(),
      },
    });
    modalRef.closed.subscribe(() => {
      this.schedulesResource.reload();
    });
  }
}
