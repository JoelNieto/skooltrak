import { booleanAttribute, Component, computed, Directive, inject, input, model } from '@angular/core';
import { UiIconName } from '../icons/icons';
import { Icon } from './icon';

export type TableDensity = 'comfortable' | 'compact';
export type UiSortDirection = 'asc' | 'desc';
/** The column a table is sorted by: `{ active: 'name', direction: 'asc' }`. */
export interface UiTableSort {
  active: string;
  direction: UiSortDirection;
}

/**
 * Data table. Apply it to a native `<table>`; header and row styles come from the design tokens
 * (muted header text, hairline row dividers, strong first column):
 *
 *   <div class="overflow-x-auto">
 *     <table uiTable rowHover>
 *       <thead><tr><th>Estudiante</th><th>Estado</th></tr></thead>
 *       <tbody>
 *         @for (s of students(); track s.id) {
 *           <tr [routerLink]="['/students', s.id]"><td>{{ s.name }}</td><td>…</td></tr>
 *         }
 *       </tbody>
 *     </table>
 *   </div>
 *
 * Put it inside `<div uiCard class="overflow-x-auto">` (no uiCardBody) for a table panel that runs
 * edge to edge. Inputs: `density` (compact for dense data), `zebra`, `rowHover` (rows that open
 * something on click) and `stickyHeader` (inside a scrolling container with a max height).
 * DaisyUI's `.table` stays underneath; this is the only place templates should get it from.
 *
 * Sorting: bind `[(sort)]` and mark sortable headers with `uiSortHeader="<key>"`. Clicking a header
 * sorts by it ascending, then toggles the direction; the table only holds the state, so sort the
 * rows (or query the API) from it. States: see table-states.ts (skeleton, empty, error rows).
 */
@Directive({
  selector: 'table[uiTable]',
  host: {
    class: 'table ui-table',
    '[class.table-sm]': "density() === 'compact'",
    '[class.table-zebra]': 'zebra()',
    '[class.table-pin-rows]': 'stickyHeader()',
    '[class.ui-table-row-hover]': 'rowHover()',
  },
})
export class UiTable {
  readonly density = input<TableDensity>('comfortable');
  readonly zebra = input(false, { transform: booleanAttribute });
  /** Highlights the row under the pointer; use when rows are clickable. */
  readonly rowHover = input(false, { transform: booleanAttribute });
  /** Keeps the header visible while the table scrolls inside its container. */
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  /** Current sort, or null when unsorted. Two-way: `[(sort)]="sort"`. */
  readonly sort = model<UiTableSort | null>(null);

  /** Sorts by `key` ascending, or flips the direction when it is already the sorted column. */
  toggleSort(key: string): void {
    const current = this.sort();
    this.sort.set(
      current?.active === key
        ? { active: key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { active: key, direction: 'asc' },
    );
  }
}

/**
 * A sortable column header: `<th uiSortHeader="name">Nombre</th>` inside a `table[uiTable]`.
 * Renders the label as a button (keyboard and screen readers) and sets aria-sort on the header.
 */
@Component({
  // Attribute selector on purpose: the host must stay a native table element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'th[uiSortHeader]',
  imports: [Icon],
  host: {
    class: 'ui-sort-header',
    '[class.ui-sort-active]': 'active()',
    '[attr.aria-sort]': 'ariaSort()',
  },
  template: `
    <button type="button" class="ui-sort-button" (click)="table.toggleSort(key())">
      <ng-content />
      <ui-icon [name]="icon()" class="ui-sort-icon" />
    </button>
  `,
})
export class UiSortHeader {
  readonly key = input.required<string>({ alias: 'uiSortHeader' });
  protected readonly table = inject(UiTable);

  readonly active = computed(() => this.table.sort()?.active === this.key());
  readonly direction = computed<UiSortDirection | null>(() => {
    const sort = this.table.sort();
    return sort?.active === this.key() ? sort.direction : null;
  });
  protected readonly ariaSort = computed(() =>
    this.direction() === 'asc' ? 'ascending' : this.direction() === 'desc' ? 'descending' : null,
  );
  protected readonly icon = computed<UiIconName>(() =>
    this.direction() === 'asc' ? 'arrow-up' : this.direction() === 'desc' ? 'arrow-down' : 'chevrons-up-down',
  );
}
