import { Directive, input } from '@angular/core';

/**
 * A pill-shaped toggle for filters (ACA-001 FR .7): one of a row of choices, where the chosen one
 * is filled. It is a real button whose state is announced through `aria-pressed`, so put the row in
 * a `role="group"` with an `aria-label`:
 *
 *   <div role="group" aria-label="Filtrar por área" class="flex flex-wrap gap-2">
 *     @for (chip of chips(); track chip.key) {
 *       <button uiChip [pressed]="area() === chip.key" (click)="area.set(chip.key)">
 *         {{ chip.label }} <span uiChipCount>{{ chip.count }}</span>
 *       </button>
 *     }
 *   </div>
 *
 * `uiChipCount` styles an optional count after the label.
 */
@Directive({
  selector: 'button[uiChip]',
  host: {
    type: 'button',
    class:
      'ui-chip inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
    '[attr.aria-pressed]': 'pressed()',
    '[class.ui-chip--pressed]': 'pressed()',
    '[class.border-ink-strong]': 'pressed()',
    '[class.bg-ink-strong]': 'pressed()',
    '[class.text-surface-1]': 'pressed()',
    '[class.border-line-control]': '!pressed()',
    '[class.bg-surface-1]': '!pressed()',
    '[class.text-ink]': '!pressed()',
    '[class.hover:bg-surface-2]': '!pressed()',
  },
})
export class Chip {
  /** Whether this choice is the selected one. */
  readonly pressed = input(false);
}

/** The count after a chip's label: lighter, in tabular figures. */
@Directive({
  selector: '[uiChipCount]',
  host: { class: 'ui-chip__count text-xs font-medium tabular-nums opacity-75' },
})
export class ChipCount {}
