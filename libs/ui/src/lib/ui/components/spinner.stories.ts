import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Button } from './button';
import { Spinner } from './spinner';

const meta: Meta<Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  decorators: [moduleMetadata({ imports: [Spinner, Button] })],
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] }, label: { control: 'text' } },
  args: { size: 'md', label: 'Cargando' },
  render: (args) => ({ props: args, template: `<span uiSpinner [size]="size" [label]="label"></span>` }),
  parameters: {
    docs: {
      description: {
        component:
          'For pages, sections and rows (announces "Cargando"). For a button that is saving, use `uiButton [loading]` instead.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Spinner>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-4">
        <span uiSpinner size="xs"></span><span uiSpinner size="sm"></span><span uiSpinner></span><span uiSpinner size="lg" class="text-primary"></span>
      </div>
    `,
  }),
};

/** A section loading, and the button alternative: `[loading]` instead of a spinner inside. */
export const InContext: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-md flex-col gap-6">
        <div class="flex items-center justify-center gap-2 rounded-box border border-line py-10 text-sm text-ink-muted">
          <span uiSpinner size="sm" label="Cargando notas"></span> Cargando notas…
        </div>
        <div class="flex gap-2">
          <button uiButton variant="primary" type="button" loading>Guardando…</button>
          <button uiButton variant="ghost" iconOnly loading type="button" aria-label="Descargando"></button>
        </div>
      </div>
    `,
  }),
};
