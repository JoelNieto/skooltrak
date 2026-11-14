import { Directive, ElementRef, inject, input } from '@angular/core';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Loading indicator for a page, section or row: `<span uiSpinner size="lg"></span>`.
 *
 * Standalone it announces itself (`role="status"`, label "Cargando" or `label`). Inside a button or
 * link it is decorative: the control's own text says what is happening. For a button that is
 * saving, use `<button uiButton [loading]="saving()">` instead of placing a spinner in it.
 * Colour follows the surrounding text; add a text colour class to change it.
 */
@Directive({
  selector: '[uiSpinner]',
  host: {
    class: 'loading loading-spinner ui-spinner',
    '[class.loading-xs]': "size() === 'xs'",
    '[class.loading-sm]': "size() === 'sm'",
    '[class.loading-lg]': "size() === 'lg'",
    '[attr.role]': 'decorative() ? null : "status"',
    '[attr.aria-label]': 'decorative() ? null : label()',
    '[attr.aria-hidden]': 'decorative() || null',
  },
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  /** What is loading, for screen readers. */
  readonly label = input('Cargando');

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private insideControl: boolean | undefined;

  /** Inside a button or link the spinner is decorative. Checked once it has a parent element. */
  protected decorative(): boolean {
    if (this.insideControl === undefined && this.host.parentElement) {
      this.insideControl = !!this.host.parentElement.closest('button, a');
    }
    return this.insideControl ?? false;
  }
}
