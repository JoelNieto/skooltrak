import { Badge, BadgeTone, Meter, UiField, UiSelect, UiTable } from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, input, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** `GET /api/v1/courses/:id/grades-summary` (ACA-001-S07, FR .14). */
interface CourseGradesSummary {
  periods: { id: string; name: string }[];
  periodId: string | null;
  scale: { maximum: number; minimumApproval: number } | null;
  average: number | null;
  band: 'AL_DIA' | 'EN_RIESGO' | null;
  buckets: { id: string; name: string; weight: number; average: number | null }[];
  grades: {
    id: string;
    title: string;
    bucket: string;
    date: string;
    comment: string | null;
    score: number | null;
    excused: boolean;
  }[];
}

const BAND: Record<'AL_DIA' | 'EN_RIESGO', { label: string; tone: BadgeTone }> = {
  AL_DIA: { label: 'Al día', tone: 'success' },
  EN_RIESGO: { label: 'En riesgo', tone: 'danger' },
};

/**
 * A student's grades in a course (ACA-001 FR .14): the period average on the plan's scale with its
 * band and the pass mark, one bar per category, and the published grades. *Resumen* shows it
 * `compact`: current period, no switcher, no table (FR .12).
 */
@Component({
  selector: 'app-course-grades-summary',
  imports: [Badge, DatePipe, DecimalPipe, FormsModule, Meter, UiField, UiSelect, UiTable],
  template: `
    @if (summary.value(); as s) {
      @if (!compact() && s.periods.length) {
        <ui-field label="Periodo" class="mb-4 w-48">
          <select uiSelect [ngModel]="s.periodId ?? ''" (ngModelChange)="periodId.set($event)">
            @for (period of s.periods; track period.id) {
              <option [value]="period.id">{{ period.name }}</option>
            }
          </select>
        </ui-field>
      }
      <div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_2fr]">
        <section aria-labelledby="grades-average" class="rounded-box bg-surface-0 p-4">
          <h3 id="grades-average" class="text-xs text-ink-muted">Promedio del periodo</h3>
          @if (!s.scale) {
            <p class="mt-1 text-2xl font-semibold text-ink-muted">—</p>
            <p class="text-xs text-ink-muted">Escala de notas no configurada</p>
          } @else if (s.average === null) {
            <p class="mt-1 text-2xl font-semibold text-ink-muted">—</p>
            <p class="text-xs text-ink-muted">Sin notas</p>
          } @else {
            <p class="mt-1 flex items-center gap-2">
              <span class="text-2xl font-semibold tabular-nums text-ink-strong">{{ s.average | number: '1.1-1' }}</span>
              <span class="text-sm text-ink-muted">/ {{ s.scale.maximum }}</span>
              @if (s.band) {
                <span uiBadge size="sm" [tone]="band[s.band].tone">{{ band[s.band].label }}</span>
              }
            </p>
            <p class="text-xs text-ink-muted">Nota mínima {{ s.scale.minimumApproval | number: '1.1-1' }}</p>
          }
        </section>
        <section aria-labelledby="grades-buckets">
          <h3 id="grades-buckets" class="mb-2 text-xs text-ink-muted">Por categoría</h3>
          <ul class="flex flex-col gap-3">
            @for (bucket of s.buckets; track bucket.id) {
              <li>
                <p class="flex items-center justify-between text-sm">
                  <span class="text-ink-strong"
                    >{{ bucket.name }}
                    <span class="text-ink-muted">· {{ bucket.weight | number: '1.0-1' }} %</span></span
                  >
                  <span class="tabular-nums" [class.text-ink-muted]="bucket.average === null">
                    {{ bucket.average === null ? 'Sin notas' : (bucket.average | number: '1.1-1') }}
                  </span>
                </p>
                @if (s.scale && bucket.average !== null) {
                  <ui-meter
                    [value]="bucket.average"
                    [max]="s.scale.maximum"
                    [label]="bucket.name + ': ' + (bucket.average | number: '1.1-1') + ' de ' + s.scale.maximum"
                    [showLabel]="false"
                    [tone]="bucket.average < s.scale.minimumApproval ? 'danger' : 'success'"
                  />
                }
              </li>
            } @empty {
              <li class="text-sm text-ink-muted">El curso aún no tiene categorías de calificación.</li>
            }
          </ul>
        </section>
      </div>
      @if (!compact()) {
        <div class="mt-6 overflow-x-auto">
          <table uiTable density="compact" aria-label="Calificaciones publicadas">
            <thead>
              <tr>
                <th>Calificación</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Comentario</th>
                <th class="text-end">Nota</th>
              </tr>
            </thead>
            <tbody>
              @for (grade of s.grades; track grade.id) {
                <tr>
                  <td class="font-medium text-ink-strong">{{ grade.title }}</td>
                  <td>{{ grade.bucket }}</td>
                  <td>{{ grade.date | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                  <td class="text-sm text-ink-muted">{{ grade.comment }}</td>
                  <td class="text-end tabular-nums" [class.text-error]="isBelow(grade.score, s)">
                    {{ grade.excused ? 'Exenta' : grade.score === null ? '—' : (grade.score | number: '1.1-1') }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center text-sm text-ink-muted">
                    Aún no hay calificaciones publicadas en este periodo.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else if (summary.error()) {
      <p class="text-sm text-ink-muted">No se pudieron cargar las calificaciones.</p>
    }
  `,
})
export class CourseGradesSummaryView {
  readonly courseId = input.required<string>();
  /** Parents: the child; students: themselves. */
  readonly studentId = input<string | null>(null);
  /** Resumen (FR .12): current period, without the switcher and the table. */
  readonly compact = input(false);

  protected readonly band = BAND;
  /** '' = the current period. */
  protected readonly periodId = linkedSignal<string, string>({ source: this.courseId, computation: () => '' });

  protected readonly summary = httpResource<CourseGradesSummary>(() => {
    const params: Record<string, string> = {};
    if (this.periodId()) params['periodId'] = this.periodId();
    if (this.studentId()) params['studentId'] = this.studentId() as string;
    return { url: `/api/v1/courses/${this.courseId()}/grades-summary`, params };
  });

  protected isBelow(score: number | null, s: CourseGradesSummary): boolean {
    return score !== null && !!s.scale && score < s.scale.minimumApproval;
  }
}
