import type { Meta, StoryObj } from '@storybook/angular';
import { MultiSelect } from './multiselect';

const meta: Meta<MultiSelect> = {
  title: 'Future/MultiSelect',
  component: MultiSelect,
  tags: ['future'],
  parameters: {
    docs: {
      description: {
        component: [
          '**Future: to be rebuilt from scratch before first use.** Not used by any app yet; do not adopt this version.',
          '',
          'Known problems: styles use undefined CSS variables instead of design tokens, options are hard-coded, and it',
          'registers as a form control without implementing `ControlValueAccessor`.',
        ].join('\n'),
      },
    },
  },
  render: () => ({
    template: `<div class="max-w-xs pb-56"><lib-multiselect /></div>`,
  }),
};

export default meta;
type Story = StoryObj<MultiSelect>;

export const Current: Story = {};
