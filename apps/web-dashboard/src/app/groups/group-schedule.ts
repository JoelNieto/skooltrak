import { Button, Confirmation, courseColorVar, Icon, Spinner, Toast, UiCheckbox } from '#/ui';
import { resolveCourseColor } from '@/shared';
import { HttpClient, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import GroupScheduleForm, { errorMessage, GroupSlotRef, ScheduleFormResult } from './group-schedule-form';
import {
  courseCode,
  GroupCourse,
  Schedule,
  ScheduleDraft,
  subjectName,
  TeacherBusySlot,
  teacherName,
} from './group-schedule.types';
import {
  clamp,
  clashingPairs,
  dayLabel,
  describeRange,
  firstClash,
  formatDuration,
  freeSlots,
  hourWindow,
  layoutDay,
  minutesBy,
  sharedBreaks,
  snap,
  TimeRange,
  toMinutes,
  toTime,
  WEEKDAYS,
  weekdayOf,
  WeekdayKey,
} from './schedule-grid';

/** 1.6 px per minute: one hour is 96 px, a 45-minute class 72 px. */
const PX_PER_MINUTE = 1.6;
/** Moves and resizes snap to 5 minutes. */
const SNAP_MINUTES = 5;
/** A pointer must travel this far before a press becomes a drag (a shorter press is a click). */
const DRAG_THRESHOLD_PX = 4;

interface DragState {
  id: string;
  kind: 'move' | 'resize';
  startX: number;
  startY: number;
  /** Minutes between the slot's start and the pointer (move). */
  offset: number;
  duration: number;
  moved: boolean;
  weekday: WeekdayKey;
  start: number;
  end: number;
}

interface UndoToast {
  text: string;
  undo: () => void;
}

interface DrawerState {
  mode: 'add' | 'edit';
  draft: ScheduleDraft;
  editingId: string | null;
}

/**
 * A class group's weekly schedule. "Ver" shows the week (and, on a phone, one day at a time);
 * "Editar" (MANAGE_SCHEDULES) lets staff drag a class to move it, stretch its bottom edge to change
 * its length, click a free period to fill it, and edit, duplicate or delete a class from the side
 * panel. Moves that clash with the group or with the teacher's other groups are refused before
 * they reach the API; every change can be undone from the toast.
 */
@Component({
  selector: 'app-group-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner, Button, Icon, RouterLink, UiCheckbox, GroupScheduleForm],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <h2 class="font-display text-xl font-medium text-ink-strong">Horario semanal</h2>
          <p class="text-sm text-ink-muted">Plantilla que se repite cada semana del año escolar.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 print:hidden">
          @if (canEdit()) {
            <div class="inline-flex gap-1 rounded-full bg-surface-2 p-1" role="group" aria-label="Modo">
              @for (opt of modes; track opt.key) {
                @let on = mode() === opt.key;
                <button
                  type="button"
                  class="h-9 rounded-full px-4 text-sm font-semibold transition-colors"
                  [class]="on ? 'bg-surface-1 text-ink-strong shadow-sm' : 'text-ink-muted hover:text-ink-strong'"
                  [attr.aria-pressed]="on"
                  (click)="setMode(opt.key)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          }
          <label class="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" uiCheckbox [checked]="showWeekend()" (change)="showWeekend.set(!showWeekend())" />
            Sábado y domingo
          </label>
          <button uiButton type="button" iconOnly aria-label="Imprimir horario" (click)="print()">
            <ui-icon name="printer" class="text-lg" />
          </button>
          @if (isEdit()) {
            <button uiButton variant="primary" type="button" (click)="openAdd()">
              <ui-icon name="plus" class="text-lg" />
              Agregar clase
            </button>
          }
        </div>
      </div>

      @if (drag()?.moved && dragClash()) {
        <div role="alert" class="flex items-center gap-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-ink">
          <ui-icon name="circle-x" class="shrink-0 text-xl text-error" />
          <span
            ><b class="font-semibold text-error">No se puede soltar aquí.</b> {{ dragClash() }} Suelta la clase en un
            espacio libre o pulsa Esc para cancelar.</span
          >
        </div>
      } @else if (isEdit() && slots().length) {
        <div class="flex items-center gap-3 rounded-2xl bg-action-subtle px-4 py-3 text-sm text-ink print:hidden">
          <ui-icon name="info" class="shrink-0 text-xl text-action" />
          <span>
            <b class="font-semibold text-ink-strong">Modo edición.</b>
            Arrastra una clase para moverla, estira su borde inferior para cambiar la duración o haz clic para ver sus
            acciones. Cada cambio se guarda al soltar y se puede deshacer.
          </span>
        </div>
      }

      @if (schedulesResource.isLoading() && !schedulesResource.hasValue()) {
        <div class="flex items-center gap-2 text-sm text-ink-muted">
          <span uiSpinner size="sm"></span>
          Cargando horario...
        </div>
      } @else if (!slots().length) {
        <div
          class="flex min-h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface-1 p-8 text-center"
        >
          <ui-icon name="calendar-days" class="text-4xl text-ink-muted" />
          <h3 class="font-display text-xl font-medium text-ink-strong">
            Aún no hay horario para {{ groupName() || 'este grupo' }}
          </h3>
          @if (canEdit()) {
            <p class="max-w-md text-ink-muted">
              Agrega las clases una por una; puedes crear la misma clase en varios días a la vez.
            </p>
            <button uiButton variant="primary" type="button" class="mt-2" (click)="startFirst()">
              Agregar primera clase
            </button>
          } @else {
            <p class="max-w-md text-ink-muted">Cuando la escuela publique el horario lo verás aquí.</p>
          }
        </div>
      } @else {
        <div class="flex flex-wrap items-start gap-6">
          <!-- Week grid (tablet and desktop) -->
          <section
            aria-label="Horario de la semana"
            class="hidden min-w-0 flex-[999_1_640px] overflow-x-auto rounded-2xl border border-line bg-surface-1 p-4 md:block"
          >
            <div [style.min-width.px]="visibleDays().length * 120 + 56">
              <div class="grid gap-2 pb-2" [style.grid-template-columns]="columns()">
                <div></div>
                @for (day of visibleDays(); track day.key) {
                  @let target = drag()?.moved && drag()?.weekday === day.key;
                  <div
                    class="flex h-10 items-center justify-between gap-1 rounded-full pr-1 pl-3"
                    [class.bg-surface-0]="!target && day.key === today()"
                    [class.bg-action-subtle]="target && !dragClash()"
                    [class.text-action]="target && !dragClash()"
                    [style.background-color]="
                      target && dragClash() ? 'color-mix(in oklab, var(--color-error) 10%, transparent)' : null
                    "
                  >
                    <span class="text-sm font-semibold">{{ day.label }}</span>
                    @if (isEdit() && !drag()?.moved) {
                      <button
                        type="button"
                        class="inline-flex size-8 items-center justify-center rounded-full text-action hover:bg-action-subtle"
                        [attr.aria-label]="'Agregar clase el ' + day.label.toLowerCase()"
                        (click)="openAdd({ weekday: day.key })"
                      >
                        <ui-icon name="plus" class="text-base" />
                      </button>
                    }
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

                @for (day of visibleDays(); track day.key) {
                  @let target = drag()?.moved && drag()?.weekday === day.key;
                  <div
                    class="schedule-day relative rounded-xl"
                    [attr.data-day]="day.key"
                    [style.height.px]="gridHeight()"
                    [style.background-color]="
                      target
                        ? dragClash()
                          ? 'color-mix(in oklab, var(--color-error) 6%, transparent)'
                          : 'var(--ui-action-subtle)'
                        : null
                    "
                    [style.background-image]="hourLines()"
                  >
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

                    @if (isEdit() && !drag()?.moved) {
                      @for (f of freeByDay()[day.key]; track f.startTime) {
                        <button
                          type="button"
                          class="absolute inset-x-0.5 flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-line-control bg-surface-1 text-[13px] font-semibold text-action hover:bg-action-subtle"
                          [style.top.px]="f.top"
                          [style.height.px]="f.height"
                          [attr.aria-label]="'Agregar clase el ' + f.label"
                          (click)="openAdd({ weekday: day.key, startTime: f.startTime, endTime: f.endTime })"
                        >
                          <ui-icon name="plus" class="text-base" />
                          Agregar
                        </button>
                      }
                    }

                    @for (b of blocksByDay()[day.key]; track b.id) {
                      @if (b.lifted) {
                        <div
                          aria-hidden="true"
                          class="absolute flex items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-line-control text-xs font-medium text-ink-subtle"
                          [style.top.px]="b.top"
                          [style.height.px]="b.height"
                          [style.left]="'calc(' + b.left + '% + 2px)'"
                          [style.width]="'calc(' + b.width + '% - 4px)'"
                        >
                          {{ b.name }}
                        </div>
                      } @else {
                        <button
                          type="button"
                          class="schedule-block absolute flex flex-col gap-0.5 overflow-hidden rounded-[10px] border border-ink-strong/10 px-2.5 py-1.5 text-left text-ink-strong outline-offset-1"
                          [class.cursor-grab]="isEdit()"
                          [class.outline-2]="b.selected || b.clash"
                          [class.outline-action]="b.selected && !b.clash"
                          [class.outline-error]="b.clash"
                          [style.top.px]="b.top"
                          [style.height.px]="b.height"
                          [style.left]="'calc(' + b.left + '% + 2px)'"
                          [style.width]="'calc(' + b.width + '% - 4px)'"
                          [style.background]="b.tint"
                          [style.touch-action]="isEdit() ? 'none' : null"
                          [attr.aria-pressed]="b.selected"
                          [attr.aria-label]="b.aria"
                          (pointerdown)="startDrag($event, b.schedule, 'move')"
                          (click)="onBlockClick(b.id)"
                        >
                          <span class="flex w-full items-center justify-between gap-1">
                            <span class="font-mono text-[11px] font-medium text-ink">{{ b.range }}</span>
                            @if (b.remote) {
                              <span class="rounded-full bg-surface-1 px-1.5 text-[10px] font-semibold text-ink"
                                >Remoto</span
                              >
                            } @else if (isEdit()) {
                              <ui-icon name="grip-vertical" class="text-sm text-ink-muted" />
                            }
                          </span>
                          <span class="w-full truncate text-[13px] leading-[17px] font-semibold">{{ b.name }}</span>
                          <span class="w-full truncate text-xs leading-[15px] font-medium text-ink-muted">{{
                            b.where
                          }}</span>
                          @if (isEdit()) {
                            <span
                              aria-hidden="true"
                              class="absolute inset-x-0 bottom-0 flex h-2.5 cursor-ns-resize items-center justify-center"
                              (pointerdown)="startDrag($event, b.schedule, 'resize')"
                            >
                              <span class="h-1 w-6 rounded-full bg-ink-strong/25"></span>
                            </span>
                          }
                        </button>
                      }
                    }

                    @if (floating(); as f) {
                      @if (f.weekday === day.key) {
                        <div
                          class="pointer-events-none absolute -inset-x-1 z-10"
                          [style.top.px]="f.top"
                          [style.height.px]="f.height"
                        >
                          <span
                            class="absolute bottom-full left-0 mb-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white"
                            [class.bg-error]="!!f.clash"
                            [class.bg-ink-strong]="!f.clash"
                          >
                            {{ f.chip }}
                          </span>
                          <div
                            class="flex h-full -rotate-[1.5deg] flex-col gap-0.5 rounded-[10px] border-2 px-2.5 py-1.5 shadow-xl"
                            [class.border-error]="!!f.clash"
                            [class.border-action]="!f.clash"
                            [style.background]="f.tint"
                          >
                            <span class="font-mono text-[11px] font-medium text-ink">{{ f.range }}</span>
                            <span class="truncate text-[13px] leading-[17px] font-semibold text-ink-strong">{{
                              f.name
                            }}</span>
                            <span class="truncate text-xs font-medium text-ink-muted">{{ f.where }}</span>
                          </div>
                        </div>
                      }
                    }

                    @if (nowTop() !== null && day.key === today() && !isEdit()) {
                      <div
                        class="absolute -left-1 right-0 z-[2] h-0.5 bg-[var(--ui-new)]"
                        [style.top.px]="nowTop()"
                        role="img"
                        [attr.aria-label]="'Ahora, ' + nowLabel()"
                      >
                        <span class="absolute -top-1 -left-0.5 size-2.5 rounded-full bg-[var(--ui-new)]"></span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- One day at a time (phone) -->
          <section aria-label="Horario del día" class="flex w-full flex-col gap-3 md:hidden">
            <div
              class="grid gap-1 rounded-full bg-surface-2 p-1"
              role="group"
              aria-label="Día"
              [style.grid-template-columns]="'repeat(' + visibleDays().length + ', minmax(0, 1fr))'"
            >
              @for (day of visibleDays(); track day.key) {
                @let on = mobileDay() === day.key;
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
              @if (row.kind === 'break') {
                <div class="flex items-center gap-2 px-1 text-xs font-medium text-ink-muted">
                  <span class="h-px flex-1 bg-line"></span>
                  {{ row.label }} · {{ row.start }} – {{ row.end }}
                  <span class="h-px flex-1 bg-line"></span>
                </div>
              } @else {
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
                    (click)="onMobileClick(row.schedule!)"
                  >
                    <span
                      class="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                      [style.background]="row.chip"
                    >
                      {{ row.code }}
                    </span>
                    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span class="text-[15px] leading-5 font-semibold text-ink-strong">{{ row.label }}</span>
                      <span class="truncate text-xs font-medium text-ink-muted">{{ row.where }}</span>
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
                    <ui-icon name="user" class="text-lg text-ink-muted" />{{ sel.teacher }}
                  </div>
                  <div class="flex items-center gap-2.5">
                    <ui-icon [name]="sel.schedule.remote ? 'video' : 'map-pin'" class="text-lg text-ink-muted" />
                    @if (sel.schedule.remote && sel.schedule.remoteLink) {
                      <a
                        class="link link-hover text-action"
                        [href]="sel.schedule.remoteLink"
                        target="_blank"
                        rel="noopener"
                      >
                        Remoto · abrir enlace
                      </a>
                    } @else {
                      {{ sel.where }}
                    }
                  </div>
                </div>
                @if (isEdit()) {
                  <div class="flex flex-wrap gap-2">
                    <button uiButton variant="primary" size="sm" type="button" (click)="openEdit(sel.schedule)">
                      Editar
                    </button>
                    <button uiButton size="sm" type="button" (click)="duplicate(sel.schedule)">Duplicar</button>
                    <button
                      uiButton
                      variant="ghost"
                      size="sm"
                      type="button"
                      class="text-error"
                      (click)="remove(sel.schedule)"
                    >
                      Eliminar
                    </button>
                  </div>
                } @else {
                  <a uiButton size="sm" class="self-start" [routerLink]="['/courses', sel.schedule.courseId]"
                    >Ir al curso</a
                  >
                }
              </section>
            }

            @if (isEdit()) {
              <section
                aria-label="Revisión del horario"
                class="flex flex-col gap-3 rounded-2xl border border-line bg-surface-1 px-6 py-5"
              >
                <h3 class="font-display text-lg font-medium text-ink-strong">Revisión</h3>
                @for (item of review(); track item.text) {
                  <div class="flex gap-2.5 text-sm text-ink">
                    <ui-icon
                      [name]="item.ok ? 'check' : 'triangle-alert'"
                      class="mt-px shrink-0 text-lg"
                      [class.text-success]="item.ok"
                      [class.text-warning]="!item.ok"
                    />
                    <span>
                      @if (item.lead) {
                        <b class="font-semibold text-warning">{{ item.lead }}</b>
                      }
                      {{ item.text }}
                    </span>
                  </div>
                }
              </section>
            }

            <section
              aria-label="Horas por semana"
              class="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-1 px-6 py-5"
            >
              <div class="flex items-baseline justify-between gap-2">
                <h3 class="font-display text-lg font-medium text-ink-strong">Horas por semana</h3>
                <span class="text-xs font-medium whitespace-nowrap text-ink-muted">{{ totalHours() }}</span>
              </div>
              @for (row of load(); track row.id) {
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
      }
    </div>

    @if (drawer(); as d) {
      <app-group-schedule-form
        [mode]="d.mode"
        [draft]="d.draft"
        [editingId]="d.editingId"
        [groupId]="id()!"
        [groupName]="groupName()"
        [courses]="coursesResource.value()"
        [groupSlots]="slotRefs()"
        [teacherBusy]="teacherBusy()"
        (closed)="drawer.set(null)"
        (saved)="onSaved($event)"
        (deleteRequested)="removeEditing()"
      />
    }

    @if (undoToast(); as t) {
      <div
        role="status"
        class="fixed bottom-7 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3.5 rounded-full bg-ink-strong py-3 pr-3 pl-4.5 text-sm text-surface-1 shadow-xl"
      >
        <ui-icon name="check" class="shrink-0 text-lg text-success" />
        <span class="truncate">{{ t.text }}</span>
        <button
          type="button"
          class="h-9 shrink-0 rounded-full bg-surface-1/15 px-3.5 text-sm font-semibold hover:bg-surface-1/25"
          (click)="runUndo()"
        >
          Deshacer
        </button>
      </div>
    }
  `,
})
export default class GroupSchedule {
  readonly id = input<string>();
  readonly groupName = input('');

  #http = inject(HttpClient);
  #toast = inject(Toast);
  #confirmation = inject(Confirmation);
  /** Adding, editing and moving classes needs MANAGE_SCHEDULES (the API refuses it otherwise). */
  #auth = inject(Auth);
  protected readonly canEdit = computed(() => this.#auth.hasPermission('MANAGE_SCHEDULES'));

  protected readonly modes = [
    { key: 'view' as const, label: 'Ver' },
    { key: 'edit' as const, label: 'Editar' },
  ];
  protected readonly mode = signal<'view' | 'edit'>('view');
  protected readonly isEdit = computed(() => this.canEdit() && this.mode() === 'edit');

  protected readonly selectedId = signal<string | null>(null);
  protected readonly drawer = signal<DrawerState | null>(null);
  protected readonly drag = signal<DragState | null>(null);
  protected readonly undoToast = signal<UndoToast | null>(null);
  #undoTimer: ReturnType<typeof setTimeout> | null = null;
  #suppressClick = false;

  /** Set in the browser only, so server and client render the same markup. */
  protected readonly now = signal<Date | null>(null);

  readonly schedulesResource = httpResource<Schedule[]>(() => {
    if (!isValidId(this.id())) return undefined;
    return `/api/v1/groups-schedules/by-class-group/${this.id()}`;
  });

  readonly coursesResource = httpResource<GroupCourse[]>(
    () => (this.canEdit() && isValidId(this.id()) ? `/api/v1/courses/by-group/${this.id()}` : undefined),
    { defaultValue: [] },
  );

  readonly teacherBusyResource = httpResource<TeacherBusySlot[]>(
    () =>
      this.canEdit() && isValidId(this.id())
        ? `/api/v1/groups-schedules/by-class-group/${this.id()}/teacher-busy`
        : undefined,
    { defaultValue: [] },
  );
  protected readonly teacherBusy = computed(() => this.teacherBusyResource.value() ?? []);

  /** The server's slots, updated in place while a move is saved. */
  readonly slots = linkedSignal<Schedule[] | undefined, Schedule[]>({
    source: () => this.schedulesResource.value(),
    computation: (source, previous) => source ?? previous?.value ?? [],
  });
  private readonly classes = computed(() => this.slots().filter((s) => !s.recess));

  protected readonly showWeekend = linkedSignal(() =>
    this.slots().some((s) => s.weekday === 'SATURDAY' || s.weekday === 'SUNDAY'),
  );
  protected readonly visibleDays = computed(() => WEEKDAYS.slice(0, this.showWeekend() ? 7 : 5));
  protected readonly columns = computed(() => `56px repeat(${this.visibleDays().length}, minmax(0, 1fr))`);

  protected readonly today = computed(() => {
    const now = this.now();
    return now ? weekdayOf(now) : null;
  });
  protected readonly mobileDay = linkedSignal<WeekdayKey>(() => {
    const today = this.today();
    return today && this.visibleDays().some((d) => d.key === today) ? today : 'MONDAY';
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
  protected readonly hourLines = computed(
    () =>
      `repeating-linear-gradient(to bottom, var(--ui-line) 0, var(--ui-line) 1px, transparent 1px, transparent ${60 * PX_PER_MINUTE}px)`,
  );

  private top(time: string) {
    return (toMinutes(time) - this.window().start * 60) * PX_PER_MINUTE;
  }
  private height(start: string, end: string) {
    return (toMinutes(end) - toMinutes(start)) * PX_PER_MINUTE - 4;
  }

  /** Breaks every school day shares (inferred), plus slots saved as recess. */
  protected readonly breaks = computed(() => {
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

  private readonly free = computed(() =>
    freeSlots(
      this.slots(),
      this.visibleDays().map((d) => d.key),
    ),
  );
  protected readonly freeByDay = computed(() => {
    const byDay = {} as Record<
      WeekdayKey,
      Array<{ startTime: string; endTime: string; top: number; height: number; label: string }>
    >;
    for (const day of WEEKDAYS) byDay[day.key] = [];
    for (const f of this.free()) {
      byDay[f.weekday].push({
        startTime: f.startTime,
        endTime: f.endTime,
        top: this.top(f.startTime),
        height: this.height(f.startTime, f.endTime),
        label: describeRange(f),
      });
    }
    return byDay;
  });

  private color(schedule: { course: { id: string; color: string | null } }, amount: number) {
    const key = resolveCourseColor(schedule.course.id, schedule.course.color);
    return `color-mix(in oklab, ${courseColorVar(key)} ${amount}%, var(--ui-surface-1))`;
  }

  private where(s: Schedule) {
    const place = s.remote ? 'Remoto' : s.location || 'Sin ubicación';
    return `${place} · ${teacherName(s.course.teacher)}`;
  }

  /** The group's classes as the form's and the drag's clash check reads them. */
  protected readonly slotRefs = computed<GroupSlotRef[]>(() =>
    this.classes().map((s) => ({
      id: s.id,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
      label: subjectName(s.course),
    })),
  );

  protected readonly blocksByDay = computed(() => {
    const drag = this.drag();
    const clashId = drag?.moved ? this.dragClashRef()?.id : null;
    const byDay = {} as Record<WeekdayKey, Array<ReturnType<GroupSchedule['block']>>>;
    for (const day of WEEKDAYS) {
      const placed = layoutDay(
        this.classes().filter((s) => s.weekday === day.key),
        this.window(),
        PX_PER_MINUTE,
      );
      byDay[day.key] = placed.map((p) =>
        this.block(p.item, p.top, p.height - 4, p.left, p.width, {
          lifted: !!drag?.moved && drag.id === p.item.id,
          clash: clashId === p.item.id,
        }),
      );
    }
    return byDay;
  });

  private block(
    s: Schedule,
    top: number,
    height: number,
    left: number,
    width: number,
    flags: { lifted: boolean; clash: boolean },
  ) {
    const name = subjectName(s.course);
    return {
      id: s.id,
      schedule: s,
      name,
      range: `${s.startTime} – ${s.endTime}`,
      where: this.where(s),
      remote: s.remote,
      tint: this.color(s, 14),
      top,
      height,
      left,
      width,
      selected: this.selectedId() === s.id,
      aria: `${name}, ${dayLabel(s.weekday)} ${s.startTime} a ${s.endTime}`,
      ...flags,
    };
  }

  // ---- drag & resize ------------------------------------------------------------------------

  private readonly dragged = computed(() => {
    const id = this.drag()?.id;
    return id ? this.slots().find((s) => s.id === id) : undefined;
  });

  private readonly dragCandidate = computed<TimeRange | null>(() => {
    const d = this.drag();
    if (!d?.moved) return null;
    return { id: d.id, weekday: d.weekday, startTime: toTime(d.start), endTime: toTime(d.end) };
  });

  private readonly dragClashRef = computed(() => {
    const candidate = this.dragCandidate();
    return candidate ? firstClash(candidate, this.slotRefs()) : undefined;
  });

  /** Why the class can't go where it's being dragged, or null when it can. */
  protected readonly dragClash = computed(() => {
    const candidate = this.dragCandidate();
    const slot = this.dragged();
    if (!candidate || !slot) return null;
    const own = this.dragClashRef();
    if (own) return `${this.groupName() || 'El grupo'} ya tiene ${own.label} el ${describeRange(own)}.`;
    const teacherId = slot.course.teacherId;
    if (teacherId) {
      const busy = firstClash(
        candidate,
        this.teacherBusy().filter((b) => b.teacherId === teacherId),
      );
      if (busy) return `${teacherName(slot.course.teacher)} está con ${busy.groupName} el ${describeRange(busy)}.`;
    }
    return null;
  });

  protected readonly floating = computed(() => {
    const candidate = this.dragCandidate();
    const slot = this.dragged();
    if (!candidate || !slot) return null;
    const own = this.dragClashRef();
    const clash = this.dragClash();
    return {
      weekday: candidate.weekday,
      top: this.top(candidate.startTime),
      height: this.height(candidate.startTime, candidate.endTime),
      name: subjectName(slot.course),
      where: this.where(slot),
      range: `${candidate.startTime} – ${candidate.endTime}`,
      tint: this.color(slot, 14),
      clash,
      chip: clash
        ? own
          ? `Choca con ${own.label}`
          : 'El docente está con otro grupo'
        : `${dayLabel(candidate.weekday)} · ${candidate.startTime} – ${candidate.endTime}`,
    };
  });

  protected startDrag(event: PointerEvent, slot: Schedule, kind: 'move' | 'resize') {
    if (!this.isEdit() || event.button !== 0) return;
    event.stopPropagation();
    const column = (event.currentTarget as HTMLElement).closest('.schedule-day') as HTMLElement | null;
    if (!column) return;
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    const pointer = this.pointerMinutes(event.clientY, column);
    this.drag.set({
      id: slot.id,
      kind,
      startX: event.clientX,
      startY: event.clientY,
      offset: pointer - start,
      duration: end - start,
      moved: false,
      weekday: slot.weekday,
      start,
      end,
    });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.cancelDrag);
    document.addEventListener('keydown', this.onKeydown);
  }

  private pointerMinutes(clientY: number, column: HTMLElement) {
    return (clientY - column.getBoundingClientRect().top) / PX_PER_MINUTE + this.window().start * 60;
  }

  private onPointerMove = (event: PointerEvent) => {
    const d = this.drag();
    if (!d) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
    const { start: winStart, end: winEnd } = this.window();
    const columns = document.elementsFromPoint(event.clientX, event.clientY);
    const column = columns
      .map((el) => (el as HTMLElement).closest?.('.schedule-day') as HTMLElement | null)
      .find(Boolean);
    if (d.kind === 'resize') {
      const own = document.querySelector<HTMLElement>(`.schedule-day[data-day="${d.weekday}"]`);
      if (!own) return;
      const end = clamp(snap(this.pointerMinutes(event.clientY, own), SNAP_MINUTES), d.start + 10, winEnd * 60);
      this.drag.set({ ...d, moved: true, end });
      return;
    }
    const weekday = (column?.dataset['day'] as WeekdayKey | undefined) ?? d.weekday;
    const target = column ?? document.querySelector<HTMLElement>(`.schedule-day[data-day="${weekday}"]`);
    if (!target) return;
    const start = clamp(
      snap(this.pointerMinutes(event.clientY, target) - d.offset, SNAP_MINUTES),
      winStart * 60,
      winEnd * 60 - d.duration,
    );
    this.drag.set({ ...d, moved: true, weekday, start, end: start + d.duration });
  };

  private onPointerUp = () => {
    const d = this.drag();
    const slot = this.dragged();
    const clash = this.dragClash();
    this.stopListening();
    this.drag.set(null);
    if (!d?.moved || !slot) return;
    this.suppressNextClick();
    if (clash) {
      this.#toast.showWarning(`No se movió: ${clash}`);
      return;
    }
    const next = { weekday: d.weekday, startTime: toTime(d.start), endTime: toTime(d.end) };
    if (next.weekday === slot.weekday && next.startTime === slot.startTime && next.endTime === slot.endTime) return;
    const before = { weekday: slot.weekday, startTime: slot.startTime, endTime: slot.endTime };
    const name = subjectName(slot.course);
    const text =
      d.kind === 'resize'
        ? `${name}: ahora ${next.startTime} – ${next.endTime}`
        : `${name} movida al ${dayLabel(next.weekday).toLowerCase()}, ${next.startTime} – ${next.endTime}`;
    this.selectedId.set(slot.id);
    void this.patchTimes(slot.id, next, text, () => this.patchTimes(slot.id, before, 'Cambio deshecho'));
  };

  private cancelDrag = () => {
    this.stopListening();
    if (this.drag()?.moved) this.suppressNextClick();
    this.drag.set(null);
  };

  /** The click that ends a drag is not a selection; the block it lands on may not even exist. */
  private suppressNextClick() {
    this.#suppressClick = true;
    setTimeout(() => (this.#suppressClick = false));
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelDrag();
    }
  };

  private stopListening() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.cancelDrag);
    document.removeEventListener('keydown', this.onKeydown);
  }

  /** Moves a slot in place right away, then saves; a refusal puts it back. */
  private async patchTimes(
    id: string,
    times: { weekday: WeekdayKey; startTime: string; endTime: string },
    text: string,
    undo?: () => void,
  ) {
    this.slots.update((list) => list.map((s) => (s.id === id ? { ...s, ...times } : s)));
    try {
      await firstValueFrom(this.#http.patch('/api/v1/groups-schedules', { id, ...times }));
      if (undo) this.showUndo(text, undo);
      else this.#toast.showSuccess(text);
      this.teacherBusyResource.reload();
    } catch (error) {
      this.#toast.showError(errorMessage(error));
      this.schedulesResource.reload();
    }
  }

  protected onBlockClick(id: string) {
    if (this.#suppressClick) {
      this.#suppressClick = false;
      return;
    }
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  protected onMobileClick(slot: Schedule) {
    this.selectedId.set(slot.id);
    if (this.isEdit()) this.openEdit(slot);
  }

  // ---- side panel ---------------------------------------------------------------------------

  protected readonly selected = computed(() => {
    if (this.drag()?.moved) return null;
    const s = this.slots().find((x) => x.id === this.selectedId());
    if (!s) return null;
    const minutes = toMinutes(s.endTime) - toMinutes(s.startTime);
    return {
      schedule: s,
      code: courseCode(s.course),
      chip: this.color(s, 26),
      name: subjectName(s.course),
      teacher: teacherName(s.course.teacher),
      when: `${dayLabel(s.weekday)}, ${s.startTime} – ${s.endTime} (${formatDuration(minutes)})`,
      where: s.remote ? 'Remoto' : s.location || 'Sin ubicación',
    };
  });

  protected readonly review = computed(() => {
    const items: Array<{ ok: boolean; lead?: string; text: string }> = [];
    const pairs = clashingPairs(this.slotRefs());
    if (!pairs.length) items.push({ ok: true, text: 'Sin choques entre clases del grupo' });
    for (const [a, b] of pairs.slice(0, 3)) {
      items.push({ ok: false, lead: 'Choque:', text: `${a.label} y ${b.label}, ${describeRange(a)}` });
    }
    const teacherClashes = this.classes()
      .map((s) => {
        const teacherId = s.course.teacherId;
        if (!teacherId) return null;
        const busy = firstClash(
          s,
          this.teacherBusy().filter((b) => b.teacherId === teacherId),
        );
        return busy ? { s, busy } : null;
      })
      .filter((x) => !!x);
    if (!teacherClashes.length) items.push({ ok: true, text: 'Ningún docente está en dos grupos a la vez' });
    for (const { s, busy } of teacherClashes.slice(0, 3)) {
      items.push({
        ok: false,
        lead: 'Docente:',
        text: `${teacherName(s.course.teacher)} también está con ${busy.groupName} el ${describeRange(s)}`,
      });
    }
    const free = this.free();
    if (free.length) {
      const more = free.length > 1 ? ` y ${free.length - 1} más` : '';
      items.push({ ok: false, lead: 'Pendiente:', text: `${describeRange(free[0])} sin clase asignada${more}` });
    }
    return items;
  });

  protected readonly load = computed(() => {
    const totals = minutesBy(this.classes(), (s) => s.courseId);
    const sample = new Map(this.classes().map((s) => [s.courseId, s]));
    return [...totals]
      .flatMap(([id, minutes]) => {
        const s = sample.get(id);
        if (!s) return [];
        const name = subjectName(s.course);
        return [
          { id, minutes, code: courseCode(s.course), name, chip: this.color(s, 26), hours: formatDuration(minutes) },
        ];
      })
      .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
  });
  protected readonly totalHours = computed(
    () => `${formatDuration(this.load().reduce((sum, r) => sum + r.minutes, 0))} en total`,
  );

  // ---- phone list ---------------------------------------------------------------------------

  protected readonly mobileRows = computed(() => {
    const day = this.mobileDay();
    const now = this.now();
    const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
    const isToday = day === this.today();
    const classes = this.classes()
      .filter((s) => s.weekday === day)
      .map((s) => ({
        kind: 'class' as const,
        key: s.id,
        start: s.startTime,
        end: s.endTime,
        label: subjectName(s.course),
        code: courseCode(s.course),
        chip: this.color(s, 26),
        where: this.where(s),
        selected: this.selectedId() === s.id,
        now: isToday && nowMin >= toMinutes(s.startTime) && nowMin < toMinutes(s.endTime),
        schedule: s as Schedule | undefined,
      }));
    if (!classes.length) return [];
    const first = toMinutes(classes.reduce((a, b) => (a.start < b.start ? a : b)).start);
    const last = toMinutes(classes.reduce((a, b) => (a.end > b.end ? a : b)).end);
    const breaks = day === 'SATURDAY' || day === 'SUNDAY' ? [] : this.breaks();
    const breakRows = breaks
      .filter((b) => toMinutes(b.startTime) >= first && toMinutes(b.endTime) <= last)
      .map((b) => ({
        kind: 'break' as const,
        key: `break-${b.startTime}`,
        start: b.startTime,
        end: b.endTime,
        label: b.label,
        code: '',
        chip: '',
        where: '',
        selected: false,
        now: false,
        schedule: undefined,
      }));
    return [...classes, ...breakRows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  });
  protected readonly mobileCount = computed(() => this.mobileRows().filter((r) => r.kind === 'class').length);
  protected dayName(key: WeekdayKey) {
    return dayLabel(key);
  }

  // ---- now line -----------------------------------------------------------------------------

  protected readonly nowTop = computed(() => {
    const now = this.now();
    if (!now) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const { start, end } = this.window();
    if (minutes < start * 60 || minutes > end * 60) return null;
    return (minutes - start * 60) * PX_PER_MINUTE;
  });
  protected readonly nowLabel = computed(() => {
    const now = this.now();
    return now ? toTime(now.getHours() * 60 + now.getMinutes()) : '';
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.now.set(new Date());
      const timer = setInterval(() => this.now.set(new Date()), 60_000);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
    destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') this.stopListening();
      if (this.#undoTimer) clearTimeout(this.#undoTimer);
    });
  }

  // ---- actions ------------------------------------------------------------------------------

  protected setMode(mode: 'view' | 'edit') {
    this.mode.set(mode);
  }

  protected print() {
    window.print();
  }

  protected startFirst() {
    this.mode.set('edit');
    this.openAdd();
  }

  protected openAdd(at: { weekday?: WeekdayKey; startTime?: string; endTime?: string } = {}) {
    this.drawer.set({
      mode: 'add',
      editingId: null,
      draft: {
        courseId: '',
        weekdays: at.weekday ? [at.weekday] : [],
        startTime: at.startTime ?? '07:00',
        endTime: at.endTime ?? '07:45',
        location: '',
        remote: false,
        remoteLink: '',
      },
    });
  }

  private draftOf(s: Schedule, weekdays: WeekdayKey[]): ScheduleDraft {
    return {
      courseId: s.courseId,
      weekdays,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      remote: s.remote,
      remoteLink: s.remoteLink,
    };
  }

  protected openEdit(s: Schedule) {
    this.drawer.set({ mode: 'edit', editingId: s.id, draft: this.draftOf(s, [s.weekday]) });
  }

  /** Same class, same times, no day yet: the user picks where the copy goes. */
  protected duplicate(s: Schedule) {
    this.drawer.set({ mode: 'add', editingId: null, draft: this.draftOf(s, []) });
  }

  protected onSaved(result: ScheduleFormResult) {
    this.drawer.set(null);
    this.reload();
    if (result.kind === 'added') {
      this.showUndo(result.message, () => void this.deleteIds(result.ids, 'Clase quitada del horario'));
    } else {
      const { id, before } = result;
      this.selectedId.set(id);
      this.showUndo(result.message, async () => {
        try {
          await firstValueFrom(
            this.#http.patch('/api/v1/groups-schedules', {
              id,
              weekday: before.weekday,
              startTime: before.startTime,
              endTime: before.endTime,
              courseId: before.courseId,
              location: before.location,
              remote: before.remote,
              remoteLink: before.remoteLink,
            }),
          );
          this.#toast.showSuccess('Cambio deshecho');
        } catch (error) {
          this.#toast.showError(errorMessage(error));
        }
        this.reload();
      });
    }
  }

  protected removeEditing() {
    const id = this.drawer()?.editingId;
    const slot = this.slots().find((s) => s.id === id);
    if (slot) this.remove(slot);
  }

  protected remove(s: Schedule) {
    const name = subjectName(s.course);
    this.#confirmation
      .confirm({
        title: '¿Eliminar esta clase del horario?',
        message: `${name}, ${dayLabel(s.weekday).toLowerCase()} de ${s.startTime} a ${s.endTime}. Solo se quita este bloque de la semana: el curso, sus tareas y calificaciones no cambian.`,
        confirmText: 'Eliminar',
      })
      .subscribe(async (ok) => {
        if (!ok) return;
        this.drawer.set(null);
        try {
          await firstValueFrom(this.#http.delete(`/api/v1/groups-schedules/${s.id}`));
          this.selectedId.set(null);
          this.slots.update((list) => list.filter((x) => x.id !== s.id));
          this.reload();
          this.showUndo(`${name} eliminada del horario`, () => void this.restore(s));
        } catch (error) {
          this.#toast.showError(errorMessage(error));
        }
      });
  }

  private async restore(s: Schedule) {
    try {
      const created = await firstValueFrom(
        this.#http.post<{ id: string }>('/api/v1/groups-schedules', {
          classGroupId: s.classGroupId,
          courseId: s.courseId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
          remote: s.remote,
          remoteLink: s.remoteLink,
        }),
      );
      this.selectedId.set(created.id);
      this.#toast.showSuccess('Clase restaurada');
    } catch (error) {
      this.#toast.showError(errorMessage(error));
    }
    this.reload();
  }

  private async deleteIds(ids: string[], text: string) {
    try {
      for (const id of ids) await firstValueFrom(this.#http.delete(`/api/v1/groups-schedules/${id}`));
      this.#toast.showSuccess(text);
    } catch (error) {
      this.#toast.showError(errorMessage(error));
    }
    this.reload();
  }

  private reload() {
    this.schedulesResource.reload();
    this.teacherBusyResource.reload();
  }

  private showUndo(text: string, undo: () => void) {
    if (this.#undoTimer) clearTimeout(this.#undoTimer);
    this.undoToast.set({ text, undo });
    this.#undoTimer = setTimeout(() => this.undoToast.set(null), 8000);
  }

  protected runUndo() {
    const toast = this.undoToast();
    if (this.#undoTimer) clearTimeout(this.#undoTimer);
    this.undoToast.set(null);
    toast?.undo();
  }
}
