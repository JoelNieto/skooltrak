import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Button } from './button';
import { Icon } from './icon';

type ButtonArgs = Button & { label: string };

const meta: Meta<ButtonArgs> = {
  title: 'Primitives/Button',
  component: Button,
  decorators: [moduleMetadata({ imports: [Button, Icon] })],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    iconOnly: { control: 'boolean' },
    loading: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { variant: 'primary', size: 'md', iconOnly: false, loading: false, label: 'Guardar' },
  render: (args) => ({
    props: args,
    template: `<button uiButton type="button" [variant]="variant" [size]="size" [iconOnly]="iconOnly" [loading]="loading">{{ label }}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button uiButton variant="primary" type="button">Primary</button>
        <button uiButton variant="secondary" type="button">Secondary</button>
        <button uiButton variant="ghost" type="button">Ghost</button>
        <button uiButton variant="danger" type="button">Danger</button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button uiButton variant="primary" size="sm" type="button">Small</button>
        <button uiButton variant="primary" type="button">Medium</button>
        <button uiButton variant="primary" size="lg" type="button">Large</button>
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button uiButton variant="primary" type="button">
          <ui-icon name="plus" /> Nuevo curso
        </button>
        <button uiButton variant="ghost" iconOnly aria-label="Cerrar" type="button">
          <ui-icon name="x" />
        </button>
        <button uiButton variant="secondary" iconOnly aria-label="Editar" type="button">
          <ui-icon name="pencil" />
        </button>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button uiButton variant="primary" loading type="button">Guardando</button>
        <button uiButton variant="primary" disabled type="button">Deshabilitado</button>
        <a uiButton variant="ghost" href="#">Enlace</a>
      </div>
    `,
  }),
};
