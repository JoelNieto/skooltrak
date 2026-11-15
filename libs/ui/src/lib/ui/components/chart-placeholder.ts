import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChartPlaceholderShape = 'bars' | 'line';

/**
 * Reserves the space of a chart that is not built yet (HOM-001 FR .4). It never shows data: a faint
 * decorative skeleton, the chart's kind, what it will show and where the data comes from.
 *
 *   <ui-chart-placeholder
 *     kind="Histograma"
 *     description="Notas por rango con líneas en aprobación y excelencia"
 *     source="student_grades"
 *     shape="bars"
 *   />
 *
 * Announced as one image ("Gráfico por desarrollar: Histograma. …") so screen readers don't read a
 * fake chart. Height comes from the host (`class="h-60"`); the default is 15rem.
 */
@Component({
  selector: 'ui-chart-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-chart-placeholder relative block h-60 overflow-hidden rounded-field border-2 border-dashed border-line-strong bg-surface-2/50',
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div class="pointer-events-none absolute inset-x-6 bottom-14 top-12" aria-hidden="true">
      @if (shape() === 'line') {
        <svg class="h-full w-full text-line-strong" viewBox="0 0 600 160" preserveAspectRatio="none">
          <polyline fill="none" stroke="currentColor" stroke-width="3" points="0,100 75,84 150,92 225,60 300,72 375,48 450,64 525,40 600,52" />
          <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" stroke-dasharray="6 6" opacity="0.6" />
        </svg>
      } @else {
        <div class="flex h-full items-end gap-3">
          @for (h of bars; track $index) {
            <div class="flex-1 rounded-t bg-line" [style.height.%]="h"></div>
          }
        </div>
      }
    </div>
    <span class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink" aria-hidden="true">
      <span class="material-symbols-outlined text-base">{{ shape() === 'line' ? 'show_chart' : 'bar_chart' }}</span>
      Gráfico por desarrollar
    </span>
    <p class="absolute inset-x-4 bottom-3 text-xs text-ink-muted" aria-hidden="true">
      <span class="font-medium text-ink">{{ kind() }}</span> · {{ description() }}
      @if (source()) {
        · fuente: {{ source() }}
      }
    </p>
  `,
})
export class ChartPlaceholder {
  /** Chart type, e.g. "Histograma", "Línea". */
  readonly kind = input.required<string>();
  /** What the chart will show. */
  readonly description = input.required<string>();
  /** Data source, for reviewers, e.g. "student_grades". */
  readonly source = input<string>();
  readonly shape = input<ChartPlaceholderShape>('bars');

  protected readonly bars = [22, 36, 58, 84, 100, 88, 60, 34];
  protected readonly ariaLabel = computed(() => `Gráfico por desarrollar: ${this.kind()}. ${this.description()}`);
}
