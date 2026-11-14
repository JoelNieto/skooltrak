import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { ComboboxOption, UiCombobox } from './combobox';
import { UiField } from './field';

const SUBJECTS: ComboboxOption[] = [
  'Artística',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Educación Física',
  'Español',
  'Inglés',
  'Matemáticas',
  'Música',
  'Religión',
  'Tecnología',
].map((label) => ({ value: label.toLowerCase().replace(/\s+/g, '-'), label }));

/** Story host: keeps the value and adds created options, as an app wrapper would. */
@Component({
  selector: 'ui-combobox-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCombobox, UiField],
  template: `
    <div class="flex max-w-sm flex-col gap-3 pb-64">
      <ui-field label="Asignatura" hint="Escribe para filtrar; sin tildes también funciona">
        <ui-combobox
          [(value)]="value"
          [options]="options()"
          [creatable]="creatable"
          createLabel="Crear asignatura"
          placeholder="Buscar o crear asignatura…"
          (create)="create($event)"
        />
      </ui-field>
      <p class="text-sm text-ink-muted">value: <code>{{ value() || "''" }}</code></p>
    </div>
  `,
})
class ComboboxDemo {
  creatable = true;
  readonly value = signal('');
  readonly options = signal(SUBJECTS);

  create(label: string) {
    const option = { value: `new-${label.toLowerCase()}`, label };
    this.options.update((list) => [...list, option].sort((a, b) => a.label.localeCompare(b.label)));
    this.value.set(option.value);
  }
}

const meta: Meta<UiCombobox> = {
  title: 'Primitives/Combobox',
  component: UiCombobox,
  decorators: [moduleMetadata({ imports: [UiField, ComboboxDemo] })],
  parameters: {
    docs: {
      description: {
        component: [
          'Searchable single-select over a list of `{ value, label }` options; the value is the option `value`.',
          'Works with `[formField]` (signal forms), `[(value)]`, and inside `ui-field`.',
          'With `creatable`, a "Crear «texto»" row appears when nothing matches; handle `(create)` and set the value',
          'to the new option. For a short, fixed list (≤ ~7 options) use `uiSelect` instead.',
        ].join('\n'),
      },
    },
  },
  args: { options: SUBJECTS, placeholder: 'Buscar asignatura…', disabled: false },
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm pb-64">
        <ui-field label="Asignatura">
          <ui-combobox [options]="options" [placeholder]="placeholder" [disabled]="disabled" />
        </ui-field>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<UiCombobox>;

export const Playground: Story = {};

export const Selected: Story = {
  render: () => ({
    props: { options: SUBJECTS },
    template: `
      <div class="max-w-sm pb-64">
        <ui-field label="Asignatura"><ui-combobox [options]="options" value="matemáticas" /></ui-field>
      </div>
    `,
  }),
};

export const Creatable: Story = {
  render: () => ({ template: `<ui-combobox-demo />` }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 'Robótica');
    const create = await within(document.body).findByRole('option', { name: /Crear asignatura «Robótica»/ });
    await userEvent.click(create);
    await expect(input).toHaveValue('Robótica');
  },
};

export const WithError: Story = {
  render: () => ({
    props: { options: SUBJECTS },
    template: `
      <div class="max-w-sm pb-64">
        <ui-field label="Asignatura" error="Asignatura requerida">
          <ui-combobox [options]="options" />
        </ui-field>
      </div>
    `,
  }),
};

export const Disabled: Story = { args: { disabled: true } };
