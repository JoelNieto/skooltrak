import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiCheckbox, UiChoice, UiField, UiSelect } from './field';
import { UiFilterMenu } from './filter-menu';

type FilterMenuArgs = UiFilterMenu & { activeCount: number };

const meta: Meta<FilterMenuArgs> = {
  title: 'Primitives/Filter menu',
  component: UiFilterMenu,
  decorators: [moduleMetadata({ imports: [UiFilterMenu, UiChoice, UiCheckbox, UiField, UiSelect] })],
  argTypes: { activeCount: { control: { type: 'number', min: 0 } } },
  args: { activeCount: 2 },
  render: (args) => ({
    props: { ...args, open: signal(true) },
    template: `
      <div class="min-h-[28rem]">
        <ui-filter-menu [activeCount]="activeCount" [(open)]="open">
          <fieldset>
            <legend>Grupo</legend>
            <ui-choice label="7° A"><input type="checkbox" uiCheckbox checked /></ui-choice>
            <ui-choice label="7° B"><input type="checkbox" uiCheckbox /></ui-choice>
            <ui-choice label="7° C"><input type="checkbox" uiCheckbox checked /></ui-choice>
          </fieldset>
          <ui-field label="Periodo">
            <select uiSelect><option>Trimestre II</option><option>Trimestre I</option></select>
          </ui-field>
        </ui-filter-menu>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<FilterMenuArgs>;

/** Open, with two filters on: the count shows on the button; Limpiar resets, Listo closes. */
export const Open: Story = {};

/** Closed, nothing filtered: a plain button. */
export const Idle: Story = {
  args: { activeCount: 0 },
  render: (args) => ({
    props: args,
    template: `<ui-filter-menu [activeCount]="activeCount"><p class="text-sm">Filtros…</p></ui-filter-menu>`,
  }),
};
