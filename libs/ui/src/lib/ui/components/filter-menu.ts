import { A11yModule } from '@angular/cdk/a11y';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, ElementRef, inject, input, model, output } from '@angular/core';
import { Button } from './button';
import { Icon } from './icon';

let nextId = 0;

/**
 * The filters of a list or table, behind one button (search stays outside, always visible):
 *
 *   <ui-table-toolbar>
 *     <label uiInputGroup size="sm">…search…</label>
 *     <ui-filter-menu [activeCount]="activeFilters()" (clear)="clearFilters()">
 *       <ui-field label="Grupo"><select uiSelect [(ngModel)]="group">…</select></ui-field>
 *       <fieldset> <legend>Estado</legend> <ui-choice label="Al día"><input type="checkbox" uiCheckbox …/></ui-choice> … </fieldset>
 *     </ui-filter-menu>
 *     <ng-container uiToolbarChips> …one ui-filter-chip per active filter… </ng-container>
 *   </ui-table-toolbar>
 *
 * The button shows how many filters are on. The panel is a non-modal dialog: focus moves into it on
 * open and back to the button on close; Escape, a click outside or "Listo" close it. Filters apply as
 * they change (the panel holds no draft state), so the list updates behind it and the chips show what
 * is active after it closes. `clear` asks the page to reset its filters.
 */
@Component({
  selector: 'ui-filter-menu',
  imports: [A11yModule, Button, Icon, OverlayModule],
  host: { class: 'ui-filter-menu' },
  template: `
    <button
      uiButton
      size="sm"
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="ui-filter-menu-trigger"
      [class.ui-filter-menu-on]="activeCount() > 0"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null"
      (click)="open.set(!open())"
    >
      <ui-icon name="funnel" class="text-base" />
      {{ label() }}
      @if (activeCount() > 0) {
        <span class="ui-filter-menu-count" [attr.aria-label]="activeCount() + ' activos'">{{ activeCount() }}</span>
      }
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayPush]="true"
      (overlayOutsideClick)="onOutsideClick($event)"
      (overlayKeydown)="onKeydown($event)"
      (detach)="open.set(false)"
    >
      <div
        class="ui-filter-panel"
        role="dialog"
        [id]="panelId"
        [attr.aria-label]="label()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <div class="ui-filter-panel-body"><ng-content /></div>
        <div class="ui-filter-panel-foot">
          <button
            uiButton
            variant="ghost"
            size="sm"
            type="button"
            [disabled]="activeCount() === 0"
            (click)="clear.emit()"
          >
            Limpiar
          </button>
          <button uiButton variant="primary" size="sm" type="button" (click)="open.set(false)">Listo</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class UiFilterMenu {
  readonly label = input('Filtros');
  /** How many filters are on; shown on the button. */
  readonly activeCount = input(0);
  /** Whether the panel is open. Two-way: `[(open)]`. */
  readonly open = model(false);
  readonly clear = output<void>();

  protected readonly panelId = `ui-filter-panel-${nextId++}`;
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  /** A click on the button itself toggles; anywhere else outside closes. */
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.open.set(false);
    }
  }
}
