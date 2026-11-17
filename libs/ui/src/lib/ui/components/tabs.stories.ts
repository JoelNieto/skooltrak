import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { Badge } from './badge';
import { Card, CardBody } from './card';
import { UiTab, UiTabContent, UiTabList, UiTabListVariant, UiTabPanel, UiTabs } from './tabs';

type TabsArgs = { variant: UiTabListVariant; selectionMode: 'follow' | 'explicit' };

const meta: Meta<TabsArgs> = {
  title: 'Primitives/Tabs',
  component: UiTabList,
  decorators: [
    moduleMetadata({ imports: [UiTabs, UiTabList, UiTab, UiTabPanel, UiTabContent, Badge, Card, CardBody] }),
  ],
  argTypes: {
    variant: { control: 'inline-radio', options: ['box', 'line'] },
    selectionMode: { control: 'inline-radio', options: ['follow', 'explicit'] },
  },
  args: { variant: 'box', selectionMode: 'follow' },
  render: (args) => ({
    props: { ...args, tab: 'grades' },
    template: `
      <div uiTabs class="flex max-w-2xl flex-col gap-4">
        <div uiTabList [(selectedTab)]="tab" [variant]="variant" [selectionMode]="selectionMode" aria-label="Secciones del curso">
          <button uiTab value="grades">Calificaciones</button>
          <button uiTab value="attendance">Asistencia</button>
          <button uiTab value="files">Archivos <span uiBadge size="sm">3</span></button>
          <button uiTab value="weights" disabled>Ponderación</button>
        </div>
        <div uiTabPanel value="grades">
          <ng-template uiTabContent>
            <div uiCard><div uiCardBody><p class="text-ink">Promedio del curso: 4.2</p></div></div>
          </ng-template>
        </div>
        <div uiTabPanel value="attendance">
          <ng-template uiTabContent>
            <div uiCard><div uiCardBody><p class="text-ink">Asistencia de la semana: 96 %</p></div></div>
          </ng-template>
        </div>
        <div uiTabPanel value="files">
          <ng-template uiTabContent>
            <div uiCard><div uiCardBody><p class="text-ink">Guía de lectura.pdf · Rúbrica.docx · Mapa.png</p></div></div>
          </ng-template>
        </div>
        <div uiTabPanel value="weights">
          <ng-template uiTabContent><p>Ponderación</p></ng-template>
        </div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TabsArgs>;

/** Pill segmented control: a page's few main sections. */
export const Box: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: /Archivos/ }));
    await expect(canvas.getByRole('tab', { name: /Archivos/ })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(/Guía de lectura/)).toBeVisible();
  },
};

/** Underline: longer rows of tabs, or tabs inside a card. */
export const Line: Story = { args: { variant: 'line' } };
