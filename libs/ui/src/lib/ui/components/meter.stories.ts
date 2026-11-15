import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Meter } from './meter';

const meta: Meta<Meter> = {
  title: 'Primitives/Meter',
  component: Meter,
  decorators: [moduleMetadata({ imports: [Meter] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['action', 'success', 'warning', 'danger'] },
    value: { control: 'number' },
    max: { control: 'number' },
    label: { control: 'text' },
    showLabel: { control: 'boolean' },
  },
  args: { value: 18, max: 27, label: '18/27 entregaron', tone: 'action', showLabel: true },
  render: (args) => ({
    props: args,
    template: `<ui-meter class="max-w-sm" [value]="value" [max]="max" [label]="label" [tone]="tone" [showLabel]="showLabel" />`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Progress toward a known total, with its caption. The caller picks the tone; the meter never colours by value on its own.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Meter>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-sm flex-col gap-3">
        <ui-meter [value]="18" [max]="27" label="18/27 entregaron" />
        <ui-meter [value]="94" [max]="100" label="94 %" tone="success" />
        <ui-meter [value]="68" [max]="100" label="68 % cobrado" tone="warning" />
        <ui-meter [value]="78" [max]="100" label="78 %" tone="danger" />
        <ui-meter [value]="0" [max]="0" label="Sin estudiantes" />
      </div>
    `,
  }),
};
