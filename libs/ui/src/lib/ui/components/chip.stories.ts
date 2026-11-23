import { signal } from '@angular/core';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { Chip, ChipCount } from './chip';

const meta: Meta<Chip> = {
  title: 'Primitives/Chip',
  component: Chip,
  decorators: [moduleMetadata({ imports: [Chip, ChipCount] })],
};

export default meta;
type Story = StoryObj<Chip>;

/** A filter row: one chip pressed at a time. */
export const FilterRow: Story = {
  render: () => {
    const chosen = signal('Todas');
    return {
      props: {
        chosen,
        chips: [
          { label: 'Todas', count: 8 },
          { label: 'Ciencias', count: 2 },
          { label: 'Idiomas', count: 2 },
          { label: 'Humanidades', count: 1 },
          { label: 'Otras', count: 3 },
        ],
      },
      template: `
        <div role="group" aria-label="Filtrar por área" class="flex flex-wrap gap-2">
          @for (chip of chips; track chip.label) {
            <button uiChip [pressed]="chosen() === chip.label" (click)="chosen.set(chip.label)">
              {{ chip.label }} <span uiChipCount>{{ chip.count }}</span>
            </button>
          }
        </div>
      `,
    };
  },
};
