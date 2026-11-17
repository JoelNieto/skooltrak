import type { Meta, StoryObj } from '@storybook/angular';
import { UI_ICONS, UiIconName } from '../icons/icons';
import { Icon } from './icon';

const NAMES = Object.keys(UI_ICONS) as UiIconName[];

const meta: Meta<Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
  argTypes: {
    name: { control: 'select', options: NAMES },
    label: { control: 'text' },
  },
  args: { name: 'calendar' },
  render: (args) => ({
    props: args,
    template: `<ui-icon [name]="name" [label]="label" class="text-4xl text-ink-strong" />`,
  }),
};

export default meta;
type Story = StoryObj<Icon>;

export const Playground: Story = {};

/** Size follows font-size (1em); colour follows the text colour. */
export const SizeAndColour: Story = {
  render: () => ({
    template: `
      <div class="flex items-end gap-6 text-ink-strong">
        <ui-icon name="bell" class="text-base" />
        <ui-icon name="bell" class="text-xl" />
        <ui-icon name="bell" />
        <ui-icon name="bell" class="text-4xl text-action" />
        <ui-icon name="bell-ring" class="text-4xl text-new-text" />
        <ui-icon name="circle-alert" class="text-4xl text-error" label="Error" />
      </div>
    `,
  }),
};

/** Every icon in the registry (libs/ui/src/lib/ui/icons/icons.ts). */
export const Registry: Story = {
  render: () => ({
    props: { names: NAMES },
    template: `
      <div class="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
        @for (n of names; track n) {
          <div class="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-1 p-3 text-ink-strong">
            <ui-icon [name]="n" />
            <code class="type-caption text-ink-muted text-center break-all">{{ n }}</code>
          </div>
        }
      </div>
    `,
  }),
};
