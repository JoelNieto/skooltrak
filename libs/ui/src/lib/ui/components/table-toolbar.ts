import { Component, input, output } from '@angular/core';
import { Icon } from './icon';

/**
 * The bar above a table: search, filters, and the page's main action.
 *
 *   <ui-table-toolbar>
 *     <label uiInputGroup size="sm">…search…</label>
 *     <ui-filter-menu [activeCount]="activeFilters()" (clear)="clearFilters()">…filter fields…</ui-filter-menu>
 *     <span uiToolbarEnd>12 de 40</span>
 *     <button uiButton variant="primary" size="sm" uiToolbarEnd>Nueva materia</button>
 *     <ng-container uiToolbarChips>
 *       <ui-filter-chip label="Estado: Activa" (remove)="status.set('')" />
 *       <button uiButton variant="ghost" size="sm">Limpiar filtros</button>
 *     </ng-container>
 *   </ui-table-toolbar>
 *
 * Search stays visible; every other filter goes in a ui-filter-menu (the button shows how many are
 * on). Default content sits on the left and wraps; `uiToolbarEnd` goes on the right (a result count,
 * the main action); `uiToolbarChips` is a second row with one chip per active filter, so what's
 * applied stays visible after the menu closes. A search landmark, so screen readers can jump to it.
 */
@Component({
  selector: 'ui-table-toolbar',
  host: { class: 'ui-table-toolbar', role: 'search', '[attr.aria-label]': 'label()' },
  template: `
    <div class="ui-table-toolbar-row">
      <div class="ui-table-toolbar-filters"><ng-content /></div>
      <div class="ui-table-toolbar-end"><ng-content select="[uiToolbarEnd]" /></div>
    </div>
    <div class="ui-table-toolbar-chips"><ng-content select="[uiToolbarChips]" /></div>
  `,
})
export class UiTableToolbar {
  readonly label = input('Filtros');
}

/** An active filter, removable: `<ui-filter-chip label="Estado: Activa" (remove)="…" />`. */
@Component({
  selector: 'ui-filter-chip',
  imports: [Icon],
  host: { class: 'ui-filter-chip' },
  template: `
    <span>{{ label() }}</span>
    <button
      type="button"
      class="ui-filter-chip-remove"
      [attr.aria-label]="'Quitar filtro: ' + label()"
      (click)="remove.emit()"
    >
      <ui-icon name="x" />
    </button>
  `,
})
export class UiFilterChip {
  readonly label = input.required<string>();
  readonly remove = output<void>();
}
