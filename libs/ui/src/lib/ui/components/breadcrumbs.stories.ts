import type { Meta, StoryObj } from '@storybook/angular';
import { Breadcrumbs } from './breadcrumbs';

const meta: Meta<Breadcrumbs> = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          'Trail above a page title. Usually passed to `lib-page-header [breadcrumbs]`; the last item is the current page.',
      },
    },
  },
  args: {
    items: [
      { label: 'Inicio', link: '/' },
      { label: 'Cursos', link: '/courses' },
      { label: 'Matemáticas 7° A', link: ['/courses', 'mat-7a'] },
      { label: 'Notas' },
    ],
  },
  render: (args) => ({ props: args, template: `<ui-breadcrumbs [items]="items" />` }),
};

export default meta;
type Story = StoryObj<Breadcrumbs>;

export const Default: Story = {};

/** An item without `link` renders as text: a section with no page of its own. */
export const SectionWithoutPage: Story = {
  args: { items: [{ label: 'Inicio', link: '/' }, { label: 'Administración' }, { label: 'Colegios' }] },
};
