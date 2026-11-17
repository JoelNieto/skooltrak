import type { Meta, StoryObj } from '@storybook/angular';
import { Badge } from './badge';

type BadgeArgs = Badge & { label: string };

const meta: Meta<BadgeArgs> = {
  title: 'Primitives/Badge',
  component: Badge,
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'action', 'info', 'success', 'warning', 'danger', 'new'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    label: { control: 'text' },
  },
  args: { tone: 'success', size: 'md', label: 'Activo' },
  render: (args) => ({
    props: args,
    template: `<span uiBadge [tone]="tone" [size]="size">{{ label }}</span>`,
  }),
};

export default meta;
type Story = StoryObj<BadgeArgs>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span uiBadge>Solo lectura</span>
          <span uiBadge tone="action">Comunicado</span>
          <span uiBadge tone="info">Parcial</span>
          <span uiBadge tone="success">Pagado</span>
          <span uiBadge tone="warning">Pendiente</span>
          <span uiBadge tone="danger">Vencido</span>
          <span uiBadge tone="new">3 nuevos</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span uiBadge size="sm">Solo lectura</span>
          <span uiBadge size="sm" tone="action">Comunicado</span>
          <span uiBadge size="sm" tone="info">Parcial</span>
          <span uiBadge size="sm" tone="success">Pagado</span>
          <span uiBadge size="sm" tone="warning">Pendiente</span>
          <span uiBadge size="sm" tone="danger">Vencido</span>
          <span uiBadge size="sm" tone="new">3</span>
        </div>
      </div>
    `,
  }),
};

/** Map data to a tone in TypeScript and bind `[tone]`. */
export const FromStatus: Story = {
  render: () => ({
    props: {
      charges: [
        { concept: 'Matrícula', status: 'PAID' },
        { concept: 'Mensualidad marzo', status: 'PARTIAL' },
        { concept: 'Mensualidad abril', status: 'PENDING' },
        { concept: 'Mensualidad febrero', status: 'OVERDUE' },
      ],
      statusTone: (s: string) =>
        ({ PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'danger' })[s] ?? 'neutral',
    },
    template: `
      <ul class="flex max-w-sm flex-col gap-2">
        @for (c of charges; track c.concept) {
          <li class="flex items-center justify-between text-sm">
            {{ c.concept }} <span uiBadge size="sm" [tone]="statusTone(c.status)">{{ c.status }}</span>
          </li>
        }
      </ul>
    `,
  }),
  parameters: {
    docs: {
      source: {
        language: 'ts',
        code: `const STATUS_TONES: Record<ChargeStatus, BadgeTone> = { PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'danger' };
statusTone = (status: ChargeStatus) => STATUS_TONES[status] ?? 'neutral';

<span uiBadge size="sm" [tone]="statusTone(charge.status)">{{ charge.status }}</span>`,
      },
    },
  },
};

export const AsLink: Story = {
  render: () => ({
    template: `<div class="flex gap-2"><a uiBadge tone="action" href="#">Matemáticas 7° A</a><a uiBadge href="#">Grupo 7° A</a></div>`,
  }),
};
