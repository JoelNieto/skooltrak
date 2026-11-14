import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Button } from './button';
import { UiField, UiInput, UiSelect } from './field';

const meta: Meta<UiField> = {
  title: 'Primitives/Field',
  component: UiField,
  decorators: [moduleMetadata({ imports: [UiInput, UiSelect] })],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
  },
  args: { label: 'Nombre', hint: 'Como aparece en la cédula', error: '', required: false },
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm">
        <ui-field [label]="label" [hint]="hint" [error]="error" [required]="required">
          <input uiInput placeholder="Ana María" />
        </ui-field>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<UiField>;

export const Playground: Story = {};

export const Required: Story = { args: { required: true } };

export const WithError: Story = { args: { required: true, error: 'El nombre es obligatorio' } };

export const Select: Story = {
  render: () => ({
    template: `
      <div class="max-w-sm">
        <ui-field label="Género" hint="Opcional">
          <select uiSelect>
            <option value="">Seleccionar…</option>
            <option>Femenino</option>
            <option>Masculino</option>
          </select>
        </ui-field>
      </div>
    `,
  }),
};

export const Textarea: Story = {
  render: () => ({
    template: `
      <div class="max-w-sm">
        <ui-field label="Observaciones">
          <textarea uiInput rows="4" placeholder="Notas sobre el estudiante"></textarea>
        </ui-field>
      </div>
    `,
  }),
};

export const Form: Story = {
  render: () => ({
    template: `
      <form class="grid max-w-xl gap-4 sm:grid-cols-2">
        <ui-field label="Nombre" required><input uiInput /></ui-field>
        <ui-field label="Apellido" required><input uiInput /></ui-field>
        <ui-field label="Correo" error="Correo inválido"><input uiInput type="email" value="ana@" /></ui-field>
        <ui-field label="Grado">
          <select uiSelect><option>1° A</option><option>1° B</option></select>
        </ui-field>
        <div class="flex justify-end gap-2 sm:col-span-2">
          <button uiButton variant="ghost" type="button">Cancelar</button>
          <button uiButton variant="primary" type="submit">Guardar</button>
        </div>
      </form>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiInput, UiSelect, Button] })],
};
