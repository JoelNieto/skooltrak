import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Alert } from './alert';
import { Button } from './button';
import { Icon } from './icon';

type AlertArgs = Alert & { message: string };

const meta: Meta<AlertArgs> = {
  title: 'Primitives/Alert',
  component: Alert,
  decorators: [moduleMetadata({ imports: [Alert, Button, Icon] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    message: { control: 'text' },
  },
  args: { tone: 'warning', message: 'Selecciona una escuela antes de importar.' },
  render: (args) => ({
    props: args,
    template: `<div uiAlert [tone]="tone" class="max-w-xl"><ui-icon name="info" /><span>{{ message }}</span></div>`,
  }),
};

export default meta;
type Story = StoryObj<AlertArgs>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-xl flex-col gap-3">
        <div uiAlert><ui-icon name="info" /><span>Las notas se publican al cerrar el periodo.</span></div>
        <div uiAlert tone="success"><ui-icon name="circle-check" /><span>Entrega completada.</span></div>
        <div uiAlert tone="warning"><ui-icon name="triangle-alert" /><span>No se pudo cargar la información de tu perfil.</span></div>
        <div uiAlert tone="danger">
          <ui-icon name="circle-alert" />
          <span>No se pudo cargar el boletín.</span>
          <button uiButton variant="ghost" size="sm" type="button">Reintentar</button>
        </div>
      </div>
    `,
  }),
};
