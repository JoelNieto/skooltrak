import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Icon,
  Modal,
  Toast,
  UiField,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
} from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { formatScore, parseCell } from '@/shared';
import { firstValueFrom } from 'rxjs';
import GradesForm from '../grades/grades-form';
import { applyEdits, cellKey, changedCells, Edits, readBackup, viewKey, writeBackup } from './gradebook-draft';
import { UnsavedChanges } from './unsaved-changes';

/** BR-ASM-001.5 */
export type GradebookStatus = 'AT_RISK' | 'WATCH' | 'ON_TRACK';

/** `GET /api/v1/gradebook/:courseId` (ASM-001-S02, FR-ASM-001.2 .3 .5). */
export interface Gradebook {
  course: { id: string; name: string };
  metric: { minimum: number; maximum: number; minimumApproval: number; minimumExcellence: number } | null;
  periods: { id: string; name: string; startDate: string; endDate: string }[];
  periodId: string | null;
  /** `id: null` is "Sin grupo", requested as `classGroupId=none`. */
  classGroups: { id: string | null; name: string; studentCount: number }[];
  classGroupId: string | null;
  buckets: {
    id: string;
    name: string;
    weight: number;
    columns: { id: string; title: string; date: string; published: boolean }[];
  }[];
  rows: {
    student: { id: string; firstName: string; name: string; initials: string; color: string | null };
    cells: { gradeId: string; studentGradeId: string | null; score: number | null; updatedAt: string | null }[];
    average: number | null;
    status: GradebookStatus | null;
  }[];
  footer: { columns: { gradeId: string; average: number | null }[]; average: number | null };
  includesDrafts: boolean;
}

/** `PUT /api/v1/gradebook/:courseId/cells` refusals (BR-ASM-001.2, .7). */
type SaveRefusal = {
  message: string;
  cells: { gradeId: string; studentId: string; reason?: string; score?: number | null; updatedAt?: string | null }[];
};

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'conflict' } | { kind: 'error'; message: string };

const STATUS: Record<GradebookStatus, { label: string; tone: BadgeTone }> = {
  AT_RISK: { label: 'En riesgo', tone: 'danger' },
  WATCH: { label: 'Atención', tone: 'warning' },
  ON_TRACK: { label: 'Al día', tone: 'success' },
};
const NO_GROUP = 'none';
let nextId = 0;

/**
 * A course's gradebook (ASM-001-S02, S03): one group's students for one period, the period's columns
 * grouped by bucket, each student's average (BR .4, drafts included) and status (BR .5), and the
 * group's averages. Draft columns are typed into from the keyboard and saved together as a draft;
 * published columns stay read-only until S04. Unsaved cells survive a reload (FRD §8).
 */
@Component({
  selector: 'app-gradebook-grid',
  imports: [
    Alert,
    Badge,
    Button,
    DatePipe,
    DecimalPipe,
    FormsModule,
    Icon,
    RouterLink,
    UiField,
    UiSelect,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  styles: `
    /* A compact score input for dense table rows. Built on the tokens rather than uiInput, whose
       aria-invalid / aria-describedby come from a ui-field: each cell sets its own. */
    .gradebook-cell {
      width: 4rem;
      height: 2rem;
      border-radius: var(--radius-field);
      border: 1px solid var(--ui-line-control);
      background: var(--ui-surface-1);
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .gradebook-cell:focus-visible {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 20%, transparent);
    }
    .gradebook-cell[aria-invalid='true'] {
      border-color: var(--color-error);
    }
    .gradebook-cell-conflict {
      border-color: var(--color-warning);
      border-width: 2px;
    }
  `,
  template: `
    @let book = gradebook.value();
    @let v = view();
    <div class="flex flex-wrap items-end gap-3">
      <ui-field label="Periodo" class="w-56">
        <select uiSelect [ngModel]="book?.periodId ?? ''" (ngModelChange)="periodId.set($event)" [disabled]="!book?.periods?.length">
          @if (!book?.periodId) {
            <option value="" disabled>Sin periodo</option>
          }
          @for (period of book?.periods ?? []; track period.id) {
            <option [value]="period.id">{{ period.name }}</option>
          }
        </select>
      </ui-field>
      @if ((book?.classGroups?.length ?? 0) > 1) {
        <ui-field label="Grupo" class="w-48">
          <select uiSelect [ngModel]="groupValue(book!.classGroupId)" (ngModelChange)="classGroupId.set($event)">
            @for (group of book!.classGroups; track group.id) {
              <option [value]="groupValue(group.id)">{{ group.name }} ({{ group.studentCount }})</option>
            }
          </select>
        </ui-field>
      }
      <div class="ms-auto">
        <button uiButton variant="primary" [disabled]="!book?.periodId" (click)="newGrade()">
          <ui-icon name="plus" />
          Nueva calificación
        </button>
      </div>
    </div>

    @if (book && !book.metric) {
      <div uiAlert tone="warning" class="mt-4">
        <ui-icon name="triangle-alert" />
        <span>Escala de notas no configurada. Las notas no se pueden editar y los promedios se muestran sin estado.</span>
      </div>
    }
    @if (restored()) {
      <div uiAlert tone="info" class="mt-4">
        <ui-icon name="history" />
        <span>Recuperamos cambios sin guardar.</span>
      </div>
    }
    @if (saveState().kind === 'conflict') {
      <div uiAlert tone="warning" class="mt-4">
        <ui-icon name="triangle-alert" />
        <span>Otra persona cambió estas notas; revisa antes de guardar. Las celdas marcadas cambiaron; tus valores siguen aquí.</span>
      </div>
    }
    @if (saveError(); as message) {
      <div uiAlert tone="danger" class="mt-4">
        <ui-icon name="circle-alert" />
        <span>{{ message }} Tus cambios siguen aquí.</span>
      </div>
    }

    @if (book?.metric && v && editableColumns() > 0) {
      <div class="mt-4 flex flex-wrap items-center gap-3 rounded-box border border-line bg-surface-0 px-4 py-2" role="status">
        <p class="text-sm text-ink-muted">
          Escala {{ scaleText(book!.metric!.minimum) }}–{{ scaleText(book!.metric!.maximum) }} · nota mínima
          {{ scaleText(book!.metric!.minimumApproval) }} · Tab pasa al siguiente estudiante
        </p>
        <p class="ms-auto text-sm font-semibold" aria-live="polite">
          @if (v.invalid) {
            <span class="text-error">{{ v.invalid === 1 ? '1 valor inválido' : v.invalid + ' valores inválidos' }}</span>
          } @else if (v.changed) {
            <span class="text-ink-strong">{{ v.changed === 1 ? '1 cambio sin guardar' : v.changed + ' cambios sin guardar' }}</span>
          } @else if (saveState().kind === 'saved') {
            <span class="text-success">Guardado</span>
          }
        </p>
        <button uiButton variant="ghost" size="sm" [disabled]="!hasEdits() || saveState().kind === 'saving'" (click)="discard()">
          Descartar
        </button>
        <button
          uiButton
          variant="primary"
          size="sm"
          [disabled]="!v.changed || v.invalid > 0"
          [loading]="saveState().kind === 'saving'"
          (click)="save()"
        >
          Guardar borrador
        </button>
      </div>
    }

    <div class="mt-4 overflow-x-auto rounded-box border border-line">
      <table uiTable density="compact" class="gradebook" [attr.aria-busy]="gradebook.isLoading()" aria-label="Libro de calificaciones">
        <thead>
          <tr>
            <th scope="col" rowspan="2" class="sticky left-0 z-10 min-w-52 bg-surface-1">Estudiante</th>
            @for (bucket of book?.buckets ?? []; track bucket.id) {
              <th scope="colgroup" [attr.colspan]="bucket.columns.length" class="border-s border-line text-center">
                {{ bucket.name }} · {{ bucket.weight | number: '1.0-1' }} %
              </th>
            }
            <th scope="col" rowspan="2" class="border-s border-line text-center">
              Promedio
              @if (v?.includesDrafts) {
                <span class="block text-xs font-normal text-ink-muted">Incluye borradores</span>
              }
            </th>
            <th scope="col" rowspan="2" class="text-center">Estado</th>
          </tr>
          <tr>
            @for (bucket of book?.buckets ?? []; track bucket.id) {
              @for (column of bucket.columns; track column.id; let first = $first) {
                <th scope="col" class="min-w-24 text-center font-normal" [class.border-s]="first" [class.border-line]="first">
                  <a [routerLink]="['/grades', column.id]" class="link link-hover block font-semibold text-ink-strong" [title]="column.title">
                    <span class="block max-w-32 truncate">{{ column.title }}</span>
                  </a>
                  <span class="block text-xs text-ink-muted">{{ column.date | date: 'dd/MM' : 'UTC' }}</span>
                  @if (!column.published) {
                    <span uiBadge size="sm" class="mt-0.5">Borrador</span>
                  }
                </th>
              }
            }
          </tr>
        </thead>

        @if (gradebook.isLoading() && !book) {
          <tbody uiTableSkeleton [columns]="5"></tbody>
        } @else if (gradebook.error()) {
          <tbody>
            <tr uiTableError [columns]="columnCount()" [title]="errorTitle()" [description]="errorMessage()" (retry)="gradebook.reload()"></tr>
          </tbody>
        } @else if (book && v) {
          <tbody>
            @for (row of v.rows; track row.student.id; let r = $index) {
              <tr>
                <th scope="row" class="sticky left-0 z-10 bg-surface-1 font-normal">
                  <a [routerLink]="['/students', row.student.id]" class="flex min-w-0 items-center gap-2">
                    <div class="avatar avatar-placeholder shrink-0" aria-hidden="true">
                      <div class="w-7 rounded-full text-white" [style.background]="row.student.color ?? 'var(--color-neutral)'">
                        <span class="text-xs">{{ row.student.initials }}</span>
                      </div>
                    </div>
                    <span class="truncate">{{ row.student.name }}</span>
                  </a>
                </th>
                @for (cell of row.cells; track cell.key; let c = $index) {
                  @if (cell.editable) {
                    <td class="p-1 text-center align-top" [class.bg-action-subtle]="cell.changed && !cell.error">
                      <input
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        class="gradebook-cell"
                        [class.gradebook-cell-conflict]="conflicts().has(cell.key)"
                        [class.text-error]="!cell.error && isBelowPass(cell.score, book)"
                        [attr.data-cell]="r + '-' + c"
                        [attr.aria-label]="row.student.name + ', ' + columnTitle(c)"
                        [attr.aria-invalid]="cell.error ? 'true' : null"
                        [attr.aria-describedby]="cell.error ? errorId(cell.key) : null"
                        [value]="cell.text"
                        (input)="edit(cell.key, $any($event.target).value)"
                        (keydown)="move($event, r, c)"
                      />
                      @if (cell.error) {
                        <span [id]="errorId(cell.key)" class="mt-0.5 block text-xs text-error">{{ cell.error }}</span>
                      }
                    </td>
                  } @else {
                    <td class="text-center tabular-nums" [class.text-error]="isBelowPass(cell.score, book)">
                      {{ cell.score === null ? '—' : (cell.score | number: '1.1-1') }}
                    </td>
                  }
                }
                <td class="border-s border-line text-center font-semibold tabular-nums">
                  @if (row.average === null) {
                    <span class="text-xs font-normal text-ink-muted">Sin notas</span>
                  } @else {
                    {{ row.average | number: '1.1-1' }}
                  }
                </td>
                <td class="text-center">
                  @if (row.status) {
                    <span uiBadge size="sm" [tone]="status[row.status].tone">{{ status[row.status].label }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr uiTableEmpty [columns]="columnCount()" icon="users" [title]="book.periodId ? 'No hay estudiantes en este curso' : 'No hay periodos en el año escolar'"></tr>
            }
            @if (v.rows.length && !book.buckets.length) {
              <tr uiTableEmpty [columns]="columnCount()" icon="clipboard-list" title="Aún no hay calificaciones en este periodo">
                <button uiButton size="sm" variant="primary" (click)="newGrade()">Nueva calificación</button>
              </tr>
            }
          </tbody>
          @if (v.rows.length && book.buckets.length) {
            <tfoot>
              <tr>
                <th scope="row" class="sticky left-0 z-10 bg-surface-1">Promedio del grupo</th>
                @for (average of v.footer.columns; track $index) {
                  <td class="text-center tabular-nums">{{ average === null ? '—' : (average | number: '1.1-1') }}</td>
                }
                <td class="border-s border-line text-center font-semibold tabular-nums">
                  {{ v.footer.average === null ? '—' : (v.footer.average | number: '1.1-1') }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          }
        }
      </table>
    </div>
  `,
})
export default class GradebookGrid {
  public readonly courseId = input.required<string>();
  #modal = inject(Modal);
  #http = inject(HttpClient);
  #toast = inject(Toast);
  #host = inject<ElementRef<HTMLElement>>(ElementRef);
  #unsaved = inject(UnsavedChanges);
  readonly #owner = `gradebook-${nextId++}`;

  protected readonly status = STATUS;
  /** '' = the API's default (current period, first group). Reset when the course changes. */
  public readonly periodId = linkedSignal<string, string>({ source: this.courseId, computation: () => '' });
  public readonly classGroupId = linkedSignal<string, string>({ source: this.courseId, computation: () => '' });

  public readonly gradebook = httpResource<Gradebook>(() => {
    const courseId = this.courseId();
    if (!courseId) return undefined;
    const params: Record<string, string> = {};
    if (this.periodId()) params['periodId'] = this.periodId();
    if (this.classGroupId()) params['classGroupId'] = this.classGroupId();
    return { url: `/api/v1/gradebook/${courseId}`, params };
  });

  /** Unsaved cells of the view `key` (course, period, group). */
  protected readonly draft = signal<{ key: string; edits: Edits } | null>(null);
  protected readonly restored = signal(false);
  protected readonly saveState = signal<SaveState>({ kind: 'idle' });
  /** Cells another person changed since they were loaded (BR-ASM-001.7). */
  protected readonly conflicts = signal<ReadonlySet<string>>(new Set());

  protected readonly view = computed(() => {
    const book = this.gradebook.value();
    if (!book) return null;
    const draft = this.draft();
    return applyEdits(book, draft?.key === viewKey(book) ? draft.edits : {});
  });

  protected readonly hasEdits = computed(() => Object.keys(this.draft()?.edits ?? {}).length > 0);
  protected readonly editableColumns = computed(() => {
    const book = this.gradebook.value();
    return book?.metric ? book.buckets.flatMap((b) => b.columns).filter((c) => !c.published).length : 0;
  });
  protected readonly saveError = computed(() => {
    const state = this.saveState();
    return state.kind === 'error' ? state.message : null;
  });

  protected readonly columnCount = computed(() => {
    const columns = (this.gradebook.value()?.buckets ?? []).reduce((n, b) => n + b.columns.length, 0);
    return columns + 3;
  });

  protected readonly errorTitle = computed(() =>
    this.forbidden() ? 'No tienes acceso a este libro de calificaciones' : 'No se pudo cargar el libro de calificaciones',
  );

  /** BR-ASM-001.1: a 403 carries the API's reason ("Solo puedes calificar tus propios cursos"). */
  protected readonly errorMessage = computed(() => {
    const error = this.gradebook.error();
    if (this.forbidden()) return (error as HttpErrorResponse).error?.message ?? 'Solo puedes calificar tus propios cursos';
    return 'Revisa tu conexión e inténtalo de nuevo.';
  });

  private readonly forbidden = computed(() => {
    const error = this.gradebook.error();
    return error instanceof HttpErrorResponse && error.status === 403;
  });

  constructor() {
    // A new view (course, period or group) brings back its unsaved cells, if any were left.
    effect(() => {
      const book = this.gradebook.value();
      if (!book) return;
      const key = viewKey(book);
      untracked(() => {
        if (this.draft()?.key === key) return;
        const backup = readBackup(key);
        this.draft.set({ key, edits: backup ?? {} });
        this.restored.set(!!backup);
        this.conflicts.set(new Set());
        this.saveState.set({ kind: 'idle' });
      });
    });
    // Keep the backup and the leave guard in step with the unsaved cells.
    effect(() => {
      const draft = this.draft();
      const view = this.view();
      if (draft) writeBackup(draft.key, draft.edits);
      this.#unsaved.set(this.#owner, (view?.changed ?? 0) + (view?.invalid ?? 0));
    });
    inject(DestroyRef).onDestroy(() => this.#unsaved.clear(this.#owner));
  }

  /** FR-ASM-001.4: what the teacher typed in a cell; typing the saved value back undoes the change. */
  protected edit(key: string, text: string): void {
    const book = this.gradebook.value();
    const draft = this.draft();
    if (!book?.metric || !draft) return;
    const saved = this.savedCell(book, key);
    const edits = { ...draft.edits };
    const parsed = parseCell(text, book.metric);
    if (!parsed.error && parsed.score === (saved?.score ?? null)) {
      delete edits[key];
    } else {
      edits[key] = { text, updatedAt: edits[key]?.updatedAt ?? saved?.updatedAt ?? null };
    }
    this.draft.set({ ...draft, edits });
    if (this.saveState().kind === 'saved') this.saveState.set({ kind: 'idle' });
  }

  /** Enter / Tab: next student in the column; Shift+Enter / Shift+Tab: previous one. */
  protected move(event: KeyboardEvent, row: number, column: number): void {
    if (event.key !== 'Enter' && event.key !== 'Tab') return;
    const target = this.#host.nativeElement.querySelector<HTMLInputElement>(
      `input[data-cell="${row + (event.shiftKey ? -1 : 1)}-${column}"]`,
    );
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.select();
  }

  /** FR-ASM-001.6: every valid change in one request. */
  protected async save(): Promise<void> {
    const book = this.gradebook.value();
    const draft = this.draft();
    if (!book?.periodId || !draft) return;
    const cells = changedCells(book, draft.edits);
    if (!cells.length) return;

    this.saveState.set({ kind: 'saving' });
    try {
      await firstValueFrom(this.#http.put(`/api/v1/gradebook/${book.course.id}/cells`, { periodId: book.periodId, cells }));
      this.draft.set({ key: draft.key, edits: {} });
      this.conflicts.set(new Set());
      this.restored.set(false);
      this.saveState.set({ kind: 'saved' });
      this.#toast.showSuccess('Notas guardadas como borrador');
      this.gradebook.reload();
    } catch (error) {
      this.handleSaveError(error, draft.key);
    }
  }

  /** Back to the saved values. */
  protected discard(): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set({ key: draft.key, edits: {} });
    this.conflicts.set(new Set());
    this.restored.set(false);
    this.saveState.set({ kind: 'idle' });
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    const view = this.view();
    if (view && view.changed + view.invalid > 0) event.preventDefault();
  }

  private handleSaveError(error: unknown, key: string): void {
    const body = error instanceof HttpErrorResponse ? (error.error as SaveRefusal | null) : null;
    if (error instanceof HttpErrorResponse && error.status === 409) {
      // BR .7: keep the teacher's values, take the new `updatedAt` so a deliberate re-save goes through,
      // and reload so the grid shows what the other person saved.
      const changed = new Set((body?.cells ?? []).map((c) => cellKey(c.gradeId, c.studentId)));
      const draft = this.draft();
      if (draft?.key === key) {
        const edits = { ...draft.edits };
        for (const c of body?.cells ?? []) {
          const k = cellKey(c.gradeId, c.studentId);
          if (edits[k]) edits[k] = { ...edits[k], updatedAt: c.updatedAt ?? null };
        }
        this.draft.set({ key, edits });
      }
      this.conflicts.set(changed);
      this.saveState.set({ kind: 'conflict' });
      this.gradebook.reload();
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 400 && body?.message) {
      const reasons = (body.cells ?? []).map((c) => c.reason).filter(Boolean);
      this.saveState.set({ kind: 'error', message: reasons.length ? `${body.message}: ${[...new Set(reasons)].join(', ')}.` : `${body.message}.` });
      return;
    }
    this.saveState.set({ kind: 'error', message: 'No se pudo guardar.' });
  }

  private savedCell(book: Gradebook, key: string) {
    const [gradeId, studentId] = key.split('|');
    const row = book.rows.find((r) => r.student.id === studentId);
    return row?.cells.find((c) => c.gradeId === gradeId);
  }

  protected columnTitle(index: number): string {
    return this.gradebook.value()?.buckets.flatMap((b) => b.columns)[index]?.title ?? '';
  }

  protected errorId(key: string): string {
    return `${this.#owner}-err-${key.replace('|', '-')}`;
  }

  protected scaleText(value: number): string {
    return formatScore(value);
  }

  protected groupValue(id: string | null): string {
    return id ?? NO_GROUP;
  }

  protected isBelowPass(score: number | null, book: Gradebook): boolean {
    return score !== null && !!book.metric && score < book.metric.minimumApproval;
  }

  newGrade(): void {
    const periodId = this.gradebook.value()?.periodId;
    if (!periodId) return;
    this.#modal
      .open(GradesForm, {
        title: 'Nueva calificación',
        size: 'large',
        data: { courseId: this.courseId(), periodId },
      })
      .closed.subscribe((result) => {
        if (result) this.gradebook.reload();
      });
  }
}
