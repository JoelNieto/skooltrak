import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Badge } from './badge';
import { Card } from './card';
import { UiCheckbox } from './field';
import { Button } from './button';
import { Icon } from './icon';
import { UiRowAction, UiRowActions } from './row-actions';
import { UiSortHeader, UiTable, UiTableSort } from './table';
import { UiTableEmpty, UiTableError, UiTableSkeleton } from './table-states';

type TableArgs = UiTable & { inCard: boolean };

const rows = [
  { name: 'María González', group: '7° A', average: 4.6, status: 'Al día', tone: 'success' },
  { name: 'Juan Pérez', group: '7° A', average: 3.4, status: '2 pendientes', tone: 'warning' },
  { name: 'Camila Ortiz', group: '7° B', average: 2.8, status: 'En riesgo', tone: 'danger' },
  { name: 'Andrés Rojas', group: '7° B', average: 4.1, status: 'Al día', tone: 'success' },
];

const meta: Meta<TableArgs> = {
  title: 'Primitives/Table',
  component: UiTable,
  decorators: [
    moduleMetadata({
      imports: [
        UiTable,
        UiSortHeader,
        UiTableSkeleton,
        UiTableEmpty,
        UiTableError,
        UiRowActions,
        Card,
        Badge,
        Button,
        Icon,
        UiCheckbox,
      ],
    }),
  ],
  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    zebra: { control: 'boolean' },
    rowHover: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
  },
  args: { density: 'comfortable', zebra: false, rowHover: true, stickyHeader: false },
  render: (args) => ({
    props: { ...args, rows },
    template: `
      <div uiCard class="max-w-2xl overflow-x-auto">
        <table uiTable [density]="density" [zebra]="zebra" [rowHover]="rowHover" [stickyHeader]="stickyHeader">
          <thead><tr><th>Estudiante</th><th>Grupo</th><th class="text-right">Promedio</th><th>Estado</th></tr></thead>
          <tbody>
            @for (r of rows; track r.name) {
              <tr>
                <td>{{ r.name }}</td>
                <td>{{ r.group }}</td>
                <td class="text-right tabular-nums">{{ r.average }}</td>
                <td><span uiBadge size="sm" [tone]="r.tone">{{ r.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TableArgs>;

/** In a `uiCard` with no body: the table runs edge to edge. Rows are clickable, so `rowHover`. */
export const InCard: Story = {};

export const Compact: Story = { args: { density: 'compact', rowHover: false } };

export const Zebra: Story = { args: { zebra: true, rowHover: false } };

/** Bare table (inside a plain `overflow-x-auto` wrapper), e.g. within a card body or a modal. */
export const Plain: Story = {
  render: () => ({
    props: { rows },
    template: `
      <div class="max-w-2xl overflow-x-auto">
        <table uiTable>
          <thead><tr><th class="w-10"><input type="checkbox" uiCheckbox tone="neutral" aria-label="Seleccionar todo" /></th><th>Estudiante</th><th>Grupo</th></tr></thead>
          <tbody>
            @for (r of rows; track r.name) {
              <tr><td><input type="checkbox" uiCheckbox tone="neutral" [attr.aria-label]="r.name" /></td><td>{{ r.name }}</td><td>{{ r.group }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
};

const head = `<thead><tr><th>Estudiante</th><th>Grupo</th><th class="text-right">Promedio</th><th>Estado</th></tr></thead>`;

/** While rows load: the header stays, skeleton rows hold the space (`tbody uiTableSkeleton`). */
export const Loading: Story = {
  render: () => ({
    template: `
      <div uiCard class="max-w-2xl overflow-x-auto">
        <table uiTable aria-busy="true">${head}<tbody uiTableSkeleton [columns]="4"></tbody></table>
      </div>
    `,
  }),
};

/** Nothing yet: say what goes here and offer the first step. */
export const Empty: Story = {
  render: () => ({
    template: `
      <div uiCard class="max-w-2xl overflow-x-auto">
        <table uiTable>
          ${head}
          <tbody>
            <tr uiTableEmpty [columns]="4" icon="users" title="Aún no hay estudiantes en este grupo"
                description="Importa la lista desde un CSV o agrégalos uno por uno.">
              <button uiButton size="sm" variant="primary" type="button"><ui-icon name="plus" class="text-base" />Agregar estudiante</button>
              <button uiButton size="sm" type="button"><ui-icon name="upload" class="text-base" />Importar CSV</button>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};

/** Filters match nothing: name the cause and offer the way back. */
export const NoResults: Story = {
  render: () => ({
    template: `
      <div uiCard class="max-w-2xl overflow-x-auto">
        <table uiTable>
          ${head}
          <tbody>
            <tr uiTableEmpty [columns]="4" icon="search-x" title="Sin resultados para «Ramírez»"
                description="Prueba con otro nombre o quita el filtro de grupo.">
              <button uiButton size="sm" type="button">Limpiar filtros</button>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};

/** Rows failed to load: an alert with retry; the header stays so the page doesn't jump. */
export const ErrorState: Story = {
  render: () => ({
    template: `
      <div uiCard class="max-w-2xl overflow-x-auto">
        <table uiTable>${head}<tbody><tr uiTableError [columns]="4"></tr></tbody></table>
      </div>
    `,
  }),
};

/** Sortable headers: bind \`[(sort)]\` and sort the rows from it (here on the client). */
export const Sortable: Story = {
  render: () => {
    const sort = signal<UiTableSort | null>({ active: 'average', direction: 'desc' });
    const sorted = computed(() => {
      const s = sort();
      if (!s) return rows;
      const key = s.active as 'name' | 'group' | 'average';
      const dir = s.direction === 'asc' ? 1 : -1;
      return [...rows].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
    });
    return {
      props: { sort, sorted },
      template: `
        <div uiCard class="max-w-2xl overflow-x-auto">
          <table uiTable [(sort)]="sort">
            <thead><tr>
              <th uiSortHeader="name">Estudiante</th><th uiSortHeader="group">Grupo</th>
              <th uiSortHeader="average" class="text-right">Promedio</th><th>Estado</th>
            </tr></thead>
            <tbody>
              @for (r of sorted(); track r.name) {
                <tr><td>{{ r.name }}</td><td>{{ r.group }}</td><td class="text-right tabular-nums">{{ r.average }}</td>
                <td><span uiBadge size="sm" [tone]="r.tone">{{ r.status }}</span></td></tr>
              }
            </tbody>
          </table>
        </div>
      `,
    };
  },
};

const rowActions: UiRowAction[] = [
  { id: 'view', label: 'Ver perfil', icon: 'eye' },
  { id: 'edit', label: 'Editar', icon: 'pencil' },
  { id: 'message', label: 'Escribir a la familia', icon: 'mail' },
  { id: 'remove', label: 'Quitar del grupo', icon: 'trash-2', tone: 'danger' },
];

/** Row actions: one menu per row, named after the row; destructive actions last, in red. */
export const WithRowActions: Story = {
  render: () => ({
    props: { rows, rowActions, last: signal('') },
    template: `
      <div class="flex max-w-2xl flex-col gap-3">
        <div uiCard class="overflow-x-auto">
          <table uiTable>
            <thead><tr><th>Estudiante</th><th>Grupo</th><th class="w-12"><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              @for (r of rows; track r.name) {
                <tr><td>{{ r.name }}</td><td>{{ r.group }}</td>
                <td class="text-right"><ui-row-actions [actions]="rowActions" [label]="'Acciones para ' + r.name" (action)="last.set($event + ' · ' + r.name)" /></td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-sm text-ink-muted" aria-live="polite">Última acción: {{ last() || '—' }}</p>
      </div>
    `,
  }),
};
