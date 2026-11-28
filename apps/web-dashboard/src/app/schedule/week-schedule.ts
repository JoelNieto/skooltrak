import { Button, courseColorVar, Icon } from '#/ui';
import { resolveCourseColor } from '@/shared';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  dayLabel,
  formatDuration,
  hourWindow,
  layoutDay,
  minutesBy,
  sharedBreaks,
  toMinutes,
  WEEKDAYS,
  WeekdayKey,
} from '../groups/schedule-grid';

/** One slot of `GET /groups-schedules/mine`. */
export interface MyScheduleSlot {
  id: string;
  weekday: WeekdayKey;
  startTime: string;
  endTime: string;
  location: string;
  remote: boolean;
  remoteLink: string;
  recess: boolean;
  course: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    color: string | null;
    subject: { name: string; code: string } | null;
  };
  teacherName: string | null;
  group: { id: string; name: string };
}

/** `GET /groups-schedules/mine` */
export interface MySchedule {
  kind: 'STUDENT' | 'TEACHER';
  name: string;
  group: { id: string; name: string } | null;
  /** The school's local day and time. */
  now: { weekday: WeekdayKey; time: string };
  slots: MyScheduleSlot[];
}

const PX_PER_MINUTE = 1.6;

/**
 * A read-only weekly schedule: the week grid on tablet and desktop, one day at a time on a phone.
 * `student` (students and parents) shows each class's teacher and the group's breaks; `teacher`
 * shows each class's group and adds up the week per group.
 */
@Component({
  selector: 'app-week-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, RouterLink],
  template: `
    <div class="flex flex-wrap items-start gap-6">
      <section
        aria-label="Horario de la semana"
        class="hidden min-w-0 flex-[999_1_640px] overflow-x-auto rounded-2xl border border-line bg-surface-1 p-4 md:block print:block"
      >
        <div [style.min-width.px]="days().length * 120 + 56">
          <div class="grid gap-2 pb-2" [style.grid-template-columns]="columns()">
            <div></div>
            @for (day of days(); track day.key) {
              <div
                class="flex h-10 items-center rounded-full px-3 text-sm font-semibold"
                [class.bg-action-subtle]="day.key === today()"
                [class.text-action]="day.key === today()"
              >
                {{ day.label }}{{ day.key === today() ? ' · Hoy' : '' }}
              </div>
            }
          </div>
          <div class="grid gap-2" [style.grid-template-columns]="columns()">
            <div class="relative" [style.height.px]="gridHeight()">
              @for (hour of hours(); track hour.label) {
                <span class="absolute right-1.5 text-xs font-medium text-ink-subtle" [style.top.px]="hour.labelTop">
                  {{ hour.label }}
                </span>
              }
            </div>
            @for (day of days(); track day.key) {
              <div class="relative rounded-xl" [style.height.px]="gridHeight()" [style.background-image]="hourLines">
                @if (day.key !== 'SATURDAY' && day.key !== 'SUNDAY') {
                  @for (b of breaks(); track b.startTime) {
                    <div
                      class="absolute inset-x-0.5 flex items-center justify-center rounded-lg bg-surface-0 text-[11px] font-medium tracking-wide text-ink-muted"
                      [style.top.px]="b.top"
                      [style.height.px]="b.height"
                    >
                      {{ b.label }}
                    </div>
                  }
                }
                @for (b of blocksByDay()[day.key]; track b.id) {
                  <button
                    type="button"
                    class="absolute flex flex-col gap-0.5 overflow-hidden rounded-[10px] border border-ink-strong/10 px-2.5 py-1.5 text-left text-ink-strong outline-offset-1"
                    [class.outline-2]="b.selected || b.now"
                    [class.outline-action]="b.selected || b.now"
                    [style.top.px]="b.top"
                    [style.height.px]="b.height"
                    [style.left]="'calc(' + b.left + '% + 2px)'"
                    [style.width]="'calc(' + b.width + '% - 4px)'"
                    [style.background]="b.tint"
                    [attr.aria-pressed]="b.selected"
                    [attr.aria-label]="b.aria"
                    (click)="toggle(b.id)"
                  >
                    <span class="flex w-full items-center justify-between gap-1">
                      <span class="font-mono text-[11px] font-medium text-ink">{{ b.range }}</span>
                      @if (b.now) {
                        <span
                          class="rounded-full bg-[var(--ui-new)] px-1.5 text-[10px] font-semibold text-[var(--ui-new-content)]"
                          >Ahora</span
                        >
                      } @else if (b.slot.remote) {
                        <span class="rounded-full bg-surface-1 px-1.5 text-[10px] font-semibold text-ink">Remoto</span>
                      }
                    </span>
                    <span class="w-full truncate text-[13px] leading-[17px] font-semibold">{{ b.name }}</span>
                    <span class="w-full truncate text-xs leading-[15px] font-medium text-ink-muted">{{ b.meta }}</span>
                  </button>
                }
                @if (nowTop() !== null && day.key === today()) {
                  <div
                    class="pointer-events-none absolute -left-1 right-0 z-[2] h-0.5 bg-[var(--ui-new)]"
                    [style.top.px]="nowTop()"
                    role="img"
                    [attr.aria-label]="'Ahora, ' + now()?.time"
                  >
                    <span class="absolute -top-1 -left-0.5 size-2.5 rounded-full bg-[var(--ui-new)]"></span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Phone: one day at a time (Mobile artboard) -->
      <section aria-label="Horario del día" class="flex w-full flex-col gap-3 md:hidden print:hidden">
        <div
          class="grid gap-1 rounded-full bg-surface-2 p-1"
          role="group"
          aria-label="Día"
          [style.grid-template-columns]="'repeat(' + days().length + ', minmax(0, 1fr))'"
        >
          @for (day of days(); track day.key) {
            @let on = day.key === mobileDay();
            <button
              type="button"
              class="h-11 rounded-full text-[13px] font-semibold"
              [class]="on ? 'bg-surface-1 text-action shadow-sm' : 'text-ink-muted'"
              [attr.aria-pressed]="on"
              [attr.aria-label]="day.label"
              (click)="mobileDay.set(day.key)"
            >
              {{ day.short }}
            </button>
          }
        </div>
        <div class="flex items-baseline justify-between px-1">
          <h3 class="font-display text-lg font-medium text-ink-strong">
            {{ dayName(mobileDay()) }}{{ mobileDay() === today() ? ' · Hoy' : '' }}
          </h3>
          <span class="text-xs font-medium text-ink-muted">{{ mobileCount() }} clases</span>
        </div>
        @for (row of mobileRows(); track row.key) {
          @if (row.slot) {
            <div class="grid grid-cols-[48px_minmax(0,1fr)] items-stretch gap-2.5">
              <div class="flex flex-col items-end gap-0.5 pt-2.5">
                <span class="text-[13px] font-semibold text-ink-strong">{{ row.start }}</span>
                <span class="text-[11px] font-medium text-ink-subtle">{{ row.end }}</span>
              </div>
              <button
                type="button"
                class="flex min-h-16 items-center gap-3 rounded-2xl bg-surface-1 px-3.5 py-2.5 text-left"
                [class]="row.now ? 'border-2 border-action' : 'border border-line'"
                [attr.aria-pressed]="row.selected"
                (click)="toggle(row.slot.id)"
              >
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                  [style.background]="row.chip"
                >
                  {{ row.code }}
                </span>
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="text-[15px] leading-5 font-semibold text-ink-strong">{{ row.label }}</span>
                  <span class="truncate text-xs font-medium text-ink-muted">{{ row.meta }}</span>
                </span>
                @if (row.now) {
                  <span
                    class="shrink-0 rounded-full bg-[var(--ui-new)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ui-new-content)]"
                  >
                    Ahora
                  </span>
                }
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2 px-1 text-xs font-medium text-ink-muted">
              <span class="h-px flex-1 bg-line"></span>
              {{ row.label }} · {{ row.start }} – {{ row.end }}
              <span class="h-px flex-1 bg-line"></span>
            </div>
          }
        } @empty {
          <p class="rounded-2xl border border-line bg-surface-1 p-6 text-center text-sm text-ink-muted">
            Sin clases este día.
          </p>
        }
      </section>

      <aside class="flex min-w-0 flex-[1_1_300px] flex-col gap-4 print:hidden">
        @if (selected(); as sel) {
          <section
            aria-label="Clase seleccionada"
            class="flex flex-col gap-4 rounded-2xl border border-line bg-surface-1 p-6"
          >
            <div class="flex flex-col gap-2">
              <span
                class="self-start rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
                [style.background]="sel.chip"
              >
                {{ sel.code }}
              </span>
              <h3 class="font-display text-lg font-medium text-ink-strong">{{ sel.name }}</h3>
            </div>
            <div class="flex flex-col gap-2.5 text-sm text-ink">
              <div class="flex items-center gap-2.5">
                <ui-icon name="clock" class="text-lg text-ink-muted" />{{ sel.when }}
              </div>
              <div class="flex items-center gap-2.5">
                <ui-icon [name]="perspective() === 'teacher' ? 'users' : 'user'" class="text-lg text-ink-muted" />{{
                  sel.who
                }}
              </div>
              <div class="flex items-center gap-2.5">
                <ui-icon [name]="sel.slot.remote ? 'video' : 'map-pin'" class="text-lg text-ink-muted" />
                @if (sel.slot.remote && sel.slot.remoteLink) {
                  <a class="link link-hover text-action" [href]="sel.slot.remoteLink" target="_blank" rel="noopener">
                    Remoto · abrir enlace
                  </a>
                } @else {
                  {{ sel.where }}
                }
              </div>
            </div>
            <a uiButton size="sm" class="self-start" [routerLink]="['/courses', sel.slot.course.id]">Ir al curso</a>
          </section>
        }

        @if (next(); as n) {
          <section
            aria-label="Siguiente clase"
            class="flex flex-col gap-1 rounded-2xl border border-line bg-surface-1 px-6 py-5"
          >
            <span class="text-xs font-semibold tracking-wide text-ink-muted uppercase">{{ n.label }}</span>
            <span class="font-display text-lg font-medium text-ink-strong">{{ n.name }}</span>
            <span class="text-sm text-ink-muted">{{ n.detail }}</span>
          </section>
        }

        <section
          aria-label="Horas por semana"
          class="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-1 px-6 py-5"
        >
          <div class="flex items-baseline justify-between gap-2">
            <h3 class="font-display text-lg font-medium text-ink-strong">
              {{ perspective() === 'teacher' ? 'Clases por grupo' : 'Horas por semana' }}
            </h3>
            <span class="text-xs font-medium whitespace-nowrap text-ink-muted">{{ total() }}</span>
          </div>
          @for (row of load(); track row.key) {
            <div class="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2.5 text-[13px]">
              <span
                class="truncate rounded-full py-0.5 text-center font-mono text-[11px] font-medium"
                [style.background]="row.chip"
              >
                {{ row.code }}
              </span>
              <span class="truncate text-ink">{{ row.name }}</span>
              <span class="font-semibold text-ink-strong">{{ row.hours }}</span>
            </div>
          }
        </section>
      </aside>
    </div>
  `,
})
export class WeekSchedule {
  readonly slots = input<MyScheduleSlot[]>([]);
  /** The school's local day and time; null hides the "now" marks. */
  readonly now = input<{ weekday: WeekdayKey; time: string } | null>(null);
  readonly perspective = input<'student' | 'teacher'>('student');

  protected readonly selectedId = signal<string | null>(null);
  protected readonly hourLines = `repeating-linear-gradient(to bottom, var(--ui-line) 0, var(--ui-line) 1px, transparent 1px, transparent ${60 * PX_PER_MINUTE}px)`;

  private readonly classes = computed(() => this.slots().filter((s) => !s.recess));
  protected readonly today = computed(() => this.now()?.weekday ?? null);
  private readonly nowMinutes = computed(() => {
    const now = this.now();
    return now ? toMinutes(now.time) : null;
  });

  protected readonly days = computed(() => {
    const weekend = this.slots().some((s) => s.weekday === 'SATURDAY' || s.weekday === 'SUNDAY');
    return WEEKDAYS.slice(0, weekend ? 7 : 5);
  });
  protected readonly columns = computed(() => `56px repeat(${this.days().length}, minmax(0, 1fr))`);
  protected readonly mobileDay = linkedSignal<WeekdayKey>(() => {
    const today = this.today();
    return today && this.days().some((d) => d.key === today) ? today : 'MONDAY';
  });

  private readonly window = computed(() => hourWindow(this.slots()));
  protected readonly gridHeight = computed(() => (this.window().end - this.window().start) * 60 * PX_PER_MINUTE);
  protected readonly hours = computed(() => {
    const { start, end } = this.window();
    const hours = [];
    for (let h = start; h <= end; h++) {
      const top = (h - start) * 60 * PX_PER_MINUTE;
      hours.push({ label: `${String(h).padStart(2, '0')}:00`, labelTop: Math.max(top - 8, 0) });
    }
    return hours;
  });
  private top(time: string) {
    return (toMinutes(time) - this.window().start * 60) * PX_PER_MINUTE;
  }
  private height(start: string, end: string) {
    return (toMinutes(end) - toMinutes(start)) * PX_PER_MINUTE - 4;
  }

  protected readonly nowTop = computed(() => {
    const minutes = this.nowMinutes();
    const { start, end } = this.window();
    if (minutes === null || minutes < start * 60 || minutes > end * 60) return null;
    return (minutes - start * 60) * PX_PER_MINUTE;
  });

  /** A group's breaks; a teacher's gaps are free time, not breaks. */
  protected readonly breaks = computed(() => {
    if (this.perspective() === 'teacher') return [];
    const inferred = sharedBreaks(this.slots()).map((b) => ({
      ...b,
      label:
        toMinutes(b.endTime) - toMinutes(b.startTime) >= 30 && toMinutes(b.startTime) >= 11 * 60
          ? 'Almuerzo'
          : 'Recreo',
    }));
    const saved = this.slots()
      .filter((s) => s.recess)
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime, label: 'Recreo' }));
    const unique = new Map([...inferred, ...saved].map((b) => [b.startTime, b]));
    return [...unique.values()].map((b) => ({
      ...b,
      top: this.top(b.startTime),
      height: this.height(b.startTime, b.endTime),
    }));
  });

  private color(slot: MyScheduleSlot, amount: number) {
    const key = resolveCourseColor(slot.course.id, slot.course.color);
    return `color-mix(in oklab, ${courseColorVar(key)} ${amount}%, var(--ui-surface-1))`;
  }
  private name(slot: MyScheduleSlot) {
    return slot.course.subject?.name ?? slot.course.name;
  }
  private code(slot: MyScheduleSlot) {
    return (slot.course.subject?.code || slot.course.shortName || slot.course.code || '').slice(0, 6).toUpperCase();
  }
  private place(slot: MyScheduleSlot) {
    return slot.remote ? 'Remoto' : slot.location || 'Sin ubicación';
  }
  private who(slot: MyScheduleSlot) {
    return this.perspective() === 'teacher' ? slot.group.name : slot.teacherName || 'Sin docente';
  }
  /** Second line of a class: "Aula 12 · Prof." for a student, "7°A · Aula 12" for a teacher. */
  private meta(slot: MyScheduleSlot) {
    return this.perspective() === 'teacher'
      ? `${slot.group.name} · ${this.place(slot)}`
      : `${this.place(slot)} · ${this.who(slot)}`;
  }
  private isNow(slot: MyScheduleSlot) {
    const minutes = this.nowMinutes();
    return (
      minutes !== null &&
      slot.weekday === this.today() &&
      minutes >= toMinutes(slot.startTime) &&
      minutes < toMinutes(slot.endTime)
    );
  }

  protected readonly blocksByDay = computed(() => {
    const byDay = {} as Record<WeekdayKey, Array<ReturnType<WeekSchedule['block']>>>;
    for (const day of WEEKDAYS) {
      byDay[day.key] = layoutDay(
        this.classes().filter((s) => s.weekday === day.key),
        this.window(),
        PX_PER_MINUTE,
      ).map((p) => this.block(p.item, p.top, p.height - 4, p.left, p.width));
    }
    return byDay;
  });

  private block(slot: MyScheduleSlot, top: number, height: number, left: number, width: number) {
    const name = this.name(slot);
    return {
      id: slot.id,
      slot,
      name,
      meta: this.meta(slot),
      range: `${slot.startTime} – ${slot.endTime}`,
      tint: this.color(slot, 14),
      now: this.isNow(slot),
      selected: this.selectedId() === slot.id,
      top,
      height,
      left,
      width,
      aria: `${name}, ${dayLabel(slot.weekday)} ${slot.startTime} a ${slot.endTime}, ${this.who(slot)}`,
    };
  }

  protected readonly mobileRows = computed(() => {
    const day = this.mobileDay();
    const classes = this.classes()
      .filter((s) => s.weekday === day)
      .map((s) => ({
        key: s.id,
        slot: s as MyScheduleSlot | null,
        start: s.startTime,
        end: s.endTime,
        label: this.name(s),
        code: this.code(s),
        chip: this.color(s, 26),
        meta: this.meta(s),
        now: this.isNow(s),
        selected: this.selectedId() === s.id,
      }));
    if (!classes.length) return [];
    const first = Math.min(...classes.map((c) => toMinutes(c.start)));
    const last = Math.max(...classes.map((c) => toMinutes(c.end)));
    const breaks = day === 'SATURDAY' || day === 'SUNDAY' ? [] : this.breaks();
    const breakRows = breaks
      .filter((b) => toMinutes(b.startTime) >= first && toMinutes(b.endTime) <= last)
      .map((b) => ({
        key: `break-${b.startTime}`,
        slot: null,
        start: b.startTime,
        end: b.endTime,
        label: b.label,
        code: '',
        chip: '',
        meta: '',
        now: false,
        selected: false,
      }));
    return [...classes, ...breakRows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  });
  protected readonly mobileCount = computed(() => this.mobileRows().filter((r) => r.slot).length);
  protected dayName(key: WeekdayKey) {
    return dayLabel(key);
  }

  protected readonly selected = computed(() => {
    const slot = this.classes().find((s) => s.id === this.selectedId());
    if (!slot) return null;
    const minutes = toMinutes(slot.endTime) - toMinutes(slot.startTime);
    return {
      slot,
      name: this.name(slot),
      code: this.code(slot),
      chip: this.color(slot, 26),
      when: `${dayLabel(slot.weekday)}, ${slot.startTime} – ${slot.endTime} (${formatDuration(minutes)})`,
      who: this.who(slot),
      where: this.place(slot),
    };
  });

  /** The class going on now, else the next one today, else nothing. */
  protected readonly next = computed(() => {
    const minutes = this.nowMinutes();
    if (minutes === null) return null;
    const today = this.classes()
      .filter((s) => s.weekday === this.today() && toMinutes(s.endTime) > minutes)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const slot = today[0];
    if (!slot) return null;
    const live = toMinutes(slot.startTime) <= minutes;
    return {
      label: live ? 'Ahora' : 'Siguiente clase',
      name: this.name(slot),
      detail: `${slot.startTime} – ${slot.endTime} · ${this.meta(slot)}`,
    };
  });

  protected readonly load = computed(() => {
    const teacher = this.perspective() === 'teacher';
    const totals = minutesBy(this.classes(), (s) => (teacher ? s.group.id : s.course.id));
    const sample = new Map(this.classes().map((s) => [teacher ? s.group.id : s.course.id, s]));
    return [...totals]
      .flatMap(([key, minutes]) => {
        const s = sample.get(key);
        if (!s) return [];
        const count = this.classes().filter((c) => (teacher ? c.group.id : c.course.id) === key).length;
        return [
          {
            key,
            minutes,
            code: teacher ? s.group.name : this.code(s),
            name: teacher ? `${count} clase${count === 1 ? '' : 's'}` : this.name(s),
            chip: teacher ? 'var(--ui-surface-2)' : this.color(s, 26),
            hours: formatDuration(minutes),
          },
        ];
      })
      .sort((a, b) => b.minutes - a.minutes || a.code.localeCompare(b.code));
  });
  protected readonly total = computed(
    () => `${formatDuration(this.load().reduce((sum, r) => sum + r.minutes, 0))} en total`,
  );

  protected toggle(id: string) {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
}
