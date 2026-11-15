import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ChartPlaceholder } from './chart-placeholder';

const meta: Meta<ChartPlaceholder> = {
  title: 'Primitives/Chart placeholder',
  component: ChartPlaceholder,
  decorators: [moduleMetadata({ imports: [ChartPlaceholder] })],
  argTypes: {
    shape: { control: 'inline-radio', options: ['bars', 'line'] },
    kind: { control: 'text' },
    description: { control: 'text' },
    source: { control: 'text' },
  },
  args: {
    shape: 'bars',
    kind: 'Histograma',
    description: 'Notas por rango en la escala del plan de estudio, con líneas en aprobación y excelencia',
    source: 'student_grades / grade_metrics',
  },
  render: (args) => ({
    props: args,
    template: `<ui-chart-placeholder class="max-w-2xl" [kind]="kind" [description]="description" [source]="source" [shape]="shape" />`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Holds the place of a chart that will be built later (HOM-001 FR .4). Never shows data; announced as a single image.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ChartPlaceholder>;

export const Playground: Story = {};

export const Line: Story = {
  args: {
    shape: 'line',
    kind: 'Línea',
    description: 'Promedio por trimestre del estudiante frente a su grupo',
    source: 'grade-report',
  },
};
