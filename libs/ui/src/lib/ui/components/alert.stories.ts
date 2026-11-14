import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Alert } from './alert';
import { Button } from './button';

type AlertArgs = Alert & { message: string };

const meta: Meta<AlertArgs> = {
  title: 'Primitives/Alert',
  component: Alert,
  decorators: [moduleMetadata({ imports: [Alert, Button] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    message: { control: 'text' },
  },
  args: { tone: 'warning', message: 'Selecciona una escuela antes de importar.' },
  render: (args) => ({
    props: args,
    template: `<div uiAlert [tone]="tone" class="max-w-xl"><span class="material-symbols-outlined">info</span><span>{{ message }}</span></div>`,
  }),
};

export default meta;
type Story = StoryObj<AlertArgs>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-xl flex-col gap-3">
        <div uiAlert><span class="material-symbols-outlined">info</span><span>Las notas se publican al cerrar el periodo.</span></div>
        <div uiAlert tone="success"><span class="material-symbols-outlined">check_circle</span><span>Entrega completada.</span></div>
        <div uiAlert tone="warning"><span class="material-symbols-outlined">warning</span><span>No se pudo cargar la información de tu perfil.</span></div>
        <div uiAlert tone="danger">
          <span class="material-symbols-outlined">error</span>
          <span>No se pudo cargar el boletín.</span>
          <button uiButton variant="ghost" size="sm" type="button">Reintentar</button>
        </div>
      </div>
    `,
  }),
};
