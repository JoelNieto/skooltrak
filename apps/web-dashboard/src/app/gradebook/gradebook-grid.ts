import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Icon,
  Modal,
  Toast,
  UiField,
  UiInput,
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
import {
  applyEdits,
  cellKey,
  cellsNeedingReason,
  changedCells,
  CellEdit,
  Edits,
  readBackup,
  savedText,
  viewKey,
  writeBackup,
} from './gradebook-draft';
import PublishDialog from './publish-dialog';
import ReasonDialog from './reason-dialog';
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
    columns: { id: string; title: string; date: string; published: boolean; publishedAt: string | null }[];
  }[];
  rows: {
    student: { id: string; firstName: string; name: string; initials: string; color: string | null };
    cells: {
      gradeId: string;
      studentGradeId: string | null;
      score: number | null;
      comment: string | null;
      updatedAt: string | null;
    }[];
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

/** `GET /api/v1/gradebook/cells/:id/history` (FR-ASM-001.8). */
type Revision = {
  id: string;
  previousScore: number | null;
  score: number | null;
  excused: boolean;
  reason: string;
  changedBy: { id: string; name: string } | null;
  createdAt: string;
};

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'conflict' } | { kind: 'error'; message: string };

const STATUS: Record<GradebookStatus, { label: string; tone: BadgeTone }> = {
  AT_RISK: { label: 'En riesgo', tone: 'danger' },
  WATCH: { label: 'Atención', tone: 'warning' },
  ON_TRACK: { label: 'Al día', tone: 'success' },
};
const NO_GROUP = 'none';

/** BR-HOM-001.1 bands on the plan's scale, for the side panel. */
function band(score: number | null, metric: Gradebook['metric']): { label: string; tone: BadgeTone } | null {
  if (score === null || !metric) return null;
  if (score >= metric.minimumExcellence) return { label: 'Excelencia', tone: 'success' };
  if (score >= metric.minimumApproval) return { label: 'Aprobado', tone: 'info' };
  return { label: 'Bajo la nota mínima', tone: 'danger' };
}
let nextId = 0;

/**
 * A course's gradebook (ASM-001-S02, S03): one group's students for one period, the period's columns
 * grouped by bucket, each student's average (BR .4, drafts included) and status (BR .5), and the
 * group's averages. Cells are typed into from the keyboard and saved together; a changed published
 * score needs a reason and is kept in the cell's history (S04). Draft columns are published from
 * here. Selecting a cell opens its side panel. Unsaved cells survive a reload (FRD §8).
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
    UiInput,
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
        <button
          uiButton
          variant="secondary"
          size="sm"
          [disabled]="v.invalid > 0 || !draftColumns().length || saveState().kind === 'saving' || publishing()"
          [loading]="publishing()"
          (click)="publish()"
        >
          Publicar calificaciones
        </button>
      </div>
    }

    <div [class]="panel() ? 'mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]' : 'mt-4'">
    <div class="min-w-0 overflow-x-auto rounded-box border border-line">
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
                        (focus)="selected.set(cell.key)"
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

    @if (panel(); as p) {
      <aside class="rounded-box border border-line bg-surface-1 p-4 lg:sticky lg:top-4" aria-label="Detalle de la celda">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="font-semibold text-ink-strong">{{ p.student }}</h3>
            <p class="text-sm text-ink-muted">{{ p.column }} · {{ p.bucket }}</p>
          </div>
          <button uiButton variant="ghost" size="sm" aria-label="Cerrar detalle" (click)="selected.set(null)">
            <ui-icon name="x" />
          </button>
        </div>
        <p class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-2xl font-semibold tabular-nums text-ink-strong">
            {{ p.cell.score === null ? '—' : (p.cell.score | number: '1.1-1') }}
          </span>
          @if (p.band) {
            <span uiBadge size="sm" [tone]="p.band.tone">{{ p.band.label }}</span>
          }
          @if (p.cell.published) {
            <span uiBadge size="sm" tone="info">Publicada</span>
          } @else {
            <span uiBadge size="sm">Borrador</span>
          }
        </p>
        <ui-field
          label="Comentario"
          class="mt-3"
          hint="Lo verán el estudiante y su familia cuando la calificación esté publicada. Máximo 500 caracteres."
        >
          <textarea uiInput rows="3" maxlength="500" [value]="p.cell.comment" (input)="setComment(p.cell.key, $any($event.target).value)"></textarea>
        </ui-field>
        @if (p.cell.needsReason) {
          <ui-field label="Motivo de este cambio" class="mt-3" hint="Si lo dejas vacío, al guardar se pedirá un motivo para todos los cambios.">
            <input uiInput maxlength="300" [value]="p.cell.reason" (input)="setReason(p.cell.key, $any($event.target).value)" />
          </ui-field>
        }
        <h4 class="mt-4 text-sm font-semibold text-ink-strong">Historial de cambios</h4>
        @if (!p.cell.studentGradeId) {
          <p class="mt-1 text-sm text-ink-muted">Sin cambios registrados.</p>
        } @else if (history.isLoading()) {
          <p class="mt-1 text-sm text-ink-muted">Cargando…</p>
        } @else if (history.error()) {
          <p class="mt-1 text-sm text-error">No se pudo cargar el historial.</p>
        } @else {
          <ol class="mt-2 flex flex-col gap-3" aria-label="Historial de cambios">
            @for (revision of history.value()?.revisions ?? []; track revision.id) {
              <li class="text-sm">
                <p class="font-medium tabular-nums text-ink-strong">
                  {{ scoreText(revision.previousScore) }} → {{ scoreText(revision.score) }}
                </p>
                <p class="text-ink">{{ revision.reason }}</p>
                <p class="text-xs text-ink-muted">
                  {{ revision.changedBy?.name ?? 'Usuario eliminado' }} · {{ revision.createdAt | date: 'short' }}
                </p>
              </li>
            } @empty {
              <li class="text-sm text-ink-muted">Sin cambios registrados.</li>
            }
          </ol>
        }
      </aside>
    }
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
    return book?.metric ? book.buckets.flatMap((b) => b.columns).length : 0;
  });
  /** Draft columns of the view, for "Publicar calificaciones" (FR-ASM-001.7). */
  protected readonly draftColumns = computed(() =>
    (this.gradebook.value()?.buckets ?? []).flatMap((b) => b.columns).filter((c) => !c.published),
  );
  protected readonly publishing = signal(false);
  /** Columns saved in this session: ticked by default when publishing. */
  readonly #sessionColumns = new Set<string>();

  /** The cell whose side panel is open (FR-ASM-001.8). */
  protected readonly selected = signal<string | null>(null);
  protected readonly panel = computed(() => {
    const key = this.selected();
    const book = this.gradebook.value();
    const view = this.view();
    if (!key || !book || !view) return null;
    const columns = book.buckets.flatMap((b) => b.columns.map((c) => ({ ...c, bucket: b.name })));
    for (const row of view.rows) {
      const index = row.cells.findIndex((c) => c.key === key);
      if (index < 0) continue;
      const cell = row.cells[index];
      return {
        student: row.student.name,
        column: columns[index].title,
        bucket: columns[index].bucket,
        cell,
        band: band(cell.score, book.metric),
      };
    }
    return null;
  });
  protected readonly history = httpResource<{ revisions: Revision[] }>(() => {
    const id = this.panel()?.cell.studentGradeId;
    return id ? `/api/v1/gradebook/cells/${id}/history` : undefined;
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
        this.selected.set(null);
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
    this.updateEdit(key, { text });
  }

  /** FR-ASM-001.8: the cell's comment, saved with the draft (BR-ASM-001.14). */
  protected setComment(key: string, comment: string): void {
    this.updateEdit(key, { comment });
  }

  /** FR-ASM-001.8: a reason for this published cell only (BR-ASM-001.8). */
  protected setReason(key: string, reason: string): void {
    this.updateEdit(key, { reason });
  }

  /** Merges a change into the cell's edit, and drops the edit once the cell matches what is saved. */
  private updateEdit(key: string, patch: Partial<CellEdit>): void {
    const book = this.gradebook.value();
    const draft = this.draft();
    if (!book?.metric || !draft) return;
    const saved = this.savedCell(book, key);
    const edits = { ...draft.edits };
    const current: CellEdit = edits[key] ?? { text: savedText(saved?.score ?? null), updatedAt: saved?.updatedAt ?? null };
    const next: CellEdit = { ...current, ...patch };
    const parsed = parseCell(next.text, book.metric);
    const sameScore = !parsed.error && parsed.score === (saved?.score ?? null);
    const sameComment = next.comment === undefined || (next.comment || null) === (saved?.comment || null);
    if (sameScore && sameComment) delete edits[key];
    else edits[key] = next;
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

  /**
   * FR-ASM-001.6: every valid change in one request. Changed published scores without their own
   * reason are covered by one reason asked for here (BR-ASM-001.8). Resolves to true once saved.
   */
  protected async save(): Promise<boolean> {
    const book = this.gradebook.value();
    const draft = this.draft();
    const view = this.view();
    if (!book?.periodId || !draft || !view) return false;
    const cells = changedCells(book, draft.edits);
    if (!cells.length) return true;

    let reason: string | undefined;
    const needing = cellsNeedingReason(view);
    if (needing.length) {
      const answer = await firstValueFrom(
        this.#modal.open<string | false, ReasonDialog>(ReasonDialog, { title: 'Motivo del cambio', data: { count: needing.length } }).closed,
      );
      if (!answer) return false;
      reason = answer;
    }

    this.saveState.set({ kind: 'saving' });
    try {
      await firstValueFrom(
        this.#http.put(`/api/v1/gradebook/${book.course.id}/cells`, { periodId: book.periodId, ...(reason ? { reason } : {}), cells }),
      );
      for (const cell of cells) this.#sessionColumns.add(cell.gradeId);
      this.draft.set({ key: draft.key, edits: {} });
      this.conflicts.set(new Set());
      this.restored.set(false);
      this.saveState.set({ kind: 'saved' });
      this.#toast.showSuccess(needing.length ? 'Notas guardadas; los cambios a notas publicadas quedaron en el historial' : 'Notas guardadas como borrador');
      this.gradebook.reload();
      this.history.reload();
      return true;
    } catch (error) {
      this.handleSaveError(error, draft.key);
      return false;
    }
  }

  /**
   * FR-ASM-001.7: saves pending changes, then asks which draft columns to publish (those changed in
   * this session ticked) and publishes them, which notifies students and parents.
   */
  protected async publish(): Promise<void> {
    const view = this.view();
    if (!view || view.invalid) return;
    if (view.changed && !(await this.save())) return;

    const book = this.gradebook.value();
    const drafts = this.draftColumns();
    if (!book || !drafts.length) return;
    const chosen = await firstValueFrom(
      this.#modal.open<string[] | false, PublishDialog>(PublishDialog, {
        title: 'Publicar calificaciones',
        data: { columns: drafts.map((c) => ({ id: c.id, title: c.title, date: c.date, changed: this.#sessionColumns.has(c.id) })) },
      }).closed,
    );
    if (!chosen || !chosen.length) return;

    this.publishing.set(true);
    try {
      await firstValueFrom(this.#http.post(`/api/v1/gradebook/${book.course.id}/publish`, { gradeIds: chosen }));
      this.#toast.showSuccess(chosen.length === 1 ? 'Calificación publicada' : `${chosen.length} calificaciones publicadas`);
      this.gradebook.reload();
    } catch {
      this.saveState.set({ kind: 'error', message: 'No se pudieron publicar las calificaciones.' });
    } finally {
      this.publishing.set(false);
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

  protected scoreText(value: number | null): string {
    return value === null ? 'Sin nota' : formatScore(value);
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
