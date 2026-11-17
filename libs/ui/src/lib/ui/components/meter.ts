import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type MeterTone = 'action' | 'success' | 'warning' | 'danger';

/**
 * A thin progress bar with a short caption, for "how much of a known total": submissions handed in,
 * attendance, collection.
 *
 *   <ui-meter [value]="18" [max]="27" label="18/27 entregaron" />
 *
 * It renders a native `<progress>` named by `label`, so screen readers get both the value and what
 * it measures. With `max` 0 the bar is empty, not invalid. The colour comes from `tone`, never from
 * the value: the caller decides what counts as good or bad.
 */
@Component({
  selector: 'ui-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-meter flex items-center gap-2' },
  template: `
    <progress
      class="progress h-1.5 min-w-16 flex-1"
      [class.progress-primary]="tone() === 'action'"
      [class.progress-success]="tone() === 'success'"
      [class.progress-warning]="tone() === 'warning'"
      [class.progress-error]="tone() === 'danger'"
      [value]="clampedValue()"
      [max]="safeMax()"
      [attr.aria-label]="label()"
    ></progress>
    @if (showLabel()) {
      <span class="whitespace-nowrap text-xs text-ink-muted" aria-hidden="true">{{ label() }}</span>
    }
  `,
})
export class Meter {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  /** What the bar measures, e.g. "18/27 entregaron". Shown next to the bar and read by screen readers. */
  readonly label = input.required<string>();
  readonly tone = input<MeterTone>('action');
  /** Hide the caption when the surrounding text already says it (still used as the accessible name). */
  readonly showLabel = input(true);

  protected readonly safeMax = computed(() => (this.max() > 0 ? this.max() : 1));
  protected readonly clampedValue = computed(() =>
    this.max() > 0 ? Math.min(Math.max(this.value(), 0), this.max()) : 0,
  );
}
