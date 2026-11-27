import {
  createCloseScrollStrategy,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';

/** The bubble itself: inverse colours, the label, and an unread count when there is one. */
@Component({
  selector: 'app-rail-tooltip-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    class:
      'relative flex items-center gap-2 whitespace-nowrap rounded-md bg-neutral px-2.5 py-1.5 text-[0.8125rem] font-medium text-neutral-content shadow-lg pointer-events-none',
  },
  template: `<span
      class="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-neutral"
      aria-hidden="true"
    ></span>
    <span>{{ label() }}</span>
    @if (count(); as c) {
      <span class="text-xs font-semibold opacity-70 tabular-nums">{{ c > 99 ? '99+' : c }} sin leer</span>
    }`,
})
export class RailTooltipBubble {
  readonly label = input('');
  readonly count = input<number | null | undefined>(null);
}

/**
 * Tooltip to the right of a sidebar rail item, shown on hover and keyboard focus while `enabled`.
 * Purely visual: the item keeps its own accessible name (a visually hidden label), so the bubble
 * is not announced twice.
 *
 *   <a [appRailTooltip]="'Cursos'" [appRailTooltipCount]="3" [appRailTooltipEnabled]="compact()">…</a>
 */
@Directive({
  selector: '[appRailTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(click)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class RailTooltip {
  readonly appRailTooltip = input.required<string>();
  readonly appRailTooltipCount = input<number | null | undefined>(null);
  readonly appRailTooltipEnabled = input(true);

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  #ref: OverlayRef | null = null;

  constructor() {
    effect(() => {
      if (!this.appRailTooltipEnabled()) this.hide();
    });
    inject(DestroyRef).onDestroy(() => this.#ref?.dispose());
  }

  protected show(): void {
    if (!this.appRailTooltipEnabled() || this.#ref?.hasAttached()) return;
    if (!this.#ref) {
      const positionStrategy = createFlexibleConnectedPositionStrategy(this.#injector, this.#host)
        .withPositions([{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 12 }])
        .withPush(false);
      this.#ref = createOverlayRef(this.#injector, {
        positionStrategy,
        scrollStrategy: createCloseScrollStrategy(this.#injector),
        panelClass: 'app-rail-tooltip',
      });
    }
    const bubble = this.#ref.attach(new ComponentPortal(RailTooltipBubble));
    bubble.setInput('label', this.appRailTooltip());
    bubble.setInput('count', this.appRailTooltipCount());
  }

  protected hide(): void {
    if (this.#ref?.hasAttached()) this.#ref.detach();
  }
}
