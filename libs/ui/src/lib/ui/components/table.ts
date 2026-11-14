import { booleanAttribute, Directive, input } from '@angular/core';

export type TableDensity = 'comfortable' | 'compact';

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
}
