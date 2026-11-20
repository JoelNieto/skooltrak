import { COURSE_COLORS, SUBJECT_ICONS } from '@/shared';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CourseCover } from './course-cover';

const meta: Meta<CourseCover> = {
  title: 'Primitives/Course cover',
  component: CourseCover,
  decorators: [moduleMetadata({ imports: [CourseCover] })],
  argTypes: {
    color: { control: 'select', options: COURSE_COLORS.map((c) => c.key) },
    icon: { control: 'select', options: SUBJECT_ICONS.map((i) => i.name) },
    variant: { control: 'inline-radio', options: ['card', 'tile'] },
  },
  args: { color: 'INDIGO', icon: 'sigma', variant: 'card' },
  render: (args) => ({
    props: args,
    template: `<div class="max-w-xs overflow-hidden rounded-xl border border-line">
      <ui-course-cover [color]="color" [icon]="icon" [variant]="variant" />
    </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          "A course's cover when it has no photo: its color tag and its subject's icon. Colors come from `--color-course-<key>` tokens, never raw hex.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<CourseCover>;

export const Playground: Story = {};

export const AllColors: Story = {
  render: () => ({
    props: { colors: COURSE_COLORS, icons: SUBJECT_ICONS },
    template: `
      <div class="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
        @for (c of colors; track c.key; let i = $index) {
          <figure class="overflow-hidden rounded-xl border border-line bg-surface-1">
            <ui-course-cover [color]="c.key" [icon]="icons[i].name" />
            <figcaption class="p-2 text-xs text-ink-muted">{{ c.label }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};

export const Tiles: Story = {
  render: () => ({
    props: { icons: SUBJECT_ICONS },
    template: `
      <div class="flex flex-wrap gap-3">
        @for (i of icons; track i.name) {
          <ui-course-cover variant="tile" color="SLATE" [icon]="i.name" [attr.title]="i.label" />
        }
      </div>`,
  }),
};
