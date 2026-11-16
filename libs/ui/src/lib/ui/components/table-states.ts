import { Component, computed, input, output } from '@angular/core';
import { UiIconName } from '../icons/icons';
import { Button } from './button';
import { Icon } from './icon';
import { Skeleton } from './skeleton';

/**
 * States of a `table[uiTable]`, used in place of its rows. Every state keeps the table's header,
 * so the page doesn't jump when data arrives:
 *
 *   <table uiTable [attr.aria-busy]="rows.isLoading()">
 *     <thead>…</thead>
 *     @if (rows.isLoading()) {
 *       <tbody uiTableSkeleton [columns]="4"></tbody>
 *     } @else if (rows.error()) {
 *       <tbody><tr uiTableError [columns]="4" (retry)="rows.reload()"></tr></tbody>
 *     } @else {
 *       <tbody>
 *         @for (row of rows.value(); track row.id) { <tr>…</tr> }
 *         @empty {
 *           <tr uiTableEmpty [columns]="4" title="Aún no hay materias" icon="book-open">
 *             <button uiButton size="sm" variant="primary">Agregar materia</button>
 *           </tr>
 *         }
 *       </tbody>
 *     }
 *   </table>
 *
 * `columns` is the number of columns, so the state spans the whole table.
 */

/** Loading rows: `<tbody uiTableSkeleton [columns]="4"></tbody>`. Widths vary like real data. */
@Component({
  // Attribute selector on purpose: the host must stay a native table element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tbody[uiTableSkeleton]',
  imports: [Skeleton],
  host: { class: 'ui-table-skeleton' },
  template: `
    @for (row of rowList(); track row) {
      <tr>
        @for (col of columnList(); track col) {
          <td>
            @if (row === 0 && col === 0) {
              <span class="sr-only" role="status">{{ label() }}</span>
            }
            <span uiSkeleton class="ui-table-skeleton-bar" [style.width.%]="width(row, col)"></span>
          </td>
        }
      </tr>
    }
  `,
})
export class UiTableSkeleton {
  readonly columns = input.required<number>();
  /** Match the page size, so real rows replace the skeleton without the page changing height. */
  readonly rows = input(5);
  /** Announced to screen readers once. */
  readonly label = input('Cargando…');

  /** Capped: more placeholder rows than fit on screen add nothing. */
  protected readonly rowList = computed(() => Array.from({ length: Math.min(this.rows(), 12) }, (_, i) => i));
  protected readonly columnList = computed(() => Array.from({ length: this.columns() }, (_, i) => i));

  /** A fixed, varied width per cell (first column widest), so the placeholder reads like a table. */
  protected width(row: number, col: number): number {
    const base = col === 0 ? 70 : 45;
    return base + ((row * 7 + col * 13) % 4) * 8;
  }
}

/**
 * No rows: `<tr uiTableEmpty [columns]="4" title="…">`. Two uses, by wording:
 *   nothing yet    title="Aún no hay materias", an icon for the thing, a button to add the first one;
 *   no results     title="Sin resultados", icon="search-x", a button to clear the filters.
 * Projected content (buttons) goes under the text.
 */
@Component({
  // Attribute selector on purpose: the host must stay a native table element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tr[uiTableEmpty]',
  imports: [Icon],
  host: { class: 'ui-table-state-row' },
  template: `
    <td class="ui-table-state-cell" [attr.colspan]="columns()">
      <div class="ui-table-state">
        <span class="ui-table-state-icon"><ui-icon [name]="icon()" /></span>
        <p class="ui-table-state-title">{{ title() }}</p>
        @if (description()) {
          <p class="ui-table-state-text">{{ description() }}</p>
        }
        <div class="ui-table-state-actions"><ng-content /></div>
      </div>
    </td>
  `,
})
export class UiTableEmpty {
  readonly columns = input.required<number>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input<UiIconName>('inbox');
}

/** Rows failed to load: `<tr uiTableError [columns]="4" (retry)="rows.reload()">`. */
@Component({
  // Attribute selector on purpose: the host must stay a native table element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tr[uiTableError]',
  imports: [Button, Icon],
  host: { class: 'ui-table-state-row' },
  template: `
    <td class="ui-table-state-cell" [attr.colspan]="columns()">
      <div class="ui-table-state ui-table-state-error" role="alert">
        <span class="ui-table-state-icon"><ui-icon name="circle-alert" /></span>
        <p class="ui-table-state-title">{{ title() }}</p>
        @if (description()) {
          <p class="ui-table-state-text">{{ description() }}</p>
        }
        <div class="ui-table-state-actions">
          <button uiButton size="sm" type="button" (click)="retry.emit()">
            <ui-icon name="refresh-cw" class="text-base" />
            {{ retryLabel() }}
          </button>
          <ng-content />
        </div>
      </div>
    </td>
  `,
})
export class UiTableError {
  readonly columns = input.required<number>();
  readonly title = input('No se pudo cargar la información');
  readonly description = input<string>('Revisa tu conexión e inténtalo de nuevo.');
  readonly retryLabel = input('Reintentar');
  readonly retry = output<void>();
}
