import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Badge } from './badge';
import { Card } from './card';
import { UiCheckbox } from './field';
import { UiTable } from './table';

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
  decorators: [moduleMetadata({ imports: [UiTable, Card, Badge, UiCheckbox] })],
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
