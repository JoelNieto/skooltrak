import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Skooltrak button. Apply it to a native `<button>` or `<a>` so keyboard, form and link behaviour
 * stay native:
 *
 *   <button uiButton variant="primary" (click)="save()">Guardar</button>
 *   <a uiButton variant="ghost" size="sm" routerLink="/cursos">Ver cursos</a>
 *   <button uiButton variant="ghost" iconOnly aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
 *   <button uiButton variant="primary" type="submit" [loading]="saving()">Guardar</button>
 *
 * Variants: primary (the school's action colour, swaps to ink on hover) · secondary (neutral fill,
 * the default) · ghost (no fill) · danger (destructive, outlined).
 * Sizes: sm · md (default) · lg. Shape is always a pill; `iconOnly` makes it a circle.
 *
 * DaisyUI's `.btn` stays underneath; this component is the only place templates should get it from.
 */
@Component({
  // Attribute selector on purpose: the host must stay a real <button>/<a>.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[uiButton], a[uiButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn ui-btn',
    '[class.btn-primary]': "variant() === 'primary'",
    '[class.ui-btn-primary]': "variant() === 'primary'",
    '[class.ui-btn-secondary]': "variant() === 'secondary'",
    '[class.btn-ghost]': "variant() === 'ghost'",
    '[class.btn-error]': "variant() === 'danger'",
    '[class.btn-outline]': "variant() === 'danger'",
    '[class.btn-sm]': "size() === 'sm'",
    '[class.btn-lg]': "size() === 'lg'",
    '[class.btn-circle]': 'iconOnly()',
    '[class.ui-btn-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
  template: `
    @if (loading()) {
      <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      border-radius: 9999px;
      font-weight: 500;
      gap: 0.375rem;
      transition:
        background-color 0.2s var(--ui-ease),
        color 0.2s var(--ui-ease),
        border-color 0.2s var(--ui-ease);
    }

    /* primary: action colour, swaps to ink on hover (no lift, no scale) */
    :host(.ui-btn-primary:hover:not(:disabled, [aria-disabled='true'])) {
      --btn-color: var(--ui-ink-strong);
      --btn-fg: var(--ui-surface-1);
      --btn-bg: var(--ui-ink-strong);
    }

    /* secondary: neutral fill */
    :host(.ui-btn-secondary) {
      --btn-color: var(--ui-surface-2);
      --btn-bg: var(--ui-surface-2);
      --btn-fg: var(--ui-ink-strong);
      --btn-border: transparent;
    }
    :host(.ui-btn-secondary:hover:not(:disabled, [aria-disabled='true'])) {
      --btn-bg: var(--ui-line-strong);
    }

    /* ghost keeps the surrounding text colour */
    :host(.btn-ghost) {
      --btn-fg: currentColor;
    }

    /* loading: keep the look, block repeat clicks */
    :host(.ui-btn-loading) {
      pointer-events: none;
    }
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  /** Square content (a single icon) → circular button. Give it an `aria-label`. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Shows a spinner before the label, sets aria-busy and ignores clicks. */
  readonly loading = input(false, { transform: booleanAttribute });
}
