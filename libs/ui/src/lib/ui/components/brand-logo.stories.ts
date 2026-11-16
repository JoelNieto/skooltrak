import type { Meta, StoryObj } from '@storybook/angular';
import { BrandLogo } from './brand-logo';

const meta: Meta<BrandLogo> = {
  title: 'Primitives/Brand logo',
  component: BrandLogo,
  argTypes: {
    variant: { control: 'inline-radio', options: ['horizontal', 'stacked', 'isotype'] },
    alt: { control: 'text' },
  },
  args: { variant: 'horizontal', alt: 'Skooltrak' },
  render: (args) => ({
    props: args,
    template: `<ui-brand-logo class="h-10" [variant]="variant" [alt]="alt" />`,
  }),
};

export default meta;
type Story = StoryObj<BrandLogo>;

export const Playground: Story = {};

/** Pick the lockup by the space; the theme picks the file. */
export const Lockups: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-end gap-10">
        <div class="flex flex-col gap-2"><ui-brand-logo class="h-10" /><span class="text-xs text-ink-muted">horizontal · h-10</span></div>
        <div class="flex flex-col gap-2"><ui-brand-logo variant="stacked" class="h-24" /><span class="text-xs text-ink-muted">stacked · h-24</span></div>
        <div class="flex flex-col gap-2"><ui-brand-logo variant="isotype" class="h-10" /><span class="text-xs text-ink-muted">isotype · h-10</span></div>
        <div class="flex flex-col gap-2"><ui-brand-logo variant="isotype" class="h-4" /><span class="text-xs text-ink-muted">isotype · 16px minimum</span></div>
      </div>
    `,
  }),
};
