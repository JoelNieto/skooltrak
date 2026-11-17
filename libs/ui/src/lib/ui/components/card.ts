import { booleanAttribute, computed, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Card primitives. Attribute directives, so the host keeps its meaning (div, section, article, li,
 * or a link/button for a clickable card):
 *
 *   <section uiCard>
 *     <div uiCardBody>
 *       <h2 uiCardTitle>Asistencia</h2>
 *       <p>…</p>
 *       <div uiCardActions><button uiButton variant="primary">Ver detalle</button></div>
 *     </div>
 *   </section>
 *
 *   <a uiCard [routerLink]="['/courses', course.id]">…</a>   <!-- interactive automatically -->
 *   <div uiCard interactive (click)="open()">…</div>
 *
 * Surface: the card surface token, a hairline border and the box radius; no shadow. Interactive
 * cards strengthen the border on hover and show a focus ring. A card without `uiCardBody` has no
 * padding (useful for a table or list that runs edge to edge). Styles live in theme.css (`.ui-card`).
 * DaisyUI's `.card` classes stay underneath; these directives are the only place templates get them.
 */
@Directive({
  selector: '[uiCard]',
  host: {
    class: 'card ui-card',
    '[class.ui-card-interactive]': 'isInteractive()',
    '[class.ui-card-bleed]': 'bleed()',
  },
})
export class Card {
  /** Hover and focus styling for a clickable card. Links and buttons get it automatically. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /**
   * On phones (below 640px) the card runs edge to edge: no side borders or rounded corners, its
   * content aligned with the page gutter. For cards that hold a list or table. Cards that wrap a
   * uiTable directly do this without the input.
   */
  readonly bleed = input(false, { transform: booleanAttribute });

  private readonly isLinkOrButton = ['A', 'BUTTON'].includes(inject(ElementRef).nativeElement.tagName);
  readonly isInteractive = computed(() => this.interactive() || this.isLinkOrButton);
}

/** Padded content area of a card: `<div uiCardBody>`. */
@Directive({ selector: '[uiCardBody]', host: { class: 'card-body ui-card-body' } })
export class CardBody {}

/** Card heading: `<h2 uiCardTitle>`. Use the heading level that fits the page outline. */
@Directive({ selector: '[uiCardTitle]', host: { class: 'card-title ui-card-title' } })
export class CardTitle {}

/** Row of actions at the end of a card body, aligned to the end: `<div uiCardActions>`. */
@Directive({ selector: '[uiCardActions]', host: { class: 'card-actions ui-card-actions' } })
export class CardActions {}
