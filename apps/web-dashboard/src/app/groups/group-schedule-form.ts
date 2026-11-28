import { Button, Icon, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { GroupCourse, ScheduleDraft, subjectName, TeacherBusySlot, teacherName } from './group-schedule.types';
import {
  describeRange,
  firstClash,
  formatDuration,
  TimeRange,
  toMinutes,
  toTime,
  WEEKDAYS,
  WeekdayKey,
} from './schedule-grid';

/** A slot of this group, for the live clash check. */
export type GroupSlotRef = TimeRange & { id: string; label: string };

export type ScheduleFormResult =
  | { kind: 'added'; ids: string[]; message: string }
  | { kind: 'updated'; id: string; before: ScheduleDraft & { weekday: WeekdayKey }; message: string };

/**
 * Side panel to add or edit a class of the group's weekly schedule. Adding can create the same
 * class on several days at once. Checks clashes with the group's other classes and with the
 * teacher's classes in other groups as you type; the API checks again on save.
 */
@Component({
  selector: 'app-group-schedule-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, UiField, UiInput, UiSelect, FormField],
  template: `
    <dialog
      #dialog
      class="schedule-drawer"
      aria-labelledby="schedule-form-title"
      (cancel)="$event.preventDefault(); closed.emit()"
    >
      <form class="flex h-full flex-col" (submit)="save($event)" novalidate>
        <header class="flex items-start justify-between gap-3 border-b border-line px-6 pt-6 pb-4 sm:px-7">
          <div class="flex flex-col gap-1">
            <h2 id="schedule-form-title" class="font-display text-xl font-medium text-ink-strong">
              {{ mode() === 'add' ? 'Agregar clase' : 'Editar clase' }}
            </h2>
            <span class="text-sm text-ink-muted">{{ groupName() }} · Horario semanal</span>
          </div>
          <button uiButton type="button" iconOnly aria-label="Cerrar" (click)="closed.emit()">
            <ui-icon name="x" class="text-lg" />
          </button>
        </header>

        <div class="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5 sm:px-7">
          <ui-field label="Curso" [field]="form.courseId" [hint]="courseHint()">
            <select uiSelect [formField]="form.courseId">
              <option value="" disabled>Elegir un curso del grupo…</option>
              @for (course of courses(); track course.id) {
                <option [value]="course.id">{{ courseLabel(course) }}</option>
              }
            </select>
          </ui-field>

          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-semibold text-ink-strong">
              {{ mode() === 'add' ? 'Días' : 'Día' }}<span class="ml-0.5 text-error" aria-hidden="true">*</span>
            </legend>
            <div class="grid grid-cols-7 gap-1.5">
              @for (day of weekdays; track day.key) {
                @let on = model().weekdays.includes(day.key);
                <button
                  type="button"
                  class="h-11 rounded-full border text-sm font-semibold transition-colors"
                  [class]="
                    on
                      ? 'border-action bg-action text-action-content'
                      : 'border-line-control bg-surface-1 text-ink hover:bg-surface-2'
                  "
                  [attr.aria-pressed]="on"
                  [attr.aria-label]="day.label"
                  (click)="toggleDay(day.key)"
                >
                  {{ day.chip }}
                </button>
              }
            </div>
            @if (daysError()) {
              <p class="text-xs text-error" aria-live="polite">{{ daysError() }}</p>
            } @else if (mode() === 'add') {
              <p class="text-xs text-ink-muted">Elige varios días para crear la misma clase en cada uno.</p>
            }
          </fieldset>

          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-3">
              <ui-field label="Inicio" [field]="form.startTime">
                <input uiInput type="time" step="300" [formField]="form.startTime" />
              </ui-field>
              <ui-field label="Fin" [field]="form.endTime" [error]="rangeError()">
                <input uiInput type="time" step="300" [formField]="form.endTime" />
              </ui-field>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="mr-1 text-xs font-medium text-ink-muted">Duración: {{ duration() }}</span>
              @for (minutes of [45, 90]; track minutes) {
                <button
                  type="button"
                  class="h-8 rounded-full border border-line bg-surface-1 px-3 text-xs font-semibold text-ink hover:bg-surface-2"
                  (click)="setDuration(minutes)"
                >
                  {{ minutes }} min
                </button>
              }
            </div>
          </div>

          <fieldset class="flex flex-col gap-3">
            <legend class="mb-2 text-sm font-semibold text-ink-strong">Modalidad</legend>
            <div class="inline-flex self-start gap-1 rounded-full bg-surface-2 p-1" role="group" aria-label="Modalidad">
              @for (opt of modalities; track opt.remote) {
                @let on = model().remote === opt.remote;
                <button
                  type="button"
                  class="h-9 rounded-full px-4 text-sm font-semibold"
                  [class]="on ? 'bg-surface-1 text-ink-strong shadow-sm' : 'text-ink-muted'"
                  [attr.aria-pressed]="on"
                  (click)="setRemote(opt.remote)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
            @if (model().remote) {
              <ui-field
                label="Enlace de la clase"
                [field]="form.remoteLink"
                hint="Estudiantes y familias lo ven en el horario a la hora de la clase."
              >
                <input uiInput type="url" placeholder="https://meet.google.com/…" [formField]="form.remoteLink" />
              </ui-field>
            } @else {
              <ui-field label="Ubicación" [field]="form.location" optional>
                <input uiInput type="text" placeholder="Ej. Aula 12, Laboratorio 2" [formField]="form.location" />
              </ui-field>
            }
          </fieldset>

          @if (clash(); as message) {
            <div role="alert" class="flex gap-2.5 rounded-xl bg-error/10 px-3.5 py-3 text-sm text-ink">
              <ui-icon name="circle-x" class="mt-0.5 shrink-0 text-lg text-error" />
              <span><b class="font-semibold text-error">Choque de horario.</b> {{ message }}</span>
            </div>
          } @else if (freeText()) {
            <div role="status" class="flex gap-2.5 rounded-xl bg-success/10 px-3.5 py-3 text-sm text-ink">
              <ui-icon name="check" class="mt-0.5 shrink-0 text-lg text-success" />
              <span><b class="font-semibold text-success">Sin choques.</b> {{ freeText() }}</span>
            </div>
          }
        </div>

        <footer class="flex items-center justify-between gap-2 border-t border-line px-6 pt-4 pb-6 sm:px-7">
          <div>
            @if (mode() === 'edit') {
              <button uiButton variant="ghost" type="button" class="text-error" (click)="deleteRequested.emit()">
                Eliminar clase
              </button>
            }
          </div>
          <div class="flex gap-2">
            <button uiButton type="button" (click)="closed.emit()">Cancelar</button>
            <button uiButton variant="primary" type="submit" [loading]="saving()" [disabled]="!!clash()">
              {{ mode() === 'add' ? 'Agregar al horario' : 'Guardar cambios' }}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  `,
  styles: `
    .schedule-drawer {
      margin: 0 0 0 auto;
      width: min(460px, 100vw);
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      padding: 0;
      border: 0;
      background: var(--ui-surface-1);
      color: var(--ui-ink);
      box-shadow: -16px 0 40px rgb(11 21 48 / 0.18);
    }
    .schedule-drawer::backdrop {
      background: rgb(11 21 48 / 0.42);
    }
  `,
})
export default class GroupScheduleForm {
  readonly mode = input<'add' | 'edit'>('add');
  readonly groupId = input.required<string>();
  readonly groupName = input('');
  readonly courses = input<GroupCourse[]>([]);
  readonly draft = input.required<ScheduleDraft>();
  /** The slot being edited. */
  readonly editingId = input<string | null>(null);
  readonly groupSlots = input<GroupSlotRef[]>([]);
  readonly teacherBusy = input<TeacherBusySlot[]>([]);

  readonly closed = output<void>();
  readonly saved = output<ScheduleFormResult>();
  readonly deleteRequested = output<void>();

  #http = inject(HttpClient);
  #toast = inject(Toast);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly weekdays = WEEKDAYS;
  protected readonly modalities = [
    { remote: false, label: 'Presencial' },
    { remote: true, label: 'Remoto' },
  ];
  protected readonly saving = signal(false);
  private readonly submitted = signal(false);

  protected readonly model = signal<ScheduleDraft>({
    courseId: '',
    weekdays: [],
    startTime: '',
    endTime: '',
    location: '',
    remote: false,
    remoteLink: '',
  });

  protected readonly form = form(this.model, (path) => {
    required(path.courseId, { message: 'Elige un curso' });
    required(path.startTime, { message: 'Indica la hora de inicio' });
    required(path.endTime, { message: 'Indica la hora de fin' });
  });

  constructor() {
    afterNextRender(() => {
      this.model.set({ ...this.draft(), weekdays: [...this.draft().weekdays] });
      const dialog = this.dialog().nativeElement;
      // jsdom (unit tests) has no showModal; every supported browser does.
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  }

  private readonly course = computed(() => this.courses().find((c) => c.id === this.model().courseId));

  protected readonly courseHint = computed(() => {
    const course = this.course();
    if (!course) return `Solo aparecen los cursos de ${this.groupName() || 'este grupo'}.`;
    return `${teacherName(course.teacher)} · el docente se toma del curso`;
  });

  protected courseLabel(course: GroupCourse) {
    return `${subjectName(course)} — ${teacherName(course.teacher)}`;
  }

  protected readonly validRange = computed(() => {
    const { startTime, endTime } = this.model();
    return !!startTime && !!endTime && toMinutes(startTime) < toMinutes(endTime);
  });

  protected readonly rangeError = computed(() => {
    const { startTime, endTime } = this.model();
    return startTime && endTime && !this.validRange() ? 'Debe ser posterior al inicio' : null;
  });

  protected readonly daysError = computed(() =>
    this.submitted() && !this.model().weekdays.length ? 'Elige al menos un día' : null,
  );

  protected readonly duration = computed(() => {
    const { startTime, endTime } = this.model();
    return this.validRange() ? formatDuration(toMinutes(endTime) - toMinutes(startTime)) : '—';
  });

  /** The first clash of the class on any chosen day, with the group or with the teacher. */
  protected readonly clash = computed(() => {
    if (!this.validRange()) return null;
    const { weekdays, startTime, endTime } = this.model();
    const id = this.editingId() ?? undefined;
    const teacherId = this.course()?.teacherId;
    for (const weekday of weekdays) {
      const candidate = { id, weekday, startTime, endTime };
      const own = firstClash(candidate, this.groupSlots());
      if (own) return `${this.groupName()} ya tiene ${own.label} el ${describeRange(own)}.`;
      if (teacherId) {
        const busy = firstClash(
          candidate,
          this.teacherBusy().filter((b) => b.teacherId === teacherId),
        );
        if (busy) return `${teacherName(this.course()?.teacher)} está con ${busy.groupName} el ${describeRange(busy)}.`;
      }
    }
    return null;
  });

  protected readonly freeText = computed(() => {
    const { weekdays, startTime, endTime } = this.model();
    if (!this.validRange() || !weekdays.length) return null;
    const days = WEEKDAYS.filter((d) => weekdays.includes(d.key)).map((d) => d.label.toLowerCase());
    const when = `${days.length > 1 ? days.slice(0, -1).join(', ') + ' y ' + days[days.length - 1] : days[0]} de ${startTime} a ${endTime}`;
    const course = this.course();
    return course?.teacherId
      ? `${this.groupName()} y ${teacherName(course.teacher)} están libres el ${when}.`
      : `${this.groupName()} está libre el ${when}.`;
  });

  protected toggleDay(key: WeekdayKey) {
    this.model.update((m) => {
      if (this.mode() === 'edit') return { ...m, weekdays: [key] };
      const has = m.weekdays.includes(key);
      return { ...m, weekdays: has ? m.weekdays.filter((d) => d !== key) : [...m.weekdays, key] };
    });
  }

  protected setDuration(minutes: number) {
    const start = this.model().startTime;
    if (!start) return;
    const end = Math.min(toMinutes(start) + minutes, 23 * 60 + 55);
    this.model.update((m) => ({ ...m, endTime: toTime(end) }));
  }

  protected setRemote(remote: boolean) {
    this.model.update((m) => ({ ...m, remote }));
  }

  protected save(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    submit(this.form, async () => {
      if (!this.model().weekdays.length || !this.validRange() || this.clash()) return;
      this.saving.set(true);
      try {
        const result = this.mode() === 'add' ? await this.create() : await this.update();
        if (result) this.saved.emit(result);
      } finally {
        this.saving.set(false);
      }
    });
  }

  private body() {
    const m = this.model();
    return {
      classGroupId: this.groupId(),
      courseId: m.courseId,
      startTime: m.startTime,
      endTime: m.endTime,
      remote: m.remote,
      location: m.remote ? '' : m.location.trim(),
      remoteLink: m.remote ? m.remoteLink.trim() : '',
    };
  }

  private async create(): Promise<ScheduleFormResult | null> {
    const ids: string[] = [];
    const days = WEEKDAYS.filter((d) => this.model().weekdays.includes(d.key));
    for (const day of days) {
      try {
        const created = await firstValueFrom(
          this.#http.post<{ id: string }>('/api/v1/groups-schedules', { ...this.body(), weekday: day.key }),
        );
        ids.push(created.id);
      } catch (error) {
        this.#toast.showError(`${day.label}: ${errorMessage(error)}`);
        // Keep the days that worked; let the user fix the rest.
        if (ids.length) {
          this.saved.emit({ kind: 'added', ids, message: `Clase agregada en ${ids.length} día(s)` });
        }
        return null;
      }
    }
    return {
      kind: 'added',
      ids,
      message: ids.length > 1 ? `Clase agregada en ${ids.length} días` : 'Clase agregada al horario',
    };
  }

  private async update(): Promise<ScheduleFormResult | null> {
    const id = this.editingId();
    if (!id) return null;
    const before = { ...this.draft(), weekday: this.draft().weekdays[0] };
    try {
      await firstValueFrom(
        this.#http.patch('/api/v1/groups-schedules', { ...this.body(), id, weekday: this.model().weekdays[0] }),
      );
      return { kind: 'updated', id, before, message: 'Cambios guardados' };
    } catch (error) {
      this.#toast.showError(errorMessage(error));
      return null;
    }
  }
}

/** The API's message (e.g. a clash refused with 409), else a generic one. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body?.message[0] : body?.message;
    return message || 'No se pudo guardar el horario';
  }
  return error instanceof Error ? error.message : 'No se pudo guardar el horario';
}
