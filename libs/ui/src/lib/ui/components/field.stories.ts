import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Button } from './button';
import { UiCheckbox, UiChoice, UiField, UiInput, UiRadio, UiSelect, UiToggle } from './field';

const meta: Meta<UiField> = {
  title: 'Primitives/Field',
  component: UiField,
  decorators: [moduleMetadata({ imports: [UiInput, UiSelect] })],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    optional: { control: 'boolean' },
  },
  args: { label: 'Nombre', hint: 'Como aparece en la cédula', error: '', required: false, optional: false },
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm">
        <ui-field [label]="label" [hint]="hint" [error]="error" [required]="required" [optional]="optional">
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

export const Optional: Story = { args: { label: 'Código', hint: 'Ej: MAT-101', optional: true } };

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
        <ui-field label="Código" optional><input uiInput placeholder="MAT-101" /></ui-field>
        <ui-field label="Grado">
          <select uiSelect><option>1° A</option><option>1° B</option></select>
        </ui-field>
        <ui-choice label="Enviar notificación a los acudientes" class="sm:col-span-2">
          <input type="checkbox" uiCheckbox checked />
        </ui-choice>
        <div class="flex justify-end gap-2 sm:col-span-2">
          <button uiButton variant="ghost" type="button">Cancelar</button>
          <button uiButton variant="primary" type="submit">Guardar</button>
        </div>
      </form>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiInput, UiSelect, UiChoice, UiCheckbox, Button] })],
};

/** `ui-choice`: control and label on one line, hint or error underneath. */
export const Choices: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-md flex-col gap-4">
        <ui-choice label="Publicada" hint="Los estudiantes verán la calificación">
          <input type="checkbox" uiCheckbox checked />
        </ui-choice>
        <ui-choice label="Acepto los términos" required error="Debes aceptar los términos">
          <input type="checkbox" uiCheckbox />
        </ui-choice>
        <ui-choice label="Permitir respuestas" hint="Si lo desactivas, las familias solo podrán leer el aviso.">
          <input type="checkbox" uiToggle checked />
        </ui-choice>
        <ui-choice label="Deshabilitado">
          <input type="checkbox" uiCheckbox disabled />
        </ui-choice>
      </div>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiChoice, UiCheckbox, UiToggle] })],
};

/** Choice controls without a wrapper, e.g. row selection in a table. `tone` is for values with meaning. */
export const ChoiceControls: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-5">
        <div class="flex items-center gap-4">
          <span class="w-24 text-sm text-ink-muted">Checkbox</span>
          <input type="checkbox" uiCheckbox checked aria-label="action" />
          <input type="checkbox" uiCheckbox tone="neutral" checked aria-label="neutral" />
          <input type="checkbox" uiCheckbox size="sm" checked aria-label="small" />
          <input type="checkbox" uiCheckbox aria-label="unchecked" />
        </div>
        <div class="flex items-center gap-4">
          <span class="w-24 text-sm text-ink-muted">Toggle</span>
          <input type="checkbox" uiToggle checked aria-label="on" />
          <input type="checkbox" uiToggle aria-label="off" />
          <input type="checkbox" uiToggle size="sm" checked aria-label="small" />
        </div>
        <div class="flex items-center gap-4">
          <span class="w-24 text-sm text-ink-muted">Radio (tones)</span>
          <input type="radio" uiRadio name="rating" tone="danger" checked aria-label="Deficiente" />
          <input type="radio" uiRadio name="rating-2" tone="warning" checked aria-label="Regular" />
          <input type="radio" uiRadio name="rating-3" tone="success" checked aria-label="Satisfactorio" />
          <input type="radio" uiRadio name="rating-4" checked aria-label="action" />
        </div>
      </div>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiCheckbox, UiToggle, UiRadio] })],
};

export const RadioGroup: Story = {
  render: () => ({
    template: `
      <fieldset class="flex flex-col gap-3">
        <legend class="mb-2 text-sm font-medium text-ink-strong">Tipo de evaluación</legend>
        <ui-choice label="Parcial"><input type="radio" uiRadio name="kind" value="partial" checked /></ui-choice>
        <ui-choice label="Final"><input type="radio" uiRadio name="kind" value="final" /></ui-choice>
        <ui-choice label="Recuperación" hint="Solo para estudiantes con nota menor a 3.0">
          <input type="radio" uiRadio name="kind" value="makeup" />
        </ui-choice>
      </fieldset>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiChoice, UiRadio] })],
};
