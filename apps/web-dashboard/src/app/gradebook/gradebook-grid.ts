import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Icon,
  Modal,
  UiField,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
} from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import GradesForm from '../grades/grades-form';

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

const STATUS: Record<GradebookStatus, { label: string; tone: BadgeTone }> = {
  AT_RISK: { label: 'En riesgo', tone: 'danger' },
  WATCH: { label: 'Atención', tone: 'warning' },
  ON_TRACK: { label: 'Al día', tone: 'success' },
};
const NO_GROUP = 'none';

/**
 * A course's gradebook, read-only (ASM-001-S02): one group's students for one period, the period's
 * columns grouped by bucket, each student's average (BR .4, drafts included) and status (BR .5),
 * and the group's averages. Scores are still entered on the grade page; inline entry is S03.
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
  template: `
    @let book = gradebook.value();
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
        <span>Escala de notas no configurada. Los promedios se muestran sin estado.</span>
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
              @if (book?.includesDrafts) {
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
        } @else if (book) {
          <tbody>
            @for (row of book.rows; track row.student.id) {
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
                @for (cell of row.cells; track cell.gradeId; let first = $first) {
                  <td class="text-center tabular-nums" [class.text-error]="isBelowPass(cell.score, book)">
                    {{ cell.score === null ? '—' : (cell.score | number: '1.1-1') }}
                  </td>
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
            @if (book.rows.length && !book.buckets.length) {
              <tr uiTableEmpty [columns]="columnCount()" icon="clipboard-list" title="Aún no hay calificaciones en este periodo">
                <button uiButton size="sm" variant="primary" (click)="newGrade()">Nueva calificación</button>
              </tr>
            }
          </tbody>
          @if (book.rows.length && book.buckets.length) {
            <tfoot>
              <tr>
                <th scope="row" class="sticky left-0 z-10 bg-surface-1">Promedio del grupo</th>
                @for (column of book.footer.columns; track column.gradeId) {
                  <td class="text-center tabular-nums">
                    {{ column.average === null ? '—' : (column.average | number: '1.1-1') }}
                  </td>
                }
                <td class="border-s border-line text-center font-semibold tabular-nums">
                  {{ book.footer.average === null ? '—' : (book.footer.average | number: '1.1-1') }}
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
